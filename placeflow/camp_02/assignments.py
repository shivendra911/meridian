"""CAMP-02: Role Assignment & Scoped Authority Engine (Section 5).

Binds an Account and Institutional Membership to a specific Role at a defined Scope.
Enforces scope ceiling constraints, temporal validity, and outbox event publishing.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from camp_01.outbox import publish_event
from camp_02.roles import get_role_by_id, get_role_permissions
from camp_02.scopes import SCOPE_RANKS
from camp_02.governance import validate_static_sod
from database.connection import get_db


class RoleAssignmentError(ValueError):
    """Raised when role assignment violates scope constraints or validity."""


class RoleAssignmentNotFoundError(LookupError):
    """Raised when an assignment cannot be found."""


def assign_role(
    tenant_id: str,
    account_or_membership_id: Optional[str] = None,
    role_id: Optional[str] = None,
    scope_type: Optional[str] = None,
    scope_id: Optional[str] = None,
    institution_id: Optional[str] = None,
    membership_id: Optional[str] = None,
    account_id: Optional[str] = None,
    valid_from: Optional[datetime] = None,
    valid_to: Optional[datetime] = None,
    assigned_by: str = "system",
    db=None,
    **kwargs,
) -> Dict[str, Any]:
    """Assigns an authoritative role to an account or membership with scope boundary and temporal validity."""
    if db is None:
        db = get_db()

    # Extract keyword arguments if passed
    actual_role_id = role_id or kwargs.get("role_id")
    actual_scope_type = scope_type or kwargs.get("scope_type", "ORGANIZATIONAL_UNIT")
    actual_scope_id = scope_id or kwargs.get("scope_id", "")
    resolved_account_id = account_id or kwargs.get("account_id")
    resolved_membership_id = membership_id or kwargs.get("membership_id")

    if not resolved_account_id and not resolved_membership_id and account_or_membership_id:
        m = db.institution_memberships.find_one({"membership_id": account_or_membership_id})
        if m:
            resolved_membership_id = m["membership_id"]
            if not institution_id:
                institution_id = m.get("institution_id")
            acc = db.accounts.find_one({"person_id": m["person_id"]})
            resolved_account_id = acc["account_id"] if acc else f"acc_auto_{m['person_id'][:12]}"
        else:
            acc = db.accounts.find_one({"account_id": account_or_membership_id})
            resolved_account_id = acc["account_id"] if acc else account_or_membership_id
    elif resolved_membership_id and not resolved_account_id:
        m = db.institution_memberships.find_one({"membership_id": resolved_membership_id})
        if m:
            acc = db.accounts.find_one({"person_id": m["person_id"]})
            resolved_account_id = acc["account_id"] if acc else f"acc_auto_{m['person_id'][:12]}"
        else:
            resolved_account_id = account_or_membership_id

    now = datetime.now(timezone.utc)
    v_from = valid_from or now

    if valid_to and v_from > valid_to:
        raise RoleAssignmentError("Assignment valid_from cannot be after valid_to.")

    # 1. Verify role exists
    role = get_role_by_id(actual_role_id, db=db)
    cur_ver = role.get("current_version", 1)

    v_doc = db.role_versions.find_one({"role_id": role["role_id"], "version_number": cur_ver})
    if not v_doc:
        raise RoleAssignmentError(f"Active version for role '{role['role_id']}' not found.")

    # 2. Check Static Separation of Duties (SoD)
    if resolved_membership_id:
        validate_static_sod(tenant_id, resolved_membership_id, role.get("role_code"), db=db)

    max_scope = v_doc.get("max_allowed_scope", "ORGANIZATIONAL_UNIT")
    actual_scope_type = actual_scope_type.upper().strip()

    # 3. Enforce scope ceiling constraint
    assign_rank = SCOPE_RANKS.get(actual_scope_type, 0)
    ceiling_rank = SCOPE_RANKS.get(max_scope, 0)
    if assign_rank > ceiling_rank:
        raise RoleAssignmentError(
            f"Role '{role.get('role_code')}' has max allowed scope '{max_scope}'. Cannot assign at '{actual_scope_type}'."
        )

    assignment_id = str(uuid.uuid4())
    doc = {
        "assignment_id": assignment_id,
        "tenant_id": tenant_id,
        "institution_id": institution_id,
        "membership_id": resolved_membership_id,
        "account_id": resolved_account_id or "acc_unbound",
        "role_id": role["role_id"],
        "role_code": role.get("role_code"),
        "role_version": cur_ver,
        "scope_type": actual_scope_type,
        "scope_id": actual_scope_id.strip(),
        "valid_from": v_from,
        "valid_to": valid_to,
        "status": "ACTIVE",
        "assigned_by": assigned_by,
        "assigned_at": now,
        "revoked_at": None,
        "revoked_by": None,
        "revocation_reason": None,
    }

    db.role_assignments.insert_one(doc)

    publish_event(
        aggregate_type="ROLE",
        aggregate_id=role["role_id"],
        event_type="RoleAssigned",
        tenant_id=tenant_id,
        payload={
            "assignment_id": assignment_id,
            "account_id": resolved_account_id,
            "membership_id": resolved_membership_id,
            "role_id": role["role_id"],
            "role_code": role.get("role_code"),
            "scope_type": scope_type,
            "scope_id": scope_id,
            "assigned_by": assigned_by,
        },
        db=db,
    )

    doc.pop("_id", None)
    return doc


def revoke_role_assignment(
    assignment_id: str,
    reason: str,
    revoked_by: str = "system",
    db=None,
) -> Dict[str, Any]:
    """Revokes an active role assignment immediately."""
    if db is None:
        db = get_db()

    asgn = db.role_assignments.find_one({"assignment_id": assignment_id})
    if not asgn:
        raise RoleAssignmentNotFoundError(f"Assignment '{assignment_id}' not found.")

    now = datetime.now(timezone.utc)
    db.role_assignments.update_one(
        {"assignment_id": assignment_id},
        {
            "$set": {
                "status": "REVOKED",
                "revoked_at": now,
                "revoked_by": revoked_by,
                "revocation_reason": reason.strip(),
            }
        },
    )

    publish_event(
        aggregate_type="ROLE",
        aggregate_id=asgn["role_id"],
        event_type="RoleRevoked",
        tenant_id=asgn["tenant_id"],
        payload={
            "assignment_id": assignment_id,
            "account_id": asgn["account_id"],
            "role_id": asgn["role_id"],
            "reason": reason,
            "revoked_by": revoked_by,
        },
        db=db,
    )

    updated = db.role_assignments.find_one({"assignment_id": assignment_id}, {"_id": 0})
    return updated


def list_active_role_assignments(
    account_id: str,
    institution_id: Optional[str] = None,
    db=None,
) -> List[Dict[str, Any]]:
    """Lists currently active and unexpired role assignments for an account."""
    if db is None:
        db = get_db()

    now = datetime.now(timezone.utc)
    query: Dict[str, Any] = {
        "account_id": account_id,
        "status": "ACTIVE",
        "valid_from": {"$lte": now},
        "$or": [
            {"valid_to": None},
            {"valid_to": {"$gt": now}},
        ],
    }
    if institution_id:
        query["$or"] = [
            {"institution_id": institution_id},
            {"institution_id": None},  # Platform/tenant roles
        ]

    cursor = db.role_assignments.find(query, {"_id": 0}).sort("assigned_at", -1)
    return list(cursor)


def get_effective_user_permissions(
    account_id: str,
    institution_id: Optional[str] = None,
    db=None,
) -> List[Dict[str, Any]]:
    """Computes all effective permissions granted to an account across active role assignments."""
    if db is None:
        db = get_db()

    assignments = list_active_role_assignments(account_id, institution_id=institution_id, db=db)
    effective: List[Dict[str, Any]] = []

    for a in assignments:
        perms = get_role_permissions(a["role_id"], version_number=a.get("role_version"), db=db)
        effective.append({
            "assignment_id": a["assignment_id"],
            "role_id": a["role_id"],
            "scope_type": a["scope_type"],
            "scope_id": a["scope_id"],
            "permissions": perms,
        })

    return effective
