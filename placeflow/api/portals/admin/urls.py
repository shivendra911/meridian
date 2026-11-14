"""PlaceFlow / Meridian — Admin Portal URL Routing (Phase 6).
Maps namespaced /api/admin/* routes for Institutional Administrators.
Gated strictly by PortalAccess("admin").
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
from api.auth.permissions import portal_gated

def admin_gate(cls):
    return portal_gated(cls, "admin")

urlpatterns = [
    # Platform Architecture & Hierarchy
    path("tenants/", admin_gate(views_camp01.TenantListCreateView).as_view(), name="admin_tenants"),
    path("institutions/", admin_gate(views_camp01.InstitutionListCreateView).as_view(), name="admin_institutions"),
    path("campuses/", admin_gate(views_camp01.CampusListCreateView).as_view(), name="admin_campuses"),
    path("hierarchy/", admin_gate(views_hierarchy.InstitutionalRelationshipsView).as_view(), name="admin_hierarchy"),
    path("summary/", admin_gate(views_hierarchy.InstitutionalSummaryView).as_view(), name="admin_summary"),

    # Account Claims & Affiliation Lifecycle Management (PLATFORM_SPEC)
    path("claims/", admin_gate(lifecycle_views.AdminClaimsListView).as_view(), name="admin_claims_list"),
    path("claims/<str:claim_id>/resolve/", admin_gate(lifecycle_views.AdminClaimsResolveView).as_view(), name="admin_claims_resolve"),
    path("affiliations/link/", admin_gate(lifecycle_views.AdminAffiliationLinkView).as_view(), name="admin_affiliations_link"),
    path("affiliations/unlink/", admin_gate(lifecycle_views.AdminAffiliationUnlinkView).as_view(), name="admin_affiliations_unlink"),
    path("accounts/<str:account_id>/resend-invite/", admin_gate(lifecycle_views.AdminAccountResendInviteView).as_view(), name="admin_account_resend_invite"),
    path("accounts/<str:account_id>/force-reset/", admin_gate(lifecycle_views.AdminAccountForceResetView).as_view(), name="admin_account_force_reset"),
    path("accounts/<str:account_id>/deactivate/", admin_gate(lifecycle_views.AdminAccountDeactivateView).as_view(), name="admin_account_deactivate"),

    # IAM Domain
    path("iam/identities/", admin_gate(views_camp02.identities_view), name="admin_iam_identities"),
    path("iam/accounts/", admin_gate(views_camp02.accounts_list_view), name="admin_iam_accounts"),
    path("iam/memberships/", admin_gate(views_camp02.memberships_view), name="admin_iam_memberships"),
    path("iam/roles/", admin_gate(views_camp02.roles_view), name="admin_iam_roles"),
    path("iam/assignments/", admin_gate(views_camp02.assignments_view), name="admin_iam_assignments"),
    path("iam/delegations/", admin_gate(views_camp02.delegations_view), name="admin_iam_delegations"),

    # Academic & AI Governance
    path("academic/qualifications/", admin_gate(views_camp03.qualifications_view), name="admin_academic_qualifications"),
    path("academic/programs/", admin_gate(views_camp03.programs_view), name="admin_academic_programs"),
    path("academic/courses/", admin_gate(views_camp03.courses_view), name="admin_academic_courses"),
    path("ai/traces/", admin_gate(views_ai.ai_traces_view), name="admin_ai_traces"),
]
