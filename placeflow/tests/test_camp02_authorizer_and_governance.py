"""Tests for CAMP-02 Sub-Phase 2.3:
Authorization Decision Pipeline, Role Delegation, Separation of Duties (SoD), and Break-Glass Protocol.
"""

from datetime import datetime, timedelta, timezone
import pytest
from database.connection import get_db
from camp_01.tenants import create_tenant
from camp_01.institutions import create_institution
from camp_01.campuses import create_campus
from camp_01.organization import create_organizational_unit, create_organizational_relation
from camp_02.identities import create_person_identity
from camp_02.memberships import create_institution_membership
from camp_02.permissions import seed_baseline_permissions
from camp_02.roles import seed_baseline_roles, create_custom_role
from camp_02.assignments import assign_role
from camp_02.delegation import create_role_delegation, revoke_role_delegation, AntiCascadeViolationError
from camp_02.governance import validate_static_sod, SodViolationError
from camp_02.privileged import request_break_glass_access, revoke_break_glass_access
from camp_02.authorizer import can


@pytest.fixture
def auth_fixture():
    db = get_db()
    # Clean test collections
    for coll in [
        "platform_tenants", "institutions", "campuses", "organizational_units", "organizational_unit_relations",
        "person_identities", "accounts", "institution_memberships", "permissions", "roles", "role_assignments",
        "role_delegations", "break_glass_sessions", "outbox_events"
    ]:
        db[coll].delete_many({})

    seed_baseline_permissions(db=db)
    seed_baseline_roles(db=db)

    t = create_tenant("Auth University", "auth-uni", "ENTERPRISE", "admin@auth.edu", db=db)
    inst = create_institution(
        tenant_id=t["id"],
        institution_code="INST_AUTH",
        legal_name="Institute of Technology & Research",
        display_name="ITR",
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
    school = create_organizational_unit(t["id"], inst["institution_id"], "SCH_ENG", "School of Eng", "SCHOOL", db=db)
    dept_cse = create_organizational_unit(t["id"], inst["institution_id"], "DEPT_CSE", "Dept of CSE", "DEPARTMENT", db=db)
    dept_me = create_organizational_unit(t["id"], inst["institution_id"], "DEPT_ME", "Dept of ME", "DEPARTMENT", db=db)
    create_organizational_relation(t["id"], inst["institution_id"], dept_cse["unit_id"], school["unit_id"], db=db)

    # Person & Membership: Faculty Coordinator CSE
    p_fac = create_person_identity(primary_email="aarav@auth.edu", first_name="Aarav", last_name="Sharma", date_of_birth="1980-05-15", gender="MALE", db=db)
    m_fac = create_institution_membership(t["id"], inst["institution_id"], p_fac["person_id"], "FACULTY", db=db)

    # Person & Membership: Faculty ME
    p_me = create_person_identity(primary_email="rohan@auth.edu", first_name="Rohan", last_name="Verma", date_of_birth="1985-02-10", gender="MALE", db=db)
    m_me = create_institution_membership(t["id"], inst["institution_id"], p_me["person_id"], "FACULTY", db=db)

    # Super Admin
    p_admin = create_person_identity(primary_email="admin@auth.edu", first_name="Super", last_name="Admin", date_of_birth="1975-01-01", gender="MALE", db=db)
    m_admin = create_institution_membership(t["id"], inst["institution_id"], p_admin["person_id"], "STAFF", db=db)

    return {
        "db": db,
        "tenant": t,
        "institution": inst,
        "school": school,
        "dept_cse": dept_cse,
        "dept_me": dept_me,
        "faculty_cse": m_fac,
        "faculty_me": m_me,
        "admin": m_admin,
    }


def test_authorizer_super_admin_override(auth_fixture):
    db = auth_fixture["db"]
    t = auth_fixture["tenant"]
    admin = auth_fixture["admin"]

    # Assign SUPER_ADMIN role with PLATFORM scope
    assign_role(t["id"], admin["membership_id"], "ROLE_SUPER_ADMIN", "PLATFORM", "global", db=db)

    res = can(
        tenant_id=t["id"],
        principal_membership_id=admin["membership_id"],
        action="placement:offer:verify",
        resource={"resource_id": "OFFER001", "scope_type": "INSTITUTION", "scope_id": auth_fixture["institution"]["institution_id"]},
        db=db,
    )

    assert res.allowed is True
    assert res.reason_code == "SUPER_ADMIN_OVERRIDE"


def test_authorizer_scope_enforcement_and_inheritance(auth_fixture):
    db = auth_fixture["db"]
    t = auth_fixture["tenant"]
    fac_cse = auth_fixture["faculty_cse"]
    dept_cse = auth_fixture["dept_cse"]
    dept_me = auth_fixture["dept_me"]

    # Assign Faculty Coordinator scoped to DEPT_CSE
    assign_role(t["id"], fac_cse["membership_id"], "ROLE_FACULTY_COORDINATOR", "ORGANIZATIONAL_UNIT", dept_cse["unit_id"], db=db)

    # 1. Action within own department scope: ALLOW
    res1 = can(
        tenant_id=t["id"],
        principal_membership_id=fac_cse["membership_id"],
        action="placement:student:read",
        resource={"resource_id": "STU_CSE_1", "scope_type": "ORGANIZATIONAL_UNIT", "scope_id": dept_cse["unit_id"]},
        db=db,
    )
    assert res1.allowed is True
    assert res1.reason_code == "ACTION_PERMITTED"

    # 2. Action outside scope (DEPT_ME): DENY(SCOPE_MISMATCH)
    res2 = can(
        tenant_id=t["id"],
        principal_membership_id=fac_cse["membership_id"],
        action="placement:student:read",
        resource={"resource_id": "STU_ME_1", "scope_type": "ORGANIZATIONAL_UNIT", "scope_id": dept_me["unit_id"]},
        db=db,
    )
    assert res2.allowed is False
    assert res2.reason_code == "SCOPE_MISMATCH"

    # 3. Action requiring higher scope rank (INSTITUTION) than assigned rank (ORGANIZATIONAL_UNIT): DENY(SCOPE_CEILING_EXCEEDED)
    res3 = can(
        tenant_id=t["id"],
        principal_membership_id=fac_cse["membership_id"],
        action="placement:student:read",
        resource={"resource_id": "INST_WIDE", "scope_type": "INSTITUTION", "scope_id": auth_fixture["institution"]["institution_id"]},
        db=db,
    )
    assert res3.allowed is False
    assert res3.reason_code == "SCOPE_CEILING_EXCEEDED"


def test_role_delegation_and_anti_cascade(auth_fixture):
    db = auth_fixture["db"]
    t = auth_fixture["tenant"]
    inst = auth_fixture["institution"]
    fac_cse = auth_fixture["faculty_cse"]
    fac_me = auth_fixture["faculty_me"]
    dept_cse = auth_fixture["dept_cse"]

    # Faculty CSE holds FACULTY_COORDINATOR role
    assign_res = assign_role(t["id"], fac_cse["membership_id"], "ROLE_FACULTY_COORDINATOR", "ORGANIZATIONAL_UNIT", dept_cse["unit_id"], db=db)

    # Delegate role to Faculty ME for 7 days
    now = datetime.now(timezone.utc)
    delegation = create_role_delegation(
        tenant_id=t["id"],
        institution_id=inst["institution_id"],
        delegator_membership_id=fac_cse["membership_id"],
        delegatee_membership_id=fac_me["membership_id"],
        role_id=assign_res["role_id"],
        scope_type="ORGANIZATIONAL_UNIT",
        scope_id=dept_cse["unit_id"],
        valid_from=now,
        valid_to=now + timedelta(days=7),
        reason="HOD medical leave delegate",
        db=db,
    )

    # Delegatee can now execute permitted delegated action
    res_delegated = can(
        tenant_id=t["id"],
        principal_membership_id=fac_me["membership_id"],
        action="placement:student:read",
        resource={"resource_id": "STU001", "scope_type": "ORGANIZATIONAL_UNIT", "scope_id": dept_cse["unit_id"]},
        db=db,
    )
    assert res_delegated.allowed is True
    assert res_delegated.reason_code == "ACTION_PERMITTED_DELEGATED"

    # Anti-Cascade check: Delegatee cannot sub-delegate this role to another party
    with pytest.raises(AntiCascadeViolationError):
        create_role_delegation(
            tenant_id=t["id"],
            institution_id=inst["institution_id"],
            delegator_membership_id=fac_me["membership_id"],
            delegatee_membership_id=auth_fixture["admin"]["membership_id"],
            role_id=assign_res["role_id"],
            scope_type="ORGANIZATIONAL_UNIT",
            scope_id=dept_cse["unit_id"],
            valid_from=now,
            valid_to=now + timedelta(days=2),
            reason="Sub delegation attempt",
            db=db,
        )

    # Instant Revocation: After revocation, access is denied
    revoke_role_delegation(delegation["delegation_id"], t["id"], revoked_by="admin", revocation_reason="HOD resumed duty", db=db)

    res_revoked = can(
        tenant_id=t["id"],
        principal_membership_id=fac_me["membership_id"],
        action="placement:student:read",
        resource={"resource_id": "STU001", "scope_type": "ORGANIZATIONAL_UNIT", "scope_id": dept_cse["unit_id"]},
        db=db,
    )
    assert res_revoked.allowed is False


def test_separation_of_duties_static_and_dynamic(auth_fixture):
    db = auth_fixture["db"]
    t = auth_fixture["tenant"]
    fac_cse = auth_fixture["faculty_cse"]
    dept_cse = auth_fixture["dept_cse"]

    # 1. Static SoD: Assigning Placement Officer Coordinator
    assign_role(t["id"], fac_cse["membership_id"], "ROLE_PLACEMENT_OFFICE_COORDINATOR", "ORGANIZATIONAL_UNIT", dept_cse["unit_id"], db=db)

    # Attempting to assign STATUTORY_AUDITOR to the same membership raises SodViolationError
    with pytest.raises(SodViolationError):
        assign_role(t["id"], fac_cse["membership_id"], "ROLE_STATUTORY_AUDITOR", "INSTITUTION", auth_fixture["institution"]["institution_id"], db=db)

    # 2. Dynamic SoD: Creator cannot verify the same offer
    # Record that fac_cse created offer OFFER_999 in outbox_events
    db.outbox_events.insert_one({
        "event_id": "evt-123",
        "tenant_id": t["id"],
        "aggregate_type": "OFFER",
        "aggregate_id": "OFFER_999",
        "event_type": "placement:offer:create",
        "payload": {"resource_id": "OFFER_999", "actor_id": fac_cse["membership_id"]},
        "occurred_at": datetime.now(timezone.utc),
    })

    # Now fac_cse attempts to verify OFFER_999
    res_sod = can(
        tenant_id=t["id"],
        principal_membership_id=fac_cse["membership_id"],
        action="placement:offer:verify",
        resource={"resource_id": "OFFER_999", "scope_type": "ORGANIZATIONAL_UNIT", "scope_id": dept_cse["unit_id"]},
        db=db,
    )
    assert res_sod.allowed is False
    assert res_sod.reason_code == "SOD_CONFLICT"


def test_privileged_break_glass_access(auth_fixture):
    db = auth_fixture["db"]
    t = auth_fixture["tenant"]
    inst = auth_fixture["institution"]
    fac_cse = auth_fixture["faculty_cse"]

    # Initially unauthorized to perform audit deletion or privileged operation
    res_before = can(
        tenant_id=t["id"],
        principal_membership_id=fac_cse["membership_id"],
        action="camp01:institution:update",
        resource={"resource_id": inst["institution_id"], "scope_type": "INSTITUTION", "scope_id": inst["institution_id"]},
        db=db,
    )
    assert res_before.allowed is False

    # Activate Break-Glass
    bg = request_break_glass_access(
        tenant_id=t["id"],
        institution_id=inst["institution_id"],
        membership_id=fac_cse["membership_id"],
        incident_ticket_id="INC-88992",
        justification="Emergency server migration DNS override",
        target_scope_type="INSTITUTION",
        target_scope_id=inst["institution_id"],
        duration_hours=2,
        db=db,
    )

    # Authorized under BREAK_GLASS_ACTIVE
    res_bg = can(
        tenant_id=t["id"],
        principal_membership_id=fac_cse["membership_id"],
        action="camp01:institution:update",
        resource={"resource_id": inst["institution_id"], "scope_type": "INSTITUTION", "scope_id": inst["institution_id"]},
        db=db,
    )
    assert res_bg.allowed is True
    assert res_bg.reason_code == "BREAK_GLASS_ACTIVE"

    # Revoke Break-Glass
    revoke_break_glass_access(bg["break_glass_id"], t["id"], revoked_by="admin", reason="Incident resolved", db=db)

    # Re-check: Denied
    res_after = can(
        tenant_id=t["id"],
        principal_membership_id=fac_cse["membership_id"],
        action="camp01:institution:update",
        resource={"resource_id": inst["institution_id"], "scope_type": "INSTITUTION", "scope_id": inst["institution_id"]},
        db=db,
    )
    assert res_after.allowed is False
