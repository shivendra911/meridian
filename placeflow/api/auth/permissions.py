"""PlaceFlow / Meridian — Authorization Primitives & Permission Builders (Phase 3).

Exposes `perm(...)`, `any_of(...)`, `all_of(...)`, and `HasPermission` for declarative DRF view security.
Enforces default-deny coarse authorization and integrates with CAMP-02 authorizer.
"""

from typing import Any, Callable, Optional, Type
from rest_framework.permissions import BasePermission
from api.auth.audit import audit_log
from camp_02.authorizer import can, Decision


class HasPermission(BasePermission):
    """Base coarse permission check inspecting the Principal's effective permission keys."""

    def __init__(self, permission_key: str):
        self.permission_key = permission_key

    def has_permission(self, request, view) -> bool:
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return False

        allowed = user.has(self.permission_key)
        if not allowed:
            audit_log(
                event_type="PERMISSION_DENIED",
                principal=user,
                permission=self.permission_key,
                path=request.path,
                method=request.method,
                decision="DENIED",
                reason_code="MISSING_PERMISSION",
            )
        return allowed


def perm(permission_key: str) -> Type[BasePermission]:
    """Generates a DRF BasePermission class enforcing a single required permission key."""

    class _PermClass(BasePermission):
        required_permission = permission_key

        def has_permission(self, request, view) -> bool:
            user = getattr(request, "user", None)
            if not user or not getattr(user, "is_authenticated", False):
                return False

            allowed = user.has(permission_key)
            if not allowed:
                audit_log(
                    event_type="PERMISSION_DENIED",
                    principal=user,
                    permission=permission_key,
                    path=request.path,
                    method=request.method,
                    decision="DENIED",
                    reason_code="MISSING_PERMISSION",
                )
            return allowed

    _PermClass.__name__ = f"HasPermission_{permission_key.replace('.', '_')}"
    return _PermClass


def any_of(*permission_keys: str) -> Type[BasePermission]:
    """Generates a DRF BasePermission class requiring at least one of the specified permissions."""

    class _AnyOfClass(BasePermission):
        required_permissions = permission_keys

        def has_permission(self, request, view) -> bool:
            user = getattr(request, "user", None)
            if not user or not getattr(user, "is_authenticated", False):
                return False

            allowed = user.has_any(*permission_keys)
            if not allowed:
                audit_log(
                    event_type="PERMISSION_DENIED",
                    principal=user,
                    permission=",".join(permission_keys),
                    path=request.path,
                    method=request.method,
                    decision="DENIED",
                    reason_code="MISSING_ANY_PERMISSION",
                )
            return allowed

    _AnyOfClass.__name__ = f"AnyOf_{'_'.join(k.replace('.', '_') for k in permission_keys[:3])}"
    return _AnyOfClass


def all_of(*permission_keys: str) -> Type[BasePermission]:
    """Generates a DRF BasePermission class requiring all of the specified permissions."""

    class _AllOfClass(BasePermission):
        required_permissions = permission_keys

        def has_permission(self, request, view) -> bool:
            user = getattr(request, "user", None)
            if not user or not getattr(user, "is_authenticated", False):
                return False

            allowed = user.has_all(*permission_keys)
            if not allowed:
                audit_log(
                    event_type="PERMISSION_DENIED",
                    principal=user,
                    permission=",".join(permission_keys),
                    path=request.path,
                    method=request.method,
                    decision="DENIED",
                    reason_code="MISSING_ALL_PERMISSIONS",
                )
            return allowed

    _AllOfClass.__name__ = f"AllOf_{'_'.join(k.replace('.', '_') for k in permission_keys[:3])}"
    return _AllOfClass


def check_resource_access(
    principal: Any,
    action: str,
    resource: str,
    membership_id: Optional[str] = None,
    db=None,
) -> Decision:
    """Invokes the authoritative camp_02.authorizer.can() engine for resource-level evaluations."""
    if not principal:
        return Decision(allowed=False, reason_code="ANONYMOUS_PRINCIPAL")

    tenant_id = getattr(principal, "tenant_id", "global")
    # Resolve membership if available in assignments
    resolved_mem_id = membership_id
    if not resolved_mem_id and hasattr(principal, "assignments") and principal.assignments:
        resolved_mem_id = principal.assignments[0].get("membership_id") or f"mem_{principal.account_id}"

    return can(
        tenant_id=tenant_id,
        membership_id=resolved_mem_id or f"mem_{principal.account_id}",
        action=action,
        resource=resource,
        db=db,
    )


class PortalAccess(BasePermission):
    """Enforces that the authenticated principal possesses entry rights for the given portal."""

    def __init__(self, portal: str = ""):
        self.portal = portal

    def __call__(self):
        return self

    def has_permission(self, request, view) -> bool:
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return False
        portals = getattr(user, "portals", [])
        portal_name = self.portal or getattr(view, "portal_name", "")
        if not portal_name:
            return True
        allowed = portal_name in portals
        if not allowed:
            audit_log(
                event_type="PORTAL_ACCESS_DENIED",
                principal=user,
                permission=f"portal.{portal_name}",
                path=request.path,
                method=request.method,
                decision="DENIED",
                reason_code="PORTAL_NOT_ASSIGNED",
            )
        return allowed


def portal_access(portal: str) -> Type[BasePermission]:
    """Generates a DRF BasePermission class requiring membership in the specified portal."""

    class _PortalAccessClass(BasePermission):
        def has_permission(self, request, view) -> bool:
            user = getattr(request, "user", None)
            if not user or not getattr(user, "is_authenticated", False):
                return False
            portals = getattr(user, "portals", [])
            allowed = portal in portals
            if not allowed:
                audit_log(
                    event_type="PORTAL_ACCESS_DENIED",
                    principal=user,
                    permission=f"portal.{portal}",
                    path=request.path,
                    method=request.method,
                    decision="DENIED",
                    reason_code="PORTAL_NOT_ASSIGNED",
                )
            return allowed

    _PortalAccessClass.__name__ = f"PortalAccess_{portal.capitalize()}"
    return _PortalAccessClass


def portal_gated(view_target, portal: str):
    """Subclasses a DRF view class or wraps a function view to enforce PortalAccess(portal)."""
    import inspect
    from functools import wraps
    from rest_framework.response import Response
    from rest_framework import status

    if inspect.isclass(view_target):
        class _GatedView(view_target):
            portal_name = portal

            def get_permissions(self):
                return [portal_access(portal)()] + super().get_permissions()

        _GatedView.__name__ = f"{portal.capitalize()}_{view_target.__name__}"
        return _GatedView
    else:
        from django.http import JsonResponse

        @wraps(view_target)
        def _gated_func(request, *args, **kwargs):
            user = getattr(request, "user", None)
            if not user or not getattr(user, "is_authenticated", False):
                return JsonResponse({"error": "AuthenticationRequired"}, status=status.HTTP_401_UNAUTHORIZED)
            portals = getattr(user, "portals", [])
            if portal not in portals:
                audit_log(
                    event_type="PORTAL_ACCESS_DENIED",
                    principal=user,
                    permission=f"portal.{portal}",
                    path=request.path,
                    method=request.method,
                    decision="DENIED",
                    reason_code="PORTAL_NOT_ASSIGNED",
                )
                return JsonResponse({"error": "PortalAccessDenied", "detail": f"Account does not have access to {portal} portal"}, status=status.HTTP_403_FORBIDDEN)
            return view_target(request, *args, **kwargs)

        return _gated_func


class PortalBaseView:
    """Base mixin automatically prepending portal access checks to view permissions."""
    portal_name: str = ""

    def get_permissions(self):
        perms = super().get_permissions()
        if self.portal_name:
            return [portal_access(self.portal_name)()] + perms
        return perms


