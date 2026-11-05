"""Academic Program & Versioning Engine for CAMP-03.

Manages educational pathways (e.g. B.Tech Computer Science, MBA Finance),
immutable curriculum versions, and joint-delivery academic unit responsibilities.
"""

from datetime import datetime, timezone
import uuid
from typing import Dict, Any, List, Optional
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from camp_03.qualifications import get_qualification


class ProgramNotFoundError(Exception):
    pass


class ProgramVersionNotFoundError(Exception):
    pass


class DuplicateProgramError(Exception):
    pass


class ProgramVersionImmutableError(Exception):
    pass


class ProgramValidationError(Exception):
    pass


def create_academic_program(
    db: Database,
    tenant_id: str,
    institution_id: str,
    program_code: str,
    program_title: str,
    qualification_id: str,
    primary_academic_unit_id: str,
    is_interdisciplinary: bool = False,
    delivery_mode: str = "REGULAR_FULL_TIME",
    nominal_duration_semesters: int = 8,
    maximum_duration_semesters: int = 12,
    status: str = "ACTIVE",
    metadata: Optional[Dict[str, Any]] = None,
    program_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Create an educational program pathway."""
    code_clean = program_code.strip().upper()
    title_clean = program_title.strip()

    # Verify qualification exists
    get_qualification(db, qualification_id)

    valid_delivery_modes = {
        "REGULAR_FULL_TIME",
        "EVENING_PART_TIME",
        "ONLINE_DISTANCE",
        "HYBRID",
        "APPRENTICESHIP_EMBEDDED",
    }
    if delivery_mode not in valid_delivery_modes:
        raise ProgramValidationError(
            f"Invalid delivery_mode: {delivery_mode}. Must be one of {valid_delivery_modes}"
        )

    if nominal_duration_semesters <= 0:
        raise ProgramValidationError("nominal_duration_semesters must be positive")
    if maximum_duration_semesters < nominal_duration_semesters:
        raise ProgramValidationError(
            f"maximum_duration_semesters ({maximum_duration_semesters}) cannot be less than nominal ({nominal_duration_semesters})"
        )

    now = datetime.now(timezone.utc)
    p_id = program_id or f"prog_{uuid.uuid4().hex[:12]}"

    doc = {
        "program_id": p_id,
        "tenant_id": tenant_id,
        "institution_id": institution_id,
        "program_code": code_clean,
        "program_title": title_clean,
        "qualification_id": qualification_id,
        "primary_academic_unit_id": primary_academic_unit_id,
        "is_interdisciplinary": bool(is_interdisciplinary),
        "delivery_mode": delivery_mode,
        "nominal_duration_semesters": int(nominal_duration_semesters),
        "maximum_duration_semesters": int(maximum_duration_semesters),
        "status": status,
        "metadata": metadata or {},
        "created_at": now,
        "updated_at": now,
    }

    try:
        db.programs.insert_one(doc)
    except DuplicateKeyError as e:
        raise DuplicateProgramError(
            f"Program code '{code_clean}' already exists for institution '{institution_id}'"
        ) from e

    return doc


def get_academic_program(db: Database, program_id: str) -> Dict[str, Any]:
    """Retrieve program by ID."""
    doc = db.programs.find_one({"program_id": program_id})
    if not doc:
        raise ProgramNotFoundError(f"Academic program '{program_id}' not found")
    return doc


def list_academic_programs(
    db: Database,
    tenant_id: Optional[str] = None,
    institution_id: Optional[str] = None,
    academic_unit_id: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List programs matching criteria."""
    query: Dict[str, Any] = {}
    if tenant_id:
        query["tenant_id"] = tenant_id
    if institution_id:
        query["institution_id"] = institution_id
    if academic_unit_id:
        query["primary_academic_unit_id"] = academic_unit_id
    if status:
        query["status"] = status
    return list(db.programs.find(query).sort("program_code", 1))


def create_program_version(
    db: Database,
    program_id: str,
    version_code: str,
    curriculum_name: str,
    effective_from: datetime,
    total_credits_required: float = 160.0,
    applicable_cohorts: Optional[List[str]] = None,
    effective_to: Optional[datetime] = None,
    credit_policy: Optional[Dict[str, Any]] = None,
    status: str = "DRAFT",
    metadata: Optional[Dict[str, Any]] = None,
    program_version_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Create an independently versioned curriculum specification."""
    prog = get_academic_program(db, program_id)
    v_code = version_code.strip()

    valid_statuses = {"DRAFT", "PENDING_APPROVAL", "APPROVED", "ACTIVE", "SUPERSEDED"}
    if status not in valid_statuses:
        raise ProgramValidationError(f"Invalid version status: {status}")

    now = datetime.now(timezone.utc)
    pv_id = program_version_id or f"pv_{uuid.uuid4().hex[:12]}"

    default_credit_policy = {
        "min_credits_per_term": 16.0,
        "max_credits_per_term": 26.0,
        "allow_audit_credits": True,
        "pass_grade_point": 4.0,
        "grading_scheme_code": "UGC_10_POINT",
    }

    doc = {
        "program_version_id": pv_id,
        "program_id": program_id,
        "tenant_id": prog["tenant_id"],
        "institution_id": prog["institution_id"],
        "version_code": v_code,
        "curriculum_name": curriculum_name.strip(),
        "effective_from": effective_from,
        "effective_to": effective_to,
        "applicable_cohorts": applicable_cohorts or [],
        "total_credits_required": float(total_credits_required),
        "credit_policy": credit_policy or default_credit_policy,
        "status": status,
        "approved_by_membership_id": None,
        "approved_at": None,
        "metadata": metadata or {},
        "created_at": now,
        "updated_at": now,
    }

    try:
        db.program_versions.insert_one(doc)
    except DuplicateKeyError as e:
        raise ProgramValidationError(
            f"Version code '{v_code}' already exists for program '{program_id}'"
        ) from e

    return doc


def get_program_version(db: Database, program_version_id: str) -> Dict[str, Any]:
    """Retrieve program version by ID."""
    doc = db.program_versions.find_one({"program_version_id": program_version_id})
    if not doc:
        raise ProgramVersionNotFoundError(f"Program version '{program_version_id}' not found")
    return doc


def approve_program_version(
    db: Database,
    program_version_id: str,
    approved_by_membership_id: str,
) -> Dict[str, Any]:
    """Approve a curriculum version and lock it for enrollment."""
    pv = get_program_version(db, program_version_id)
    if pv["status"] in ("APPROVED", "ACTIVE"):
        return pv

    now = datetime.now(timezone.utc)
    res = db.program_versions.find_one_and_update(
        {"program_version_id": program_version_id},
        {
            "$set": {
                "status": "APPROVED",
                "approved_by_membership_id": approved_by_membership_id,
                "approved_at": now,
                "updated_at": now,
            }
        },
        return_document=True,
    )

    try:
        from camp_01.outbox import publish_event
        publish_event(
            event_type="ProgramVersionPublished",
            aggregate_type="PROGRAM_VERSION",
            aggregate_id=program_version_id,
            tenant_id=res.get("tenant_id", "global"),
            payload={
                "program_id": res.get("program_id"),
                "version_code": res.get("version_code"),
                "curriculum_name": res.get("curriculum_name"),
                "approved_by": approved_by_membership_id,
            },
            db=db,
        )
    except Exception:
        pass

    return res


def activate_program_version(db: Database, program_version_id: str) -> Dict[str, Any]:
    """Mark an approved program version as currently active."""
    pv = get_program_version(db, program_version_id)
    if pv["status"] not in ("APPROVED", "ACTIVE"):
        raise ProgramValidationError(
            f"Cannot activate version '{program_version_id}' with status '{pv['status']}'. Must be APPROVED first."
        )

    now = datetime.now(timezone.utc)
    res = db.program_versions.find_one_and_update(
        {"program_version_id": program_version_id},
        {"$set": {"status": "ACTIVE", "updated_at": now}},
        return_document=True,
    )
    return res


def update_program_version(
    db: Database, program_version_id: str, updates: Dict[str, Any]
) -> Dict[str, Any]:
    """Update draft curriculum version. Strictly enforces immutability once approved or active."""
    pv = get_program_version(db, program_version_id)

    # Invariant: Once approved or active, program versions cannot be mutated in place
    if pv["status"] in ("APPROVED", "ACTIVE", "SUPERSEDED"):
        raise ProgramVersionImmutableError(
            f"Program version '{program_version_id}' is {pv['status']} and strictly immutable. "
            f"Branch a new version using branch_program_version()."
        )

    allowed = {
        "curriculum_name",
        "effective_from",
        "effective_to",
        "applicable_cohorts",
        "total_credits_required",
        "credit_policy",
        "metadata",
    }
    clean = {k: v for k, v in updates.items() if k in allowed}
    clean["updated_at"] = datetime.now(timezone.utc)

    res = db.program_versions.find_one_and_update(
        {"program_version_id": program_version_id},
        {"$set": clean},
        return_document=True,
    )
    return res


def branch_program_version(
    db: Database,
    source_version_id: str,
    new_version_code: str,
    new_curriculum_name: str,
    effective_from: datetime,
    new_applicable_cohorts: Optional[List[str]] = None,
    overrides: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Branch an existing version to preserve history while establishing new cohort curriculum."""
    source = get_program_version(db, source_version_id)
    overrides = overrides or {}

    total_credits = overrides.get("total_credits_required", source["total_credits_required"])
    credit_policy = overrides.get("credit_policy", source["credit_policy"].copy())

    return create_program_version(
        db=db,
        program_id=source["program_id"],
        version_code=new_version_code,
        curriculum_name=new_curriculum_name,
        effective_from=effective_from,
        total_credits_required=total_credits,
        applicable_cohorts=new_applicable_cohorts or [],
        credit_policy=credit_policy,
        status="DRAFT",
        metadata={
            "branched_from_version_id": source_version_id,
            "branched_at": datetime.now(timezone.utc).isoformat(),
        },
    )


def link_program_offering_unit(
    db: Database,
    offering_id: str,
    academic_unit_id: str,
    responsibility_type: str = "PRIMARY_ADMIN",
    share_percentage: float = 100.0,
) -> Dict[str, Any]:
    """Map joint delivery responsibilities between academic units and a program offering."""
    valid_resp = {
        "PRIMARY_ADMIN",
        "JOINT_TEACHING",
        "LAB_FACILITY",
        "RESEARCH_AFFILIATION",
    }
    if responsibility_type not in valid_resp:
        raise ProgramValidationError(
            f"Invalid responsibility_type: {responsibility_type}. Must be one of {valid_resp}"
        )

    doc = {
        "offering_unit_id": f"pou_{uuid.uuid4().hex[:12]}",
        "offering_id": offering_id,
        "academic_unit_id": academic_unit_id,
        "responsibility_type": responsibility_type,
        "share_percentage": float(share_percentage),
        "created_at": datetime.now(timezone.utc),
    }

    try:
        db.program_offering_units.insert_one(doc)
    except DuplicateKeyError:
        db.program_offering_units.update_one(
            {
                "offering_id": offering_id,
                "academic_unit_id": academic_unit_id,
                "responsibility_type": responsibility_type,
            },
            {"$set": {"share_percentage": float(share_percentage)}},
        )
    return doc

