"""PlaceFlow / Meridian — Management Portal URL Routing (Phase 6).
Maps namespaced /api/management/* routes for Executive Directorate & Accreditation.
"""

from django.urls import path
from api import (
    views_nirf,
    views_fairness,
    views_consent,
    views_agents,
    views_reports,
)

urlpatterns = [
    path("nirf/metrics/", views_nirf.NirfMetricsView.as_view(), name="mgmt_nirf_metrics"),
    path("fairness/audit/", views_fairness.FairnessAuditView.as_view(), name="mgmt_fairness_audit"),
    path("consent/records/", views_consent.ConsentRecordView.as_view(), name="mgmt_consent_records"),
    path("agents/runs/", views_agents.AgentRunsLedgerView.as_view(), name="mgmt_agent_runs"),
    path("reports/", views_reports.ReportsSummaryView.as_view(), name="mgmt_reports"),
]

