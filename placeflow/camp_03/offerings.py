"""Program Offerings & Delivery Service for CAMP-03.

Manages campus-specific delivery instances, shifts (Morning/Evening),
sanctioned intake quotas, and program specializations.
"""

from datetime import datetime, timezone
import uuid
from typing import Dict, Any, List, Optional
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from camp_03.programs import get_program_version


class OfferingNotFoundError(Exception):
    pass


class DuplicateOfferingError(Exception):
    pass


class InvalidOfferingStateTransitionError(Exception):
    pass


class OfferingValidationError(Exception):
    pass


OFFERING_STATUS_TRANSITIONS = {
    "PLANNED": {"ADMISSIONS_OPEN", "CANCELLED"},
    "ADMISSIONS_OPEN": {"ADMISSIONS_CLOSED", "ACTIVE", "CANCELLED"},
    "ADMISSIONS_CLOSED": {"ADMISSIONS_OPEN", "ACTIVE", "CANCELLED"},
    "ACTIVE": {"CONCLUDED", "CANCELLED"},
    "CONCLUDED": set(),
    "CANCELLED": set(),
}


def create_program_offering(
    db: Database,
    program_version_id: str,
    campus_id: str,
    academic_year: str,
    shift: str = "REGULAR_MORNING",
    sanctioned_intake: int = 60,
    supernumerary_quota: int = 6,
    status: str = "PLANNED",
    metadata: Optional[Dict[str, Any]] = None,
    offering_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Instantiate a concrete delivery instance of an approved curriculum on a campus."""
    pv = get_program_version(db, program_version_id)

    valid_shifts = {"REGULAR_MORNING", "AFTERNOON", "EVENING", "FLEXIBLE"}
    if shift not in valid_shifts:
        raise OfferingValidationError(
            f"Invalid shift: '{shift}'. Must be one of {valid_shifts}"
        )

    if sanctioned_intake <= 0:
        raise OfferingValidationError("sanctioned_intake must be greater than zero")
    if supernumerary_quota < 0:
        raise OfferingValidationError("supernumerary_quota cannot be negative")

    valid_statuses = {
        "PLANNED",
        "ADMISSIONS_OPEN",
        "ADMISSIONS_CLOSED",
        "ACTIVE",
        "CONCLUDED",
        "CANCELLED",
    }
    if status not in valid_statuses:
        raise OfferingValidationError(f"Invalid offering status: {status}")

    now = datetime.now(timezone.utc)
    o_id = offering_id or f"offering_{uuid.uuid4().hex[:12]}"

    doc = {
        "offering_id": o_id,
        "tenant_id": pv["tenant_id"],
        "institution_id": pv["institution_id"],
        "program_version_id": program_version_id,
        "program_id": pv["program_id"],
        "campus_id": campus_id,
        "academic_year": academic_year.strip(),
        "shift": shift,
        "sanctioned_intake": int(sanctioned_intake),
        "supernumerary_quota": int(supernumerary_quota),
        "enrolled_count": 0,
        "status": status,
        "metadata": metadata or {},
        "created_at": now,
        "updated_at": now,
    }

    try:
        db.program_offerings.insert_one(doc)
    except DuplicateKeyError as e:
        raise DuplicateOfferingError(
            f"An offering for program_version '{program_version_id}' on campus '{campus_id}' "
            f"for year '{academic_year}' with shift '{shift}' already exists"
        ) from e

    return doc


def get_program_offering(db: Database, offering_id: str) -> Dict[str, Any]:
    """Retrieve program offering by ID."""
    doc = db.program_offerings.find_one({"offering_id": offering_id})
    if not doc:
        raise OfferingNotFoundError(f"Program offering '{offering_id}' not found")
    return doc


def list_program_offerings(
    db: Database,
    tenant_id: Optional[str] = None,
    institution_id: Optional[str] = None,
    campus_id: Optional[str] = None,
    academic_year: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Query program offerings with filters."""
    query: Dict[str, Any] = {}
    if tenant_id:
        query["tenant_id"] = tenant_id
    if institution_id:
        query["institution_id"] = institution_id
    if campus_id:
        query["campus_id"] = campus_id
    if academic_year:
        query["academic_year"] = academic_year
    if status:
        query["status"] = status
    return list(db.program_offerings.find(query).sort("created_at", -1))


def transition_offering_status(
    db: Database, offering_id: str, new_status: str
) -> Dict[str, Any]:
    """Execute validated state transition on a program offering."""
    offering = get_program_offering(db, offering_id)
    current_status = offering["status"]

    if current_status == new_status:
        return offering

    allowed = OFFERING_STATUS_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise InvalidOfferingStateTransitionError(
            f"Cannot transition offering from '{current_status}' to '{new_status}'. Allowed: {allowed}"
        )

    now = datetime.now(timezone.utc)
    res = db.program_offerings.find_one_and_update(
        {"offering_id": offering_id},
        {"$set": {"status": new_status, "updated_at": now}},
        return_document=True,
    )
    return res


def update_offering_intake(
    db: Database,
    offering_id: str,
    sanctioned_intake: Optional[int] = None,
    supernumerary_quota: Optional[int] = None,
) -> Dict[str, Any]:
    """Update intake quotas for an offering."""
    updates: Dict[str, Any] = {}
    if sanctioned_intake is not None:
        if sanctioned_intake <= 0:
            raise OfferingValidationError("sanctioned_intake must be positive")
        updates["sanctioned_intake"] = int(sanctioned_intake)
    if supernumerary_quota is not None:
        if supernumerary_quota < 0:
            raise OfferingValidationError("supernumerary_quota cannot be negative")
        updates["supernumerary_quota"] = int(supernumerary_quota)

    if not updates:
        return get_program_offering(db, offering_id)

    updates["updated_at"] = datetime.now(timezone.utc)
    res = db.program_offerings.find_one_and_update(
        {"offering_id": offering_id},
        {"$set": updates},
        return_document=True,
    )
    if not res:
        raise OfferingNotFoundError(f"Program offering '{offering_id}' not found")
    return res


def create_program_specialization(
    db: Database,
    program_version_id: str,
    specialization_code: str,
    specialization_title: str,
    specialization_type: str = "MAJOR",
    required_credits: float = 20.0,
    metadata: Optional[Dict[str, Any]] = None,
    specialization_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Define a major, minor, honors, or concentration specialization track."""
    get_program_version(db, program_version_id)

    valid_types = {"MAJOR", "MINOR", "HONOURS_RESEARCH", "CONCENTRATION"}
    if specialization_type not in valid_types:
        raise OfferingValidationError(
            f"Invalid specialization_type: {specialization_type}. Must be one of {valid_types}"
        )

    if required_credits <= 0:
        raise OfferingValidationError("required_credits must be positive")

    s_id = specialization_id or f"spec_{uuid.uuid4().hex[:12]}"
    doc = {
        "specialization_id": s_id,
        "program_version_id": program_version_id,
        "specialization_code": specialization_code.strip().upper(),
        "specialization_title": specialization_title.strip(),
        "specialization_type": specialization_type,
        "required_credits": float(required_credits),
        "status": "ACTIVE",
        "metadata": metadata or {},
        "created_at": datetime.now(timezone.utc),
    }

    try:
        db.program_specializations.insert_one(doc)
    except DuplicateKeyError as e:
        raise DuplicateOfferingError(
            f"Specialization '{specialization_code}' already exists for version '{program_version_id}'"
        ) from e

    return doc


def list_program_specializations(
    db: Database, program_version_id: str
) -> List[Dict[str, Any]]:
    """List specializations available for a program version."""
    return list(
        db.program_specializations.find(
            {"program_version_id": program_version_id, "status": "ACTIVE"}
        ).sort("specialization_code", 1)
    )

