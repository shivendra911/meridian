"""Automated test suite for Cross-Platform Domain Intelligence Engines.

Tests:
1. CAMP-01 Institutional Intelligence (Document extraction & structural consistency audit).
2. CAMP-02 IAM Intelligence (Access privilege reviews, SoD risk signals, roster validation).
3. CAMP-03 Academic Intelligence (Curriculum diffing, course equivalence, knowledge gaps).
"""

import pytest
from campus_ai.domain_institutional import InstitutionalIntelligenceEngine
from campus_ai.domain_iam import IAMIntelligenceEngine
from campus_ai.domain_academic import AcademicIntelligenceEngine


# --- 1. CAMP-01 Institutional Intelligence Tests ---

def test_institutional_document_extraction():
    """Extracts institution name, regulatory codes, campuses and departments from brochure text."""
    engine = InstitutionalIntelligenceEngine()
    brochure = """
    National Institute of Technology Karnataka (Autonomous College)
    AISHE Code: U-0234
    AICTE Approval: 1-9876543210
    Campus: Surathkal Main Campus
    Campus: Mangalore Extension Branch
    Department of Computer Science & Engineering
    Department of Mechanical Engineering
    Department of Electrical & Electronics Engineering
    """

    res = engine.extract_structure_from_text(brochure)
    assert "National Institute of Technology" in res.display_name
    assert res.institution_type == "AUTONOMOUS_COLLEGE"
    assert res.regulatory_identifiers.get("AISHE") == "U-0234"
    assert res.regulatory_identifiers.get("AICTE") == "1-9876543210"
    assert len(res.campuses) >= 2
    assert len(res.departments) >= 3


def test_institutional_structural_consistency_audit():
    """Identifies missing primary campus or orphan organizational units."""
    # Mock database dictionary
    class MockDb:
        def __init__(self):
            self.campuses = MockCollection([
                {"campus_id": "c1", "tenant_id": "t1", "is_primary": False},
                {"campus_id": "c2", "tenant_id": "t1", "is_primary": False},
            ])
            self.organizational_units = MockCollection([
                {"unit_id": "u1", "tenant_id": "t1", "parent_unit_id": "u_missing"},
            ])

    class MockCollection:
        def __init__(self, data):
            self.data = data
        def find(self, query):
            return [d for d in self.data if d.get("tenant_id") == query.get("tenant_id")]

    engine = InstitutionalIntelligenceEngine(db=MockDb())
    audit = engine.audit_institution_consistency("t1")

    assert audit["is_clean"] is False
    codes = [issue["code"] for issue in audit["issues"]]
    assert "NO_PRIMARY_CAMPUS" in codes
    assert "ORPHAN_ORG_UNIT" in codes


# --- 2. CAMP-02 IAM Intelligence Tests ---

def test_iam_access_review_and_sod_detection():
    """Flags accounts with SoD conflicts or active roles while membership is suspended."""
    class MockDb:
        def __init__(self):
            self.account_role_assignments = MockCollection([
                {"assignment_id": "as1", "account_id": "acc_01", "role_id": "ACADEMIC_EVALUATOR", "tenant_id": "t1", "status": "ACTIVE"},
                {"assignment_id": "as2", "account_id": "acc_01", "role_id": "EXAM_CONTROLLER", "tenant_id": "t1", "status": "ACTIVE"},
                {"assignment_id": "as3", "account_id": "acc_02", "role_id": "FACULTY", "tenant_id": "t1", "status": "ACTIVE"},
            ])
            self.institution_memberships = MockCollection([
                {"person_id": "p2", "tenant_id": "t1", "status": "SUSPENDED"},
            ])
            self.user_accounts = MockCollection([
                {"account_id": "acc_01", "person_id": "p1", "tenant_id": "t1"},
                {"account_id": "acc_02", "person_id": "p2", "tenant_id": "t1"},
            ])

    class MockCollection:
        def __init__(self, data):
            self.data = data
        def find(self, query):
            return [d for d in self.data if d.get("tenant_id") == query.get("tenant_id")]

    engine = IAMIntelligenceEngine(db=MockDb())
    review = engine.audit_access_privileges("t1")

    assert review["flags_detected"] >= 2
    reasons = " ".join([f["reason"] for f in review["flags"]])
    assert "SoD violation" in reasons
    assert "SUSPENDED" in reasons


def test_iam_identity_roster_pre_import_validator():
    """Validates national identifiers and duplicate emails prior to bulk provisioning."""
    engine = IAMIntelligenceEngine()
    roster = [
        # Valid row
        {
            "email": "student1@institution.edu",
            "first_name": "Rohan",
            "aadhaar_number": "456789012345",
            "apaar_id": "123456789012",
            "pan_number": "ABCDE1234F",
        },
        # Invalid Aadhaar & bad email
        {
            "email": "invalid_email_format",
            "first_name": "Priya",
            "aadhaar_number": "123",  # Invalid
        },
        # Duplicate email
        {
            "email": "student1@institution.edu",
            "first_name": "Amit",
        },
    ]

    res = engine.validate_identity_roster(roster)
    assert res["is_import_ready"] is False
    assert res["valid_count"] == 1
    assert res["invalid_count"] == 2


# --- 3. CAMP-03 Academic Intelligence Tests ---

def test_academic_curriculum_version_diffing():
    """Calculates added/removed courses and credit delta between curriculum revisions."""
    engine = AcademicIntelligenceEngine()
    v1_courses = [
        {"course_code": "CS101", "total_credits": 4.0},
        {"course_code": "CS102", "total_credits": 4.0},
        {"course_code": "MA101", "total_credits": 4.0},
    ]
    v2_courses = [
        {"course_code": "CS101", "total_credits": 4.0},
        {"course_code": "CS102", "total_credits": 4.0},
        {"course_code": "AI101", "total_credits": 3.0},   # Added
        {"course_code": "CS103", "total_credits": 2.0},   # Added
        # MA101 Removed
    ]

    diff = engine.diff_curriculum_versions("PROG_CSE", v1_courses, v2_courses, "2024.1", "2026.1")
    assert "AI101" in diff.added_courses
    assert "CS103" in diff.added_courses
    assert "MA101" in diff.removed_courses
    assert diff.credit_delta == +1.0  # (13.0 - 12.0)


def test_academic_course_equivalence_suggestion():
    """Recommends course equivalence matches for transfer credits."""
    engine = AcademicIntelligenceEngine()
    source = {"code": "CSE-201", "title": "Data Structures & Algorithms", "total_credits": 4.0, "category": "MAJOR_CORE"}
    candidates = [
        {"code": "CS201", "title": "Data Structures", "total_credits": 4.0, "category": "MAJOR_CORE"},
        {"code": "ME101", "title": "Thermodynamics", "total_credits": 3.0, "category": "MINOR_CORE"},
    ]

    matches = engine.suggest_course_equivalence(source, candidates)
    assert len(matches) >= 1
    top_match = matches[0]
    assert top_match["candidate_course_code"] == "CS201"
    assert top_match["is_recommended"] is True


def test_academic_knowledge_gap_analysis():
    """Identifies missing and weak prerequisite foundations for a student."""
    engine = AcademicIntelligenceEngine()
    target_course = {
        "code": "CS301",
        "title": "Operating Systems",
        "prerequisite_course_codes": ["CS101", "CS201", "MA201"],
    }
    # Student history: CS101 passed with A (9.0), CS201 passed with C (5.0 - weak), MA201 missing
    student_grades = {
        "CS101": {"grade_points": 9.0, "attempts": 1},
        "CS201": {"grade_points": 5.0, "attempts": 1},
    }

    gaps = engine.analyze_student_knowledge_gaps("STU1001", target_course, student_grades)
    assert gaps["is_academically_ready"] is False
    assert gaps["gaps_detected"] == 2  # MA201 missing, CS201 weak foundation

    severities = {g["prerequisite_code"]: g["severity"] for g in gaps["gap_details"]}
    assert severities["MA201"] == "CRITICAL"
    assert severities["CS201"] == "MEDIUM"

