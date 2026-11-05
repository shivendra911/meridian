"""
PlaceFlow Django API — Autonomous Agent Catalog, Graded Runtime & Audit Ledger
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from database.connection import get_db
from operations.agents import run_agent, AGENT_CATALOG
from operations.agent_tools import TOOL_CATALOG


class AgentCatalogView(APIView):
    """Returns available autonomous agents and typed MCP tools."""

    def get(self, request):
        return Response({
            "agents": AGENT_CATALOG,
            "tool_catalog": TOOL_CATALOG,
        }, status=status.HTTP_200_OK)


class AgentChatView(APIView):
    """Executes an agent run following the Plan -> Tool Call -> Synthesize cycle."""

    def post(self, request):
        db = get_db()
        agent_id = request.data.get("agent_id", "AG-01")
        prompt = request.data.get("prompt", "").strip()
        student_id = request.data.get("student_id", "STU001")

        if not prompt:
            return Response({"error": "Prompt is required"}, status=status.HTTP_400_BAD_REQUEST)

        result = run_agent(db, agent_id, prompt, user_context={"student_id": student_id})
        return Response(result, status=status.HTTP_200_OK)


class AgentRunsLedgerView(APIView):
    """Retrieves immutable telemetry logs of past agent runs."""

    def get(self, request):
        db = get_db()
        runs = list(db.agent_runs.find({}, {"_id": 0}).sort("executed_at", -1).limit(100))
        total_runs = len(runs)
        total_tools = sum(len(r.get("tool_calls", [])) for r in runs)

        return Response({
            "total_runs": total_runs,
            "total_tools_executed": total_tools,
            "runs": runs,
        }, status=status.HTTP_200_OK)

