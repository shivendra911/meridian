"""PlaceFlow / Meridian — RBAC Route Coverage & Default-Deny Verification Suite (Phase 3).

Spec reference: docs/RBAC_SPEC.md Section 8 (Test 1):
"Route coverage: iterate every URL pattern; fail if a view has no permission class
and is not in PUBLIC_ALLOWLIST = {auth/csrf, auth/login, health}."
"""

import os
import django
import pytest

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "placeflow_core.settings")
django.setup()

from django.urls import get_resolver
from rest_framework.test import APIClient
from rest_framework.permissions import AllowAny


PUBLIC_ALLOWLIST = {
    "/api/auth/csrf/",
    "/api/auth/login/",
    "/api/health/",
}


def _collect_api_routes():
    """Recursively walks url patterns and yields (full_path, view_callback, view_class)."""
    resolver = get_resolver()
    routes = []

    def _walk(patterns, prefix=""):
        for p in patterns:
            if hasattr(p, "url_patterns"):
                _walk(p.url_patterns, prefix + str(p.pattern))
            elif hasattr(p, "callback"):
                full_path = "/" + prefix + str(p.pattern)
                if full_path.startswith("/api/"):
                    cb = p.callback
                    cls = getattr(cb, "cls", None)
                    routes.append((full_path, cb, cls))

    _walk(resolver.url_patterns)
    return routes


def test_public_allowlist_accessible_unauthenticated():
    """Verifies that endpoints in PUBLIC_ALLOWLIST succeed without credentials."""
    client = APIClient()

    csrf_resp = client.get("/api/auth/csrf/")
    assert csrf_resp.status_code == 200
    assert "csrfToken" in csrf_resp.json()

    health_resp = client.get("/api/health/")
    assert health_resp.status_code == 200
    assert health_resp.json().get("status") == "healthy"


def test_every_api_view_has_declared_permissions():
    """Iterates every DRF endpoint under /api/; fails if any view lacks permission classes."""
    routes = _collect_api_routes()
    assert len(routes) > 0, "No API routes collected from resolver."

    missing_perms = []
    unintended_allow_any = []

    for path, cb, cls in routes:
        assert cls is not None, f"Route {path} has no associated DRF view class."
        perms = getattr(cls, "permission_classes", []) or []

        if not perms:
            missing_perms.append(path)

        has_allow_any = any(
            issubclass(p, AllowAny) if isinstance(p, type) else isinstance(p, AllowAny)
            for p in perms
        )
        if has_allow_any and path not in PUBLIC_ALLOWLIST:
            unintended_allow_any.append((path, perms))

    assert len(missing_perms) == 0, f"Found routes missing permission declarations: {missing_perms}"
    assert len(unintended_allow_any) == 0, f"Found non-allowlist routes with AllowAny: {unintended_allow_any}"


def test_unauthenticated_requests_rejected_on_all_protected_routes():
    """Verifies that anonymous calls to protected endpoints return 401 or 403."""
    routes = _collect_api_routes()
    client = APIClient()

    unprotected_leaks = []

    for path, cb, cls in routes:
        if path in PUBLIC_ALLOWLIST:
            continue

        sample_path = path
        for param in [
            "<str:student_id>", "<str:faculty_id>", "<str:admin_id>", "<str:job_id>",
            "<str:application_id>", "<str:offer_id>", "<str:identifier>", "<str:enrollment_id>",
            "<str:tenant_id>", "<str:institution_id>", "<str:membership_id>", "<str:account_id>",
            "<str:person_id>", "<str:assignment_id>", "<str:delegation_id>", "<str:session_id>",
            "<str:report_id>", "<str:demo_id>"
        ]:
            sample_path = sample_path.replace(param, "test-id")

        resp = client.get(sample_path)
        if resp.status_code == 405:
            resp = client.post(sample_path, data={}, format="json")

        if resp.status_code not in (401, 403):
            unprotected_leaks.append((path, resp.status_code))

    assert len(unprotected_leaks) == 0, f"Protected routes returned non-401/403 status anonymously: {unprotected_leaks}"


def test_legacy_route_deprecation_headers():
    """Verifies that LegacyRouteDeprecationMiddleware tags legacy routes with Deprecation: true."""
    from database.connection import get_db
    db = get_db()
    if not db.accounts.find_one({"username": "tpo_admin"}):
        from scripts.seed_demo_accounts import seed_demo_accounts
        seed_demo_accounts(db=db)

    client = APIClient()
    login_res = client.post("/api/auth/login/", {"username": "tpo_admin", "password": "password123"}, format="json")
    assert login_res.status_code == 200
    client.cookies["pf_session"] = login_res.cookies["pf_session"].value

    legacy_resp = client.get("/api/overview/")
    assert legacy_resp.status_code == 200
    assert legacy_resp.headers.get("Deprecation") == "true"

    portal_resp = client.get("/api/auth/me/")
    assert "Deprecation" not in portal_resp.headers

