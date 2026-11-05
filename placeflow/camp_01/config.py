"""Hierarchical and Versioned Institutional Configuration Domain Service for CAMP-01.
Resolves Platform -> Tenant -> Institution -> Campus configuration inheritance (ADR-C01-010).
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pymongo.client_session import ClientSession
from database.connection import get_db
from camp_01.outbox import publish_event

PLATFORM_DEFAULT_SETTINGS = {
    "identity": {
        "institution_logo_url": None,
        "primary_color": "#0B1B3D",
        "secondary_color": "#8C1515",
        "portal_title": "Campus Operating System",
    },
    "localization": {
        "timezone": "Asia/Kolkata",
        "locale": "en-IN",
        "date_format": "DD/MM/YYYY",
        "currency": "INR",
    },
    "communication": {
        "official_email": "registrar@campus.edu.in",
        "grievance_portal_url": None,
        "notification_channels": ["EMAIL", "IN_APP"],
    },
    "operational": {
        "academic_year": "2025-26",
        "working_days": ["MON", "TUE", "WED", "THU", "FRI", "SAT"],
    },
}


def deep_merge(base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
    """Recursively merges dictionary `override` into `base`."""
    result = dict(base)
    for key, val in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(val, dict):
            result[key] = deep_merge(result[key], val)
        else:
            result[key] = val
    return result


def create_configuration_version(
    tenant_id: str,
    institution_id: str,
    scope_level: str,
    settings: Dict[str, Any],
    changed_by: str,
    change_reason: str,
    scope_id: Optional[str] = None,
    effective_from: Optional[datetime] = None,
    session: Optional[ClientSession] = None,
    db=None,
) -> Dict[str, Any]:
    """Records an immutable new configuration version, closing the previous active version."""
    if db is None:
        db = get_db()

    now = datetime.now(timezone.utc)
    eff_from = effective_from or now

    # Find the current version number
    latest_config = db.institution_configurations.find_one(
        {"tenant_id": tenant_id, "institution_id": institution_id, "scope_level": scope_level, "scope_id": scope_id},
        sort=[("version_number", -1)],
        session=session,
    )
    new_version_num = (latest_config["version_number"] + 1) if latest_config else 1

    # Inactivate older active version
    db.institution_configurations.update_many(
        {
            "tenant_id": tenant_id,
            "institution_id": institution_id,
            "scope_level": scope_level,
            "scope_id": scope_id,
            "is_active": True,
        },
        {"$set": {"is_active": False, "effective_to": eff_from}},
        session=session,
    )

    config_id = str(uuid.uuid4())
    doc = {
        "config_id": config_id,
        "tenant_id": tenant_id,
        "institution_id": institution_id,
        "scope_level": scope_level,
        "scope_id": scope_id,
        "version_number": new_version_num,
        "settings": settings,
        "effective_from": eff_from,
        "effective_to": None,
        "changed_by": changed_by,
        "change_reason": change_reason,
        "is_active": True,
        "created_at": now,
    }

    db.institution_configurations.insert_one(doc, session=session)
    doc.pop("_id", None)

    publish_event(
        event_type="InstitutionConfigurationChanged",
        aggregate_type="CONFIGURATION",
        aggregate_id=config_id,
        tenant_id=tenant_id,
        payload={
            "institution_id": institution_id,
            "scope_level": scope_level,
            "version_number": new_version_num,
            "change_reason": change_reason,
        },
        session=session,
        db=db,
    )

    return doc


def resolve_effective_configuration(
    tenant_id: str,
    institution_id: str,
    campus_id: Optional[str] = None,
    db=None,
) -> Dict[str, Any]:
    """Resolves configuration through the 4-level inheritance hierarchy:

    Platform Defaults -> Tenant -> Institution -> Campus.
    """
    if db is None:
        db = get_db()

    effective = dict(PLATFORM_DEFAULT_SETTINGS)

    # 1. Tenant-level configuration
    tenant_cfg = db.institution_configurations.find_one(
        {"tenant_id": tenant_id, "scope_level": "TENANT", "is_active": True},
        {"_id": 0, "settings": 1},
    )
    if tenant_cfg and "settings" in tenant_cfg:
        effective = deep_merge(effective, tenant_cfg["settings"])

    # 2. Institution-level configuration
    inst_cfg = db.institution_configurations.find_one(
        {"tenant_id": tenant_id, "institution_id": institution_id, "scope_level": "INSTITUTION", "is_active": True},
        {"_id": 0, "settings": 1},
    )
    if inst_cfg and "settings" in inst_cfg:
        effective = deep_merge(effective, inst_cfg["settings"])

    # 3. Campus-level configuration override
    if campus_id:
        campus_cfg = db.institution_configurations.find_one(
            {"tenant_id": tenant_id, "institution_id": institution_id, "scope_level": "CAMPUS", "scope_id": campus_id, "is_active": True},
            {"_id": 0, "settings": 1},
        )
        if campus_cfg and "settings" in campus_cfg:
            effective = deep_merge(effective, campus_cfg["settings"])

    return effective


def list_configuration_history(
    tenant_id: str,
    institution_id: str,
    scope_level: Optional[str] = None,
    db=None,
) -> List[Dict[str, Any]]:
    """Lists configuration versions with audit change reasons."""
    if db is None:
        db = get_db()
    q = {"tenant_id": tenant_id, "institution_id": institution_id}
    if scope_level:
        q["scope_level"] = scope_level
    return list(db.institution_configurations.find(q, {"_id": 0}).sort("version_number", -1))
