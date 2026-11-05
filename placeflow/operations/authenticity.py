"""Coursework-Verified Talent Authenticity Index (VTI) Calculator."""

DEPT_CORE_SKILLS = {
    "CSE": {"python", "java", "c++", "sql", "mongodb", "dsa", "git", "linux", "docker"},
    "IT": {"python", "java", "javascript", "sql", "react", "html", "css", "git"},
    "ECE": {"c", "c++", "embedded", "verilog", "matlab", "python", "linux"},
    "MECH": {"autocad", "matlab", "ansys", "python", "solidworks", "catia"},
    "CIVIL": {"autocad", "staad", "revit", "matlab", "surveying"},
    "EE": {"matlab", "plc", "scada", "c", "python", "power systems"},
}


def calculate_talent_authenticity(student):
    """Calculates Verified Talent Index (VTI) based on objective academic signals
    and departmental curriculum consistency to eliminate AI resume inflation.
    
    Formula:
        VTI = 0.50 * AcademicGrade + 0.35 * CurriculumAlignment - 0.15 * BacklogPenalty
    """
    if not student:
        return None

    cgpa = float(student.get("cgpa", 0.0))
    backlogs = int(student.get("backlogs", 0))
    dept = student.get("department", "CSE")
    skills = [s.lower().strip() for s in student.get("skills", []) if isinstance(s, str)]

    # 1. Academic Baseline (0 - 100)
    academic_score = min(100.0, cgpa * 10.0)

    # 2. Backlog Penalty
    backlog_penalty = min(40.0, backlogs * 15.0)

    # 3. Curriculum Alignment Index (0 - 100)
    core_set = DEPT_CORE_SKILLS.get(dept, DEPT_CORE_SKILLS["CSE"])
    if skills:
        matched = sum(1 for s in skills if s in core_set)
        alignment_score = min(100.0, (matched / max(1, len(skills))) * 100.0)
    else:
        alignment_score = 40.0

    # 4. Composite VTI Score (0 - 100)
    raw_vti = (0.50 * academic_score) + (0.35 * alignment_score) - (0.15 * backlog_penalty)
    vti_score = round(max(10.0, min(99.0, raw_vti)), 1)

    # 5. Badge Classification
    if vti_score >= 75.0 and backlogs == 0:
        badge = "Gold Verified"
        badge_class = "gold"
        trust_level = "HIGH_SIGNAL"
        desc = "Audited academic excellence & strong core curriculum alignment."
    elif vti_score >= 58.0:
        badge = "Silver Verified"
        badge_class = "silver"
        trust_level = "STANDARD_SIGNAL"
        desc = "Consistent academic standing with standard curriculum proficiency."
    else:
        badge = "Unverified / Risk"
        badge_class = "unverified"
        trust_level = "REQUIRES_SCREENING"
        desc = "Discrepancy detected between academic baseline and claimed technical skills."

    return {
        "vti_score": vti_score,
        "badge": badge,
        "badge_class": badge_class,
        "trust_level": trust_level,
        "description": desc,
    }

