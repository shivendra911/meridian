"""
camp_02/notify.py — Notification Producer System.
Creates authoritative in-app notification records adhering strictly to MongoDB schemas.
"""

from datetime import datetime, timezone
import uuid
from typing import Optional, List, Dict, Any
from database.connection import get_db


def notify(
    person_id: str,
    kind: str,
    title: str,
    body: str,
    link: Optional[str] = None,
    tenant_id: Optional[str] = None,
    db=None,
) -> Optional[Dict[str, Any]]:
    """
    Produces an authoritative notification in MongoDB matching database validation schemas.
    """
    if not person_id:
        return None

    if db is None:
        db = get_db()

    # Resolve tenant_id if missing
    if not tenant_id:
        person = db.person_identities.find_one({"person_id": person_id}, {"tenant_id": 1})
        tenant_id = (person or {}).get("tenant_id") or "tenant_default"

    notification_id = f"notif_{uuid.uuid4().hex[:12]}"
    created_at = datetime.now(timezone.utc)

    doc: Dict[str, Any] = {
        "notification_id": notification_id,
        "tenant_id": tenant_id,
        "person_id": person_id,
        "kind": kind.upper(),
        "title": title,
        "body": body,
        "link": link or "",
        "created_at": created_at,
        "read_at": None,
    }

    try:
        db.notifications.insert_one(doc)
        return doc
    except Exception as exc:
        # In case of validation or insertion error, log cleanly
        import logging
        logging.getLogger(__name__).warning("Failed creating notification for %s: %s", person_id, exc)
        return None


def get_person_id_for_student(student_id: str, db=None) -> Optional[str]:
    """Resolves authoritative person_id from student_id."""
    if not student_id:
        return None
    if db is None:
        db = get_db()

    stu = db.students.find_one({"student_id": student_id}, {"person_id": 1})
    if stu and stu.get("person_id"):
        return stu["person_id"]

    aff = db.person_affiliations.find_one({"type": "STUDENT", "record_id": student_id}, {"person_id": 1})
    if aff and aff.get("person_id"):
        return aff["person_id"]

    # Fallback convention PER_STU_xxx or per_<student_id>
    return f"per_{student_id.lower()}"


def get_tpo_person_ids(tenant_id: str = "tenant_default", db=None) -> List[str]:
    """Finds all person_ids belonging to active TPO officers."""
    if db is None:
        db = get_db()

    tpo_role_ids = ["role_sys_tpo_admin", "role_sys_tpo_coordinator"]
    assigns = list(db.role_assignments.find({
        "role_id": {"$in": tpo_role_ids},
        "status": "ACTIVE"
    }, {"account_id": 1}))

    acc_ids = [a["account_id"] for a in assigns if a.get("account_id")]
    if not acc_ids:
        # Fallback to known TPO accounts
        accs = list(db.accounts.find({"username": {"$in": ["tpo", "admin", "tpo_admin"]}}, {"person_id": 1}))
        return [a["person_id"] for a in accs if a.get("person_id")]

    accs = list(db.accounts.find({"account_id": {"$in": acc_ids}}, {"person_id": 1}))
    person_ids = [a["person_id"] for a in accs if a.get("person_id")]
    if not person_ids:
        # Check person_affiliations
        affs = list(db.person_affiliations.find({"type": "TPO"}, {"person_id": 1}))
        person_ids = [a["person_id"] for a in affs if a.get("person_id")]

    return person_ids or ["per_tpo_admin"]

