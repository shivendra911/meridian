"""
test_notifications_producers.py — End-to-end tests for notification producers & account notification views.
"""

import pytest
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "placeflow_core.settings")
django.setup()

from datetime import datetime, timezone
from rest_framework.test import APIClient
from database.connection import get_db
from camp_02.notify import notify, get_person_id_for_student, get_tpo_person_ids
from camp_02.identities import create_person_identity
from camp_02.accounts import create_account, set_account_password
from camp_02.sessions import create_auth_session


@pytest.fixture
def db():
    return get_db()


@pytest.fixture
def clean_notifications(db):
    db.person_identities.delete_many({"primary_email": {"$regex": "@test-notif.edu"}})
    db.accounts.delete_many({"email": {"$regex": "@test-notif.edu"}})
    db.notifications.delete_many({"tenant_id": "test_tenant_notif"})
    yield
    db.person_identities.delete_many({"primary_email": {"$regex": "@test-notif.edu"}})
    db.accounts.delete_many({"email": {"$regex": "@test-notif.edu"}})
    db.notifications.delete_many({"tenant_id": "test_tenant_notif"})


def test_notify_producer_creates_document(db, clean_notifications):
    pid = "per_test_notif_001"
    doc = notify(
        person_id=pid,
        kind="SYSTEM",
        title="Test Notice",
        body="This is a test notification body.",
        link="/student/home",
        tenant_id="test_tenant_notif",
        db=db,
    )
    assert doc is not None
    assert doc["person_id"] == pid
    assert doc["kind"] == "SYSTEM"
    assert doc["title"] == "Test Notice"
    assert doc["read_at"] is None

    found = db.notifications.find_one({"notification_id": doc["notification_id"]})
    assert found is not None
    assert found["body"] == "This is a test notification body."


def test_student_and_tpo_person_resolvers(db):
    # Verify existing demo student resolves to person_id
    resolved_pid = get_person_id_for_student("STU001", db=db)
    assert resolved_pid == "PER_STU_001"

    # Fallback resolver when not in students
    fallback_pid = get_person_id_for_student("STU99999", db=db)
    assert fallback_pid == "per_stu99999"


def test_account_notifications_api(db, clean_notifications):
    tenant_id = "test_tenant_notif"

    person = create_person_identity(
        primary_email="notifuser@test-notif.edu",
        first_name="Notif",
        last_name="Tester",
        tenant_id=tenant_id,
        db=db,
    )
    person_id = person["person_id"]

    account = create_account(
        person_id=person_id,
        username="notifuser_test",
        email="notifuser@test-notif.edu",
        tenant_id=tenant_id,
        db=db,
    )
    account_id = account["account_id"]

    # Produce 2 unread notifications
    n1 = notify(person_id, "DRIVE", "Drive Published", "Google Drive Open", link="/student/drives", tenant_id=tenant_id, db=db)
    n2 = notify(person_id, "INTERVIEW", "Interview Round", "Slot Confirmed", link="/student/interviews", tenant_id=tenant_id, db=db)

    sess = create_auth_session(
        account_id=account_id,
        user_agent="pytest-client",
        ip_address="127.0.0.1",
        tenant_id=tenant_id,
        db=db,
    )
    tok = sess["raw_token"]

    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tok}")

    # 1. Get notifications
    resp = client.get("/api/account/notifications/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["unread_count"] >= 2
    titles = [x["title"] for x in data["notifications"]]
    assert "Drive Published" in titles
    assert "Interview Round" in titles

    # 2. Mark single notification read
    resp_mark = client.post("/api/account/notifications/read/", {"notification_ids": [n1["notification_id"]]}, format="json")
    assert resp_mark.status_code == 200
    assert resp_mark.json()["success"] is True

    # Check unread count decreased
    resp2 = client.get("/api/account/notifications/")
    assert resp2.json()["unread_count"] == data["unread_count"] - 1

    # 3. Mark all read
    resp_all = client.post("/api/account/notifications/read/", {"all": True}, format="json")
    assert resp_all.status_code == 200
    assert resp_all.json()["success"] is True

    resp3 = client.get("/api/account/notifications/")
    assert resp3.json()["unread_count"] == 0


def test_password_change_emits_security_notification(db, clean_notifications):
    tenant_id = "test_tenant_notif"

    person = create_person_identity(
        primary_email="pwduser@test-notif.edu",
        first_name="Pwd",
        last_name="Tester",
        tenant_id=tenant_id,
        db=db,
    )
    person_id = person["person_id"]

    account = create_account(
        person_id=person_id,
        username="pwduser_test",
        email="pwduser@test-notif.edu",
        password="OldPassword123!",
        tenant_id=tenant_id,
        db=db,
    )
    account_id = account["account_id"]

    sess = create_auth_session(
        account_id=account_id,
        user_agent="pytest-client",
        ip_address="127.0.0.1",
        tenant_id=tenant_id,
        db=db,
    )
    tok = sess["raw_token"]

    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tok}")

    resp = client.post("/api/account/password/change/", {
        "current_password": "OldPassword123!",
        "new_password": "NewSecretPassword456!",
    })
    assert resp.status_code == 200
    assert resp.json()["success"] is True

    # Verify notification in DB
    notif = db.notifications.find_one({"person_id": person_id, "kind": "SECURITY"})
    assert notif is not None
    assert notif["title"] == "Password Changed"
    assert "updated" in notif["body"]
