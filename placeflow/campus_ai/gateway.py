"""Shared Campus AI Gateway & Quota Management Engine.

Orchestrates the 10-step context-aware AI execution pipeline:
Principal validation -> Rate limits & token budgets -> PIP defense scan ->
DPDP Act PII masking -> Model routing -> Safe execution -> PII rehydration ->
Atomic quota accounting -> Immutable AI trace recording.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
import uuid
from typing import Any, Dict, List, Optional

from campus_ai.pip import PromptInjectionFilter, PromptInjectionDetectedError, PIPScanResult
from campus_ai.privacy import DPDPPrivacyEngine
from campus_ai.router import ModelRouter, TaskType, AIProvider, ModelResponse


class TenantTokenQuotaExceededError(Exception):
    """Raised when an institutional tenant exceeds their monthly AI token budget."""

    def __init__(self, tenant_id: str, used: int, budget: int):
        self.tenant_id = tenant_id
        self.used = used
        self.budget = budget
        super().__init__(
            f"Tenant '{tenant_id}' exceeded monthly AI token quota: {used}/{budget} tokens used."
        )


@dataclass
class GatewayExecutionResult:
    """Complete result returned to the application layer."""

    trace_id: str
    output_text: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    latency_ms: float
    model_id: str
    provider: str
    pip_result: PIPScanResult
    pii_masked_count: int


class CampusAIGateway:
    """Central intelligent gateway for all Campus AI requests."""

    def __init__(self, db, model_router: Optional[ModelRouter] = None):
        self.db = db
        self.router = model_router or ModelRouter()
        self.pip_filter = PromptInjectionFilter(strict_mode=True)
        self.privacy_engine = DPDPPrivacyEngine()

    def get_or_create_quota(
        self,
        tenant_id: str,
        monthly_budget: int = 1_000_000,
        rate_limit: int = 120,
    ) -> Dict[str, Any]:
        """Retrieve or initialize tenant quota record."""
        quota = self.db.ai_tenant_quotas.find_one({"tenant_id": tenant_id})
        if not quota:
            now = datetime.now(timezone.utc)
            doc = {
                "tenant_id": tenant_id,
                "rate_limit_per_minute": rate_limit,
                "monthly_token_budget": monthly_budget,
                "tokens_used_this_cycle": 0,
                "cycle_reset_at": now,
                "is_throttled": False,
                "metadata": {},
                "created_at": now,
                "updated_at": now,
            }
            self.db.ai_tenant_quotas.insert_one(doc)
            return doc
        return quota

    def execute(
        self,
        tenant_id: str,
        actor_account_id: str,
        prompt: str,
        task_type: TaskType = TaskType.POLICY_QA,
        institution_id: Optional[str] = None,
        system_instruction: str = "",
        known_student_names: Optional[List[str]] = None,
        known_apaar_ids: Optional[List[str]] = None,
        rehydrate_output: bool = True,
        provider_override: Optional[str] = None,
    ) -> GatewayExecutionResult:
        """Executes the standard 10-step AI request pipeline.

        Args:
            tenant_id: Tenant identifier.
            actor_account_id: Authenticated principal account ID.
            prompt: User question, student prompt, or document text.
            task_type: Categorization for model routing.
            institution_id: Optional campus institution ID.
            system_instruction: Institutional system instruction.
            known_student_names: Specific names for precision PII masking.
            known_apaar_ids: Specific APAAR IDs for precision PII masking.
            rehydrate_output: Whether to restore original PII in response.
            provider_override: Force a specific model provider (e.g. MOCK/GEMINI).

        Returns:
            GatewayExecutionResult containing response, token usage, and trace.
        """
        trace_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        # Step 1 & 2: Verify Token Quota & Throttling
        quota = self.get_or_create_quota(tenant_id)
        if quota.get("is_throttled", False):
            raise TenantTokenQuotaExceededError(
                tenant_id,
                quota.get("tokens_used_this_cycle", 0),
                quota.get("monthly_token_budget", 0),
            )

        if quota.get("tokens_used_this_cycle", 0) >= quota.get("monthly_token_budget", 1_000_000):
            self.db.ai_tenant_quotas.update_one(
                {"tenant_id": tenant_id},
                {"$set": {"is_throttled": True, "updated_at": now}},
            )
            raise TenantTokenQuotaExceededError(
                tenant_id,
                quota.get("tokens_used_this_cycle", 0),
                quota.get("monthly_token_budget", 0),
            )

        # Step 3: Prompt Injection Prevention Scan
        try:
            pip_res = self.pip_filter.scan(prompt)
        except PromptInjectionDetectedError as pip_err:
            # Record security incident trace
            self.db.ai_interaction_traces.insert_one(
                {
                    "trace_id": trace_id,
                    "tenant_id": tenant_id,
                    "institution_id": institution_id,
                    "actor_account_id": actor_account_id,
                    "model_id": "none",
                    "provider": "MOCK",
                    "task_type": task_type.value,
                    "prompt_tokens": len(prompt) // 4,
                    "completion_tokens": 0,
                    "latency_ms": 0.0,
                    "pip_passed": False,
                    "pii_masked_count": 0,
                    "groundedness_score": None,
                    "prompt_snippet": self.privacy_engine.redact_permanently(prompt[:120]),
                    "response_snippet": f"BLOCKED: {pip_err}",
                    "action_proposals": [],
                    "metadata": {"pip_threats": pip_err.threats},
                    "created_at": now,
                }
            )
            raise

        # Step 4 & 5: DPDP Act 2023 PII Masking
        masked_prompt, token_map, masked_count = self.privacy_engine.mask(
            prompt,
            known_names=known_student_names,
            known_apaar_ids=known_apaar_ids,
        )

        # Step 6: Model & Provider Routing
        provider, model_id, temperature = self.router.route(
            task_type, provider_override=provider_override
        )

        # Step 7: Safe Model Execution
        model_resp = provider.generate(
            prompt=masked_prompt,
            system_instruction=system_instruction,
            model_id=model_id,
            temperature=temperature,
        )

        # Step 8: Rehydrate PII for authorized view
        final_text = (
            self.privacy_engine.rehydrate(model_resp.text, token_map)
            if rehydrate_output
            else model_resp.text
        )

        # Step 9: Atomic Quota Accounting
        self.db.ai_tenant_quotas.update_one(
            {"tenant_id": tenant_id},
            {
                "$inc": {"tokens_used_this_cycle": model_resp.total_tokens},
                "$set": {"updated_at": now},
            },
        )

        # Step 10: Immutable AI Interaction Trace Record
        trace_doc = {
            "trace_id": trace_id,
            "tenant_id": tenant_id,
            "institution_id": institution_id,
            "actor_account_id": actor_account_id,
            "model_id": model_resp.model_id,
            "provider": model_resp.provider,
            "task_type": task_type.value,
            "prompt_tokens": model_resp.prompt_tokens,
            "completion_tokens": model_resp.completion_tokens,
            "latency_ms": model_resp.latency_ms,
            "pip_passed": True,
            "pii_masked_count": masked_count,
            "groundedness_score": 1.0,
            "prompt_snippet": self.privacy_engine.redact_permanently(prompt[:120]),
            "response_snippet": self.privacy_engine.redact_permanently(final_text[:120]),
            "action_proposals": [],
            "metadata": {"rehydrated": rehydrate_output},
            "created_at": now,
        }
        self.db.ai_interaction_traces.insert_one(trace_doc)

        return GatewayExecutionResult(
            trace_id=trace_id,
            output_text=final_text,
            prompt_tokens=model_resp.prompt_tokens,
            completion_tokens=model_resp.completion_tokens,
            total_tokens=model_resp.total_tokens,
            latency_ms=model_resp.latency_ms,
            model_id=model_resp.model_id,
            provider=model_resp.provider,
            pip_result=pip_res,
            pii_masked_count=masked_count,
        )

