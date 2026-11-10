"""PlaceFlow / Meridian — RBAC Role-Endpoint Permission Matrix Suite (Phase 6).

Spec reference: docs/RBAC_SPEC.md Section 8 (Test 2):
"Role matrix: for each (role, endpoint) expect 200 or 403, from a table in the test (not inferred)."
"""

import os
import django
import pytest

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "placeflow_core.settings")
django.setup()

from rest_framework.test import APIClient
from database.connection import get_db
from scripts.seed_demo_accounts import seed_demo_accounts


@pytest.fixture(scope="module")
def seeded_db():
    db = get_db()
    seed_demo_accounts(db=db)
    # Ensure active tenant
    db.platform_tenants.update_many({}, {"$set": {"status": "ACTIVE"}})
    return db


def _get_authenticated_client(username: str, password: str = "password123") -> APIClient:
    """Logs in as the specified demo account and returns an authenticated APIClient."""
    client = APIClient()
    login_resp = client.post(
        "/api/auth/login/",
        {"username": username, "password": password},
        format="json",
    )
    assert login_resp.status_code == 200, f"Login failed for {username}: {login_resp.data}"
    token = login_resp.cookies["pf_session"].value
    client.cookies["pf_session"] = token
    return client


# Authoritative Matrix Table: (username, role_code, endpoint, expected_status)
MATRIX_CASES = [
    # ---------------------------------------------------------
    # 1. STUDENT_MEMBER (Aarav Sharma)
    # ---------------------------------------------------------
    ("student", "STUDENT_MEMBER", "/api/student/me/", 200),
    ("student", "STUDENT_MEMBER", "/api/student/opportunities/", 200),
    ("student", "STUDENT_MEMBER", "/api/student/applications/", 200),
    ("student", "STUDENT_MEMBER", "/api/student/academics/", 200),
    ("student", "STUDENT_MEMBER", "/api/student/consents/", 200),
    # Student forbidden from administrative / TPO / departmental consoles
    ("student", "STUDENT_MEMBER", "/api/tpo/overview/", 403),
    ("student", "STUDENT_MEMBER", "/api/tpo/jobs/", 403),
    ("student", "STUDENT_MEMBER", "/api/tpo/companies/", 403),
    ("student", "STUDENT_MEMBER", "/api/faculty/mentees/", 403),
    ("student", "STUDENT_MEMBER", "/api/hod/students/", 403),
    ("student", "STUDENT_MEMBER", "/api/management/nirf/metrics/", 403),
    ("student", "STUDENT_MEMBER", "/api/admin/institutions/", 403),

    # ---------------------------------------------------------
    # 2. TPO_ADMIN (Dr. K. Venkatesh)
    # ---------------------------------------------------------
    ("tpo_admin", "TPO_ADMIN", "/api/tpo/overview/", 200),
    ("tpo_admin", "TPO_ADMIN", "/api/tpo/jobs/", 200),
    ("tpo_admin", "TPO_ADMIN", "/api/tpo/companies/", 200),
    ("tpo_admin", "TPO_ADMIN", "/api/tpo/applications/", 200),
    ("tpo_admin", "TPO_ADMIN", "/api/tpo/students/", 200),
    ("tpo_admin", "TPO_ADMIN", "/api/tpo/insights/renege/", 200),
    ("tpo_admin", "TPO_ADMIN", "/api/tpo/insights/fairness/", 200),
    # TPO Admin forbidden from self student actions
    ("tpo_admin", "TPO_ADMIN", "/api/student/me/", 404),  # TPO is admin subject, not student
    ("tpo_admin", "TPO_ADMIN", "/api/admin/tenants/", 403),

    # ---------------------------------------------------------
    # 3. FACULTY_MENTOR (Dr. Janpreet Singh)
    # ---------------------------------------------------------
    ("faculty", "FACULTY_MENTOR", "/api/faculty/mentees/", 200),
    ("faculty", "FACULTY_MENTOR", "/api/faculty/summary/", 200),
    # Faculty forbidden from TPO placement drive management
    ("faculty", "FACULTY_MENTOR", "/api/tpo/jobs/", 403),
    ("faculty", "FACULTY_MENTOR", "/api/tpo/companies/", 403),
    ("faculty", "FACULTY_MENTOR", "/api/admin/institutions/", 403),

    # ---------------------------------------------------------
    # 4. DEPARTMENT_HEAD (Dr. Sweety Sehgal)
    # ---------------------------------------------------------
    ("hod", "DEPARTMENT_HEAD", "/api/hod/students/", 200),
    ("hod", "DEPARTMENT_HEAD", "/api/hod/faculty/", 200),
    ("hod", "DEPARTMENT_HEAD", "/api/hod/summary/", 200),
    # HOD forbidden from TPO placement job modifications and tenant administration
    ("hod", "DEPARTMENT_HEAD", "/api/tpo/jobs/", 403),
    ("hod", "DEPARTMENT_HEAD", "/api/admin/tenants/", 403),

    # ---------------------------------------------------------
    # 5. INSTITUTION_HEAD (Prof. Dr. P. K. Bansal)
    # ---------------------------------------------------------
    ("vice_chancellor", "INSTITUTION_HEAD", "/api/management/nirf/metrics/", 200),
    ("vice_chancellor", "INSTITUTION_HEAD", "/api/management/fairness/audit/", 200),
    ("vice_chancellor", "INSTITUTION_HEAD", "/api/management/agents/runs/", 200),
    ("vice_chancellor", "INSTITUTION_HEAD", "/api/management/reports/", 200),

    # ---------------------------------------------------------
    # 6. INSTITUTION_ADMIN (Platform Admin)
    # ---------------------------------------------------------
    ("admin", "INSTITUTION_ADMIN", "/api/admin/institutions/", 200),
    ("admin", "INSTITUTION_ADMIN", "/api/admin/campuses/", 200),
    ("admin", "INSTITUTION_ADMIN", "/api/admin/summary/", 200),
]


@pytest.mark.parametrize("username,role_code,endpoint,expected_status", MATRIX_CASES)
def test_rbac_permission_matrix(seeded_db, username, role_code, endpoint, expected_status):
    """Enforces strict RBAC access matrix across roles and endpoints."""
    client = _get_authenticated_client(username=username)
    response = client.get(endpoint)
    assert response.status_code == expected_status, (
        f"RBAC Matrix Violation: User '{username}' ({role_code}) calling '{endpoint}' "
        f"expected HTTP {expected_status}, got HTTP {response.status_code}. "
        f"Response payload: {response.data if hasattr(response, 'data') else response.content}"
    )

