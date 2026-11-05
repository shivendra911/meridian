"""Tenant Management Domain Service & Repository for CAMP-01.
Owns the customer security and isolation boundary (Platform Core).
"""

import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pymongo.client_session import ClientSession
from pymongo.errors import DuplicateKeyError
from database.connection import get_db
from camp_01.outbox import publish_event

VALID_TENANT_STATUSES = {"REQUESTED", "PROVISIONING", "ACTIVE", "SUSPENDED", "CLOSING", "CLOSED"}

# Valid state machine transitions
ALLOWED_STATUS_TRANSITIONS = {
    "REQUESTED": {"PROVISIONING", "CLOSED"},
    "PROVISIONING": {"ACTIVE", "CLOSED"},
    "ACTIVE": {"SUSPENDED", "CLOSING"},
    "SUSPENDED": {"ACTIVE", "CLOSING", "CLOSED"},
    "CLOSING": {"CLOSED", "ACTIVE"},
    "CLOSED": set(),  # Terminal state
}

SLUG_REGEX = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

RESERVED_SLUGS = {
    "api",
    "admin",
    "system",
    "auth",
    "login",
    "logout",
    "dashboard",
    "app",
    "static",
    "assets",
    "portal",
    "billing",
    "webhook",
    "metrics",
    "internal",
    "health",
    "status",
    "docs",
    "help",
    "support",
}


class TenantValidationError(ValueError):
    """Raised when tenant input fails business rules."""
    pass


class TenantNotFoundError(LookupError):
    """Raised when a requested tenant does not exist."""
    pass


class InvalidTenantStateTransitionError(ValueError):
    """Raised when an illegal tenant lifecycle transition is attempted."""
    pass


def normalize_slug(slug: str) -> str:
    """Normalizes and validates a tenant URL slug."""
    s = slug.strip().lower()
    if s in RESERVED_SLUGS:
        raise TenantValidationError(f"Tenant slug '{s}' is a reserved platform keyword.")
    if not SLUG_REGEX.match(s):
        raise TenantValidationError(
            f"Invalid tenant slug '{slug}'. Must contain lowercase alphanumeric characters and single hyphens."
        )
    if len(s) < 3 or len(s) > 100:
        raise TenantValidationError("Tenant slug must be between 3 and 100 characters in length.")
    return s


def create_tenant(
    name: str,
    slug: str,
    customer_type: str,
    admin_email: str,
    subscription_tier: str = "STANDARD",
    operational_flags: Optional[Dict[str, Any]] = None,
    actor_id: str = "system",
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Provisions a new tenant boundary in the platform."""
    if db is None:
        db = get_db()

    name = name.strip()
    if not name or len(name) < 2:
        raise TenantValidationError("Tenant name must be at least 2 characters.")

    norm_slug = normalize_slug(slug)
    admin_email = admin_email.strip().lower()

    if customer_type not in {"ENTERPRISE", "EDUCATION_GROUP", "STANDALONE_COLLEGE", "STATE_UNIVERSITY", "TRIAL"}:
        raise TenantValidationError(f"Invalid customer type: {customer_type}")

    tenant_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    tenant_doc = {
        "id": tenant_id,
        "slug": norm_slug,
        "name": name,
        "status": "REQUESTED",
        "customer_type": customer_type,
        "admin_email": admin_email,
        "subscription_tier": subscription_tier,
        "created_at": now,
        "updated_at": now,
        "status_history": [
            {
                "status": "REQUESTED",
                "changed_at": now,
                "changed_by": actor_id,
                "reason": "Initial customer onboarding request",
            }
        ],
        "operational_flags": operational_flags or {
            "allow_multi_institution": customer_type in {"ENTERPRISE", "EDUCATION_GROUP"},
            "allow_shared_campuses": True,
        },
    }

    try:
        db.platform_tenants.insert_one(tenant_doc, session=session)
        tenant_doc.pop("_id", None)
    except DuplicateKeyError as exc:
        raise TenantValidationError(f"Tenant slug '{norm_slug}' is already registered in the platform.") from exc

    # Publish outbox event
    publish_event(
        event_type="TenantCreated",
        aggregate_type="TENANT",
        aggregate_id=tenant_id,
        tenant_id=tenant_id,
        payload={
            "tenant_id": tenant_id,
            "slug": norm_slug,
            "name": name,
            "customer_type": customer_type,
            "admin_email": admin_email,
            "status": "REQUESTED",
        },
        session=session,
        db=db,
    )

    return tenant_doc


def get_tenant_by_id(tenant_id: str, db=None) -> Dict[str, Any]:
    """Retrieves a tenant by its unique ID."""
    if db is None:
        db = get_db()
    tenant = db.platform_tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not tenant:
        raise TenantNotFoundError(f"Tenant with ID '{tenant_id}' does not exist.")
    return tenant


def get_tenant_by_slug(slug: str, db=None) -> Optional[Dict[str, Any]]:
    """Retrieves a tenant by its normalized slug."""
    if db is None:
        db = get_db()
    norm_slug = slug.strip().lower()
    return db.platform_tenants.find_one({"slug": norm_slug}, {"_id": 0})


def transition_tenant_status(
    tenant_id: str,
    new_status: str,
    reason: Optional[str] = None,
    actor_id: str = "system",
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Validates and transitions a tenant to a new lifecycle state."""
    if db is None:
        db = get_db()

    tenant = get_tenant_by_id(tenant_id, db=db)
    current_status = tenant["status"]

    if new_status not in VALID_TENANT_STATUSES:
        raise TenantValidationError(f"Invalid tenant status '{new_status}'.")

    if new_status == current_status:
        return tenant

    allowed = ALLOWED_STATUS_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise InvalidTenantStateTransitionError(
            f"Cannot transition tenant from '{current_status}' to '{new_status}'. Allowed transitions: {sorted(list(allowed))}"
        )

    now = datetime.now(timezone.utc)
    history_entry = {
        "status": new_status,
        "changed_at": now,
        "changed_by": actor_id,
        "reason": reason or f"Transition to {new_status}",
    }

    db.platform_tenants.update_one(
        {"id": tenant_id},
        {
            "$set": {
                "status": new_status,
                "updated_at": now,
            },
            "$push": {
                "status_history": history_entry,
            },
        },
        session=session,
    )

    # Publish outbox event
    publish_event(
        event_type="TenantStatusChanged",
        aggregate_type="TENANT",
        aggregate_id=tenant_id,
        tenant_id=tenant_id,
        payload={
            "tenant_id": tenant_id,
            "old_status": current_status,
            "new_status": new_status,
            "reason": reason,
            "changed_by": actor_id,
        },
        session=session,
        db=db,
    )

    return get_tenant_by_id(tenant_id, db=db)


def list_tenants(
    status: Optional[str] = None,
    customer_type: Optional[str] = None,
    limit: int = 50,
    db=None,
) -> List[Dict[str, Any]]:
    """Lists platform tenants with optional filtering."""
    if db is None:
        db = get_db()
    query = {}
    if status:
        query["status"] = status
    if customer_type:
        query["customer_type"] = customer_type

    return list(db.platform_tenants.find(query, {"_id": 0}).sort("created_at", -1).limit(limit))
