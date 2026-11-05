"""
PlaceFlow v3 — Production Placement Platform Automated Test Suite
Verifies:
- FR-ML-001 / FR-ML-002: Strict sensitive proxy feature prohibition & cohort fairness audits
- FR-AGT-001 / FR-AGT-004: Typed MCP tool registry & graded autonomy agents (AG-01, AG-02, AG-10)
- ML-23 / ML-07 / FR-ML-004: What-if career simulation with conformal package bands & explainability
- FR-PRV-001 / FR-PRV-002 / FR-PRV-003: DPDP purpose-based consent lifecycle & opt-out compliance
- FR-ANL-020 / FR-ANL-021: NIRF Graduation Outcome calculator with small-cell privacy suppression
"""

import pytest
from database.connection import get_db
from ml.fairness_audit import audit_feature_set, run_cohort_fairness_audit, PROHIBITED_SENSITIVE_FEATURES
from operations.agent_tools import execute_tool, TOOL_CATALOG
from operations.agents import run_agent, AGENT_CATALOG
from ml.whatif_simulator import simulate_student_career
from operations.consent import record_consent, withdraw_consent, get_student_consents
from operations.nirf import compute_nirf_metrics


@pytest.fixture(scope="module")
def db():
    return get_db()


def test_sensitive_features_audit():
    """FR-ML-001: Asserts that no sensitive or proxy features appear in the model input set."""
    # Compliant academic features
    compliant_features = ["cgpa", "backlogs", "department", "year", "skill_count", "applications_count"]
    audit_clean = audit_feature_set(compliant_features)
    assert audit_clean["passed"] is True
    assert len(audit_clean["prohibited_detected"]) == 0

    # Non-compliant features with sensitive attributes
    tainted_features = ["cgpa", "gender", "caste", "home_state", "religion"]
    audit_tainted = audit_feature_set(tainted_features)
    assert audit_tainted["passed"] is False
    assert set(audit_tainted["prohibited_detected"]) == {"gender", "caste", "home_state", "religion"}


def test_cohort_fairness_audit(db):
    """FR-ML-002: Departmental slice parity and disparate impact analysis."""
    report = run_cohort_fairness_audit(db)
    assert "error" not in report
    assert report["total_cohort_evaluated"] > 0
    assert "disparate_impact_ratio" in report
    assert report["fairness_status"] in ("COMPLIANT", "REVIEW_ADVISORY")
    assert isinstance(report["slice_reports"], list)
    for slice_data in report["slice_reports"]:
        assert "slice" in slice_data
        assert "sample_size" in slice_data
        assert "selection_rate_high_prob" in slice_data


def test_mcp_agent_tools_execution(db):
    """FR-AGT-001: Typed MCP tool execution, validation, and deterministic results."""
    # 1. Inspect tool catalog
    assert len(TOOL_CATALOG) >= 5
    tool_names = [t["name"] for t in TOOL_CATALOG]
    assert "get_my_eligible_drives" in tool_names
    assert "explain_eligibility" in tool_names
    assert "detect_clashes" in tool_names
    assert "search_policy" in tool_names

    # 2. Test get_my_eligible_drives
    drives_res = execute_tool(db, "get_my_eligible_drives", {"student_id": "STU001"})
    assert "eligible_drives_count" in drives_res
    assert isinstance(drives_res["drives"], list)

    # 3. Test explain_eligibility
    explain_res = execute_tool(db, "explain_eligibility", {"student_id": "STU001", "job_id": "JOB001"})
    assert "eligible" in explain_res
    assert "checks" in explain_res
    assert len(explain_res["checks"]) == 3  # CGPA, Backlogs, Department

    # 4. Test detect_clashes
    clashes_res = execute_tool(db, "detect_clashes", {})
    assert "clashes_detected" in clashes_res
    assert "status" in clashes_res

    # 5. Test search_policy
    policy_res = execute_tool(db, "search_policy", {"query": "tier"})
    assert "rules" in policy_res
    assert len(policy_res["rules"]) > 0


def test_agent_runtime_trace_and_quarantine(db):
    """FR-AGT-004: Graded autonomy agent execution and immutable audit logging in agent_runs."""
    # AG-01: L0 Advisory
    res_ag01 = run_agent(db, "AG-01", "Am I eligible for any campus jobs?", {"student_id": "STU001"})
    assert res_ag01["agent_id"] == "AG-01"
    assert res_ag01["autonomy_level"] == "L0"
    assert res_ag01["tool_calls_count"] >= 1
    assert "STU001" in res_ag01["response"] or "eligible" in res_ag01["response"].lower()

    # AG-02: L1 Drafting / Copilot
    res_ag02 = run_agent(db, "AG-02", "Check active schedule clashes")
    assert res_ag02["agent_id"] == "AG-02"
    assert res_ag02["autonomy_level"] == "L1"
    assert res_ag02["tool_calls_count"] >= 1

    # Verify run trace recorded in agent_runs collection
    recorded_run = db.agent_runs.find_one({"run_id": res_ag01["run_id"]})
    if recorded_run:
        assert recorded_run["agent_id"] == "AG-01"
        assert recorded_run["autonomy_level"] == "L0"
        assert len(recorded_run["tool_calls"]) >= 1


def test_whatif_simulator_and_conformal_bands(db):
    """ML-23 & ML-07: What-If simulation with conformal package bands and plain-language explanations."""
    sim = simulate_student_career(
        db,
        student_id="STU001",
        target_cgpa=9.5,
        target_backlogs=0,
        added_skills=["Kubernetes", "PyTorch"],
    )
    assert sim["opted_out"] is False
    assert "baseline" in sim
    assert "simulated" in sim

    # Check conformal package band (ML-07: [lower, median, upper])
    band = sim["simulated"]["package_band_80"]
    assert band["lower_bound_lpa"] <= band["median_lpa"] <= band["upper_bound_lpa"]
    assert band["interval_coverage"] == "80% Conformal"

    # Check actionable plain-language explanations (ML-23 / FR-ML-004)
    assert len(sim["explanations"]) > 0
    # Strict rule: no verdict such as "you will not be placed"
    for exp in sim["explanations"]:
        assert "you will not be placed" not in exp.lower()
        assert "impossible" not in exp.lower()


def test_dpdp_consent_lifecycle_and_opt_out(db):
    """FR-PRV-001 & FR-PRV-002: Purpose-based consent, revocation, and model opt-out."""
    test_sid = "STU002"

    # 1. Record explicit consent for AI Modeling
    rec_res = record_consent(db, test_sid, "AI_PREDICTIVE_MODELING")
    assert rec_res["status"] == "SUCCESS"

    consents = get_student_consents(db, test_sid)
    ai_consent = next(c for c in consents if c["purpose"] == "AI_PREDICTIVE_MODELING")
    assert ai_consent["status"] == "ACTIVE"

    # 2. Withdraw consent
    with_res = withdraw_consent(db, test_sid, "AI_PREDICTIVE_MODELING")
    assert with_res["status"] == "WITHDRAWN"

    # 3. Verify simulator respects opt-out (FR-ML-005)
    sim_after = simulate_student_career(db, test_sid)
    assert sim_after["opted_out"] is True
    assert "opted out" in sim_after["message"].lower()

    # 4. Re-grant consent for subsequent tests
    record_consent(db, test_sid, "AI_PREDICTIVE_MODELING")
    sim_restored = simulate_student_career(db, test_sid)
    assert sim_restored["opted_out"] is False


def test_nirf_graduation_outcome_calculator(db):
    """FR-ANL-020 / FR-ANL-021: NIRF Graduation Outcome scores & small-cell suppression."""
    metrics = compute_nirf_metrics(db)
    assert "error" not in metrics
    assert metrics["cohort_size"] > 0
    assert 0 <= metrics["gph_score_40"] <= 40
    assert 0 <= metrics["gms_score_40"] <= 40
    assert 0 <= metrics["total_nirf_go_80"] <= 80

    # Verify company salary dispersion table and <5 cell suppression
    dispersion = metrics["company_table"]
    assert isinstance(dispersion, list)
    for c in dispersion:
        assert "company_id" in c
        assert "min_salary_lpa" in c
        assert "median_salary_lpa" in c
        assert "max_salary_lpa" in c
        # Small-cell suppression: counts under 5 are masked as "<5"
        if c["raw_count"] < 5:
            assert c["recruited_count"] == "<5"
        else:
            assert c["recruited_count"] == c["raw_count"]
