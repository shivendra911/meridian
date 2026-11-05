"""Tests for PlaceFlow Enterprise Moats:
1. Superday Multi-Track Interview Conflict Resolver
2. Atomic Offer Lock-in & Waitlist Seat Cascading Engine
3. Post-Offer Renege & Ghosting Risk Predictor
4. Coursework-Verified Talent Authenticity Index (VTI)
"""
from datetime import datetime, timedelta, timezone

import pytest

from database.connection import get_db
from operations.authenticity import calculate_talent_authenticity
from operations.cascading import atomic_placement_with_cascading
from operations.common import utcnow
from operations.errors import PlaceFlowError
from operations.superday import auto_resolve_conflicts, detect_conflicts
from ml.renege_predictor import calculate_renege_risk


def test_superday_conflict_detection_and_resolution():
    """Verify that concurrent interview clashes are detected and automatically resolved."""
    db = get_db()

    # Clean up test interviews
    db.interviews.delete_many({"interview_id": {"$in": ["INT881", "INT882"]}})

    base_time = utcnow().replace(hour=10, minute=0, second=0, microsecond=0)

    # Insert two overlapping interviews for the same student (STU001)
    db.interviews.insert_one({
        "interview_id": "INT881",
        "student_id": "STU001",
        "application_id": "APP001",
        "round": "Technical Round 1",
        "scheduled_start": base_time,
        "scheduled_end": base_time + timedelta(minutes=45),
        "mode": "Online",
        "venue": "Room 101",
        "result": "Scheduled",
    })

    # Overlapping by 30 minutes!
    db.interviews.insert_one({
        "interview_id": "INT882",
        "student_id": "STU001",
        "application_id": "APP002",
        "round": "System Architecture",
        "scheduled_start": base_time + timedelta(minutes=15),
        "scheduled_end": base_time + timedelta(minutes=60),
        "mode": "Online",
        "venue": "Room 102",
        "result": "Scheduled",
    })

    # 1. Detect conflicts
    clashes = detect_conflicts(db)
    cand_clashes = [c for c in clashes if c.get("student_id") == "STU001"]
    assert len(cand_clashes) >= 1
    assert cand_clashes[0]["type"] == "CANDIDATE_CLASH"

    # 2. Run Auto-Resolver
    count, msg = auto_resolve_conflicts(db)
    assert count >= 1

    # 3. Verify zero clashes remaining for STU001
    post_clashes = detect_conflicts(db)
    stu_post_clashes = [c for c in post_clashes if c.get("student_id") == "STU001"]
    assert len(stu_post_clashes) == 0

    # Clean up
    db.interviews.delete_many({"interview_id": {"$in": ["INT881", "INT882"]}})


def test_atomic_placement_with_cascading():
    """Verify that when a student upgrades tier, the previous seat is freed and
    automatically cascaded to the top waitlisted candidate in one ACID transaction."""
    db = get_db()
    now = utcnow()

    # Clean up test entities
    db.students.delete_many({"student_id": {"$in": ["STU881", "STU882"]}})
    db.jobs.delete_many({"job_id": {"$in": ["JOB881", "JOB882"]}})
    db.applications.delete_many({"job_id": {"$in": ["JOB881", "JOB882"]}})
    db.placements.delete_many({"student_id": {"$in": ["STU881", "STU882"]}})

    # Student 1: Primary star candidate
    db.students.insert_one({
        "student_id": "STU881", "name": "Star Student", "email": "star@example.com",
        "department": "CSE", "year": 4, "cgpa": 9.5, "backlogs": 0, "skills": ["python", "c++"],
        "placement_status": "Unplaced", "created_at": now
    })

    # Student 2: Waitlisted candidate (CGPA 8.4)
    db.students.insert_one({
        "student_id": "STU882", "name": "Waitlisted Candidate", "email": "wait@example.com",
        "department": "CSE", "year": 4, "cgpa": 8.4, "backlogs": 0, "skills": ["python"],
        "placement_status": "Unplaced", "created_at": now
    })

    # Job 1: Normal Tier (5.0 LPA, 1 vacancy)
    db.jobs.insert_one({
        "job_id": "JOB881", "company_id": "COMP001", "title": "Junior Dev",
        "tier": "Normal", "package_lpa": 5.0, "status": "Open", "vacancies": 1, "filled": 0,
        "deadline": now + timedelta(days=30),
        "eligibility": {"min_cgpa": 7.0, "max_backlogs": 0, "departments": ["CSE"]}
    })

    # Job 2: Dream Tier (14.0 LPA, 1 vacancy)
    db.jobs.insert_one({
        "job_id": "JOB882", "company_id": "COMP002", "title": "SDE-1",
        "tier": "Dream", "package_lpa": 14.0, "status": "Open", "vacancies": 1, "filled": 0,
        "deadline": now + timedelta(days=30),
        "eligibility": {"min_cgpa": 8.0, "max_backlogs": 0, "departments": ["CSE"]}
    })

    # Applications
    db.applications.insert_one({
        "application_id": "APP881", "student_id": "STU881", "job_id": "JOB881",
        "application_date": now, "status": "Shortlisted",
        "status_history": [{"status": "Applied", "at": now}, {"status": "Shortlisted", "at": now}]
    })
    db.applications.insert_one({
        "application_id": "APP882", "student_id": "STU882", "job_id": "JOB881",
        "application_date": now, "status": "Shortlisted",  # On waitlist!
        "status_history": [{"status": "Applied", "at": now}, {"status": "Shortlisted", "at": now}]
    })
    db.applications.insert_one({
        "application_id": "APP883", "student_id": "STU881", "job_id": "JOB882",
        "application_date": now, "status": "Shortlisted",
        "status_history": [{"status": "Applied", "at": now}, {"status": "Shortlisted", "at": now}]
    })

    # Phase 1: Student 1 gets placed in Normal Tier
    plc_1, _ = atomic_placement_with_cascading(db, "STU881", "JOB881")
    assert plc_1.startswith("PLC")

    s1 = db.students.find_one({"student_id": "STU881"})
    assert s1["placement_status"] == "Placed"
    assert s1["highest_tier"] == "Normal"

    job_norm = db.jobs.find_one({"job_id": "JOB881"})
    assert job_norm["filled"] == 1  # 1 seat claimed!
    assert job_norm["status"] == "Closed"

    # Phase 2: Student 1 now upgrades to Dream Tier!
    plc_2, cascaded_to = atomic_placement_with_cascading(db, "STU881", "JOB882")
    assert plc_2.startswith("PLC")
    assert cascaded_to == "STU882"  # Automatically identified top waitlisted candidate!

    # Verify Student 1 updated to Dream
    s1_upgraded = db.students.find_one({"student_id": "STU881"})
    assert s1_upgraded["highest_tier"] == "Dream"

    # Verify Old Job returned vacancy (filled = 0, status = Open)
    job_norm_reopened = db.jobs.find_one({"job_id": "JOB881"})
    assert job_norm_reopened["filled"] == 0
    assert job_norm_reopened["status"] == "Open"

    # Clean up
    db.students.delete_many({"student_id": {"$in": ["STU881", "STU882"]}})
    db.jobs.delete_many({"job_id": {"$in": ["JOB881", "JOB882"]}})
    db.applications.delete_many({"job_id": {"$in": ["JOB881", "JOB882"]}})
    db.placements.delete_many({"student_id": {"$in": ["STU881", "STU882"]}})


def test_talent_authenticity_vti():
    """Verify that VTI accurately rewards verified coursework skills and penalizes backlogs."""
    student_star = {
        "student_id": "STU001",
        "name": "High Performer",
        "department": "CSE",
        "cgpa": 9.4,
        "backlogs": 0,
        "skills": ["python", "c++", "dsa", "mongodb", "git", "linux"]
    }
    vti_star = calculate_talent_authenticity(student_star)
    assert vti_star["vti_score"] >= 75.0
    assert vti_star["badge"] == "Gold Verified"

    student_risk = {
        "student_id": "STU002",
        "name": "Inflated Profile",
        "department": "CSE",
        "cgpa": 5.5,
        "backlogs": 2,
        "skills": ["quantum computing", "robotics"]
    }
    vti_risk = calculate_talent_authenticity(student_risk)
    assert vti_risk["vti_score"] < 60.0
    assert "Unverified" in vti_risk["badge"]


def test_renege_risk_calculation():
    """Verify that placed students receive an objective flight-risk calculation."""
    db = get_db()
    # Find any placed student in DB
    placed = db.students.find_one({"placement_status": "Placed"})
    if placed:
        risk = calculate_renege_risk(db, placed["student_id"])
        assert risk is not None
        assert "renege_probability" in risk
        assert risk["risk_level"] in ("CRITICAL", "MODERATE", "STABLE")
