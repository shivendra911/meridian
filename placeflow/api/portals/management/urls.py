"""PlaceFlow / Meridian — Management Portal URL Routing (Phase 6).
Maps namespaced /api/management/* routes for Executive Directorate & Accreditation.
Gated strictly by PortalAccess("management").
"""

from django.urls import path
from api import (
    views_nirf,
    views_fairness,
    views_consent,
    views_agents,
    views_reports,
)
from api.auth.permissions import portal_gated

def mgmt(cls):
    return portal_gated(cls, "management")

urlpatterns = [
    path("nirf/metrics/", mgmt(views_nirf.NirfMetricsView).as_view(), name="mgmt_nirf_metrics"),
    path("fairness/audit/", mgmt(views_fairness.FairnessAuditView).as_view(), name="mgmt_fairness_audit"),
    path("consent/records/", mgmt(views_consent.ManagementConsentRecordsView).as_view(), name="mgmt_consent_records"),
    path("agents/runs/", mgmt(views_agents.AgentRunsLedgerView).as_view(), name="mgmt_agent_runs"),
    path("reports/", mgmt(views_reports.ReportsSummaryView).as_view(), name="mgmt_reports"),
]
