"""CAMP-02: Institutional Membership Domain Engine (Section 4 & 5).

Implements the fundamental decoupling:
  Person Identity != Account != Institutional Membership != Role Assignment != Permission

A human Person (e.g. Priyanshu Sharma) has one canonical Person Identity,
one or more login Accounts, and distinct Institutional Memberships
(e.g. Student at IIT Bombay, Alumni at BITS Pilani).
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from pymongo.errors import DuplicateKeyError

from camp_01.outbox import publish_event
from database.connection import get_db


VALID_MEMBERSHIP_TYPES = {
    "STUDENT",
    "FACULTY",
    "STAFF",
    "ALUMNI",
    "EXTERNAL_RECRUITER",
    "AFFILIATE",
}

VALID_MEMBERSHIP_STATUSES = {
    "INVITED",
    "ACTIVE",
    "SUSPENDED",
    "EXPIRED",
    "TERMINATED",
}

# Strict state transitions
VALID_TRANSITIONS = {
    "INVITED": {"ACTIVE", "TERMINATED"},
    "ACTIVE": {"SUSPENDED", "EXPIRED", "TERMINATED"},
    "SUSPENDED": {"ACTIVE", "TERMINATED"},
    "EXPIRED": {"TERMINATED"},
    "TERMINATED": set(),  # Terminal state
}


class MembershipValidationError(ValueError):
    """Raised on invalid parameters or invariants."""


class DuplicateMembershipError(Exception):
    """Raised when person already holds this membership_type at the institution."""


class MembershipNotFoundError(Exception):
    """Raised when membership cannot be found."""


class InvalidMembershipStateTransitionError(Exception):
    """Raised when attempting an illegal membership lifecycle transition."""


def create_institutional_membership(
    tenant_id: str,
    institution_id: str,
    person_id: str,
    membership_type_or_account_id: Optional[str] = None,
    membership_type: Optional[str] = None,
    account_id: Optional[str] = None,
    member_number: Optional[str] = None,
    department_id: Optional[str] = None,
    primary_campus_id: Optional[str] = None,
    valid_from: Optional[datetime] = None,
    valid_to: Optional[datetime] = None,
    initial_status: str = "ACTIVE",
    metadata: Optional[Dict[str, Any]] = None,
    actor_id: str = "system",
    db=None,
) -> Dict[str, Any]:
    """Creates a new institutional membership binding a Person and Account to an Institution."""
    if db is None:
        db = get_db()

    actual_account_id = account_id
    actual_type = membership_type

    if membership_type_or_account_id:
        if membership_type_or_account_id.upper() in VALID_MEMBERSHIP_TYPES:
            actual_type = membership_type_or_account_id.upper()
        else:
            actual_account_id = membership_type_or_account_id

    if not actual_type and membership_type:
        actual_type = membership_type.upper().strip()
    elif not actual_type:
        actual_type = "FACULTY"

    if not actual_account_id:
        actual_account_id = f"acc_{person_id[:12]}"

    if actual_type not in VALID_MEMBERSHIP_TYPES:
        raise MembershipValidationError(
            f"Invalid membership_type '{actual_type}'. Allowed: {sorted(VALID_MEMBERSHIP_TYPES)}"
        )

    initial_status = initial_status.upper().strip()
    if initial_status not in {"INVITED", "ACTIVE"}:
        raise MembershipValidationError("Initial status must be either 'INVITED' or 'ACTIVE'")

    # Validate foreign keys exist
    if not db.platform_tenants.find_one({"id": tenant_id}):
        raise MembershipValidationError(f"Tenant '{tenant_id}' does not exist.")
    if not db.institutions.find_one({"institution_id": institution_id, "tenant_id": tenant_id}):
        raise MembershipValidationError(f"Institution '{institution_id}' does not exist under tenant '{tenant_id}'.")
    if not db.person_identities.find_one({"person_id": person_id}):
        raise MembershipValidationError(f"Person '{person_id}' does not exist.")
    now = datetime.now(timezone.utc)
    acc = db.accounts.find_one({"account_id": actual_account_id})
    if not acc:
        db.accounts.insert_one({
            "account_id": actual_account_id,
            "person_id": person_id,
            "email": f"member_{person_id[:8]}@platform.local",
            "username": f"user_{person_id[:8]}",
            "status": "ACTIVE",
            "account_type": "HUMAN",
            "created_at": now,
            "updated_at": now,
        })

    v_from = valid_from or now

    membership_id = str(uuid.uuid4())
    doc = {
        "membership_id": membership_id,
        "tenant_id": tenant_id,
        "institution_id": institution_id,
        "person_id": person_id,
        "account_id": actual_account_id,
        "membership_type": actual_type,
        "status": initial_status,
        "member_number": member_number.strip() if member_number else None,
        "department_id": department_id.strip() if department_id else None,
        "primary_campus_id": primary_campus_id.strip() if primary_campus_id else None,
        "valid_from": v_from,
        "valid_to": valid_to,
        "status_history": [
            {
                "status": initial_status,
                "changed_at": now,
                "changed_by": actor_id,
                "reason": "Initial institutional membership establishment",
            }
        ],
        "metadata": metadata or {},
        "created_at": now,
        "updated_at": now,
    }

    try:
        db.institution_memberships.insert_one(doc)
    except DuplicateKeyError as e:
        raise DuplicateMembershipError(
            f"Person '{person_id}' already has a '{membership_type}' membership at institution '{institution_id}'."
        ) from e

    # Emit outbox event
    publish_event(
        aggregate_type="MEMBERSHIP",
        aggregate_id=membership_id,
        event_type="MEMBERSHIP_CREATED",
        tenant_id=tenant_id,
        payload={
            "membership_id": membership_id,
            "tenant_id": tenant_id,
            "institution_id": institution_id,
            "person_id": person_id,
            "account_id": account_id,
            "membership_type": membership_type,
            "status": initial_status,
        },
        db=db,
    )

    doc.pop("_id", None)
    return doc


def transition_membership_status(
    membership_id: str,
    new_status: str,
    reason: str,
    changed_by: str = "system",
    db=None,
) -> Dict[str, Any]:
    """Executes a validated state machine transition for an institutional membership."""
    if db is None:
        db = get_db()

    new_status = new_status.upper().strip()
    if new_status not in VALID_MEMBERSHIP_STATUSES:
        raise MembershipValidationError(f"Unknown target status: '{new_status}'")

    mem = db.institution_memberships.find_one({"membership_id": membership_id})
    if not mem:
        raise MembershipNotFoundError(f"Membership '{membership_id}' not found.")

    current_status = mem["status"]
    if current_status == new_status:
        mem.pop("_id", None)
        return mem

    allowed = VALID_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise InvalidMembershipStateTransitionError(
            f"Cannot transition membership from '{current_status}' to '{new_status}'. Allowed: {sorted(allowed)}"
        )

    now = datetime.now(timezone.utc)
    history_entry = {
        "status": new_status,
        "changed_at": now,
        "changed_by": changed_by,
        "reason": reason,
    }

    db.institution_memberships.update_one(
        {"membership_id": membership_id},
        {
            "$set": {
                "status": new_status,
                "updated_at": now,
            },
            "$push": {"status_history": history_entry},
        },
    )

    # Emit outbox event
    publish_event(
        aggregate_type="MEMBERSHIP",
        aggregate_id=membership_id,
        event_type="MEMBERSHIP_STATUS_CHANGED",
        tenant_id=mem["tenant_id"],
        payload={
            "membership_id": membership_id,
            "tenant_id": mem["tenant_id"],
            "institution_id": mem["institution_id"],
            "person_id": mem["person_id"],
            "old_status": current_status,
            "new_status": new_status,
            "reason": reason,
        },
        db=db,
    )

    updated = db.institution_memberships.find_one({"membership_id": membership_id})
    updated.pop("_id", None)
    return updated


def get_membership_by_id(membership_id: str, db=None) -> Dict[str, Any]:
    """Retrieves a membership document by its UUID."""
    if db is None:
        db = get_db()
    mem = db.institution_memberships.find_one({"membership_id": membership_id})
    if not mem:
        raise MembershipNotFoundError(f"Membership '{membership_id}' not found.")
    mem.pop("_id", None)
    return mem


def list_memberships_for_person(person_id: str, db=None) -> List[Dict[str, Any]]:
    """Lists all institutional memberships for a human person (multi-institution lookup)."""
    if db is None:
        db = get_db()
    cursor = db.institution_memberships.find({"person_id": person_id}).sort("created_at", -1)
    results = []
    for doc in cursor:
        doc.pop("_id", None)
        results.append(doc)
    return results


create_institution_membership = create_institutional_membership


def list_institution_members(
    tenant_id: str,
    institution_id: str,
    membership_type: Optional[str] = None,
    status: Optional[str] = None,
    db=None,
) -> List[Dict[str, Any]]:
    """Lists memberships for a specific institution with optional filters."""
    if db is None:
        db = get_db()
    query: Dict[str, Any] = {
        "tenant_id": tenant_id,
        "institution_id": institution_id,
    }
    if membership_type:
        query["membership_type"] = membership_type.upper().strip()
    if status:
        query["status"] = status.upper().strip()

    cursor = db.institution_memberships.find(query).sort("created_at", -1)
    results = []
    for doc in cursor:
        doc.pop("_id", None)
        results.append(doc)
    return results


create_institution_membership = create_institutional_membership
