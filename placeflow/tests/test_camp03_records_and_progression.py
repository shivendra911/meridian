"""Automated Test Suite for CAMP-03 Sub-Phase 3.4:
Academic Records, Progression Rule Engine, ABC Mobility & REST APIs.

Verifies:
1. Append-Only Immutable Credit Ledger & offsetting reversal transactions.
2. SGPA and CGPA calculation math with repeat attempt superseding logic.
3. 6-Step deterministic academic progression pipeline decisions.
4. Student Mobility & Academic Bank of Credits (ABC) APAAR linking.
5. Django REST API endpoints mounted under /api/v4/academic/.
"""

import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "placeflow_core.settings")
django.setup()

from datetime import datetime, timezone
import pytest
from rest_framework.test import APIClient

from database.connection import get_db
from camp_01.tenants import create_tenant
from camp_01.institutions import create_institution
from camp_01.campuses import create_campus
from camp_01.organization import create_organizational_unit
from camp_01.schemas import apply_camp01_foundation_schemas
from camp_02.schemas import setup_camp02_collections
from camp_02.identities import create_person_identity
from camp_02.memberships import create_institutional_membership

from camp_03.schemas import setup_camp03_records_collections
from camp_03.qualifications import create_qualification_definition
from camp_03.programs import create_academic_program, create_program_version, approve_program_version
from camp_03.offerings import create_program_offering
from camp_03.courses import create_course, create_course_version
from camp_03.calendars import create_academic_calendar, create_academic_year, create_academic_term
from camp_03.students import create_student_record, create_cohort_batch, enroll_student_in_program
from camp_03.ledger import (
    record_credit_entry,
    record_credit_reversal,
    get_student_credit_balance,
    list_student_credit_ledger,
    InvalidLedgerOperationError,
)
from camp_03.evaluations import (
    calculate_sgpa,
    calculate_cgpa,
    evaluate_term_summary,
    evaluate_student_progression,
)
from camp_03.mobility import (
    link_student_abc_account,
    record_external_credit_transfer,
    MobilityValidationError,
)


@pytest.fixture
def records_fixture():
    db = get_db()
    apply_camp01_foundation_schemas(db)
    setup_camp02_collections(db)
    setup_camp03_records_collections(db)

    # Clean test fixtures
    db.platform_tenants.delete_many({"slug": "camp03-rec-trust"})
    db.institutions.delete_many({"institution_code": "REC_INST_01"})
    db.person_identities.delete_many({"primary_email": {"$regex": "@rec\\.edu"}})
    db.institution_memberships.delete_many({})
    db.academic_credit_ledger.delete_many({})
    db.academic_term_summaries.delete_many({})
    db.progression_decisions.delete_many({})
    db.academic_bank_of_credits.delete_many({})
    db.course_registrations.delete_many({})

    t = create_tenant(
        name="Records Trust",
        slug="camp03-rec-trust",
        customer_type="EDUCATION_GROUP",
        admin_email="admin@rec.edu",
        db=db,
    )
    inst = create_institution(
        tenant_id=t["id"],
        institution_code="REC_INST_01",
        legal_name="Records University Legal",
        display_name="Records University",
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
        campus_code="REC_CAMP",
        campus_name="Records Campus",
        campus_kind="PHYSICAL",
        status="ACTIVE",
        db=db,
    )
    dept = create_organizational_unit(
        tenant_id=t["id"],
        institution_id=inst["institution_id"],
        unit_code="REC_CS",
        name="Department of Computer Science",
        unit_type="DEPARTMENT",
        db=db,
    )

    # Foundation Program
    qual = create_qualification_definition(
        db=db,
        tenant_id=t["id"],
        institution_id=inst["institution_id"],
        qualification_code="BTECH_REC",
        official_title="Bachelor of Technology in CS",
        qualification_level=6.0,
        qualification_category="UNDERGRADUATE",
    )
    prog = create_academic_program(
        db=db,
        tenant_id=t["id"],
        institution_id=inst["institution_id"],
        program_code="CS-REC",
        program_title="B.Tech Computer Science",
        qualification_id=qual["qualification_id"],
        primary_academic_unit_id=dept["unit_id"],
    )
    pv = create_program_version(
        db=db,
        program_id=prog["program_id"],
        version_code="2026.1",
        curriculum_name="2026 Scheme",
        effective_from=datetime(2026, 7, 1, tzinfo=timezone.utc),
        total_credits_required=160.0,
    )
    approve_program_version(db, pv["program_version_id"], "mem_dean")

    offering = create_program_offering(
        db=db,
        program_version_id=pv["program_version_id"],
        campus_id=campus["campus_id"],
        academic_year="2026-2027",
    )
    cohort = create_cohort_batch(
        db=db,
        program_offering_id=offering["offering_id"],
        cohort_code="COHORT_2026_REC",
        matriculation_year=2026,
        nominal_graduation_year=2030,
    )

    # Student
    person = create_person_identity(primary_email="student@rec.edu", first_name="Kavya", last_name="Iyer", db=db)
    member = create_institutional_membership(tenant_id=t["id"], institution_id=inst["institution_id"], person_id=person["person_id"], membership_type="STUDENT", db=db)
    student = create_student_record(db, t["id"], inst["institution_id"], person["person_id"], member["membership_id"], "REG_REC_01", "26REC01")
    enr = enroll_student_in_program(db, student["student_id"], offering["offering_id"], cohort["cohort_id"])

    # Calendar & Terms
    cal = create_academic_calendar(db, t["id"], inst["institution_id"], "Rec Cal", "SEMESTER")
    ay = create_academic_year(
        db, t["id"], inst["institution_id"], "2026-2027",
        datetime(2026, 7, 1, tzinfo=timezone.utc), datetime(2027, 6, 30, tzinfo=timezone.utc)
    )
    term1 = create_academic_term(db, cal["calendar_id"], ay["academic_year_id"], "REC-T1", "Term 1", 1)
    term2 = create_academic_term(db, cal["calendar_id"], ay["academic_year_id"], "REC-T2", "Term 2", 2)

    return {
        "db": db,
        "tenant_id": t["id"],
        "institution_id": inst["institution_id"],
        "student_id": student["student_id"],
        "enrollment_id": enr["enrollment_id"],
        "academic_year_id": ay["academic_year_id"],
        "term1_id": term1["term_id"],
        "term2_id": term2["term_id"],
        "dept_id": dept["unit_id"],
        "program_id": prog["program_id"],
    }


def test_immutable_credit_ledger_and_reversals(records_fixture):
    """Test 1: Verify append-only immutable credit ledger and offsetting reversals."""
    f = records_fixture
    db = f["db"]
    enr_id = f["enrollment_id"]

    # 1. Award course completion credits (5.0 cr, Major Core)
    c1 = record_credit_entry(
        db=db,
        enrollment_id=enr_id,
        source_type="COURSE_COMPLETION",
        source_record_id="reg_cs101",
        credit_amount=5.0,
        credit_type="ACADEMIC",
        course_category="MAJOR_CORE",
    )
    assert c1["credit_amount"] == 5.0

    # 2. Award vocational/experiential credits (4.0 cr)
    c2 = record_credit_entry(
        db=db,
        enrollment_id=enr_id,
        source_type="VOCATIONAL_EXPERIENTIAL",
        source_record_id="voc_internship_01",
        credit_amount=4.0,
        credit_type="VOCATIONAL",
        course_category="INTERNSHIP_EXPERIENTIAL",
    )
    assert c2["credit_amount"] == 4.0

    # 3. Check cumulative balance
    bal1 = get_student_credit_balance(db, enr_id)
    assert bal1["total_credits_earned"] == 9.0
    assert bal1["credits_by_category"]["MAJOR_CORE"] == 5.0
    assert bal1["credits_by_category"]["INTERNSHIP_EXPERIENTIAL"] == 4.0
    assert bal1["credits_by_type"]["ACADEMIC"] == 5.0
    assert bal1["credits_by_type"]["VOCATIONAL"] == 4.0

    # 4. Reverse the course completion credit via append-only offsetting entry
    rev = record_credit_reversal(
        db=db,
        original_credit_entry_id=c1["credit_entry_id"],
        authorized_by_membership_id="mem_registrar",
        reason="Grade moderation correction: re-evaluation in progress",
    )
    assert rev["credit_amount"] == -5.0
    assert rev["source_type"] == "CREDIT_REVERSAL_ADJUSTMENT"
    assert rev["reversal_reference_id"] == c1["credit_entry_id"]

    # 5. Net balance updates to 4.0 credits without modifying historical records!
    bal2 = get_student_credit_balance(db, enr_id)
    assert bal2["total_credits_earned"] == 4.0
    assert bal2["credits_by_category"]["MAJOR_CORE"] == 0.0
    assert bal2["credits_by_category"]["INTERNSHIP_EXPERIENTIAL"] == 4.0

    # Invariant: 3 ledger entries exist in audit trail
    timeline = list_student_credit_ledger(db, enr_id)
    assert len(timeline) == 3


def test_sgpa_and_cgpa_repeat_attempt_superseding(records_fixture):
    """Test 2: Verify SGPA math and CGPA repeat attempt superseding logic."""
    # Term 1:
    # Course A (4 cr, Grade F / GP 0.0) -> Fail
    # Course B (4 cr, Grade A / GP 8.0) -> Pass
    # SGPA = (4*0 + 4*8) / 8 = 32 / 8 = 4.0
    t1_regs = [
        {"course_id": "CS101", "credits_registered": 4.0, "credits_earned": 0.0, "grade_point": 0.0, "registration_status": "COMPLETED", "attempt_number": 1},
        {"course_id": "CS102", "credits_registered": 4.0, "credits_earned": 4.0, "grade_point": 8.0, "registration_status": "COMPLETED", "attempt_number": 1},
    ]
    sgpa1 = calculate_sgpa(t1_regs)
    assert sgpa1 == 4.0

    cgpa_data1 = calculate_cgpa(t1_regs)
    assert cgpa_data1["cgpa"] == 4.0
    assert cgpa_data1["active_backlogs_count"] == 1

    # Term 2:
    # Course A repeat attempt (4 cr, Grade O / GP 10.0) -> Pass!
    # Course C (4 cr, Grade B+ / GP 7.0) -> Pass!
    # SGPA = (4*10 + 4*7) / 8 = 68 / 8 = 8.5
    t2_regs = [
        {"course_id": "CS101", "credits_registered": 4.0, "credits_earned": 4.0, "grade_point": 10.0, "registration_status": "COMPLETED", "attempt_number": 2},
        {"course_id": "CS201", "credits_registered": 4.0, "credits_earned": 4.0, "grade_point": 7.0, "registration_status": "COMPLETED", "attempt_number": 1},
    ]
    sgpa2 = calculate_sgpa(t2_regs)
    assert sgpa2 == 8.5

    # Cumulative CGPA across all historical attempts:
    # Course A latest attempt is GP 10.0 (supersedes earlier GP 0.0)
    # Course B is GP 8.0
    # Course C is GP 7.0
    # Total credit points = 4*10 + 4*8 + 4*7 = 40 + 32 + 28 = 100
    # Total credits = 12
    # CGPA = 100 / 12 = 8.33
    all_regs = t1_regs + t2_regs
    cgpa_data2 = calculate_cgpa(all_regs)
    assert cgpa_data2["cgpa"] == 8.33
    assert cgpa_data2["total_credits_counted"] == 12.0
    assert cgpa_data2["active_backlogs_count"] == 0  # Course A backlog is cleared!


def test_six_step_progression_pipeline(records_fixture):
    """Test 3: Verify 6-step deterministic progression pipeline classifications."""
    f = records_fixture
    db = f["db"]
    enr_id = f["enrollment_id"]
    ay_id = f["academic_year_id"]

    # Scenario A: 24 credits earned, 0 backlogs -> ELIGIBLE_PROMOTED
    record_credit_entry(db, enr_id, "COURSE_COMPLETION", "rec_01", 24.0)
    p_eligible = evaluate_student_progression(
        db=db,
        enrollment_id=enr_id,
        academic_year_id=ay_id,
        from_sequence=1,
        to_sequence=2,
        promotion_policy={"min_credits_required": 20.0, "max_active_backlogs_permitted": 4},
    )
    assert p_eligible["decision"] == "ELIGIBLE_PROMOTED"
    assert p_eligible["policy_rules_evaluated"][0]["passed"] is True

    # Scenario B: 24 credits earned, but with backlogs -> PROBATIONARY_PROMOTED
    # Record a failed course registration
    db.course_registrations.insert_one({
        "registration_id": "creg_fail_01",
        "enrollment_id": enr_id,
        "offering_id": "off_dummy",
        "course_id": "CS_FAIL_01",
        "term_id": f["term1_id"],
        "attempt_number": 1,
        "registration_type": "REGULAR_CREDIT",
        "registration_status": "COMPLETED",
        "grade_point": 0.0,
        "registered_at": datetime.now(timezone.utc),
    })
    p_probation = evaluate_student_progression(
        db=db,
        enrollment_id=enr_id,
        academic_year_id=ay_id,
        from_sequence=1,
        to_sequence=2,
        promotion_policy={"min_credits_required": 20.0, "max_active_backlogs_permitted": 4},
    )
    assert p_probation["decision"] == "PROBATIONARY_PROMOTED"

    # Scenario C: Deficit credits (< 20.0) -> RETAINED_YEAR_REPEAT
    p_retained = evaluate_student_progression(
        db=db,
        enrollment_id=enr_id,
        academic_year_id=ay_id,
        from_sequence=1,
        to_sequence=2,
        promotion_policy={"min_credits_required": 40.0, "max_active_backlogs_permitted": 4},
    )
    assert p_retained["decision"] == "RETAINED_YEAR_REPEAT"


def test_abc_mobility_and_credit_transfer(records_fixture):
    """Test 4: Verify APAAR / ABC linking and inter-institutional credit transfer."""
    f = records_fixture
    db = f["db"]
    stu_id = f["student_id"]
    enr_id = f["enrollment_id"]

    # 1. Link ABC account
    abc = link_student_abc_account(
        db=db,
        student_id=stu_id,
        apaar_id="998877665544",
        abc_account_id="ABC-REC-2026",
    )
    assert abc["apaar_id"] == "998877665544"
    assert abc["sync_status"] == "SYNCED"

    # Invalid APAAR format raises error
    with pytest.raises(MobilityValidationError):
        link_student_abc_account(db, stu_id, "INVALID_APAAR", "ABC-123")

    # 2. Record external credit transfer from NIT Surat (8.0 credits)
    transfer = record_external_credit_transfer(
        db=db,
        enrollment_id=enr_id,
        external_institution_name="National Institute of Technology Surat",
        external_course_code="NIT-CS301",
        credits_awarded=8.0,
        authorized_by_membership_id="mem_dean_academic",
        course_category="MULTIDISCIPLINARY_MDC",
    )
    assert transfer["credit_amount"] == 8.0
    assert transfer["source_type"] == "INTER_INSTITUTIONAL_TRANSFER"

    # ABC record incremented
    abc_updated = db.academic_bank_of_credits.find_one({"student_id": stu_id})
    assert abc_updated["transferred_in_credits"] == 8.0


def test_academic_rest_api_endpoints(records_fixture):
    """Test 5: Verify DRF endpoints mounted under /api/v4/academic/."""
    f = records_fixture
    client = APIClient()

    # 1. GET /api/v4/academic/programs/
    res_progs = client.get(
        "/api/v4/academic/programs/",
        HTTP_X_TENANT_ID=f["tenant_id"],
        HTTP_X_INSTITUTION_ID=f["institution_id"],
    )
    assert res_progs.status_code == 200
    assert len(res_progs.data["programs"]) >= 1

    # 2. GET /api/v4/academic/qualifications/
    res_quals = client.get(
        "/api/v4/academic/qualifications/",
        HTTP_X_TENANT_ID=f["tenant_id"],
        HTTP_X_INSTITUTION_ID=f["institution_id"],
    )
    assert res_quals.status_code == 200
    assert len(res_quals.data["qualifications"]) >= 1

    # 3. GET /api/v4/academic/students/<enrollment_id>/ledger/
    res_ledger = client.get(f"/api/v4/academic/students/{f['enrollment_id']}/ledger/")
    assert res_ledger.status_code == 200
    assert "balance" in res_ledger.data
    assert "entries" in res_ledger.data

    # 4. POST /api/v4/academic/progression/evaluate/
    res_prog = client.post(
        "/api/v4/academic/progression/evaluate/",
        {
            "enrollment_id": f["enrollment_id"],
            "academic_year_id": f["academic_year_id"],
            "from_sequence": 1,
            "to_sequence": 2,
            "promotion_policy": {"min_credits_required": 5.0, "max_active_backlogs_permitted": 2},
        },
        format="json",
    )
    assert res_prog.status_code == 200
    assert "decision" in res_prog.data
