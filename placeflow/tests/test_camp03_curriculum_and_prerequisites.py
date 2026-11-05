"""Automated Test Suite for CAMP-03 Sub-Phase 3.2:
Curriculum, Course Registry & NEP 2020 Credit Architecture.

Verifies:
1. L-T-P-S credit calculation engine (L + T + P/2 + S/3) and NEP course categories.
2. Curriculum Requirement Groups & Course requirement bindings.
3. NEP 2020 Multiple Exit Qualification rules (Certificate 40cr, Diploma 80cr, Degree 120cr).
4. Prerequisite DAG evaluation (Hard, Soft, Co-requisite, Mutually Exclusive).
5. Graph Cycle Detection preventing circular prerequisite loops.
"""

from datetime import datetime, timezone
import pytest

from database.connection import get_db
from camp_01.tenants import create_tenant
from camp_01.institutions import create_institution
from camp_01.organization import create_organizational_unit
from camp_01.schemas import apply_camp01_foundation_schemas
from camp_02.schemas import setup_camp02_collections

from camp_03.schemas import setup_camp03_curriculum_collections
from camp_03.qualifications import create_qualification_definition
from camp_03.programs import create_academic_program, create_program_version, approve_program_version
from camp_03.courses import (
    calculate_ltps_credits,
    create_course,
    create_course_version,
    get_course,
    get_course_version,
    list_courses,
    DuplicateCourseError,
    CourseValidationError,
)
from camp_03.curriculum import (
    create_requirement_group,
    get_requirement_group,
    list_requirement_groups,
    add_course_to_requirement_group,
    list_group_course_requirements,
    create_multiple_exit_rule,
    list_multiple_exit_rules,
    CurriculumValidationError,
)
from camp_03.prerequisites import (
    create_course_prerequisite,
    get_course_prerequisites,
    check_prerequisite_satisfaction,
    PrerequisiteCycleError,
    PrerequisiteValidationError,
)


@pytest.fixture
def curriculum_fixture():
    db = get_db()
    apply_camp01_foundation_schemas(db)
    setup_camp02_collections(db)
    setup_camp03_curriculum_collections(db)

    # Clean test fixtures
    db.platform_tenants.delete_many({"slug": "camp03-curric-trust"})
    db.institutions.delete_many({"institution_code": "CU_01"})
    db.courses.delete_many({})
    db.course_versions.delete_many({})
    db.curriculum_requirement_groups.delete_many({})
    db.curriculum_course_requirements.delete_many({})
    db.curriculum_prerequisites.delete_many({})
    db.multiple_exit_rules.delete_many({})

    t = create_tenant(
        name="Curriculum Educational Trust",
        slug="camp03-curric-trust",
        customer_type="EDUCATION_GROUP",
        admin_email="admin@curric.edu",
        db=db,
    )
    inst = create_institution(
        tenant_id=t["id"],
        institution_code="CU_01",
        legal_name="Curriculum University Legal",
        display_name="Curriculum University",
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
    dept_cs = create_organizational_unit(
        tenant_id=t["id"],
        institution_id=inst["institution_id"],
        unit_code="CS_DEPT",
        name="Department of Computer Science",
        unit_type="DEPARTMENT",
        db=db,
    )
    qual = create_qualification_definition(
        db=db,
        tenant_id=t["id"],
        institution_id=inst["institution_id"],
        qualification_code="BTECH_CS",
        official_title="Bachelor of Technology in CS",
        qualification_level=6.0,
        qualification_category="UNDERGRADUATE",
    )
    prog = create_academic_program(
        db=db,
        tenant_id=t["id"],
        institution_id=inst["institution_id"],
        program_code="CS-BTECH",
        program_title="B.Tech Computer Science",
        qualification_id=qual["qualification_id"],
        primary_academic_unit_id=dept_cs["unit_id"],
    )
    pv = create_program_version(
        db=db,
        program_id=prog["program_id"],
        version_code="CURR-2026",
        curriculum_name="2026 NEP CCFUG Scheme",
        effective_from=datetime(2026, 7, 1, tzinfo=timezone.utc),
        total_credits_required=160.0,
    )
    approve_program_version(db, pv["program_version_id"], "mem_dean")

    return {
        "db": db,
        "tenant_id": t["id"],
        "institution_id": inst["institution_id"],
        "dept_id": dept_cs["unit_id"],
        "program_id": prog["program_id"],
        "program_version_id": pv["program_version_id"],
    }


def test_ltps_credit_calculation_and_courses(curriculum_fixture):
    """Test 1: Verify L-T-P-S credit calculation and course version registration."""
    f = curriculum_fixture
    db = f["db"]

    # 1. Math Formula Verifications
    # 3-1-2-0 -> 3 + 1 + 2/2 + 0/3 = 5.0
    assert calculate_ltps_credits(3.0, 1.0, 2.0, 0.0) == 5.0
    # 1-0-0-6 -> 1 + 0 + 0 + 6/3 = 3.0
    assert calculate_ltps_credits(1.0, 0.0, 0.0, 6.0) == 3.0
    # 0-0-4-0 -> 0 + 0 + 4/2 + 0 = 2.0
    assert calculate_ltps_credits(0.0, 0.0, 4.0, 0.0) == 2.0

    # 2. Create Master Course: Programming Fundamentals
    course_cs101 = create_course(
        db=db,
        tenant_id=f["tenant_id"],
        institution_id=f["institution_id"],
        course_code="CS101",
        course_title="Programming Fundamentals",
        offering_academic_unit_id=f["dept_id"],
        course_level=100,
    )
    assert course_cs101["course_code"] == "CS101"

    # 3. Create Course Version with L=3, T=1, P=2, S=0 (5 Credits, MAJOR_CORE)
    cv_cs101 = create_course_version(
        db=db,
        course_id=course_cs101["course_id"],
        version_code="2026.1",
        lecture_hours_per_week=3.0,
        tutorial_hours_per_week=1.0,
        practical_hours_per_week=2.0,
        studio_self_study_hours=0.0,
        course_category="MAJOR_CORE",
        syllabus_learning_outcomes=["Understand variables and control flow", "Implement basic algorithms in Python"],
    )
    assert cv_cs101["calculated_credits"] == 5.0
    assert cv_cs101["total_credits"] == 5.0
    assert cv_cs101["course_category"] == "MAJOR_CORE"

    # 4. NEP Ability Enhancement Course (AEC): Technical Communication (2 Credits)
    course_aec = create_course(
        db=db,
        tenant_id=f["tenant_id"],
        institution_id=f["institution_id"],
        course_code="AEC101",
        course_title="Technical Communication & Professional Ethics",
        offering_academic_unit_id=f["dept_id"],
        course_level=100,
    )
    cv_aec = create_course_version(
        db=db,
        course_id=course_aec["course_id"],
        version_code="2026.1",
        lecture_hours_per_week=2.0,
        tutorial_hours_per_week=0.0,
        practical_hours_per_week=0.0,
        studio_self_study_hours=0.0,
        course_category="ABILITY_ENHANCEMENT_AEC",
    )
    assert cv_aec["calculated_credits"] == 2.0
    assert cv_aec["course_category"] == "ABILITY_ENHANCEMENT_AEC"

    # 5. Invalid course category rejected
    with pytest.raises(CourseValidationError):
        create_course_version(
            db=db,
            course_id=course_cs101["course_id"],
            version_code="2026.2",
            course_category="INVALID_CATEGORY",
        )


def test_curriculum_requirement_groups_and_bindings(curriculum_fixture):
    """Test 2: Verify curriculum requirement groups and course assignment."""
    f = curriculum_fixture
    db = f["db"]
    pv_id = f["program_version_id"]

    # 1. Create Core Group (Mandatory, 24 Credits)
    core_group = create_requirement_group(
        db=db,
        program_version_id=pv_id,
        group_name="Core Computing Foundation",
        group_type="COMPULSORY_CORE",
        minimum_credits=24.0,
        maximum_credits=24.0,
        is_mandatory=True,
    )
    assert core_group["group_name"] == "Core Computing Foundation"

    # 2. Create Open Elective Basket (Min 8, Max 12 Credits)
    elective_basket = create_requirement_group(
        db=db,
        program_version_id=pv_id,
        group_name="Interdisciplinary Open Elective Basket",
        group_type="ELECTIVE_BASKET",
        minimum_credits=8.0,
        maximum_credits=12.0,
        is_mandatory=False,
    )
    assert elective_basket["minimum_credits"] == 8.0
    assert elective_basket["maximum_credits"] == 12.0

    # 3. Add Course to Core Group
    c1 = create_course(db, f["tenant_id"], f["institution_id"], "CS201", "Data Structures", f["dept_id"], 200)
    cv1 = create_course_version(db, c1["course_id"], "2026.1", 3.0, 1.0, 2.0, 0.0, "MAJOR_CORE")
    req = add_course_to_requirement_group(
        db=db,
        group_id=core_group["group_id"],
        course_id=c1["course_id"],
        course_version_id=cv1["course_version_id"],
        is_compulsory=True,
        recommended_term_sequence=3,
    )
    assert req["recommended_term_sequence"] == 3
    assert req["is_compulsory"] is True

    # 4. List group courses
    courses_in_group = list_group_course_requirements(db, core_group["group_id"])
    assert len(courses_in_group) == 1
    assert courses_in_group[0]["course_id"] == c1["course_id"]


def test_nep_multiple_exit_qualification_rules(curriculum_fixture):
    """Test 3: Verify NEP 2020 intermediate exit award milestone definitions."""
    f = curriculum_fixture
    db = f["db"]
    pv_id = f["program_version_id"]

    # 1. Year 1 Exit: Undergraduate Certificate (40 credits + 4 cr internship)
    rule_cert = create_multiple_exit_rule(
        db=db,
        program_version_id=pv_id,
        exit_qualification_id="qual_ug_cert",
        exit_credential_title="Undergraduate Certificate in Computing",
        minimum_earned_credits=40.0,
        required_internship_credits=4.0,
    )
    assert rule_cert["minimum_earned_credits"] == 40.0

    # 2. Year 2 Exit: Undergraduate Diploma (80 credits + 4 cr internship)
    rule_dip = create_multiple_exit_rule(
        db=db,
        program_version_id=pv_id,
        exit_qualification_id="qual_ug_dip",
        exit_credential_title="Undergraduate Diploma in Computer Science",
        minimum_earned_credits=80.0,
        required_internship_credits=4.0,
    )
    assert rule_dip["minimum_earned_credits"] == 80.0

    # 3. Year 3 Exit: Bachelor of Science (120 credits)
    rule_bsc = create_multiple_exit_rule(
        db=db,
        program_version_id=pv_id,
        exit_qualification_id="qual_bsc_cs",
        exit_credential_title="Bachelor of Science in Computer Science",
        minimum_earned_credits=120.0,
        required_internship_credits=0.0,
    )
    assert rule_bsc["minimum_earned_credits"] == 120.0

    # 4. Retrieve rules
    rules = list_multiple_exit_rules(db, pv_id)
    assert len(rules) == 3
    assert [r["minimum_earned_credits"] for r in rules] == [40.0, 80.0, 120.0]


def test_prerequisite_dag_satisfaction(curriculum_fixture):
    """Test 4: Verify prerequisite dependencies, co-requisites, and readiness checker."""
    f = curriculum_fixture
    db = f["db"]

    # Setup Courses: CS101 -> CS201 (Hard Prereq), CS201L (Co-req with CS201), STAT101 vs STAT201 (Mutually Exclusive)
    c_cs101 = create_course(db, f["tenant_id"], f["institution_id"], "PR_CS101", "Prog Fundamentals", f["dept_id"])
    c_cs201 = create_course(db, f["tenant_id"], f["institution_id"], "PR_CS201", "Data Structures", f["dept_id"])
    c_cs201L = create_course(db, f["tenant_id"], f["institution_id"], "PR_CS201L", "DS Lab", f["dept_id"])
    c_stat101 = create_course(db, f["tenant_id"], f["institution_id"], "PR_STAT101", "Basic Stats", f["dept_id"])
    c_stat201 = create_course(db, f["tenant_id"], f["institution_id"], "PR_STAT201", "Adv Stats", f["dept_id"])

    # 1. Hard Prereq: CS201 requires CS101 with min grade point 4.0
    create_course_prerequisite(
        db=db,
        target_course_id=c_cs201["course_id"],
        dependency_course_id=c_cs101["course_id"],
        dependency_type="HARD_PREREQUISITE",
        minimum_grade_point=4.0,
    )

    # 2. Co-requisite: CS201L requires CS201
    create_course_prerequisite(
        db=db,
        target_course_id=c_cs201L["course_id"],
        dependency_course_id=c_cs201["course_id"],
        dependency_type="CO_REQUISITE",
    )

    # 3. Mutually Exclusive: STAT201 vs STAT101
    create_course_prerequisite(
        db=db,
        target_course_id=c_stat201["course_id"],
        dependency_course_id=c_stat101["course_id"],
        dependency_type="MUTUALLY_EXCLUSIVE",
    )

    # Case A: Student passed CS101 with GP 8.0 -> Eligible for CS201
    res_a = check_prerequisite_satisfaction(
        db=db,
        completed_course_grades={c_cs101["course_id"]: 8.0},
        attempted_course_ids={c_cs101["course_id"]},
        concurrent_registered_course_ids=set(),
        target_course_id=c_cs201["course_id"],
    )
    assert res_a["is_satisfied"] is True

    # Case B: Student has NOT passed CS101 -> Blocked for CS201
    res_b = check_prerequisite_satisfaction(
        db=db,
        completed_course_grades={},
        attempted_course_ids=set(),
        concurrent_registered_course_ids=set(),
        target_course_id=c_cs201["course_id"],
    )
    assert res_b["is_satisfied"] is False
    assert len(res_b["missing_hard_prerequisites"]) == 1

    # Case C: Student registering for CS201L concurrently with CS201 -> Satisfied
    res_c = check_prerequisite_satisfaction(
        db=db,
        completed_course_grades={},
        attempted_course_ids=set(),
        concurrent_registered_course_ids={c_cs201["course_id"]},
        target_course_id=c_cs201L["course_id"],
    )
    assert res_c["is_satisfied"] is True

    # Case D: Student already completed STAT101, attempts to register for STAT201 -> Blocked by mutual exclusivity
    res_d = check_prerequisite_satisfaction(
        db=db,
        completed_course_grades={c_stat101["course_id"]: 7.0},
        attempted_course_ids={c_stat101["course_id"]},
        concurrent_registered_course_ids=set(),
        target_course_id=c_stat201["course_id"],
    )
    assert res_d["is_satisfied"] is False
    assert len(res_d["mutually_exclusive_clashes"]) == 1


def test_prerequisite_graph_cycle_detection(curriculum_fixture):
    """Test 5: Verify DAG cycle detection algorithms prevent circular prerequisites."""
    f = curriculum_fixture
    db = f["db"]

    cA = create_course(db, f["tenant_id"], f["institution_id"], "CYC_A", "Course A", f["dept_id"])
    cB = create_course(db, f["tenant_id"], f["institution_id"], "CYC_B", "Course B", f["dept_id"])
    cC = create_course(db, f["tenant_id"], f["institution_id"], "CYC_C", "Course C", f["dept_id"])

    # 1. Direct Self-Loop Check (cA depends on cA)
    with pytest.raises(PrerequisiteCycleError):
        create_course_prerequisite(
            db=db,
            target_course_id=cA["course_id"],
            dependency_course_id=cA["course_id"],
            dependency_type="HARD_PREREQUISITE",
        )

    # 2. Setup A depends on B
    create_course_prerequisite(
        db=db,
        target_course_id=cA["course_id"],
        dependency_course_id=cB["course_id"],
        dependency_type="HARD_PREREQUISITE",
    )

    # 3. Two-node cycle: Attempt B depends on A (Must fail)
    with pytest.raises(PrerequisiteCycleError) as exc_info:
        create_course_prerequisite(
            db=db,
            target_course_id=cB["course_id"],
            dependency_course_id=cA["course_id"],
            dependency_type="HARD_PREREQUISITE",
        )
    assert "Cyclic dependency detected" in str(exc_info.value)

    # 4. Setup B depends on C (Chain: A -> B -> C)
    create_course_prerequisite(
        db=db,
        target_course_id=cB["course_id"],
        dependency_course_id=cC["course_id"],
        dependency_type="HARD_PREREQUISITE",
    )

    # 5. Three-node transitive cycle: Attempt C depends on A (Must fail: C -> A -> B -> C)
    with pytest.raises(PrerequisiteCycleError) as exc_transitive:
        create_course_prerequisite(
            db=db,
            target_course_id=cC["course_id"],
            dependency_course_id=cA["course_id"],
            dependency_type="HARD_PREREQUISITE",
        )
    assert "Cyclic dependency detected" in str(exc_transitive.value)

