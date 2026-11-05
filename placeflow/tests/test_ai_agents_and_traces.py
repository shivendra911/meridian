"""Automated test suite for Campus AI Layer Sub-Phase 4.3.

Tests Autonomous Domain Agents, Controlled Tool Sandboxes, Human-in-the-Loop Gate,
and AI Trace Ledger Telemetry Queries.
"""

import os
import pytest
from pymongo import MongoClient

from campus_ai.schemas import setup_campus_ai_collections
from campus_ai.gateway import CampusAIGateway
from campus_ai.router import ModelRouter
from campus_ai.tools import ToolRegistry, RiskTier
from campus_ai.agents import (
    JNFIntelligenceAgent,
    SuperdayClashSolverAgent,
    AcademicAdvisorAgent,
    NIRFStatutoryAuditAgent,
)
from campus_ai.traces import query_ai_traces, get_tenant_ai_metrics


@pytest.fixture(scope="module")
def agent_db():
    uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/college_placement_test")
    client = MongoClient(uri)
    db = client.get_default_database()

    setup_campus_ai_collections(db)

    db.ai_tenant_quotas.delete_many({})
    db.ai_interaction_traces.delete_many({})

    yield db

    db.ai_tenant_quotas.delete_many({})
    db.ai_interaction_traces.delete_many({})
    client.close()


def test_tool_sandbox_human_gate():
    """Tier 3 high-risk tool is blocked until human explicitly signs off."""
    registry = ToolRegistry()

    def delete_record(record_id: str):
        return {"deleted": record_id}

    registry.register("delete_record", "Deletes academic record", RiskTier.TIER_3_HIGH, delete_record)

    # 1. Unconfirmed execution -> STAGED
    staged = registry.execute_tool("delete_record", {"record_id": "REC_99"}, is_human_confirmed=False)
    assert staged.status == "STAGED_FOR_APPROVAL"
    assert staged.requires_human_approval is True
    assert staged.approval_token is not None

    # 2. Confirmed execution -> COMPLETED
    confirmed = registry.execute_tool("delete_record", {"record_id": "REC_99"}, is_human_confirmed=True)
    assert confirmed.status == "COMPLETED"
    assert confirmed.data["deleted"] == "REC_99"


def test_jnf_intelligence_agent(agent_db):
    """JNF agent classifies CTC tiers and stages publishing with human approval."""
    gateway = CampusAIGateway(agent_db, model_router=ModelRouter(force_mock=True))
    agent = JNFIntelligenceAgent(gateway)

    result = agent.analyze_jnf(
        tenant_id="t_nit_jnf",
        actor_account_id="acc_tpo_01",
        company_name="Google India",
        raw_jnf_text="Software Engineer role Bangalore campus",
        offered_ctc_lpa=28.5,
        min_cgpa=8.0,
    )

    assert result.status == "REQUIRES_APPROVAL"
    assert result.recommendation["tier"] == "Super Dream"
    assert result.recommendation["is_compliant"] is True
    assert any(t.requires_human_approval for t in result.tool_results)


def test_superday_clash_solver_agent(agent_db):
    """Superday agent flags student interview overlaps and recommends buffer slots."""
    gateway = CampusAIGateway(agent_db, model_router=ModelRouter(force_mock=True))
    agent = SuperdayClashSolverAgent(gateway)

    slots = [
        {"company": "Amazon", "start_time": "10:00 AM"},
        {"company": "Microsoft", "start_time": "10:00 AM"},  # Clash!
        {"company": "Goldman Sachs", "start_time": "02:00 PM"},
    ]

    result = agent.resolve_clashes(
        tenant_id="t_clash_test",
        actor_account_id="acc_coord",
        student_id="STU007",
        slots=slots,
    )

    assert result.status == "SUCCESS"
    assert result.recommendation["has_conflicts"] is True
    assert result.recommendation["conflicts_count"] == 1
    assert result.recommendation["proposed_reassignment"]["status"] == "REASSIGNMENT_RECOMMENDED"


def test_academic_advisor_agent(agent_db):
    """Advisor agent identifies NEP 2020 exit credential thresholds."""
    gateway = CampusAIGateway(agent_db, model_router=ModelRouter(force_mock=True))
    agent = AcademicAdvisorAgent(gateway)

    # 125 credits qualifies for UG Degree (Level 7.0)
    result = agent.advise_student(
        tenant_id="t_academic_test",
        actor_account_id="acc_student",
        student_id="STU202",
        completed_credits=125,
    )

    assert result.status == "SUCCESS"
    assert result.recommendation["exit_credential"] == "UG_DEGREE"
    assert result.recommendation["ncrf_level"] == 7.0


def test_nirf_statutory_audit_agent(agent_db):
    """NIRF audit agent validates statutory graduation metrics."""
    gateway = CampusAIGateway(agent_db, model_router=ModelRouter(force_mock=True))
    agent = NIRFStatutoryAuditAgent(gateway)

    result = agent.audit_graduation_outcomes(
        tenant_id="t_nirf_test",
        academic_year="2025-26",
        graduated_count=500,
        placed_count=425,
        median_salary_lpa=8.2,
    )

    assert result.status == "SUCCESS"
    assert result.recommendation["placement_pct"] == 85.0
    assert result.recommendation["is_statutory_ready"] is True
    assert result.recommendation["nirf_score_component"] > 30.0


def test_ai_traces_and_telemetry(agent_db):
    """Trace query service returns scoped execution logs and aggregated metrics."""
    gateway = CampusAIGateway(agent_db, model_router=ModelRouter(force_mock=True))
    tenant_id = "t_telemetry_demo"

    # Generate 2 traces
    gateway.execute(tenant_id=tenant_id, actor_account_id="acc_u1", prompt="Query 1")
    gateway.execute(tenant_id=tenant_id, actor_account_id="acc_u1", prompt="Query 2")

    traces = query_ai_traces(agent_db, tenant_id=tenant_id)
    assert len(traces) >= 2

    metrics = get_tenant_ai_metrics(agent_db, tenant_id=tenant_id)
    assert metrics["total_traces"] >= 2
    assert metrics["total_prompt_tokens"] > 0

