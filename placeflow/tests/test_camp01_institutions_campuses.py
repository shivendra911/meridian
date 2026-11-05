"""Architectural and Invariant Tests for CAMP-01 Sub-Phase 1.2: Institution & Campus Management."""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "placeflow_core.settings")
django.setup()

import pytest
from database.connection import get_db
from camp_01.schemas import apply_camp01_foundation_schemas
from camp_01.tenants import create_tenant, transition_tenant_status
from camp_01.institutions import (
    create_institution,
    get_institution_by_id,
    get_institution_by_code,
    evaluate_institution_readiness,
    submit_institution_for_verification,
    record_verification_decision,
    activate_institution,
    add_institution_identifier,
    list_institution_identifiers,
    InstitutionValidationError,
    InstitutionReadinessError,
    InvalidInstitutionStateTransitionError,
)
from camp_01.campuses import (
    create_campus,
    create_physical_location,
    associate_campus_with_institution,
    close_institution_campus_association,
    list_institution_campuses,
    PrimaryCampusCollisionError,
)


@pytest.fixture(autouse=True)
def setup_camp01_test_db():
    db = get_db()
    apply_camp01_foundation_schemas(db)
    yield db


def test_institution_registration_and_tenant_isolation(setup_camp01_test_db):
    """Verifies institution registration, classification taxonomy, and cross-tenant code uniqueness."""
    db = setup_camp01_test_db
    # Create two isolated tenants
    db.platform_tenants.delete_many({"slug": {"$in": ["tenant-test-a", "tenant-test-b"]}})
    t_a = create_tenant("Trust A", "tenant-test-a", "EDUCATION_GROUP", "admin@trust-a.org")
    t_b = create_tenant("Trust B", "tenant-test-b", "EDUCATION_GROUP", "admin@trust-b.org")

    classifications = {
        "institution_kind": "AUTONOMOUS_COLLEGE",
        "ownership": "PRIVATE",
        "governance": "PRIVATE_UNAIDED",
        "recognition_status": "ACCREDITED",
        "institutional_role": "DEGREE_AWARDING",
        "delivery_model": "PHYSICAL",
    }

    # 1. Register institution in Tenant A
    inst_a = create_institution(
        tenant_id=t_a["id"],
        institution_code="coe_pune",
        legal_name="College of Engineering Pune",
        display_name="COEP Tech",
        institution_type="AUTONOMOUS_COLLEGE",
        classifications=classifications,
    )
    assert inst_a["normalized_code"] == "COE_PUNE"
    assert inst_a["status"] == "DRAFT"

    # 2. Duplicate normalized code within Tenant A must be rejected
    with pytest.raises(InstitutionValidationError) as exc:
        create_institution(
            tenant_id=t_a["id"],
            institution_code="COE_PUNE",
            legal_name="College of Engineering Duplicate",
            display_name="COEP Duplicate",
            institution_type="COLLEGE",
            classifications=classifications,
        )
    assert "already registered" in str(exc.value)

    # 3. Same normalized code in Tenant B MUST be allowed (Tenant isolation guarantee!)
    inst_b = create_institution(
        tenant_id=t_b["id"],
        institution_code="COE_PUNE",
        legal_name="Council of Education Pune",
        display_name="COE Pune",
        institution_type="COLLEGE",
        classifications=classifications,
    )
    assert inst_b["normalized_code"] == "COE_PUNE"
    assert inst_b["tenant_id"] == t_b["id"]


def test_regulatory_identifiers(setup_camp01_test_db):
    """Verifies registration and uniqueness of institutional regulatory identifiers."""
    db = setup_camp01_test_db
    db.platform_tenants.delete_many({"slug": "tenant-ident-test"})
    t = create_tenant("Ident University", "tenant-ident-test", "STANDALONE_COLLEGE", "admin@ident.edu")

    inst = create_institution(
        tenant_id=t["id"],
        institution_code="IU01",
        legal_name="Ident University",
        display_name="Ident Tech",
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

    # Add AISHE and AICTE identifiers
    aishe = add_institution_identifier(t["id"], inst["institution_id"], "AISHE", "U-9999", issuer="Ministry of Education")
    assert aishe["value"] == "U-9999"
    assert aishe["verification_status"] == "SUBMITTED"

    aicte = add_institution_identifier(t["id"], inst["institution_id"], "AICTE", "1-888888", issuer="AICTE Western Region")
    assert aicte["scheme"] == "AICTE"

    # Duplicate identifier in same scheme must be blocked
    with pytest.raises(InstitutionValidationError):
        add_institution_identifier(t["id"], inst["institution_id"], "AISHE", "U-9999")

    # List identifiers
    ids = list_institution_identifiers(t["id"], inst["institution_id"])
    assert len(ids) == 2


def test_campus_and_single_primary_campus_exclusivity(setup_camp01_test_db):
    """Verifies campus management and the single primary-campus temporal exclusion rule."""
    db = setup_camp01_test_db
    db.platform_tenants.delete_many({"slug": "tenant-campus-test"})
    t = create_tenant("Campus University", "tenant-campus-test", "STATE_UNIVERSITY", "admin@cu.edu")

    inst = create_institution(
        tenant_id=t["id"],
        institution_code="CU_MAIN",
        legal_name="Campus University",
        display_name="Campus Uni",
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

    # 1. Create two campuses
    c_north = create_campus(t["id"], "NORTH", "North Campus", "PHYSICAL", status="ACTIVE")
    c_south = create_campus(t["id"], "SOUTH", "South Campus", "PHYSICAL", status="ACTIVE")

    # Create physical location for North campus
    loc = create_physical_location(
        t["id"],
        building_name="Ramanujan Academic Complex",
        city="Pune",
        state="Maharashtra",
        postal_code="411005",
        campus_id=c_north["campus_id"],
        block="Block A",
        latitude=18.5204,
        longitude=73.8567,
    )
    assert loc["location_id"] is not None

    # 2. Associate North campus as primary
    assoc_north = associate_campus_with_institution(
        t["id"], iid, c_north["campus_id"], relationship_type="MAIN_CAMPUS", is_primary=True
    )
    assert assoc_north["is_primary"] is True

    # 3. Attempting to associate South campus as primary WHILE North is active MUST FAIL!
    with pytest.raises(PrimaryCampusCollisionError) as exc:
        associate_campus_with_institution(
            t["id"], iid, c_south["campus_id"], relationship_type="BRANCH_CAMPUS", is_primary=True
        )
    assert "already has an active primary campus" in str(exc.value)

    # 4. Associate South campus as non-primary (allowed!)
    assoc_south = associate_campus_with_institution(
        t["id"], iid, c_south["campus_id"], relationship_type="BRANCH_CAMPUS", is_primary=False
    )
    assert assoc_south["is_primary"] is False

    # 5. Now close North primary campus association
    close_institution_campus_association(t["id"], assoc_north["association_id"])

    # 6. Now South campus can be designated as primary!
    assoc_south_primary = associate_campus_with_institution(
        t["id"], iid, c_south["campus_id"], relationship_type="MAIN_CAMPUS", is_primary=True
    )
    assert assoc_south_primary["is_primary"] is True


def test_institution_readiness_checklist_and_activation_gate(setup_camp01_test_db):
    """Verifies that unready institutions cannot be activated, and passing the 12-point gate enables activation."""
    db = setup_camp01_test_db
    db.platform_tenants.delete_many({"slug": "tenant-gate-test"})
    t = create_tenant("Gate College Trust", "tenant-gate-test", "STANDALONE_COLLEGE", "admin@gate.edu")
    tid = t["id"]

    inst = create_institution(
        tenant_id=tid,
        institution_code="GC_01",
        legal_name="Gate College of Technology",
        display_name="Gate Tech",
        institution_type="COLLEGE",
        contact_email="principal@gate.edu",
        classifications={
            "institution_kind": "COLLEGE",
            "ownership": "PRIVATE",
            "governance": "PRIVATE_UNAIDED",
            "recognition_status": "ACCREDITED",
            "institutional_role": "DEGREE_AWARDING",
            "delivery_model": "PHYSICAL",
        },
    )
    iid = inst["institution_id"]

    # Incomplete institution: Tenant is not ACTIVE (it's REQUESTED), no regulatory ID, no campus
    readiness = evaluate_institution_readiness(tid, iid)
    assert readiness["is_ready_for_activation"] is False
    assert len(readiness["failed_criteria"]) >= 3

    # Attempting to activate unverified institution in DRAFT state raises InvalidStateTransition
    with pytest.raises(InvalidInstitutionStateTransitionError):
        activate_institution(tid, iid)

    # Submit for verification
    submit_institution_for_verification(tid, iid, notes="Submitting for academic council review")

    # Attempting to activate without meeting readiness criteria raises InstitutionReadinessError
    with pytest.raises(InstitutionReadinessError) as exc_info:
        activate_institution(tid, iid)
    assert "readiness gate failed" in str(exc_info.value)

    # Now fulfill all readiness criteria:
    # 1. Activate tenant
    transition_tenant_status(tid, "PROVISIONING")
    transition_tenant_status(tid, "ACTIVE")

    # 2. Add regulatory identifier
    add_institution_identifier(tid, iid, "AISHE", "C-54321", issuer="Ministry of Education")

    # 3. Create campus and associate as primary
    camp = create_campus(tid, "CAMPUS_MAIN", "Gate Tech Main Campus", "PHYSICAL", status="ACTIVE")
    associate_campus_with_institution(tid, iid, camp["campus_id"], relationship_type="MAIN_CAMPUS", is_primary=True)

    # 4. Record compliance verification
    record_verification_decision(tid, iid, passed=True, verified_by="compliance@campusos.in", notes="All documents audited")

    # Now readiness must pass!
    readiness_ready = evaluate_institution_readiness(tid, iid)
    assert readiness_ready["is_ready_for_activation"] is True
    assert len(readiness_ready["failed_criteria"]) == 0

    # Activation succeeds!
    activated_inst = activate_institution(tid, iid, actor_id="director@campusos.in")
    assert activated_inst["status"] == "ACTIVE"

