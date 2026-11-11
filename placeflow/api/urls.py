"""
PlaceFlow Django API — URL Dispatcher Configuration
"""

from django.urls import path, include
from api import (
    views_overview,
    views_students,
    views_recruitment,
    views_superday,
    views_agents,
    views_whatif,
    views_nirf,
    views_consent,
    views_fairness,
    views_renege,
    views_reports,
    views_lab,
    views_camp01,
    views_camp02,
    views_camp03,
    views_ai,
    views_hierarchy,
)
from api.auth import views as views_auth
from api.account import views as views_account

urlpatterns = [
    # Authoritative Health & System Status Probe (Public Allowlist)
    path("health/", views_overview.HealthCheckView.as_view(), name="api_health"),

    # Authoritative Authentication & Session Lifecycle (CAMP-02 RBAC Extension)
    path("auth/csrf/", views_auth.CsrfTokenView.as_view(), name="auth_csrf"),
    path("auth/login/", views_auth.LoginView.as_view(), name="auth_login"),
    path("auth/logout/", views_auth.LogoutView.as_view(), name="auth_logout"),
    path("auth/me/", views_auth.MeView.as_view(), name="auth_me"),
    path("auth/switch-context/", views_auth.SwitchContextView.as_view(), name="auth_switch_context"),

    # Meridian Platform Identity, Profiles & Cards (PLATFORM_SPEC)
    path("account/", include("api.account.urls")),
    path("people/<str:person_id>/card/", views_account.PersonCardView.as_view(), name="person_card"),
    path("media/avatar/<str:person_id>/", views_account.MediaAvatarServeView.as_view(), name="media_avatar"),

    # Namespaced Role-Separated Portals (Phase 3 & Phase 6)
    path("student/", include("api.portals.student.urls")),
    path("tpo/", include("api.portals.tpo.urls")),
    path("faculty/", include("api.portals.faculty.urls")),
    path("hod/", include("api.portals.hod.urls")),
    path("management/", include("api.portals.management.urls")),
    path("admin/", include("api.portals.admin.urls")),
    # Institutional Hierarchy & Faculty Mentorship (CAMP-01/02 Governance Extension)
    path("v4/institutional/summary/", views_hierarchy.InstitutionalSummaryView.as_view(), name="institutional_summary"),
    path("v4/institutional/hos/", views_hierarchy.SchoolHeadsListView.as_view(), name="institutional_hos"),
    path("v4/institutional/hods/", views_hierarchy.DepartmentHeadsListView.as_view(), name="institutional_hods"),
    path("v4/institutional/faculty/", views_hierarchy.FacultyListView.as_view(), name="institutional_faculty"),
    path("v4/institutional/faculty/<str:faculty_id>/", views_hierarchy.FacultyDetailView.as_view(), name="institutional_faculty_detail"),
    path("v4/institutional/admins/", views_hierarchy.AdminListView.as_view(), name="institutional_admins"),
    path("v4/institutional/admins/<str:admin_id>/", views_hierarchy.AdminDetailView.as_view(), name="institutional_admin_detail"),
    path("v4/institutional/profile/<str:identifier>/", views_hierarchy.UnifiedPersonProfileView.as_view(), name="institutional_unified_profile"),
    path("v4/institutional/drive/accenture/", views_hierarchy.PlacementDriveDetailView.as_view(), name="institutional_drive_accenture"),
    path("v4/institutional/relationships/", views_hierarchy.InstitutionalRelationshipsView.as_view(), name="institutional_relationships"),

    # Campus AI: Cross-Platform Intelligence Infrastructure Endpoints
    path("v4/ai/query/", views_ai.ai_query_view, name="campus_ai_query"),
    path("v4/ai/rag/", views_ai.ai_rag_view, name="campus_ai_rag"),
    path("v4/ai/agent/execute/", views_ai.ai_agent_execute_view, name="campus_ai_agent_execute"),
    path("v4/ai/traces/", views_ai.ai_traces_view, name="campus_ai_traces"),
    path("v4/ai/quotas/", views_ai.ai_quotas_view, name="campus_ai_quotas"),

    # CAMP-03: Academic Structure & Student Lifecycle Endpoints
    path("v4/academic/qualifications/", views_camp03.qualifications_view, name="camp03_qualifications"),
    path("v4/academic/programs/", views_camp03.programs_view, name="camp03_programs"),
    path("v4/academic/courses/", views_camp03.courses_view, name="camp03_courses"),
    path("v4/academic/calendars/", views_camp03.calendars_view, name="camp03_calendars"),
    path("v4/academic/students/", views_camp03.students_view, name="camp03_students"),
    path("v4/academic/students/<str:enrollment_id>/ledger/", views_camp03.student_ledger_view, name="camp03_student_ledger"),
    path("v4/academic/progression/evaluate/", views_camp03.progression_evaluate_view, name="camp03_progression_evaluate"),

    # CAMP-02: Identity, Membership & Authorization (IAM Domain)
    path("v4/iam/identities/", views_camp02.identities_view, name="camp02_identities"),
    path("v4/iam/identities/<str:person_id>/", views_camp02.identity_detail_view, name="camp02_identity_detail"),
    path("v4/iam/accounts/", views_camp02.accounts_list_view, name="camp02_accounts"),
    path("v4/iam/accounts/<str:account_id>/lock/", views_camp02.account_lock_view, name="camp02_account_lock"),
    path("v4/iam/accounts/<str:account_id>/unlock/", views_camp02.account_unlock_view, name="camp02_account_unlock"),
    path("v4/iam/memberships/", views_camp02.memberships_view, name="camp02_memberships"),
    path("v4/iam/memberships/<str:membership_id>/status/", views_camp02.membership_status_view, name="camp02_membership_status"),
    path("v4/iam/permissions/", views_camp02.permissions_list_view, name="camp02_permissions"),
    path("v4/iam/roles/", views_camp02.roles_view, name="camp02_roles"),
    path("v4/iam/assignments/", views_camp02.assignments_view, name="camp02_assignments"),
    path("v4/iam/assignments/<str:assignment_id>/revoke/", views_camp02.assignment_revoke_view, name="camp02_assignment_revoke"),
    path("v4/iam/delegations/", views_camp02.delegations_view, name="camp02_delegations"),
    path("v4/iam/delegations/<str:delegation_id>/revoke/", views_camp02.delegation_revoke_view, name="camp02_delegation_revoke"),
    path("v4/iam/privileged/break-glass/", views_camp02.break_glass_view, name="camp02_break_glass"),
    path("v4/iam/sessions/", views_camp02.sessions_view, name="camp02_sessions"),
    path("v4/iam/sessions/<str:session_id>/revoke/", views_camp02.session_revoke_view, name="camp02_session_revoke"),
    path("v4/iam/authorize/", views_camp02.authorize_check_view, name="camp02_authorize"),
    path("v4/iam/provision/students/", views_camp02.provision_students_view, name="camp02_provision_students"),

    # CAMP-01: Tenant & Institution Architecture Endpoints (Platform Foundation)
    path("v4/tenants/", views_camp01.TenantListCreateView.as_view(), name="camp01_tenants"),
    path("v4/tenants/<str:tenant_id>/", views_camp01.TenantDetailView.as_view(), name="camp01_tenant_detail"),
    path("v4/institutions/", views_camp01.InstitutionListCreateView.as_view(), name="camp01_institutions"),
    path("v4/institutions/<str:institution_id>/", views_camp01.InstitutionDetailView.as_view(), name="camp01_institution_detail"),
    path("v4/institutions/<str:institution_id>/readiness/", views_camp01.InstitutionReadinessView.as_view(), name="camp01_institution_readiness"),
    path("v4/institutions/<str:institution_id>/activate/", views_camp01.InstitutionActivateView.as_view(), name="camp01_institution_activate"),
    path("v4/institutions/<str:institution_id>/identifiers/", views_camp01.InstitutionIdentifiersView.as_view(), name="camp01_institution_identifiers"),
    path("v4/campuses/", views_camp01.CampusListCreateView.as_view(), name="camp01_campuses"),
    path("v4/institutions/<str:institution_id>/campuses/", views_camp01.InstitutionCampusAssociateView.as_view(), name="camp01_institution_campuses"),
    path("v4/institutions/<str:institution_id>/org-units/", views_camp01.OrganizationalUnitView.as_view(), name="camp01_org_units"),
    path("v4/institutions/<str:institution_id>/org-relations/", views_camp01.OrganizationalRelationView.as_view(), name="camp01_org_relations"),
    path("v4/institutions/<str:institution_id>/hierarchy/", views_camp01.OrganizationalHierarchyTreeView.as_view(), name="camp01_org_hierarchy"),
    path("v4/institutions/<str:institution_id>/restructure/", views_camp01.OrganizationalRestructureView.as_view(), name="camp01_org_restructure"),
    path("v4/institutions/<str:institution_id>/configuration/", views_camp01.InstitutionConfigurationView.as_view(), name="camp01_institution_config"),
    path("v4/config/resolve/", views_camp01.ConfigurationResolveView.as_view(), name="camp01_config_resolve"),
    path("v4/directory/search/", views_camp01.PublicDirectorySearchView.as_view(), name="camp01_directory_search"),
    path("v4/onboard/execute/", views_camp01.OnboardingPipelineExecuteView.as_view(), name="camp01_onboard_execute"),

    # Directorate Overview
    path("overview/", views_overview.OverviewTelemetryView.as_view(), name="api_overview"),

    # Candidate Registry & Dossiers
    path("students/", views_students.StudentListView.as_view(), name="api_students"),
    path("students/<str:student_id>/", views_students.StudentDetailView.as_view(), name="api_student_detail"),

    # Corporate Partners & Open JNFs
    path("companies/", views_recruitment.CompanyListView.as_view(), name="api_companies"),
    path("jobs/", views_recruitment.JobListView.as_view(), name="api_jobs"),
    path("jobs/<str:job_id>/candidates/", views_recruitment.JobCandidatesView.as_view(), name="api_job_candidates"),

    # Recruitment Operations & Cascading
    path("applications/", views_recruitment.ApplicationListView.as_view(), name="api_applications"),
    path("applications/<str:application_id>/status/", views_recruitment.ApplicationStatusView.as_view(), name="api_application_status"),
    path("interviews/", views_recruitment.InterviewListView.as_view(), name="api_interviews"),
    path("placements/", views_recruitment.PlacementListView.as_view(), name="api_placements"),

    # Superday Constraint Solver
    path("superday/conflicts/", views_superday.SuperdayConflictsView.as_view(), name="api_superday_conflicts"),
    path("superday/resolve/", views_superday.SuperdayResolveView.as_view(), name="api_superday_resolve"),

    # Post-Offer Retention & Renege Radar
    path("renege-radar/", views_renege.RenegeRadarView.as_view(), name="api_renege_radar"),

    # Autonomous Copilot Multi-Agent Hub
    path("agents/", views_agents.AgentCatalogView.as_view(), name="api_agents_catalog"),
    path("agents/chat/", views_agents.AgentChatView.as_view(), name="api_agent_chat"),
    path("agents/runs/", views_agents.AgentRunsLedgerView.as_view(), name="api_agent_runs"),

    # What-If Career Simulator & Conformal Package Bands
    path("whatif/simulate/", views_whatif.WhatIfSimulateView.as_view(), name="api_whatif_simulate"),

    # NIRF Graduation Outcome Accreditation Calculator
    path("nirf/metrics/", views_nirf.NirfMetricsView.as_view(), name="api_nirf_metrics"),

    # DPDP Purpose Consent & Privacy Ledger
    path("consent/record/", views_consent.ConsentRecordView.as_view(), name="api_consent_record"),
    path("consent/withdraw/", views_consent.ConsentWithdrawView.as_view(), name="api_consent_withdraw"),
    path("consent/<str:student_id>/", views_consent.ConsentDetailView.as_view(), name="api_consent_detail"),

    # Demographic Slice Fairness Audit
    path("fairness/audit/", views_fairness.FairnessAuditView.as_view(), name="api_fairness_audit"),

    # 15 Aggregation Reports & CSV Export
    path("reports/", views_reports.ReportsSummaryView.as_view(), name="api_reports"),
    path("reports/<str:report_id>/csv/", views_reports.ReportCsvExportView.as_view(), name="api_report_csv"),

    # Database Diagnostic Lab
    path("lab/demos/", views_lab.LabDemosView.as_view(), name="api_lab_demos"),
    path("lab/run/<str:demo_id>/", views_lab.LabRunDemoView.as_view(), name="api_lab_run"),
]
