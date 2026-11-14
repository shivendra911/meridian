"""PlaceFlow / Meridian — TPO Portal URL Routing (Phase 6).
Maps namespaced /api/tpo/* routes for Training & Placement Operations.
Gated strictly by PortalAccess("tpo").
"""

from django.urls import path
from api import (
    views_overview,
    views_recruitment,
    views_students,
    views_superday,
    views_renege,
    views_fairness,
    views_reports,
    views_whatif,
    views_ml,
)
from api.auth.permissions import portal_gated

def tpo(cls):
    return portal_gated(cls, "tpo")

urlpatterns = [
    path("overview/", tpo(views_overview.OverviewTelemetryView).as_view(), name="tpo_overview"),
    path("jobs/", tpo(views_recruitment.JobListView).as_view(), name="tpo_jobs"),
    path("jobs/<str:job_id>/", tpo(views_recruitment.JobDetailView).as_view(), name="tpo_job_detail"),
    path("jobs/<str:job_id>/candidates/", tpo(views_recruitment.JobCandidatesView).as_view(), name="tpo_job_candidates"),
    path("companies/", tpo(views_recruitment.CompanyListView).as_view(), name="tpo_companies"),
    path("applications/", tpo(views_recruitment.ApplicationListView).as_view(), name="tpo_applications"),
    path("applications/<str:application_id>/status/", tpo(views_recruitment.ApplicationStatusView).as_view(), name="tpo_application_status"),
    path("interviews/", tpo(views_recruitment.InterviewListView).as_view(), name="tpo_interviews"),
    path("placements/", tpo(views_recruitment.PlacementListView).as_view(), name="tpo_placements"),
    path("students/", tpo(views_students.StudentListView).as_view(), name="tpo_students"),
    path("students/<str:student_id>/", tpo(views_students.StudentDetailView).as_view(), name="tpo_student_detail"),
    path("superday/conflicts/", tpo(views_superday.SuperdayConflictsView).as_view(), name="tpo_superday_conflicts"),
    path("superday/resolve/", tpo(views_superday.SuperdayResolveView).as_view(), name="tpo_superday_resolve"),
    path("insights/renege/", tpo(views_renege.RenegeRadarView).as_view(), name="tpo_insights_renege"),
    path("insights/fairness/", tpo(views_fairness.FairnessAuditView).as_view(), name="tpo_insights_fairness"),
    path("insights/reports/", tpo(views_reports.ReportsSummaryView).as_view(), name="tpo_insights_reports"),
    path("insights/whatif/", tpo(views_whatif.WhatIfSimulateView).as_view(), name="tpo_insights_whatif"),
    path("models/", tpo(views_ml.ModelRegistryListView).as_view(), name="tpo_models_list"),
    path("models/retrain/", tpo(views_ml.ModelRetrainView).as_view(), name="tpo_models_retrain"),
]
