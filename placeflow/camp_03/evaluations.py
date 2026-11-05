"""Academic Records, GPA Calculation & 6-Step Progression Engine for CAMP-03.

Implements configurable UGC 10-point grading, SGPA/CGPA calculations with repeat-attempt
resolution, and the 6-step deterministic academic progression evaluation pipeline.
"""

from datetime import datetime, timezone
import uuid
from typing import Dict, Any, List, Optional
from pymongo.database import Database

from camp_03.courses import get_course_version
from camp_03.calendars import get_academic_term


class EvaluationError(Exception):
    pass


class ProgressionRuleError(Exception):
    pass


UGC_GRADE_POINTS = {
    "O": 10.0,
    "A+": 9.0,
    "A": 8.0,
    "B+": 7.0,
    "B": 6.0,
    "C": 5.0,
    "P": 4.0,
    "F": 0.0,
    "AB": 0.0,
}


def calculate_sgpa(registrations: List[Dict[str, Any]]) -> float:
    """Calculate Semester Grade Point Average (SGPA).

    Formula:
        SGPA = Sum(Credits_i * GradePoint_i) / Sum(Credits_i)
    """
    total_credit_points = 0.0
    total_credits = 0.0

    for r in registrations:
        if r.get("registration_status") != "COMPLETED":
            continue
        c = float(r.get("credits_registered", r.get("credits_earned", 0.0)))
        gp = r.get("grade_point")
        if gp is not None and c > 0:
            total_credit_points += c * float(gp)
            total_credits += c

    if total_credits == 0:
        return 0.0
    return round(total_credit_points / total_credits, 2)


def calculate_cgpa(all_registrations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate Cumulative Grade Point Average (CGPA) with repeat attempt superseding.

    If a course was attempted multiple times (e.g. failed in Term 1, passed in Term 3),
    the latest attempt's grade point supersedes prior attempts in the cumulative CGPA.
    """
    # Group registrations by course_id
    by_course: Dict[str, List[Dict[str, Any]]] = {}
    for r in all_registrations:
        if r.get("registration_status") != "COMPLETED":
            continue
        cid = r["course_id"]
        by_course.setdefault(cid, []).append(r)

    total_credit_points = 0.0
    total_credits = 0.0
    active_backlogs = 0

    for cid, attempts in by_course.items():
        # Sort by attempt_number ascending so the latest attempt is last
        attempts.sort(key=lambda x: x.get("attempt_number", 1))
        latest = attempts[-1]

        c = float(latest.get("credits_registered", latest.get("credits_earned", 0.0)))
        gp = latest.get("grade_point")

        if gp is not None and c > 0:
            total_credit_points += c * float(gp)
            total_credits += c

        # Check if latest attempt is failed
        if gp is None or float(gp) < 4.0:
            active_backlogs += 1

    cgpa = round(total_credit_points / total_credits, 2) if total_credits > 0 else 0.0
    return {
        "cgpa": cgpa,
        "total_credits_counted": total_credits,
        "active_backlogs_count": active_backlogs,
    }


def evaluate_term_summary(
    db: Database, enrollment_id: str, term_id: str
) -> Dict[str, Any]:
    """Calculate and persist academic term summary (SGPA, CGPA, Backlogs, Standing)."""
    term_regs = list(
        db.course_registrations.find({"enrollment_id": enrollment_id, "term_id": term_id})
    )
    all_regs = list(db.course_registrations.find({"enrollment_id": enrollment_id}))

    sgpa = calculate_sgpa(term_regs)
    cgpa_data = calculate_cgpa(all_regs)
    cgpa = cgpa_data["cgpa"]
    active_backlogs = cgpa_data["active_backlogs_count"]

    # Term credits
    term_reg_credits = sum(float(r.get("credits_registered", 0.0)) for r in term_regs)
    term_earned_credits = sum(
        float(r.get("credits_earned", 0.0))
        for r in term_regs
        if r.get("grade_point") is not None and float(r["grade_point"]) >= 4.0
    )

    # All cumulative credits earned
    from camp_03.ledger import get_student_credit_balance
    bal = get_student_credit_balance(db, enrollment_id)
    cum_earned = bal["total_credits_earned"]

    # Academic Standing State
    if active_backlogs == 0 and cgpa >= 5.0:
        standing = "GOOD_STANDING"
    elif active_backlogs <= 2 or cgpa < 5.0:
        standing = "ACADEMIC_WARNING"
    elif active_backlogs <= 4:
        standing = "PROBATION"
    elif active_backlogs > 4:
        standing = "CRITICAL_PROBATION"
    else:
        standing = "DISQUALIFIED_FROM_PROMOTION"

    now = datetime.now(timezone.utc)
    s_id = f"ats_{uuid.uuid4().hex[:12]}"

    doc = {
        "summary_id": s_id,
        "enrollment_id": enrollment_id,
        "term_id": term_id,
        "term_credits_registered": round(term_reg_credits, 2),
        "term_credits_earned": round(term_earned_credits, 2),
        "cumulative_credits_earned": round(cum_earned, 2),
        "sgpa": float(sgpa),
        "cgpa": float(cgpa),
        "active_backlogs_count": int(active_backlogs),
        "academic_standing": standing,
        "evaluated_at": now,
    }

    db.academic_term_summaries.update_one(
        {"enrollment_id": enrollment_id, "term_id": term_id},
        {"$set": doc},
        upsert=True,
    )

    try:
        from camp_01.outbox import publish_event
        publish_event(
            event_type="AcademicStandingChanged",
            aggregate_type="ACADEMIC_STANDING",
            aggregate_id=enrollment_id,
            tenant_id="global",
            payload={
                "enrollment_id": enrollment_id,
                "term_id": term_id,
                "sgpa": sgpa,
                "cgpa": cgpa,
                "standing": standing,
                "active_backlogs": active_backlogs,
            },
            db=db,
        )
    except Exception:
        pass

    return doc


def evaluate_student_progression(
    db: Database,
    enrollment_id: str,
    academic_year_id: str,
    from_sequence: int = 1,
    to_sequence: int = 2,
    promotion_policy: Optional[Dict[str, Any]] = None,
    authorized_by_membership_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Execute the 6-step deterministic academic progression evaluation pipeline.

    1. Trigger: End of academic term / year evaluation window.
    2. Context: Program enrollment, curriculum version, and sequence progression.
    3. Academic Facts: Cumulative credits, CGPA, and active backlogs.
    4. Applicable Policy Resolution: Minimum credits required and backlog limits.
    5. Deterministic Rule Evaluation: Evaluates promotion criteria without ambiguity.
    6. Decision & History: Persists immutable decision record.
    """
    # 2. Context
    enr = db.student_program_enrollments.find_one({"enrollment_id": enrollment_id})
    if not enr:
        raise EvaluationError(f"Enrollment '{enrollment_id}' not found")

    # 3. Facts
    all_regs = list(db.course_registrations.find({"enrollment_id": enrollment_id}))
    cgpa_data = calculate_cgpa(all_regs)
    from camp_03.ledger import get_student_credit_balance
    bal = get_student_credit_balance(db, enrollment_id)
    credits_earned = bal["total_credits_earned"]
    backlogs = cgpa_data["active_backlogs_count"]

    # 4. Policy Resolution
    policy = promotion_policy or {
        "min_credits_required": 20.0,
        "max_active_backlogs_permitted": 4,
    }
    min_credits = float(policy.get("min_credits_required", 20.0))
    max_backlogs = int(policy.get("max_active_backlogs_permitted", 4))

    # 5. Deterministic Evaluation
    rules_evaluated = [
        {
            "rule_name": "MIN_CREDITS_THRESHOLD",
            "required": min_credits,
            "actual": credits_earned,
            "passed": credits_earned >= min_credits,
        },
        {
            "rule_name": "MAX_BACKLOGS_LIMIT",
            "permitted": max_backlogs,
            "actual": backlogs,
            "passed": backlogs <= max_backlogs,
        },
    ]

    all_passed = all(r["passed"] for r in rules_evaluated)

    if all_passed:
        if backlogs == 0:
            decision = "ELIGIBLE_PROMOTED"
        else:
            decision = "PROBATIONARY_PROMOTED"
    else:
        decision = "RETAINED_YEAR_REPEAT"

    now = datetime.now(timezone.utc)
    d_id = f"progdec_{uuid.uuid4().hex[:12]}"

    doc = {
        "decision_id": d_id,
        "enrollment_id": enrollment_id,
        "academic_year_id": academic_year_id,
        "from_sequence": int(from_sequence),
        "to_sequence": int(to_sequence),
        "decision": decision,
        "policy_rules_evaluated": rules_evaluated,
        "authorized_by_membership_id": authorized_by_membership_id,
        "evaluated_at": now,
    }

    db.progression_decisions.insert_one(doc)

    try:
        from camp_01.outbox import publish_event
        publish_event(
            event_type="ProgressionDecisionRecorded",
            aggregate_type="PROGRESSION_DECISION",
            aggregate_id=d_id,
            tenant_id="global",
            payload={
                "enrollment_id": enrollment_id,
                "academic_year_id": academic_year_id,
                "decision": decision,
                "from_sequence": from_sequence,
                "to_sequence": to_sequence,
            },
            db=db,
        )
    except Exception:
        pass

    return doc

