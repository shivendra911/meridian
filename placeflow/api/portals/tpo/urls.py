"""PlaceFlow / Meridian — TPO Portal URL Routing (Phase 6).
Maps namespaced /api/tpo/* routes for Training & Placement Operations.
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
)

urlpatterns = [
    path("overview/", views_overview.OverviewTelemetryView.as_view(), name="tpo_overview"),
    path("jobs/", views_recruitment.JobListView.as_view(), name="tpo_jobs"),
    path("jobs/<str:job_id>/candidates/", views_recruitment.JobCandidatesView.as_view(), name="tpo_job_candidates"),
    path("companies/", views_recruitment.CompanyListView.as_view(), name="tpo_companies"),
    path("applications/", views_recruitment.ApplicationListView.as_view(), name="tpo_applications"),
    path("applications/<str:application_id>/status/", views_recruitment.ApplicationStatusView.as_view(), name="tpo_application_status"),
    path("interviews/", views_recruitment.InterviewListView.as_view(), name="tpo_interviews"),
    path("placements/", views_recruitment.PlacementListView.as_view(), name="tpo_placements"),
    path("students/", views_students.StudentListView.as_view(), name="tpo_students"),
    path("students/<str:student_id>/", views_students.StudentDetailView.as_view(), name="tpo_student_detail"),
    path("superday/conflicts/", views_superday.SuperdayConflictsView.as_view(), name="tpo_superday_conflicts"),
    path("superday/resolve/", views_superday.SuperdayResolveView.as_view(), name="tpo_superday_resolve"),
    path("insights/renege/", views_renege.RenegeRadarView.as_view(), name="tpo_insights_renege"),
    path("insights/fairness/", views_fairness.FairnessAuditView.as_view(), name="tpo_insights_fairness"),
    path("insights/reports/", views_reports.ReportsSummaryView.as_view(), name="tpo_insights_reports"),
    path("insights/whatif/", views_whatif.WhatIfSimulateView.as_view(), name="tpo_insights_whatif"),
]

