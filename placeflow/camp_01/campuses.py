"""Campus and Physical Location Domain Service & Repository for CAMP-01.
Models operational sites, locations, and temporal M:N institution-campus associations (ADR-C01-005).
"""

import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pymongo.client_session import ClientSession
from pymongo.errors import DuplicateKeyError
from database.connection import get_db
from camp_01.outbox import publish_event
from camp_01.tenants import get_tenant_by_id

CODE_REGEX = re.compile(r"^[A-Z0-9_-]+$")


class CampusValidationError(ValueError):
    """Raised when campus data fails validation."""
    pass


class CampusNotFoundError(LookupError):
    """Raised when a campus does not exist."""
    pass


class PrimaryCampusCollisionError(RuntimeError):
    """Raised when an institution attempts to assign more than one overlapping primary campus."""
    pass


def normalize_campus_code(code: str) -> str:
    """Normalizes campus code."""
    c = code.strip().upper()
    if not CODE_REGEX.match(c):
        raise CampusValidationError(
            f"Invalid campus code '{code}'. Must contain uppercase letters, numbers, hyphens or underscores."
        )
    return c


def create_campus(
    tenant_id: str,
    campus_code: str,
    campus_name: str,
    campus_kind: str = "PHYSICAL",
    status: str = "PLANNED",
    timezone_name: Optional[str] = None,
    default_locale: Optional[str] = None,
    operational_metadata: Optional[Dict[str, Any]] = None,
    actor_id: str = "system",
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Provisions a new operational campus site within tenant scope."""
    if db is None:
        db = get_db()

    # Validate tenant
    tenant = get_tenant_by_id(tenant_id, db=db)
    if tenant["status"] in {"CLOSING", "CLOSED"}:
        raise CampusValidationError(f"Cannot create campus in {tenant['status']} tenant.")

    norm_code = normalize_campus_code(campus_code)
    name = campus_name.strip()
    if len(name) < 2:
        raise CampusValidationError("Campus name must be at least 2 characters.")

    if campus_kind not in {"PHYSICAL", "VIRTUAL", "DISTRIBUTED", "RESEARCH_PARK"}:
        raise CampusValidationError(f"Invalid campus kind: {campus_kind}")

    campus_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    doc = {
        "tenant_id": tenant_id,
        "campus_id": campus_id,
        "campus_code": norm_code,
        "normalized_code": norm_code,
        "campus_name": name,
        "campus_kind": campus_kind,
        "status": status,
        "timezone": timezone_name or "Asia/Kolkata",
        "default_locale": default_locale or "en-IN",
        "operational_metadata": operational_metadata or {},
        "created_at": now,
    }

    try:
        db.campuses.insert_one(doc, session=session)
        doc.pop("_id", None)
    except DuplicateKeyError as exc:
        raise CampusValidationError(f"Campus code '{norm_code}' already exists in this tenant.") from exc

    publish_event(
        event_type="CampusCreated",
        aggregate_type="CAMPUS",
        aggregate_id=campus_id,
        tenant_id=tenant_id,
        payload={"campus_id": campus_id, "campus_code": norm_code, "campus_name": name, "status": status},
        session=session,
        db=db,
    )

    return doc


def get_campus_by_id(tenant_id: str, campus_id: str, db=None) -> Dict[str, Any]:
    """Retrieves a campus by its unique ID within tenant."""
    if db is None:
        db = get_db()
    c = db.campuses.find_one({"tenant_id": tenant_id, "campus_id": campus_id}, {"_id": 0})
    if not c:
        raise CampusNotFoundError(f"Campus '{campus_id}' not found in tenant '{tenant_id}'.")
    return c


def list_campuses(tenant_id: str, status: Optional[str] = None, db=None) -> List[Dict[str, Any]]:
    """Lists campuses within tenant."""
    if db is None:
        db = get_db()
    q = {"tenant_id": tenant_id}
    if status:
        q["status"] = status
    return list(db.campuses.find(q, {"_id": 0}).sort("created_at", -1))


def create_physical_location(
    tenant_id: str,
    building_name: str,
    city: str,
    state: str,
    postal_code: str,
    country: str = "IND",
    campus_id: Optional[str] = None,
    block: Optional[str] = None,
    street_address: Optional[str] = None,
    district: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    location_type: str = "ACADEMIC_BLOCK",
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Records a physical location or building block."""
    if db is None:
        db = get_db()

    loc_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    geo_coords = None
    if latitude is not None and longitude is not None:
        geo_coords = {"latitude": float(latitude), "longitude": float(longitude)}

    doc = {
        "location_id": loc_id,
        "tenant_id": tenant_id,
        "campus_id": campus_id,
        "building_name": building_name.strip(),
        "block": block.strip() if block else None,
        "street_address": street_address.strip() if street_address else None,
        "city": city.strip(),
        "district": district.strip() if district else None,
        "state": state.strip(),
        "postal_code": postal_code.strip(),
        "country": country.strip(),
        "geo_coordinates": geo_coords,
        "location_type": location_type,
        "created_at": now,
    }

    db.physical_locations.insert_one(doc, session=session)
    doc.pop("_id", None)
    return doc


def list_physical_locations(
    tenant_id: str,
    campus_id: Optional[str] = None,
    db=None,
) -> List[Dict[str, Any]]:
    """Lists physical locations, optionally filtered by campus."""
    if db is None:
        db = get_db()
    q = {"tenant_id": tenant_id}
    if campus_id:
        q["campus_id"] = campus_id
    return list(db.physical_locations.find(q, {"_id": 0}).sort("building_name", 1))


def associate_campus_with_institution(
    tenant_id: str,
    institution_id: str,
    campus_id: str,
    relationship_type: str = "MAIN_CAMPUS",
    is_primary: bool = False,
    valid_from: Optional[datetime] = None,
    valid_to: Optional[datetime] = None,
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Associates a campus with an institution with temporal validity and primary-campus exclusivity checks."""
    if db is None:
        db = get_db()

    now = datetime.now(timezone.utc)
    from_date = valid_from or now

    if valid_to and valid_to <= from_date:
        raise CampusValidationError("Association valid_to date must be after valid_from date.")

    # Invariant: Single primary campus exclusivity
    if is_primary:
        # Check if there is an active primary campus association for this institution
        overlapping_query = {
            "tenant_id": tenant_id,
            "institution_id": institution_id,
            "is_primary": True,
            "status": "ACTIVE",
            "$or": [
                {"valid_to": None},
                {"valid_to": {"$gt": from_date}},
            ],
        }
        existing_primary = db.institution_campuses.find_one(overlapping_query, session=session)
        if existing_primary:
            raise PrimaryCampusCollisionError(
                f"Institution '{institution_id}' already has an active primary campus ({existing_primary['campus_id']}). "
                "Close the existing primary campus association before designating a new primary campus."
            )

    assoc_id = str(uuid.uuid4())
    doc = {
        "association_id": assoc_id,
        "tenant_id": tenant_id,
        "institution_id": institution_id,
        "campus_id": campus_id,
        "relationship_type": relationship_type,
        "is_primary": is_primary,
        "valid_from": from_date,
        "valid_to": valid_to,
        "status": "ACTIVE",
    }

    try:
        db.institution_campuses.insert_one(doc, session=session)
        doc.pop("_id", None)
    except DuplicateKeyError as exc:
        raise CampusValidationError(
            f"Campus '{campus_id}' is already associated with institution '{institution_id}' on this effective date."
        ) from exc

    publish_event(
        event_type="InstitutionCampusAssociated",
        aggregate_type="INSTITUTION",
        aggregate_id=institution_id,
        tenant_id=tenant_id,
        payload={
            "institution_id": institution_id,
            "campus_id": campus_id,
            "relationship_type": relationship_type,
            "is_primary": is_primary,
        },
        session=session,
        db=db,
    )

    return doc


def close_institution_campus_association(
    tenant_id: str,
    association_id: str,
    valid_to: Optional[datetime] = None,
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Closes an active institution-campus association, preserving historical records."""
    if db is None:
        db = get_db()
    now = datetime.now(timezone.utc)
    to_date = valid_to or now

    res = db.institution_campuses.update_one(
        {"tenant_id": tenant_id, "association_id": association_id, "status": "ACTIVE"},
        {"$set": {"status": "INACTIVE", "valid_to": to_date}},
        session=session,
    )
    if res.matched_count == 0:
        raise CampusNotFoundError(f"Active association '{association_id}' not found.")

    return db.institution_campuses.find_one({"association_id": association_id}, {"_id": 0})


def list_institution_campuses(
    tenant_id: str,
    institution_id: str,
    active_only: bool = True,
    db=None,
) -> List[Dict[str, Any]]:
    """Lists campuses associated with an institution."""
    if db is None:
        db = get_db()
    q = {"tenant_id": tenant_id, "institution_id": institution_id}
    if active_only:
        q["status"] = "ACTIVE"
    return list(db.institution_campuses.find(q, {"_id": 0}).sort("valid_from", -1))
