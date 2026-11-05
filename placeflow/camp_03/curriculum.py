"""Curriculum Architecture & Requirement Groups Service for CAMP-03.

Manages curriculum requirement groups (Core, Elective Baskets, Open Electives),
course-to-group mappings, and NEP 2020 Multiple Exit Qualification rules.
"""

from datetime import datetime, timezone
import uuid
from typing import Dict, Any, List, Optional
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from camp_03.programs import get_program_version
from camp_03.courses import get_course, get_course_version


class CurriculumGroupNotFoundError(Exception):
    pass


class CurriculumRequirementNotFoundError(Exception):
    pass


class DuplicateRequirementError(Exception):
    pass


class CurriculumValidationError(Exception):
    pass


VALID_GROUP_TYPES = {
    "COMPULSORY_CORE",
    "ELECTIVE_BASKET",
    "OPEN_ELECTIVE",
    "EXPERIENTIAL_PROJECT",
    "AUDIT_NON_CREDIT",
}


def create_requirement_group(
    db: Database,
    program_version_id: str,
    group_name: str,
    group_type: str = "COMPULSORY_CORE",
    minimum_credits: float = 20.0,
    maximum_credits: float = 20.0,
    is_mandatory: bool = True,
    metadata: Optional[Dict[str, Any]] = None,
    group_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a logical requirement group within a curriculum version."""
    get_program_version(db, program_version_id)

    if group_type not in VALID_GROUP_TYPES:
        raise CurriculumValidationError(
            f"Invalid group_type: '{group_type}'. Must be one of {VALID_GROUP_TYPES}"
        )

    if minimum_credits < 0:
        raise CurriculumValidationError("minimum_credits cannot be negative")
    if maximum_credits < minimum_credits:
        raise CurriculumValidationError("maximum_credits cannot be less than minimum_credits")

    now = datetime.now(timezone.utc)
    g_id = group_id or f"crg_{uuid.uuid4().hex[:12]}"

    doc = {
        "group_id": g_id,
        "program_version_id": program_version_id,
        "group_name": group_name.strip(),
        "group_type": group_type,
        "minimum_credits": float(minimum_credits),
        "maximum_credits": float(maximum_credits),
        "is_mandatory": bool(is_mandatory),
        "status": "ACTIVE",
        "metadata": metadata or {},
        "created_at": now,
    }

    try:
        db.curriculum_requirement_groups.insert_one(doc)
    except DuplicateKeyError as e:
        raise DuplicateRequirementError(
            f"Requirement group '{group_name}' already exists in version '{program_version_id}'"
        ) from e

    return doc


def get_requirement_group(db: Database, group_id: str) -> Dict[str, Any]:
    """Retrieve requirement group by ID."""
    doc = db.curriculum_requirement_groups.find_one({"group_id": group_id})
    if not doc:
        raise CurriculumGroupNotFoundError(f"Requirement group '{group_id}' not found")
    return doc


def list_requirement_groups(
    db: Database, program_version_id: str
) -> List[Dict[str, Any]]:
    """List requirement groups belonging to a curriculum version."""
    return list(
        db.curriculum_requirement_groups.find(
            {"program_version_id": program_version_id, "status": "ACTIVE"}
        ).sort("group_name", 1)
    )


def add_course_to_requirement_group(
    db: Database,
    group_id: str,
    course_id: str,
    course_version_id: str,
    is_compulsory: bool = True,
    recommended_term_sequence: int = 1,
    metadata: Optional[Dict[str, Any]] = None,
    requirement_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Bind a specific course version to a curriculum requirement group."""
    group = get_requirement_group(db, group_id)
    get_course(db, course_id)
    get_course_version(db, course_version_id)

    if recommended_term_sequence <= 0:
        raise CurriculumValidationError("recommended_term_sequence must be positive (1..N)")

    now = datetime.now(timezone.utc)
    r_id = requirement_id or f"ccr_{uuid.uuid4().hex[:12]}"

    doc = {
        "requirement_id": r_id,
        "group_id": group_id,
        "course_id": course_id,
        "course_version_id": course_version_id,
        "is_compulsory": bool(is_compulsory),
        "recommended_term_sequence": int(recommended_term_sequence),
        "metadata": metadata or {},
        "created_at": now,
    }

    try:
        db.curriculum_course_requirements.insert_one(doc)
    except DuplicateKeyError as e:
        raise DuplicateRequirementError(
            f"Course '{course_id}' is already assigned to requirement group '{group_id}'"
        ) from e

    return doc


def list_group_course_requirements(
    db: Database, group_id: str
) -> List[Dict[str, Any]]:
    """List all course requirements inside a group."""
    return list(
        db.curriculum_course_requirements.find({"group_id": group_id}).sort(
            "recommended_term_sequence", 1
        )
    )


def create_multiple_exit_rule(
    db: Database,
    program_version_id: str,
    exit_qualification_id: str,
    exit_credential_title: str,
    minimum_earned_credits: float = 40.0,
    mandatory_group_ids: Optional[List[str]] = None,
    required_internship_credits: Optional[float] = 4.0,
    metadata: Optional[Dict[str, Any]] = None,
    rule_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Define a NEP 2020 intermediate exit award milestone."""
    get_program_version(db, program_version_id)

    if minimum_earned_credits <= 0:
        raise CurriculumValidationError("minimum_earned_credits must be greater than zero")

    now = datetime.now(timezone.utc)
    r_id = rule_id or f"exit_{uuid.uuid4().hex[:12]}"

    doc = {
        "rule_id": r_id,
        "program_version_id": program_version_id,
        "exit_qualification_id": exit_qualification_id,
        "exit_credential_title": exit_credential_title.strip(),
        "minimum_earned_credits": float(minimum_earned_credits),
        "mandatory_group_ids": mandatory_group_ids or [],
        "required_internship_credits": float(required_internship_credits) if required_internship_credits is not None else None,
        "metadata": metadata or {},
        "created_at": now,
    }

    try:
        db.multiple_exit_rules.insert_one(doc)
    except DuplicateKeyError as e:
        raise DuplicateRequirementError(
            f"An exit rule for qualification '{exit_qualification_id}' already exists in version '{program_version_id}'"
        ) from e

    return doc


def list_multiple_exit_rules(
    db: Database, program_version_id: str
) -> List[Dict[str, Any]]:
    """List all multiple exit rules for a program version."""
    return list(
        db.multiple_exit_rules.find({"program_version_id": program_version_id}).sort(
            "minimum_earned_credits", 1
        )
    )

