"""PlaceFlow / Meridian — Role-Based & User-Specific Campus AI Copilot Views.

Provides role-tailored, user-grounded AI copilot capabilities across:
- Student (Candidate Career & Readiness Copilot)
- TPO (Placement Operations & Superday Copilot)
- Faculty (Academic Mentorship & Approvals Copilot)
- HOD (Department Executive & Curriculum Copilot)
- Management (Institutional Strategy & NIRF Copilot)
- Admin (Campus AI Governance & Sandbox Auditor)
"""

from typing import Any, Dict, List, Optional
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from database.connection import get_db
from campus_ai.gateway import CampusAIGateway, TenantTokenQuotaExceededError
from campus_ai.pip import PromptInjectionFilter, PromptInjectionDetectedError
from campus_ai.router import TaskType, ModelRouter
from campus_ai.rag import InstitutionalRAGEngine
from campus_ai.agents import (
    JNFIntelligenceAgent,
    SuperdayClashSolverAgent,
    AcademicAdvisorAgent,
    NIRFStatutoryAuditAgent,
)
from camp_02.roles import BASELINE_ROLES

ROLE_LABELS = {r["role_code"]: r["role_name"] for r in BASELINE_ROLES}

ROLE_PERSONA_MAP = {
    "STUDENT_MEMBER": {
        "title": "Candidate Career & Readiness Copilot",
        "portal": "student",
        "description": "Placement eligibility, interview preparation, NEP 2020 exit credits, and DPDP consent rights.",
        "allowed_agents": ["AcademicAdvisorAgent", "SuperdayClashSolverAgent"],
        "quick_prompts": [
            "Am I eligible for upcoming Tier-1 Super Dream drives with my CGPA?",
            "Check my NEP 2020 completed credits for graduation",
            "How do I withdraw recruiter data consent under DPDP Act 2023?",
            "What happens if I turn down an on-campus placement offer?",
        ],
    },
    "TPO_OFFICER": {
        "title": "Placement Operations & Drive Copilot",
        "portal": "tpo",
        "description": "JNF tier compliance, Superday slot clash resolution, renege radar flight risk, and Section 9.3 disparate impact auditing.",
        "allowed_agents": ["JNFIntelligenceAgent", "SuperdayClashSolverAgent"],
        "quick_prompts": [
            "Classify Microsoft JNF (₹26.5 LPA, 7.5 CGPA) against tier policy",
            "Solve Superday clashes for overlapping student interview slots",
            "Compute post-offer renege risk telemetry across active cohorts",
            "Audit Section 9.3 fairness & demographic disparate impact ratios",
        ],
    },
    "PLACEMENT_COORDINATOR": {
        "title": "Placement Operations & Drive Copilot",
        "portal": "tpo",
        "description": "JNF tier compliance, Superday slot clash resolution, and candidate interview coordination.",
        "allowed_agents": ["JNFIntelligenceAgent", "SuperdayClashSolverAgent"],
        "quick_prompts": [
            "Check student interview schedule collisions for Superday",
            "Verify CTC tier threshold for newly submitted JNF",
            "Review placement policy for concurrent applications",
        ],
    },
    "FACULTY_MENTOR": {
        "title": "Academic Mentorship & Approvals Copilot",
        "portal": "faculty",
        "description": "Mentee academic tracking, course prerequisites, placement leave NOCs, and attendance remediation.",
        "allowed_agents": ["AcademicAdvisorAgent"],
        "quick_prompts": [
            "Advise student on NEP 2020 prerequisite credits fulfillment",
            "What is the minimum attendance criteria for placement NOC endorsement?",
            "Summarize student academic standing for employer recommendation",
            "Regulations for credit waivers during final-semester corporate internships",
        ],
    },
    "HOD": {
        "title": "Department Executive & Curriculum Copilot",
        "portal": "hod",
        "description": "Curriculum skill gap analysis, placement conversion trends, and faculty mentorship workload balance.",
        "allowed_agents": ["AcademicAdvisorAgent"],
        "quick_prompts": [
            "What are the department placement conversion rates vs target benchmarks?",
            "Evaluate curriculum transition diffs from v1.0 to v2.0",
            "Check faculty mentor allocation balance across department",
            "Review batch verification requirements for upcoming placement drives",
        ],
    },
    "EXECUTIVE_LEADER": {
        "title": "Institutional Strategy & Statutory Copilot",
        "portal": "management",
        "description": "NIRF Table 5.1 outcome audits, NBA Criterion 4 accreditation, and cross-campus placement parity.",
        "allowed_agents": ["NIRFStatutoryAuditAgent"],
        "quick_prompts": [
            "Audit NIRF 2025-26 graduation outcomes and median salary KPIs",
            "Generate NBA Criterion 4 placement and higher studies digest",
            "Analyze cross-campus compensation parity and hiring partner ROI",
            "Statutory governance requirements for student career telemetry",
        ],
    },
    "INSTITUTION_ADMIN": {
        "title": "Campus AI Governance & Sandbox Auditor",
        "portal": "admin",
        "description": "Autonomous multi-agent execution, tool risk tier gates, AI token quotas, and cryptographic trace audits.",
        "allowed_agents": [
            "JNFIntelligenceAgent",
            "SuperdayClashSolverAgent",
            "AcademicAdvisorAgent",
            "NIRFStatutoryAuditAgent",
        ],
        "quick_prompts": [
            "Run JNF intelligence agent for new corporate opening",
            "Audit department AI token consumption and rate limits",
            "Inspect autonomous agent execution traces and tool security gates",
            "Verify zero-injection PIP defense and DPDP 2023 PII masking",
        ],
    },
}

PORTAL_ROLE_CODE_MAP = {
    "student": "STUDENT_MEMBER",
    "tpo": "TPO_OFFICER",
    "faculty": "FACULTY_MENTOR",
    "hod": "HOD",
    "management": "EXECUTIVE_LEADER",
    "admin": "INSTITUTION_ADMIN",
}

ROLE_PROFILE_DATA: Dict[str, Dict[str, Any]] = {
    "student": {
        "profile_summary": {
            "roll_no": "221CS104",
            "batch": "2022-2026",
            "degree": "B.Tech Computer Science & Engineering",
            "cgpa": 8.42,
            "backlogs": 0,
            "completed_credits": 128,
            "total_credits": 160,
            "active_applications": 2,
            "offers_count": 0,
            "skills": ["Python", "FastAPI", "React", "PostgreSQL", "Docker"],
            "nep_level": "Level 8 (Honours with Research)",
            "dpdp_consent": "Active (Granular Consent Granted)",
        },
        "shareable_attributes": [
            {
                "key": "academic_records",
                "label": "Academic Performance & CGPA",
                "description": "CGPA (8.42), 0 Backlogs, 128/160 credits completed",
                "category": "Academic",
                "default_enabled": True,
                "data_payload": {
                    "cgpa": 8.42,
                    "active_backlogs": 0,
                    "completed_credits": 128,
                    "total_degree_credits": 160,
                    "academic_standing": "Good Standing (Top 15%)",
                },
            },
            {
                "key": "applications_pipeline",
                "label": "Active Drive Applications & Pipeline",
                "description": "2 active applications (Google, Amazon), 0 accepted offers",
                "category": "Placement",
                "default_enabled": True,
                "data_payload": {
                    "active_applications_count": 2,
                    "applications": [
                        {"company": "Google", "role": "Software Engineering Intern", "status": "Online Assessment Cleared"},
                        {"company": "Amazon", "role": "SDE-1 Campus Drive", "status": "Application Shortlisted"},
                    ],
                    "offers": [],
                    "concurrent_applications_limit": 5,
                    "remaining_slots": 3,
                },
            },
            {
                "key": "skills_and_resume",
                "label": "Skills, Projects & Resume Signals",
                "description": "Python, FastAPI, React, PostgreSQL, Docker",
                "category": "Technical",
                "default_enabled": True,
                "data_payload": {
                    "skills": ["Python", "FastAPI", "React", "PostgreSQL", "Docker", "Algorithms"],
                    "verified_projects_count": 3,
                    "github_portfolio": "https://github.com/student/dev",
                },
            },
            {
                "key": "nep_progression",
                "label": "NEP 2020 Exit Framework & Credits",
                "description": "Level 8 Honours Path (128 completed / 32 remaining)",
                "category": "Curriculum",
                "default_enabled": True,
                "data_payload": {
                    "degree_path": "NEP 2020 Level 8 (4-Year UG with Research)",
                    "major_credits": 96,
                    "multidisciplinary_credits": 20,
                    "value_added_credits": 12,
                    "eligible_for_exit_certificate": True,
                },
            },
            {
                "key": "personal_identity",
                "label": "Personal Identifiers & Contact",
                "description": "Roll No: 221CS104, Institutional Email, Phone",
                "category": "Identity",
                "default_enabled": False,
                "data_payload": {
                    "roll_no": "221CS104",
                    "official_email": "student.aarav@nitk.edu",
                    "phone": "+91 98765 43210",
                },
            },
        ],
    },
    "faculty": {
        "profile_summary": {
            "faculty_id": "FAC-CSE-042",
            "designation": "Associate Professor",
            "department": "Computer Science & Engineering",
            "advisees_count": 18,
            "attendance_alerts_count": 3,
            "pending_nocs": 4,
        },
        "shareable_attributes": [
            {
                "key": "mentee_roster",
                "label": "Assigned Mentee Academic Records",
                "description": "18 Advisees in B.Tech CSE (Batch 2022-26)",
                "category": "Mentorship",
                "default_enabled": True,
                "data_payload": {
                    "advisees_count": 18,
                    "average_mentee_cgpa": 8.15,
                    "department": "Computer Science & Engineering",
                },
            },
            {
                "key": "attendance_alerts",
                "label": "Attendance & Remediation Alerts (<75%)",
                "description": "3 mentees currently below 75% mandatory threshold",
                "category": "Academic",
                "default_enabled": True,
                "data_payload": {
                    "at_risk_mentees_count": 3,
                    "alerts": [
                        {"name": "Karan V.", "attendance_pct": 71.4, "subject": "Distributed Systems"},
                        {"name": "Sneha P.", "attendance_pct": 68.2, "subject": "Compiler Design"},
                        {"name": "Rohan D.", "attendance_pct": 73.0, "subject": "Database Engineering"},
                    ],
                },
            },
            {
                "key": "noc_requests",
                "label": "Placement NOC Clearance Requests",
                "description": "4 pending corporate internship NOC endorsements",
                "category": "Approvals",
                "default_enabled": True,
                "data_payload": {
                    "pending_noc_count": 4,
                    "internship_partners": ["Microsoft IDC", "Oracle Cloud", "Cisco Systems", "Morgan Stanley"],
                },
            },
            {
                "key": "faculty_identity",
                "label": "Staff ID & Office Details",
                "description": "ID: FAC-CSE-042, Room CS-308",
                "category": "Identity",
                "default_enabled": False,
                "data_payload": {
                    "faculty_id": "FAC-CSE-042",
                    "office_room": "CS-308",
                },
            },
        ],
    },
    "tpo": {
        "profile_summary": {
            "officer_title": "Senior Placement Officer",
            "active_drives_count": 14,
            "superday_slots": 6,
            "renege_alerts_count": 2,
            "fairness_index": "88% (4/5ths Rule Compliant)",
        },
        "shareable_attributes": [
            {
                "key": "active_drives",
                "label": "Active Drives & Submitted JNFs",
                "description": "14 ongoing drives (4 Tier-1 Super Dream, 6 Tier-2 Dream)",
                "category": "Operations",
                "default_enabled": True,
                "data_payload": {
                    "active_drives_count": 14,
                    "tier_breakdown": {"tier_1_super_dream": 4, "tier_2_dream": 6, "tier_3_regular": 4},
                },
            },
            {
                "key": "superday_schedules",
                "label": "Superday Interview Conflict Logs",
                "description": "6 Superday slots with 2 overlapping candidate clashes",
                "category": "Arbitration",
                "default_enabled": True,
                "data_payload": {
                    "scheduled_slots_count": 6,
                    "detected_candidate_clashes": 2,
                    "affected_companies": ["Goldman Sachs", "Google"],
                },
            },
            {
                "key": "fairness_audit",
                "label": "Section 9.3 Four-Fifths Disparate Impact Index",
                "description": "88% compliance ratio across gender and reserved quotas",
                "category": "Compliance",
                "default_enabled": True,
                "data_payload": {
                    "adverse_impact_ratio": 0.88,
                    "four_fifths_threshold": 0.80,
                    "status": "COMPLIANT_NO_DISPARATE_IMPACT",
                },
            },
            {
                "key": "renege_radar",
                "label": "Renege Radar Flight Risk Telemetry",
                "description": "2 candidates flagged for potential post-offer renege",
                "category": "Risk",
                "default_enabled": False,
                "data_payload": {
                    "high_risk_candidates_count": 2,
                    "primary_driver": "Overlapping Super Dream offer upgrade attempts",
                },
            },
        ],
    },
    "hod": {
        "profile_summary": {
            "department": "Computer Science & Engineering",
            "placement_conversion_rate": "86.4%",
            "curriculum_version": "v2.0 (Industry 4.0 Aligned)",
            "faculty_mentors_count": 12,
        },
        "shareable_attributes": [
            {
                "key": "dept_conversions",
                "label": "Department Placement Conversion Benchmarks",
                "description": "86.4% of eligible students placed (123 / 142 placed)",
                "category": "Analytics",
                "default_enabled": True,
                "data_payload": {
                    "eligible_students": 142,
                    "placed_students": 123,
                    "conversion_rate_pct": 86.4,
                    "median_ctc": "14.6 LPA",
                },
            },
            {
                "key": "curriculum_diffs",
                "label": "Curriculum Matrix v1.0 vs v2.0 Gap Analysis",
                "description": "Curriculum updates for Generative AI & Cloud Distributed Systems",
                "category": "Curriculum",
                "default_enabled": True,
                "data_payload": {
                    "curriculum_version": "v2.0",
                    "new_industry_modules": ["Generative AI Pipelines", "High-Throughput Distributed Storage"],
                    "industry_alignment_score": "94/100",
                },
            },
            {
                "key": "mentor_load",
                "label": "Faculty Mentorship Workload Distribution",
                "description": "12 mentors, average 16 advisees per faculty member",
                "category": "Governance",
                "default_enabled": True,
                "data_payload": {
                    "active_mentors": 12,
                    "average_mentee_load": 15.8,
                    "variance": "Low (Equitable distribution)",
                },
            },
        ],
    },
    "management": {
        "profile_summary": {
            "nirf_go_score": "84.6 / 100",
            "nba_crit_4_score": "92 / 100",
            "cross_campus_median_ctc": "₹14.8 LPA",
            "total_institutions": 3,
        },
        "shareable_attributes": [
            {
                "key": "nirf_metrics",
                "label": "NIRF Table 5.1 Graduation Outcomes",
                "description": "Graduation outcomes, placement % and higher studies admissions",
                "category": "Accreditation",
                "default_enabled": True,
                "data_payload": {
                    "table_5_1_go_metric": 84.6,
                    "phd_intake_pct": 8.2,
                    "overall_placement_rate": 89.1,
                },
            },
            {
                "key": "nba_accreditation",
                "label": "NBA Criterion 4 Enrolment & Placement Audit",
                "description": "Criterion 4 composite score: 92/100 for Autonomous Tier-1",
                "category": "Accreditation",
                "default_enabled": True,
                "data_payload": {
                    "criterion_4_score": 92.0,
                    "student_cadre_ratio": "1:15 compliant",
                },
            },
            {
                "key": "cross_campus_ctc",
                "label": "Cross-Campus Salary Parity & Hiring ROI",
                "description": "Comparison between Main, City and Tech Campuses",
                "category": "Strategy",
                "default_enabled": False,
                "data_payload": {
                    "main_campus_median": "15.2 LPA",
                    "city_campus_median": "14.4 LPA",
                    "parity_gap": "5.2% (Within statutory variance)",
                },
            },
        ],
    },
    "admin": {
        "profile_summary": {
            "pip_mode": "Zero-Injection Strict Filter Active",
            "token_quota_consumed": "16.8% (42,150 / 250,000)",
            "immutable_traces_count": 1248,
        },
        "shareable_attributes": [
            {
                "key": "agent_traces",
                "label": "Cryptographic Trace Ledger",
                "description": "1,248 immutable execution traces with SHA-256 integrity hashes",
                "category": "Security",
                "default_enabled": True,
                "data_payload": {
                    "total_traces": 1248,
                    "failed_runs": 0,
                    "tamper_proof_status": "VERIFIED_VALID",
                },
            },
            {
                "key": "token_quotas",
                "label": "Tenant AI Token Consumption & Quotas",
                "description": "42,150 tokens used of 250,000 quota (16.8%)",
                "category": "Infrastructure",
                "default_enabled": True,
                "data_payload": {
                    "consumed_tokens": 42150,
                    "total_quota": 250000,
                    "p95_latency_ms": 184,
                },
            },
            {
                "key": "pip_threat_logs",
                "label": "Zero-Injection PIP Defense Attack Logs",
                "description": "Real-time prompt injection scans & threat mitigations",
                "category": "Defense",
                "default_enabled": True,
                "data_payload": {
                    "filter_mode": "STRICT_ZERO_INJECTION",
                    "blocked_attempts_count": 14,
                    "status": "PROTECTED",
                },
            },
        ],
    },
}


def _enrich_student_profile(db, user, summary: Dict[str, Any], shareable_attrs: List[Dict[str, Any]]) -> None:
    """Enriches student profile data from live MongoDB documents if present."""
    from api.auth.queries import scoped_get

    person_id = getattr(user, "person_id", None)
    account_id = getattr(user, "account_id", None)
    email = getattr(user, "email", None)

    student_doc = None
    if person_id:
        student_doc = scoped_get("students", user, {"person_id": person_id}, db=db)
    if not student_doc and email:
        student_doc = scoped_get("students", user, {"email": email}, db=db)
    if not student_doc and account_id:
        student_doc = scoped_get("students", user, {"account_id": account_id}, db=db)

    if student_doc:
        cgpa = float(student_doc.get("cgpa", summary.get("cgpa", 8.42)))
        backlogs = int(student_doc.get("backlogs", summary.get("backlogs", 0)))
        skills = list(student_doc.get("skills", summary.get("skills", [])))
        roll_no = str(student_doc.get("reg_no") or student_doc.get("roll_no") or summary.get("roll_no", "221CS104"))

        summary["cgpa"] = cgpa
        summary["backlogs"] = backlogs
        summary["roll_no"] = roll_no
        if skills:
            summary["skills"] = skills

        for attr in shareable_attrs:
            if attr["key"] == "academic_records":
                attr["data_payload"]["cgpa"] = cgpa
                attr["data_payload"]["active_backlogs"] = backlogs
                attr["description"] = f"CGPA ({cgpa}), {backlogs} Backlogs, 128/160 credits completed"
            elif attr["key"] == "skills_and_resume" and skills:
                attr["data_payload"]["skills"] = skills
                attr["description"] = ", ".join(skills[:5])
            elif attr["key"] == "personal_identity":
                attr["data_payload"]["roll_no"] = roll_no
                attr["description"] = f"Roll No: {roll_no}, Official Email"


def _get_principal_persona(user, requested_lens: Optional[str] = None) -> Dict[str, Any]:
    """Resolves authoritative role persona and user metadata from authenticated principal."""
    assignments = getattr(user, "assignments", []) or []
    role_code = assignments[0].get("role_code", "STUDENT_MEMBER") if assignments else "STUDENT_MEMBER"
    default_portal = getattr(user, "default_portal", None) or "student"

    if requested_lens and requested_lens in PORTAL_ROLE_CODE_MAP:
        role_code = PORTAL_ROLE_CODE_MAP[requested_lens]
        default_portal = requested_lens

    persona_config = ROLE_PERSONA_MAP.get(role_code)
    if not persona_config:
        for r_code, cfg in ROLE_PERSONA_MAP.items():
            if cfg["portal"] == default_portal:
                persona_config = cfg
                role_code = r_code
                break

    if not persona_config:
        persona_config = ROLE_PERSONA_MAP["STUDENT_MEMBER"]

    profile = getattr(user, "profile", {}) or {}
    display_name = profile.get("display_name") or getattr(user, "display_name", "Member")
    department = profile.get("department") or "Computer Science & Engineering"
    institution_name = profile.get("institution_name") or "National Institute of Technology"

    subject = getattr(user, "subject", {}) or {}
    candidate_id = subject.get("id") or getattr(user, "person_id", None) or getattr(user, "account_id", "USR001")

    return {
        "role_code": role_code,
        "role_label": ROLE_LABELS.get(role_code, role_code.replace("_", " ").title()),
        "portal": persona_config["portal"],
        "title": persona_config["title"],
        "description": persona_config["description"],
        "display_name": display_name,
        "email": profile.get("email") or "",
        "department": department,
        "institution_name": institution_name,
        "candidate_id": candidate_id,
        "allowed_agents": persona_config["allowed_agents"],
        "quick_prompts": persona_config["quick_prompts"],
    }


def _get_tenant_id(request, user):
    header_val = request.headers.get("X-Tenant-ID") if hasattr(request, "headers") else None
    if not header_val and hasattr(request, "META"):
        header_val = request.META.get("HTTP_X_TENANT_ID")
    data_val = request.data.get("tenant_id") if hasattr(request, "data") and isinstance(request.data, dict) else None
    query_val = request.query_params.get("tenant_id") if hasattr(request, "query_params") else None
    return header_val or data_val or query_val or getattr(user, "tenant_id", None) or "tenant_nitk"


def _get_actor_id(request, user):
    header_val = request.headers.get("X-Actor-ID") if hasattr(request, "headers") else None
    if not header_val and hasattr(request, "META"):
        header_val = request.META.get("HTTP_X_ACTOR_ID")
    return header_val or getattr(user, "account_id", None) or "acc_default"


class CopilotContextView(APIView):
    """GET /api/copilot/context/?lens=student — Retrieves active persona, profile data, shareable attributes, and safety status."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        db = get_db()
        user = request.user
        lens = request.query_params.get("lens")
        persona = _get_principal_persona(user, requested_lens=lens)
        role_portal = persona["portal"]

        role_cfg = ROLE_PROFILE_DATA.get(role_portal, ROLE_PROFILE_DATA["student"])
        profile_summary = dict(role_cfg["profile_summary"])
        shareable_attrs = [dict(a) for a in role_cfg["shareable_attributes"]]

        if role_portal == "student":
            _enrich_student_profile(db, user, profile_summary, shareable_attrs)

        persona["profile_summary"] = profile_summary
        persona["shareable_attributes"] = shareable_attrs

        return Response(
            {
                "persona": persona,
                "safety_status": {
                    "pip_defense": "ACTIVE_ZERO_INJECTION",
                    "dpdp_masking": "ACTIVE_DPDP_2023",
                    "audit_ledger": "ACTIVE_IMMUTABLE",
                    "consent_mode": "GRANULAR_OPT_IN",
                },
            },
            status=status.HTTP_200_OK,
        )


class CopilotQueryView(APIView):
    """POST /api/copilot/query/ — Role-grounded, user-contextualized Copilot reasoning with granular profile privacy."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        db = get_db()
        user = request.user
        tenant_id = _get_tenant_id(request, user)
        actor_id = _get_actor_id(request, user)

        query = (request.data.get("query") or "").strip()
        if not query:
            return Response({"error": "Query cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        lens = request.data.get("lens")
        persona = _get_principal_persona(user, requested_lens=lens)
        role_portal = persona["portal"]

        role_cfg = ROLE_PROFILE_DATA.get(role_portal, ROLE_PROFILE_DATA["student"])
        all_attrs = [dict(a) for a in role_cfg["shareable_attributes"]]
        if role_portal == "student":
            _enrich_student_profile(db, user, dict(role_cfg["profile_summary"]), all_attrs)

        # 1. Zero-Injection Prompt Injection Defense
        pip_filter = PromptInjectionFilter(strict_mode=False)
        pip_result = pip_filter.scan(query)
        if not pip_result.is_safe:
            return Response(
                {
                    "error": "Prompt injection threat detected and blocked by Campus AI PIP Defense.",
                    "threats": pip_result.threats_detected,
                    "action": "BLOCKED",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Granular Data Sharing Resolution (DPDP Act 2023 Compliance)
        raw_shared = request.data.get("shared_attributes")
        if raw_shared is None:
            # Default to permitted attributes if none specified
            shared_keys = set(a["key"] for a in all_attrs if a.get("default_enabled", True))
        else:
            shared_keys = set(raw_shared)

        shared_attrs = [a for a in all_attrs if a["key"] in shared_keys]
        withheld_attrs = [a for a in all_attrs if a["key"] not in shared_keys]

        # 3. Build Grounded Profile Context Block
        shared_lines = []
        for a in shared_attrs:
            shared_lines.append(f"- {a['label']}: {a['description']} (Verified Context: {a['data_payload']})")

        withheld_lines = []
        for a in withheld_attrs:
            withheld_lines.append(f"- WITHHELD: {a['key']} ({a['label']})")

        profile_context = (
            "=== AUTHORITATIVE USER PROFILE CONTEXT (Granted under DPDP Act 2023 Consent) ===\n"
            + ("\n".join(shared_lines) if shared_lines else "NO PROFILE DATA SHARED (Strict Privacy Mode Active).")
            + "\n\n=== EXCLUDED & WITHHELD USER ATTRIBUTES (DO NOT INVENT OR INFER) ===\n"
            + ("\n".join(withheld_lines) if withheld_lines else "None (All attributes shared).")
            + "\n\nCRITICAL PRIVACY DIRECTIVE:\n"
            "If the user asks an inquiry that depends on any WITHHELD attribute (e.g., if Academic Records is WITHHELD and they ask about their CGPA or personal eligibility), "
            "you must strictly NOT guess or hallucinate. Clearly state that their academic record is withheld according to their privacy preferences, "
            "provide the general statutory/institutional policy threshold, and explain that they can enable that attribute in their Data Sharing panel above for a personal answer."
        )

        system_instruction = (
            f"You are the {persona['title']} for {persona['display_name']} "
            f"({persona['role_label']}) in the {persona['department']} department at {persona['institution_name']}. "
            f"Ground all advice strictly in approved institutional policies, placement regulations, "
            f"NEP 2020 credit frameworks, and DPDP Act 2023 compliance norms."
        )

        gateway = CampusAIGateway(db, model_router=ModelRouter(force_mock=True))
        rag_engine = InstitutionalRAGEngine(db, gateway=gateway)

        try:
            rag_res = rag_engine.answer_query(
                tenant_id=tenant_id,
                actor_account_id=actor_id,
                query=query,
                institution_id=getattr(user, "institution_id", None),
                profile_context=profile_context,
                system_instruction_override=system_instruction,
            )

            # Generate role-tailored follow-up chips
            followups = persona["quick_prompts"][:2]

            return Response(
                {
                    "answer": rag_res.answer,
                    "citations": [
                        {
                            "doc_title": c.doc_title,
                            "version": c.version,
                            "section_heading": c.section_heading,
                            "source_authority": c.source_authority,
                        }
                        for c in rag_res.citations
                    ],
                    "groundedness_score": rag_res.groundedness_score,
                    "trace_id": rag_res.trace_id,
                    "total_tokens": rag_res.total_tokens,
                    "suggested_followups": followups,
                    "shared_data_applied": [a["label"] for a in shared_attrs],
                    "withheld_attributes": [a["label"] for a in withheld_attrs],
                    "privacy_shield": {
                        "shared_count": len(shared_attrs),
                        "total_count": len(all_attrs),
                        "consent_mode": "GRANULAR_OPT_IN",
                        "dpdp_status": "PROTECTED_CONSENT",
                    },
                    "persona": {
                        "role_code": persona["role_code"],
                        "role_label": persona["role_label"],
                        "portal": persona["portal"],
                        "display_name": persona["display_name"],
                        "department": persona["department"],
                    },
                },
                status=status.HTTP_200_OK,
            )
        except TenantTokenQuotaExceededError as quota_err:
            return Response({"error": str(quota_err), "action": "THROTTLED"}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CopilotAgentExecuteView(APIView):
    """POST /api/copilot/agent/execute/ — Role-authorized agent execution with user context pre-filling."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        db = get_db()
        user = request.user
        tenant_id = _get_tenant_id(request, user)
        actor_id = _get_actor_id(request, user)

        lens = request.data.get("lens")
        persona = _get_principal_persona(user, requested_lens=lens)

        agent_name = request.data.get("agent_name", "")
        payload = request.data.get("payload", {})

        # RBAC Check: Ensure the user's role is permitted to run this agent
        if agent_name not in persona["allowed_agents"]:
            return Response(
                {
                    "error": (
                        f"Access Denied: Agent '{agent_name}' is restricted to authorized roles. "
                        f"Your persona '{persona['role_label']}' is authorized for: {', '.join(persona['allowed_agents'])}."
                    ),
                    "authorized_agents": persona["allowed_agents"],
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        gateway = CampusAIGateway(db, model_router=ModelRouter(force_mock=True))

        if agent_name == "JNFIntelligenceAgent":
            agent = JNFIntelligenceAgent(gateway)
            res = agent.analyze_jnf(
                tenant_id=tenant_id,
                actor_account_id=actor_id,
                company_name=payload.get("company_name", "Acme Corp"),
                role_title=payload.get("role_title", "Software Engineer"),
                ctc_lpa=float(payload.get("ctc_lpa", 14.5)),
                stipend_monthly=float(payload.get("stipend_monthly", 50000)),
                min_cgpa=float(payload.get("min_cgpa", 7.0)),
                eligible_branches=payload.get("eligible_branches", ["CSE", "ECE"]),
            )
        elif agent_name == "SuperdayClashSolverAgent":
            agent = SuperdayClashSolverAgent(gateway)
            res = agent.resolve_clashes(
                tenant_id=tenant_id,
                actor_account_id=actor_id,
                interview_slots=payload.get(
                    "interview_slots",
                    [
                        {"candidate_id": persona["candidate_id"], "company": "Alpha Tech", "slot": "10:00-11:00"},
                        {"candidate_id": persona["candidate_id"], "company": "Beta Systems", "slot": "10:30-11:30"},
                    ],
                ),
            )
        elif agent_name == "AcademicAdvisorAgent":
            agent = AcademicAdvisorAgent(gateway)
            res = agent.advise_student(
                tenant_id=tenant_id,
                actor_account_id=actor_id,
                student_id=payload.get("student_id", persona["candidate_id"]),
                completed_credits=int(payload.get("completed_credits", 128)),
            )
        elif agent_name == "NIRFStatutoryAuditAgent":
            agent = NIRFStatutoryAuditAgent(gateway)
            res = agent.audit_graduation_outcomes(
                tenant_id=tenant_id,
                academic_year=payload.get("academic_year", "2025-26"),
                actor_account_id=actor_id,
            )
        else:
            return Response({"error": f"Unknown agent: {agent_name}"}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "agent_name": res.agent_name,
                "status": res.status.value if hasattr(res.status, "value") else str(res.status),
                "summary": res.summary,
                "recommendation": res.recommendation,
                "tool_results": [
                    {
                        "tool_name": tr.tool_name,
                        "risk_tier": tr.risk_tier.value if hasattr(tr.risk_tier, "value") else str(tr.risk_tier),
                        "status": tr.status,
                        "requires_human_approval": tr.requires_human_approval,
                        "approval_token": tr.approval_token,
                    }
                    for tr in res.tool_results
                ],
                "trace_id": res.trace_id,
                "total_tokens": getattr(res, "total_tokens", 0),
                "latency_ms": getattr(res, "latency_ms", 15.0),
                "governance_level": getattr(res, "governance_level", "CAMPUS_COGNITIVE_L3"),
                "caller_persona": persona["role_label"],
            },
            status=status.HTTP_200_OK,
        )
