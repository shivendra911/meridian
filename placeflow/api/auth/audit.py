"""PlaceFlow / Meridian — Security Audit Trail Engine (Phase 3).

Records authoritative logs for access denials and sensitive administrative allows.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from database.connection import get_db


def audit_log(
    event_type: str,
    principal: Any = None,
    permission: Optional[str] = None,
    path: Optional[str] = None,
    method: Optional[str] = None,
    decision: str = "DENIED",
    reason_code: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    db=None,
) -> None:
    """Idempotently logs security decisions into auth_audit_log collection."""
    try:
        if db is None:
            db = get_db()

        now = datetime.now(timezone.utc)
        account_id = getattr(principal, "account_id", None) if principal else None
        person_id = getattr(principal, "person_id", None) if principal else None
        tenant_id = getattr(principal, "tenant_id", None) if principal else None

        doc = {
            "event_type": event_type,
            "decision": decision,
            "account_id": account_id,
            "person_id": person_id,
            "tenant_id": tenant_id,
            "permission": permission,
            "path": path,
            "method": method,
            "reason_code": reason_code,
            "details": details or {},
            "timestamp": now,
        }
        db.auth_audit_log.insert_one(doc)
    except Exception:
        # Non-blocking: audit failure must not crash the primary request pipeline
        pass

