"""Person Identity Registry Domain Service for CAMP-02 (ADR-C02-001).
Maintains durable human identities decoupled from login accounts and institutional memberships.
"""

import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pymongo.errors import DuplicateKeyError
from database.connection import get_db
from camp_01.outbox import publish_event

EMAIL_REGEX = re.compile(r"^[^@]+@[^@]+\.[^@]+$")


class IdentityValidationError(ValueError):
    """Raised when identity input fails validation rules."""
    pass


class IdentityNotFoundError(LookupError):
    """Raised when a person identity cannot be found."""
    pass


class DuplicateIdentityError(ValueError):
    """Raised when an identity conflicts with an existing person record."""
    pass


DuplicateIdentifierError = DuplicateIdentityError
DuplicatePersonError = DuplicateIdentityError


def normalize_email(email: str) -> str:
    """Normalizes an email address to lowercase stripped form."""
    e = email.strip().lower()
    if not EMAIL_REGEX.match(e):
        raise IdentityValidationError(f"Invalid email format: '{email}'.")
    return e


def create_person_identity(
    primary_email: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    legal_first_name: Optional[str] = None,
    legal_last_name: Optional[str] = None,
    middle_name: Optional[str] = None,
    primary_phone: Optional[str] = None,
    date_of_birth: Optional[str] = None,
    gender: Optional[str] = None,
    national_identifiers: Optional[List[Dict[str, Any]]] = None,
    metadata: Optional[Dict[str, Any]] = None,
    tenant_id: Optional[str] = None,
    *args,
    db=None,
    **kwargs,
) -> Dict[str, Any]:
    """Creates a new authoritative human person identity."""
    if db is None:
        db = get_db()

    # Handle flexible positional invocation: (tenant_id, first_name, last_name, dob, gender, email)
    if primary_email and "@" not in primary_email and len(args) >= 4:
        # primary_email was actually tenant_id
        tenant_id = primary_email
        f_name = first_name or ""
        l_name = last_name or ""
        date_of_birth = args[0] if len(args) > 0 else date_of_birth
        gender = args[1] if len(args) > 1 else gender
        actual_email = args[2] if len(args) > 2 else kwargs.get("primary_email", "")
        norm_email = normalize_email(actual_email)
    else:
        norm_email = normalize_email(primary_email or kwargs.get("primary_email", ""))
        f_name = (legal_first_name or first_name or "").strip()
        l_name = (legal_last_name or last_name or "").strip()

    if not f_name:
        raise IdentityValidationError("First name must not be empty.")
    if not l_name:
        raise IdentityValidationError("Last name must not be empty.")

    # Check for existing email conflict
    if db.person_identities.find_one({"primary_email": norm_email}):
        raise DuplicateIdentityError(f"Person identity with email '{norm_email}' already exists.")

    person_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    display_name = f"{f_name} {l_name}"

    formatted_identifiers = []
    if national_identifiers:
        for ident in national_identifiers:
            scheme = ident.get("scheme", "OTHER").upper()
            val = str(ident.get("identifier_value", "")).strip()
            if not val:
                continue
            # Check national identifier duplicate across other persons
            conflict = db.person_identities.find_one({
                "national_identifiers.scheme": scheme,
                "national_identifiers.identifier_value": val,
            })
            if conflict:
                raise DuplicateIdentityError(
                    f"National identifier '{scheme}:{val}' is already bound to person '{conflict['person_id']}'."
                )

            formatted_identifiers.append({
                "scheme": scheme,
                "identifier_value": val,
                "is_verified": bool(ident.get("is_verified", False)),
                "verified_at": now if ident.get("is_verified") else None,
            })

    doc = {
        "person_id": person_id,
        "primary_email": norm_email,
        "primary_phone": primary_phone.strip() if primary_phone else None,
        "first_name": f_name,
        "middle_name": middle_name.strip() if middle_name else None,
        "last_name": l_name,
        "display_name": display_name,
        "date_of_birth": date_of_birth,
        "gender": gender,
        "status": "ACTIVE",
        "merged_into_person_id": None,
        "national_identifiers": formatted_identifiers,
        "metadata": metadata or {},
        "created_at": now,
        "updated_at": now,
    }

    try:
        db.person_identities.insert_one(doc)
        doc.pop("_id", None)
    except DuplicateKeyError as e:
        raise DuplicateIdentityError(f"Person identity duplicate key collision: {e}") from e

    publish_event(
        event_type="PersonIdentityCreated",
        aggregate_type="PERSON_IDENTITY",
        aggregate_id=person_id,
        tenant_id="global",
        payload={
            "person_id": person_id,
            "primary_email": norm_email,
            "display_name": display_name,
            "status": "ACTIVE",
        },
        db=db,
    )

    return doc


def get_person_by_id(person_id: str, db=None) -> Dict[str, Any]:
    """Retrieves a person identity record by ID."""
    if db is None:
        db = get_db()
    person = db.person_identities.find_one({"person_id": person_id}, {"_id": 0})
    if not person:
        raise IdentityNotFoundError(f"Person identity '{person_id}' not found.")
    return person


get_person_identity = get_person_by_id


def get_person_by_email(email: str, db=None) -> Optional[Dict[str, Any]]:
    """Retrieves a person identity by primary email."""
    if db is None:
        db = get_db()
    norm_email = email.strip().lower()
    return db.person_identities.find_one({"primary_email": norm_email}, {"_id": 0})


def find_persons_by_national_id(scheme: str, value: str, db=None) -> List[Dict[str, Any]]:
    """Finds Person documents matching a specific national identifier scheme and value."""
    if db is None:
        db = get_db()
    scheme = scheme.upper().strip()
    val = value.strip().upper() if scheme in {"PAN", "PASSPORT"} else value.strip()
    cursor = db.person_identities.find(
        {"national_identifiers": {"$elemMatch": {"scheme": scheme, "identifier_value": val}}},
        {"_id": 0},
    )
    return list(cursor)


def add_national_identifier(
    person_id: str,
    scheme: str,
    identifier_value: Optional[str] = None,
    value: Optional[str] = None,
    issuer: Optional[str] = None,
    is_verified: bool = False,
    db=None,
) -> Dict[str, Any]:
    """Appends or updates a national identifier on an existing person identity."""
    if db is None:
        db = get_db()

    actual_val = (identifier_value or value or "").strip()
    if not actual_val:
        raise IdentityValidationError("Identifier value cannot be empty.")

    scheme = scheme.upper().strip()
    # Validation per scheme
    if scheme == "APAAR":
        if not (actual_val.isdigit() and len(actual_val) == 12):
            raise IdentityValidationError(f"Invalid APAAR/ABC ID '{actual_val}'. Must be exactly 12 digits.")
    elif scheme == "PAN":
        import re
        if not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]$", actual_val):
            raise IdentityValidationError(f"Invalid PAN format '{actual_val}'. Expected 5 letters, 4 digits, 1 letter.")

    person = get_person_by_id(person_id, db=db)

    # Check for collision
    conflict = db.person_identities.find_one({
        "person_id": {"$ne": person_id},
        "national_identifiers.scheme": scheme,
        "national_identifiers.identifier_value": actual_val,
    })
    if conflict:
        raise DuplicateIdentityError(f"Identifier '{scheme}:{actual_val}' is already registered to another person.")

    now = datetime.now(timezone.utc)
    # Filter out existing with same scheme
    idents = [i for i in person.get("national_identifiers", []) if i.get("scheme") != scheme]
    idents.append({
        "scheme": scheme,
        "identifier_value": actual_val,
        "value": actual_val,
        "issuer": issuer,
        "is_verified": is_verified,
        "verified_at": now if is_verified else None,
    })

    db.person_identities.update_one(
        {"person_id": person_id},
        {"$set": {"national_identifiers": idents, "updated_at": now}},
    )

    return get_person_by_id(person_id, db=db)


def merge_person_identities(
    source_person_id: str,
    target_person_id: str,
    reason: str,
    actor_id: str = "system",
    operator_id: Optional[str] = None,
    db=None,
) -> Dict[str, Any]:
    """Merges a duplicate source person into target person, updating status to MERGED."""
    if db is None:
        db = get_db()

    actual_actor = operator_id or actor_id

    if source_person_id == target_person_id:
        raise IdentityValidationError("Cannot merge a person into themselves.")

    source = get_person_by_id(source_person_id, db=db)
    target = get_person_by_id(target_person_id, db=db)

    now = datetime.now(timezone.utc)
    # Merge national identifiers
    target_schemes = {i.get("scheme") for i in target.get("national_identifiers", [])}
    merged_idents = list(target.get("national_identifiers", []))
    for i in source.get("national_identifiers", []):
        if i.get("scheme") not in target_schemes:
            merged_idents.append(i)
            target_schemes.add(i.get("scheme"))

    db.person_identities.update_one(
        {"person_id": target_person_id},
        {"$set": {"national_identifiers": merged_idents, "updated_at": now}},
    )

    db.person_identities.update_one(
        {"person_id": source_person_id},
        {
            "$set": {
                "status": "MERGED",
                "merged_into_person_id": target_person_id,
                "updated_at": now,
            }
        },
    )

    publish_event(
        event_type="PersonIdentitiesMerged",
        aggregate_type="PERSON_IDENTITY",
        aggregate_id=source_person_id,
        tenant_id="global",
        payload={
            "source_person_id": source_person_id,
            "target_person_id": target_person_id,
            "reason": reason,
            "merged_by": actual_actor,
        },
        db=db,
    )

    return get_person_by_id(target_person_id, db=db)
