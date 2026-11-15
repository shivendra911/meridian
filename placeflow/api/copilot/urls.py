"""PlaceFlow / Meridian — Copilot API Route Manifest."""

from django.urls import path
from api.copilot.views import (
    CopilotContextView,
    CopilotQueryView,
    CopilotAgentExecuteView,
)

urlpatterns = [
    path("context/", CopilotContextView.as_view(), name="copilot_context"),
    path("query/", CopilotQueryView.as_view(), name="copilot_query"),
    path("agent/execute/", CopilotAgentExecuteView.as_view(), name="copilot_agent_execute"),
]
