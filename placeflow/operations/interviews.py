from .common import log_event
from .errors import PlaceFlowError
from .ids import next_id


def schedule_interview(db, application_id, round_name, start, end, mode, venue=None):
    """BR-07: existing, Shortlisted application only; no overlap with the student's other interviews."""
    if end <= start:
        raise PlaceFlowError("An interview must end after it starts")
    app = db.applications.find_one({"application_id": application_id})
    if not app:
        raise PlaceFlowError(f"Application {application_id} does not exist")
    if app["status"] != "Shortlisted":
        raise PlaceFlowError("Only Shortlisted applications can be scheduled for interview")
    clash = db.interviews.find_one({
        "student_id": app["student_id"], "result": "Scheduled",
        "scheduled_start": {"$lt": end}, "scheduled_end": {"$gt": start}})
    if clash:
        raise PlaceFlowError(f'Clashes with {clash["interview_id"]} ({clash["round"]})')
    doc = {"interview_id": next_id(db, "interviews"), "application_id": application_id,
           "student_id": app["student_id"], "round": round_name, "scheduled_start": start,
           "scheduled_end": end, "mode": mode, "result": "Scheduled"}
    if venue:
        doc["venue"] = venue
    db.interviews.insert_one(doc)
    log_event(db, "INTERVIEW_SCHEDULED", doc["interview_id"], f'{app["student_id"]}: {round_name} round')
    return doc["interview_id"]

