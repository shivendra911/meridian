"""Django REST Framework Views for CAMP-01: Tenant & Institution Architecture."""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from camp_01.context import get_current_tenant_id
from camp_01.tenants import (
    create_tenant,
    get_tenant_by_id,
    list_tenants,
    transition_tenant_status,
    TenantValidationError,
    TenantNotFoundError,
    InvalidTenantStateTransitionError,
)
from camp_01.institutions import (
    create_institution,
    get_institution_by_id,
    list_institutions,
    evaluate_institution_readiness,
    submit_institution_for_verification,
    record_verification_decision,
    activate_institution,
    add_institution_identifier,
    list_institution_identifiers,
    InstitutionValidationError,
    InstitutionNotFoundError,
    InstitutionReadinessError,
    InvalidInstitutionStateTransitionError,
)
from camp_01.campuses import (
    create_campus,
    get_campus_by_id,
    list_campuses,
    create_physical_location,
    list_physical_locations,
    associate_campus_with_institution,
    close_institution_campus_association,
    list_institution_campuses,
    CampusValidationError,
    PrimaryCampusCollisionError,
)
from camp_01.organization import (
    create_organizational_unit,
    list_organizational_units,
    create_organizational_relation,
    restructure_unit_parent,
    get_resolved_hierarchy_tree,
    HierarchyCycleDetectedError,
    PrimaryParentCollisionError,
    OrganizationalValidationError,
)
from camp_01.groups import (
    create_institution_group,
    add_institution_group_membership,
    list_group_members,
    record_institution_relationship,
    list_institution_relationships,
)
from camp_01.config import (
    create_configuration_version,
    resolve_effective_configuration,
    list_configuration_history,
)
from camp_01.directory import search_public_directory
from camp_01.onboarding import execute_full_onboarding_pipeline
from api.auth.permissions import perm, any_of


def _get_tenant_id(request):
    """Helper to extract tenant_id from context, header, query, or authenticated user."""
    user = getattr(request, "user", None)
    user_tid = getattr(user, "tenant_id", None) if user else None
    tid = getattr(request, "tenant_id", None) or user_tid or get_current_tenant_id(required=False) or request.headers.get("X-Tenant-ID") or request.GET.get("tenant_id")
    if not tid and request.data and isinstance(request.data, dict):
        tid = request.data.get("tenant_id")
    return tid


class TenantListCreateView(APIView):
    permission_classes = [perm("configuration.version.create")]

    def get(self, request):
        status_filter = request.GET.get("status")
        cust_type = request.GET.get("customer_type")
        tenants = list_tenants(status=status_filter, customer_type=cust_type)
        return Response({"tenants": tenants, "count": len(tenants)})

    def post(self, request):
        data = request.data
        try:
            tenant = create_tenant(
                name=data.get("name", ""),
                slug=data.get("slug", ""),
                customer_type=data.get("customer_type", "STANDALONE_COLLEGE"),
                admin_email=data.get("admin_email", ""),
                subscription_tier=data.get("subscription_tier", "STANDARD"),
                operational_flags=data.get("operational_flags"),
                actor_id=data.get("actor_id", "admin"),
            )
            return Response(tenant, status=status.HTTP_201_CREATED)
        except TenantValidationError as e:
            return Response({"error": "TenantValidationError", "detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class TenantDetailView(APIView):
    def get(self, request, tenant_id):
        try:
            tenant = get_tenant_by_id(tenant_id)
            return Response(tenant)
        except TenantNotFoundError:
            return Response({"error": "TenantNotFound"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, tenant_id):
        # Transition status
        new_status = request.data.get("status")
        reason = request.data.get("reason")
        actor_id = request.data.get("actor_id", "admin")
        try:
            tenant = transition_tenant_status(tenant_id, new_status, reason=reason, actor_id=actor_id)
            return Response(tenant)
        except (TenantValidationError, InvalidTenantStateTransitionError) as e:
            return Response({"error": type(e).__name__, "detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class InstitutionListCreateView(APIView):
    permission_classes = [any_of("organization.unit.create", "institution.profile.read", "configuration.version.create")]

    def get(self, request):
        tid = _get_tenant_id(request)
        if not tid:
            return Response({"error": "MissingTenantContext", "detail": "X-Tenant-ID header required."}, status=status.HTTP_400_BAD_REQUEST)
        insts = list_institutions(tid, status=request.GET.get("status"))
        for inst in insts:
            inst["id"] = inst.get("institution_id")
        return Response({"institutions": insts, "count": len(insts)})

    def post(self, request):
        tid = _get_tenant_id(request)
        if not tid:
            return Response({"error": "MissingTenantContext"}, status=status.HTTP_400_BAD_REQUEST)
        data = request.data
        try:
            inst = create_institution(
                tenant_id=tid,
                institution_code=data.get("institution_code", ""),
                legal_name=data.get("legal_name", ""),
                display_name=data.get("display_name", ""),
                institution_type=data.get("institution_type", "COLLEGE"),
                classifications=data.get("classifications", {}),
                short_name=data.get("short_name"),
                directory_entry_id=data.get("directory_entry_id"),
                contact_email=data.get("contact_email"),
                phone_number=data.get("phone_number"),
                website_url=data.get("website_url"),
            )
            return Response(inst, status=status.HTTP_201_CREATED)
        except (InstitutionValidationError, TenantNotFoundError) as e:
            return Response({"error": type(e).__name__, "detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class InstitutionDetailView(APIView):
    def get(self, request, institution_id):
        tid = _get_tenant_id(request)
        if not tid:
            return Response({"error": "MissingTenantContext"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            inst = get_institution_by_id(tid, institution_id)
            inst["id"] = inst.get("institution_id")
            return Response(inst)
        except InstitutionNotFoundError:
            return Response({"error": "InstitutionNotFound"}, status=status.HTTP_404_NOT_FOUND)


class InstitutionReadinessView(APIView):
    def get(self, request, institution_id):
        tid = _get_tenant_id(request)
        if not tid:
            return Response({"error": "MissingTenantContext"}, status=status.HTTP_400_BAD_REQUEST)
        readiness = evaluate_institution_readiness(tid, institution_id)
        return Response(readiness)


class InstitutionActivateView(APIView):
    def post(self, request, institution_id):
        tid = _get_tenant_id(request)
        if not tid:
            return Response({"error": "MissingTenantContext"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            activated = activate_institution(tid, institution_id, actor_id=request.data.get("actor_id", "admin"))
            return Response(activated)
        except (InstitutionReadinessError, InvalidInstitutionStateTransitionError) as e:
            return Response({"error": type(e).__name__, "detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class InstitutionIdentifiersView(APIView):
    def get(self, request, institution_id):
        tid = _get_tenant_id(request)
        ids = list_institution_identifiers(tid, institution_id)
        return Response({"identifiers": ids})

    def post(self, request, institution_id):
        tid = _get_tenant_id(request)
        data = request.data
        try:
            doc = add_institution_identifier(
                tenant_id=tid,
                institution_id=institution_id,
                scheme=data.get("scheme"),
                value=data.get("value"),
                issuer=data.get("issuer"),
            )
            return Response(doc, status=status.HTTP_201_CREATED)
        except InstitutionValidationError as e:
            return Response({"error": "InstitutionValidationError", "detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CampusListCreateView(APIView):
    permission_classes = [any_of("campus.create", "campus.update", "organization.unit.create")]

    def get(self, request):
        tid = _get_tenant_id(request)
        camps = list_campuses(tid)
        for camp in camps:
            camp["id"] = camp.get("campus_id")
        return Response({"campuses": camps})

    def post(self, request):
        tid = _get_tenant_id(request)
        data = request.data
        try:
            camp = create_campus(
                tenant_id=tid,
                campus_code=data.get("campus_code", ""),
                campus_name=data.get("campus_name", ""),
                campus_kind=data.get("campus_kind", "PHYSICAL"),
                status=data.get("status", "ACTIVE"),
            )
            return Response(camp, status=status.HTTP_201_CREATED)
        except CampusValidationError as e:
            return Response({"error": "CampusValidationError", "detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class InstitutionCampusAssociateView(APIView):
    def get(self, request, institution_id):
        tid = _get_tenant_id(request)
        assocs = list_institution_campuses(tid, institution_id, active_only=False)
        return Response({"associations": assocs})

    def post(self, request, institution_id):
        tid = _get_tenant_id(request)
        data = request.data
        try:
            assoc = associate_campus_with_institution(
                tenant_id=tid,
                institution_id=institution_id,
                campus_id=data.get("campus_id"),
                relationship_type=data.get("relationship_type", "MAIN_CAMPUS"),
                is_primary=data.get("is_primary", False),
            )
            return Response(assoc, status=status.HTTP_201_CREATED)
        except (CampusValidationError, PrimaryCampusCollisionError) as e:
            return Response({"error": type(e).__name__, "detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class OrganizationalUnitView(APIView):
    def get(self, request, institution_id):
        tid = _get_tenant_id(request)
        units = list_organizational_units(tid, institution_id)
        return Response({"units": units, "count": len(units)})

    def post(self, request, institution_id):
        tid = _get_tenant_id(request)
        data = request.data
        try:
            unit = create_organizational_unit(
                tenant_id=tid,
                institution_id=institution_id,
                unit_code=data.get("unit_code"),
                name=data.get("name"),
                unit_type=data.get("unit_type", "DEPARTMENT"),
            )
            return Response(unit, status=status.HTTP_201_CREATED)
        except OrganizationalValidationError as e:
            return Response({"error": "OrganizationalValidationError", "detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class OrganizationalRelationView(APIView):
    def post(self, request, institution_id):
        tid = _get_tenant_id(request)
        data = request.data
        try:
            rel = create_organizational_relation(
                tenant_id=tid,
                institution_id=institution_id,
                child_unit_id=data.get("child_unit_id"),
                parent_unit_id=data.get("parent_unit_id"),
                relationship_type=data.get("relationship_type", "CONTAINS"),
                is_primary=data.get("is_primary", True),
                change_reason=data.get("change_reason"),
            )
            return Response(rel, status=status.HTTP_201_CREATED)
        except (HierarchyCycleDetectedError, PrimaryParentCollisionError, OrganizationalValidationError) as e:
            return Response({"error": type(e).__name__, "detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class OrganizationalHierarchyTreeView(APIView):
    def get(self, request, institution_id):
        tid = _get_tenant_id(request)
        tree = get_resolved_hierarchy_tree(tid, institution_id)
        return Response({"hierarchy_tree": tree})


class OrganizationalRestructureView(APIView):
    def post(self, request, institution_id):
        tid = _get_tenant_id(request)
        data = request.data
        try:
            rel = restructure_unit_parent(
                tenant_id=tid,
                institution_id=institution_id,
                unit_id=data.get("unit_id"),
                new_parent_id=data.get("new_parent_id"),
                change_reason=data.get("change_reason", "Administrative Reorganization"),
            )
            return Response(rel)
        except HierarchyCycleDetectedError as e:
            return Response({"error": "HierarchyCycleDetectedError", "detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class InstitutionConfigurationView(APIView):
    def get(self, request, institution_id):
        tid = _get_tenant_id(request)
        campus_id = request.GET.get("campus_id")
        effective = resolve_effective_configuration(tid, institution_id, campus_id=campus_id)
        history = list_configuration_history(tid, institution_id)
        return Response({"effective_configuration": effective, "resolved_config": effective, "history": history})

    def put(self, request, institution_id):
        tid = _get_tenant_id(request)
        data = request.data
        doc = create_configuration_version(
            tenant_id=tid,
            institution_id=institution_id,
            scope_level=data.get("scope_level", "INSTITUTION"),
            settings=data.get("settings", {}),
            changed_by=data.get("changed_by", "admin"),
            change_reason=data.get("change_reason", "Configuration update"),
            scope_id=data.get("scope_id"),
        )
        return Response(doc)


class ConfigurationResolveView(APIView):
    def get(self, request):
        tid = _get_tenant_id(request)
        institution_id = request.GET.get("institution_id")
        campus_id = request.GET.get("campus_id")
        effective = resolve_effective_configuration(tid, institution_id, campus_id=campus_id)
        return Response({"resolved_config": effective, "effective_configuration": effective})


class PublicDirectorySearchView(APIView):
    def get(self, request):
        query = request.GET.get("q")
        state = request.GET.get("state")
        results = search_public_directory(query=query, state=state)
        return Response({"directory_results": results, "count": len(results)})


class OnboardingPipelineExecuteView(APIView):
    def post(self, request):
        data = request.data
        try:
            result = execute_full_onboarding_pipeline(
                tenant_name=data.get("tenant_name", "Demo University"),
                tenant_slug=data.get("tenant_slug", "demo-uni"),
                customer_type=data.get("customer_type", "STANDALONE_COLLEGE"),
                admin_email=data.get("admin_email", "admin@demo.edu"),
                institution_code=data.get("institution_code", "DEMO_01"),
                legal_name=data.get("legal_name", "Demo College of Technology"),
                display_name=data.get("display_name", "Demo Tech"),
                institution_type=data.get("institution_type", "COLLEGE"),
                classifications=data.get("classifications", {
                    "institution_kind": "COLLEGE",
                    "ownership": "PRIVATE",
                    "governance": "PRIVATE_UNAIDED",
                    "recognition_status": "ACCREDITED",
                    "institutional_role": "DEGREE_AWARDING",
                    "delivery_model": "PHYSICAL",
                }),
                campus_code=data.get("campus_code", "MAIN"),
                campus_name=data.get("campus_name", "Main Campus"),
                primary_location_data=data.get("location_data", {
                    "building_name": "Main Administrative Block",
                    "city": "Mumbai",
                    "state": "Maharashtra",
                    "postal_code": "400076",
                }),
                regulatory_identifiers=data.get("regulatory_identifiers", [
                    {"scheme": "AISHE", "value": "C-99999", "issuer": "Ministry of Education"}
                ]),
                branding_settings=data.get("branding_settings"),
            )
            return Response(result, status=status.HTTP_201_CREATED)
        except Exception as exc:
            return Response({"error": type(exc).__name__, "detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

