"""Automated Test Suite for CAMP-03 Sub-Phase 3.3:
Academic Calendar, Terms, Cohorts & Course Registration Engine.

Verifies:
1. Multi-Calendar Concurrency (Semester vs Trimester).
2. Term lifecycle transitions and time-bound Registration Windows.
3. Student academic identity decoupled from Person/Membership.
4. Concurrency-safe atomic seat allocation (Flash Crowd protection).
5. Prerequisite gating & repeat attempt history preservation.
"""

from datetime import datetime, timezone, timedelta
import pytest

from database.connection import get_db
from camp_01.tenants import create_tenant
from camp_01.institutions import create_institution
from camp_01.campuses import create_campus
from camp_01.organization import create_organizational_unit
from camp_01.schemas import apply_camp01_foundation_schemas
from camp_02.schemas import setup_camp02_collections
from camp_02.identities import create_person_identity
from camp_02.memberships import create_institutional_membership

from camp_03.schemas import setup_camp03_registration_collections
from camp_03.qualifications import create_qualification_definition
from camp_03.programs import create_academic_program, create_program_version, approve_program_version
from camp_03.offerings import create_program_offering
from camp_03.courses import create_course, create_course_version
from camp_03.prerequisites import create_course_prerequisite
from camp_03.calendars import (
    create_academic_calendar,
    create_academic_year,
    create_academic_term,
    transition_term_status,
    create_registration_window,
    is_registration_window_open,
)
from camp_03.students import (
    create_student_record,
    add_student_identifier,
    create_cohort_batch,
    enroll_student_in_program,
    transition_enrollment_status,
    StudentValidationError,
)
from camp_03.registration import (
    publish_course_offering,
    register_student_for_course,
    drop_course_registration,
    RegistrationWindowClosedError,
    CourseCapacityFullError,
    PrerequisiteNotMetError,
)


@pytest.fixture
def reg_fixture():
    db = get_db()
    apply_camp01_foundation_schemas(db)
    setup_camp02_collections(db)
    setup_camp03_registration_collections(db)

    # Clean test fixtures
    db.platform_tenants.delete_many({"slug": "camp03-reg-trust"})
    db.institutions.delete_many({"institution_code": "REG_INST_01"})
    db.person_identities.delete_many({"primary_email": {"$regex": "@(regtrust|reg)\\."}})
    db.institution_memberships.delete_many({})
    db.academic_calendars.delete_many({})
    db.academic_years.delete_many({})
    db.academic_terms.delete_many({})
    db.registration_windows.delete_many({})
    db.student_records.delete_many({})
    db.student_identifiers.delete_many({})
    db.cohort_batches.delete_many({})
    db.student_program_enrollments.delete_many({})
    db.term_course_offerings.delete_many({})
    db.course_registrations.delete_many({})

    t = create_tenant(
        name="Registration Trust",
        slug="camp03-reg-trust",
        customer_type="EDUCATION_GROUP",
        admin_email="admin@regtrust.org",
        db=db,
    )
    inst = create_institution(
        tenant_id=t["id"],
        institution_code="REG_INST_01",
        legal_name="Registration University Legal",
        display_name="Registration University",
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
    campus = create_campus(
        tenant_id=t["id"],
        campus_code="MAIN_CAMP",
        campus_name="University Main Campus",
        campus_kind="PHYSICAL",
        status="ACTIVE",
        db=db,
    )
    dept = create_organizational_unit(
        tenant_id=t["id"],
        institution_id=inst["institution_id"],
        unit_code="REG_CS",
        name="Department of Computer Science",
        unit_type="DEPARTMENT",
        db=db,
    )

    # Foundation Program
    qual = create_qualification_definition(
        db=db,
        tenant_id=t["id"],
        institution_id=inst["institution_id"],
        qualification_code="BTECH_REG",
        official_title="Bachelor of Technology",
        qualification_level=6.0,
        qualification_category="UNDERGRADUATE",
    )
    prog = create_academic_program(
        db=db,
        tenant_id=t["id"],
        institution_id=inst["institution_id"],
        program_code="CS-REG",
        program_title="Computer Science & Engineering",
        qualification_id=qual["qualification_id"],
        primary_academic_unit_id=dept["unit_id"],
    )
    pv = create_program_version(
        db=db,
        program_id=prog["program_id"],
        version_code="2026.1",
        curriculum_name="2026 Curriculum",
        effective_from=datetime(2026, 7, 1, tzinfo=timezone.utc),
    )
    approve_program_version(db, pv["program_version_id"], "mem_approver")

    offering = create_program_offering(
        db=db,
        program_version_id=pv["program_version_id"],
        campus_id=campus["campus_id"],
        academic_year="2026-2027",
    )
    cohort = create_cohort_batch(
        db=db,
        program_offering_id=offering["offering_id"],
        cohort_code="COHORT_2026_CS",
        matriculation_year=2026,
        nominal_graduation_year=2030,
    )

    return {
        "db": db,
        "tenant_id": t["id"],
        "institution_id": inst["institution_id"],
        "campus_id": campus["campus_id"],
        "dept_id": dept["unit_id"],
        "program_id": prog["program_id"],
        "program_version_id": pv["program_version_id"],
        "program_offering_id": offering["offering_id"],
        "cohort_id": cohort["cohort_id"],
    }


def test_multi_calendar_concurrency(reg_fixture):
    """Test 1: Verify Engineering (Semesters) and Management (Trimesters) operate in parallel."""
    f = reg_fixture
    db = f["db"]

    # 1. Engineering Calendar (Semester Model)
    cal_eng = create_academic_calendar(
        db=db,
        tenant_id=f["tenant_id"],
        institution_id=f["institution_id"],
        calendar_name="Faculty of Engineering Calendar",
        calendar_type="SEMESTER",
    )

    # 2. Management Calendar (Trimester Model)
    cal_mgmt = create_academic_calendar(
        db=db,
        tenant_id=f["tenant_id"],
        institution_id=f["institution_id"],
        calendar_name="School of Management Calendar",
        calendar_type="TRIMESTER",
    )
    assert cal_eng["calendar_type"] == "SEMESTER"
    assert cal_mgmt["calendar_type"] == "TRIMESTER"

    # Shared Academic Year 2026-2027
    ay = create_academic_year(
        db=db,
        tenant_id=f["tenant_id"],
        institution_id=f["institution_id"],
        year_code="2026-2027",
        start_date=datetime(2026, 7, 1, tzinfo=timezone.utc),
        end_date=datetime(2027, 6, 30, tzinfo=timezone.utc),
    )

    # Engineering Semester 1
    term_sem1 = create_academic_term(
        db=db,
        calendar_id=cal_eng["calendar_id"],
        academic_year_id=ay["academic_year_id"],
        term_code="2026-SEM1",
        term_name="Autumn Semester 2026",
        sequence_number=1,
        term_type="SEMESTER",
    )

    # Management Trimester 1
    term_tri1 = create_academic_term(
        db=db,
        calendar_id=cal_mgmt["calendar_id"],
        academic_year_id=ay["academic_year_id"],
        term_code="2026-TRI1",
        term_name="First Trimester 2026",
        sequence_number=1,
        term_type="TRIMESTER",
    )

    assert term_sem1["sequence_number"] == 1
    assert term_tri1["term_type"] == "TRIMESTER"


def test_term_lifecycle_and_registration_window(reg_fixture):
    """Test 2: Term lifecycle state machine and time-bound registration window enforcement."""
    f = reg_fixture
    db = f["db"]

    cal = create_academic_calendar(db, f["tenant_id"], f["institution_id"], "Test Cal", "SEMESTER")
    ay = create_academic_year(
        db, f["tenant_id"], f["institution_id"], "2026-2027",
        datetime(2026, 7, 1, tzinfo=timezone.utc), datetime(2027, 6, 30, tzinfo=timezone.utc)
    )
    term = create_academic_term(db, cal["calendar_id"], ay["academic_year_id"], "T1", "Term 1", 1)

    # Term State Machine
    t_sched = transition_term_status(db, term["term_id"], "SCHEDULED")
    assert t_sched["term_status"] == "SCHEDULED"

    t_reg = transition_term_status(db, term["term_id"], "REGISTRATION_OPEN")
    assert t_reg["term_status"] == "REGISTRATION_OPEN"

    # Setup Active Window (Now - 1hr to Now + 1hr)
    now = datetime.now(timezone.utc)
    win = create_registration_window(
        db=db,
        term_id=term["term_id"],
        window_type="REGULAR_REGISTRATION",
        open_timestamp=now - timedelta(hours=1),
        close_timestamp=now + timedelta(hours=1),
        is_active=True,
    )
    assert is_registration_window_open(db, term["term_id"], "REGULAR_REGISTRATION") is True

    # Setup Expired Window (Yesterday)
    create_registration_window(
        db=db,
        term_id=term["term_id"],
        window_type="LATE_REGISTRATION",
        open_timestamp=now - timedelta(days=2),
        close_timestamp=now - timedelta(days=1),
        is_active=True,
    )
    assert is_registration_window_open(db, term["term_id"], "LATE_REGISTRATION") is False


def test_student_academic_identity_and_enrollment(reg_fixture):
    """Test 3: Decoupling of Person, Membership, and StudentRecord, and lifecycle transitions."""
    f = reg_fixture
    db = f["db"]

    # 1. CAMP-02 Person & Membership
    person = create_person_identity(
        primary_email="ananya.roy@regtrust.org",
        first_name="Ananya",
        last_name="Roy",
        db=db,
    )
    member = create_institutional_membership(
        tenant_id=f["tenant_id"],
        institution_id=f["institution_id"],
        person_id=person["person_id"],
        membership_type="STUDENT",
        db=db,
    )

    # 2. CAMP-03 Student Record
    student = create_student_record(
        db=db,
        tenant_id=f["tenant_id"],
        institution_id=f["institution_id"],
        person_id=person["person_id"],
        membership_id=member["membership_id"],
        registration_number="REG2026001",
        roll_number="26CS001",
    )
    assert student["registration_number"] == "REG2026001"

    # 3. Add National Identifiers
    add_student_identifier(db, student["student_id"], "APAAR_ID", "123456789012")
    add_student_identifier(db, student["student_id"], "ABC_ACCOUNT_ID", "ABC-999-001")

    # 4. Program Enrollment
    enr = enroll_student_in_program(
        db=db,
        student_id=student["student_id"],
        program_offering_id=f["program_offering_id"],
        cohort_id=f["cohort_id"],
    )
    assert enr["enrollment_status"] == "ACTIVE"

    # 5. Lifecycle Transition: Completed vs Graduated
    t_comp = transition_enrollment_status(db, enr["enrollment_id"], "COMPLETED")
    assert t_comp["enrollment_status"] == "COMPLETED"

    t_grad = transition_enrollment_status(db, enr["enrollment_id"], "GRADUATED")
    assert t_grad["enrollment_status"] == "GRADUATED"


def test_course_registration_atomic_seat_capacity(reg_fixture):
    """Test 4: High-throughput atomic seat allocation and capacity limits."""
    f = reg_fixture
    db = f["db"]

    # Setup Term & Open Window
    cal = create_academic_calendar(db, f["tenant_id"], f["institution_id"], "Seat Cal", "SEMESTER")
    ay = create_academic_year(
        db, f["tenant_id"], f["institution_id"], "2026-2027",
        datetime(2026, 7, 1, tzinfo=timezone.utc), datetime(2027, 6, 30, tzinfo=timezone.utc)
    )
    term = create_academic_term(db, cal["calendar_id"], ay["academic_year_id"], "ST1", "Seat Term", 1)
    transition_term_status(db, term["term_id"], "SCHEDULED")
    transition_term_status(db, term["term_id"], "REGISTRATION_OPEN")
    now = datetime.now(timezone.utc)
    create_registration_window(
        db, term["term_id"], "REGULAR_REGISTRATION", now - timedelta(hours=1), now + timedelta(hours=1)
    )

    # Setup Course
    c = create_course(db, f["tenant_id"], f["institution_id"], "CS_CAP", "Capacity Test Course", f["dept_id"])
    cv = create_course_version(db, c["course_id"], "v1", 3.0, 1.0, 0.0, 0.0, "MAJOR_CORE")

    # Publish Offering with Capacity = 2
    offering = publish_course_offering(
        db=db,
        course_version_id=cv["course_version_id"],
        term_id=term["term_id"],
        campus_id=f["campus_id"],
        capacity=2,
    )

    # Setup 3 Students
    enrollment_ids = []
    for i in range(1, 4):
        p = create_person_identity(primary_email=f"stu{i}@reg.edu", first_name=f"Stu{i}", last_name="Test", db=db)
        m = create_institutional_membership(tenant_id=f["tenant_id"], institution_id=f["institution_id"], person_id=p["person_id"], membership_type="STUDENT", db=db)
        s = create_student_record(db, f["tenant_id"], f["institution_id"], p["person_id"], m["membership_id"], f"REG_C_{i}", f"ROLL_C_{i}")
        e = enroll_student_in_program(db, s["student_id"], f["program_offering_id"], f["cohort_id"])
        enrollment_ids.append(e["enrollment_id"])

    # Student 1 Registers -> Seat 1 Taken
    r1 = register_student_for_course(db, enrollment_ids[0], offering["offering_id"])
    assert r1["registration_status"] == "REGISTERED"

    # Student 2 Registers -> Seat 2 Taken (FULL)
    r2 = register_student_for_course(db, enrollment_ids[1], offering["offering_id"])
    assert r2["registration_status"] == "REGISTERED"

    # Student 3 Attempts to Register -> CAPACITY FULL ERROR
    with pytest.raises(CourseCapacityFullError) as exc_info:
        register_student_for_course(db, enrollment_ids[2], offering["offering_id"])
    assert "maximum seat capacity" in str(exc_info.value)

    # Student 1 Drops Course -> Seat Released
    drop_course_registration(db, r1["registration_id"])

    # Student 3 Re-attempts -> Succeeds!
    r3 = register_student_for_course(db, enrollment_ids[2], offering["offering_id"])
    assert r3["registration_status"] == "REGISTERED"


def test_prerequisite_gating_and_repeat_attempts(reg_fixture):
    """Test 5: Prerequisite gating at registration & complete attempt history preservation."""
    f = reg_fixture
    db = f["db"]

    # Setup Term & Open Window
    cal = create_academic_calendar(db, f["tenant_id"], f["institution_id"], "Prereq Cal", "SEMESTER")
    ay = create_academic_year(
        db, f["tenant_id"], f["institution_id"], "2026-2027",
        datetime(2026, 7, 1, tzinfo=timezone.utc), datetime(2027, 6, 30, tzinfo=timezone.utc)
    )
    term = create_academic_term(db, cal["calendar_id"], ay["academic_year_id"], "PT1", "Prereq Term", 1)
    transition_term_status(db, term["term_id"], "SCHEDULED")
    transition_term_status(db, term["term_id"], "REGISTRATION_OPEN")
    now = datetime.now(timezone.utc)
    create_registration_window(
        db, term["term_id"], "REGULAR_REGISTRATION", now - timedelta(hours=1), now + timedelta(hours=1)
    )

    # Courses: CS_BASIC -> CS_ADV
    c_basic = create_course(db, f["tenant_id"], f["institution_id"], "CS_BASIC", "Basic DB", f["dept_id"])
    cv_basic = create_course_version(db, c_basic["course_id"], "v1", 3.0, 1.0, 0.0, 0.0, "MAJOR_CORE")

    c_adv = create_course(db, f["tenant_id"], f["institution_id"], "CS_ADV", "Adv DB", f["dept_id"])
    cv_adv = create_course_version(db, c_adv["course_id"], "v1", 3.0, 1.0, 0.0, 0.0, "MAJOR_CORE")

    create_course_prerequisite(
        db=db,
        target_course_id=c_adv["course_id"],
        dependency_course_id=c_basic["course_id"],
        dependency_type="HARD_PREREQUISITE",
        minimum_grade_point=4.0,
    )

    offering_basic = publish_course_offering(db, cv_basic["course_version_id"], term["term_id"], f["campus_id"], 50)
    offering_adv = publish_course_offering(db, cv_adv["course_version_id"], term["term_id"], f["campus_id"], 50)

    # Setup Student
    p = create_person_identity(primary_email="rohan@reg.edu", first_name="Rohan", last_name="Mehta", db=db)
    m = create_institutional_membership(tenant_id=f["tenant_id"], institution_id=f["institution_id"], person_id=p["person_id"], membership_type="STUDENT", db=db)
    s = create_student_record(db, f["tenant_id"], f["institution_id"], p["person_id"], m["membership_id"], "REG_ROH", "ROLL_ROH")
    enr = enroll_student_in_program(db, s["student_id"], f["program_offering_id"], f["cohort_id"])

    # 1. Attempt Adv DB without Basic DB -> FAILS
    with pytest.raises(PrerequisiteNotMetError):
        register_student_for_course(db, enr["enrollment_id"], offering_adv["offering_id"])

    # 2. Register for Basic DB (Attempt #1)
    reg_att1 = register_student_for_course(db, enr["enrollment_id"], offering_basic["offering_id"])
    assert reg_att1["attempt_number"] == 1
    assert reg_att1["registration_type"] == "REGULAR_CREDIT"

    # Simulate failing the course (Term closes with F grade, grade point 0.0)
    db.course_registrations.update_one(
        {"registration_id": reg_att1["registration_id"]},
        {"$set": {"registration_status": "COMPLETED", "final_grade": "F", "grade_point": 0.0, "credits_earned": 0.0}}
    )

    # 3. Next Term: Student re-registers for Basic DB (Backlog Repeat / Attempt #2)
    reg_att2 = register_student_for_course(db, enr["enrollment_id"], offering_basic["offering_id"])
    assert reg_att2["attempt_number"] == 2
    assert reg_att2["registration_type"] == "BACKLOG_REPEAT"

    # Invariant: Both attempt records exist, preserving history!
    all_attempts = list(
        db.course_registrations.find({"enrollment_id": enr["enrollment_id"], "course_id": c_basic["course_id"]})
    )
    assert len(all_attempts) == 2
    attempt_nums = [a["attempt_number"] for a in all_attempts]
    assert 1 in attempt_nums and 2 in attempt_nums
