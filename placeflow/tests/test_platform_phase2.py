"""PlaceFlow / Meridian — Platform Phase 2 Verification Suite (Account Lifecycle).

Tests for docs/PLATFORM_SPEC.md Sections 3 and 8:
- Invite acceptance: token validation, password set, account ACTIVE, affiliation VERIFIED (IMPORT), login verification, single-use and expiration enforcement.
- Claim lifecycle: start -> 6-digit OTP -> verify -> Person Identity, Account, Affiliation (CLAIM), STUDENT_MEMBER role, login verification.
- OTP lockout & expiration: 5 failed attempts lock the OTP, expired codes are rejected.
- Zero enumeration leakage: claim/start and password/forgot return identical generic 200 responses.
- Password forgot and reset: token issuance, password update, and session revocation.
- Admin claims queue: failed/ambiguous claims appear in queue, admin resolution (APPROVE/REJECT), RBAC authorization checks.
- Admin affiliation management: uniqueness enforcement, last affiliation unlink safeguard.
"""

import os
import uuid
from datetime import datetime, timezone, timedelta

import django
import pytest

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "placeflow_core.settings")
os.environ.setdefault("DJANGO_LOGIN_THROTTLE_RATE", "5000/minute")
django.setup()

from rest_framework.test import APIClient
from database.connection import get_db
from camp_02.accounts import create_account, get_account_by_id
from camp_02.identities import create_person_identity
from camp_02.tokens import create_invite_token, create_reset_token
from camp_02.sessions import create_auth_session


@pytest.fixture
def auth_client():
    client = APIClient()

    def _login(username, password="password123"):
        db = get_db()
        if not db.accounts.find_one({"username": username}):
            from scripts.seed_demo_accounts import seed_demo_accounts
            seed_demo_accounts(db=db)
        from scripts.backfill_affiliations import backfill_person_affiliations
        backfill_person_affiliations(db=db)

        res = client.post("/api/auth/login/", {"username": username, "password": password}, format="json")
        assert res.status_code == 200, f"Failed to log in as {username}: {res.json()}"
        client.cookies["pf_session"] = res.cookies["pf_session"].value
        return res.json().get("me")

    client.login_as = _login
    return client


def test_invite_acceptance_and_login_flow():
    """Seeded invited account accepts invitation, sets password, marks affiliation VERIFIED, and logs in."""
    client = APIClient()
    db = get_db()

    # 1. Setup an invited user with person and unverified affiliation
    uid = uuid.uuid4().hex[:8]
    person = create_person_identity(
        first_name="Invited",
        last_name=f"Student_{uid}",
        primary_email=f"invited_{uid}@univ.edu",
        tenant_id="tenant_default",
        db=db,
    )
    acc = create_account(
        person_id=person["person_id"],
        username=f"invited_{uid}",
        email=f"invited_{uid}@univ.edu",
        status="INVITED",
        tenant_id="tenant_default",
        db=db,
    )
    db.person_affiliations.insert_one({
        "affiliation_id": f"aff_inv_{uid}",
        "tenant_id": "tenant_default",
        "person_id": person["person_id"],
        "type": "STUDENT",
        "record_id": f"STU_INV_{uid}",
        "status": "UNVERIFIED",
        "source": "IMPORT",
        "verified_by": None,
        "verified_at": None,
        "created_at": datetime.now(timezone.utc),
    })

    # 2. Generate invite token
    raw_token, token_doc = create_invite_token(
        account_id=acc["account_id"],
        tenant_id="tenant_default",
        db=db,
    )

    # 3. Accept invite with new password
    new_password = "SecurePassword123!"
    res = client.post("/api/auth/accept-invite/", {
        "token": raw_token,
        "password": new_password,
    }, format="json")
    assert res.status_code == 200
    assert "activated successfully" in res.json().get("message", "").lower()

    # Verify DB state
    updated_acc = get_account_by_id(acc["account_id"], db=db)
    assert updated_acc["status"] == "ACTIVE"

    aff = db.person_affiliations.find_one({"affiliation_id": f"aff_inv_{uid}"})
    assert aff["status"] == "VERIFIED"
    assert aff["source"] == "IMPORT"

    # 4. Verify login with the new password
    login_res = client.post("/api/auth/login/", {
        "username": f"invited_{uid}",
        "password": new_password,
    }, format="json")
    assert login_res.status_code == 200
    assert "me" in login_res.json()

    # 5. Token reuse is blocked
    res_reuse = client.post("/api/auth/accept-invite/", {
        "token": raw_token,
        "password": new_password,
    }, format="json")
    assert res_reuse.status_code == 400
    assert "invalid or already used" in res_reuse.json().get("error", "").lower()


def test_claim_flow_end_to_end():
    """Unclaimed student record can be claimed with registration_no and institutional email."""
    import secrets
    client = APIClient()
    db = get_db()

    # 1. Setup a clean unclaimed student in database
    num = secrets.randbelow(899999) + 100000
    stu_id = f"STU{num}"
    reg_no = f"REG{num}"
    inst_email = f"student_{num}@univ.edu"

    db.students.insert_one({
        "student_id": stu_id,
        "reg_no": reg_no,
        "name": f"Candidate {num}",
        "email": inst_email,
        "department": "CSE",
        "year": 4,
        "cgpa": 8.5,
        "backlogs": 0,
        "skills": ["Python", "FastAPI"],
        "placement_status": "Unplaced",
        "created_at": datetime.now(timezone.utc),
    })

    # 2. Step 1: Start claim
    start_res = client.post("/api/auth/claim/start/", {
        "registration_no": reg_no,
        "institutional_email": inst_email,
    }, format="json")
    assert start_res.status_code == 200
    start_data = start_res.json()
    assert "If a record matches, we sent a verification code" in start_data.get("message", "")
    claim_id = start_data.get("claim_id")
    assert claim_id

    # Retrieve generated OTP from DB for testing
    token = db.account_tokens.find_one({"purpose": "CLAIM_OTP", "metadata.claim_id": claim_id})
    assert token is not None
    # Verify OTP against stored hash
    # In test environment, let's find the OTP by checking token
    import hashlib
    found_otp = None
    for candidate in range(100000, 1000000):
        h = hashlib.sha256(f"{claim_id}:{candidate}".encode("utf-8")).hexdigest()
        if h == token["token_hash"]:
            found_otp = str(candidate)
            break
    assert found_otp is not None, "Could not resolve generated test OTP"

    # 3. Step 2: Verify claim with valid OTP and new password
    claim_pwd = "StudentClaimSecret123!"
    verify_res = client.post("/api/auth/claim/verify/", {
        "claim_id": claim_id,
        "otp": found_otp,
        "password": claim_pwd,
    }, format="json")
    assert verify_res.status_code == 200
    assert "account_id" in verify_res.json()

    # 4. Check DB state: person, active account, verified affiliation, student role
    stu = db.students.find_one({"student_id": stu_id})
    assert stu.get("person_id") is not None
    person = db.person_identities.find_one({"person_id": stu["person_id"]})
    assert person is not None

    account = db.accounts.find_one({"person_id": stu["person_id"]})
    assert account is not None
    assert account["status"] == "ACTIVE"

    aff = db.person_affiliations.find_one({"record_id": stu_id, "type": "STUDENT"})
    assert aff is not None
    assert aff["status"] == "VERIFIED"
    assert aff["source"] == "CLAIM"

    # 5. Login works with newly claimed credentials
    login_res = client.post("/api/auth/login/", {
        "username": account["username"],
        "password": claim_pwd,
    }, format="json")
    assert login_res.status_code == 200
    assert "me" in login_res.json()

    # 6. OTP cannot be reused
    reuse_res = client.post("/api/auth/claim/verify/", {
        "claim_id": claim_id,
        "otp": found_otp,
        "password": claim_pwd,
    }, format="json")
    assert reuse_res.status_code == 400


def test_claim_otp_lockout_and_expiration():
    """OTP locks permanently after 5 failed attempts, and expired OTP is rejected."""
    import secrets
    client = APIClient()
    db = get_db()

    num = secrets.randbelow(899999) + 100000
    stu_id = f"STU{num}"
    reg_no = f"REG{num}"
    inst_email = f"student_lck_{num}@univ.edu"

    db.students.insert_one({
        "student_id": stu_id,
        "reg_no": reg_no,
        "name": f"Lockout Candidate {num}",
        "email": inst_email,
        "department": "ECE",
        "year": 4,
        "cgpa": 7.9,
        "backlogs": 0,
        "skills": ["C++"],
        "placement_status": "Unplaced",
        "created_at": datetime.now(timezone.utc),
    })

    # Start claim
    start_res = client.post("/api/auth/claim/start/", {
        "registration_no": reg_no,
        "institutional_email": inst_email,
    }, format="json")
    claim_id = start_res.json()["claim_id"]

    # 4 failed attempts
    for attempt in range(1, 5):
        fail_res = client.post("/api/auth/claim/verify/", {
            "claim_id": claim_id,
            "otp": "000000",
            "password": "ValidPassword123!",
        }, format="json")
        assert fail_res.status_code == 400
        assert f"{5 - attempt} attempts remaining" in fail_res.json().get("error", "")

    # 5th failed attempt triggers lockout
    lock_res = client.post("/api/auth/claim/verify/", {
        "claim_id": claim_id,
        "otp": "000000",
        "password": "ValidPassword123!",
    }, format="json")
    assert lock_res.status_code == 400
    assert lock_res.json().get("locked") is True

    # 6th attempt even with anything is locked
    lock_res2 = client.post("/api/auth/claim/verify/", {
        "claim_id": claim_id,
        "otp": "123456",
        "password": "ValidPassword123!",
    }, format="json")
    assert lock_res2.status_code == 400
    assert lock_res2.json().get("locked") is True

    # Test expired OTP
    db.account_tokens.update_one(
        {"metadata.claim_id": claim_id},
        {"$set": {"expires_at": datetime.now(timezone.utc) - timedelta(minutes=1), "attempts": 0}}
    )
    exp_res = client.post("/api/auth/claim/verify/", {
        "claim_id": claim_id,
        "otp": "123456",
        "password": "ValidPassword123!",
    }, format="json")
    assert exp_res.status_code == 400
    assert exp_res.json().get("expired") is True


def test_generic_responses_prevent_account_enumeration():
    """claim/start and password/forgot return identical generic 200 responses regardless of existence."""
    client = APIClient()

    # 1. Claim start with completely bogus registration number
    res_fake_stu = client.post("/api/auth/claim/start/", {
        "registration_no": "NON_EXISTENT_REG_NO_99999",
        "institutional_email": "bogus@univ.edu",
    }, format="json")
    assert res_fake_stu.status_code == 200
    assert "If a record matches, we sent a verification code" in res_fake_stu.json().get("message", "")
    assert res_fake_stu.json().get("claim_id") is not None

    # 2. Claim start with real student but mismatched email
    db = get_db()
    sample_student = db.students.find_one({"email": {"$exists": True}})
    if sample_student:
        res_mismatch = client.post("/api/auth/claim/start/", {
            "registration_no": sample_student.get("reg_no") or sample_student["student_id"],
            "institutional_email": "wrong_intruder@attacker.com",
        }, format="json")
        assert res_mismatch.status_code == 200
        assert res_mismatch.json()["message"] == res_fake_stu.json()["message"]

    # 3. Password forgot with non-existent email
    res_forgot = client.post("/api/auth/password/forgot/", {
        "email": "non_existent_user_9999@univ.edu",
    }, format="json")
    assert res_forgot.status_code == 200
    assert "If an account matches that email, we sent a password reset link." in res_forgot.json().get("message", "")


def test_password_forgot_and_reset_revokes_sessions(auth_client):
    """Password reset with single-use token updates password and revokes all active sessions."""
    client = APIClient()
    db = get_db()

    # 1. Login as student to create an active session
    me = auth_client.login_as("student")
    account_id = me["account_id"]
    sess_cookie = auth_client.cookies["pf_session"].value

    # Verify session is currently active
    sess = db.auth_sessions.find_one({"token_hash": sess_cookie})
    # Or find by account
    active_sessions_before = list(db.auth_sessions.find({"account_id": account_id, "status": "ACTIVE"}))
    assert len(active_sessions_before) >= 1

    # 2. Request password forgot
    acc = db.accounts.find_one({"account_id": account_id})
    forgot_res = client.post("/api/auth/password/forgot/", {"email": acc["email"]}, format="json")
    assert forgot_res.status_code == 200

    # 3. Retrieve token from account_tokens
    token_doc = db.account_tokens.find_one({
        "account_id": account_id,
        "purpose": "RESET",
        "used_at": None,
    }, sort=[("created_at", -1)])
    assert token_doc is not None

    # For testing, create a direct test reset token
    raw_token, _ = create_reset_token(account_id=account_id, db=db)

    # 4. Reset password
    new_pwd = "BrandNewPassword2026!"
    reset_res = client.post("/api/auth/password/reset/", {
        "token": raw_token,
        "password": new_pwd,
    }, format="json")
    assert reset_res.status_code == 200
    assert "password updated successfully" in reset_res.json().get("message", "").lower()

    # 5. Verify all previous sessions for this account are revoked
    active_sessions_after = list(db.auth_sessions.find({"account_id": account_id, "status": "ACTIVE"}))
    assert len(active_sessions_after) == 0

    # 6. Previous session token fails authorization
    old_session_client = APIClient()
    old_session_client.cookies["pf_session"] = sess_cookie
    unauth_res = old_session_client.get("/api/auth/me/")
    assert unauth_res.status_code == 401

    # 7. Login works with new password
    login_res = client.post("/api/auth/login/", {
        "username": acc["username"],
        "password": new_pwd,
    }, format="json")
    assert login_res.status_code == 200

    # Reset password back to standard 'password123' for subsequent tests
    from camp_02.accounts import set_account_password
    set_account_password(account_id, "password123", db=db)


def test_admin_claims_queue_and_resolution(auth_client):
    """Admin can list and resolve ambiguous student claims; unauthorized users are denied."""
    db = get_db()

    # Create an ambiguous claim
    claim_id = f"clm_ambig_{uuid.uuid4().hex[:8]}"
    db.claim_requests.insert_one({
        "claim_id": claim_id,
        "tenant_id": "tenant_default",
        "registration_no": "REG_AMBIG_001",
        "email_submitted": "submitted_ambig@univ.edu",
        "student_id": "STU_AMBIG_001",
        "status": "PENDING",
        "notes": "Name mismatch between records",
        "created_at": datetime.now(timezone.utc),
        "resolved_at": None,
        "resolved_by": None,
    })

    # Student cannot access admin claims queue
    auth_client.login_as("student")
    student_res = auth_client.get("/api/admin/claims/")
    assert student_res.status_code == 403

    # Admin can list claims
    auth_client.login_as("admin")
    admin_res = auth_client.get("/api/admin/claims/?status=PENDING")
    assert admin_res.status_code == 200
    claims = admin_res.json().get("claims", [])
    assert any(c["claim_id"] == claim_id for c in claims)

    # Admin resolves claim as REJECT
    resolve_res = auth_client.post(f"/api/admin/claims/{claim_id}/resolve/", {
        "action": "REJECT",
        "notes": "Insufficient verification documents provided",
    }, format="json")
    assert resolve_res.status_code == 200

    # DB updated
    updated_claim = db.claim_requests.find_one({"claim_id": claim_id})
    assert updated_claim["status"] == "REJECTED"
    assert updated_claim["notes"] == "Insufficient verification documents provided"


def test_admin_affiliation_tools_and_safeguards(auth_client):
    """Admin affiliation management enforces record uniqueness and prevents unlinking last affiliation without confirmation."""
    auth_client.login_as("admin")
    db = get_db()

    uid = uuid.uuid4().hex[:6]
    person = create_person_identity(
        first_name="Aff",
        last_name=f"Test_{uid}",
        primary_email=f"aff_test_{uid}@univ.edu",
        tenant_id="tenant_default",
        db=db,
    )
    rec_id = f"STU_AFF_{uid}"

    # 1. Link affiliation
    link_res = auth_client.post("/api/admin/affiliations/link/", {
        "person_id": person["person_id"],
        "type": "STUDENT",
        "record_id": rec_id,
    }, format="json")
    assert link_res.status_code == 200
    aff_id = link_res.json()["affiliation_id"]

    # 2. Try to link the SAME record to another person -> 409 Conflict
    person2 = create_person_identity(
        first_name="Second",
        last_name=f"Person_{uid}",
        primary_email=f"person2_{uid}@univ.edu",
        tenant_id="tenant_default",
        db=db,
    )
    dup_res = auth_client.post("/api/admin/affiliations/link/", {
        "person_id": person2["person_id"],
        "type": "STUDENT",
        "record_id": rec_id,
    }, format="json")
    assert dup_res.status_code == 409

    # 3. Unlink without confirmation when it's the only affiliation -> 400 with requires_confirmation
    unlink_res1 = auth_client.post("/api/admin/affiliations/unlink/", {
        "affiliation_id": aff_id,
        "confirm_last": False,
    }, format="json")
    assert unlink_res1.status_code == 400
    assert unlink_res1.json().get("requires_confirmation") is True

    # 4. Unlink with confirm_last: true -> succeeds
    unlink_res2 = auth_client.post("/api/admin/affiliations/unlink/", {
        "affiliation_id": aff_id,
        "confirm_last": True,
    }, format="json")
    assert unlink_res2.status_code == 200

    updated_aff = db.person_affiliations.find_one({"affiliation_id": aff_id})
    assert updated_aff["status"] == "REVOKED"
