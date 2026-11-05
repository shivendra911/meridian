import threading
from datetime import timedelta

import pytest
from pymongo.errors import WriteError

from operations import applications, integrity, interviews, placements
from operations.common import utcnow
from operations.errors import PlaceFlowError, VacancyExhausted


def test_validator_rejects_bad_cgpa(db):
    with pytest.raises(WriteError) as exc:
        db.students.insert_one({
            "student_id": "STU999", "name": "Bad Cgpa", "email": "bad@univ.edu", "department": "CSE",
            "year": 4, "cgpa": 11, "backlogs": 0, "placement_status": "Unplaced", "created_at": utcnow()})
    assert exc.value.code == 121


def test_duplicate_application_is_blocked(db):
    applications.apply_for_job(db, "STU003", "JOB005")
    with pytest.raises(PlaceFlowError, match="already applied"):
        applications.apply_for_job(db, "STU003", "JOB005")
    assert db.applications.count_documents({"student_id": "STU003", "job_id": "JOB005"}) == 1


def test_ineligible_cgpa_names_the_reason(db):
    with pytest.raises(PlaceFlowError, match="CGPA"):
        applications.apply_for_job(db, "STU005", "JOB004")


def test_tier_policy(db):
    with pytest.raises(PlaceFlowError, match="higher tier"):
        applications.apply_for_job(db, "STU006", "JOB005")      # placed in Normal, job is Normal
    assert applications.apply_for_job(db, "STU006", "JOB002")   # Dream is an upgrade


def test_interview_clash(db):
    existing = db.interviews.find_one({"interview_id": "INT001"})
    with pytest.raises(PlaceFlowError, match="Clashes"):
        interviews.schedule_interview(db, "APP002", "HR", existing["scheduled_start"] + timedelta(minutes=15),
                                      existing["scheduled_end"] + timedelta(minutes=15), "Online")


def test_delete_student_with_applications_is_blocked(db):
    with pytest.raises(PlaceFlowError, match="refer to it"):
        integrity.safe_delete(db, "students", "STU001")


def test_finalize_changes_everything_together(db):
    placement_id = placements.finalize_placement(db, "STU001", "JOB002")
    assert db.placements.count_documents({"placement_id": placement_id}) == 1
    assert db.applications.find_one({"application_id": "APP002"})["status"] == "Selected"
    assert db.jobs.find_one({"job_id": "JOB002"})["filled"] == 1
    student = db.students.find_one({"student_id": "STU001"})
    assert (student["placement_status"], student["highest_tier"]) == ("Placed", "Dream")
    assert integrity.consistency_issues(db) == []


def test_full_job_rolls_back(db):
    db.jobs.update_one({"job_id": "JOB002"}, {"$set": {"vacancies": 1, "filled": 1}})
    with pytest.raises(VacancyExhausted):
        placements.finalize_placement(db, "STU001", "JOB002")
    assert db.placements.count_documents({"student_id": "STU001"}) == 0
    assert db.applications.find_one({"application_id": "APP002"})["status"] == "Shortlisted"


def test_concurrent_last_seat(db):
    db.jobs.update_one({"job_id": "JOB002"}, {"$set": {"vacancies": 1}})
    barrier, results = threading.Barrier(2), []

    def attempt(student_id):
        barrier.wait()
        try:
            results.append(("ok", placements.finalize_placement(db, student_id, "JOB002")))
        except Exception as exc:
            results.append(("err", exc))

    threads = [threading.Thread(target=attempt, args=(s,)) for s in ("STU001", "STU004")]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert sorted(kind for kind, _ in results) == ["err", "ok"]
    assert any(isinstance(v, VacancyExhausted) for kind, v in results if kind == "err")
    assert db.placements.count_documents({"job_id": "JOB002"}) == 1
    assert db.jobs.find_one({"job_id": "JOB002"})["filled"] == 1


def test_audit_finds_orphans_because_mongodb_has_no_foreign_keys(db):
    db.applications.insert_one({
        "application_id": "APP777", "student_id": "STU777", "job_id": "JOB001", "application_date": utcnow(),
        "status": "Applied", "status_history": [{"status": "Applied", "at": utcnow()}]})
    assert any("STU777" in issue for issue in integrity.consistency_issues(db))

