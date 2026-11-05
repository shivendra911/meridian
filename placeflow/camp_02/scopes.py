"""CAMP-02: Scope Architecture & Downward Inheritance Engine (Section 6).

Implements the 5-tier Scope Hierarchy:
  PLATFORM (5) -> TENANT (4) -> INSTITUTION (3) -> CAMPUS (2) -> ORGANIZATIONAL_UNIT (1) -> SELF (0)

Rules:
1. Downward Inheritance: Higher scopes automatically cover child domains.
2. Prevent Upward Inheritance: A department scope NEVER grants access to parent school or institution.
3. Organizational Lineage: Resolves descendant children units in the CAMP-01 hierarchy tree.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set
from database.connection import get_db

SCOPE_RANKS = {
    "PLATFORM": 5,
    "TENANT": 4,
    "INSTITUTION": 3,
    "CAMPUS": 2,
    "ORGANIZATIONAL_UNIT": 1,
    "SELF": 0,
}


def get_descendant_unit_ids(tenant_id: str, institution_id: str, root_unit_id: str, db=None) -> Set[str]:
    """Finds all descendant unit IDs underneath a root unit using CAMP-01 organizational relations."""
    if db is None:
        db = get_db()

    visited: Set[str] = {root_unit_id}
    queue: List[str] = [root_unit_id]
    now = datetime.now(timezone.utc)

    while queue:
        current = queue.pop(0)
        cursor = db.organizational_unit_relations.find({
            "tenant_id": tenant_id,
            "institution_id": institution_id,
            "parent_unit_id": current,
            "relationship_type": "CONTAINS",
            "$or": [
                {"valid_to": None},
                {"valid_to": {"$gt": now}},
            ],
        })
        for rel in cursor:
            child = rel.get("child_unit_id")
            if child and child not in visited:
                visited.add(child)
                queue.append(child)

    return visited


def is_in_scope(
    assignment_scope_type: str,
    assignment_scope_id: str,
    target_scope_type: str,
    target_scope_id: str,
    tenant_id: str,
    institution_id: Optional[str] = None,
    subject_person_id: Optional[str] = None,
    target_resource_owner_id: Optional[str] = None,
    db=None,
) -> bool:
    """Evaluates whether an assignment scope covers a target resource scope."""
    if db is None:
        db = get_db()

    assign_type = assignment_scope_type.upper().strip()
    target_type = target_scope_type.upper().strip()

    # 1. PLATFORM scope covers everything
    if assign_type == "PLATFORM":
        return True

    # 2. Strict prevent upward inheritance
    assign_rank = SCOPE_RANKS.get(assign_type, -1)
    target_rank = SCOPE_RANKS.get(target_type, -1)
    if assign_rank < target_rank:
        # Upward inheritance is strictly forbidden
        return False

    # 3. SELF scope: Only allows operations on subject's own records
    if assign_type == "SELF":
        if target_type == "SELF":
            return True
        if subject_person_id and target_resource_owner_id:
            return subject_person_id == target_resource_owner_id
        return False

    # 4. Same scope type matching
    if assign_type == target_type:
        if assign_type == "ORGANIZATIONAL_UNIT":
            # Check unit or descendant
            if assignment_scope_id == target_scope_id:
                return True
            if institution_id:
                descendants = get_descendant_unit_ids(tenant_id, institution_id, assignment_scope_id, db=db)
                return target_scope_id in descendants
            return False
        return assignment_scope_id == target_scope_id

    # 5. Downward inheritance checks
    if assign_type == "TENANT":
        # Check that target belongs to the same tenant
        return assignment_scope_id == tenant_id

    if assign_type == "INSTITUTION":
        if not institution_id or assignment_scope_id != institution_id:
            return False
        # If target is CAMPUS, verify campus belongs to this institution
        if target_type == "CAMPUS":
            assoc = db.institution_campuses.find_one({
                "tenant_id": tenant_id,
                "institution_id": institution_id,
                "campus_id": target_scope_id,
                "valid_to": None,
            })
            return bool(assoc)
        # If target is ORGANIZATIONAL_UNIT, verify unit belongs to this institution
        if target_type == "ORGANIZATIONAL_UNIT":
            unit = db.organizational_units.find_one({
                "tenant_id": tenant_id,
                "institution_id": institution_id,
                "unit_id": target_scope_id,
            })
            return bool(unit)
        return True

    if assign_type == "CAMPUS":
        # If target is ORGANIZATIONAL_UNIT, verify unit is anchored to this campus
        if target_type == "ORGANIZATIONAL_UNIT":
            unit = db.organizational_units.find_one({
                "tenant_id": tenant_id,
                "unit_id": target_scope_id,
            })
            if unit and unit.get("primary_campus_id") == assignment_scope_id:
                return True
            # Also check if any parent unit is anchored to this campus
            return False

    return False
