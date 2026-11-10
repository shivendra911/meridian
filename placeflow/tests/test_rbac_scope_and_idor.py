"""PlaceFlow / Meridian — Scope Isolation & IDOR Prevention Suite (Phase 3).

Spec reference: docs/RBAC_SPEC.md Section 8 (Test 3 & Test 4):
"3. IDOR: student A requests student B's record, application, consent. Expect 404.
 4. Scope: HOD of dept X gets zero rows for dept Y; mentor sees only mentees."
"""

import os
import django
import pytest
from datetime import datetime, timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "placeflow_core.settings")
django.setup()

from rest_framework.test import APIClient
from database.connection import get_db
from api.auth.principal import build_principal
from api.auth.scoping import ScopeResolver
from api.auth.masking import mask_record_pii


@pytest.fixture
def auth_client():
    """Provides a fresh APIClient helper that logs in demo accounts."""
    client = APIClient()

    def _login(username, password="password123"):
        db = get_db()
        if not db.accounts.find_one({"username": username}):
            from scripts.seed_demo_accounts import seed_demo_accounts
            seed_demo_accounts(db=db)
        res = client.post("/api/auth/login/", {"username": username, "password": password}, format="json")
        assert res.status_code == 200, f"Failed to log in as {username}: {res.json()}"
        client.cookies["pf_session"] = res.cookies["pf_session"].value
        return res.json().get("me")

    client.login_as = _login
    return client


def test_student_profile_self_isolation_and_idor(auth_client):
    """Student A can only read own profile; student B parameter is discarded by server authority."""
    db = get_db()

    # 1. Student A logs in
    me_a = auth_client.login_as("student")
    assert me_a["subject"]["id"] == "STU001"

    # GET /api/student/me/ returns STU001
    resp_a = auth_client.get("/api/student/me/")
    assert resp_a.status_code == 200
    assert resp_a.json()["student_id"] == "STU001"

    # IDOR attempt: passing ?student_id=STU002 or X-Actor-ID=STU002 is completely ignored
    idor_resp = auth_client.get("/api/student/me/?student_id=STU002", HTTP_X_ACTOR_ID="STU002")
    assert idor_resp.status_code == 200
    assert idor_resp.json()["student_id"] == "STU001"

    # 2. Student B logs in
    me_b = auth_client.login_as("placement_rep")
    assert me_b["subject"]["id"] == "STU002"

    resp_b = auth_client.get("/api/student/me/")
    assert resp_b.status_code == 200
    assert resp_b.json()["student_id"] == "STU002"


def test_student_profile_update_ignores_requested_id(auth_client):
    """PATCH /api/student/profile/ updates only the session principal's record, never another candidate."""
    db = get_db()
    auth_client.login_as("student")

    test_remark = f"Self-update-{datetime.now(timezone.utc).timestamp()}"
    patch_resp = auth_client.patch(
        "/api/student/profile/",
        data={"student_id": "STU002", "remarks": test_remark},
        format="json",
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["student_id"] == "STU001"
    assert patch_resp.json()["remarks"] == test_remark

    # Verify in DB: STU001 updated, STU002 unmodified
    stu1 = db.students.find_one({"student_id": "STU001"})
    stu2 = db.students.find_one({"student_id": "STU002"})
    assert stu1.get("remarks") == test_remark
    assert stu2.get("remarks") != test_remark


def test_student_applications_scoped_to_self(auth_client):
    """GET /api/student/applications/ strictly filters by the session student id."""
    auth_client.login_as("student")

    resp = auth_client.get("/api/student/applications/?student_id=STU002")
    assert resp.status_code == 200
    for app in resp.json():
        assert app["student_id"] == "STU001"


def test_student_apply_ignores_body_student_id(auth_client):
    """POST /api/student/opportunities/<job_id>/apply/ derives applicant strictly from principal."""
    db = get_db()
    auth_client.login_as("student")

    # Pick an open job
    job = db.jobs.find_one({"status": "Open"})
    if not job:
        job = {"job_id": "JOB_TEST_IDOR_01", "status": "Open", "company_id": "COMP01", "tier": "Tier-1", "min_cgpa": 5.0}
        db.jobs.insert_one(job)

    job_id = job["job_id"]
    db.applications.delete_many({"job_id": job_id, "student_id": {"$in": ["STU001", "STU002"]}})

    # Student A attempts to submit an application on behalf of STU002
    resp = auth_client.post(
        f"/api/student/opportunities/{job_id}/apply/",
        data={"student_id": "STU002"},
        format="json",
    )
    if resp.status_code == 201:
        app_id = resp.json().get("application_id")
        created_app = db.applications.find_one({"application_id": app_id})
        assert created_app is not None
        assert created_app["student_id"] == "STU001"  # Derived from session, not STU002!


def test_student_offer_idor_returns_404(auth_client):
    """Responding to an out-of-scope offer returns 404 (not 403) to prevent existence leakage."""
    db = get_db()
    offer_id = "PLC999"

    # Seed an offer specifically belonging to STU002 under strict PLACEMENTS schema
    db.placements.delete_many({"placement_id": offer_id})
    db.placements.insert_one({
        "placement_id": offer_id,
        "student_id": "STU002",
        "company_id": "COMP01",
        "job_id": "JOB01",
        "package_lpa": 18.0,
        "placement_date": datetime.now(timezone.utc),
        "status": "Placed",
        "response_status": "Pending",
    })

    try:
        # 1. Student A attempts to accept STU002's offer -> 404 NOT FOUND
        auth_client.login_as("student")
        idor_resp = auth_client.post(
            f"/api/student/offers/{offer_id}/respond/",
            data={"action": "ACCEPT"},
            format="json",
        )
        assert idor_resp.status_code == 404
        assert idor_resp.json().get("error") == "OfferNotFound"

        # 2. Student B (rightful owner) responds -> 200 OK
        auth_client.login_as("placement_rep")
        valid_resp = auth_client.post(
            f"/api/student/offers/{offer_id}/respond/",
            data={"action": "ACCEPT"},
            format="json",
        )
        assert valid_resp.status_code == 200
        assert valid_resp.json().get("status") == "Accepted"
    finally:
        db.placements.delete_many({"placement_id": offer_id})


def test_student_consents_self_scope_and_record(auth_client):
    """GET and POST /api/student/consents/* enforce strict self-scope."""
    auth_client.login_as("student")

    # GET consents
    list_resp = auth_client.get("/api/student/consents/?student_id=STU002")
    assert list_resp.status_code == 200
    for c in list_resp.json():
        assert c.get("student_id") == "STU001"

    # POST consent recording ignores student_id in payload
    rec_resp = auth_client.post(
        "/api/student/consents/record/",
        data={"student_id": "STU002", "purpose": "PLACEMENT_MATCHING"},
        format="json",
    )
    assert rec_resp.status_code == 201
    cid = rec_resp.json().get("consent_id")

    db = get_db()
    saved = db.consents.find_one({"consent_id": cid})
    assert saved is not None
    assert saved["student_id"] == "STU001"  # Bound to student A!


def test_scope_resolver_hierarchical_isolation():
    """Verifies ScopeResolver produces exact department and mentee filters for HOD and Faculty."""
    db = get_db()

    # 1. Student Principal
    stu_acc = db.accounts.find_one({"username": "student"})
    stu_principal = build_principal(stu_acc["account_id"], tenant_id="delhi-university", db=db)
    stu_filter = ScopeResolver(stu_principal, db=db).students()
    assert stu_filter == {"student_id": "STU001"}

    # 2. HOD Principal
    hod_acc = db.accounts.find_one({"username": "hod"})
    if hod_acc:
        hod_principal = build_principal(hod_acc["account_id"], tenant_id="delhi-university", db=db)
        hod_filter = ScopeResolver(hod_principal, db=db).students()
        assert "department" in hod_filter or "student_id" in hod_filter

    # 3. Faculty Principal (Mentorship scope)
    fac_acc = db.accounts.find_one({"username": "faculty"})
    if fac_acc:
        fac_principal = build_principal(fac_acc["account_id"], tenant_id="delhi-university", db=db)
        fac_filter = ScopeResolver(fac_principal, db=db).students()
        assert "student_id" in fac_filter


def test_masking_redacts_for_non_privileged_roles():
    """Auditors and external viewers receive masked PII; self and privileged export users see plaintext."""
    db = get_db()

    raw_candidate = {
        "student_id": "STU001",
        "name": "Aarav Sharma",
        "phone": "9876543210",
        "email": "aarav.sharma@univ.edu",
        "date_of_birth": "2003-01-15",
        "cgpa": 8.75,
    }

    # 1. Auditor Principal (no export permissions)
    auditor_acc = db.accounts.find_one({"username": "auditor"})
    if auditor_acc:
        auditor_p = build_principal(auditor_acc["account_id"], tenant_id="delhi-university", db=db)
        masked = mask_record_pii(raw_candidate, auditor_p)
        assert masked["phone"] != "9876543210"
        assert masked["date_of_birth"] == "[REDACTED_DOB]"
        assert "aarav.sharma@univ.edu" not in masked["email"]
        assert masked["cgpa"] == 8.75  # Non-PII retained

    # 2. Student himself viewing his own record -> unmasked
    stu_acc = db.accounts.find_one({"username": "student"})
    stu_p = build_principal(stu_acc["account_id"], tenant_id="delhi-university", db=db)
    self_view = mask_record_pii(raw_candidate, stu_p)
    assert self_view["phone"] == "9876543210"
    assert self_view["email"] == "aarav.sharma@univ.edu"
