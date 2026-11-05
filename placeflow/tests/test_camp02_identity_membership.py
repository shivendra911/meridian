"""Automated Test Suite for CAMP-02 Sub-Phase 2.1: Identity Registry & Institutional Membership.

Verifies the 5 Decoupling Invariants:
1. Person Identity != Account != Membership
2. APAAR/ABC ID, PAN, Aadhaar hash validation & uniqueness
3. PBKDF2 HMAC SHA-256 account credentials & brute-force lockouts
4. Service Account API key generation (ag_live_...) for autonomous AI agents
5. Multi-institution membership isolation & state transitions
"""

from datetime import datetime, timezone
import pytest

from camp_01.tenants import create_tenant
from camp_01.institutions import create_institution
from camp_01.schemas import apply_camp01_foundation_schemas
from camp_02.schemas import setup_camp02_collections
from camp_02.identities import (
    create_person_identity,
    add_national_identifier,
    merge_person_identities,
    get_person_by_id,
    find_persons_by_national_id,
    DuplicateIdentifierError,
    DuplicatePersonError,
    IdentityValidationError,
)
from camp_02.accounts import (
    create_account,
    set_account_password,
    authenticate_account_credentials,
    create_service_account_api_key,
    authenticate_api_key,
    revoke_api_key,
    transition_account_status,
    AccountNotFoundError,
    AccountLockedError,
    AccountSuspendedError,
    InvalidCredentialError,
)
from camp_02.memberships import (
    create_institutional_membership,
    transition_membership_status,
    get_membership_by_id,
    list_memberships_for_person,
    list_institution_members,
    DuplicateMembershipError,
    InvalidMembershipStateTransitionError,
)
from database.connection import get_db


@pytest.fixture
def setup_camp02_db():
    db = get_db()
    apply_camp01_foundation_schemas(db)
    setup_camp02_collections(db)
    # Clear test fixtures
    db.person_identities.delete_many({"primary_email": {"$regex": "@test-camp02.edu"}})
    db.accounts.delete_many({"email": {"$regex": "@test-camp02.edu"}})
    db.account_credentials.delete_many({})
    db.platform_tenants.delete_many({"slug": {"$in": ["iitb-test", "du-test"]}})
    db.institutions.delete_many({"institution_code": {"$in": ["IITB_TST", "DU_TST"]}})
    db.institution_memberships.delete_many({})
    yield db


def test_person_identity_creation_and_national_ids(setup_camp02_db):
    db = setup_camp02_db

    # 1. Create Person Identity
    person = create_person_identity(
        legal_first_name="Priyanshu",
        legal_last_name="Sharma",
        primary_email="priyanshu.sharma@test-camp02.edu",
        date_of_birth="2002-08-15",
        gender="MALE",
        primary_phone="+919876543210",
        db=db,
    )
    assert person["person_id"] is not None
    assert person["primary_email"] == "priyanshu.sharma@test-camp02.edu"
    assert person["status"] == "ACTIVE"

    # 2. Add Valid APAAR / ABC ID (12 digits)
    p_updated = add_national_identifier(
        person_id=person["person_id"],
        scheme="APAAR",
        value="123456789012",
        issuer="Ministry of Education, GoI",
        is_verified=True,
        db=db,
    )
    assert len(p_updated["national_identifiers"]) == 1
    assert p_updated["national_identifiers"][0]["scheme"] == "APAAR"
    assert p_updated["national_identifiers"][0]["value"] == "123456789012"

    # 3. Add Valid PAN (5 letters, 4 digits, 1 letter)
    p_updated2 = add_national_identifier(
        person_id=person["person_id"],
        scheme="PAN",
        value="ABCDE1234F",
        issuer="Income Tax Department",
        is_verified=True,
        db=db,
    )
    assert len(p_updated2["national_identifiers"]) == 2

    # 4. Invalid APAAR (not 12 digits) must fail validation
    with pytest.raises(IdentityValidationError):
        add_national_identifier(
            person_id=person["person_id"],
            scheme="APAAR",
            value="12345",  # Too short
            db=db,
        )

    # 5. Invalid PAN must fail validation
    with pytest.raises(IdentityValidationError):
        add_national_identifier(
            person_id=person["person_id"],
            scheme="PAN",
            value="INVALID_PAN",
            db=db,
        )

    # 6. Duplicate APAAR ID on another person must be rejected
    person2 = create_person_identity(
        legal_first_name="Aarav",
        legal_last_name="Verma",
        primary_email="aarav.verma@test-camp02.edu",
        date_of_birth="2001-05-10",
        gender="MALE",
        db=db,
    )
    with pytest.raises(DuplicateIdentifierError):
        add_national_identifier(
            person_id=person2["person_id"],
            scheme="APAAR",
            value="123456789012",  # Collision!
            db=db,
        )


def test_person_identity_merging(setup_camp02_db):
    db = setup_camp02_db

    # Create two duplicate profiles for same human
    p_canonical = create_person_identity(
        legal_first_name="Rohan",
        legal_last_name="Gupta",
        primary_email="rohan.gupta@test-camp02.edu",
        date_of_birth="2000-01-01",
        gender="MALE",
        db=db,
    )
    p_duplicate = create_person_identity(
        legal_first_name="Rohan",
        legal_last_name="Gupta",
        primary_email="rohan.alt@test-camp02.edu",
        date_of_birth="2000-01-01",
        gender="MALE",
        db=db,
    )

    add_national_identifier(p_duplicate["person_id"], "PAN", "XYZPK9876Q", db=db)

    # Merge duplicate into canonical
    merged = merge_person_identities(
        target_person_id=p_canonical["person_id"],
        source_person_id=p_duplicate["person_id"],
        reason="Deduplication of duplicate student profile",
        operator_id="admin-user",
        db=db,
    )

    assert merged["person_id"] == p_canonical["person_id"]
    # Check that identifiers were moved to canonical
    schemes = [nid["scheme"] for nid in merged["national_identifiers"]]
    assert "PAN" in schemes

    # Source person must now be marked MERGED
    p_source = get_person_by_id(p_duplicate["person_id"], db=db)
    assert p_source["status"] == "MERGED"
    assert p_source["merged_into_person_id"] == p_canonical["person_id"]


def test_account_creation_and_credential_authentication(setup_camp02_db):
    db = setup_camp02_db

    person = create_person_identity(
        legal_first_name="Ananya",
        legal_last_name="Iyer",
        primary_email="ananya.iyer@test-camp02.edu",
        date_of_birth="2003-03-20",
        gender="FEMALE",
        db=db,
    )

    # 1. Create Login Account
    account = create_account(
        person_id=person["person_id"],
        primary_email="ananya.iyer@test-camp02.edu",
        account_type="HUMAN",
        db=db,
    )
    assert account["account_id"] is not None
    assert account["status"] == "ACTIVE"

    # 2. Set PBKDF2 Password
    set_account_password(account["account_id"], "StrongSecret@2026", db=db)

    # 3. Authenticate with correct password -> Success
    auth_result = authenticate_account_credentials(
        "ananya.iyer@test-camp02.edu",
        "StrongSecret@2026",
        db=db,
    )
    assert auth_result["account_id"] == account["account_id"]

    # 4. Wrong password -> InvalidCredentialError & increment failed attempts (attempt 1)
    with pytest.raises(InvalidCredentialError):
        authenticate_account_credentials("ananya.iyer@test-camp02.edu", "WrongPassword", db=db)

    # 5. Brute-force lockout test: attempts 2, 3, 4 raise InvalidCredentialError
    for _ in range(3):
        with pytest.raises(InvalidCredentialError):
            authenticate_account_credentials("ananya.iyer@test-camp02.edu", "WrongPassword", db=db)

    # Attempt 5 -> AccountLockedError (maximum 5 attempts reached)
    with pytest.raises(AccountLockedError):
        authenticate_account_credentials("ananya.iyer@test-camp02.edu", "WrongPassword", db=db)


def test_service_account_api_key_lifecycle(setup_camp02_db):
    db = setup_camp02_db

    # Create Service Account (AI Agent Runner AG-01)
    svc_acc = create_account(
        person_id=None,  # Decoupled: Service accounts have NO human person
        primary_email="copilot-ag01@test-camp02.edu",
        account_type="SERVICE",
        db=db,
    )
    assert svc_acc["account_type"] == "SERVICE"

    # Issue API Key
    key_info = create_service_account_api_key(
        account_id=svc_acc["account_id"],
        name="AG-01 Autonomous Scheduler Key",
        scopes=["AGENT_EXECUTE", "PLACEMENT_READ"],
        db=db,
    )
    plaintext_key = key_info["api_key"]
    assert plaintext_key.startswith("ag_live_")

    # Authenticate via API Key
    auth_acc = authenticate_api_key(plaintext_key, db=db)
    assert auth_acc["account_id"] == svc_acc["account_id"]

    # Revoke API Key
    revoke_api_key(key_info["key_id"], reason="Key rotation", db=db)

    with pytest.raises(InvalidCredentialError):
        authenticate_api_key(plaintext_key, db=db)


def test_institutional_membership_isolation_and_uniqueness(setup_camp02_db):
    db = setup_camp02_db

    # Create 2 institutional tenants
    t1 = create_tenant(name="IITB Test", slug="iitb-test", customer_type="ENTERPRISE", admin_email="t1@test-camp02.edu", db=db)
    inst1 = create_institution(
        tenant_id=t1["id"],
        institution_code="IITB_TST",
        legal_name="IITB Test Inst",
        display_name="IITB Test",
        institution_type="INSTITUTE_OF_NATIONAL_IMPORTANCE",
        classifications={
            "institution_kind": "INSTITUTE",
            "ownership": "CENTRAL_GOVERNMENT",
            "governance": "PUBLIC",
            "recognition_status": "RECOGNIZED",
            "institutional_role": "DEGREE_AWARDING",
            "delivery_model": "PHYSICAL",
        },
        db=db,
    )

    t2 = create_tenant(name="DU Test", slug="du-test", customer_type="STATE_UNIVERSITY", admin_email="t2@test-camp02.edu", db=db)
    inst2 = create_institution(
        tenant_id=t2["id"],
        institution_code="DU_TST",
        legal_name="DU Test Inst",
        display_name="DU Test",
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

    person = create_person_identity(
        legal_first_name="Priyanshu",
        legal_last_name="Sharma",
        primary_email="priyanshu.multi@test-camp02.edu",
        date_of_birth="2002-08-15",
        gender="MALE",
        db=db,
    )
    account = create_account(
        person_id=person["person_id"],
        primary_email="priyanshu.multi@test-camp02.edu",
        db=db,
    )

    # 1. Create Student Membership at IITB
    m1 = create_institutional_membership(
        tenant_id=t1["id"],
        institution_id=inst1["institution_id"],
        person_id=person["person_id"],
        account_id=account["account_id"],
        membership_type="STUDENT",
        member_number="22B030015",
        db=db,
    )
    assert m1["membership_id"] is not None
    assert m1["status"] == "ACTIVE"

    # 2. Duplicate STUDENT membership at same institution must be rejected
    with pytest.raises(DuplicateMembershipError):
        create_institutional_membership(
            tenant_id=t1["id"],
            institution_id=inst1["institution_id"],
            person_id=person["person_id"],
            account_id=account["account_id"],
            membership_type="STUDENT",
            db=db,
        )

    # 3. Same person can hold ALUMNI membership at DU (Multi-institution Decoupling!)
    m2 = create_institutional_membership(
        tenant_id=t2["id"],
        institution_id=inst2["institution_id"],
        person_id=person["person_id"],
        account_id=account["account_id"],
        membership_type="ALUMNI",
        member_number="DU-ALUM-99",
        db=db,
    )
    assert m2["membership_id"] is not None

    # Multi-membership lookup for the human person
    memberships = list_memberships_for_person(person["person_id"], db=db)
    assert len(memberships) == 2

    # 4. State transition test: ACTIVE -> SUSPENDED -> ACTIVE -> TERMINATED
    m1_susp = transition_membership_status(
        m1["membership_id"],
        new_status="SUSPENDED",
        reason="Disciplinary review pending",
        changed_by="dean_office",
        db=db,
    )
    assert m1_susp["status"] == "SUSPENDED"

    m1_act = transition_membership_status(
        m1["membership_id"],
        new_status="ACTIVE",
        reason="Reinstated after review",
        changed_by="dean_office",
        db=db,
    )
    assert m1_act["status"] == "ACTIVE"

    m1_term = transition_membership_status(
        m1["membership_id"],
        new_status="TERMINATED",
        reason="Graduated and exited",
        changed_by="dean_office",
        db=db,
    )
    assert m1_term["status"] == "TERMINATED"

    # TERMINATED is terminal state: cannot transition out
    with pytest.raises(InvalidMembershipStateTransitionError):
        transition_membership_status(
            m1["membership_id"],
            new_status="ACTIVE",
            reason="Illegal attempt to reactivate terminated membership",
            db=db,
        )
