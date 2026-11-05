from .common import utcnow
from .errors import PlaceFlowError
from .ids import insert_with_id

EDITABLE = {"name", "phone", "department", "year", "cgpa", "backlogs", "skills"}


def add_student(db, data):
    doc = {"placement_status": "Unplaced", "skills": [], "created_at": utcnow(), **data}
    return insert_with_id(db, "students", doc)


def get_student(db, student_id):
    doc = db.students.find_one({"student_id": student_id})
    if not doc:
        raise PlaceFlowError(f"Student {student_id} does not exist")
    return doc


def update_student(db, student_id, changes):
    bad = set(changes) - EDITABLE
    if bad:
        raise PlaceFlowError("Cannot edit: " + ", ".join(sorted(bad)))
    if db.students.update_one({"student_id": student_id}, {"$set": changes}).matched_count == 0:
        raise PlaceFlowError(f"Student {student_id} does not exist")

