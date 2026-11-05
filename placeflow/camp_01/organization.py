"""Organizational Hierarchy & Temporal Graph Domain Service & Repository for CAMP-01.
Models administrative units, typed relationships, cycle detection ($graphLookup),
and historical restructuring (ADR-C01-006, ADR-C01-007, ADR-C01-009, ADR-C01-012).
"""

import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set
from pymongo.client_session import ClientSession
from pymongo.errors import DuplicateKeyError
from database.connection import get_db
from camp_01.outbox import publish_event
from camp_01.institutions import get_institution_by_id

CODE_REGEX = re.compile(r"^[A-Z0-9_-]+$")

VALID_UNIT_TYPES = {
    "EXECUTIVE", "FACULTY", "SCHOOL", "DEPARTMENT", "ADMINISTRATIVE",
    "PLACEMENT_OFFICE", "EXAMINATION_CELL", "FINANCE_OFFICE",
    "SUPPORT_SERVICES", "RESEARCH_CENTRE", "OTHER"
}

VALID_RELATIONSHIP_TYPES = {
    "CONTAINS", "REPORTS_TO", "SUPPORTS", "SHARES_SERVICES_WITH", "COORDINATES_WITH"
}


class OrganizationalValidationError(ValueError):
    """Raised when organizational unit or relationship data fails validation."""
    pass


class OrganizationalUnitNotFoundError(LookupError):
    """Raised when an organizational unit is not found within scope."""
    pass


class HierarchyCycleDetectedError(RuntimeError):
    """Raised when a proposed structural relationship would introduce a circular hierarchy."""
    pass


class PrimaryParentCollisionError(RuntimeError):
    """Raised when a unit attempts to have more than one active primary structural parent."""
    pass


def normalize_unit_code(code: str) -> str:
    """Normalizes unit code to uppercase alphanumeric with hyphens/underscores."""
    c = code.strip().upper()
    if not CODE_REGEX.match(c):
        raise OrganizationalValidationError(
            f"Invalid unit code '{code}'. Must contain uppercase letters, numbers, hyphens or underscores."
        )
    return c


def create_organizational_unit(
    tenant_id: str,
    institution_id: str,
    unit_code: str,
    name: str,
    unit_type: str,
    status: str = "ACTIVE",
    metadata: Optional[Dict[str, Any]] = None,
    actor_id: str = "system",
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Registers an administrative or academic organizational unit inside an institution."""
    if db is None:
        db = get_db()

    # Validate institution exists
    get_institution_by_id(tenant_id, institution_id, db=db)

    norm_code = normalize_unit_code(unit_code)
    name = name.strip()
    if len(name) < 2:
        raise OrganizationalValidationError("Organizational unit name must be at least 2 characters.")

    if unit_type not in VALID_UNIT_TYPES:
        raise OrganizationalValidationError(f"Invalid unit type '{unit_type}'. Allowed types: {sorted(list(VALID_UNIT_TYPES))}")

    unit_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    doc = {
        "unit_id": unit_id,
        "tenant_id": tenant_id,
        "institution_id": institution_id,
        "unit_code": norm_code,
        "normalized_code": norm_code,
        "name": name,
        "unit_type": unit_type,
        "status": status,
        "metadata": metadata or {},
        "created_at": now,
    }

    try:
        db.organizational_units.insert_one(doc, session=session)
        doc.pop("_id", None)
    except DuplicateKeyError as exc:
        raise OrganizationalValidationError(
            f"Organizational unit code '{norm_code}' already exists in this institution."
        ) from exc

    publish_event(
        event_type="OrganizationalUnitCreated",
        aggregate_type="ORGANIZATIONAL_UNIT",
        aggregate_id=unit_id,
        tenant_id=tenant_id,
        payload={
            "unit_id": unit_id,
            "institution_id": institution_id,
            "unit_code": norm_code,
            "name": name,
            "unit_type": unit_type,
        },
        session=session,
        db=db,
    )

    return doc


def get_organizational_unit_by_id(
    tenant_id: str,
    institution_id: str,
    unit_id: str,
    db=None,
) -> Dict[str, Any]:
    """Retrieves an organizational unit by ID within institution scope."""
    if db is None:
        db = get_db()
    u = db.organizational_units.find_one(
        {"tenant_id": tenant_id, "institution_id": institution_id, "unit_id": unit_id},
        {"_id": 0},
    )
    if not u:
        raise OrganizationalUnitNotFoundError(
            f"Organizational unit '{unit_id}' not found in institution '{institution_id}'."
        )
    return u


def list_organizational_units(
    tenant_id: str,
    institution_id: str,
    unit_type: Optional[str] = None,
    status: Optional[str] = None,
    db=None,
) -> List[Dict[str, Any]]:
    """Lists organizational units scoped to an institution."""
    if db is None:
        db = get_db()
    q = {"tenant_id": tenant_id, "institution_id": institution_id}
    if unit_type:
        q["unit_type"] = unit_type
    if status:
        q["status"] = status
    return list(db.organizational_units.find(q, {"_id": 0}).sort("name", 1))


def check_containment_cycle(
    db,
    tenant_id: str,
    institution_id: str,
    proposed_parent_id: str,
    proposed_child_id: str,
    session: Optional[ClientSession] = None,
) -> bool:
    """Uses MongoDB $graphLookup to check if adding edge (proposed_parent -> proposed_child) introduces a cycle.

    If proposed_child is an ancestor of proposed_parent, a cycle would form!
    """
    if proposed_parent_id == proposed_child_id:
        return True

    pipeline = [
        {
            "$match": {
                "tenant_id": tenant_id,
                "institution_id": institution_id,
                "child_unit_id": proposed_parent_id,
                "relationship_type": "CONTAINS",
                "valid_to": None,
            }
        },
        {
            "$graphLookup": {
                "from": "organizational_unit_relations",
                "startWith": "$parent_unit_id",
                "connectFromField": "parent_unit_id",
                "connectToField": "child_unit_id",
                "as": "ancestor_chain",
                "restrictSearchWithMatch": {
                    "tenant_id": tenant_id,
                    "institution_id": institution_id,
                    "relationship_type": "CONTAINS",
                    "valid_to": None,
                },
            }
        },
    ]

    results = list(db.organizational_unit_relations.aggregate(pipeline, session=session))
    if not results:
        return False

    ancestor_ids: Set[str] = set()
    for row in results:
        ancestor_ids.add(row["parent_unit_id"])
        for anc in row.get("ancestor_chain", []):
            ancestor_ids.add(anc["parent_unit_id"])

    return proposed_child_id in ancestor_ids


def create_organizational_relation(
    tenant_id: str,
    institution_id: str,
    child_unit_id: str,
    parent_unit_id: str,
    relationship_type: str = "CONTAINS",
    is_primary: bool = True,
    valid_from: Optional[datetime] = None,
    valid_to: Optional[datetime] = None,
    change_reason: Optional[str] = None,
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Establishes a typed relationship between two units with cycle prevention and temporal bounds."""
    if db is None:
        db = get_db()

    if child_unit_id == parent_unit_id:
        raise OrganizationalValidationError("A unit cannot be related to itself (child_unit_id cannot equal parent_unit_id).")

    if relationship_type not in VALID_RELATIONSHIP_TYPES:
        raise OrganizationalValidationError(f"Invalid relationship type '{relationship_type}'.")

    # Invariant: Both units must belong to the exact same institution
    get_organizational_unit_by_id(tenant_id, institution_id, child_unit_id, db=db)
    get_organizational_unit_by_id(tenant_id, institution_id, parent_unit_id, db=db)

    now = datetime.now(timezone.utc)
    from_date = valid_from or now

    if valid_to and valid_to <= from_date:
        raise OrganizationalValidationError("Relationship valid_to date must be after valid_from date.")

    # Cycle Detection for CONTAINS structural relationships
    if relationship_type == "CONTAINS":
        if check_containment_cycle(db, tenant_id, institution_id, parent_unit_id, child_unit_id, session=session):
            raise HierarchyCycleDetectedError(
                f"Cannot assign parent '{parent_unit_id}' to child '{child_unit_id}' because '{child_unit_id}' is already an ancestor of '{parent_unit_id}' (structural cycle detected)."
            )

        # Invariant: Single primary containment parent check
        if is_primary:
            overlapping_parent = db.organizational_unit_relations.find_one(
                {
                    "tenant_id": tenant_id,
                    "institution_id": institution_id,
                    "child_unit_id": child_unit_id,
                    "relationship_type": "CONTAINS",
                    "is_primary": True,
                    "$or": [
                        {"valid_to": None},
                        {"valid_to": {"$gt": from_date}},
                    ],
                },
                session=session,
            )
            if overlapping_parent:
                raise PrimaryParentCollisionError(
                    f"Unit '{child_unit_id}' already has an active primary containment parent ({overlapping_parent['parent_unit_id']}). "
                    "Use restructure_unit_parent() to reorganize primary parents while preserving temporal history."
                )

    relation_id = str(uuid.uuid4())
    doc = {
        "relation_id": relation_id,
        "tenant_id": tenant_id,
        "institution_id": institution_id,
        "child_unit_id": child_unit_id,
        "parent_unit_id": parent_unit_id,
        "relationship_type": relationship_type,
        "is_primary": is_primary,
        "valid_from": from_date,
        "valid_to": valid_to,
        "change_reason": change_reason,
        "created_at": now,
    }

    db.organizational_unit_relations.insert_one(doc, session=session)
    doc.pop("_id", None)

    publish_event(
        event_type="OrganizationalStructureChanged",
        aggregate_type="ORGANIZATIONAL_UNIT",
        aggregate_id=child_unit_id,
        tenant_id=tenant_id,
        payload={
            "institution_id": institution_id,
            "child_unit_id": child_unit_id,
            "parent_unit_id": parent_unit_id,
            "relationship_type": relationship_type,
            "is_primary": is_primary,
        },
        session=session,
        db=db,
    )

    return doc


def restructure_unit_parent(
    tenant_id: str,
    institution_id: str,
    unit_id: str,
    new_parent_id: str,
    change_reason: str,
    effective_date: Optional[datetime] = None,
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Reorganizes a unit's primary parent: closes the old relation and opens a new relation.

    Strictly preserves historical records without destructive updates (ADR-C01-009).
    """
    if db is None:
        db = get_db()

    now = datetime.now(timezone.utc)
    eff_date = effective_date or now

    # 1. Check for cycles with proposed new parent
    if check_containment_cycle(db, tenant_id, institution_id, new_parent_id, unit_id, session=session):
        raise HierarchyCycleDetectedError(
            f"Cannot shift unit '{unit_id}' under new parent '{new_parent_id}': structural cycle detected."
        )

    # 2. Close current active primary containment relationship
    db.organizational_unit_relations.update_many(
        {
            "tenant_id": tenant_id,
            "institution_id": institution_id,
            "child_unit_id": unit_id,
            "relationship_type": "CONTAINS",
            "is_primary": True,
            "valid_to": None,
        },
        {"$set": {"valid_to": eff_date}},
        session=session,
    )

    # 3. Create new primary containment relationship
    new_rel = create_organizational_relation(
        tenant_id=tenant_id,
        institution_id=institution_id,
        child_unit_id=unit_id,
        parent_unit_id=new_parent_id,
        relationship_type="CONTAINS",
        is_primary=True,
        valid_from=eff_date,
        valid_to=None,
        change_reason=change_reason,
        session=session,
        db=db,
    )

    return new_rel


def get_resolved_hierarchy_tree(
    tenant_id: str,
    institution_id: str,
    as_of_date: Optional[datetime] = None,
    db=None,
) -> List[Dict[str, Any]]:
    """Builds a complete, resolved organizational tree for an institution at any point in time."""
    if db is None:
        db = get_db()

    target_date = as_of_date or datetime.now(timezone.utc)

    # Fetch all units
    all_units = {u["unit_id"]: u for u in list_organizational_units(tenant_id, institution_id, db=db)}

    # Fetch active CONTAINS relationships at target_date
    rel_query = {
        "tenant_id": tenant_id,
        "institution_id": institution_id,
        "relationship_type": "CONTAINS",
        "valid_from": {"$lte": target_date},
        "$or": [
            {"valid_to": None},
            {"valid_to": {"$gt": target_date}},
        ],
    }
    active_relations = list(db.organizational_unit_relations.find(rel_query, {"_id": 0}))

    # Map children to parents
    parent_to_children: Dict[str, List[str]] = {}
    child_to_parent: Dict[str, str] = {}
    for r in active_relations:
        p = r["parent_unit_id"]
        c = r["child_unit_id"]
        parent_to_children.setdefault(p, []).append(c)
        child_to_parent[c] = p

    # Find root units (units with no active containment parent)
    root_ids = [uid for uid in all_units.keys() if uid not in child_to_parent]

    def build_node(uid: str) -> Dict[str, Any]:
        u = all_units[uid]
        children_ids = parent_to_children.get(uid, [])
        return {
            "unit_id": u["unit_id"],
            "unit_code": u["unit_code"],
            "name": u["name"],
            "unit_type": u["unit_type"],
            "children": [build_node(cid) for cid in children_ids if cid in all_units],
        }

    return [build_node(rid) for rid in root_ids]
