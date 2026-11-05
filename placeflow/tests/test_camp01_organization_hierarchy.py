"""Architectural and Invariant Tests for CAMP-01 Sub-Phase 1.3: Organizational Hierarchy & Graph Engine."""

import os
import django
from datetime import datetime, timezone, timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "placeflow_core.settings")
django.setup()

import pytest
from database.connection import get_db
from camp_01.schemas import apply_camp01_foundation_schemas
from camp_01.tenants import create_tenant, transition_tenant_status
from camp_01.institutions import create_institution
from camp_01.organization import (
    create_organizational_unit,
    create_organizational_relation,
    restructure_unit_parent,
    get_resolved_hierarchy_tree,
    HierarchyCycleDetectedError,
    PrimaryParentCollisionError,
    OrganizationalValidationError,
)
from camp_01.groups import (
    create_institution_group,
    add_institution_group_membership,
    list_group_members,
    record_institution_relationship,
    list_institution_relationships,
)


@pytest.fixture(autouse=True)
def setup_camp01_test_db():
    db = get_db()
    apply_camp01_foundation_schemas(db)
    yield db


def test_organizational_unit_creation_and_scoping(setup_camp01_test_db):
    """Verifies creation and scoping of organizational units."""
    db = setup_camp01_test_db
    db.platform_tenants.delete_many({"slug": "tenant-org-test"})
    t = create_tenant("Org University", "tenant-org-test", "STANDALONE_COLLEGE", "admin@org.edu")
    tid = t["id"]

    inst = create_institution(
        tenant_id=tid,
        institution_code="OU01",
        legal_name="Org University Institute",
        display_name="Org Uni",
        institution_type="INSTITUTE",
        classifications={
            "institution_kind": "INSTITUTE",
            "ownership": "PRIVATE",
            "governance": "PRIVATE_AIDED",
            "recognition_status": "RECOGNIZED",
            "institutional_role": "DEGREE_AWARDING",
            "delivery_model": "PHYSICAL",
        },
    )
    iid = inst["institution_id"]

    # 1. Create executive unit
    principal = create_organizational_unit(tid, iid, "EXEC_PRINCIPAL", "Office of the Principal", "EXECUTIVE")
    assert principal["normalized_code"] == "EXEC_PRINCIPAL"

    # 2. Create Placement Office unit
    tpo = create_organizational_unit(tid, iid, "OCS_CENTRAL", "Office of Career Services & Placements", "PLACEMENT_OFFICE")
    assert tpo["unit_type"] == "PLACEMENT_OFFICE"

    # 3. Create Academic department
    cse = create_organizational_unit(tid, iid, "DEPT_CSE", "Department of Computer Science & Engineering", "DEPARTMENT")
    assert cse["unit_type"] == "DEPARTMENT"

    # Duplicate code in same institution must be rejected
    with pytest.raises(OrganizationalValidationError):
        create_organizational_unit(tid, iid, "DEPT_CSE", "Duplicate CSE", "DEPARTMENT")


def test_acyclic_hierarchy_and_cycle_detection(setup_camp01_test_db):
    """Verifies that the $graphLookup cycle detection engine prevents circular organizational containment."""
    db = setup_camp01_test_db
    db.platform_tenants.delete_many({"slug": "tenant-cycle-test"})
    t = create_tenant("Cycle Tech", "tenant-cycle-test", "STANDALONE_COLLEGE", "admin@cycle.edu")
    tid = t["id"]

    inst = create_institution(
        tenant_id=tid,
        institution_code="CYCLE_01",
        legal_name="Cycle Tech Institute",
        display_name="Cycle Tech",
        institution_type="INSTITUTE",
        classifications={
            "institution_kind": "INSTITUTE",
            "ownership": "PRIVATE",
            "governance": "PRIVATE_AIDED",
            "recognition_status": "RECOGNIZED",
            "institutional_role": "DEGREE_AWARDING",
            "delivery_model": "PHYSICAL",
        },
    )
    iid = inst["institution_id"]

    # Create 3 units: School A -> Department B -> Lab C
    school_a = create_organizational_unit(tid, iid, "SCHOOL_A", "School of Computing", "SCHOOL")
    dept_b = create_organizational_unit(tid, iid, "DEPT_B", "Dept of Artificial Intelligence", "DEPARTMENT")
    lab_c = create_organizational_unit(tid, iid, "LAB_C", "Deep Learning Research Lab", "RESEARCH_CENTRE")

    sa_id = school_a["unit_id"]
    db_id = dept_b["unit_id"]
    lc_id = lab_c["unit_id"]

    # 1. School A contains Dept B
    create_organizational_relation(tid, iid, child_unit_id=db_id, parent_unit_id=sa_id, relationship_type="CONTAINS")

    # 2. Dept B contains Lab C
    create_organizational_relation(tid, iid, child_unit_id=lc_id, parent_unit_id=db_id, relationship_type="CONTAINS")

    # 3. Unit cannot contain itself (sa_id -> sa_id)
    with pytest.raises(OrganizationalValidationError):
        create_organizational_relation(tid, iid, child_unit_id=sa_id, parent_unit_id=sa_id, relationship_type="CONTAINS")

    # 4. Attempting to make Lab C contain School A creates cycle (School A -> Dept B -> Lab C -> School A)
    # MUST BE REJECTED BY CYCLE DETECTOR!
    with pytest.raises(HierarchyCycleDetectedError) as exc_info:
        create_organizational_relation(tid, iid, child_unit_id=sa_id, parent_unit_id=lc_id, relationship_type="CONTAINS")
    assert "structural cycle detected" in str(exc_info.value)


def test_restructure_unit_parent_temporal_preservation(setup_camp01_test_db):
    """Verifies that reorganizing an organizational parent preserves temporal history."""
    db = setup_camp01_test_db
    db.platform_tenants.delete_many({"slug": "tenant-restruct-test"})
    t = create_tenant("Restruct Uni", "tenant-restruct-test", "STANDALONE_COLLEGE", "admin@restruct.edu")
    tid = t["id"]

    inst = create_institution(
        tenant_id=tid,
        institution_code="REST_01",
        legal_name="Restructure University",
        display_name="Restruct Uni",
        institution_type="UNIVERSITY",
        classifications={
            "institution_kind": "UNIVERSITY",
            "ownership": "STATE_GOVERNMENT",
            "governance": "PUBLIC",
            "recognition_status": "RECOGNIZED",
            "institutional_role": "DEGREE_AWARDING",
            "delivery_model": "PHYSICAL",
        },
    )
    iid = inst["institution_id"]

    # Units: School of Engineering (soe), School of Computing (soc), CSE Department (cse)
    soe = create_organizational_unit(tid, iid, "SOE", "School of Engineering", "SCHOOL")
    soc = create_organizational_unit(tid, iid, "SOC", "School of Computing", "SCHOOL")
    cse = create_organizational_unit(tid, iid, "CSE", "Computer Science Department", "DEPARTMENT")

    soe_id = soe["unit_id"]
    soc_id = soc["unit_id"]
    cse_id = cse["unit_id"]

    # Point in time T1 (10 days ago): CSE belongs to School of Engineering
    t1 = datetime.now(timezone.utc) - timedelta(days=10)
    create_organizational_relation(
        tid, iid, child_unit_id=cse_id, parent_unit_id=soe_id, relationship_type="CONTAINS", valid_from=t1
    )

    # Point in time T2 (Now): Reorganize CSE under School of Computing
    t2 = datetime.now(timezone.utc)
    restructure_unit_parent(
        tenant_id=tid,
        institution_id=iid,
        unit_id=cse_id,
        new_parent_id=soc_id,
        change_reason="Academic Board bifurcation of computing disciplines",
        effective_date=t2,
    )

    # Historical query at T1 + 2 days: CSE is under School of Engineering!
    tree_past = get_resolved_hierarchy_tree(tid, iid, as_of_date=t1 + timedelta(days=2))
    soe_node_past = next(n for n in tree_past if n["unit_id"] == soe_id)
    assert any(c["unit_id"] == cse_id for c in soe_node_past["children"])

    # Current query at T2 + 1 hour: CSE is under School of Computing!
    tree_now = get_resolved_hierarchy_tree(tid, iid, as_of_date=t2 + timedelta(hours=1))
    soc_node_now = next(n for n in tree_now if n["unit_id"] == soc_id)
    assert any(c["unit_id"] == cse_id for c in soc_node_now["children"])


def test_operational_support_relationships(setup_camp01_test_db):
    """Verifies that non-hierarchical operational relationships (e.g. Placement Cell SUPPORTS Depts) work concurrently."""
    db = setup_camp01_test_db
    db.platform_tenants.delete_many({"slug": "tenant-ops-test"})
    t = create_tenant("Ops Institute", "tenant-ops-test", "STANDALONE_COLLEGE", "admin@ops.edu")
    tid = t["id"]

    inst = create_institution(
        tenant_id=tid,
        institution_code="OPS_01",
        legal_name="Ops Institute of Tech",
        display_name="Ops Tech",
        institution_type="INSTITUTE",
        classifications={
            "institution_kind": "INSTITUTE",
            "ownership": "PRIVATE",
            "governance": "PRIVATE_AIDED",
            "recognition_status": "RECOGNIZED",
            "institutional_role": "DEGREE_AWARDING",
            "delivery_model": "PHYSICAL",
        },
    )
    iid = inst["institution_id"]

    tpo = create_organizational_unit(tid, iid, "TPO_CELL", "Central Placement Office", "PLACEMENT_OFFICE")
    cse = create_organizational_unit(tid, iid, "DEPT_CSE", "Computer Science", "DEPARTMENT")
    ece = create_organizational_unit(tid, iid, "DEPT_ECE", "Electronics & Comm", "DEPARTMENT")

    # Placement office SUPPORTS both CSE and ECE concurrently (is_primary=False, operational)
    rel1 = create_organizational_relation(
        tid, iid, child_unit_id=cse["unit_id"], parent_unit_id=tpo["unit_id"], relationship_type="SUPPORTS", is_primary=False
    )
    rel2 = create_organizational_relation(
        tid, iid, child_unit_id=ece["unit_id"], parent_unit_id=tpo["unit_id"], relationship_type="SUPPORTS", is_primary=False
    )
    assert rel1["relationship_type"] == "SUPPORTS"
    assert rel2["relationship_type"] == "SUPPORTS"


def test_institution_groups_and_affiliations(setup_camp01_test_db):
    """Verifies education groups (trusts) and external affiliations."""
    db = setup_camp01_test_db
    db.platform_tenants.delete_many({"slug": "tenant-group-test"})
    t = create_tenant("KJS Trust", "tenant-group-test", "EDUCATION_GROUP", "trust@kjs.org")
    tid = t["id"]

    inst1 = create_institution(
        tenant_id=tid,
        institution_code="KJS_ENGG",
        legal_name="KJS College of Engineering",
        display_name="KJS Engineering",
        institution_type="COLLEGE",
        classifications={
            "institution_kind": "COLLEGE",
            "ownership": "PRIVATE",
            "governance": "PRIVATE_AIDED",
            "recognition_status": "RECOGNIZED",
            "institutional_role": "DEGREE_AWARDING",
            "delivery_model": "PHYSICAL",
        },
    )
    inst2 = create_institution(
        tenant_id=tid,
        institution_code="KJS_MGMT",
        legal_name="KJS Institute of Management Studies",
        display_name="KJS Management",
        institution_type="COLLEGE",
        classifications={
            "institution_kind": "COLLEGE",
            "ownership": "PRIVATE",
            "governance": "PRIVATE_AIDED",
            "recognition_status": "RECOGNIZED",
            "institutional_role": "DEGREE_AWARDING",
            "delivery_model": "PHYSICAL",
        },
    )

    # 1. Create Educational Trust Group
    group = create_institution_group(tid, "KJS_SOCIETY", "KJS Educational Society", group_type="TRUST")
    gid = group["group_id"]

    # 2. Add both institutions as members
    add_institution_group_membership(tid, gid, inst1["institution_id"], membership_type="OWNED")
    add_institution_group_membership(tid, gid, inst2["institution_id"], membership_type="OWNED")

    members = list_group_members(tid, gid)
    assert len(members) == 2

    # 3. Record Affiliation to State University Directory Entry
    aff = record_institution_relationship(
        tenant_id=tid,
        source_institution_id=inst1["institution_id"],
        target_type="EXTERNAL_DIRECTORY",
        target_id="AISHE-U-0306",  # Mumbai University
        relationship_type="AFFILIATED_TO",
        authority_reference="MU-AFF-2024-8899",
    )
    assert aff["relationship_type"] == "AFFILIATED_TO"
    assert aff["verification_status"] == "VERIFIED"

    rels = list_institution_relationships(tid, inst1["institution_id"])
    assert len(rels) == 1
    assert rels[0]["target_id"] == "AISHE-U-0306"

