"""CAMP-03 Academic & Curriculum Intelligence Engine.

Section 8 of Campus AI Architecture:
Curriculum version diffing, course equivalence suggestions for transfer mobility,
and prerequisite knowledge-gap analysis.
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Set


@dataclass
class CurriculumDiffResult:
    program_id: str
    base_version: str
    target_version: str
    added_courses: List[str]
    removed_courses: List[str]
    credit_delta: float
    summary: str


class AcademicIntelligenceEngine:
    """Curriculum analysis and student learning intelligence assistant for CAMP-03."""

    def __init__(self, db=None):
        self.db = db

    def diff_curriculum_versions(
        self,
        program_id: str,
        base_courses: List[Dict[str, Any]],
        target_courses: List[Dict[str, Any]],
        base_version_label: str = "v1.0",
        target_version_label: str = "v2.0",
    ) -> CurriculumDiffResult:
        """Compares two curriculum versions to identify structural and credit shifts."""
        base_codes = {c.get("course_code"): c for c in base_courses if c.get("course_code")}
        target_codes = {c.get("course_code"): c for c in target_courses if c.get("course_code")}

        added = [code for code in target_codes if code not in base_codes]
        removed = [code for code in base_codes if code not in target_codes]

        base_credits = sum(float(c.get("total_credits", 0.0)) for c in base_courses)
        target_credits = sum(float(c.get("total_credits", 0.0)) for c in target_courses)
        delta = round(target_credits - base_credits, 2)

        summary = (
            f"Curriculum transition from {base_version_label} to {target_version_label}: "
            f"+{len(added)} added courses, -{len(removed)} removed courses. "
            f"Total credits change: {delta:+} credits ({base_credits} -> {target_credits})."
        )

        return CurriculumDiffResult(
            program_id=program_id,
            base_version=base_version_label,
            target_version=target_version_label,
            added_courses=added,
            removed_courses=removed,
            credit_delta=delta,
            summary=summary,
        )

    def suggest_course_equivalence(
        self,
        source_course: Dict[str, Any],
        candidate_courses: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Suggests matching equivalent courses for student credit mobility (ABC transfer)."""
        src_title = str(source_course.get("title", "")).lower()
        src_credits = float(source_course.get("total_credits", 0.0))
        src_category = str(source_course.get("category", "")).upper()

        matches = []
        for cand in candidate_courses:
            cand_title = str(cand.get("title", "")).lower()
            cand_credits = float(cand.get("total_credits", 0.0))
            cand_category = str(cand.get("category", "")).upper()

            # 1. Title token overlap
            src_words = set(src_title.split())
            cand_words = set(cand_title.split())
            overlap = len(src_words.intersection(cand_words))
            title_sim = overlap / max(1, len(src_words.union(cand_words)))

            # 2. Credit alignment penalty
            credit_diff = abs(src_credits - cand_credits)
            credit_score = max(0.0, 1.0 - (credit_diff * 0.25))

            # 3. Category match
            cat_score = 1.0 if src_category == cand_category else 0.5

            composite_score = round((title_sim * 0.5) + (credit_score * 0.3) + (cat_score * 0.2), 3)

            if composite_score >= 0.4:
                matches.append(
                    {
                        "source_course_code": source_course.get("code"),
                        "candidate_course_code": cand.get("code"),
                        "candidate_title": cand.get("title"),
                        "equivalence_score": composite_score,
                        "is_recommended": composite_score >= 0.7,
                    }
                )

        matches.sort(key=lambda x: x["equivalence_score"], reverse=True)
        return matches

    def analyze_student_knowledge_gaps(
        self,
        student_id: str,
        target_course: Dict[str, Any],
        student_grades: Dict[str, Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Identifies prerequisite foundations where student may require remedial attention.

        Args:
            student_id: Student identifier.
            target_course: Target advanced course with prerequisite list.
            student_grades: Map of {course_code: {"grade": "A", "grade_points": 9.0, "attempts": 1}}.
        """
        prereqs: List[str] = target_course.get("prerequisite_course_codes", [])
        gaps = []

        for p_code in prereqs:
            hist = student_grades.get(p_code)
            if not hist:
                gaps.append(
                    {
                        "prerequisite_code": p_code,
                        "status": "MISSING",
                        "severity": "CRITICAL",
                        "recommendation": f"Must successfully complete prerequisite '{p_code}' before registering.",
                    }
                )
            else:
                pts = float(hist.get("grade_points", 0.0))
                attempts = int(hist.get("attempts", 1))
                if pts < 6.0:  # Grade C or below
                    gaps.append(
                        {
                            "prerequisite_code": p_code,
                            "status": "WEAK_FOUNDATION",
                            "severity": "MEDIUM",
                            "recommendation": f"Earned grade points ({pts}) in '{p_code}'. Recommended review of foundational topics.",
                        }
                    )
                elif attempts > 1:
                    gaps.append(
                        {
                            "prerequisite_code": p_code,
                            "status": "REPEAT_HISTORY",
                            "severity": "LOW",
                            "recommendation": f"Cleared '{p_code}' after {attempts} attempts. Practice foundational problem sets.",
                        }
                    )

        return {
            "student_id": student_id,
            "target_course_code": target_course.get("code"),
            "target_course_title": target_course.get("title"),
            "total_prerequisites": len(prereqs),
            "gaps_detected": len(gaps),
            "is_academically_ready": len([g for g in gaps if g["severity"] == "CRITICAL"]) == 0,
            "gap_details": gaps,
        }

