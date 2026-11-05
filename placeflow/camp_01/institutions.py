"""Institution Management Domain Service & Repository for CAMP-01.
Owns the principal educational and organizational identity boundary (ADR-C01-002).
"""

import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pymongo.client_session import ClientSession
from pymongo.errors import DuplicateKeyError
from database.connection import get_db
from camp_01.context import get_current_tenant_id
from camp_01.outbox import publish_event
from camp_01.tenants import get_tenant_by_id

VALID_INSTITUTION_STATUSES = {"DRAFT", "PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "ARCHIVED"}

ALLOWED_INSTITUTION_TRANSITIONS = {
    "DRAFT": {"PENDING_VERIFICATION", "ARCHIVED"},
    "PENDING_VERIFICATION": {"ACTIVE", "DRAFT", "ARCHIVED"},
    "ACTIVE": {"SUSPENDED", "ARCHIVED"},
    "SUSPENDED": {"ACTIVE", "ARCHIVED"},
    "ARCHIVED": set(),
}

CODE_REGEX = re.compile(r"^[A-Z0-9_-]+$")


class InstitutionValidationError(ValueError):
    """Raised when institutional data violates invariants."""
    pass


class InstitutionNotFoundError(LookupError):
    """Raised when an institution cannot be found within tenant scope."""
    pass


class InvalidInstitutionStateTransitionError(ValueError):
    """Raised when an illegal institutional lifecycle transition is requested."""
    pass


class InstitutionReadinessError(RuntimeError):
    """Raised when an institution cannot be activated due to failed readiness validation."""
    pass


def normalize_institution_code(code: str) -> str:
    """Normalizes institution code to uppercase alphanumeric with hyphens/underscores."""
    c = code.strip().upper()
    if not CODE_REGEX.match(c):
        raise InstitutionValidationError(
            f"Invalid institution code '{code}'. Must contain uppercase letters, numbers, hyphens or underscores."
        )
    if len(c) < 2 or len(c) > 80:
        raise InstitutionValidationError("Institution code must be between 2 and 80 characters.")
    return c


def create_institution(
    tenant_id: str,
    institution_code: str,
    legal_name: str,
    display_name: str,
    institution_type: str,
    classifications: Dict[str, str],
    short_name: Optional[str] = None,
    directory_entry_id: Optional[str] = None,
    timezone_name: str = "Asia/Kolkata",
    default_locale: str = "en-IN",
    contact_email: Optional[str] = None,
    phone_number: Optional[str] = None,
    website_url: Optional[str] = None,
    actor_id: str = "system",
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Registers a new institution in DRAFT status inside a tenant boundary."""
    if db is None:
        db = get_db()

    # Validate owning tenant exists
    tenant = get_tenant_by_id(tenant_id, db=db)
    if tenant["status"] in {"CLOSING", "CLOSED"}:
        raise InstitutionValidationError(f"Cannot register institution under a {tenant['status']} tenant.")

    norm_code = normalize_institution_code(institution_code)
    legal_name = legal_name.strip()
    display_name = display_name.strip()

    if len(legal_name) < 2:
        raise InstitutionValidationError("Legal registered name must be at least 2 characters.")
    if len(display_name) < 2:
        raise InstitutionValidationError("Display name must be at least 2 characters.")

    # Validate classifications
    required_class_keys = ["institution_kind", "ownership", "governance", "institutional_role", "delivery_model"]
    for k in required_class_keys:
        if k not in classifications:
            raise InstitutionValidationError(f"Missing required institutional classification: '{k}'.")

    institution_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    doc = {
        "tenant_id": tenant_id,
        "institution_id": institution_id,
        "institution_code": norm_code,
        "normalized_code": norm_code,
        "legal_name": legal_name,
        "display_name": display_name,
        "short_name": short_name.strip() if short_name else None,
        "institution_type": institution_type,
        "ownership_type": classifications.get("ownership"),
        "classifications": classifications,
        "directory_entry_id": directory_entry_id,
        "status": "DRAFT",
        "timezone": timezone_name,
        "default_locale": default_locale,
        "website_url": website_url,
        "contact_email": contact_email,
        "phone_number": phone_number,
        "created_at": now,
        "updated_at": now,
    }

    try:
        db.institutions.insert_one(doc, session=session)
        doc.pop("_id", None)
    except DuplicateKeyError as exc:
        raise InstitutionValidationError(
            f"Institution code '{norm_code}' is already registered within this tenant."
        ) from exc

    # Publish outbox event
    publish_event(
        event_type="InstitutionCreated",
        aggregate_type="INSTITUTION",
        aggregate_id=institution_id,
        tenant_id=tenant_id,
        payload={
            "institution_id": institution_id,
            "tenant_id": tenant_id,
            "institution_code": norm_code,
            "legal_name": legal_name,
            "display_name": display_name,
            "status": "DRAFT",
        },
        session=session,
        db=db,
    )

    return doc


def get_institution_by_id(tenant_id: str, institution_id: str, db=None) -> Dict[str, Any]:
    """Retrieves an institution within tenant scope."""
    if db is None:
        db = get_db()
    inst = db.institutions.find_one(
        {"tenant_id": tenant_id, "institution_id": institution_id},
        {"_id": 0},
    )
    if not inst:
        raise InstitutionNotFoundError(
            f"Institution with ID '{institution_id}' does not exist in tenant '{tenant_id}'."
        )
    return inst


def get_institution_by_code(tenant_id: str, code: str, db=None) -> Optional[Dict[str, Any]]:
    """Retrieves an institution by its normalized code within tenant scope."""
    if db is None:
        db = get_db()
    norm = normalize_institution_code(code)
    return db.institutions.find_one(
        {"tenant_id": tenant_id, "normalized_code": norm},
        {"_id": 0},
    )


def list_institutions(
    tenant_id: str,
    status: Optional[str] = None,
    limit: int = 50,
    db=None,
) -> List[Dict[str, Any]]:
    """Lists institutions scoped to tenant."""
    if db is None:
        db = get_db()
    q = {"tenant_id": tenant_id}
    if status:
        q["status"] = status
    return list(db.institutions.find(q, {"_id": 0}).sort("created_at", -1).limit(limit))


def evaluate_institution_readiness(tenant_id: str, institution_id: str, db=None) -> Dict[str, Any]:
    """Evaluates the 12-point institutional readiness checklist before activation (Section 12.3)."""
    if db is None:
        db = get_db()

    inst = get_institution_by_id(tenant_id, institution_id, db=db)
    tenant = get_tenant_by_id(tenant_id, db=db)

    checklist = []

    # 1. Legal Name
    has_legal_name = bool(inst.get("legal_name") and len(inst["legal_name"].strip()) >= 2)
    checklist.append({"criterion": "Legal registered name present", "passed": has_legal_name, "required": True})

    # 2. Display Name
    has_display_name = bool(inst.get("display_name") and len(inst["display_name"].strip()) >= 2)
    checklist.append({"criterion": "Display name present", "passed": has_display_name, "required": True})

    # 3. Unique Operational Code
    has_code = bool(inst.get("normalized_code"))
    checklist.append({"criterion": "Unique operational code", "passed": has_code, "required": True})

    # 4. Classifications Selected
    cls = inst.get("classifications", {})
    has_classes = all(k in cls for k in ["institution_kind", "ownership", "governance", "institutional_role", "delivery_model"])
    checklist.append({"criterion": "Multi-dimensional classifications configured", "passed": has_classes, "required": True})

    # 5. Owning Tenant is Active
    tenant_active = tenant.get("status") == "ACTIVE"
    checklist.append({"criterion": "Owning tenant is ACTIVE", "passed": tenant_active, "required": True})

    # 6. Contact Information Exists
    has_contact = bool(inst.get("contact_email") or inst.get("phone_number") or inst.get("website_url"))
    checklist.append({"criterion": "Institutional administrative contact details present", "passed": has_contact, "required": True})

    # 7. Timezone & Locale Valid
    has_tz = bool(inst.get("timezone") and inst.get("default_locale"))
    checklist.append({"criterion": "Timezone and locale defaults configured", "passed": has_tz, "required": True})

    # 8. Regulatory Identifier (AISHE/UGC/AICTE)
    id_count = db.institution_identifiers.count_documents({"tenant_id": tenant_id, "institution_id": institution_id})
    checklist.append({"criterion": "Official regulatory identifier registered", "passed": id_count >= 1, "required": True})

    # 9. Campus Requirement (skip if online-only)
    is_online = cls.get("delivery_model") == "ONLINE"
    campus_count = db.institution_campuses.count_documents({
        "tenant_id": tenant_id,
        "institution_id": institution_id,
        "status": "ACTIVE"
    })
    has_campus = is_online or campus_count >= 1
    checklist.append({"criterion": "Operational campus exists (waived for purely online)", "passed": has_campus, "required": True})

    # 10. Single Primary Campus Assigned
    primary_campus_count = db.institution_campuses.count_documents({
        "tenant_id": tenant_id,
        "institution_id": institution_id,
        "is_primary": True,
        "status": "ACTIVE",
        "valid_to": None,
    })
    has_primary_campus = is_online or primary_campus_count == 1
    checklist.append({"criterion": "Exactly one active primary campus designated", "passed": has_primary_campus, "required": True})

    # 11. Verification Record
    verif = db.verification_records.find_one({"tenant_id": tenant_id, "institution_id": institution_id, "status": "PASSED"})
    has_verification = bool(verif)
    checklist.append({"criterion": "Institutional identity verified by compliance", "passed": has_verification, "required": False})

    # 12. Directory Match (Informational)
    has_dir = bool(inst.get("directory_entry_id"))
    checklist.append({"criterion": "Public institutional directory reference linked", "passed": has_dir, "required": False})

    required_passed = all(item["passed"] for item in checklist if item["required"])

    return {
        "institution_id": institution_id,
        "tenant_id": tenant_id,
        "is_ready_for_activation": required_passed,
        "checklist": checklist,
        "failed_criteria": [c["criterion"] for c in checklist if not c["passed"] and c["required"]],
    }


def submit_institution_for_verification(
    tenant_id: str,
    institution_id: str,
    notes: Optional[str] = None,
    actor_id: str = "system",
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Transitions a DRAFT institution to PENDING_VERIFICATION."""
    if db is None:
        db = get_db()

    inst = get_institution_by_id(tenant_id, institution_id, db=db)
    if inst["status"] != "DRAFT":
        raise InvalidInstitutionStateTransitionError(
            f"Cannot submit institution in '{inst['status']}' state for verification. Must be 'DRAFT'."
        )

    now = datetime.now(timezone.utc)
    db.institutions.update_one(
        {"tenant_id": tenant_id, "institution_id": institution_id},
        {"$set": {"status": "PENDING_VERIFICATION", "updated_at": now}},
        session=session,
    )

    # Record verification request
    rec_id = str(uuid.uuid4())
    db.verification_records.insert_one(
        {
            "record_id": rec_id,
            "tenant_id": tenant_id,
            "institution_id": institution_id,
            "verification_type": "INITIAL_ONBOARDING",
            "status": "PENDING",
            "notes": notes,
            "verified_by": None,
            "verified_at": None,
            "checklist_results": {},
            "created_at": now,
        },
        session=session,
    )

    publish_event(
        event_type="InstitutionSubmittedForVerification",
        aggregate_type="INSTITUTION",
        aggregate_id=institution_id,
        tenant_id=tenant_id,
        payload={"institution_id": institution_id, "status": "PENDING_VERIFICATION"},
        session=session,
        db=db,
    )

    return get_institution_by_id(tenant_id, institution_id, db=db)


def record_verification_decision(
    tenant_id: str,
    institution_id: str,
    passed: bool,
    verified_by: str,
    notes: Optional[str] = None,
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Records formal verification audit decision for an institution."""
    if db is None:
        db = get_db()
    now = datetime.now(timezone.utc)
    status_str = "PASSED" if passed else "FAILED"

    db.verification_records.update_one(
        {"tenant_id": tenant_id, "institution_id": institution_id, "status": "PENDING"},
        {
            "$set": {
                "status": status_str,
                "verified_by": verified_by,
                "verified_at": now,
                "notes": notes,
            }
        },
        session=session,
    )
    return {"status": status_str, "verified_at": now}


def activate_institution(
    tenant_id: str,
    institution_id: str,
    actor_id: str = "system",
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Activates an institution, strictly enforcing the 12-point readiness validation gate."""
    if db is None:
        db = get_db()

    inst = get_institution_by_id(tenant_id, institution_id, db=db)
    if inst["status"] not in {"PENDING_VERIFICATION", "SUSPENDED"}:
        raise InvalidInstitutionStateTransitionError(
            f"Cannot activate institution in '{inst['status']}' state. Must be PENDING_VERIFICATION or SUSPENDED."
        )

    # Evaluate readiness
    readiness = evaluate_institution_readiness(tenant_id, institution_id, db=db)
    if not readiness["is_ready_for_activation"]:
        raise InstitutionReadinessError(
            f"Institution readiness gate failed. Unmet criteria: {', '.join(readiness['failed_criteria'])}"
        )

    now = datetime.now(timezone.utc)
    db.institutions.update_one(
        {"tenant_id": tenant_id, "institution_id": institution_id},
        {"$set": {"status": "ACTIVE", "updated_at": now}},
        session=session,
    )

    publish_event(
        event_type="InstitutionActivated",
        aggregate_type="INSTITUTION",
        aggregate_id=institution_id,
        tenant_id=tenant_id,
        payload={"institution_id": institution_id, "status": "ACTIVE", "activated_by": actor_id},
        session=session,
        db=db,
    )

    return get_institution_by_id(tenant_id, institution_id, db=db)


# Institutional Identifiers Management
def add_institution_identifier(
    tenant_id: str,
    institution_id: str,
    scheme: str,
    value: str,
    issuer: Optional[str] = None,
    valid_from: Optional[datetime] = None,
    valid_to: Optional[datetime] = None,
    evidence_document_id: Optional[str] = None,
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Registers an official regulatory identifier for an institution."""
    if db is None:
        db = get_db()

    # Verify institution exists
    get_institution_by_id(tenant_id, institution_id, db=db)

    val = value.strip().upper()
    now = datetime.now(timezone.utc)
    from_date = valid_from or now

    if valid_to and valid_to <= from_date:
        raise InstitutionValidationError("Identifier validity end date must be after start date.")

    identifier_id = str(uuid.uuid4())
    doc = {
        "identifier_id": identifier_id,
        "tenant_id": tenant_id,
        "institution_id": institution_id,
        "scheme": scheme,
        "value": val,
        "issuer": issuer,
        "valid_from": from_date,
        "valid_to": valid_to,
        "verification_status": "SUBMITTED",
        "evidence_document_id": evidence_document_id,
        "verified_by": None,
        "verified_at": None,
        "created_at": now,
    }

    try:
        db.institution_identifiers.insert_one(doc, session=session)
        doc.pop("_id", None)
    except DuplicateKeyError as exc:
        raise InstitutionValidationError(
            f"Identifier {scheme}:{val} already registered for this institution."
        ) from exc

    return doc


def list_institution_identifiers(tenant_id: str, institution_id: str, db=None) -> List[Dict[str, Any]]:
    """Lists official identifiers registered for an institution."""
    if db is None:
        db = get_db()
    return list(db.institution_identifiers.find({"tenant_id": tenant_id, "institution_id": institution_id}, {"_id": 0}))
