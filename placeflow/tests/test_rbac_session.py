"""Tests for CAMP-02 Authentication, Session Management, and Contract (Phase 2)."""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "placeflow_core.settings")
django.setup()

import pytest
from rest_framework.test import APIClient
from database.connection import get_db
from camp_02.sessions import create_auth_session, validate_session, revoke_session
from scripts.seed_demo_accounts import seed_demo_accounts


@pytest.fixture(autouse=True)
def setup_demo_fixtures():
    """Ensure baseline roles and demo accounts exist."""
    db = get_db()
    seed_demo_accounts(db=db)
    yield


def test_csrf_token_endpoint():
    """GET /api/auth/csrf/ returns a CSRF token."""
    client = APIClient()
    res = client.get("/api/auth/csrf/")
    assert res.status_code == 200
    assert "csrfToken" in res.data
    assert len(res.data["csrfToken"]) > 10


def test_login_success_sets_httponly_cookie_and_me_contract():
    """POST /api/auth/login/ sets HttpOnly pf_session cookie and returns me payload."""
    client = APIClient()
    res = client.post("/api/auth/login/", {"username": "student", "password": "password123"}, format="json")
    assert res.status_code == 200
    assert "me" in res.data
    me = res.data["me"]

    # Verify authoritative contract shape (docs/RBAC_SPEC.md Section 5)
    assert me["account_id"].startswith("acc_")
    assert me["person_id"] == "PER_STU_001"
    assert me["display_name"] == "Aarav Sharma"
    assert me["tenant_id"] is not None
    assert me["institution_id"] is not None
    assert me["subject"] == {"type": "student", "id": "STU001"}
    assert isinstance(me["assignments"], list)
    assert len(me["assignments"]) >= 1
    assert any(a["role_code"] == "STUDENT_MEMBER" for a in me["assignments"])
    assert "placement.application.create" in me["permissions"]
    assert "student.profile.update_self" in me["permissions"]
    assert "student" in me["portals"]
    assert me["default_portal"] == "student"

    # Verify cookie attributes
    assert "pf_session" in res.cookies
    cookie = res.cookies["pf_session"]
    assert cookie.value.startswith("sess_")
    assert cookie["httponly"] is True
    assert cookie["samesite"] == "Lax"


def test_login_failure_wrong_password_generic_401():
    """POST /api/auth/login/ with wrong password returns 401 with generic message."""
    client = APIClient()
    res = client.post("/api/auth/login/", {"username": "student", "password": "wrong_password_123"}, format="json")
    assert res.status_code == 401
    assert res.data == {"error": "InvalidCredentials"}
    assert "pf_session" not in res.cookies or not res.cookies["pf_session"].value


def test_login_failure_nonexistent_user_generic_401():
    """POST /api/auth/login/ with unknown username returns 401 with generic message."""
    client = APIClient()
    res = client.post("/api/auth/login/", {"username": "ghost_user_404", "password": "anypassword"}, format="json")
    assert res.status_code == 401
    assert res.data == {"error": "InvalidCredentials"}


def test_auth_me_with_cookie_session():
    """GET /api/auth/me/ returns principal when authenticated via session cookie."""
    client = APIClient()
    login_res = client.post("/api/auth/login/", {"username": "student", "password": "password123"}, format="json")
    assert login_res.status_code == 200
    token = login_res.cookies["pf_session"].value

    client.cookies["pf_session"] = token
    me_res = client.get("/api/auth/me/")
    assert me_res.status_code == 200
    assert me_res.data["account_id"] == login_res.data["me"]["account_id"]
    assert me_res.data["subject"] == {"type": "student", "id": "STU001"}


def test_auth_me_with_bearer_token():
    """GET /api/auth/me/ returns principal when authenticated via Authorization header."""
    client = APIClient()
    login_res = client.post("/api/auth/login/", {"username": "hod", "password": "password123"}, format="json")
    assert login_res.status_code == 200
    token = login_res.cookies["pf_session"].value

    bearer_client = APIClient()
    me_res = bearer_client.get("/api/auth/me/", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert me_res.status_code == 200
    assert me_res.data["display_name"] == "Dr. Sweety Sehgal"
    assert "hod" in me_res.data["portals"]


def test_auth_me_unauthenticated_returns_401():
    """GET /api/auth/me/ without credentials returns 401."""
    client = APIClient()
    res = client.get("/api/auth/me/")
    assert res.status_code == 401


def test_logout_revokes_session_and_clears_cookie():
    """POST /api/auth/logout/ invalidates the session and subsequent requests fail."""
    client = APIClient()
    login_res = client.post("/api/auth/login/", {"username": "student", "password": "password123"}, format="json")
    assert login_res.status_code == 200
    token = login_res.cookies["pf_session"].value

    client.cookies["pf_session"] = token

    # Logout
    logout_res = client.post("/api/auth/logout/")
    assert logout_res.status_code == 200
    assert logout_res.data.get("success") is True

    # Subsequent me call should fail
    me_res = client.get("/api/auth/me/")
    assert me_res.status_code == 401

    # Verify session status in database
    db = get_db()
    sess = validate_session(token, db=db)
    assert sess is None


def test_tenant_mismatch_returns_403():
    """Requests presenting a mismatched X-Tenant-ID header receive 403 TenantMismatch."""
    client = APIClient()
    login_res = client.post("/api/auth/login/", {"username": "student", "password": "password123"}, format="json")
    assert login_res.status_code == 200
    token = login_res.cookies["pf_session"].value
    sess_tenant_id = login_res.data["me"]["tenant_id"]

    db = get_db()
    # Find or ensure a second valid active tenant exists
    other_tenant = db.platform_tenants.find_one({"id": {"$ne": sess_tenant_id}, "status": "ACTIVE"})
    if not other_tenant:
        other_tenant = db.platform_tenants.find_one({"slug": "delhi-university"})
    mismatched_tenant_id = other_tenant["id"] if other_tenant else "ten_other"

    client.cookies["pf_session"] = token
    res = client.get("/api/auth/me/", HTTP_X_TENANT_ID=mismatched_tenant_id)
    assert res.status_code == 403
    assert "TenantMismatch" in str(res.data)


def test_switch_context_updates_institution():
    """POST /api/auth/switch-context/ updates active institution within the session."""
    client = APIClient()
    login_res = client.post("/api/auth/login/", {"username": "admin", "password": "password123"}, format="json")
    assert login_res.status_code == 200
    token = login_res.cookies["pf_session"].value

    client.cookies["pf_session"] = token
    switch_res = client.post("/api/auth/switch-context/", {"institution_id": "inst_secondary_campus"}, format="json")
    assert switch_res.status_code == 200
    assert switch_res.data["me"]["institution_id"] == "inst_secondary_campus"

    # Verify subsequent me reflects updated institution
    me_res = client.get("/api/auth/me/")
    assert me_res.status_code == 200
    assert me_res.data["institution_id"] == "inst_secondary_campus"


def test_all_13_demo_accounts_portal_and_default_routing():
    """Validates that each demo account receives their authoritative narrowed portals and default portal."""
    expected_routing = {
        "student": (["student"], "student"),
        "placement_rep": (["student"], "student"),
        "faculty": (["faculty"], "faculty"),
        "coordinator": (["faculty"], "faculty"),
        "hod": (["hod"], "hod"),
        "dean": (["hod"], "hod"),
        "tpo_coordinator": (["tpo"], "tpo"),
        "tpo_admin": (["tpo"], "tpo"),
        "vice_chancellor": (["management"], "management"),
        "admin": (["admin"], "admin"),
        "superadmin": (["admin"], "admin"),
        "auditor": (["management"], "management"),
        "recruiter": ([], ""),
    }

    client = APIClient()
    for username, (expected_portals, expected_default) in expected_routing.items():
        res = client.post("/api/auth/login/", {"username": username, "password": "password123"}, format="json")
        assert res.status_code == 200, f"Login failed for {username}: {res.data}"
        me = res.data["me"]
        assert me["portals"] == expected_portals, f"{username} expected portals {expected_portals}, got {me['portals']}"
        assert me["default_portal"] == expected_default, f"{username} expected default {expected_default}, got {me['default_portal']}"

