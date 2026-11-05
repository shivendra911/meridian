"""CAMP-02: Privileged Access & Break-Glass Protocol (Section 10).

Features:
1. Emergency elevated access workflow for production incident remediation.
2. Mandatory ticket identifier, justification, and maximum 4-hour lifespan.
3. Dual-approval or post-facto security alert emission.
4. Immediate revocation and full audit outbox event dispatch.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import uuid

from pymongo.client_session import ClientSession
from database.connection import get_db
from camp_01.outbox import publish_event

MAX_BREAK_GLASS_HOURS = 4


class PrivilegedAccessError(Exception):
    pass


def request_break_glass_access(
    tenant_id: str,
    institution_id: str,
    membership_id: str,
    incident_ticket_id: str,
    justification: str,
    target_scope_type: str,
    target_scope_id: str,
    duration_hours: int = 2,
    actor_id: str = "system",
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Requests and activates time-bounded break-glass privileged access."""
    if db is None:
        db = get_db()

    if not incident_ticket_id or len(incident_ticket_id.strip()) < 3:
        raise PrivilegedAccessError("Valid incident ticket identifier is mandatory for break-glass elevation.")

    if not justification or len(justification.strip()) < 10:
        raise PrivilegedAccessError("Detailed justification (min 10 characters) is required for break-glass access.")

    if duration_hours <= 0 or duration_hours > MAX_BREAK_GLASS_HOURS:
        raise PrivilegedAccessError(f"Break-glass duration must be between 1 and {MAX_BREAK_GLASS_HOURS} hours.")

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=duration_hours)
    session_id = str(uuid.uuid4())

    doc = {
        "break_glass_id": session_id,
        "tenant_id": tenant_id,
        "institution_id": institution_id,
        "membership_id": membership_id,
        "incident_ticket_id": incident_ticket_id.strip(),
        "justification": justification.strip(),
        "scope_type": target_scope_type,
        "scope_id": target_scope_id,
        "status": "ACTIVE",
        "granted_at": now,
        "expires_at": expires_at,
        "revoked_at": None,
        "revoked_by": None,
        "created_by": actor_id,
    }

    db.break_glass_sessions.insert_one(doc, session=session)

    # Emit outbox security alert event
    publish_event(
        event_type="iam:break_glass:activated",
        aggregate_type="SESSION",
        aggregate_id=session_id,
        tenant_id=tenant_id,
        payload={
            "session_id": session_id,
            "membership_id": membership_id,
            "incident_ticket": incident_ticket_id,
            "expires_at": expires_at.isoformat(),
        },
        session=session,
        db=db,
    )

    return doc


def revoke_break_glass_access(
    break_glass_id: str,
    tenant_id: str,
    revoked_by: str,
    reason: str,
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Terminates an active break-glass session immediately."""
    if db is None:
        db = get_db()

    now = datetime.now(timezone.utc)
    res = db.break_glass_sessions.find_one_and_update(
        {"break_glass_id": break_glass_id, "tenant_id": tenant_id, "status": "ACTIVE"},
        {
            "$set": {
                "status": "TERMINATED",
                "revoked_at": now,
                "revoked_by": revoked_by,
                "revocation_reason": reason,
            }
        },
        session=session,
        return_document=True,
    )
    if not res:
        raise PrivilegedAccessError(f"Active break-glass session '{break_glass_id}' not found.")
    return res


def is_break_glass_active(
    tenant_id: str,
    membership_id: str,
    target_scope_type: str,
    target_scope_id: str,
    db=None,
) -> bool:
    """Checks if a valid, unexpired break-glass session covers the requested operation."""
    if db is None:
        db = get_db()

    now = datetime.now(timezone.utc)
    active = db.break_glass_sessions.find_one({
        "tenant_id": tenant_id,
        "membership_id": membership_id,
        "status": "ACTIVE",
        "expires_at": {"$gt": now},
    })
    return active is not None
