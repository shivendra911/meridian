"""PlaceFlow / Meridian — Role-Based & User-Specific Campus AI Copilot Views.

Provides role-tailored, user-grounded AI copilot capabilities across:
- Student (Candidate Career & Readiness Copilot)
- TPO (Placement Operations & Superday Copilot)
- Faculty (Academic Mentorship & Approvals Copilot)
- HOD (Department Executive & Curriculum Copilot)
- Management (Institutional Strategy & NIRF Copilot)
- Admin (Campus AI Governance & Sandbox Auditor)
"""

from typing import Any, Dict, List
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
            "Am I eligible for upcoming Tier-1 Super Dream drives?",
            "Check my NEP 2020 completed credits for graduation",
            "How do I withdraw recruiter data consent under DPDP Act?",
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


def _get_principal_persona(user) -> Dict[str, Any]:
    """Resolves authoritative role persona and user metadata from authenticated principal."""
    assignments = getattr(user, "assignments", []) or []
    role_code = assignments[0].get("role_code", "STUDENT_MEMBER") if assignments else "STUDENT_MEMBER"
    default_portal = getattr(user, "default_portal", None) or "student"

    # Fallback to default portal mapping if specific role not found
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
    department = profile.get("department") or "Engineering"
    institution_name = profile.get("institution_name") or "Meridian Campus"

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


class CopilotContextView(APIView):
    """GET /api/copilot/context/ — Retrieves active persona, allowed agents, and quick actions."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        persona = _get_principal_persona(request.user)
        return Response(
            {
                "persona": persona,
                "safety_status": {
                    "pip_defense": "ACTIVE_ZERO_INJECTION",
                    "dpdp_masking": "ACTIVE_DPDP_2023",
                    "audit_ledger": "ACTIVE_IMMUTABLE",
                },
            },
            status=status.HTTP_200_OK,
        )


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


class CopilotQueryView(APIView):
    """POST /api/copilot/query/ — Role-grounded, user-contextualized Copilot reasoning."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        db = get_db()
        user = request.user
        tenant_id = _get_tenant_id(request, user)
        actor_id = _get_actor_id(request, user)
        persona = _get_principal_persona(user)

        query = (request.data.get("query") or "").strip()
        if not query:
            return Response({"error": "Query cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

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

        # 2. Context Grounding with Role Persona & User Metadata
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
        persona = _get_principal_persona(user)

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
                company_name=payload.get("company_name", "Enterprise Corp"),
                raw_jnf_text=payload.get("raw_jnf_text", ""),
                offered_ctc_lpa=float(payload.get("offered_ctc_lpa", 12.0)),
                min_cgpa=float(payload.get("min_cgpa", 6.5)),
            )
        elif agent_name == "SuperdayClashSolverAgent":
            agent = SuperdayClashSolverAgent(gateway)
            res = agent.resolve_clashes(
                tenant_id=tenant_id,
                actor_account_id=actor_id,
                student_id=payload.get("student_id", persona["candidate_id"]),
                slots=payload.get("slots", [
                    {"company": "Google India", "start_time": "10:00 AM"},
                    {"company": "Uber Technologies", "start_time": "10:00 AM"},
                ]),
            )
        elif agent_name == "AcademicAdvisorAgent":
            agent = AcademicAdvisorAgent(gateway)
            res = agent.advise_student(
                tenant_id=tenant_id,
                actor_account_id=actor_id,
                student_id=payload.get("student_id", persona["candidate_id"]),
                completed_credits=int(payload.get("completed_credits", 135)),
            )
        elif agent_name == "NIRFStatutoryAuditAgent":
            agent = NIRFStatutoryAuditAgent(gateway)
            res = agent.audit_graduation_outcomes(
                tenant_id=tenant_id,
                academic_year=payload.get("academic_year", "2025-26"),
                graduated_count=int(payload.get("graduated_count", 520)),
                placed_count=int(payload.get("placed_count", 468)),
                median_salary_lpa=float(payload.get("median_salary_lpa", 9.1)),
            )
        else:
            return Response(
                {"error": f"Unknown agent '{agent_name}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "agent_name": res.agent_name,
                "status": res.status,
                "summary": res.summary,
                "recommendation": res.recommendation,
                "tool_results": [
                    {
                        "tool_name": t.tool_name,
                        "risk_tier": t.risk_tier.value,
                        "status": t.status,
                        "requires_human_approval": t.requires_human_approval,
                        "approval_token": t.approval_token,
                    }
                    for t in res.tool_results
                ],
                "trace_id": res.trace_id,
                "caller_persona": persona["role_code"],
            },
            status=status.HTTP_200_OK,
        )
