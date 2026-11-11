"""PlaceFlow / Meridian — Admin Portal URL Routing (Phase 6).
Maps namespaced /api/admin/* routes for Institutional Administrators.
"""

from django.urls import path
from api import (
    views_camp01,
    views_camp02,
    views_camp03,
    views_ai,
    views_hierarchy,
)
from api.auth import lifecycle_views

urlpatterns = [
    # Platform Architecture & Hierarchy
    path("tenants/", views_camp01.TenantListCreateView.as_view(), name="admin_tenants"),
    path("institutions/", views_camp01.InstitutionListCreateView.as_view(), name="admin_institutions"),
    path("campuses/", views_camp01.CampusListCreateView.as_view(), name="admin_campuses"),
    path("hierarchy/", views_hierarchy.InstitutionalRelationshipsView.as_view(), name="admin_hierarchy"),
    path("summary/", views_hierarchy.InstitutionalSummaryView.as_view(), name="admin_summary"),

    # Account Claims & Affiliation Lifecycle Management (PLATFORM_SPEC)
    path("claims/", lifecycle_views.AdminClaimsListView.as_view(), name="admin_claims_list"),
    path("claims/<str:claim_id>/resolve/", lifecycle_views.AdminClaimsResolveView.as_view(), name="admin_claims_resolve"),
    path("affiliations/link/", lifecycle_views.AdminAffiliationLinkView.as_view(), name="admin_affiliations_link"),
    path("affiliations/unlink/", lifecycle_views.AdminAffiliationUnlinkView.as_view(), name="admin_affiliations_unlink"),
    path("accounts/<str:account_id>/resend-invite/", lifecycle_views.AdminAccountResendInviteView.as_view(), name="admin_account_resend_invite"),
    path("accounts/<str:account_id>/force-reset/", lifecycle_views.AdminAccountForceResetView.as_view(), name="admin_account_force_reset"),
    path("accounts/<str:account_id>/deactivate/", lifecycle_views.AdminAccountDeactivateView.as_view(), name="admin_account_deactivate"),

    # IAM Domain
    path("iam/identities/", views_camp02.identities_view, name="admin_iam_identities"),
    path("iam/accounts/", views_camp02.accounts_list_view, name="admin_iam_accounts"),
    path("iam/memberships/", views_camp02.memberships_view, name="admin_iam_memberships"),
    path("iam/roles/", views_camp02.roles_view, name="admin_iam_roles"),
    path("iam/assignments/", views_camp02.assignments_view, name="admin_iam_assignments"),
    path("iam/delegations/", views_camp02.delegations_view, name="admin_iam_delegations"),

    # Academic & AI Governance
    path("academic/qualifications/", views_camp03.qualifications_view, name="admin_academic_qualifications"),
    path("academic/programs/", views_camp03.programs_view, name="admin_academic_programs"),
    path("academic/courses/", views_camp03.courses_view, name="admin_academic_courses"),
    path("ai/traces/", views_ai.ai_traces_view, name="admin_ai_traces"),
]

