from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from .common import TIER_RANK, log_event, utcnow
from .errors import PlaceFlowError
from .ids import next_id


def check_eligibility(student, job, now=None):
    """Raise PlaceFlowError stating the specific reason. Shared by apply, the bulk seeder and tests."""
    now = now or utcnow()
    if job["status"] != "Open":
        raise PlaceFlowError(f'{job["job_id"]} is closed')
    if job["deadline"] <= now:
        raise PlaceFlowError(f'The deadline for {job["job_id"]} has passed')
    if job["filled"] >= job["vacancies"]:
        raise PlaceFlowError(f'All vacancies for {job["job_id"]} are filled')
    rule = job["eligibility"]
    if student["cgpa"] < rule["min_cgpa"]:
        raise PlaceFlowError(f'CGPA {student["cgpa"]} is below the minimum {rule["min_cgpa"]}')
    if student["backlogs"] > rule["max_backlogs"]:
        raise PlaceFlowError(f'{student["backlogs"]} backlog(s) exceed the allowed {rule["max_backlogs"]}')
    if student["department"] not in rule["departments"]:
        raise PlaceFlowError(f'{student["department"]} is not an eligible department')
    if student["placement_status"] == "Placed" and TIER_RANK[job["tier"]] <= TIER_RANK[student["highest_tier"]]:
        raise PlaceFlowError(f'Already placed in {student["highest_tier"]}; may only apply to a higher tier')


def allowed_tiers(student):
    floor = TIER_RANK.get(student.get("highest_tier"), 0)
    return [tier for tier, rank in TIER_RANK.items() if rank > floor]


def apply_for_job(db, student_id, job_id):
    student = db.students.find_one({"student_id": student_id})
    job = db.jobs.find_one({"job_id": job_id})
    if not student:
        raise PlaceFlowError(f"Student {student_id} does not exist")
    if not job:
        raise PlaceFlowError(f"Job {job_id} does not exist")
    check_eligibility(student, job)
    now = utcnow()
    doc = {"application_id": next_id(db, "applications"), "student_id": student_id,
           "job_id": job_id, "application_date": now, "status": "Applied",
           "status_history": [{"status": "Applied", "at": now}]}
    try:
        db.applications.insert_one(doc)
    except DuplicateKeyError:  # the unique (student_id, job_id) index fired
        raise PlaceFlowError(f"{student_id} has already applied to {job_id}") from None
    log_event(db, "APPLIED", doc["application_id"], f'{student["name"]} applied to {job["title"]}')
    return doc["application_id"]


def eligible_jobs(db, student):
    applied = db.applications.distinct("job_id", {"student_id": student["student_id"]})
    return list(db.jobs.find({
        "status": "Open",
        "deadline": {"$gt": utcnow()},
        "eligibility.min_cgpa": {"$lte": student["cgpa"]},
        "eligibility.max_backlogs": {"$gte": student["backlogs"]},
        "eligibility.departments": student["department"],
        "tier": {"$in": allowed_tiers(student)},
        "job_id": {"$nin": applied},
        "$expr": {"$lt": ["$filled", "$vacancies"]},
    }, {"_id": 0}).sort("package_lpa", -1))


def eligible_candidates(db, job):
    rule = job["eligibility"]
    applied = db.applications.distinct("student_id", {"job_id": job["job_id"]})
    lower = [tier for tier, rank in TIER_RANK.items() if rank < TIER_RANK[job["tier"]]]
    return list(db.students.find({
        "department": {"$in": rule["departments"]},
        "cgpa": {"$gte": rule["min_cgpa"]},
        "backlogs": {"$lte": rule["max_backlogs"]},
        "student_id": {"$nin": applied},
        "$or": [{"placement_status": "Unplaced"}, {"highest_tier": {"$in": lower}}],
    }, {"_id": 0, "student_id": 1, "name": 1, "department": 1, "cgpa": 1}).sort("cgpa", -1))


def update_status(db, application_id, new_status, note=None):
    """Move an application through its pipeline and record the change in status_history."""
    if new_status == "Selected":
        raise PlaceFlowError("Use Finalize Placement to select a student")
    if new_status not in ("Applied", "Shortlisted", "Rejected"):
        raise PlaceFlowError(f"Unknown status {new_status}")
    entry = {"status": new_status, "at": utcnow()}
    if note:
        entry["note"] = note
    app = db.applications.find_one_and_update(
        {"application_id": application_id, "status": {"$ne": "Selected"}},
        {"$set": {"status": new_status},
         "$push": {"status_history": {"$each": [entry], "$slice": -20}}},
        return_document=ReturnDocument.AFTER)
    if app is None:
        raise PlaceFlowError("Application not found, or already Selected")
    log_event(db, new_status.upper(), application_id, f"{application_id} moved to {new_status}")
    return app

