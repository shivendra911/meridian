from pymongo.read_concern import ReadConcern
from pymongo.write_concern import WriteConcern

from .common import TIER_RANK, log_event, utcnow
from .errors import PlaceFlowError, VacancyExhausted
from .ids import next_id


def finalize_placement(db, student_id, job_id):
    """Atomic: placement + application + job seat + student, or nothing at all."""

    def txn(session):
        student = db.students.find_one({"student_id": student_id}, session=session)
        job = db.jobs.find_one({"job_id": job_id}, session=session)
        if not student:
            raise PlaceFlowError(f"Student {student_id} does not exist")
        if not job:
            raise PlaceFlowError(f"Job {job_id} does not exist")
        app = db.applications.find_one({"student_id": student_id, "job_id": job_id}, session=session)
        if not app or app["status"] != "Shortlisted":
            raise PlaceFlowError("Only a Shortlisted application can be finalized")
        if student["placement_status"] == "Placed" and TIER_RANK[job["tier"]] <= TIER_RANK[student["highest_tier"]]:
            raise PlaceFlowError(f'Already placed in {student["highest_tier"]}; a higher tier is required')

        # Claim a seat. The filter makes this safe under concurrency: if another
        # transaction took the last seat, nothing matches and we abort.
        claimed = db.jobs.update_one(
            {"job_id": job_id, "status": "Open", "$expr": {"$lt": ["$filled", "$vacancies"]}},
            [{"$set": {
                "filled": {"$add": ["$filled", 1]},
                "status": {"$cond": [{"$gte": [{"$add": ["$filled", 1]}, "$vacancies"]},
                                     "Closed", "$status"]}}}],
            session=session)
        if claimed.matched_count == 0:
            raise VacancyExhausted(f"No vacancy left for {job_id}")

        now = utcnow()
        placement_id = next_id(db, "placements", session)
        db.placements.insert_one({
            "placement_id": placement_id, "student_id": student_id, "company_id": job["company_id"],
            "job_id": job_id, "package_lpa": job["package_lpa"], "placement_date": now,
            "status": "Placed"}, session=session)
        db.applications.update_one(
            {"application_id": app["application_id"]},
            {"$set": {"status": "Selected"},
             "$push": {"status_history": {"status": "Selected", "at": now}}}, session=session)
        db.students.update_one(
            {"student_id": student_id},
            {"$set": {"placement_status": "Placed", "highest_tier": job["tier"]}}, session=session)
        return placement_id, f'{student["name"]} placed as {job["title"]}'

    with db.client.start_session() as session:
        # with_transaction retries automatically on TransientTransactionError
        placement_id, message = session.with_transaction(
            txn, read_concern=ReadConcern("snapshot"), write_concern=WriteConcern("majority"))
    log_event(db, "PLACED", placement_id, message)  # outside the transaction: capped collections can't be written inside one
    return placement_id

