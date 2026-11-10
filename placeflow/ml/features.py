"""PlaceFlow / Meridian — ML Feature Engineering & Multi-Tenant Store (Phase 1).

Extracts, normalizes, and validates feature vectors for campus machine learning
models under strict tenant isolation boundaries and DPDP privacy constraints.
Reference: docs/redesign4.txt Section 12 & Section 19.
"""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from database.connection import get_db


class FeatureExtractionError(Exception):
    """Raised when feature extraction fails due to missing data or validation errors."""
    pass


class CrossTenantFeatureAccessDenied(PermissionError):
    """Raised when an attempt is made to extract features across tenant boundaries."""
    pass


def extract_student_features(
    student_id: str,
    tenant_id: Optional[str] = None,
    db=None,
) -> Dict[str, Any]:
    """Extracts a validated numerical and categorical feature vector for a single student.

    Enforces:
    - Tenant isolation: verifies student belongs to the requested tenant context.
    - DPDP privacy: strips direct PII (name, email, phone) before modeling.
    - Fallback defaults for missing academic attributes.
    """
    if db is None:
        db = get_db()

    student = db.students.find_one({"student_id": student_id}, {"_id": 0})
    if not student:
        raise FeatureExtractionError(f"Student '{student_id}' not found.")

    # 1. Tenant Isolation Verification
    if tenant_id:
        student_tid = student.get("tenant_id")
        if student_tid and student_tid != tenant_id:
            raise CrossTenantFeatureAccessDenied(
                f"Student '{student_id}' does not belong to tenant '{tenant_id}'."
            )
        elif not student_tid:
            # Check institutional relationship if student doc lacks direct tenant_id
            inst_id = student.get("institution_id")
            if inst_id:
                inst = db.institutions.find_one({"institution_id": inst_id}, {"_id": 0, "tenant_id": 1})
                if inst and inst.get("tenant_id") != tenant_id:
                    raise CrossTenantFeatureAccessDenied(
                        f"Student's institution '{inst_id}' does not belong to tenant '{tenant_id}'."
                    )

    # 2. Extract and Normalize Attributes
    cgpa = float(student.get("cgpa", 0.0) or 0.0)
    cgpa = max(0.0, min(10.0, cgpa))

    backlogs = int(student.get("backlogs", 0) or 0)
    backlogs = max(0, backlogs)

    year = int(student.get("year", 4) or 4)
    dept = str(student.get("department", "CSE") or "CSE").strip().upper()

    skills_raw = student.get("skills", [])
    if isinstance(skills_raw, list):
        clean_skills = [str(s).strip().lower() for s in skills_raw if s and str(s).strip()]
    elif isinstance(skills_raw, str):
        clean_skills = [s.strip().lower() for s in skills_raw.split(",") if s.strip()]
    else:
        clean_skills = []

    skill_count = len(set(clean_skills))

    # Applications submitted (student is already tenant-verified)
    app_count = db.applications.count_documents({"student_id": student_id})

    # Attendance and credits
    attendance_pct = float(student.get("attendance", student.get("attendance_percentage", student.get("attendance_pct", 85.0))) or 85.0)
    nep_credits = int(student.get("nep_credits_earned", student.get("credits", 120)) or 120)

    # Placement status
    placement_status = str(student.get("placement_status", "Unplaced"))

    return {
        "student_id": student_id,
        "tenant_id": tenant_id or student.get("tenant_id"),
        "cgpa": cgpa,
        "backlogs": backlogs,
        "year": year,
        "department": dept,
        "skill_count": skill_count,
        "skills": clean_skills,
        "application_count": app_count,
        "attendance_pct": attendance_pct,
        "nep_credits": nep_credits,
        "placement_status": placement_status,
        "opt_out": bool(student.get("ml_opt_out", False)),
    }


def extract_cohort_features(
    tenant_id: Optional[str] = None,
    department: Optional[str] = None,
    db=None,
) -> pd.DataFrame:
    """Extracts a batch DataFrame of student features for model training or cohort scoring.

    Slices strictly by tenant boundary when tenant_id is specified.
    """
    if db is None:
        db = get_db()

    query: Dict[str, Any] = {}
    if tenant_id:
        query["tenant_id"] = tenant_id
    if department and department != "ALL":
        query["department"] = department.upper()

    students = list(db.students.find(query, {"_id": 0}))
    if not students:
        return pd.DataFrame()

    # Pre-aggregate application counts for the cohort students
    student_ids = [s.get("student_id") for s in students if s.get("student_id")]
    app_pipeline = [
        {"$match": {"student_id": {"$in": student_ids}}},
        {"$group": {"_id": "$student_id", "count": {"$sum": 1}}},
    ]
    app_counts = {r["_id"]: r["count"] for r in db.applications.aggregate(app_pipeline)}

    # Pre-aggregate placements
    plc_query: Dict[str, Any] = {"status": {"$ne": "Revoked_Upgraded"}}
    if tenant_id:
        plc_query["tenant_id"] = tenant_id
    placements = {p["student_id"]: p.get("package_lpa", 0.0) for p in db.placements.find(plc_query, {"_id": 0})}

    records = []
    for s in students:
        sid = s.get("student_id")
        skills = s.get("skills", [])
        if isinstance(skills, list):
            clean_skills = [str(x).strip().lower() for x in skills if x]
        elif isinstance(skills, str):
            clean_skills = [x.strip().lower() for x in skills.split(",") if x.strip()]
        else:
            clean_skills = []

        is_placed = 1 if sid in placements or s.get("placement_status") == "Placed" else 0
        pkg_lpa = float(placements.get(sid, 0.0) or 0.0)

        records.append({
            "student_id": sid,
            "tenant_id": s.get("tenant_id", tenant_id),
            "cgpa": float(s.get("cgpa", 0.0) or 0.0),
            "backlogs": int(s.get("backlogs", 0) or 0),
            "year": int(s.get("year", 4) or 4),
            "department": str(s.get("department", "CSE") or "CSE").upper(),
            "skill_count": len(set(clean_skills)),
            "application_count": app_counts.get(sid, 0),
            "attendance_pct": float(s.get("attendance", s.get("attendance_percentage", 85.0)) or 85.0),
            "nep_credits": int(s.get("nep_credits_earned", 120) or 120),
            "placed": is_placed,
            "package_lpa": pkg_lpa,
            "opt_out": bool(s.get("ml_opt_out", False)),
        })

    return pd.DataFrame(records)
