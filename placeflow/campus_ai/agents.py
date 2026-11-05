"""Autonomous Domain Agents for Campus Intelligence Layer.

Implements the 4 specialized domain agents:
1. JNF Intelligence Agent (Corporate job opening parsing & tier compliance)
2. Superday Clash Solver Agent (Interview scheduling conflict resolution)
3. Student Academic Advisor Agent (NEP 2020 credit & prerequisite guidance)
4. NIRF Statutory Audit Agent (Graduation outcome compliance & audit reporting)
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from campus_ai.gateway import CampusAIGateway
from campus_ai.router import TaskType
from campus_ai.tools import ToolRegistry, RiskTier, ToolExecutionResult


@dataclass
class AgentRunResult:
    """Standardized output from an autonomous domain agent."""

    agent_name: str
    status: str  # "SUCCESS", "REQUIRES_APPROVAL", "ERROR"
    summary: str
    tool_results: List[ToolExecutionResult]
    recommendation: Dict[str, Any]
    trace_id: str


class JNFIntelligenceAgent:
    """Parses corporate JNFs, standardizes roles, and verifies tier policy compliance."""

    def __init__(self, gateway: CampusAIGateway, tool_registry: Optional[ToolRegistry] = None):
        self.gateway = gateway
        self.tools = tool_registry or ToolRegistry()
        self._register_default_tools()

    def _register_default_tools(self):
        # Tier 1 Low Risk: Calculate tier classification
        def classify_ctc(ctc_lpa: float) -> str:
            if ctc_lpa >= 20.0:
                return "Super Dream"
            elif ctc_lpa >= 7.5:
                return "Dream"
            return "Normal"

        self.tools.register(
            "classify_ctc_tier",
            "Classifies offered CTC into institutional compensation tiers",
            RiskTier.TIER_1_LOW,
            classify_ctc,
        )

        # Tier 3 High Risk: Final JNF Approval
        def publish_jnf(job_id: str, approved_by: str) -> Dict[str, Any]:
            return {"job_id": job_id, "status": "PUBLISHED", "approved_by": approved_by}

        self.tools.register(
            "publish_jnf_opening",
            "Publishes JNF for student applications. Irreversible action.",
            RiskTier.TIER_3_HIGH,
            publish_jnf,
        )

    def analyze_jnf(
        self,
        tenant_id: str,
        actor_account_id: str,
        company_name: str,
        raw_jnf_text: str,
        offered_ctc_lpa: float,
        min_cgpa: float = 6.0,
    ) -> AgentRunResult:
        tier_res = self.tools.execute_tool(
            "classify_ctc_tier", {"ctc_lpa": offered_ctc_lpa}
        )
        tier = tier_res.data

        summary = (
            f"JNF Analysis for '{company_name}': Role classified as '{tier}' "
            f"at ₹{offered_ctc_lpa:.2f} LPA with minimum CGPA threshold {min_cgpa}."
        )

        # Attempt to stage publishing tool (will trigger Human Gate)
        stage_res = self.tools.execute_tool(
            "publish_jnf_opening",
            {"job_id": f"JNF_{company_name[:4].upper()}", "approved_by": actor_account_id},
            is_human_confirmed=False,
        )

        rec = {
            "company": company_name,
            "ctc_lpa": offered_ctc_lpa,
            "tier": tier,
            "min_cgpa": min_cgpa,
            "is_compliant": offered_ctc_lpa >= 4.0,
        }

        return AgentRunResult(
            agent_name="JNFIntelligenceAgent",
            status="REQUIRES_APPROVAL" if stage_res.requires_human_approval else "SUCCESS",
            summary=summary,
            tool_results=[tier_res, stage_res],
            recommendation=rec,
            trace_id="trace_jnf_mock",
        )


class SuperdayClashSolverAgent:
    """Detects student interview collisions across recruiters and recommends slot fixes."""

    def __init__(self, gateway: CampusAIGateway, tool_registry: Optional[ToolRegistry] = None):
        self.gateway = gateway
        self.tools = tool_registry or ToolRegistry()
        self._register_tools()

    def _register_tools(self):
        def check_conflicts(student_id: str, interview_slots: List[Dict[str, str]]) -> List[Dict[str, Any]]:
            conflicts = []
            seen_times = set()
            for s in interview_slots:
                t = s.get("start_time")
                if t in seen_times:
                    conflicts.append({"student_id": student_id, "clashing_time": t, "company": s.get("company")})
                seen_times.add(t)
            return conflicts

        self.tools.register("check_interview_conflicts", "Finds time clashes in schedules", RiskTier.TIER_1_LOW, check_conflicts)

    def resolve_clashes(
        self,
        tenant_id: str,
        actor_account_id: str,
        student_id: str,
        slots: List[Dict[str, str]],
    ) -> AgentRunResult:
        res = self.tools.execute_tool("check_interview_conflicts", {"student_id": student_id, "interview_slots": slots})
        conflicts = res.data
        has_clash = len(conflicts) > 0

        summary = (
            f"Superday audit for student '{student_id}': Found {len(conflicts)} scheduling conflicts."
            if has_clash
            else f"Superday audit for student '{student_id}': All interview slots are conflict-free."
        )

        rec = {
            "has_conflicts": has_clash,
            "conflicts_count": len(conflicts),
            "proposed_reassignment": (
                {"buffer_minutes": 30, "status": "REASSIGNMENT_RECOMMENDED"}
                if has_clash
                else {"status": "SCHEDULE_CLEARED"}
            ),
        }

        return AgentRunResult(
            agent_name="SuperdayClashSolverAgent",
            status="SUCCESS",
            summary=summary,
            tool_results=[res],
            recommendation=rec,
            trace_id="trace_superday_mock",
        )


class AcademicAdvisorAgent:
    """Guides students on NEP 2020 multiple exit credits, courses, and prerequisites."""

    def __init__(self, gateway: CampusAIGateway, tool_registry: Optional[ToolRegistry] = None):
        self.gateway = gateway
        self.tools = tool_registry or ToolRegistry()
        self._register_tools()

    def _register_tools(self):
        def check_exit_eligibility(completed_credits: int) -> Dict[str, Any]:
            if completed_credits >= 160:
                return {"exit_credential": "UG_DEGREE_HONOURS", "ncrf_level": 8.0, "status": "ELIGIBLE"}
            elif completed_credits >= 120:
                return {"exit_credential": "UG_DEGREE", "ncrf_level": 7.0, "status": "ELIGIBLE"}
            elif completed_credits >= 80:
                return {"exit_credential": "UG_DIPLOMA", "ncrf_level": 6.0, "status": "ELIGIBLE"}
            elif completed_credits >= 40:
                return {"exit_credential": "UG_CERTIFICATE", "ncrf_level": 5.0, "status": "ELIGIBLE"}
            return {"exit_credential": "NONE", "ncrf_level": 4.5, "status": "CREDITS_INSUFFICIENT"}

        self.tools.register("check_nep_exit_eligibility", "Evaluates credits against NEP 2020 exit thresholds", RiskTier.TIER_1_LOW, check_exit_eligibility)

    def advise_student(
        self,
        tenant_id: str,
        actor_account_id: str,
        student_id: str,
        completed_credits: int,
    ) -> AgentRunResult:
        res = self.tools.execute_tool("check_nep_exit_eligibility", {"completed_credits": completed_credits})
        cred_info = res.data

        summary = (
            f"Academic evaluation for '{student_id}': With {completed_credits} credits, student "
            f"qualifies for {cred_info['exit_credential']} (NCrF Level {cred_info['ncrf_level']})."
        )

        return AgentRunResult(
            agent_name="AcademicAdvisorAgent",
            status="SUCCESS",
            summary=summary,
            tool_results=[res],
            recommendation=cred_info,
            trace_id="trace_advisor_mock",
        )


class NIRFStatutoryAuditAgent:
    """Verifies statutory graduation outcomes and placement statistics for accreditation."""

    def __init__(self, gateway: CampusAIGateway):
        self.gateway = gateway

    def audit_graduation_outcomes(
        self,
        tenant_id: str,
        academic_year: str,
        graduated_count: int,
        placed_count: int,
        median_salary_lpa: float,
    ) -> AgentRunResult:
        placement_pct = (placed_count / graduated_count * 100) if graduated_count > 0 else 0.0
        is_compliant = placement_pct >= 60.0 and median_salary_lpa >= 4.5

        summary = (
            f"NIRF GO Audit ({academic_year}): Placement rate {placement_pct:.1f}% "
            f"({placed_count}/{graduated_count}), Median CTC ₹{median_salary_lpa:.2f} LPA. "
            f"Compliance status: {'VERIFIED_READY' if is_compliant else 'DEFICIENCY_NOTED'}."
        )

        rec = {
            "academic_year": academic_year,
            "placement_pct": round(placement_pct, 2),
            "median_salary_lpa": median_salary_lpa,
            "nirf_score_component": round(min(40.0, (placement_pct / 100.0) * 40.0), 2),
            "is_statutory_ready": is_compliant,
        }

        return AgentRunResult(
            agent_name="NIRFStatutoryAuditAgent",
            status="SUCCESS",
            summary=summary,
            tool_results=[],
            recommendation=rec,
            trace_id="trace_nirf_mock",
        )

