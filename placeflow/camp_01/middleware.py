"""Django Middleware and DRF Utilities for Tenant Resolution and Isolation (CAMP-01)."""

from typing import Optional
from django.http import JsonResponse
from rest_framework import permissions
from camp_01.context import set_current_tenant_id, set_current_actor_id
from camp_01.tenants import get_tenant_by_id, TenantNotFoundError


class TenantResolutionMiddleware:
    """Extracts, validates, and binds the tenant context for each incoming request."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == "OPTIONS":
            return self.get_response(request)

        tenant_id = self._extract_tenant_id(request)
        actor_id = self._extract_actor_id(request)

        tenant = None
        if tenant_id:
            try:
                tenant = get_tenant_by_id(tenant_id)
                # Closed tenants are completely rejected from operational requests
                if tenant.get("status") == "CLOSED":
                    return JsonResponse(
                        {"error": "TenantClosed", "message": "This tenant workspace has been terminated."},
                        status=403,
                    )
            except TenantNotFoundError:
                return JsonResponse(
                    {"error": "TenantNotFound", "message": f"Tenant '{tenant_id}' does not exist."},
                    status=404,
                )

        # Bind context
        set_current_tenant_id(tenant_id)
        set_current_actor_id(actor_id)
        request.tenant_id = tenant_id
        request.tenant = tenant

        try:
            response = self.get_response(request)
        finally:
            # Clean up context
            set_current_tenant_id(None)
            set_current_actor_id(None)

        return response

    def _extract_tenant_id(self, request) -> Optional[str]:
        # 1. Custom HTTP header
        header_val = request.headers.get("X-Tenant-ID")
        if header_val:
            return header_val.strip()

        # 2. Query param (useful for dev & testing)
        query_val = request.GET.get("tenant_id")
        if query_val:
            return query_val.strip()

        # 3. Session attribute if present
        if hasattr(request, "session"):
            return request.session.get("tenant_id")

        return None

    def _extract_actor_id(self, request) -> str:
        if hasattr(request, "user") and request.user.is_authenticated:
            return getattr(request.user, "username", str(request.user))
        return request.headers.get("X-Actor-ID", "anonymous-requester")


class IsTenantActive(permissions.BasePermission):
    """DRF permission check: verifies that request has an active, non-suspended tenant."""

    def has_permission(self, request, view):
        if not getattr(request, "tenant", None):
            return False
        return request.tenant.get("status") == "ACTIVE"

