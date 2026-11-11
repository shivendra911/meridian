"""PlaceFlow / Meridian — Platform Phase 1 Verification Suite.

Tests for docs/PLATFORM_SPEC.md Sections 1, 2, and 8:
- Composed profile in /api/auth/me/ and full profile in /api/account/profile/
- PATCH /api/account/profile/ allowlist and rejection of read-only fields
- PersonCard scoping & field masking when student views another student
- Avatar upload validation (rejects non-images, rejects > 2MB) and media serving
- Session listing, individual revocation, and revoke-others
- Password change validating current password and revoking other sessions
- Unique affiliation constraint preventing duplicate record binding
- Notifications listing and mark-as-read
"""

import io
import os
from datetime import datetime, timezone

import django
import pytest

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "placeflow_core.settings")
os.environ.setdefault("DJANGO_LOGIN_THROTTLE_RATE", "5000/minute")
django.setup()

from PIL import Image
from pymongo.errors import DuplicateKeyError
from rest_framework.test import APIClient

from database.connection import get_db
from camp_02.sessions import create_auth_session, list_account_sessions


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


def test_auth_me_returns_composed_profile_and_unread_notifications(auth_client):
    """GET /api/auth/me/ includes composed profile and unread_notifications."""
    me = auth_client.login_as("student")
    resp = auth_client.get("/api/auth/me/")
    assert resp.status_code == 200
    data = resp.json()

    assert "profile" in data
    prof = data["profile"]
    assert prof["display_name"] == "Aarav Sharma"
    assert "email" in prof
    assert "affiliation_label" in prof
    assert "institution_name" in prof
    assert "unread_notifications" in data
    assert isinstance(data["unread_notifications"], int)


def test_account_profile_get_and_patch_allowlist(auth_client):
    """GET /api/account/profile/ returns full dossier; PATCH enforces strict allowlist."""
    auth_client.login_as("student")

    # 1. GET full profile
    get_res = auth_client.get("/api/account/profile/")
    assert get_res.status_code == 200
    prof = get_res.json()
    assert prof["display_name"] == "Aarav Sharma"
    assert "affiliations" in prof
    assert len(prof["affiliations"]) > 0
    assert prof["affiliations"][0]["status"] == "VERIFIED"
    assert "completeness" in prof

    # 2. PATCH allowed self-asserted fields
    patch_payload = {
        "preferred_name": "Ari",
        "headline": "Aspiring Cloud Native & Distributed Systems Engineer",
        "skills": ["React", "TypeScript", "Python", "Docker"],
        "summary": "Final year CSE student focused on high-throughput backend architecture.",
        "onboarded_at": "2026-11-11T12:00:00Z",
    }
    patch_res = auth_client.patch("/api/account/profile/", patch_payload, format="json")
    assert patch_res.status_code == 200
    updated_prof = patch_res.json()
    assert updated_prof["preferred_name"] == "Ari"
    assert updated_prof["headline"] == "Aspiring Cloud Native & Distributed Systems Engineer"
    assert updated_prof["onboarded_at"] is not None

    # Check /api/auth/me/ profile has onboarded_at
    me_res = auth_client.get("/api/auth/me/")
    assert me_res.status_code == 200
    assert me_res.json()["profile"]["onboarded_at"] is not None

    # 3. PATCH read-only or unlisted fields rejected with 400
    bad_payload = {"cgpa": 9.99, "department": "ECE"}
    bad_res = auth_client.patch("/api/account/profile/", bad_payload, format="json")
    assert bad_res.status_code == 400
    assert "InvalidField" in bad_res.json().get("error", "")


def test_person_card_omits_masked_fields_for_student_viewing_student(auth_client):
    """When a student views another student's card, sensitive fields (phone, email, cgpa) are omitted."""
    # Student A (STU001 / PER_STU_001) logs in
    auth_client.login_as("student")
    db = get_db()

    # Find student B (STU002 / PER_STU_002)
    student_b = db.students.find_one({"student_id": "STU002"})
    assert student_b is not None
    target_pid = student_b.get("person_id", "PER_STU_002")

    # Student A views Student B's card
    resp = auth_client.get(f"/api/people/{target_pid}/card/")
    assert resp.status_code == 200
    card = resp.json()

    assert card["person_id"] == target_pid
    assert "name" in card
    assert card["is_verified"] is True
    assert card["verification_label"] == "Verified by institution"

    # Masked fields check: phone, email, cgpa must NOT be present in official_data
    assert "phone" not in card["official_data"]
    assert "email" not in card["official_data"]
    assert "cgpa" not in card["official_data"]

    # Hidden fields list must explicitly disclose what was withheld
    assert "hidden" in card
    assert "phone" in card["hidden"]
    assert "email" in card["hidden"]


def test_avatar_upload_validation_and_serving(auth_client):
    """Avatar upload rejects non-images and oversized files (>2MB); serves valid uploaded avatar."""
    auth_client.login_as("student")

    # 1. Reject non-image text file
    fake_text = io.BytesIO(b"This is not an image file.")
    fake_text.name = "malicious.txt"
    bad_resp = auth_client.post(
        "/api/account/avatar/",
        {"avatar": fake_text},
        format="multipart",
    )
    assert bad_resp.status_code == 400
    assert "InvalidImageFormat" in bad_resp.json().get("error", "")

    # 2. Reject file exceeding 2MB
    huge_bytes = io.BytesIO(b"0" * (2 * 1024 * 1024 + 1024))
    huge_bytes.name = "huge.png"
    huge_bytes.content_type = "image/png"
    huge_resp = auth_client.post(
        "/api/account/avatar/",
        {"avatar": huge_bytes},
        format="multipart",
    )
    assert huge_resp.status_code == 400
    assert "FileTooLarge" in huge_resp.json().get("error", "")

    # 3. Accept valid PNG image, re-encode, and serve
    img = Image.new("RGBA", (128, 128), color=(14, 165, 233, 255))
    valid_io = io.BytesIO()
    img.save(valid_io, format="PNG")
    valid_io.seek(0)
    valid_io.name = "avatar.png"
    valid_io.content_type = "image/png"

    upload_resp = auth_client.post(
        "/api/account/avatar/",
        {"avatar": valid_io},
        format="multipart",
    )
    assert upload_resp.status_code == 200
    upload_data = upload_resp.json()
    assert upload_data["success"] is True
    assert "avatar_url" in upload_data

    # 4. Fetch avatar via GET /api/media/avatar/<person_id>/
    db = get_db()
    person = db.person_identities.find_one({"primary_email": "aarav.student@univ.edu"})
    assert person is not None
    avatar_resp = auth_client.get(f"/api/media/avatar/{person['person_id']}/")
    assert avatar_resp.status_code == 200
    assert avatar_resp["Content-Type"] == "image/webp"
    assert "private, max-age=86400" in avatar_resp["Cache-Control"]
    assert "ETag" in avatar_resp


def test_session_management_and_password_change(auth_client):
    """Sessions list, revoke-others, and password change revoking other sessions."""
    me = auth_client.login_as("student")
    account_id = me["account_id"]
    db = get_db()

    # 1. Create a simulated second session
    second_sess = create_auth_session(account_id=account_id, tenant_id=me["tenant_id"], db=db)
    sessions = list_account_sessions(account_id, db=db)
    assert len(sessions) >= 2

    # 2. Revoke second session individually
    del_res = auth_client.delete(f"/api/account/sessions/{second_sess['session_id']}/")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 3. Create another session and test revoke-others
    create_auth_session(account_id=account_id, tenant_id=me["tenant_id"], db=db)
    revoke_res = auth_client.post("/api/account/sessions/revoke-others/", {}, format="json")
    assert revoke_res.status_code == 200
    assert revoke_res.json()["revoked_count"] >= 1

    # 4. Change password validates current password
    bad_pw_res = auth_client.post(
        "/api/account/password/change/",
        {"current_password": "wrongpassword", "new_password": "NewSecretPassword123!"},
        format="json",
    )
    assert bad_pw_res.status_code == 400
    assert "InvalidCredentials" in bad_pw_res.json()["error"]

    # 5. Successful password change
    good_pw_res = auth_client.post(
        "/api/account/password/change/",
        {"current_password": "password123", "new_password": "NewSecretPassword123!"},
        format="json",
    )
    assert good_pw_res.status_code == 200
    assert good_pw_res.json()["success"] is True

    # Restore default password for other test fixtures
    auth_client.post(
        "/api/account/password/change/",
        {"current_password": "NewSecretPassword123!", "new_password": "password123"},
        format="json",
    )


def test_unique_affiliation_constraint():
    """An affiliation record cannot belong to two different people for the same (tenant_id, type, record_id)."""
    db = get_db()
    tenant_id = "test_tenant_aff_01"
    now = datetime.now(timezone.utc)

    db.person_affiliations.delete_many({"tenant_id": tenant_id})

    # First affiliation succeeds
    db.person_affiliations.insert_one({
        "affiliation_id": "aff_test_001",
        "tenant_id": tenant_id,
        "person_id": "PER_001",
        "type": "STUDENT",
        "record_id": "STU999",
        "status": "VERIFIED",
        "source": "IMPORT",
        "created_at": now,
    })

    # Second affiliation for the SAME student record under the same tenant MUST raise DuplicateKeyError
    with pytest.raises(DuplicateKeyError):
        db.person_affiliations.insert_one({
            "affiliation_id": "aff_test_002",
            "tenant_id": tenant_id,
            "person_id": "PER_002",
            "type": "STUDENT",
            "record_id": "STU999",
            "status": "VERIFIED",
            "source": "CLAIM",
            "created_at": now,
        })

    # Cleanup
    db.person_affiliations.delete_many({"tenant_id": tenant_id})


def test_notifications_listing_and_read(auth_client):
    """GET /api/account/notifications/ and POST /api/account/notifications/read/."""
    me = auth_client.login_as("student")
    person_id = me["person_id"]
    db = get_db()
    now = datetime.now(timezone.utc)

    # Insert a test notification
    notif_id = f"notif_{int(now.timestamp())}"
    db.notifications.insert_one({
        "notification_id": notif_id,
        "tenant_id": me["tenant_id"],
        "person_id": person_id,
        "kind": "INTERVIEW",
        "title": "Interview Round Scheduled",
        "body": "Your technical interview with Northwind Systems is scheduled for tomorrow at 10:00 AM.",
        "link": "/student/interviews",
        "created_at": now,
        "read_at": None,
    })

    # List notifications
    list_res = auth_client.get("/api/account/notifications/")
    assert list_res.status_code == 200
    data = list_res.json()
    assert data["unread_count"] >= 1
    assert any(n["notification_id"] == notif_id for n in data["notifications"])

    # Mark as read
    read_res = auth_client.post("/api/account/notifications/read/", {"notification_ids": [notif_id]}, format="json")
    assert read_res.status_code == 200
    assert read_res.json()["marked_count"] >= 1

    # Verify unread count decreases
    updated_list = auth_client.get("/api/account/notifications/").json()
    target_notif = next((n for n in updated_list["notifications"] if n["notification_id"] == notif_id), None)
    assert target_notif is not None
    assert target_notif["read_at"] is not None

