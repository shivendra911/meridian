"""CAMP-02: Role Architecture & Versioned Definition Engine (Section 4).

Models responsibilities rather than job titles.
Supports immutable versioned role definitions and custom institution roles.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from pymongo.errors import DuplicateKeyError

from camp_01.outbox import publish_event
from camp_02.permissions import seed_permission_catalogue
from database.connection import get_db


class RoleValidationError(ValueError):
    """Raised when role creation or mutation violates validation rules."""


class RoleNotFoundError(LookupError):
    """Raised when a role or role version cannot be found."""


# Standard Platform Baseline Roles
BASELINE_ROLES: List[Dict[str, Any]] = [
    {
        "role_code": "SUPER_ADMIN",
        "role_name": "Platform Super Administrator",
        "role_category": "SYSTEM",
        "description": "Full unconstrained administrative authority across platform and all tenants",
        "max_allowed_scope": "PLATFORM",
        "permissions": ["*"],  # Wildcard: all permissions
    },
    {
        "role_code": "INSTITUTION_HEAD",
        "role_name": "Executive Head / Director / Vice-Chancellor",
        "role_category": "ADMINISTRATIVE",
        "description": "Executive visibility, statutory reports signing, and institutional governance",
        "max_allowed_scope": "INSTITUTION",
        "permissions": [
            "institution.profile.read", "institution.profile.update",
            "campus.create", "campus.update",
            "organization.unit.create", "organization.unit.update", "organization.structure.approve",
            "configuration.version.create", "configuration.resolve",
            "iam.audit.view", "iam.privileged.approve",
            "nirf.metrics.calculate", "nirf.report.view", "nirf.data.export", "reports.statutory.sign",
            "placement.drive.publish", "placement.offer.approve", "placement.policy.override",
            "student.profile.read", "student.record.export",
            "consent.audit.export", "agent.trace.view", "agent.fairness.audit",
        ],
    },
    {
        "role_code": "TPO_ADMIN",
        "role_name": "Head Training & Placement Officer (TPO)",
        "role_category": "PLACEMENT",
        "description": "Directorate head with full operational authority over recruitment, JNFs, and superdays",
        "max_allowed_scope": "INSTITUTION",
        "permissions": [
            "placement.company.create", "placement.company.verify",
            "placement.jnf.submit", "placement.jnf.approve", "placement.jnf.edit",
            "placement.drive.publish", "placement.drive.manage",
            "placement.application.view", "placement.application.status_update",
            "placement.shortlist.publish", "placement.interview.schedule",
            "placement.superday.solve", "placement.offer.record", "placement.offer.approve",
            "placement.offer.rescind", "placement.policy.override", "placement.export.pii",
            "student.profile.read", "student.academic.override", "student.verification.approve", "student.record.export",
            "nirf.metrics.calculate", "nirf.report.view", "nirf.data.export", "reports.pipeline.execute",
            "consent.notice.publish", "consent.audit.export",
            "agent.catalog.read", "agent.execute.run", "agent.trace.view", "agent.fairness.audit",
            "iam.role.assign", "iam.delegation.create", "iam.delegation.revoke",
        ],
    },
    {
        "role_code": "TPO_COORDINATOR",
        "role_name": "Placement Officer / Operations Manager",
        "role_category": "PLACEMENT",
        "description": "Operational drive manager for scheduling, applications, and student communication",
        "max_allowed_scope": "CAMPUS",
        "permissions": [
            "placement.company.create", "placement.jnf.submit", "placement.jnf.edit",
            "placement.drive.manage", "placement.application.view", "placement.application.status_update",
            "placement.shortlist.publish", "placement.interview.schedule",
            "placement.superday.solve", "placement.offer.record",
            "student.profile.read", "student.verification.approve",
            "reports.pipeline.execute", "agent.catalog.read", "agent.execute.run",
        ],
    },
    {
        "role_code": "SCHOOL_HEAD",
        "role_name": "Executive Dean & Head of School",
        "role_category": "ADMINISTRATIVE",
        "description": "Executive academic head overseeing departments, faculty, curriculum, and placement outcomes",
        "max_allowed_scope": "CAMPUS",
        "permissions": [
            "institution.profile.read", "campus.update", "organization.unit.update",
            "student.profile.read", "student.academic.override", "reports.pipeline.execute",
            "nirf.report.view", "placement.drive.manage", "placement.application.view",
        ],
    },
    {
        "role_code": "DEPARTMENT_HEAD",
        "role_name": "Head of Department (HOD)",
        "role_category": "ACADEMIC",
        "description": "Academic departmental head overseeing faculty rosters, curriculum delivery, and student progress",
        "max_allowed_scope": "ORGANIZATIONAL_UNIT",
        "permissions": [
            "student.profile.read", "student.academic.override", "student.verification.approve",
            "placement.application.view", "placement.drive.manage", "reports.pipeline.execute",
        ],
    },
    {
        "role_code": "FACULTY_MENTOR",
        "role_name": "Faculty Teacher & Academic Mentor",
        "role_category": "ACADEMIC",
        "description": "Faculty member delivering courses, grading CIEs, and counseling assigned student mentees",
        "max_allowed_scope": "ORGANIZATIONAL_UNIT",
        "permissions": [
            "student.profile.read", "student.verification.approve", "placement.application.view",
        ],
    },
    {
        "role_code": "DEPT_COORDINATOR",
        "role_name": "Department Faculty Placement Coordinator",
        "role_category": "ACADEMIC",
        "description": "Departmental faculty representative overseeing departmental candidate eligibility",
        "max_allowed_scope": "ORGANIZATIONAL_UNIT",
        "permissions": [
            "student.profile.read", "student.academic.override", "student.verification.approve",
            "placement.application.view", "placement.drive.manage",
            "reports.pipeline.execute",
        ],
    },
    {
        "role_code": "PLACEMENT_REP",
        "role_name": "Student Placement Representative (SPC)",
        "role_category": "STUDENT",
        "description": "Student coordinator assisting with logistics, interview check-ins, and clash resolution",
        "max_allowed_scope": "ORGANIZATIONAL_UNIT",
        "permissions": [
            "placement.application.view", "placement.interview.schedule",
            "placement.superday.solve", "student.profile.read",
        ],
    },
    {
        "role_code": "STUDENT_MEMBER",
        "role_name": "Registered Student Candidate",
        "role_category": "STUDENT",
        "description": "Self-service candidate portal to browse drives, apply, and manage DPDP consent",
        "max_allowed_scope": "SELF",
        "permissions": [
            "student.profile.read", "student.profile.update_self",
            "placement.application.create", "placement.application.view",
            "consent.grant.record", "consent.withdraw.process",
        ],
    },
    {
        "role_code": "RECRUITER_EXTERNAL",
        "role_name": "External Corporate Recruiter",
        "role_category": "PLACEMENT",
        "description": "Corporate partner account to post JNFs, evaluate shortlisted candidates, and schedule slots",
        "max_allowed_scope": "SELF",
        "permissions": [
            "placement.jnf.submit", "placement.application.view", "placement.application.status_update",
            "placement.interview.schedule", "placement.offer.record",
        ],
    },
    {
        "role_code": "AI_AGENT_RUNNER",
        "role_name": "Autonomous Copilot Service Account",
        "role_category": "SYSTEM",
        "description": "Controlled machine identity for autonomous multi-agent pipeline executions",
        "max_allowed_scope": "INSTITUTION",
        "permissions": [
            "placement.application.view", "placement.superday.solve",
            "agent.catalog.read", "agent.execute.run", "agent.trace.view", "agent.fairness.audit",
            "reports.pipeline.execute", "nirf.metrics.calculate",
        ],
    },
    {
        "role_code": "AUDITOR",
        "role_name": "Statutory & NIRF External Auditor",
        "role_category": "ADMINISTRATIVE",
        "description": "Read-only access to statutory reports, demographic fairness audits, and accreditation traces",
        "max_allowed_scope": "INSTITUTION",
        "permissions": [
            "nirf.report.view", "nirf.data.export", "reports.statutory.sign",
            "agent.fairness.audit", "agent.trace.view", "iam.audit.view",
        ],
    },
]


def seed_baseline_roles(db=None) -> int:
    """Seeds or updates standard platform-defined baseline roles and version 1."""
    if db is None:
        db = get_db()

    # Ensure permissions catalogue is loaded
    seed_permission_catalogue(db)

    count = 0
    now = datetime.now(timezone.utc)
    for r in BASELINE_ROLES:
        role_id = f"role_sys_{r['role_code'].lower()}"
        role_doc = {
            "role_id": role_id,
            "tenant_id": None,
            "institution_id": None,
            "role_code": r["role_code"],
            "role_name": r["role_name"],
            "role_category": r["role_category"],
            "role_owner_type": "PLATFORM",
            "status": "ACTIVE",
            "current_version": 1,
            "description": r["description"],
            "created_at": now,
            "updated_at": now,
        }
        db.roles.update_one(
            {"role_id": role_id},
            {"$set": role_doc},
            upsert=True,
        )

        version_id = f"{role_id}_v1"
        version_doc = {
            "version_id": version_id,
            "role_id": role_id,
            "version_number": 1,
            "permissions": r["permissions"],
            "max_allowed_scope": r["max_allowed_scope"],
            "status": "ACTIVE",
            "change_summary": "Initial baseline role definition",
            "published_at": now,
            "published_by": "system",
        }
        db.role_versions.update_one(
            {"version_id": version_id},
            {"$set": version_doc},
            upsert=True,
        )
        count += 1

    return count


def create_institution_role(
    tenant_id: str,
    institution_id: str,
    role_code: str,
    role_name: str,
    role_category: str,
    initial_permissions: List[str],
    max_allowed_scope: str = "ORGANIZATIONAL_UNIT",
    description: Optional[str] = None,
    created_by: str = "system",
    db=None,
) -> Dict[str, Any]:
    """Creates a custom versioned role definition for an institution."""
    if db is None:
        db = get_db()

    role_code = role_code.upper().strip()
    role_category = role_category.upper().strip()
    max_allowed_scope = max_allowed_scope.upper().strip()

    if role_category not in ["ACADEMIC", "ADMINISTRATIVE", "PLACEMENT", "STUDENT", "SYSTEM"]:
        raise RoleValidationError(f"Invalid role_category '{role_category}'.")
    if max_allowed_scope not in ["PLATFORM", "TENANT", "INSTITUTION", "CAMPUS", "ORGANIZATIONAL_UNIT", "SELF"]:
        raise RoleValidationError(f"Invalid max_allowed_scope '{max_allowed_scope}'.")

    # Invariant: Institutional roles can NEVER exceed INSTITUTION scope
    if max_allowed_scope in ["PLATFORM", "TENANT"]:
        raise RoleValidationError(f"Institutional roles cannot claim '{max_allowed_scope}' scope.")

    # Check for duplicate code
    if db.roles.find_one({"tenant_id": tenant_id, "institution_id": institution_id, "role_code": role_code}):
        raise RoleValidationError(f"Role code '{role_code}' already exists in this institution.")

    role_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    role_doc = {
        "role_id": role_id,
        "tenant_id": tenant_id,
        "institution_id": institution_id,
        "role_code": role_code,
        "role_name": role_name.strip(),
        "role_category": role_category,
        "role_owner_type": "INSTITUTION",
        "status": "ACTIVE",
        "current_version": 1,
        "description": description.strip() if description else None,
        "created_at": now,
        "updated_at": now,
    }

    version_id = str(uuid.uuid4())
    version_doc = {
        "version_id": version_id,
        "role_id": role_id,
        "version_number": 1,
        "permissions": initial_permissions,
        "max_allowed_scope": max_allowed_scope,
        "status": "ACTIVE",
        "change_summary": "Initial role creation",
        "published_at": now,
        "published_by": created_by,
    }

    db.roles.insert_one(role_doc)
    db.role_versions.insert_one(version_doc)

    publish_event(
        aggregate_type="ROLE",
        aggregate_id=role_id,
        event_type="RoleCreated",
        tenant_id=tenant_id,
        payload={"role_id": role_id, "role_code": role_code, "institution_id": institution_id},
        db=db,
    )

    role_doc.pop("_id", None)
    return role_doc


def publish_role_version(
    role_id: str,
    permissions: List[str],
    max_allowed_scope: str,
    published_by: str,
    change_summary: str,
    db=None,
) -> Dict[str, Any]:
    """Publishes a new immutable version of a role definition without altering history."""
    if db is None:
        db = get_db()

    role = db.roles.find_one({"role_id": role_id})
    if not role:
        raise RoleNotFoundError(f"Role '{role_id}' not found.")

    max_allowed_scope = max_allowed_scope.upper().strip()
    if role.get("role_owner_type") == "INSTITUTION" and max_allowed_scope in ["PLATFORM", "TENANT"]:
        raise RoleValidationError(f"Institutional roles cannot claim '{max_allowed_scope}' scope.")

    new_version_num = role.get("current_version", 1) + 1
    now = datetime.now(timezone.utc)
    version_id = str(uuid.uuid4())

    # Mark prior active version as superseded
    db.role_versions.update_many(
        {"role_id": role_id, "status": "ACTIVE"},
        {"$set": {"status": "SUPERSEDED"}},
    )

    new_version_doc = {
        "version_id": version_id,
        "role_id": role_id,
        "version_number": new_version_num,
        "permissions": permissions,
        "max_allowed_scope": max_allowed_scope,
        "status": "ACTIVE",
        "change_summary": change_summary.strip(),
        "published_at": now,
        "published_by": published_by,
    }
    db.role_versions.insert_one(new_version_doc)

    db.roles.update_one(
        {"role_id": role_id},
        {"$set": {"current_version": new_version_num, "updated_at": now}},
    )

    publish_event(
        aggregate_type="ROLE",
        aggregate_id=role_id,
        event_type="RoleVersionPublished",
        tenant_id=role.get("tenant_id") or "global",
        payload={"role_id": role_id, "version_number": new_version_num, "published_by": published_by},
        db=db,
    )

    new_version_doc.pop("_id", None)
    return new_version_doc


ROLE_ALIASES = {
    "FACULTY_COORDINATOR": "DEPT_COORDINATOR",
    "PLACEMENT_OFFICE_COORDINATOR": "TPO_COORDINATOR",
    "INSTITUTIONAL_ADMINISTRATOR": "INSTITUTION_HEAD",
    "STATUTORY_AUDITOR": "AUDITOR",
    "STUDENT": "STUDENT_MEMBER",
}


def get_role_by_id(role_id: str, db=None) -> Dict[str, Any]:
    """Retrieves a role definition by ID or role code (flexible matching with alias support)."""
    if db is None:
        db = get_db()
    code_no_prefix = role_id[5:] if role_id.upper().startswith("ROLE_") else role_id
    code_with_prefix = f"ROLE_{role_id}" if not role_id.upper().startswith("ROLE_") else role_id
    aliased_code = ROLE_ALIASES.get(code_no_prefix.upper(), code_no_prefix)

    role = db.roles.find_one({
        "$or": [
            {"role_id": role_id},
            {"role_code": role_id},
            {"role_code": code_no_prefix},
            {"role_code": code_with_prefix},
            {"role_code": aliased_code},
            {"role_id": f"role_sys_{code_no_prefix.lower()}"},
            {"role_id": f"role_sys_{aliased_code.lower()}"},
        ]
    }, {"_id": 0})
    if not role:
        raise RoleNotFoundError(f"Role '{role_id}' not found.")
    return role


def get_role_permissions(role_id: str, version_number: Optional[int] = None, db=None) -> List[str]:
    """Retrieves the list of permission keys granted by a role version."""
    if db is None:
        db = get_db()

    role = get_role_by_id(role_id, db=db)
    v_num = version_number or role.get("current_version", 1)

    v_doc = db.role_versions.find_one({"role_id": role_id, "version_number": v_num}, {"_id": 0})
    if not v_doc:
        raise RoleNotFoundError(f"Role version {v_num} for role '{role_id}' not found.")

    return v_doc.get("permissions", [])


create_custom_role = create_institution_role
