"""Course Catalogue & L-T-P-S Credit Service for CAMP-03.

Manages institutional master courses and approved syllabus versions with
Lecture-Tutorial-Practical-Studio (L-T-P-S) credit breakdowns according to NEP 2020.
"""

from datetime import datetime, timezone
import uuid
from typing import Dict, Any, List, Optional
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError


class CourseNotFoundError(Exception):
    pass


class CourseVersionNotFoundError(Exception):
    pass


class DuplicateCourseError(Exception):
    pass


class CourseValidationError(Exception):
    pass


VALID_COURSE_CATEGORIES = {
    "MAJOR_CORE",
    "MAJOR_ELECTIVE",
    "MINOR_CORE",
    "MINOR_ELECTIVE",
    "MULTIDISCIPLINARY_MDC",
    "ABILITY_ENHANCEMENT_AEC",
    "SKILL_ENHANCEMENT_SEC",
    "VALUE_ADDED_VAC",
    "INTERNSHIP_EXPERIENTIAL",
    "RESEARCH_DISSERTATION",
    "NON_CREDIT_MANDATORY",
}


def calculate_ltps_credits(
    lecture_hours: float,
    tutorial_hours: float,
    practical_hours: float,
    studio_self_study_hours: float,
) -> float:
    """Compute NEP 2020 course credits from contact hours.

    Formula:
        Credits = L + T + (P / 2) + (S / 3)
    """
    if any(h < 0 for h in (lecture_hours, tutorial_hours, practical_hours, studio_self_study_hours)):
        raise CourseValidationError("Contact hours cannot be negative")
    credits = lecture_hours + tutorial_hours + (practical_hours / 2.0) + (studio_self_study_hours / 3.0)
    return round(credits, 2)


def create_course(
    db: Database,
    tenant_id: str,
    institution_id: str,
    course_code: str,
    course_title: str,
    offering_academic_unit_id: str,
    course_level: int = 100,
    status: str = "ACTIVE",
    metadata: Optional[Dict[str, Any]] = None,
    course_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Register an institutional master course definition."""
    code_clean = course_code.strip().upper()
    title_clean = course_title.strip()

    valid_statuses = {"ACTIVE", "PHASING_OUT", "ARCHIVED"}
    if status not in valid_statuses:
        raise CourseValidationError(f"Invalid course status: {status}")

    now = datetime.now(timezone.utc)
    c_id = course_id or f"course_{uuid.uuid4().hex[:12]}"

    doc = {
        "course_id": c_id,
        "tenant_id": tenant_id,
        "institution_id": institution_id,
        "course_code": code_clean,
        "course_title": title_clean,
        "offering_academic_unit_id": offering_academic_unit_id,
        "course_level": int(course_level),
        "status": status,
        "metadata": metadata or {},
        "created_at": now,
        "updated_at": now,
    }

    try:
        db.courses.insert_one(doc)
    except DuplicateKeyError as e:
        raise DuplicateCourseError(
            f"Course code '{code_clean}' already exists for institution '{institution_id}'"
        ) from e

    return doc


def get_course(db: Database, course_id: str) -> Dict[str, Any]:
    """Retrieve master course by ID."""
    doc = db.courses.find_one({"course_id": course_id})
    if not doc:
        raise CourseNotFoundError(f"Course '{course_id}' not found")
    return doc


def list_courses(
    db: Database,
    tenant_id: Optional[str] = None,
    institution_id: Optional[str] = None,
    offering_academic_unit_id: Optional[str] = None,
    course_level: Optional[int] = None,
    status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List courses with filters."""
    query: Dict[str, Any] = {}
    if tenant_id:
        query["tenant_id"] = tenant_id
    if institution_id:
        query["institution_id"] = institution_id
    if offering_academic_unit_id:
        query["offering_academic_unit_id"] = offering_academic_unit_id
    if course_level is not None:
        query["course_level"] = course_level
    if status:
        query["status"] = status
    return list(db.courses.find(query).sort("course_code", 1))


def create_course_version(
    db: Database,
    course_id: str,
    version_code: str,
    lecture_hours_per_week: float = 3.0,
    tutorial_hours_per_week: float = 1.0,
    practical_hours_per_week: float = 0.0,
    studio_self_study_hours: float = 0.0,
    course_category: str = "MAJOR_CORE",
    syllabus_learning_outcomes: Optional[List[str]] = None,
    status: str = "ACTIVE",
    metadata: Optional[Dict[str, Any]] = None,
    course_version_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a specific syllabus version with L-T-P-S credit breakdown."""
    course = get_course(db, course_id)
    v_code = version_code.strip()

    if course_category not in VALID_COURSE_CATEGORIES:
        raise CourseValidationError(
            f"Invalid course_category: {course_category}. Must be one of {VALID_COURSE_CATEGORIES}"
        )

    calculated = calculate_ltps_credits(
        lecture_hours_per_week,
        tutorial_hours_per_week,
        practical_hours_per_week,
        studio_self_study_hours,
    )

    now = datetime.now(timezone.utc)
    cv_id = course_version_id or f"cv_{uuid.uuid4().hex[:12]}"

    doc = {
        "course_version_id": cv_id,
        "course_id": course_id,
        "tenant_id": course["tenant_id"],
        "institution_id": course["institution_id"],
        "version_code": v_code,
        "lecture_hours_per_week": float(lecture_hours_per_week),
        "tutorial_hours_per_week": float(tutorial_hours_per_week),
        "practical_hours_per_week": float(practical_hours_per_week),
        "studio_self_study_hours": float(studio_self_study_hours),
        "calculated_credits": float(calculated),
        "total_credits": float(calculated),
        "course_category": course_category,
        "syllabus_learning_outcomes": syllabus_learning_outcomes or [],
        "status": status,
        "metadata": metadata or {},
        "created_at": now,
        "updated_at": now,
    }

    try:
        db.course_versions.insert_one(doc)
    except DuplicateKeyError as e:
        raise CourseValidationError(
            f"Course version '{v_code}' already exists for course '{course_id}'"
        ) from e

    return doc


def get_course_version(db: Database, course_version_id: str) -> Dict[str, Any]:
    """Retrieve course version by ID."""
    doc = db.course_versions.find_one({"course_version_id": course_version_id})
    if not doc:
        raise CourseVersionNotFoundError(f"Course version '{course_version_id}' not found")
    return doc

