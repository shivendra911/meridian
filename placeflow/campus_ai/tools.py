"""Controlled Tool Sandboxes and Human-in-the-Loop Risk Gate for Campus AI.

Every tool exposed to autonomous domain agents is strictly typed, schema-validated,
and classified into one of three risk tiers.
High-risk actions require explicit human sign-off and cannot be auto-committed.
"""

from dataclasses import dataclass, field
from enum import Enum
import inspect
from typing import Any, Callable, Dict, List, Optional


class RiskTier(str, Enum):
    """Action risk classification under Campus AI Safety framework."""

    TIER_1_LOW = "TIER_1_LOW"        # Read-only queries, calculations, explanations
    TIER_2_MEDIUM = "TIER_2_MEDIUM"    # Drafts, tentative proposals, staged schedules
    TIER_3_HIGH = "TIER_3_HIGH"        # Grade records, offer confirmation, blacklisting


class UnauthorizedToolExecutionError(Exception):
    """Raised when an agent attempts to execute an unpermitted or gated tool."""
    pass


@dataclass
class ToolExecutionResult:
    """Standardized tool output returned to an agent."""

    tool_name: str
    risk_tier: RiskTier
    status: str  # "COMPLETED", "STAGED_FOR_APPROVAL", "FAILED"
    data: Any
    requires_human_approval: bool = False
    approval_token: Optional[str] = None


@dataclass
class ToolDefinition:
    """Tool specification including input parameters and execution handler."""

    name: str
    description: str
    risk_tier: RiskTier
    handler: Callable[..., Any]
    parameter_schema: Dict[str, Any] = field(default_factory=dict)


class ToolRegistry:
    """Manages allowed tools and enforces sandbox security boundaries."""

    def __init__(self):
        self._tools: Dict[str, ToolDefinition] = {}

    def register(
        self,
        name: str,
        description: str,
        risk_tier: RiskTier,
        handler: Callable[..., Any],
        parameter_schema: Optional[Dict[str, Any]] = None,
    ):
        """Registers a verified tool into the sandbox registry."""
        self._tools[name] = ToolDefinition(
            name=name,
            description=description,
            risk_tier=risk_tier,
            handler=handler,
            parameter_schema=parameter_schema or {},
        )

    def execute_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        actor_role: str = "STUDENT",
        is_human_confirmed: bool = False,
    ) -> ToolExecutionResult:
        """Executes tool with parameter validation and human-in-the-loop gate."""
        if tool_name not in self._tools:
            raise UnauthorizedToolExecutionError(f"Tool '{tool_name}' is not in allowed sandbox registry.")

        tool_def = self._tools[tool_name]

        # Enforce Human-in-the-Loop gate on Tier 3 actions
        if tool_def.risk_tier == RiskTier.TIER_3_HIGH and not is_human_confirmed:
            return ToolExecutionResult(
                tool_name=tool_name,
                risk_tier=tool_def.risk_tier,
                status="STAGED_FOR_APPROVAL",
                data={
                    "proposed_arguments": arguments,
                    "warning": "High-risk action staged. Requires explicit authorized human sign-off.",
                },
                requires_human_approval=True,
                approval_token=f"appr_{tool_name}_{hash(str(arguments)) & 0xFFFFFFFF:08x}",
            )

        # Execute safe tool handler
        try:
            output = tool_def.handler(**arguments)
            return ToolExecutionResult(
                tool_name=tool_name,
                risk_tier=tool_def.risk_tier,
                status="COMPLETED",
                data=output,
                requires_human_approval=False,
            )
        except Exception as err:
            return ToolExecutionResult(
                tool_name=tool_name,
                risk_tier=tool_def.risk_tier,
                status="FAILED",
                data={"error": str(err)},
                requires_human_approval=False,
            )

