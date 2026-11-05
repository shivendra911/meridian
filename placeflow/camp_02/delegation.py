"""CAMP-02: Role Delegation Framework (Section 8).

Features:
1. Temporary, time-bounded authority transfer (e.g., HOD on leave delegating to Vice-Principal).
2. Non-delegable permissions filter: System config, IAM role assignment, and audit ledger access cannot be delegated.
3. Anti-Cascade Rule: Max depth = 1. A delegated role CANNOT be sub-delegated to a third party.
4. Instant Revocation by delegator, delegator's supervisor, or tenant admin.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set
import uuid

from pymongo.client_session import ClientSession
from database.connection import get_db
from camp_02.roles import get_role_by_id

NON_DELEGABLE_ACTIONS = {
    "iam:role:assign",
    "iam:role:create",
    "iam:role:delete",
    "iam:permission:grant",
    "camp01:tenant:delete",
    "camp01:institution:delete",
    "iam:audit:read",
}


class DelegationError(Exception):
    pass


class AntiCascadeViolationError(DelegationError):
    pass


class NonDelegableActionError(DelegationError):
    pass


def create_role_delegation(
    tenant_id: str,
    institution_id: str,
    delegator_membership_id: str,
    delegatee_membership_id: str,
    role_id: str,
    scope_type: str,
    scope_id: str,
    valid_from: datetime,
    valid_to: datetime,
    reason: str,
    excluded_actions: Optional[List[str]] = None,
    actor_id: str = "system",
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Creates a temporary, strictly bounded role delegation."""
    if db is None:
        db = get_db()

    now = datetime.now(timezone.utc)
    if valid_to <= valid_from or valid_to <= now:
        raise DelegationError("Delegation valid_to must be in the future and after valid_from.")

    if delegator_membership_id == delegatee_membership_id:
        raise DelegationError("A principal cannot delegate roles to themselves.")

    # 1. Anti-Cascade Check: Verify delegator is NOT acting on a delegated role
    existing_delegation = db.role_delegations.find_one({
        "tenant_id": tenant_id,
        "delegatee_membership_id": delegator_membership_id,
        "status": "ACTIVE",
        "valid_to": {"$gt": now},
    }, session=session)
    if existing_delegation:
        raise AntiCascadeViolationError("Anti-Cascade Rule: A delegatee cannot sub-delegate roles (maximum depth = 1).")

    # 2. Verify delegator holds this role actively
    active_assignment = db.role_assignments.find_one({
        "tenant_id": tenant_id,
        "membership_id": delegator_membership_id,
        "role_id": role_id,
        "status": "ACTIVE",
        "$or": [
            {"valid_to": None},
            {"valid_to": {"$gt": now}},
        ],
    }, session=session)
    if not active_assignment:
        raise DelegationError("Delegator does not actively hold the specified role.")

    # 3. Check for non-delegable actions in the role
    role = get_role_by_id(role_id, db=db)
    if not role:
        raise DelegationError(f"Role '{role_id}' not found.")

    all_excluded = set(excluded_actions or [])
    all_excluded.update(NON_DELEGABLE_ACTIONS)

    m_del = db.institution_memberships.find_one({"membership_id": delegator_membership_id})
    m_rec = db.institution_memberships.find_one({"membership_id": delegatee_membership_id})
    del_acc_id = (m_del.get("account_id") if m_del else None) or f"acc_{delegator_membership_id[:8]}"
    rec_acc_id = (m_rec.get("account_id") if m_rec else None) or f"acc_{delegatee_membership_id[:8]}"

    delegation_id = str(uuid.uuid4())
    doc = {
        "delegation_id": delegation_id,
        "tenant_id": tenant_id,
        "institution_id": institution_id,
        "delegator_account_id": del_acc_id,
        "delegatee_account_id": rec_acc_id,
        "delegator_membership_id": delegator_membership_id,
        "delegatee_membership_id": delegatee_membership_id,
        "role_id": role_id,
        "delegated_roles": [role_id],
        "scope_type": scope_type,
        "scope_id": scope_id,
        "excluded_actions": sorted(list(all_excluded)),
        "reason": reason,
        "status": "ACTIVE",
        "valid_from": valid_from,
        "valid_to": valid_to,
        "created_by": actor_id,
        "created_at": now,
        "revoked_at": None,
        "revoked_by": None,
    }

    db.role_delegations.insert_one(doc, session=session)
    return doc


def revoke_role_delegation(
    delegation_id: str,
    tenant_id: str,
    revoked_by: str,
    revocation_reason: str,
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Instantly revokes a role delegation."""
    if db is None:
        db = get_db()

    now = datetime.now(timezone.utc)
    res = db.role_delegations.find_one_and_update(
        {"delegation_id": delegation_id, "tenant_id": tenant_id, "status": "ACTIVE"},
        {
            "$set": {
                "status": "REVOKED",
                "revoked_at": now,
                "revoked_by": revoked_by,
                "revocation_reason": revocation_reason,
            }
        },
        session=session,
        return_document=True,
    )
    if not res:
        raise DelegationError(f"Active delegation '{delegation_id}' not found.")
    return res
