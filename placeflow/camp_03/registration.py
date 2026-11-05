"""Course Registration & High-Throughput Enrollment Engine for CAMP-03.

Manages term course delivery offerings, time-window gating, prerequisite validation,
concurrency-safe atomic seat reservation, and attempt history preservation.
"""

from datetime import datetime, timezone
import uuid
from typing import Dict, Any, List, Optional, Set
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from camp_03.courses import get_course_version
from camp_03.calendars import get_academic_term, is_registration_window_open
from camp_03.prerequisites import check_prerequisite_satisfaction


class RegistrationWindowClosedError(Exception):
    pass


class CourseCapacityFullError(Exception):
    pass


class PrerequisiteNotMetError(Exception):
    pass


class DuplicateRegistrationError(Exception):
    pass


class RegistrationValidationError(Exception):
    pass


def publish_course_offering(
    db: Database,
    course_version_id: str,
    term_id: str,
    campus_id: str,
    capacity: int = 60,
    status: str = "OPEN",
    metadata: Optional[Dict[str, Any]] = None,
    offering_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Publish a course offering instance for delivery in an academic term."""
    cv = get_course_version(db, course_version_id)
    term = get_academic_term(db, term_id)

    if capacity <= 0:
        raise RegistrationValidationError("Capacity must be greater than zero")

    now = datetime.now(timezone.utc)
    o_id = offering_id or f"tco_{uuid.uuid4().hex[:12]}"

    doc = {
        "offering_id": o_id,
        "tenant_id": cv["tenant_id"],
        "institution_id": cv["institution_id"],
        "course_version_id": course_version_id,
        "course_id": cv["course_id"],
        "term_id": term_id,
        "campus_id": campus_id,
        "capacity": int(capacity),
        "enrolled_seats": 0,
        "status": status,
        "metadata": metadata or {},
        "created_at": now,
        "updated_at": now,
    }

    try:
        db.term_course_offerings.insert_one(doc)
    except DuplicateKeyError as e:
        raise DuplicateRegistrationError(
            f"Course '{cv['course_id']}' is already offered in term '{term_id}' on campus '{campus_id}'"
        ) from e

    return doc


def get_course_offering(db: Database, offering_id: str) -> Dict[str, Any]:
    """Retrieve term course offering by ID."""
    doc = db.term_course_offerings.find_one({"offering_id": offering_id})
    if not doc:
        raise RegistrationValidationError(f"Course offering '{offering_id}' not found")
    return doc


def register_student_for_course(
    db: Database,
    enrollment_id: str,
    offering_id: str,
    registration_type: str = "REGULAR_CREDIT",
    enforce_window: bool = True,
    registration_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Enroll a student into a term course offering with atomic capacity checks and prerequisite gating."""
    enr = db.student_program_enrollments.find_one({"enrollment_id": enrollment_id})
    if not enr:
        raise RegistrationValidationError(f"Enrollment '{enrollment_id}' not found")

    offering = get_course_offering(db, offering_id)
    term_id = offering["term_id"]
    course_id = offering["course_id"]

    # 1. Gating: Registration Window
    if enforce_window:
        if not is_registration_window_open(db, term_id):
            raise RegistrationWindowClosedError(
                f"Registration window for term '{term_id}' is currently closed"
            )

    # 2. Collect student's historical results for prerequisite checking
    previous_registrations = list(
        db.course_registrations.find(
            {"enrollment_id": enrollment_id, "registration_status": "COMPLETED"}
        )
    )
    completed_grades: Dict[str, float] = {
        r["course_id"]: r["grade_point"]
        for r in previous_registrations
        if r.get("grade_point") is not None and r["grade_point"] >= 4.0
    }
    attempted_courses: Set[str] = {r["course_id"] for r in previous_registrations}

    # Concurrent courses registered in same term
    concurrent_reg = db.course_registrations.find(
        {"enrollment_id": enrollment_id, "term_id": term_id, "registration_status": "REGISTERED"}
    )
    concurrent_ids: Set[str] = {r["course_id"] for r in concurrent_reg}

    # 3. Gating: Prerequisite DAG satisfaction
    readiness = check_prerequisite_satisfaction(
        db=db,
        completed_course_grades=completed_grades,
        attempted_course_ids=attempted_courses,
        concurrent_registered_course_ids=concurrent_ids,
        target_course_id=course_id,
    )
    if not readiness["is_satisfied"]:
        raise PrerequisiteNotMetError(
            f"Student prerequisites not satisfied for course '{course_id}': {readiness}"
        )

    # 4. Atomic Seat Reservation (Flash Crowd Protection)
    res = db.term_course_offerings.update_one(
        {
            "offering_id": offering_id,
            "status": {"$in": ["OPEN", "ACTIVE"]},
            "$expr": {"$lt": ["$enrolled_seats", "$capacity"]},
        },
        {"$inc": {"enrolled_seats": 1}, "$set": {"updated_at": datetime.now(timezone.utc)}},
    )
    if res.modified_count == 0:
        raise CourseCapacityFullError(
            f"Course offering '{offering_id}' has reached its maximum seat capacity ({offering['capacity']})"
        )

    # 5. Attempt History Preservation
    prior_attempts = list(
        db.course_registrations.find({"enrollment_id": enrollment_id, "course_id": course_id})
    )
    attempt_num = len(prior_attempts) + 1
    reg_type = registration_type
    if attempt_num > 1 and registration_type == "REGULAR_CREDIT":
        reg_type = "BACKLOG_REPEAT"

    now = datetime.now(timezone.utc)
    r_id = registration_id or f"creg_{uuid.uuid4().hex[:12]}"

    doc = {
        "registration_id": r_id,
        "enrollment_id": enrollment_id,
        "offering_id": offering_id,
        "course_id": course_id,
        "term_id": term_id,
        "attempt_number": int(attempt_num),
        "registration_type": reg_type,
        "registration_status": "REGISTERED",
        "final_grade": None,
        "grade_point": None,
        "credits_earned": None,
        "registered_at": now,
        "dropped_at": None,
    }

    try:
        db.course_registrations.insert_one(doc)
    except DuplicateKeyError as e:
        # Revert seat reservation
        db.term_course_offerings.update_one(
            {"offering_id": offering_id}, {"$inc": {"enrolled_seats": -1}}
        )
        raise DuplicateRegistrationError(
            f"Duplicate registration attempt #{attempt_num} for enrollment '{enrollment_id}'"
        ) from e

    try:
        from camp_01.outbox import publish_event
        publish_event(
            event_type="CourseRegistrationConfirmed",
            aggregate_type="COURSE_REGISTRATION",
            aggregate_id=r_id,
            tenant_id=offering.get("tenant_id", "global"),
            payload={
                "enrollment_id": enrollment_id,
                "course_id": course_id,
                "offering_id": offering_id,
                "term_id": term_id,
                "attempt_number": attempt_num,
                "registration_type": reg_type,
            },
            db=db,
        )
    except Exception:
        pass

    return doc


def drop_course_registration(db: Database, registration_id: str) -> Dict[str, Any]:
    """Drop a registered course and atomically release the reserved seat."""
    reg = db.course_registrations.find_one({"registration_id": registration_id})
    if not reg:
        raise RegistrationValidationError(f"Registration '{registration_id}' not found")

    if reg["registration_status"] == "DROPPED":
        return reg

    now = datetime.now(timezone.utc)
    res = db.course_registrations.find_one_and_update(
        {"registration_id": registration_id},
        {"$set": {"registration_status": "DROPPED", "dropped_at": now}},
        return_document=True,
    )

    # Release seat in offering
    db.term_course_offerings.update_one(
        {"offering_id": reg["offering_id"]},
        {"$inc": {"enrolled_seats": -1}, "$set": {"updated_at": now}},
    )
    return res

