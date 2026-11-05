"""CAMP-02: Permission Catalogue Domain Engine (Section 7).

Defines atomic capabilities with domain.resource.action naming conventions.
Centralized catalogue prevents arbitrary permission semantics.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from database.connection import get_db

# 60+ Atomic Action Permissions across All Platform Domains
PERMISSION_CATALOGUE: List[Dict[str, Any]] = [
    # 1. IAM & Security Domain
    {"permission_key": "iam.account.create", "domain": "IAM", "resource": "account", "action": "create", "description": "Provision new login accounts"},
    {"permission_key": "iam.account.lock", "domain": "IAM", "resource": "account", "action": "lock", "description": "Lock suspicious or brute-forced accounts"},
    {"permission_key": "iam.account.unlock", "domain": "IAM", "resource": "account", "action": "unlock", "description": "Unlock locked accounts"},
    {"permission_key": "iam.membership.invite", "domain": "IAM", "resource": "membership", "action": "invite", "description": "Invite users to institutional membership"},
    {"permission_key": "iam.membership.activate", "domain": "IAM", "resource": "membership", "action": "activate", "description": "Activate institutional memberships"},
    {"permission_key": "iam.membership.suspend", "domain": "IAM", "resource": "membership", "action": "suspend", "description": "Suspend institutional memberships"},
    {"permission_key": "iam.role.create", "domain": "IAM", "resource": "role", "action": "create", "description": "Create custom institutional role definitions"},
    {"permission_key": "iam.role.version_publish", "domain": "IAM", "resource": "role", "action": "publish", "description": "Publish new immutable role versions"},
    {"permission_key": "iam.role.assign", "domain": "IAM", "resource": "role_assignment", "action": "assign", "description": "Assign roles to accounts at specific scopes"},
    {"permission_key": "iam.role.revoke", "domain": "IAM", "resource": "role_assignment", "action": "revoke", "description": "Revoke active role assignments"},
    {"permission_key": "iam.delegation.create", "domain": "IAM", "resource": "delegation", "action": "create", "description": "Delegate bounded temporary authorities"},
    {"permission_key": "iam.delegation.revoke", "domain": "IAM", "resource": "delegation", "action": "revoke", "description": "Revoke active authority delegations"},
    {"permission_key": "iam.session.revoke", "domain": "IAM", "resource": "session", "action": "revoke", "description": "Immediately terminate active user sessions"},
    {"permission_key": "iam.audit.view", "domain": "IAM", "resource": "audit_log", "action": "read", "description": "View identity and authorization audit trails"},
    {"permission_key": "iam.privileged.request", "domain": "IAM", "resource": "privileged_access", "action": "request", "description": "Request break-glass elevated privileges"},
    {"permission_key": "iam.privileged.approve", "domain": "IAM", "resource": "privileged_access", "action": "approve", "description": "Approve break-glass elevated access requests"},

    # 2. Institutional Architecture (CAMP-01) Domain
    {"permission_key": "institution.profile.read", "domain": "CAMP_01", "resource": "institution", "action": "read", "description": "View institutional metadata and legal details"},
    {"permission_key": "institution.profile.update", "domain": "CAMP_01", "resource": "institution", "action": "update", "description": "Update institutional configuration and classifications"},
    {"permission_key": "campus.create", "domain": "CAMP_01", "resource": "campus", "action": "create", "description": "Provision new physical or virtual campuses"},
    {"permission_key": "campus.update", "domain": "CAMP_01", "resource": "campus", "action": "update", "description": "Modify campus operational attributes"},
    {"permission_key": "campus.close", "domain": "CAMP_01", "resource": "campus", "action": "close", "description": "Decommission or close campus enclaves"},
    {"permission_key": "organization.unit.create", "domain": "CAMP_01", "resource": "org_unit", "action": "create", "description": "Create schools, departments, and centers"},
    {"permission_key": "organization.unit.update", "domain": "CAMP_01", "resource": "org_unit", "action": "update", "description": "Modify organizational unit properties"},
    {"permission_key": "organization.structure.approve", "domain": "CAMP_01", "resource": "org_hierarchy", "action": "approve", "description": "Approve institutional restructuring and lineage changes"},
    {"permission_key": "configuration.version.create", "domain": "CAMP_01", "resource": "configuration", "action": "create", "description": "Author new institutional policy configuration versions"},
    {"permission_key": "configuration.resolve", "domain": "CAMP_01", "resource": "configuration", "action": "read", "description": "Resolve effective configuration across inheritance trees"},

    # 3. Placement & Corporate Relations Directorate
    {"permission_key": "placement.company.create", "domain": "PLACEMENT", "resource": "company", "action": "create", "description": "Register corporate recruiting partners"},
    {"permission_key": "placement.company.verify", "domain": "PLACEMENT", "resource": "company", "action": "verify", "description": "Verify employer legal credentials and CIN/PAN"},
    {"permission_key": "placement.jnf.submit", "domain": "PLACEMENT", "resource": "jnf", "action": "create", "description": "Submit Job Notification Forms (JNFs)"},
    {"permission_key": "placement.jnf.approve", "domain": "PLACEMENT", "resource": "jnf", "action": "approve", "description": "Approve corporate recruitment drives & compensation bands"},
    {"permission_key": "placement.jnf.edit", "domain": "PLACEMENT", "resource": "jnf", "action": "update", "description": "Edit JNF eligibility criteria and CTC breakdowns"},
    {"permission_key": "placement.drive.publish", "domain": "PLACEMENT", "resource": "drive", "action": "publish", "description": "Publish approved drives to eligible candidate pools"},
    {"permission_key": "placement.drive.manage", "domain": "PLACEMENT", "resource": "drive", "action": "update", "description": "Manage recruitment round timelines and venues"},
    {"permission_key": "placement.application.create", "domain": "PLACEMENT", "resource": "application", "action": "create", "description": "Apply for open recruitment drives"},
    {"permission_key": "placement.application.view", "domain": "PLACEMENT", "resource": "application", "action": "read", "description": "View candidate applications for authorized drives"},
    {"permission_key": "placement.application.status_update", "domain": "PLACEMENT", "resource": "application", "action": "update", "description": "Progress candidates through recruitment rounds"},
    {"permission_key": "placement.shortlist.publish", "domain": "PLACEMENT", "resource": "shortlist", "action": "publish", "description": "Publish verified round shortlists to students"},
    {"permission_key": "placement.interview.schedule", "domain": "PLACEMENT", "resource": "interview", "action": "create", "description": "Schedule interview panels and venue slots"},
    {"permission_key": "placement.superday.solve", "domain": "PLACEMENT", "resource": "superday", "action": "resolve", "description": "Execute constraint solver for concurrent interview clashes"},
    {"permission_key": "placement.offer.record", "domain": "PLACEMENT", "resource": "offer", "action": "create", "description": "Record official placement offers and CTC packages"},
    {"permission_key": "placement.offer.approve", "domain": "PLACEMENT", "resource": "offer", "action": "approve", "description": "Approve final placement registrations in institutional ledger"},
    {"permission_key": "placement.offer.rescind", "domain": "PLACEMENT", "resource": "offer", "action": "revoke", "description": "Rescind or handle reneged placement offers"},
    {"permission_key": "placement.policy.override", "domain": "PLACEMENT", "resource": "placement_policy", "action": "override", "description": "Override 'One Student One Job' or Dream/Super-Dream rules"},
    {"permission_key": "placement.export.pii", "domain": "PLACEMENT", "resource": "candidate_data", "action": "export", "description": "Export candidate contact PII (strictly governed by DPDP)"},

    # 4. Candidate Registry & Student Dossier Domain
    {"permission_key": "student.profile.read", "domain": "DOSSIER", "resource": "student", "action": "read", "description": "Read student academic profile and verified CGPA"},
    {"permission_key": "student.profile.update_self", "domain": "DOSSIER", "resource": "student", "action": "update", "description": "Update personal bio, resumes, and portfolio projects"},
    {"permission_key": "student.profile.update_admin", "domain": "DOSSIER", "resource": "student", "action": "update", "description": "Administrative correction of roll numbers and branches"},
    {"permission_key": "student.academic.override", "domain": "DOSSIER", "resource": "academic_record", "action": "override", "description": "Authoritative faculty override for disputed backlogs"},
    {"permission_key": "student.verification.approve", "domain": "DOSSIER", "resource": "verification", "action": "verify", "description": "Verify student marksheets and APAAR registry links"},
    {"permission_key": "student.record.export", "domain": "DOSSIER", "resource": "student", "action": "export", "description": "Export candidate cohort rosters for statutory audits"},

    # 5. NIRF & Statutory Reporting Domain
    {"permission_key": "nirf.metrics.calculate", "domain": "NIRF", "resource": "nirf", "action": "create", "description": "Compute NIRF Graduation Outcome (GPH & GMS) metrics"},
    {"permission_key": "nirf.report.view", "domain": "NIRF", "resource": "nirf", "action": "read", "description": "View institutional accreditation audit reports"},
    {"permission_key": "nirf.data.export", "domain": "NIRF", "resource": "nirf", "action": "export", "description": "Generate official Ministry of Education NIRF Data CSV"},
    {"permission_key": "reports.pipeline.execute", "domain": "NIRF", "resource": "reports", "action": "read", "description": "Execute live MongoDB aggregation pipelines ($facet, $bucket)"},
    {"permission_key": "reports.statutory.sign", "domain": "NIRF", "resource": "reports", "action": "approve", "description": "Digitally sign official university statutory audit summaries"},

    # 6. DPDP Privacy & Consent Ledger Domain
    {"permission_key": "consent.notice.publish", "domain": "CONSENT", "resource": "consent_notice", "action": "publish", "description": "Publish versioned DPDP Section 5 privacy notices"},
    {"permission_key": "consent.grant.record", "domain": "CONSENT", "resource": "consent_record", "action": "create", "description": "Record affirmative candidate data sharing consents"},
    {"permission_key": "consent.withdraw.process", "domain": "CONSENT", "resource": "consent_record", "action": "revoke", "description": "Process DPDP Section 6(4) instant consent withdrawals"},
    {"permission_key": "consent.audit.export", "domain": "CONSENT", "resource": "consent_audit", "action": "export", "description": "Export immutable cryptographic consent trace ledger"},

    # 7. Autonomous Copilot & Multi-Agent AI Domain
    {"permission_key": "agent.catalog.read", "domain": "AI_AGENT", "resource": "agent", "action": "read", "description": "Inspect registered autonomous AI agent tools and specifications"},
    {"permission_key": "agent.execute.run", "domain": "AI_AGENT", "resource": "agent", "action": "execute", "description": "Trigger autonomous multi-agent copilot reasoning jobs"},
    {"permission_key": "agent.trace.view", "domain": "AI_AGENT", "resource": "agent_trace", "action": "read", "description": "Inspect complete step-by-step LLM reasoning traces"},
    {"permission_key": "agent.fairness.audit", "domain": "AI_AGENT", "resource": "fairness_audit", "action": "read", "description": "Audit demographic fairness across gender and caste slices"},

    # 8. Academic Structure & Student Lifecycle Domain (CAMP-03)
    {"permission_key": "academic.program.manage", "domain": "ACADEMIC", "resource": "program", "action": "update", "description": "Create and manage academic programs and campus offerings"},
    {"permission_key": "academic.curriculum.approve", "domain": "ACADEMIC", "resource": "curriculum_version", "action": "approve", "description": "Approve and lock versioned degree curriculum specifications"},
    {"permission_key": "academic.course.manage", "domain": "ACADEMIC", "resource": "course", "action": "update", "description": "Manage institutional course catalogue and syllabus L-T-P-S credits"},
    {"permission_key": "academic.calendar.manage", "domain": "ACADEMIC", "resource": "academic_calendar", "action": "update", "description": "Configure multi-model academic calendars and registration windows"},
    {"permission_key": "academic.registration.manage", "domain": "ACADEMIC", "resource": "course_registration", "action": "update", "description": "Administer term course registration overrides and drop/adds"},
    {"permission_key": "academic.credit.award", "domain": "ACADEMIC", "resource": "credit_ledger", "action": "create", "description": "Award academic, vocational, and transfer credits to student ledger"},
    {"permission_key": "academic.credit.adjust", "domain": "ACADEMIC", "resource": "credit_ledger", "action": "override", "description": "Execute append-only offsetting credit reversals and moderations"},
    {"permission_key": "academic.progression.evaluate", "domain": "ACADEMIC", "resource": "progression", "action": "evaluate", "description": "Execute deterministic 6-step promotion rule engine"},
]


def seed_permission_catalogue(db=None) -> int:
    """Idempotently populates the central permission catalogue into MongoDB."""
    if db is None:
        db = get_db()

    count = 0
    now = datetime.now(timezone.utc)
    for p in PERMISSION_CATALOGUE:
        doc = {
            "permission_key": p["permission_key"],
            "domain": p["domain"],
            "resource": p["resource"],
            "action": p["action"],
            "description": p["description"],
            "is_system": True,
            "created_at": now,
        }
        db.permissions.update_one(
            {"permission_key": p["permission_key"]},
            {"$setOnInsert": doc},
            upsert=True,
        )
        count += 1
    return count


def list_permissions(domain: Optional[str] = None, db=None) -> List[Dict[str, Any]]:
    """Lists registered atomic permissions, optionally filtered by domain."""
    if db is None:
        db = get_db()
    query = {"domain": domain.upper().strip()} if domain else {}
    cursor = db.permissions.find(query, {"_id": 0}).sort("permission_key", 1)
    return list(cursor)


def get_permission(permission_key: str, db=None) -> Optional[Dict[str, Any]]:
    """Retrieves an atomic permission by its key."""
    if db is None:
        db = get_db()
    return db.permissions.find_one({"permission_key": permission_key.strip()}, {"_id": 0})


seed_baseline_permissions = seed_permission_catalogue
ALL_PERMISSIONS = PERMISSION_CATALOGUE
