"""Student Academic Identity & Enrollment Service for CAMP-03.

Decouples Person (CAMP-02) and Institutional Membership from StudentRecord,
manages cohort batches, multi-enrollments, and the student academic lifecycle.
"""

from datetime import datetime, timezone
import uuid
from typing import Dict, Any, List, Optional
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from camp_03.offerings import get_program_offering


class StudentNotFoundError(Exception):
    pass


class DuplicateStudentError(Exception):
    pass


class EnrollmentNotFoundError(Exception):
    pass


class StudentValidationError(Exception):
    pass


STUDENT_STATUSES = {
    "APPLICANT",
    "ADMITTED",
    "ENROLLED",
    "ACTIVE",
    "ON_LEAVE",
    "SUSPENDED",
    "ACADEMICALLY_RESTRICTED",
    "COMPLETED",
    "GRADUATED",
    "WITHDRAWN",
    "TRANSFERRED",
    "TERMINATED",
}

ENROLLMENT_STATUS_TRANSITIONS = {
    "ENROLLED": {"ACTIVE", "WITHDRAWN"},
    "ACTIVE": {"ON_LEAVE", "PROBATION", "SUSPENDED", "COMPLETED", "WITHDRAWN"},
    "ON_LEAVE": {"ACTIVE", "WITHDRAWN"},
    "PROBATION": {"ACTIVE", "SUSPENDED", "COMPLETED", "WITHDRAWN"},
    "SUSPENDED": {"ACTIVE", "WITHDRAWN"},
    "COMPLETED": {"GRADUATED"},  # Completed vs Graduated distinction!
    "GRADUATED": set(),
    "WITHDRAWN": {"ENROLLED"},  # Readmission path
}


def create_student_record(
    db: Database,
    tenant_id: str,
    institution_id: str,
    person_id: str,
    membership_id: str,
    registration_number: str,
    roll_number: str,
    admission_number: Optional[str] = None,
    admission_date: Optional[datetime] = None,
    student_status: str = "ACTIVE",
    metadata: Optional[Dict[str, Any]] = None,
    student_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Create an institutional student record bound to a person identity and membership."""
    reg_clean = registration_number.strip().upper()
    roll_clean = roll_number.strip().upper()

    if student_status not in STUDENT_STATUSES:
        raise StudentValidationError(f"Invalid student_status: {student_status}")

    now = datetime.now(timezone.utc)
    s_id = student_id or f"stu_{uuid.uuid4().hex[:12]}"

    doc = {
        "student_id": s_id,
        "tenant_id": tenant_id,
        "institution_id": institution_id,
        "person_id": person_id,
        "membership_id": membership_id,
        "registration_number": reg_clean,
        "roll_number": roll_clean,
        "admission_number": (admission_number or reg_clean).strip(),
        "admission_date": admission_date or now,
        "student_status": student_status,
        "metadata": metadata or {},
        "created_at": now,
        "updated_at": now,
    }

    try:
        db.student_records.insert_one(doc)
    except DuplicateKeyError as e:
        raise DuplicateStudentError(
            f"Registration number '{reg_clean}' already exists in institution '{institution_id}'"
        ) from e

    # Record standard identifiers in student_identifiers catalogue
    add_student_identifier(db, s_id, "REGISTRATION_NUMBER", reg_clean, "INSTITUTION_VERIFIED")
    add_student_identifier(db, s_id, "ROLL_NUMBER", roll_clean, "INSTITUTION_VERIFIED")

    return doc


def get_student_record(db: Database, student_id: str) -> Dict[str, Any]:
    """Retrieve student record by ID."""
    doc = db.student_records.find_one({"student_id": student_id})
    if not doc:
        raise StudentNotFoundError(f"Student record '{student_id}' not found")
    return doc


def add_student_identifier(
    db: Database,
    student_id: str,
    scheme: str,
    value: str,
    verification_status: str = "INSTITUTION_VERIFIED",
) -> Dict[str, Any]:
    """Add a typed external or internal identifier to the student's identification catalog."""
    valid_schemes = {
        "ROLL_NUMBER",
        "REGISTRATION_NUMBER",
        "APAAR_ID",
        "ABC_ACCOUNT_ID",
        "EXAM_SEAT_NUMBER",
        "LEGACY_ERP_ID",
    }
    if scheme not in valid_schemes:
        raise StudentValidationError(f"Invalid identifier scheme: {scheme}")

    now = datetime.now(timezone.utc)
    doc = {
        "identifier_id": f"ident_{uuid.uuid4().hex[:12]}",
        "student_id": student_id,
        "scheme": scheme,
        "value": value.strip(),
        "verification_status": verification_status,
        "created_at": now,
    }

    try:
        db.student_identifiers.insert_one(doc)
    except DuplicateKeyError:
        db.student_identifiers.update_one(
            {"student_id": student_id, "scheme": scheme},
            {"$set": {"value": value.strip(), "verification_status": verification_status}},
        )
    return doc


def create_cohort_batch(
    db: Database,
    program_offering_id: str,
    cohort_code: str,
    matriculation_year: int,
    nominal_graduation_year: int,
    cohort_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Define a student matriculating cohort batch."""
    offering = get_program_offering(db, program_offering_id)

    if nominal_graduation_year <= matriculation_year:
        raise StudentValidationError("nominal_graduation_year must be after matriculation_year")

    now = datetime.now(timezone.utc)
    c_id = cohort_id or f"cohort_{uuid.uuid4().hex[:12]}"

    doc = {
        "cohort_id": c_id,
        "tenant_id": offering["tenant_id"],
        "institution_id": offering["institution_id"],
        "program_offering_id": program_offering_id,
        "cohort_code": cohort_code.strip().upper(),
        "matriculation_year": int(matriculation_year),
        "nominal_graduation_year": int(nominal_graduation_year),
        "active_students_count": 0,
        "created_at": now,
    }

    try:
        db.cohort_batches.insert_one(doc)
    except DuplicateKeyError as e:
        raise DuplicateStudentError(
            f"Cohort '{cohort_code}' already exists for offering '{program_offering_id}'"
        ) from e

    return doc


def enroll_student_in_program(
    db: Database,
    student_id: str,
    program_offering_id: str,
    cohort_id: str,
    admission_category: str = "REGULAR_FRESHER",
    primary_specialization_id: Optional[str] = None,
    minor_specialization_id: Optional[str] = None,
    enrollment_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Enroll a student in a specific program offering and cohort."""
    get_student_record(db, student_id)
    offering = get_program_offering(db, program_offering_id)

    valid_categories = {
        "REGULAR_FRESHER",
        "LATERAL_ENTRY_2ND_YEAR",
        "INTER_UNIVERSITY_TRANSFER",
        "READMISSION",
    }
    if admission_category not in valid_categories:
        raise StudentValidationError(f"Invalid admission_category: {admission_category}")

    now = datetime.now(timezone.utc)
    e_id = enrollment_id or f"enr_{uuid.uuid4().hex[:12]}"

    doc = {
        "enrollment_id": e_id,
        "student_id": student_id,
        "tenant_id": offering["tenant_id"],
        "institution_id": offering["institution_id"],
        "program_offering_id": program_offering_id,
        "program_version_id": offering["program_version_id"],
        "cohort_id": cohort_id,
        "admission_category": admission_category,
        "enrollment_status": "ACTIVE",
        "primary_specialization_id": primary_specialization_id,
        "minor_specialization_id": minor_specialization_id,
        "metadata": {},
        "created_at": now,
        "updated_at": now,
    }

    try:
        db.student_program_enrollments.insert_one(doc)
    except DuplicateKeyError as e:
        raise DuplicateStudentError(
            f"Student '{student_id}' is already enrolled in offering '{program_offering_id}'"
        ) from e

    # Atomically increment active students in cohort and offering
    db.cohort_batches.update_one({"cohort_id": cohort_id}, {"$inc": {"active_students_count": 1}})
    db.program_offerings.update_one({"offering_id": program_offering_id}, {"$inc": {"enrolled_count": 1}})

    try:
        from camp_01.outbox import publish_event
        publish_event(
            event_type="StudentEnrollmentActivated",
            aggregate_type="STUDENT_ENROLLMENT",
            aggregate_id=e_id,
            tenant_id=doc.get("tenant_id", "global"),
            payload={
                "student_id": student_id,
                "program_offering_id": program_offering_id,
                "cohort_id": cohort_id,
                "admission_category": admission_category,
            },
            db=db,
        )
    except Exception:
        pass

    return doc


def transition_enrollment_status(
    db: Database, enrollment_id: str, new_status: str
) -> Dict[str, Any]:
    """Transition academic enrollment status (preserves Completed vs Graduated distinction)."""
    enr = db.student_program_enrollments.find_one({"enrollment_id": enrollment_id})
    if not enr:
        raise EnrollmentNotFoundError(f"Enrollment '{enrollment_id}' not found")

    current_status = enr["enrollment_status"]
    if current_status == new_status:
        return enr

    allowed = ENROLLMENT_STATUS_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise StudentValidationError(
            f"Cannot transition enrollment from '{current_status}' to '{new_status}'. Allowed: {allowed}"
        )

    now = datetime.now(timezone.utc)
    res = db.student_program_enrollments.find_one_and_update(
        {"enrollment_id": enrollment_id},
        {"$set": {"enrollment_status": new_status, "updated_at": now}},
        return_document=True,
    )
    return res

