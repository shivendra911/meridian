"""Qualification Management Service for CAMP-03.

Defines academic credentials (B.Tech, BCA, BBA, MBA, Diploma, Ph.D.) awarded by institutions.
"""

from datetime import datetime, timezone
import uuid
from typing import Dict, Any, List, Optional
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from camp_03.standards import validate_qualification_level


class QualificationNotFoundError(Exception):
    pass


class DuplicateQualificationError(Exception):
    pass


class QualificationValidationError(Exception):
    pass


def create_qualification_definition(
    db: Database,
    tenant_id: str,
    institution_id: str,
    qualification_code: str,
    official_title: str,
    qualification_level: float,
    qualification_category: str,
    awarding_authority_type: str = "UNIVERSITY",
    framework_reference: Optional[Dict[str, Any]] = None,
    metadata: Optional[Dict[str, Any]] = None,
    qualification_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a new academic qualification definition."""
    code_clean = qualification_code.strip().upper()
    title_clean = official_title.strip()

    valid_categories = {
        "UNDERGRADUATE",
        "POSTGRADUATE",
        "DOCTORAL",
        "DIPLOMA",
        "POST_GRADUATE_DIPLOMA",
        "CERTIFICATE",
        "VOCATIONAL",
    }
    if qualification_category not in valid_categories:
        raise QualificationValidationError(
            f"Invalid qualification_category: {qualification_category}. Must be one of {valid_categories}"
        )

    valid_authorities = {
        "UNIVERSITY",
        "AUTONOMOUS_COLLEGE",
        "TECHNICAL_BOARD",
        "STATE_COUNCIL",
        "PROFESSIONAL_BODY",
    }
    if awarding_authority_type not in valid_authorities:
        raise QualificationValidationError(
            f"Invalid awarding_authority_type: {awarding_authority_type}. Must be one of {valid_authorities}"
        )

    if not validate_qualification_level(qualification_level, qualification_category):
        raise QualificationValidationError(
            f"Qualification level {qualification_level} is out of statutory bounds for category {qualification_category}"
        )

    now = datetime.now(timezone.utc)
    qual_id = qualification_id or f"qual_{uuid.uuid4().hex[:12]}"

    doc = {
        "qualification_id": qual_id,
        "tenant_id": tenant_id,
        "institution_id": institution_id,
        "qualification_code": code_clean,
        "official_title": title_clean,
        "qualification_level": float(qualification_level),
        "qualification_category": qualification_category,
        "awarding_authority_type": awarding_authority_type,
        "framework_reference": framework_reference or {},
        "status": "ACTIVE",
        "metadata": metadata or {},
        "created_at": now,
        "updated_at": now,
    }

    try:
        db.qualifications.insert_one(doc)
    except DuplicateKeyError as e:
        raise DuplicateQualificationError(
            f"Qualification code '{code_clean}' already exists for institution '{institution_id}'"
        ) from e

    return doc


def get_qualification(db: Database, qualification_id: str) -> Dict[str, Any]:
    """Retrieve qualification by ID."""
    doc = db.qualifications.find_one({"qualification_id": qualification_id})
    if not doc:
        raise QualificationNotFoundError(f"Qualification '{qualification_id}' not found")
    return doc


def list_qualifications(
    db: Database,
    tenant_id: Optional[str] = None,
    institution_id: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = "ACTIVE",
) -> List[Dict[str, Any]]:
    """Query qualifications with optional filters."""
    query: Dict[str, Any] = {}
    if tenant_id:
        query["tenant_id"] = tenant_id
    if institution_id:
        query["institution_id"] = institution_id
    if category:
        query["qualification_category"] = category
    if status:
        query["status"] = status
    return list(db.qualifications.find(query).sort("qualification_level", 1))


def update_qualification(
    db: Database, qualification_id: str, updates: Dict[str, Any]
) -> Dict[str, Any]:
    """Update mutable attributes of a qualification."""
    allowed_keys = {
        "official_title",
        "qualification_level",
        "framework_reference",
        "status",
        "metadata",
    }
    cleaned_updates = {k: v for k, v in updates.items() if k in allowed_keys}
    if not cleaned_updates:
        return get_qualification(db, qualification_id)

    cleaned_updates["updated_at"] = datetime.now(timezone.utc)
    res = db.qualifications.find_one_and_update(
        {"qualification_id": qualification_id},
        {"$set": cleaned_updates},
        return_document=True,
    )
    if not res:
        raise QualificationNotFoundError(f"Qualification '{qualification_id}' not found")
    return res

