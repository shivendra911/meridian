"""Prerequisite & Co-requisite DAG Engine for CAMP-03.

Implements Directed Acyclic Graph (DAG) validation, cycle detection,
dependency enforcement, and mutual exclusivity checking for course registrations.
"""

from datetime import datetime, timezone
import uuid
from typing import Dict, Any, List, Optional, Set
from collections import deque
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from camp_03.courses import get_course


class PrerequisiteCycleError(Exception):
    pass


class PrerequisiteNotFoundError(Exception):
    pass


class DuplicatePrerequisiteError(Exception):
    pass


class PrerequisiteValidationError(Exception):
    pass


VALID_DEPENDENCY_TYPES = {
    "HARD_PREREQUISITE",
    "SOFT_PREREQUISITE",
    "CO_REQUISITE",
    "MUTUALLY_EXCLUSIVE",
}


def detect_prerequisite_cycles(
    db: Database,
    target_course_id: str,
    dependency_course_id: str,
) -> bool:
    """Verify if adding dependency_course_id as a requirement for target_course_id introduces a cycle.

    A cycle occurs if target_course_id is already an ancestor/dependency of dependency_course_id.
    We traverse the prerequisite graph starting from dependency_course_id following existing dependencies.
    If we reach target_course_id, a cycle exists.
    """
    if target_course_id == dependency_course_id:
        return True

    # BFS traversal starting from dependency_course_id
    visited: Set[str] = set()
    queue = deque([dependency_course_id])

    while queue:
        curr = queue.popleft()
        if curr == target_course_id:
            return True

        if curr in visited:
            continue
        visited.add(curr)

        # Find all prerequisites of curr (courses that curr depends on)
        edges = db.curriculum_prerequisites.find(
            {
                "target_course_id": curr,
                "dependency_type": {"$in": ["HARD_PREREQUISITE", "SOFT_PREREQUISITE"]},
            }
        )
        for edge in edges:
            dep_id = edge["dependency_course_id"]
            if dep_id not in visited:
                queue.append(dep_id)

    return False


def create_course_prerequisite(
    db: Database,
    target_course_id: str,
    dependency_course_id: str,
    dependency_type: str = "HARD_PREREQUISITE",
    minimum_grade_point: Optional[float] = 4.0,
    prerequisite_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Define a prerequisite dependency between two courses with cycle detection."""
    get_course(db, target_course_id)
    get_course(db, dependency_course_id)

    if dependency_type not in VALID_DEPENDENCY_TYPES:
        raise PrerequisiteValidationError(
            f"Invalid dependency_type: {dependency_type}. Must be one of {VALID_DEPENDENCY_TYPES}"
        )

    if target_course_id == dependency_course_id:
        raise PrerequisiteCycleError(
            f"Course '{target_course_id}' cannot have itself as a prerequisite or co-requisite"
        )

    # Invariant: Cycle Detection for directed prerequisite relationships
    if dependency_type in ("HARD_PREREQUISITE", "SOFT_PREREQUISITE"):
        if detect_prerequisite_cycles(db, target_course_id, dependency_course_id):
            raise PrerequisiteCycleError(
                f"Cyclic dependency detected: Adding '{dependency_course_id}' as prerequisite to "
                f"'{target_course_id}' introduces a circular loop in the curriculum DAG."
            )

    now = datetime.now(timezone.utc)
    p_id = prerequisite_id or f"prereq_{uuid.uuid4().hex[:12]}"

    doc = {
        "prerequisite_id": p_id,
        "target_course_id": target_course_id,
        "dependency_course_id": dependency_course_id,
        "dependency_type": dependency_type,
        "minimum_grade_point": float(minimum_grade_point) if minimum_grade_point is not None else None,
        "created_at": now,
    }

    try:
        db.curriculum_prerequisites.insert_one(doc)
    except DuplicateKeyError as e:
        raise DuplicatePrerequisiteError(
            f"Prerequisite of type '{dependency_type}' already exists between '{target_course_id}' and '{dependency_course_id}'"
        ) from e

    return doc


def get_course_prerequisites(
    db: Database, target_course_id: str
) -> List[Dict[str, Any]]:
    """Retrieve all prerequisites, co-requisites, and mutual exclusions for a course."""
    return list(db.curriculum_prerequisites.find({"target_course_id": target_course_id}))


def check_prerequisite_satisfaction(
    db: Database,
    completed_course_grades: Dict[str, float],
    attempted_course_ids: Set[str],
    concurrent_registered_course_ids: Set[str],
    target_course_id: str,
) -> Dict[str, Any]:
    """Evaluate whether a student is eligible to register for target_course_id.

    Args:
        completed_course_grades: dict of {course_id: grade_point} for passed courses.
        attempted_course_ids: set of course_ids previously registered/attempted.
        concurrent_registered_course_ids: set of course_ids registering in same term.
        target_course_id: course being evaluated for registration.
    """
    prereqs = get_course_prerequisites(db, target_course_id)
    missing_hard = []
    missing_soft = []
    missing_coreq = []
    mutually_exclusive_clashes = []

    for p in prereqs:
        dep_id = p["dependency_course_id"]
        dtype = p["dependency_type"]
        min_gp = p.get("minimum_grade_point") or 4.0

        if dtype == "HARD_PREREQUISITE":
            earned_gp = completed_course_grades.get(dep_id)
            if earned_gp is None or earned_gp < min_gp:
                missing_hard.append(
                    {"course_id": dep_id, "required_grade_point": min_gp, "earned": earned_gp}
                )

        elif dtype == "SOFT_PREREQUISITE":
            if dep_id not in attempted_course_ids and dep_id not in completed_course_grades:
                missing_soft.append({"course_id": dep_id})

        elif dtype == "CO_REQUISITE":
            if dep_id not in concurrent_registered_course_ids and dep_id not in completed_course_grades:
                missing_coreq.append({"course_id": dep_id})

        elif dtype == "MUTUALLY_EXCLUSIVE":
            if dep_id in completed_course_grades or dep_id in concurrent_registered_course_ids:
                mutually_exclusive_clashes.append({"course_id": dep_id})

    is_satisfied = (
        len(missing_hard) == 0
        and len(missing_soft) == 0
        and len(missing_coreq) == 0
        and len(mutually_exclusive_clashes) == 0
    )

    return {
        "target_course_id": target_course_id,
        "is_satisfied": is_satisfied,
        "missing_hard_prerequisites": missing_hard,
        "missing_soft_prerequisites": missing_soft,
        "missing_co_requisites": missing_coreq,
        "mutually_exclusive_clashes": mutually_exclusive_clashes,
    }

