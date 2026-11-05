"""CAMP-02: Session Security & Real-Time Invalidation Engine (Section 11).

Features:
1. Session state lifecycle: ACTIVE -> REVOKED | EXPIRED.
2. SHA-256 token hashing, device fingerprinting, and IP tracking.
3. Event-driven revocation triggers:
   - Account lock/password change -> terminate all active sessions.
   - Membership suspension/termination -> terminate all sessions for that membership.
   - Administrative kill switch.
"""

from datetime import datetime, timedelta, timezone
import hashlib
import secrets
from typing import Any, Dict, List, Optional
import uuid

from pymongo.client_session import ClientSession
from database.connection import get_db
from camp_01.outbox import publish_event

DEFAULT_SESSION_LIFESPAN_HOURS = 24


class SessionError(Exception):
    pass


def create_auth_session(
    account_id: str,
    tenant_id: Optional[str] = None,
    institution_id: Optional[str] = None,
    device_fingerprint: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    auth_assurance: str = "AAL2_PASSWORD_MFA",
    lifespan_hours: int = DEFAULT_SESSION_LIFESPAN_HOURS,
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Issues a new secure authentication session returning the raw session token and session record."""
    if db is None:
        db = get_db()

    raw_token = f"sess_{secrets.token_urlsafe(32)}"
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=lifespan_hours)

    doc = {
        "session_id": session_id,
        "account_id": account_id,
        "tenant_id": tenant_id,
        "institution_id": institution_id,
        "token_hash": token_hash,
        "device_fingerprint": device_fingerprint,
        "ip_address": ip_address,
        "user_agent": user_agent,
        "status": "ACTIVE",
        "auth_assurance": auth_assurance,
        "created_at": now,
        "last_activity_at": now,
        "expires_at": expires_at,
        "revoked_at": None,
    }

    db.auth_sessions.insert_one(doc, session=session)

    # Return doc with raw token for client cookie/header injection
    res = dict(doc)
    res["raw_token"] = raw_token
    return res


def validate_session(raw_token: str, db=None) -> Optional[Dict[str, Any]]:
    """Validates an active session token, returning the session doc if valid."""
    if db is None:
        db = get_db()

    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    now = datetime.now(timezone.utc)

    sess = db.auth_sessions.find_one({
        "token_hash": token_hash,
        "status": "ACTIVE",
        "expires_at": {"$gt": now},
    })
    if not sess:
        return None

    # Slide activity timestamp
    db.auth_sessions.update_one(
        {"session_id": sess["session_id"]},
        {"$set": {"last_activity_at": now}},
    )
    return sess


def revoke_session(session_id: str, reason: str = "logout", session: Optional[ClientSession] = None, db=None) -> bool:
    """Terminates an individual active session."""
    if db is None:
        db = get_db()

    now = datetime.now(timezone.utc)
    res = db.auth_sessions.update_one(
        {"session_id": session_id, "status": "ACTIVE"},
        {"$set": {"status": "REVOKED", "revoked_at": now, "revocation_reason": reason}},
        session=session,
    )
    return res.modified_count > 0


def revoke_all_account_sessions(account_id: str, except_session_id: Optional[str] = None, reason: str = "security_reset", db=None) -> int:
    """Terminates all active sessions for an account (e.g., password change or lockout)."""
    if db is None:
        db = get_db()

    now = datetime.now(timezone.utc)
    query: Dict[str, Any] = {"account_id": account_id, "status": "ACTIVE"}
    if except_session_id:
        query["session_id"] = {"$ne": except_session_id}

    res = db.auth_sessions.update_many(
        query,
        {"$set": {"status": "REVOKED", "revoked_at": now, "revocation_reason": reason}},
    )
    return res.modified_count

