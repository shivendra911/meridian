"""Tests for CAMP-02 Sub-Phase 2.4:
Session Security, Cohort Ingestion Pipelines, and REST API Endpoints.
"""

from datetime import datetime, timezone
import pytest
from database.connection import get_db
from camp_01.tenants import create_tenant
from camp_01.institutions import create_institution
from camp_02.identities import create_person_identity
from camp_02.accounts import create_account
from camp_02.memberships import create_institutional_membership
from camp_02.roles import seed_baseline_roles, get_role_by_id
from camp_02.permissions import seed_permission_catalogue
from camp_02.assignments import assign_role
from camp_02.sessions import create_auth_session, validate_session, revoke_session, revoke_all_account_sessions
from camp_02.provisioning import ingest_student_cohort


@pytest.fixture
def session_fixture():
    db = get_db()
    for coll in [
        "platform_tenants", "institutions", "person_identities", "accounts",
        "institution_memberships", "roles", "role_assignments", "auth_sessions"
    ]:
        db[coll].delete_many({})

    seed_permission_catalogue(db)
    seed_baseline_roles(db)

    t = create_tenant("Session Uni", "session-uni", "ENTERPRISE", "admin@sess.edu", db=db)
    inst = create_institution(
        tenant_id=t["id"],
        institution_code="INST_SESS",
        legal_name="Session Institute",
        display_name="SI",
        institution_type="CENTRAL_UNIVERSITY",
        classifications={
            "institution_kind": "UNIVERSITY",
            "ownership": "CENTRAL_GOVERNMENT",
            "governance": "PUBLIC",
            "recognition_status": "RECOGNIZED",
            "institutional_role": "DEGREE_AWARDING",
            "delivery_model": "PHYSICAL",
        },
        db=db,
    )

    p = create_person_identity("dev@sess.edu", "Dev", "Patel", db=db)
    acc = create_account(person_id=p["person_id"], email="dev@sess.edu", db=db)
    mem = create_institutional_membership(t["id"], inst["institution_id"], p["person_id"], acc["account_id"], "STUDENT", db=db)

    return {"db": db, "tenant": t, "institution": inst, "person": p, "account": acc, "membership": mem}


def test_session_lifecycle_and_invalidation(session_fixture):
    db = session_fixture["db"]
    t = session_fixture["tenant"]
    acc = session_fixture["account"]

    # 1. Create active session
    s1 = create_auth_session(
        account_id=acc["account_id"],
        tenant_id=t["id"],
        device_fingerprint="fp_macbook_m3_chrome",
        ip_address="192.168.1.100",
        user_agent="Mozilla/5.0 PlaceFlow Client",
        db=db,
    )
    raw_token_1 = s1["raw_token"]
    assert raw_token_1.startswith("sess_")
    assert s1["status"] == "ACTIVE"

    # 2. Validate token
    val = validate_session(raw_token_1, db=db)
    assert val is not None
    assert val["session_id"] == s1["session_id"]

    # 3. Create second session (e.g. mobile app)
    s2 = create_auth_session(account_id=acc["account_id"], tenant_id=t["id"], db=db)

    # 4. Invalidate single session (logout)
    rev_ok = revoke_session(s1["session_id"], reason="user_logout", db=db)
    assert rev_ok is True
    assert validate_session(raw_token_1, db=db) is None
    assert validate_session(s2["raw_token"], db=db) is not None

    # 5. Password reset -> Invalidate all account sessions
    count_revoked = revoke_all_account_sessions(acc["account_id"], reason="password_reset", db=db)
    assert count_revoked >= 1
    assert validate_session(s2["raw_token"], db=db) is None


def test_bulk_student_cohort_provisioning(session_fixture):
    db = session_fixture["db"]
    t = session_fixture["tenant"]
    inst = session_fixture["institution"]

    cohort = [
        {
            "email": "kavita.sen@iit.edu",
            "first_name": "Kavita",
            "last_name": "Sen",
            "roll_number": "22B030099",
            "date_of_birth": "2004-03-21",
            "gender": "FEMALE",
            "apaar_id": "999888777666",
        },
        {
            "email": "rahul.nair@iit.edu",
            "first_name": "Rahul",
            "last_name": "Nair",
            "roll_number": "22B030100",
            "date_of_birth": "2004-05-11",
            "gender": "MALE",
            "apaar_id": "999888777665",
        },
    ]

    res = ingest_student_cohort(
        tenant_id=t["id"],
        institution_id=inst["institution_id"],
        student_records=cohort,
        db=db,
    )

    assert res["total_records"] == 2
    assert res["success_count"] == 2
    assert res["failed_count"] == 0

    # Verify student member role binding exists at SELF scope
    p = db.person_identities.find_one({"primary_email": "kavita.sen@iit.edu"})
    assert p is not None
    assert p["national_identifiers"][0]["identifier_value"] == "999888777666"

    m = db.institution_memberships.find_one({"person_id": p["person_id"], "tenant_id": t["id"]})
    assert m is not None
    assert m["membership_type"] == "STUDENT"

    asgn = db.role_assignments.find_one({"membership_id": m["membership_id"]})
    assert asgn is not None
    assert asgn["scope_type"] == "SELF"
    assert asgn["scope_id"] == p["person_id"]

