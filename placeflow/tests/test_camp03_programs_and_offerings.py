"""Automated Test Suite for CAMP-03 Sub-Phase 3.1:
Academic Programs, Qualifications & Offerings Foundation.

Verifies:
1. Multi-Degree Qualifications (B.Tech, MBA, Diploma, Ph.D.) & NCrF/NHEQF levels.
2. Program creation across concurrent models & joint academic unit mappings.
3. Curriculum Versioning lifecycle & strict Immutability enforcement.
4. Campus Program Offerings, shifts (Morning/Evening), and quota management.
5. Specialization tracks (Major, Minor, Honours/Research).
"""

from datetime import datetime, timezone
import pytest

from database.connection import get_db
from camp_01.tenants import create_tenant
from camp_01.institutions import create_institution
from camp_01.campuses import create_campus
from camp_01.organization import create_organizational_unit
from camp_01.schemas import apply_camp01_foundation_schemas
from camp_02.schemas import setup_camp02_collections

from camp_03.schemas import setup_camp03_foundation_collections
from camp_03.standards import (
    get_framework_metadata,
    validate_qualification_level,
    recommend_qualification_level,
)
from camp_03.qualifications import (
    create_qualification_definition,
    get_qualification,
    list_qualifications,
    update_qualification,
    DuplicateQualificationError,
    QualificationValidationError,
)
from camp_03.programs import (
    create_academic_program,
    get_academic_program,
    list_academic_programs,
    create_program_version,
    get_program_version,
    approve_program_version,
    activate_program_version,
    update_program_version,
    branch_program_version,
    link_program_offering_unit,
    ProgramVersionImmutableError,
    DuplicateProgramError,
    ProgramValidationError,
)
from camp_03.offerings import (
    create_program_offering,
    get_program_offering,
    list_program_offerings,
    transition_offering_status,
    update_offering_intake,
    create_program_specialization,
    list_program_specializations,
    DuplicateOfferingError,
    InvalidOfferingStateTransitionError,
    OfferingValidationError,
)


@pytest.fixture
def camp03_fixture():
    db = get_db()
    apply_camp01_foundation_schemas(db)
    setup_camp02_collections(db)
    setup_camp03_foundation_collections(db)

    # Clean test fixtures
    tenant_id = "ten_c03_test"
    inst_id = "inst_c03_univ"

    db.platform_tenants.delete_many({"slug": "camp03-trust"})
    db.institutions.delete_many({"institution_code": "MTU_01"})
    db.campuses.delete_many({"campus_code": {"$in": ["MTU_NORTH", "MTU_SOUTH"]}})
    db.organizational_units.delete_many({"unit_code": {"$in": ["SET", "CSE", "MATH"]}})
    db.qualifications.delete_many({})
    db.programs.delete_many({})
    db.program_versions.delete_many({})
    db.program_offerings.delete_many({})
    db.program_offering_units.delete_many({})
    db.program_specializations.delete_many({})

    # Setup core organizational topology
    t = create_tenant(
        name="CAMP-03 Educational Trust",
        slug="camp03-trust",
        customer_type="EDUCATION_GROUP",
        admin_email="admin@camp03-trust.org",
        db=db,
    )
    tenant_id = t["id"]

    inst = create_institution(
        tenant_id=tenant_id,
        institution_code="MTU_01",
        legal_name="Metropolitan Technical University Legal",
        display_name="Metropolitan Technical University",
        institution_type="STATE_UNIVERSITY",
        classifications={
            "institution_kind": "UNIVERSITY",
            "ownership": "STATE_GOVERNMENT",
            "governance": "PUBLIC",
            "institutional_role": "DEGREE_AWARDING",
            "delivery_model": "HYBRID",
        },
        db=db,
    )
    inst_id = inst["institution_id"]

    campus_north = create_campus(
        tenant_id=tenant_id,
        campus_code="MTU_NORTH",
        campus_name="North City Campus",
        campus_kind="PHYSICAL",
        status="ACTIVE",
        db=db,
    )
    campus_south = create_campus(
        tenant_id=tenant_id,
        campus_code="MTU_SOUTH",
        campus_name="South Technology Campus",
        campus_kind="PHYSICAL",
        status="ACTIVE",
        db=db,
    )
    school_eng = create_organizational_unit(
        tenant_id=tenant_id,
        institution_id=inst_id,
        unit_code="SET",
        name="School of Engineering & Technology",
        unit_type="FACULTY",
        db=db,
    )
    dept_cse = create_organizational_unit(
        tenant_id=tenant_id,
        institution_id=inst_id,
        unit_code="CSE",
        name="Department of Computer Science & Engineering",
        unit_type="DEPARTMENT",
        db=db,
    )
    dept_math = create_organizational_unit(
        tenant_id=tenant_id,
        institution_id=inst_id,
        unit_code="MATH",
        name="Department of Applied Mathematics",
        unit_type="DEPARTMENT",
        db=db,
    )

    return {
        "db": db,
        "tenant_id": tenant_id,
        "institution_id": inst_id,
        "campus_north_id": campus_north["campus_id"],
        "campus_south_id": campus_south["campus_id"],
        "dept_cse_id": dept_cse["unit_id"],
        "dept_math_id": dept_math["unit_id"],
    }


def test_qualifications_and_standards(camp03_fixture):
    """Test 1: Verify qualification creation, standards mapping and level boundaries."""
    f = camp03_fixture
    db = f["db"]

    # Regulatory adapter check
    ccfug = get_framework_metadata("UGC_CCFUG_2022")
    assert ccfug is not None
    assert ccfug["levels"][6.0]["minimum_credits"] == 160.0

    # 1. B.Tech (Undergraduate, 4-yr, Level 6.0)
    qual_btech = create_qualification_definition(
        db=db,
        tenant_id=f["tenant_id"],
        institution_id=f["institution_id"],
        qualification_code="BTECH",
        official_title="Bachelor of Technology",
        qualification_level=6.0,
        qualification_category="UNDERGRADUATE",
        awarding_authority_type="UNIVERSITY",
        framework_reference={"framework_name": "UGC_CCFUG_2022", "framework_level": "6.0"},
    )
    assert qual_btech["qualification_code"] == "BTECH"
    assert qual_btech["qualification_level"] == 6.0

    # 2. MBA (Postgraduate, 2-yr, Level 7.0)
    qual_mba = create_qualification_definition(
        db=db,
        tenant_id=f["tenant_id"],
        institution_id=f["institution_id"],
        qualification_code="MBA",
        official_title="Master of Business Administration",
        qualification_level=7.0,
        qualification_category="POSTGRADUATE",
        awarding_authority_type="UNIVERSITY",
    )
    assert qual_mba["qualification_category"] == "POSTGRADUATE"

    # 3. Diploma (Polytechnic, Level 5.0)
    qual_dip = create_qualification_definition(
        db=db,
        tenant_id=f["tenant_id"],
        institution_id=f["institution_id"],
        qualification_code="DIP_ENG",
        official_title="Diploma in Engineering",
        qualification_level=5.0,
        qualification_category="DIPLOMA",
        awarding_authority_type="TECHNICAL_BOARD",
    )
    assert qual_dip["qualification_level"] == 5.0

    # 4. Duplicate qualification code rejected
    with pytest.raises(DuplicateQualificationError):
        create_qualification_definition(
            db=db,
            tenant_id=f["tenant_id"],
            institution_id=f["institution_id"],
            qualification_code="BTECH",
            official_title="Duplicate BTech",
            qualification_level=6.0,
            qualification_category="UNDERGRADUATE",
        )

    # 5. Invalid statutory level bounds rejected (e.g. Diploma with Level 8.0)
    with pytest.raises(QualificationValidationError):
        create_qualification_definition(
            db=db,
            tenant_id=f["tenant_id"],
            institution_id=f["institution_id"],
            qualification_code="INVALID_DIP",
            official_title="Invalid Diploma Level",
            qualification_level=8.0,
            qualification_category="DIPLOMA",
        )


def test_programs_and_joint_delivery(camp03_fixture):
    """Test 2: Educational program pathways creation and joint academic unit delivery."""
    f = camp03_fixture
    db = f["db"]

    qual_btech = create_qualification_definition(
        db=db,
        tenant_id=f["tenant_id"],
        institution_id=f["institution_id"],
        qualification_code="BTECH_CS",
        official_title="Bachelor of Technology in Computer Science",
        qualification_level=6.0,
        qualification_category="UNDERGRADUATE",
    )

    # Create B.Tech CSE Program
    prog_cse = create_academic_program(
        db=db,
        tenant_id=f["tenant_id"],
        institution_id=f["institution_id"],
        program_code="CSE-BTECH",
        program_title="Computer Science & Engineering",
        qualification_id=qual_btech["qualification_id"],
        primary_academic_unit_id=f["dept_cse_id"],
        is_interdisciplinary=True,
        nominal_duration_semesters=8,
        maximum_duration_semesters=12,
    )
    assert prog_cse["program_code"] == "CSE-BTECH"
    assert prog_cse["is_interdisciplinary"] is True

    # Duplicate code check
    with pytest.raises(DuplicateProgramError):
        create_academic_program(
            db=db,
            tenant_id=f["tenant_id"],
            institution_id=f["institution_id"],
            program_code="CSE-BTECH",
            program_title="Duplicate CSE",
            qualification_id=qual_btech["qualification_id"],
            primary_academic_unit_id=f["dept_cse_id"],
        )

    # Create dummy offering to test joint delivery unit mapping
    pv = create_program_version(
        db=db,
        program_id=prog_cse["program_id"],
        version_code="v1.0",
        curriculum_name="2026 Curriculum",
        effective_from=datetime(2026, 7, 1, tzinfo=timezone.utc),
    )
    offering = create_program_offering(
        db=db,
        program_version_id=pv["program_version_id"],
        campus_id=f["campus_north_id"],
        academic_year="2026-2027",
    )

    # Link primary delivery unit (CSE: 75%) and joint unit (Math: 25%)
    unit_cse = link_program_offering_unit(
        db=db,
        offering_id=offering["offering_id"],
        academic_unit_id=f["dept_cse_id"],
        responsibility_type="PRIMARY_ADMIN",
        share_percentage=75.0,
    )
    unit_math = link_program_offering_unit(
        db=db,
        offering_id=offering["offering_id"],
        academic_unit_id=f["dept_math_id"],
        responsibility_type="JOINT_TEACHING",
        share_percentage=25.0,
    )
    assert unit_cse["share_percentage"] == 75.0
    assert unit_math["responsibility_type"] == "JOINT_TEACHING"


def test_program_versioning_and_immutability(camp03_fixture):
    """Test 3: Verify curriculum version lifecycle, immutability, and historical branching."""
    f = camp03_fixture
    db = f["db"]

    qual = create_qualification_definition(
        db=db,
        tenant_id=f["tenant_id"],
        institution_id=f["institution_id"],
        qualification_code="BTECH_IT",
        official_title="B.Tech IT",
        qualification_level=6.0,
        qualification_category="UNDERGRADUATE",
    )
    prog = create_academic_program(
        db=db,
        tenant_id=f["tenant_id"],
        institution_id=f["institution_id"],
        program_code="IT-BTECH",
        program_title="Information Technology",
        qualification_id=qual["qualification_id"],
        primary_academic_unit_id=f["dept_cse_id"],
    )

    # 1. Create Draft Version
    pv1 = create_program_version(
        db=db,
        program_id=prog["program_id"],
        version_code="CURR-2026",
        curriculum_name="2026 Scheme",
        effective_from=datetime(2026, 7, 1, tzinfo=timezone.utc),
        total_credits_required=160.0,
        applicable_cohorts=["cohort_2026_it"],
        status="DRAFT",
    )
    assert pv1["status"] == "DRAFT"

    # 2. Update Draft Version (Allowed)
    updated_pv1 = update_program_version(
        db=db,
        program_version_id=pv1["program_version_id"],
        updates={"curriculum_name": "2026 Scheme Revised Draft", "total_credits_required": 162.0},
    )
    assert updated_pv1["curriculum_name"] == "2026 Scheme Revised Draft"
    assert updated_pv1["total_credits_required"] == 162.0

    # 3. Approve Version
    approved_pv1 = approve_program_version(
        db=db,
        program_version_id=pv1["program_version_id"],
        approved_by_membership_id="mem_dean_academic",
    )
    assert approved_pv1["status"] == "APPROVED"
    assert approved_pv1["approved_by_membership_id"] == "mem_dean_academic"

    # 4. Strict Immutability Test: Modifying approved version MUST FAIL
    with pytest.raises(ProgramVersionImmutableError) as exc_info:
        update_program_version(
            db=db,
            program_version_id=pv1["program_version_id"],
            updates={"total_credits_required": 170.0},
        )
    assert "strictly immutable" in str(exc_info.value)

    # 5. Branch new version for next cohort (Preserves history)
    pv2 = branch_program_version(
        db=db,
        source_version_id=pv1["program_version_id"],
        new_version_code="CURR-2027",
        new_curriculum_name="2027 Scheme Updated",
        effective_from=datetime(2027, 7, 1, tzinfo=timezone.utc),
        new_applicable_cohorts=["cohort_2027_it"],
        overrides={"total_credits_required": 164.0},
    )
    assert pv2["version_code"] == "CURR-2027"
    assert pv2["total_credits_required"] == 164.0
    assert pv2["status"] == "DRAFT"
    assert pv2["metadata"]["branched_from_version_id"] == pv1["program_version_id"]


def test_offerings_shifts_and_status_machine(camp03_fixture):
    """Test 4: Verify campus offerings, shifts, quotas, and state transitions."""
    f = camp03_fixture
    db = f["db"]

    qual = create_qualification_definition(
        db=db,
        tenant_id=f["tenant_id"],
        institution_id=f["institution_id"],
        qualification_code="BCA",
        official_title="Bachelor of Computer Applications",
        qualification_level=5.5,
        qualification_category="UNDERGRADUATE",
    )
    prog = create_academic_program(
        db=db,
        tenant_id=f["tenant_id"],
        institution_id=f["institution_id"],
        program_code="BCA-GEN",
        program_title="Bachelor of Computer Applications",
        qualification_id=qual["qualification_id"],
        primary_academic_unit_id=f["dept_cse_id"],
    )
    pv = create_program_version(
        db=db,
        program_id=prog["program_id"],
        version_code="BCA-2026",
        curriculum_name="2026 BCA Framework",
        effective_from=datetime(2026, 7, 1, tzinfo=timezone.utc),
        total_credits_required=120.0,
    )
    approve_program_version(db, pv["program_version_id"], "mem_dean")

    # 1. Create North Campus Regular Morning Offering
    off_morning = create_program_offering(
        db=db,
        program_version_id=pv["program_version_id"],
        campus_id=f["campus_north_id"],
        academic_year="2026-2027",
        shift="REGULAR_MORNING",
        sanctioned_intake=120,
        supernumerary_quota=12,
        status="PLANNED",
    )
    assert off_morning["shift"] == "REGULAR_MORNING"
    assert off_morning["sanctioned_intake"] == 120

    # 2. Create North Campus Evening Shift Offering (Allowed concurrently)
    off_evening = create_program_offering(
        db=db,
        program_version_id=pv["program_version_id"],
        campus_id=f["campus_north_id"],
        academic_year="2026-2027",
        shift="EVENING",
        sanctioned_intake=60,
        supernumerary_quota=6,
        status="PLANNED",
    )
    assert off_evening["shift"] == "EVENING"

    # 3. Duplicate Offering constraint (same campus, shift, year)
    with pytest.raises(DuplicateOfferingError):
        create_program_offering(
            db=db,
            program_version_id=pv["program_version_id"],
            campus_id=f["campus_north_id"],
            academic_year="2026-2027",
            shift="REGULAR_MORNING",
        )

    # 4. Valid State Machine Transition: PLANNED -> ADMISSIONS_OPEN -> ACTIVE -> CONCLUDED
    t1 = transition_offering_status(db, off_morning["offering_id"], "ADMISSIONS_OPEN")
    assert t1["status"] == "ADMISSIONS_OPEN"

    t2 = transition_offering_status(db, off_morning["offering_id"], "ACTIVE")
    assert t2["status"] == "ACTIVE"

    t3 = transition_offering_status(db, off_morning["offering_id"], "CONCLUDED")
    assert t3["status"] == "CONCLUDED"

    # 5. Invalid Transition: CONCLUDED -> ACTIVE (Must raise error)
    with pytest.raises(InvalidOfferingStateTransitionError):
        transition_offering_status(db, off_morning["offering_id"], "ACTIVE")

    # 6. Update Intake Quota
    updated_off = update_offering_intake(
        db=db,
        offering_id=off_evening["offering_id"],
        sanctioned_intake=75,
        supernumerary_quota=8,
    )
    assert updated_off["sanctioned_intake"] == 75
    assert updated_off["supernumerary_quota"] == 8


def test_specializations_and_tracks(camp03_fixture):
    """Test 5: Verify specialization creation (Major, Minor, Honours/Research)."""
    f = camp03_fixture
    db = f["db"]

    qual = create_qualification_definition(
        db=db,
        tenant_id=f["tenant_id"],
        institution_id=f["institution_id"],
        qualification_code="BTECH_ECE",
        official_title="B.Tech Electronics",
        qualification_level=6.0,
        qualification_category="UNDERGRADUATE",
    )
    prog = create_academic_program(
        db=db,
        tenant_id=f["tenant_id"],
        institution_id=f["institution_id"],
        program_code="ECE-BTECH",
        program_title="Electronics & Communication Engineering",
        qualification_id=qual["qualification_id"],
        primary_academic_unit_id=f["dept_cse_id"],
    )
    pv = create_program_version(
        db=db,
        program_id=prog["program_id"],
        version_code="ECE-2026",
        curriculum_name="2026 ECE Curriculum",
        effective_from=datetime(2026, 7, 1, tzinfo=timezone.utc),
    )

    # 1. Create Major Specialization: VLSI Design (20 credits)
    spec_major = create_program_specialization(
        db=db,
        program_version_id=pv["program_version_id"],
        specialization_code="SPEC-VLSI",
        specialization_title="VLSI & Embedded Systems Design",
        specialization_type="MAJOR",
        required_credits=20.0,
    )
    assert spec_major["specialization_code"] == "SPEC-VLSI"
    assert spec_major["specialization_type"] == "MAJOR"

    # 2. Create Minor Specialization: Robotics & Automation (18 credits)
    spec_minor = create_program_specialization(
        db=db,
        program_version_id=pv["program_version_id"],
        specialization_code="SPEC-ROBOTICS",
        specialization_title="Robotics & Autonomous Systems",
        specialization_type="MINOR",
        required_credits=18.0,
    )
    assert spec_minor["specialization_type"] == "MINOR"

    # 3. List Specializations
    specs = list_program_specializations(db, pv["program_version_id"])
    assert len(specs) == 2
    codes = [s["specialization_code"] for s in specs]
    assert "SPEC-VLSI" in codes
    assert "SPEC-ROBOTICS" in codes
