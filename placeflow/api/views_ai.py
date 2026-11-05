"""REST API Views for Campus AI Layer (v4).

Provides endpoints for Gateway execution, Institutional RAG queries,
Domain Agents execution, and AI Trace Ledger audit queries.
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from database.connection import get_db
from campus_ai.gateway import CampusAIGateway, TenantTokenQuotaExceededError
from campus_ai.pip import PromptInjectionDetectedError
from campus_ai.router import TaskType, ModelRouter
from campus_ai.rag import InstitutionalRAGEngine
from campus_ai.agents import (
    JNFIntelligenceAgent,
    SuperdayClashSolverAgent,
    AcademicAdvisorAgent,
    NIRFStatutoryAuditAgent,
)
from campus_ai.traces import query_ai_traces, get_tenant_ai_metrics


def _get_tenant_id(request):
    return (
        request.headers.get("X-Tenant-ID")
        or request.data.get("tenant_id")
        or request.query_params.get("tenant_id")
        or "tenant_nitk"
    )


def _get_actor_id(request):
    return (
        request.headers.get("X-Actor-ID")
        or request.data.get("actor_account_id")
        or "acc_default_officer"
    )


@api_view(["POST"])
def ai_query_view(request):
    """Execute a general query through the Campus AI Gateway."""
    db = get_db()
    tenant_id = _get_tenant_id(request)
    actor_id = _get_actor_id(request)
    prompt = request.data.get("prompt", "")
    task_type_str = request.data.get("task_type", "POLICY_QA")

    if not prompt:
        return Response({"error": "Prompt cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        task_type = TaskType(task_type_str)
    except ValueError:
        task_type = TaskType.POLICY_QA

    gateway = CampusAIGateway(db, model_router=ModelRouter(force_mock=True))
    try:
        res = gateway.execute(
            tenant_id=tenant_id,
            actor_account_id=actor_id,
            prompt=prompt,
            task_type=task_type,
            institution_id=request.data.get("institution_id"),
            system_instruction=request.data.get("system_instruction", ""),
        )
        return Response(
            {
                "trace_id": res.trace_id,
                "output_text": res.output_text,
                "prompt_tokens": res.prompt_tokens,
                "completion_tokens": res.completion_tokens,
                "total_tokens": res.total_tokens,
                "latency_ms": res.latency_ms,
                "model_id": res.model_id,
                "provider": res.provider,
                "pip_safe": res.pip_result.is_safe,
                "pii_masked_count": res.pii_masked_count,
            }
        )
    except PromptInjectionDetectedError as pip_err:
        return Response(
            {
                "error": "Prompt injection threat detected and blocked.",
                "threats": pip_err.threats,
                "action": "BLOCKED",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except TenantTokenQuotaExceededError as quota_err:
        return Response(
            {"error": str(quota_err), "action": "THROTTLED"},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def ai_rag_view(request):
    """Answer an inquiry strictly grounded in approved institutional regulations."""
    db = get_db()
    tenant_id = _get_tenant_id(request)
    actor_id = _get_actor_id(request)
    query = request.data.get("query", "")

    if not query:
        return Response({"error": "Query cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

    gateway = CampusAIGateway(db, model_router=ModelRouter(force_mock=True))
    rag_engine = InstitutionalRAGEngine(db, gateway=gateway)

    try:
        res = rag_engine.answer_query(
            tenant_id=tenant_id,
            actor_account_id=actor_id,
            query=query,
            category=request.data.get("category"),
            institution_id=request.data.get("institution_id"),
        )
        return Response(
            {
                "answer": res.answer,
                "citations": [
                    {
                        "doc_title": c.doc_title,
                        "version": c.version,
                        "section_heading": c.section_heading,
                        "source_authority": c.source_authority,
                    }
                    for c in res.citations
                ],
                "groundedness_score": res.groundedness_score,
                "trace_id": res.trace_id,
                "total_tokens": res.total_tokens,
            }
        )
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def ai_agent_execute_view(request):
    """Execute a specialized domain intelligence agent."""
    db = get_db()
    tenant_id = _get_tenant_id(request)
    actor_id = _get_actor_id(request)
    agent_name = request.data.get("agent_name", "")
    payload = request.data.get("payload", {})

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
            student_id=payload.get("student_id", "STU001"),
            slots=payload.get("slots", []),
        )
    elif agent_name == "AcademicAdvisorAgent":
        agent = AcademicAdvisorAgent(gateway)
        res = agent.advise_student(
            tenant_id=tenant_id,
            actor_account_id=actor_id,
            student_id=payload.get("student_id", "STU001"),
            completed_credits=int(payload.get("completed_credits", 120)),
        )
    elif agent_name == "NIRFStatutoryAuditAgent":
        agent = NIRFStatutoryAuditAgent(gateway)
        res = agent.audit_graduation_outcomes(
            tenant_id=tenant_id,
            academic_year=payload.get("academic_year", "2025-26"),
            graduated_count=int(payload.get("graduated_count", 500)),
            placed_count=int(payload.get("placed_count", 400)),
            median_salary_lpa=float(payload.get("median_salary_lpa", 7.5)),
        )
    else:
        return Response(
            {"error": f"Unknown agent '{agent_name}'. Supported: JNFIntelligenceAgent, SuperdayClashSolverAgent, AcademicAdvisorAgent, NIRFStatutoryAuditAgent."},
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
        }
    )


@api_view(["GET"])
def ai_traces_view(request):
    """Query immutable AI interaction traces."""
    db = get_db()
    tenant_id = _get_tenant_id(request)
    limit = int(request.query_params.get("limit", 50))
    traces = query_ai_traces(db, tenant_id=tenant_id, limit=limit)
    return Response({"count": len(traces), "traces": traces})


@api_view(["GET"])
def ai_quotas_view(request):
    """Get tenant token consumption and telemetry metrics."""
    db = get_db()
    tenant_id = _get_tenant_id(request)
    metrics = get_tenant_ai_metrics(db, tenant_id=tenant_id)
    quota = db.ai_tenant_quotas.find_one({"tenant_id": tenant_id}, {"_id": 0})
    return Response({"tenant_id": tenant_id, "quota": quota, "metrics": metrics})
