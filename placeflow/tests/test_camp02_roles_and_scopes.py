"""Automated Test Suite for CAMP-02 Sub-Phase 2.2: Roles, Permissions & Contextual Scope Engine.

Verifies:
1. Central Permission Catalogue (60+ atomic permissions)
2. Versioned Role Definitions (Platform Baseline & Institution Custom)
3. Role Assignment Scope Ceilings & Temporal Validity
4. 5-Tier Scope Downward Inheritance & Zero Upward Inheritance
5. Immediate Authorization Invalidation on Role Revocation
"""

from datetime import datetime, timezone, timedelta
import pytest

from camp_01.tenants import create_tenant
from camp_01.institutions import create_institution
from camp_01.campuses import create_campus, associate_campus_with_institution
from camp_01.organization import create_organizational_unit, create_organizational_relation
from camp_02.schemas import setup_camp02_collections
from camp_02.identities import create_person_identity
from camp_02.accounts import create_account
from camp_02.permissions import seed_permission_catalogue, list_permissions, get_permission
from camp_02.roles import (
    seed_baseline_roles,
    create_institution_role,
    publish_role_version,
    get_role_by_id,
    get_role_permissions,
    RoleValidationError,
)
from camp_02.scopes import is_in_scope, get_descendant_unit_ids
from camp_02.assignments import (
    assign_role,
    revoke_role_assignment,
    list_active_role_assignments,
    get_effective_user_permissions,
    RoleAssignmentError,
)
from database.connection import get_db


@pytest.fixture
def setup_camp02_roles_db():
    db = get_db()
    setup_camp02_collections(db)
    # Clear test fixtures
    db.role_assignments.delete_many({})
    db.role_versions.delete_many({"role_id": {"$regex": "^role_cust_"}})
    db.roles.delete_many({"role_owner_type": "INSTITUTION"})
    db.accounts.delete_many({"email": {"$regex": "@roles-test.edu"}})
    db.person_identities.delete_many({"primary_email": {"$regex": "@roles-test.edu"}})
    db.platform_tenants.delete_many({"slug": "roles-tenant"})
    yield db


def test_permission_catalogue_seeding(setup_camp02_roles_db):
    db = setup_camp02_roles_db
    count = seed_permission_catalogue(db)
    assert count >= 40

    perms = list_permissions(db=db)
    assert len(perms) >= 40

    # Verify atomic keys exist
    p_drive = get_permission("placement.drive.publish", db=db)
    assert p_drive is not None
    assert p_drive["domain"] == "PLACEMENT"
    assert p_drive["action"] == "publish"

    p_pii = get_permission("placement.export.pii", db=db)
    assert p_pii is not None
    assert p_pii["domain"] == "PLACEMENT"


def test_baseline_and_custom_roles(setup_camp02_roles_db):
    db = setup_camp02_roles_db
    # Seed baseline roles
    seed_baseline_roles(db)

    # Verify baseline roles
    tpo_role = get_role_by_id("role_sys_tpo_admin", db=db)
    assert tpo_role["role_code"] == "TPO_ADMIN"
    assert tpo_role["current_version"] == 1

    tpo_perms = get_role_permissions("role_sys_tpo_admin", db=db)
    assert "placement.offer.approve" in tpo_perms
    assert "placement.policy.override" in tpo_perms

    # Create custom institution role
    cust_role = create_institution_role(
        tenant_id="ten_01",
        institution_id="inst_01",
        role_code="PLACEMENT_VOLUNTEER",
        role_name="Student Placement Volunteer",
        role_category="STUDENT",
        initial_permissions=["placement.application.view", "placement.interview.schedule"],
        max_allowed_scope="ORGANIZATIONAL_UNIT",
        created_by="head_tpo",
        db=db,
    )
    assert cust_role["role_code"] == "PLACEMENT_VOLUNTEER"
    assert cust_role["current_version"] == 1

    # Publish version 2 with expanded permissions
    v2 = publish_role_version(
        role_id=cust_role["role_id"],
        permissions=["placement.application.view", "placement.interview.schedule", "placement.superday.solve"],
        max_allowed_scope="ORGANIZATIONAL_UNIT",
        published_by="head_tpo",
        change_summary="Granted superday clash monitoring capability",
        db=db,
    )
    assert v2["version_number"] == 2

    # Check that role reflects new current version
    updated_role = get_role_by_id(cust_role["role_id"], db=db)
    assert updated_role["current_version"] == 2

    # Historical version 1 remains accessible and unchanged
    v1_perms = get_role_permissions(cust_role["role_id"], version_number=1, db=db)
    assert len(v1_perms) == 2
    assert "placement.superday.solve" not in v1_perms

    v2_perms = get_role_permissions(cust_role["role_id"], version_number=2, db=db)
    assert len(v2_perms) == 3
    assert "placement.superday.solve" in v2_perms


def test_role_assignment_and_scope_ceiling(setup_camp02_roles_db):
    db = setup_camp02_roles_db
    seed_baseline_roles(db)

    person = create_person_identity(
        first_name="Vikram",
        last_name="Malhotra",
        primary_email="vikram@roles-test.edu",
        db=db,
    )
    account = create_account(
        person_id=person["person_id"],
        email="vikram@roles-test.edu",
        db=db,
    )

    # DEPT_COORDINATOR has max_allowed_scope = ORGANIZATIONAL_UNIT
    dept_role = get_role_by_id("role_sys_dept_coordinator", db=db)

    # 1. Assigning within scope ceiling (ORGANIZATIONAL_UNIT) succeeds
    asgn1 = assign_role(
        tenant_id="ten_01",
        institution_id="inst_01",
        account_id=account["account_id"],
        role_id=dept_role["role_id"],
        scope_type="ORGANIZATIONAL_UNIT",
        scope_id="dept_cse",
        db=db,
    )
    assert asgn1["assignment_id"] is not None
    assert asgn1["status"] == "ACTIVE"

    # 2. Attempting to assign DEPT_COORDINATOR at INSTITUTION scope violates scope ceiling!
    with pytest.raises(RoleAssignmentError):
        assign_role(
            tenant_id="ten_01",
            institution_id="inst_01",
            account_id=account["account_id"],
            role_id=dept_role["role_id"],
            scope_type="INSTITUTION",  # Higher rank than ORGANIZATIONAL_UNIT!
            scope_id="inst_01",
            db=db,
        )

    # 3. Invalid temporal validity: valid_from > valid_to must fail
    now = datetime.now(timezone.utc)
    with pytest.raises(RoleAssignmentError):
        assign_role(
            tenant_id="ten_01",
            institution_id="inst_01",
            account_id=account["account_id"],
            role_id=dept_role["role_id"],
            scope_type="ORGANIZATIONAL_UNIT",
            scope_id="dept_cse",
            valid_from=now + timedelta(days=10),
            valid_to=now,  # Earlier than valid_from!
            db=db,
        )


def test_scope_downward_inheritance_engine(setup_camp02_roles_db):
    db = setup_camp02_roles_db

    # Create institutional structure: School of Tech -> Dept of CSE -> Lab of AI
    t = create_tenant(name="Roles Tenant", slug="roles-tenant", customer_type="ENTERPRISE", admin_email="t@roles-test.edu", db=db)
    inst = create_institution(
        tenant_id=t["id"],
        institution_code="INST_SCOPES",
        legal_name="Scope Testing Institute",
        display_name="STI",
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
    campus = create_campus(tenant_id=t["id"], campus_code="CAMPUS_MAIN", campus_name="Main Campus", db=db)
    associate_campus_with_institution(tenant_id=t["id"], institution_id=inst["institution_id"], campus_id=campus["campus_id"], db=db)

    # Org units
    school = create_organizational_unit(t["id"], inst["institution_id"], "SCHOOL_ENG", "School of Engineering", "SCHOOL", db=db)
    dept_cse = create_organizational_unit(t["id"], inst["institution_id"], "DEPT_CSE", "Dept of CSE", "DEPARTMENT", db=db)
    lab_ai = create_organizational_unit(t["id"], inst["institution_id"], "LAB_AI", "AI Research Lab", "RESEARCH_CENTRE", db=db)

    # Relations: School -> Dept -> Lab
    create_organizational_relation(t["id"], inst["institution_id"], child_unit_id=dept_cse["unit_id"], parent_unit_id=school["unit_id"], db=db)
    create_organizational_relation(t["id"], inst["institution_id"], child_unit_id=lab_ai["unit_id"], parent_unit_id=dept_cse["unit_id"], db=db)

    # Downward inheritance test 1: INSTITUTION scope covers child campus and child org unit
    assert is_in_scope("INSTITUTION", inst["institution_id"], "CAMPUS", campus["campus_id"], t["id"], inst["institution_id"], db=db) is True
    assert is_in_scope("INSTITUTION", inst["institution_id"], "ORGANIZATIONAL_UNIT", dept_cse["unit_id"], t["id"], inst["institution_id"], db=db) is True

    # Downward inheritance test 2: School scope covers Dept of CSE and AI Lab
    assert is_in_scope("ORGANIZATIONAL_UNIT", school["unit_id"], "ORGANIZATIONAL_UNIT", dept_cse["unit_id"], t["id"], inst["institution_id"], db=db) is True
    assert is_in_scope("ORGANIZATIONAL_UNIT", school["unit_id"], "ORGANIZATIONAL_UNIT", lab_ai["unit_id"], t["id"], inst["institution_id"], db=db) is True

    # Downward inheritance test 3: Dept of CSE covers AI Lab
    assert is_in_scope("ORGANIZATIONAL_UNIT", dept_cse["unit_id"], "ORGANIZATIONAL_UNIT", lab_ai["unit_id"], t["id"], inst["institution_id"], db=db) is True

    # Upward inheritance protection: Lab of AI CANNOT cover Dept of CSE or School of Eng!
    assert is_in_scope("ORGANIZATIONAL_UNIT", lab_ai["unit_id"], "ORGANIZATIONAL_UNIT", dept_cse["unit_id"], t["id"], inst["institution_id"], db=db) is False
    assert is_in_scope("ORGANIZATIONAL_UNIT", dept_cse["unit_id"], "ORGANIZATIONAL_UNIT", school["unit_id"], t["id"], inst["institution_id"], db=db) is False
    assert is_in_scope("ORGANIZATIONAL_UNIT", dept_cse["unit_id"], "INSTITUTION", inst["institution_id"], t["id"], inst["institution_id"], db=db) is False


def test_role_revocation_and_effective_permissions(setup_camp02_roles_db):
    db = setup_camp02_roles_db
    seed_baseline_roles(db)

    person = create_person_identity(first_name="Deepa", last_name="Nair", primary_email="deepa@roles-test.edu", db=db)
    account = create_account(person_id=person["person_id"], email="deepa@roles-test.edu", db=db)

    tpo_role = get_role_by_id("role_sys_tpo_coordinator", db=db)
    asgn = assign_role(
        tenant_id="ten_01",
        institution_id="inst_01",
        account_id=account["account_id"],
        role_id=tpo_role["role_id"],
        scope_type="CAMPUS",
        scope_id="campus_south",
        db=db,
    )

    # 1. Effective permissions reflect active assignment
    eff = get_effective_user_permissions(account["account_id"], db=db)
    assert len(eff) == 1
    assert "placement.drive.manage" in eff[0]["permissions"]

    # 2. Revoke role assignment
    revoke_role_assignment(asgn["assignment_id"], reason="Term end handover", revoked_by="admin", db=db)

    # 3. Subsequent permission queries immediately exclude revoked role
    eff_after = get_effective_user_permissions(account["account_id"], db=db)
    assert len(eff_after) == 0

    active_assignments = list_active_role_assignments(account["account_id"], db=db)
    assert len(active_assignments) == 0
