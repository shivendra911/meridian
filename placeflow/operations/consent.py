"""
PlaceFlow v3 — FR-PRV-001 / FR-PRV-002 / FR-PRV-003: DPDP Privacy & Purpose Consent Ledger
Manages purpose-based student consents, versioned notices, field-level disclosure limits, and easy withdrawal.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid


CURRENT_NOTICE_VERSION = "2026.1-DPDP"

PURPOSE_DEFINITIONS = {
    "PLACEMENT_MATCHING": {
        "title": "Recruitment Matching & Drive Registration",
        "description": "Evaluate academic eligibility criteria (CGPA, department, backlogs) against active corporate drive requirements.",
        "default_fields": ["student_id", "department", "cgpa", "backlogs", "year"],
        "mandatory": True,
    },
    "RECRUITER_DISCLOSURE": {
        "title": "Corporate Partner Profile Disclosure",
        "description": "Share candidate academic transcript, verified skills, and resume with participating recruiters upon registration.",
        "default_fields": ["name", "email", "cgpa", "skills", "resume_doc_id"],
        "mandatory": False,
    },
    "AI_PREDICTIVE_MODELING": {
        "title": "Personalized Predictive Career Advisory",
        "description": "Generate machine learning placement likelihood estimates, personalized skill gap roadmaps, and what-if simulations.",
        "default_fields": ["cgpa", "backlogs", "skills", "department"],
        "mandatory": False,
    },
    "ACCREDITATION_AGGREGATES": {
        "title": "Anonymized Accreditation & NIRF Reporting",
        "description": "Include anonymized placement outcomes in rolling 3-year institutional accreditation statistics without personal identifiers.",
        "default_fields": ["placement_status", "package_lpa", "department"],
        "mandatory": True,
    },
}


def record_consent(
    db,
    student_id: str,
    purpose: str,
    disclosed_fields: Optional[List[str]] = None,
    notice_version: str = CURRENT_NOTICE_VERSION,
) -> Dict[str, Any]:
    """
    FR-PRV-002: Records a purpose-based consent in the `consents` collection.
    """
    if purpose not in PURPOSE_DEFINITIONS:
        return {"error": f"Invalid purpose: {purpose}"}

    fields = disclosed_fields or PURPOSE_DEFINITIONS[purpose]["default_fields"]
    consent_id = f"CNS-{uuid.uuid4().hex[:8].upper()}"

    doc = {
        "consent_id": consent_id,
        "student_id": student_id,
        "purpose": purpose,
        "purpose_title": PURPOSE_DEFINITIONS[purpose]["title"],
        "status": "ACTIVE",
        "notice_version": notice_version,
        "disclosed_fields": fields,
        "granted_at": datetime.now(timezone.utc),
        "withdrawn_at": None,
    }

    # Update or insert active consent for student and purpose
    db.consents.update_one(
        {"student_id": student_id, "purpose": purpose},
        {"$set": doc},
        upsert=True,
    )

    if purpose == "AI_PREDICTIVE_MODELING":
        try:
            db.students.update_one({"student_id": student_id}, {"$set": {"ml_opt_out": False}})
        except Exception:
            pass

    return {"status": "SUCCESS", "consent_id": consent_id, "purpose": purpose}


def withdraw_consent(db, student_id: str, purpose: str) -> Dict[str, Any]:
    """
    FR-PRV-002: Allows withdrawal of consent; immediately stops dependent processing.
    """
    res = db.consents.update_one(
        {"student_id": student_id, "purpose": purpose, "status": "ACTIVE"},
        {"$set": {"status": "WITHDRAWN", "withdrawn_at": datetime.now(timezone.utc)}},
    )
    if res.matched_count == 0:
        return {"error": "No active consent found for this purpose to withdraw."}

    # If AI prediction consent withdrawn, attempt to set opt-out flag on student document
    if purpose == "AI_PREDICTIVE_MODELING":
        try:
            db.students.update_one({"student_id": student_id}, {"$set": {"ml_opt_out": True}})
        except Exception:
            pass  # Non-blocking if collection schema forbids extra properties

    return {"status": "WITHDRAWN", "student_id": student_id, "purpose": purpose}


def get_student_consents(db, student_id: str) -> List[Dict[str, Any]]:
    """
    Retrieves all consent records for a student across all defined purposes.
    """
    existing = {c["purpose"]: c for c in db.consents.find({"student_id": student_id}, {"_id": 0})}
    result = []
    for purpose, meta in PURPOSE_DEFINITIONS.items():
        if purpose in existing:
            rec = dict(existing[purpose])
        else:
            rec = {
                "student_id": student_id,
                "purpose": purpose,
                "purpose_title": meta["title"],
                "status": "GRANTED_BY_DEFAULT" if meta["mandatory"] else "PENDING",
                "notice_version": CURRENT_NOTICE_VERSION,
                "disclosed_fields": meta["default_fields"],
                "granted_at": None,
                "withdrawn_at": None,
            }
        rec["is_mandatory"] = meta["mandatory"]
        rec["description"] = meta["description"]
        result.append(rec)
    return result
