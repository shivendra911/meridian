"""Institution Groups (Trusts/Societies) and Inter-Institutional Relationships for CAMP-01.
Models multi-institution governance and affiliations (ADR-C01-004, ADR-C01-008).
"""

import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pymongo.client_session import ClientSession
from pymongo.errors import DuplicateKeyError
from database.connection import get_db
from camp_01.outbox import publish_event
from camp_01.institutions import get_institution_by_id

CODE_REGEX = re.compile(r"^[A-Z0-9_-]+$")

VALID_GROUP_TYPES = {"TRUST", "SOCIETY", "EDUCATIONAL_GROUP", "CONSORTIUM", "NETWORK"}
VALID_MEMBERSHIP_TYPES = {"OWNED", "MANAGED", "OPERATED", "ASSOCIATED"}
VALID_RELATIONSHIP_TYPES = {
    "AFFILIATED_TO", "CONSTITUENT_OF", "MANAGED_BY",
    "PART_OF_GROUP", "MERGED_INTO", "SUCCESSOR_TO", "COLLABORATES_WITH"
}


class GroupValidationError(ValueError):
    """Raised when group or affiliation data fails validation."""
    pass


class GroupNotFoundError(LookupError):
    """Raised when an institution group is not found."""
    pass


def normalize_group_code(code: str) -> str:
    """Normalizes group code."""
    c = code.strip().upper()
    if not CODE_REGEX.match(c):
        raise GroupValidationError(
            f"Invalid group code '{code}'. Must contain uppercase letters, numbers, hyphens or underscores."
        )
    return c


def create_institution_group(
    tenant_id: str,
    group_code: str,
    group_name: str,
    group_type: str = "TRUST",
    description: Optional[str] = None,
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Creates an education group, trust, or consortium within tenant scope."""
    if db is None:
        db = get_db()

    norm_code = normalize_group_code(group_code)
    name = group_name.strip()
    if len(name) < 2:
        raise GroupValidationError("Group name must be at least 2 characters.")

    if group_type not in VALID_GROUP_TYPES:
        raise GroupValidationError(f"Invalid group type '{group_type}'.")

    group_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    doc = {
        "group_id": group_id,
        "tenant_id": tenant_id,
        "group_code": norm_code,
        "normalized_code": norm_code,
        "group_name": name,
        "group_type": group_type,
        "status": "ACTIVE",
        "description": description,
        "created_at": now,
    }

    try:
        db.institution_groups.insert_one(doc, session=session)
        doc.pop("_id", None)
    except DuplicateKeyError as exc:
        raise GroupValidationError(f"Group code '{norm_code}' already exists in this tenant.") from exc

    return doc


def get_institution_group_by_id(tenant_id: str, group_id: str, db=None) -> Dict[str, Any]:
    """Retrieves an institution group by ID."""
    if db is None:
        db = get_db()
    g = db.institution_groups.find_one({"tenant_id": tenant_id, "group_id": group_id}, {"_id": 0})
    if not g:
        raise GroupNotFoundError(f"Institution group '{group_id}' not found.")
    return g


def add_institution_group_membership(
    tenant_id: str,
    group_id: str,
    institution_id: str,
    membership_type: str = "OWNED",
    valid_from: Optional[datetime] = None,
    valid_to: Optional[datetime] = None,
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Assigns an institution to a group.

    Invariant: Group membership never grants automatic data access (ADR-C01-008).
    """
    if db is None:
        db = get_db()

    get_institution_group_by_id(tenant_id, group_id, db=db)
    get_institution_by_id(tenant_id, institution_id, db=db)

    if membership_type not in VALID_MEMBERSHIP_TYPES:
        raise GroupValidationError(f"Invalid membership type '{membership_type}'.")

    now = datetime.now(timezone.utc)
    from_date = valid_from or now

    membership_id = str(uuid.uuid4())
    doc = {
        "membership_id": membership_id,
        "tenant_id": tenant_id,
        "group_id": group_id,
        "institution_id": institution_id,
        "membership_type": membership_type,
        "valid_from": from_date,
        "valid_to": valid_to,
        "status": "ACTIVE",
        "created_at": now,
    }

    try:
        db.institution_group_memberships.insert_one(doc, session=session)
        doc.pop("_id", None)
    except DuplicateKeyError as exc:
        raise GroupValidationError(f"Institution '{institution_id}' is already a member of group '{group_id}'.") from exc

    publish_event(
        event_type="InstitutionGroupMembershipChanged",
        aggregate_type="INSTITUTION",
        aggregate_id=institution_id,
        tenant_id=tenant_id,
        payload={
            "group_id": group_id,
            "institution_id": institution_id,
            "membership_type": membership_type,
            "status": "ACTIVE",
        },
        session=session,
        db=db,
    )

    return doc


def list_group_members(tenant_id: str, group_id: str, db=None) -> List[Dict[str, Any]]:
    """Lists institutions belonging to a group."""
    if db is None:
        db = get_db()
    return list(db.institution_group_memberships.find({"tenant_id": tenant_id, "group_id": group_id, "status": "ACTIVE"}, {"_id": 0}))


def record_institution_relationship(
    tenant_id: str,
    source_institution_id: str,
    target_type: str,
    target_id: str,
    relationship_type: str,
    valid_from: Optional[datetime] = None,
    valid_to: Optional[datetime] = None,
    authority_reference: Optional[str] = None,
    evidence_document_id: Optional[str] = None,
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Records formal institutional affiliation, merger, or succession."""
    if db is None:
        db = get_db()

    get_institution_by_id(tenant_id, source_institution_id, db=db)

    if target_type not in {"INTERNAL", "EXTERNAL_DIRECTORY"}:
        raise GroupValidationError(f"Invalid target_type: {target_type}")

    if relationship_type not in VALID_RELATIONSHIP_TYPES:
        raise GroupValidationError(f"Invalid relationship_type: {relationship_type}")

    now = datetime.now(timezone.utc)
    from_date = valid_from or now

    rel_id = str(uuid.uuid4())
    doc = {
        "relationship_id": rel_id,
        "tenant_id": tenant_id,
        "source_institution_id": source_institution_id,
        "target_type": target_type,
        "target_id": target_id,
        "relationship_type": relationship_type,
        "valid_from": from_date,
        "valid_to": valid_to,
        "verification_status": "VERIFIED" if target_type == "EXTERNAL_DIRECTORY" else "UNVERIFIED",
        "authority_reference": authority_reference,
        "evidence_document_id": evidence_document_id,
        "created_at": now,
    }

    db.institution_relationships.insert_one(doc, session=session)
    doc.pop("_id", None)

    publish_event(
        event_type="InstitutionRelationshipRecorded",
        aggregate_type="INSTITUTION",
        aggregate_id=source_institution_id,
        tenant_id=tenant_id,
        payload={
            "source_institution_id": source_institution_id,
            "target_id": target_id,
            "relationship_type": relationship_type,
        },
        session=session,
        db=db,
    )

    return doc


def list_institution_relationships(
    tenant_id: str,
    institution_id: str,
    db=None,
) -> List[Dict[str, Any]]:
    """Lists relationships for an institution."""
    if db is None:
        db = get_db()
    return list(db.institution_relationships.find({"tenant_id": tenant_id, "source_institution_id": institution_id}, {"_id": 0}))
