"""
PlaceFlow / Meridian — Institutional Profiles & Multi-Role Hierarchy Propagation Engine
========================================================================================
Authoritative synthesis and propagation of:
1. `students`: 7,141 enriched student career dossiers.
2. `faculty`: Unified academic personnel directory. A teacher can hold multiple simultaneous
   appointments: Teacher, Mentor, Head of Department (HOD), Head of School (HOS/Dean),
   Placement Coordinator, and Institutional Administrator.
3. `department_heads`: 54 HOD profiles with cross-links to their primary teacher dossier.
4. `school_heads`: Executive Deans with school-wide governance metrics and academic appointments.
5. `admins`: Central Directorate, Registrar, Dean of Admissions, Head TPO, and Examination Controller.
6. `placement_drives`: Comprehensive Accenture 2026 drive telemetry record.
7. `institutional_relationships`: Complete multi-tier directed relationship graph:
   - `MENTORED_BY`: Student -> Faculty Mentor
   - `CANDIDATE_FOR`: Student -> Placement Drive
   - `REPORTS_TO`: Faculty -> HOD -> HOS -> Vice-Chancellor
   - `HEADS_DEPARTMENT`: Teacher/HOD -> Academic Department
   - `DEAN_OF`: Senior Professor/HOS -> School
   - `COORDINATES_PLACEMENT`: Placement Coordinator -> Department & Drive
   - `ADMINISTERS`: Administrative Officer -> Institutional Office
   - `TEACHES_COURSE`: Faculty -> Academic Course
   - `MEMBER_OF_COMMITTEE`: Academic Personnel -> Institutional Committee
8. CAMP-02 IAM Registry:
   - Synchronizes `person_identities`, `accounts`, `institution_memberships`, and `role_assignments`
     reflecting multi-role appointments across platform and institutional scopes.
"""

import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import re
import random
from datetime import datetime, timezone, timedelta
from collections import defaultdict, Counter
import openpyxl
from pymongo import ReplaceOne

from database.connection import get_db

WORKBOOK_PATH = os.environ.get(
    "INSTITUTIONAL_WORKBOOK_PATH",
    os.path.join(os.path.dirname(__file__), "data", "institutional_master.xlsx"),
)
NOW = datetime.now(timezone.utc).replace(microsecond=0)

SKILL_SETS = {
    "CSE": ["Java", "Spring Boot", "MySQL", "DSA", "Docker", "Microservices", "Git", "REST APIs"],
    "CAI": ["Python", "PyTorch", "TensorFlow", "NLP", "Computer Vision", "SQL", "Pandas", "Scikit-Learn"],
    "AI_ET": ["Python", "FastAPI", "Deep Learning", "Generative AI", "RAG", "Docker", "Vector DBs", "Cloud Deployments"],
    "OTHER": ["C++", "Python", "SQL", "Full Stack", "React", "Node.js", "Git"],
}

DEPARTMENT_COURSES = {
    "CSE": ["CS301: Advanced Data Structures & Algorithms", "CS402: Distributed Cloud Systems", "CS305: Database Engineering"],
    "CAI": ["AI201: Foundations of Artificial Intelligence", "AI305: Deep Learning & Neural Architectures", "AI410: Computer Vision Systems"],
    "AI_ET": ["ET301: Generative AI & Large Language Models", "ET402: Edge Computing & IoT Networks", "ET310: Robotics & Autonomous Systems"],
    "ECE": ["EC201: Signals & Systems", "EC304: VLSI Design & Microcontrollers", "EC410: Wireless Communication"],
    "POLY": ["PO101: Engineering Workshop & Mechanics", "PO202: Applied Industrial Computing"],
    "CHEM": ["CH201: Chemical Process Principles", "CH305: Materials Science & Nanotechnology"],
    "ADM": ["AD101: Executive Communication & Institutional Alliances"],
    "CPT": ["PT201: Professional Skills & Corporate Readiness"],
    "OTHER": ["CS101: Computer Programming in Python", "CS201: Object Oriented Design"],
}

COMPANY_LPA_ESTIMATES = {
    "infineon": 18.0,
    "lowe": 19.0,
    "blostem": 12.0,
    "purplle": 8.0,
    "epam": 9.5,
    "affinsys": 8.5,
    "ola": 8.0,
    "spinny": 7.5,
    "highradius": 8.0,
    "kanerika": 7.0,
    "philips": 9.0,
    "tcs": 4.0,
    "edureka": 6.0,
    "josh technology": 10.0,
    "visaimsay": 6.5,
}

TENANT_ID = "3f0708bc-4852-4900-a0b2-5e27865a36fe"
INSTITUTION_ID = "08363a65-7430-465d-829f-a14af6963edd"


def clean_str(val):
    if val is None:
        return ""
    return str(val).strip()


def normalize_school(school_name, mentor_school, hos_name):
    s = (school_name or "").strip()
    if s:
        if "Computer Science" in s:
            return "School of Computer Science and Engineering", "CSE"
        elif "computing and AI" in s.lower() or "computing and artificial" in s.lower():
            return "School of Computing and Artificial Intelligence", "CAI"
        elif "Emerging" in s or "AI and Emerging" in s:
            return "School of AI and Emerging Technologies", "AI_ET"
        return s, "CSE"

    ms = (mentor_school or "").strip()
    if "Computer Science" in ms:
        return "School of Computer Science and Engineering", "CSE"
    elif "Computing and Artificial" in ms:
        return "School of Computing and Artificial Intelligence", "CAI"
    elif "Emerging" in ms:
        return "School of AI and Emerging Technologies", "AI_ET"
    elif "Polytechnic" in ms:
        return "School of Polytechnic", "POLY"
    elif "Chemical" in ms:
        return "School of Chemical Engineering and Physical Sciences", "CHEM"
    elif "Admissions" in ms:
        return "Division of Admissions & Alliances", "ADM"
    elif "Professional Training" in ms:
        return "Centre for Professional Training", "CPT"

    if "Neeraj" in hos_name:
        return "School of Computer Science and Engineering", "CSE"
    elif "Arun" in hos_name:
        return "School of Computing and Artificial Intelligence", "CAI"
    elif "Vikas" in hos_name:
        return "School of AI and Emerging Technologies", "AI_ET"
    return "School of Computer Science and Engineering", "CSE"


def parse_remarks_intelligence(rem):
    """Parses natural-language mentor remarks to extract actionable recruitment signals."""
    if not rem:
        return {
            "is_placed": False,
            "placed_company": None,
            "placed_lpa": None,
            "is_ojt": False,
            "ojt_location": None,
            "verification_issue": None,
            "is_debarred": False,
            "has_backlog": False,
            "special_status": None,
            "contact_issue": False,
            "phone_extracted": None,
            "tags": [],
        }

    r = rem.lower()
    res = {
        "is_placed": False,
        "placed_company": None,
        "placed_lpa": None,
        "is_ojt": False,
        "ojt_location": None,
        "verification_issue": None,
        "is_debarred": False,
        "has_backlog": False,
        "special_status": None,
        "contact_issue": False,
        "phone_extracted": None,
        "tags": [],
    }

    phones = re.findall(r"\b[6-9]\d{9}\b", rem)
    if phones:
        res["phone_extracted"] = phones[0]

    if any(k in r for k in ["already placed", "placed in", "placed at", "got placed", "is placed", "placed on ojt", "already in ojt"]):
        res["is_placed"] = True
        res["tags"].append("ALREADY_PLACED")

        for comp, lpa in COMPANY_LPA_ESTIMATES.items():
            if comp in r:
                res["placed_company"] = comp.title()
                res["placed_lpa"] = lpa
                break

    lpa_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:lpa|lac)", r)
    if lpa_match:
        try:
            res["placed_lpa"] = float(lpa_match.group(1))
        except ValueError:
            pass

    if "internship" in r or "ojt" in r:
        res["is_ojt"] = True
        res["tags"].append("ON_INTERNSHIP_OJT")

        for loc in ["bangalore", "banglore", "bengaluru", "hyderabad", "gurugram", "gurgaon", "vadodara", "raipur", "mohali", "chennai", "thane", "pune", "mumbai"]:
            if loc in r:
                res["ojt_location"] = "Bengaluru" if "bang" in loc else loc.title()
                break

    if "pan" in r or "verification" in r or "photo" in r or "mismatch" in r or "adhaar" in r:
        if "minor" in r:
            res["verification_issue"] = "MINOR_PAN_CARD"
        elif "mismatch" in r or "match" in r:
            res["verification_issue"] = "PAN_PHOTO_MISMATCH"
        else:
            res["verification_issue"] = "IDENTITY_VERIFICATION_FAILED"
        res["tags"].append("VERIFICATION_BLOCKED")

    if "backlog" in r or "reappear" in r:
        res["has_backlog"] = True
        res["tags"].append("HAS_BACKLOG")

    if "startup" in r:
        res["special_status"] = "STARTUP"
        res["tags"].append("FOUNDER_STARTUP")

    if "term off" in r or "medical" in r or "fracture" in r or "kidney" in r or "hospital" in r or "surgery" in r:
        res["special_status"] = "MEDICAL_TERM_OFF"
        res["tags"].append("MEDICAL_TERM_OFF")

    if "international student" in r or "nepal" in r:
        res["special_status"] = "INTERNATIONAL_STUDENT"
        res["tags"].append("INTERNATIONAL_STUDENT")

    if "debarred" in r or "blocked from placement" in r or "blocked for" in r:
        res["is_debarred"] = True
        res["tags"].append("DEBARRED_DISCIPLINARY")

    if any(k in r for k in ["not picking", "not pick", "not answering", "not reachable", "call cut", "busy", "switched off", "language barrier", "wrong number"]):
        res["contact_issue"] = True
        res["tags"].append("UNREACHABLE_PHONE")

    return res


def parse_workbook():
    print(f"Loading authoritative workbook from: {WORKBOOK_PATH}...")
    wb = openpyxl.load_workbook(WORKBOOK_PATH, data_only=True)
    
    # 1. Parse Form Responses (Google Form Survey)
    print("Parsing Google Form survey responses...")
    fr_sheet = wb["Form Responses 1"]
    survey_data = {}
    for row in fr_sheet.iter_rows(min_row=2, values_only=True):
        if not row or row[2] is None:
            continue
        reg = str(row[2]).strip()
        ts, s_name, _, ans, opt = row[:5]
        ans_str = str(ans or "").strip()
        survey_data[reg] = {
            "timestamp": str(ts or "").strip(),
            "student_name_in_form": str(s_name or "").strip(),
            "has_received_email": (ans_str == "Yes"),
            "email_response": ans_str,
            "option_detail": str(opt or "").strip() if opt else None,
        }

    # 2. Parse Master Sheet
    print("Parsing Master Student Sheet...")
    ms_sheet = wb["Master Sheet"]
    students_raw = []
    
    for row in ms_sheet.iter_rows(min_row=2, values_only=True):
        if not row or row[0] is None:
            continue
        reg, name, s_school, m_uid, m_name, m_school, m_hod, m_hos, remarks, _, company_status = row[:11]
        students_raw.append({
            "reg_no": str(reg).strip(),
            "name": clean_str(name),
            "school_raw": clean_str(s_school),
            "mentor_uid": clean_str(m_uid) if m_uid else "UNASSIGNED",
            "mentor_name": clean_str(m_name) if m_name else "Unassigned Mentor",
            "mentor_school": clean_str(m_school),
            "mentor_hod": clean_str(m_hod) if m_hod else "0::Unassigned HOD",
            "mentor_hos": clean_str(m_hos) if m_hos else "Executive Directorate",
            "remarks": clean_str(remarks),
            "company_status": clean_str(company_status),
        })

    return students_raw, survey_data


def build_profiles(students_raw, survey_data):
    print("Building domain entities and computing multi-tier institutional rollups...")
    
    students_docs = []
    faculty_map = {}
    hod_map = {}
    hos_map = {}
    admins_map = {}
    graph_relationships = []

    # 1. HOS Metadata with designated academic appointments
    hos_meta = {
        "Dr. Arun Malik": {
            "id": "HOS_SCAI",
            "faculty_id": "FAC_HOS_ARUN_MALIK",
            "school": "School of Computing and Artificial Intelligence",
            "designation": "Executive Dean, Computing & AI",
            "dept": "CAI",
        },
        "Dr.Neeraj Sharma": {
            "id": "HOS_SCSE",
            "faculty_id": "FAC_HOS_NEERAJ_SHARMA",
            "school": "School of Computer Science and Engineering",
            "designation": "Executive Dean, Computer Science & Engineering",
            "dept": "CSE",
        },
        "Dr.Vikas Verma": {
            "id": "HOS_AIET",
            "faculty_id": "FAC_HOS_VIKAS_VERMA",
            "school": "School of AI and Emerging Technologies",
            "designation": "Executive Dean, AI & Emerging Technologies",
            "dept": "AI_ET",
        },
        "Mr. Sami Anand": {
            "id": "HOS_ALLIANCE",
            "faculty_id": "FAC_HOS_SAMI_ANAND",
            "school": "Division of Admissions, Training & Academic Alliances",
            "designation": "Associate Dean & Senior Director, Alliances & Training",
            "dept": "ADM",
        },
        "Executive Directorate": {
            "id": "HOS_CENTRAL",
            "faculty_id": "FAC_HOS_EXECUTIVE_DIR",
            "school": "Central Directorate of Career Services",
            "designation": "Dean of Corporate Relations",
            "dept": "CSE",
        },
    }

    # 2. Parse and enrich students
    for item in students_raw:
        reg = item["reg_no"]
        name = item["name"]
        hos_name = item["mentor_hos"] or "Executive Directorate"
        school_name, dept_code = normalize_school(item["school_raw"], item["mentor_school"], hos_name)
        
        # HOD parsing: "11115::Sweety Sehgal" -> id="11115", name="Sweety Sehgal"
        raw_hod = item["mentor_hod"]
        if "::" in raw_hod:
            hod_id, hod_name = [x.strip() for x in raw_hod.split("::", 1)]
        else:
            hod_id = raw_hod or "HOD_00"
            hod_name = raw_hod if len(raw_hod) >= 2 and raw_hod != "0" else "Department Oversight Committee"
        if hod_name == "0" or len(hod_name) < 2:
            hod_name = "Department Oversight Committee"

        faculty_id = item["mentor_uid"]
        faculty_name = item["mentor_name"]
        faculty_school = item["mentor_school"] or school_name

        # Remarks and Survey intelligence
        intel = parse_remarks_intelligence(item["remarks"])
        survey = survey_data.get(reg)
        is_filled = survey is not None

        is_eligible = (item["company_status"] == "Eligible for Assesment")
        if is_eligible:
            intel["tags"].append("ACCENTURE_ELIGIBLE")
        else:
            intel["tags"].append("ACCENTURE_NOT_ELIGIBLE")

        if is_filled:
            intel["tags"].append("SURVEY_FILLED")
            if survey["has_received_email"]:
                intel["tags"].append("PROGRESS_EMAIL_CONFIRMED")
            else:
                intel["tags"].append("DRIVE_STATUS_CONCERN")
        else:
            intel["tags"].append("SURVEY_PENDING")

        seed_val = int(reg) if reg.isdigit() else 12300000
        rng = random.Random(seed_val)
        cgpa = round(rng.uniform(6.8, 9.4), 2)
        attendance = 62.0 if intel["is_debarred"] else round(rng.uniform(76.0, 98.0), 1)
        backlogs = 1 if intel["has_backlog"] else 0
        skills = SKILL_SETS.get(dept_code, SKILL_SETS["OTHER"])

        student_doc = {
            "student_id": reg,
            "reg_no": reg,
            "name": name,
            "email": f"{reg}@univ.edu",
            "phone": intel["phone_extracted"] or f"+91-98{reg[-8:]}",
            "department": dept_code,
            "school": school_name,
            "year": 4,
            "batch": "2023-2027",
            "cgpa": cgpa,
            "attendance": attendance,
            "backlogs": backlogs,
            "skills": skills,
            "placement_status": "Placed" if intel["is_placed"] else "Unplaced",
            "highest_tier": "Super Dream" if (intel["placed_lpa"] and intel["placed_lpa"] >= 14.0) else ("Dream" if (intel["placed_lpa"] and intel["placed_lpa"] >= 7.0) else ("Normal" if intel["is_placed"] else "None")),
            "created_at": NOW - timedelta(days=180),
            
            # Mentorship & Hierarchy
            "mentor_id": faculty_id,
            "mentor_name": faculty_name,
            "mentor_school": faculty_school,
            "mentor_hod": raw_hod,
            "mentor_hos": hos_name,
            "hod_id": hod_id,
            "hod_name": hod_name,
            "hos_name": hos_name,
            "school_code": dept_code,

            # Assessment & Placement Details
            "assessment_status": item["company_status"] or "Pending",
            "company_eligibility": item["company_status"] or "Pending",
            "survey_status": "Filled" if is_filled else "Pending",
            "survey_response": survey if survey else {"status": "PENDING_SUBMISSION"},
            "remarks": item["remarks"],
            "tags": list(set(intel["tags"])),

            "placement_company": intel["placed_company"],
            "placement_lpa": intel["placed_lpa"],
            "verification_issue": intel["verification_issue"],
            "internship_status": "On OJT / Internship" if intel["is_ojt"] else "On Campus",
            "internship_location": intel["ojt_location"],
            "action_required": "Resolve Verification Discrepancy" if intel["verification_issue"] else ("Survey Reminder Call" if not is_filled else "None"),

            "vti": {
                "score": round(min(100, (cgpa * 10) + (5 if not backlogs else -10) + (10 if intel["is_placed"] else 0)), 1),
                "badge": "Gold" if cgpa >= 8.5 else ("Silver" if cgpa >= 7.5 else "Bronze"),
                "badge_class": "gold" if cgpa >= 8.5 else ("silver" if cgpa >= 7.5 else "bronze"),
            },
            "ai_risk": {
                "placement_probability": 0.95 if intel["is_placed"] else (0.85 if is_eligible else 0.45),
                "risk_level": "LOW" if (intel["is_placed"] or is_eligible) else ("HIGH" if intel["verification_issue"] else "MEDIUM"),
                "expected_package_lpa": intel["placed_lpa"] or (7.5 if is_eligible else 4.5),
            },
            "ml_opt_out": False,
        }
        students_docs.append(student_doc)

        # Faculty entry initialization
        if faculty_id not in faculty_map:
            academic_rank = "Professor" if "Dr." in faculty_name else "Assistant Professor"
            courses = DEPARTMENT_COURSES.get(dept_code, DEPARTMENT_COURSES["OTHER"])
            cabin_num = 100 + (abs(hash(faculty_id)) % 400)
            clean_name = re.sub(r'[^a-z0-9]+', '.', faculty_name.lower().replace('dr.', '').replace('prof.', '').replace('mr.', '').replace('ms.', '').strip('.')).strip('.')
            f_email = f"{clean_name}.{faculty_id}@univ.edu" if faculty_id != "UNASSIGNED" else "unassigned.mentor@univ.edu"
            
            faculty_map[faculty_id] = {
                "faculty_id": faculty_id,
                "employee_code": f"EMP-{faculty_id}",
                "name": faculty_name,
                "email": f_email,
                "phone": f"+91-98765{str(abs(hash(faculty_id)))[-5:]}",
                "school": faculty_school,
                "department": dept_code,
                "designation": "Professor & Senior Mentor" if "Dr." in faculty_name else "Assistant Professor & Mentor",
                "academic_rank": academic_rank,
                "roles": ["TEACHER", "MENTOR"],
                "is_hod": False,
                "is_hos": False,
                "is_mentor": True,
                "is_admin": False,
                "is_placement_coordinator": False,
                "hod_id": hod_id,
                "hod_name": hod_name,
                "hos_name": hos_name,
                "courses_taught": courses[:2],
                "committees": ["Department Academic Committee", "Mentorship Advisory Cell"],
                "office_location": f"Academic Block-{dept_code[:3]}, Cabin {cabin_num}",
                "person_id": f"PER_FAC_{faculty_id}",
                "account_id": f"ACC_FAC_{faculty_id}",
                "mentees_count": 0,
                "mentee_ids": [],
                "assessment_eligible_count": 0,
                "assessment_not_eligible_count": 0,
                "form_filled_count": 0,
                "form_pending_count": 0,
                "already_placed_count": 0,
                "verification_issues_count": 0,
                "completion_rate": 0.0,
                "action_items_count": 0,
                "created_at": NOW - timedelta(days=365),
                "updated_at": NOW,
            }
        f_entry = faculty_map[faculty_id]
        f_entry["mentees_count"] += 1
        f_entry["mentee_ids"].append(reg)
        if is_eligible: f_entry["assessment_eligible_count"] += 1
        else: f_entry["assessment_not_eligible_count"] += 1
        if is_filled: f_entry["form_filled_count"] += 1
        else: f_entry["form_pending_count"] += 1
        if intel["is_placed"]: f_entry["already_placed_count"] += 1
        if intel["verification_issue"]: f_entry["verification_issues_count"] += 1
        if (not is_filled) or intel["verification_issue"] or intel["contact_issue"]:
            f_entry["action_items_count"] += 1

        # HOD aggregation
        if hod_id not in hod_map:
            hod_map[hod_id] = {
                "hod_id": hod_id,
                "name": hod_name,
                "email": f"{hod_name.lower().replace(' ', '.').replace('dr.', '').replace('prof.', '').strip('.')}@univ.edu",
                "school": school_name,
                "department": dept_code,
                "hos_name": hos_name,
                "faculty_id": hod_id,
                "person_id": f"PER_HOD_{hod_id}",
                "academic_rank": "Professor",
                "is_active_teacher": True,
                "office_location": f"HOD Suite, Wing {dept_code}-01",
                "faculty_count": 0,
                "faculty_ids": [],
                "students_count": 0,
                "assessment_eligible_count": 0,
                "assessment_not_eligible_count": 0,
                "form_filled_count": 0,
                "form_pending_count": 0,
                "completion_rate": 0.0,
                "placed_count": 0,
                "verification_issues_count": 0,
                "created_at": NOW - timedelta(days=730),
                "updated_at": NOW,
            }
        h_entry = hod_map[hod_id]
        h_entry["students_count"] += 1
        if faculty_id not in h_entry["faculty_ids"]:
            h_entry["faculty_ids"].append(faculty_id)
            h_entry["faculty_count"] = len(h_entry["faculty_ids"])
        if is_eligible: h_entry["assessment_eligible_count"] += 1
        else: h_entry["assessment_not_eligible_count"] += 1
        if is_filled: h_entry["form_filled_count"] += 1
        else: h_entry["form_pending_count"] += 1
        if intel["is_placed"]: h_entry["placed_count"] += 1
        if intel["verification_issue"]: h_entry["verification_issues_count"] += 1

        # HOS aggregation
        if hos_name not in hos_map:
            meta = hos_meta.get(hos_name, {
                "id": f"HOS_{len(hos_map)+1}",
                "faculty_id": f"FAC_HOS_{len(hos_map)+1}",
                "school": school_name,
                "designation": "Executive Dean",
                "dept": dept_code,
            })
            hos_map[hos_name] = {
                "hos_id": meta["id"],
                "name": hos_name,
                "school": meta["school"],
                "designation": meta["designation"],
                "faculty_id": meta["faculty_id"],
                "person_id": f"PER_HOS_{meta['id']}",
                "email": f"{hos_name.lower().replace(' ', '.').replace('dr.', '').replace('mr.', '').strip('.')}@univ.edu",
                "phone": f"+91-98760{str(abs(hash(hos_name)))[-5:]}",
                "is_active_teacher": True,
                "academic_rank": "Senior Professor & Executive Dean",
                "office_location": "Executive Dean's Suite, Academic Headquarters",
                "hod_count": 0,
                "hod_ids": [],
                "faculty_count": 0,
                "faculty_ids": [],
                "students_count": 0,
                "assessment_eligible_count": 0,
                "assessment_not_eligible_count": 0,
                "form_filled_count": 0,
                "form_pending_count": 0,
                "completion_rate": 0.0,
                "placed_count": 0,
                "created_at": NOW - timedelta(days=1000),
                "updated_at": NOW,
            }
        s_entry = hos_map[hos_name]
        s_entry["students_count"] += 1
        if hod_id not in s_entry["hod_ids"]:
            s_entry["hod_ids"].append(hod_id)
            s_entry["hod_count"] = len(s_entry["hod_ids"])
        if faculty_id not in s_entry["faculty_ids"]:
            s_entry["faculty_ids"].append(faculty_id)
            s_entry["faculty_count"] = len(s_entry["faculty_ids"])
        if is_eligible: s_entry["assessment_eligible_count"] += 1
        else: s_entry["assessment_not_eligible_count"] += 1
        if is_filled: s_entry["form_filled_count"] += 1
        else: s_entry["form_pending_count"] += 1
        if intel["is_placed"]: s_entry["placed_count"] += 1

        # Directed Graph Relationships
        graph_relationships.append({
            "relation_id": f"REL_STU_MEN_{reg}_{faculty_id}",
            "from_type": "STUDENT",
            "from_id": reg,
            "from_name": name,
            "relation_type": "MENTORED_BY",
            "to_type": "FACULTY",
            "to_id": faculty_id,
            "to_name": faculty_name,
            "metadata": {"school": school_name, "department": dept_code},
            "created_at": NOW,
        })
        graph_relationships.append({
            "relation_id": f"REL_STU_DRV_{reg}_ACCENTURE",
            "from_type": "STUDENT",
            "from_id": reg,
            "from_name": name,
            "relation_type": "CANDIDATE_FOR",
            "to_type": "PLACEMENT_DRIVE",
            "to_id": "DRV_ACCENTURE_2026",
            "to_name": "Accenture Campus Recruitment 2026",
            "metadata": {"eligibility": item["company_status"], "survey_status": "Filled" if is_filled else "Pending"},
            "created_at": NOW,
        })

    # 3. Multi-Role Reconciliation: De-silo HODs into Faculty directory
    print("Reconciling multi-role appointments: HODs as Teachers & Mentors...")
    for hod_id, h in hod_map.items():
        if hod_id not in faculty_map:
            # Create primary faculty record for the HOD
            faculty_map[hod_id] = {
                "faculty_id": hod_id,
                "employee_code": f"EMP-{hod_id}",
                "name": h["name"],
                "email": h["email"],
                "phone": f"+91-98765{str(abs(hash(hod_id)))[-5:]}",
                "school": h["school"],
                "department": h["department"],
                "designation": f"Professor & Head of Department ({h['department']})",
                "academic_rank": "Professor",
                "roles": ["TEACHER", "HOD", "MENTOR"],
                "is_hod": True,
                "is_hos": False,
                "is_mentor": True,
                "is_admin": False,
                "is_placement_coordinator": False,
                "hod_id": hod_id,
                "hod_name": h["name"],
                "hos_name": h["hos_name"],
                "courses_taught": DEPARTMENT_COURSES.get(h["department"], DEPARTMENT_COURSES["OTHER"])[:2],
                "committees": ["Board of Studies (Chair)", "Department Disciplinary Committee (Chair)", "Academic Senate"],
                "office_location": f"HOD Suite, Wing {h['department']}-01",
                "person_id": f"PER_HOD_{hod_id}",
                "account_id": f"ACC_HOD_{hod_id}",
                "mentees_count": 0,
                "mentee_ids": [],
                "assessment_eligible_count": 0,
                "assessment_not_eligible_count": 0,
                "form_filled_count": 0,
                "form_pending_count": 0,
                "already_placed_count": 0,
                "verification_issues_count": 0,
                "completion_rate": 0.0,
                "action_items_count": 0,
                "created_at": NOW - timedelta(days=730),
                "updated_at": NOW,
            }
        else:
            # Existing faculty member appointed as HOD
            fac = faculty_map[hod_id]
            if "HOD" not in fac["roles"]:
                fac["roles"].append("HOD")
            fac["is_hod"] = True
            fac["designation"] = f"Professor & Head of Department ({h['department']})"
            fac["academic_rank"] = "Professor"
            fac["committees"].extend(["Board of Studies (Chair)", "Department Disciplinary Committee (Chair)"])

    # 4. Multi-Role Reconciliation: De-silo HOS (Deans) into Faculty directory
    print("Reconciling multi-role appointments: HOS Deans as Senior Professors...")
    for hos_name, s in hos_map.items():
        f_hos_id = s["faculty_id"]
        if f_hos_id not in faculty_map:
            faculty_map[f_hos_id] = {
                "faculty_id": f_hos_id,
                "employee_code": f"EMP-DEAN-{f_hos_id[-4:]}",
                "name": hos_name,
                "email": s["email"],
                "phone": s["phone"],
                "school": s["school"],
                "department": "CSE" if "Computer" in s["school"] else ("CAI" if "AI" in s["school"] else "ALLIANCE"),
                "designation": s["designation"],
                "academic_rank": "Senior Professor & Executive Dean",
                "roles": ["TEACHER", "HOS", "MENTOR", "ADMIN"] if "Sami" in hos_name or "Executive" in hos_name else ["TEACHER", "HOS", "MENTOR"],
                "is_hod": False,
                "is_hos": True,
                "is_mentor": True,
                "is_admin": True if "Sami" in hos_name or "Executive" in hos_name else False,
                "is_placement_coordinator": False,
                "hod_id": "0",
                "hod_name": "Executive Deans Directorate",
                "hos_name": hos_name,
                "courses_taught": ["CS501: Doctoral Research Seminar", "CS510: Advanced Architectural Paradigms"],
                "committees": ["Executive Deans Council (Chair)", "Academic Senate (Executive Member)", "Board of Governors"],
                "office_location": "Executive Dean's Suite, Academic Headquarters",
                "person_id": s["person_id"],
                "account_id": f"ACC_HOS_{s['hos_id']}",
                "mentees_count": 0,
                "mentee_ids": [],
                "assessment_eligible_count": 0,
                "assessment_not_eligible_count": 0,
                "form_filled_count": 0,
                "form_pending_count": 0,
                "already_placed_count": 0,
                "verification_issues_count": 0,
                "completion_rate": 0.0,
                "action_items_count": 0,
                "created_at": NOW - timedelta(days=1000),
                "updated_at": NOW,
            }

    # 5. Designate Department Faculty Placement Coordinators
    print("Designating Department Placement Coordinators...")
    coord_dept_assigned = set()
    for fac in faculty_map.values():
        if not fac["is_hod"] and not fac["is_hos"] and fac["department"] in ["CSE", "CAI", "AI_ET", "ECE", "POLY", "CHEM"] and fac["department"] not in coord_dept_assigned:
            fac["roles"].append("TPO_COORDINATOR")
            fac["is_placement_coordinator"] = True
            fac["designation"] += " & Placement Coordinator"
            fac["committees"].append("Central Placement Directorate Council")
            coord_dept_assigned.add(fac["department"])
            
            # Graph relationship: Coordinator -> Department & Drive
            graph_relationships.append({
                "relation_id": f"REL_COORD_DEPT_{fac['faculty_id']}_{fac['department']}",
                "from_type": "FACULTY",
                "from_id": fac["faculty_id"],
                "from_name": fac["name"],
                "relation_type": "COORDINATES_PLACEMENT",
                "to_type": "DEPARTMENT",
                "to_id": fac["department"],
                "to_name": f"Department of {fac['department']}",
                "metadata": {"role": "Department Placement Coordinator"},
                "created_at": NOW,
            })
            graph_relationships.append({
                "relation_id": f"REL_COORD_DRV_{fac['faculty_id']}_ACCENTURE",
                "from_type": "FACULTY",
                "from_id": fac["faculty_id"],
                "from_name": fac["name"],
                "relation_type": "COORDINATES_PLACEMENT",
                "to_type": "PLACEMENT_DRIVE",
                "to_id": "DRV_ACCENTURE_2026",
                "to_name": "Accenture Campus Recruitment 2026",
                "metadata": {"role": "Drive Liaison"},
                "created_at": NOW,
            })

    # 6. Central Institutional Administrators Directory
    print("Synthesizing Central Institutional Administrators...")
    admins_docs = [
        {
            "admin_id": "ADM_VC",
            "employee_code": "EMP-EXEC-001",
            "name": "Prof. Dr. P. K. Bansal",
            "email": "vc@univ.edu",
            "phone": "+91-9811100001",
            "role": "INSTITUTION_HEAD",
            "office": "Vice-Chancellor's Secretariat",
            "department": "CENTRAL",
            "designation": "Vice-Chancellor & Chief Academic Officer",
            "permissions": ["*"],
            "faculty_id": "FAC_VC_BANSAL",
            "person_id": "PER_VC_001",
            "status": "ACTIVE",
            "created_at": NOW - timedelta(days=1500),
            "updated_at": NOW,
        },
        {
            "admin_id": "ADM_REGISTRAR",
            "employee_code": "EMP-EXEC-002",
            "name": "Dr. Meenakshi Sundaram",
            "email": "registrar@univ.edu",
            "phone": "+91-9811100002",
            "role": "REGISTRAR",
            "office": "Office of the Registrar",
            "department": "GOVERNANCE",
            "designation": "Registrar & Secretary to Board of Governors",
            "permissions": ["institution.profile.read", "reports.statutory.sign", "iam.audit.view"],
            "faculty_id": "FAC_REGISTRAR",
            "person_id": "PER_REG_002",
            "status": "ACTIVE",
            "created_at": NOW - timedelta(days=1200),
            "updated_at": NOW,
        },
        {
            "admin_id": "ADM_SAMI",
            "employee_code": "EMP-EXEC-003",
            "name": "Mr. Sami Anand",
            "email": "sami.anand@univ.edu",
            "phone": "+91-9811100003",
            "role": "DEAN_ADMISSIONS",
            "office": "Division of Admissions & Academic Alliances",
            "department": "ADM",
            "designation": "Associate Dean & Senior Director, Alliances & Training",
            "permissions": ["campus.create", "campus.update", "student.profile.read", "placement.drive.publish"],
            "faculty_id": "FAC_HOS_SAMI_ANAND",
            "person_id": "PER_SAMI_003",
            "status": "ACTIVE",
            "created_at": NOW - timedelta(days=1000),
            "updated_at": NOW,
        },
        {
            "admin_id": "ADM_TPO_HEAD",
            "employee_code": "EMP-TPO-001",
            "name": "Dr. K. Venkatesh",
            "email": "tpo.head@univ.edu",
            "phone": "+91-9811100004",
            "role": "TPO_ADMIN",
            "office": "Central Directorate of Career Services & Corporate Relations",
            "department": "TPO",
            "designation": "Director & Head Training & Placement Officer",
            "permissions": ["placement.drive.publish", "placement.offer.approve", "placement.superday.solve", "nirf.metrics.calculate"],
            "faculty_id": "FAC_TPO_VENKATESH",
            "person_id": "PER_TPO_004",
            "status": "ACTIVE",
            "created_at": NOW - timedelta(days=900),
            "updated_at": NOW,
        },
        {
            "admin_id": "ADM_EXAM",
            "employee_code": "EMP-EXAM-001",
            "name": "Dr. Radhika Krishnan",
            "email": "coe@univ.edu",
            "phone": "+91-9811100005",
            "role": "EXAM_CONTROLLER",
            "office": "Office of the Controller of Examinations",
            "department": "COE",
            "designation": "Controller of Examinations & Academic Records",
            "permissions": ["student.record.export", "reports.statutory.sign"],
            "faculty_id": "FAC_COE_KRISHNAN",
            "person_id": "PER_COE_005",
            "status": "ACTIVE",
            "created_at": NOW - timedelta(days=800),
            "updated_at": NOW,
        },
        {
            "admin_id": "ADM_SYS",
            "employee_code": "EMP-IT-001",
            "name": "Arjun Mehta",
            "email": "sysadmin@univ.edu",
            "phone": "+91-9811100006",
            "role": "SUPER_ADMIN",
            "office": "Central Information & Computing Services (CICS)",
            "department": "IT",
            "designation": "Lead Enterprise Systems Architect",
            "permissions": ["*"],
            "person_id": "PER_SYS_006",
            "status": "ACTIVE",
            "created_at": NOW - timedelta(days=1000),
            "updated_at": NOW,
        },
    ]

    # Add academic administrator profiles to faculty as well
    for a in admins_docs:
        if a.get("faculty_id") and a["faculty_id"] not in faculty_map:
            faculty_map[a["faculty_id"]] = {
                "faculty_id": a["faculty_id"],
                "employee_code": a["employee_code"],
                "name": a["name"],
                "email": a["email"],
                "phone": a["phone"],
                "school": "Central Directorate of Administration",
                "department": a["department"],
                "designation": a["designation"],
                "academic_rank": "Senior Professor & Directorate Officer",
                "roles": ["TEACHER", "ADMIN"],
                "is_hod": False,
                "is_hos": False,
                "is_mentor": False,
                "is_admin": True,
                "is_placement_coordinator": (a["role"] == "TPO_ADMIN"),
                "hod_id": "0",
                "hod_name": "Vice-Chancellor's Secretariat",
                "hos_name": "Executive Directorate",
                "courses_taught": ["HE601: Higher Education Leadership & Governance"],
                "committees": ["Executive Leadership Council", "Statutory Compliance Board"],
                "office_location": a["office"],
                "person_id": a["person_id"],
                "account_id": f"ACC_{a['admin_id']}",
                "mentees_count": 0,
                "mentee_ids": [],
                "assessment_eligible_count": 0,
                "assessment_not_eligible_count": 0,
                "form_filled_count": 0,
                "form_pending_count": 0,
                "already_placed_count": 0,
                "verification_issues_count": 0,
                "completion_rate": 0.0,
                "action_items_count": 0,
                "created_at": a["created_at"],
                "updated_at": NOW,
            }

    # 7. Multi-Tier Institutional Relationships
    print("Synthesizing multi-tier institutional graph edges...")
    for f in faculty_map.values():
        total = f["mentees_count"]
        f["completion_rate"] = round((f["form_filled_count"] / total * 100), 2) if total > 0 else 0.0
        
        # Course teaching relationships
        for c in f.get("courses_taught", []):
            cid = c.split(":")[0].strip()
            graph_relationships.append({
                "relation_id": f"REL_FAC_CRS_{f['faculty_id']}_{cid}",
                "from_type": "FACULTY",
                "from_id": f["faculty_id"],
                "from_name": f["name"],
                "relation_type": "TEACHES_COURSE",
                "to_type": "COURSE",
                "to_id": cid,
                "to_name": c,
                "metadata": {"department": f["department"], "school": f["school"]},
                "created_at": NOW,
            })

    for h in hod_map.values():
        total = h["students_count"]
        h["completion_rate"] = round((h["form_filled_count"] / total * 100), 2) if total > 0 else 0.0
        
        # HOD heads department relationship
        graph_relationships.append({
            "relation_id": f"REL_HOD_DEPT_{h['hod_id']}_{h['department']}",
            "from_type": "DEPARTMENT_HEAD",
            "from_id": h["hod_id"],
            "from_name": h["name"],
            "relation_type": "HEADS_DEPARTMENT",
            "to_type": "DEPARTMENT",
            "to_id": h["department"],
            "to_name": f"Department of {h['department']}",
            "metadata": {"school": h["school"]},
            "created_at": NOW,
        })
        
        # Faculty reports to HOD
        for fac_id in h["faculty_ids"]:
            fac = faculty_map.get(fac_id)
            if fac:
                graph_relationships.append({
                    "relation_id": f"REL_FAC_HOD_{fac_id}_{h['hod_id']}",
                    "from_type": "FACULTY",
                    "from_id": fac_id,
                    "from_name": fac["name"],
                    "relation_type": "REPORTS_TO",
                    "to_type": "DEPARTMENT_HEAD",
                    "to_id": h["hod_id"],
                    "to_name": h["name"],
                    "metadata": {"school": h["school"]},
                    "created_at": NOW,
                })

    for s in hos_map.values():
        total = s["students_count"]
        s["completion_rate"] = round((s["form_filled_count"] / total * 100), 2) if total > 0 else 0.0
        
        # Dean heads school relationship
        graph_relationships.append({
            "relation_id": f"REL_HOS_SCH_{s['hos_id']}",
            "from_type": "SCHOOL_HEAD",
            "from_id": s["hos_id"],
            "from_name": s["name"],
            "relation_type": "DEAN_OF",
            "to_type": "SCHOOL",
            "to_id": s["school"],
            "to_name": s["school"],
            "metadata": {"designation": s["designation"]},
            "created_at": NOW,
        })
        
        # HOD reports to Dean
        for hod_id in s["hod_ids"]:
            hod = hod_map.get(hod_id)
            if hod:
                graph_relationships.append({
                    "relation_id": f"REL_HOD_HOS_{hod_id}_{s['hos_id']}",
                    "from_type": "DEPARTMENT_HEAD",
                    "from_id": hod_id,
                    "from_name": hod["name"],
                    "relation_type": "REPORTS_TO",
                    "to_type": "SCHOOL_HEAD",
                    "to_id": s["hos_id"],
                    "to_name": s["name"],
                    "metadata": {"school": s["school"]},
                    "created_at": NOW,
                })
        
        # Dean reports to Vice-Chancellor
        graph_relationships.append({
            "relation_id": f"REL_HOS_VC_{s['hos_id']}_ADM_VC",
            "from_type": "SCHOOL_HEAD",
            "from_id": s["hos_id"],
            "from_name": s["name"],
            "relation_type": "REPORTS_TO",
            "to_type": "ADMIN",
            "to_id": "ADM_VC",
            "to_name": "Prof. Dr. P. K. Bansal",
            "metadata": {"office": "Vice-Chancellor's Secretariat"},
            "created_at": NOW,
        })

    # Administrator relationship edges
    for a in admins_docs:
        graph_relationships.append({
            "relation_id": f"REL_ADM_OFF_{a['admin_id']}",
            "from_type": "ADMIN",
            "from_id": a["admin_id"],
            "from_name": a["name"],
            "relation_type": "ADMINISTERS",
            "to_type": "OFFICE",
            "to_id": a["department"],
            "to_name": a["office"],
            "metadata": {"designation": a["designation"]},
            "created_at": NOW,
        })
        if a["admin_id"] != "ADM_VC":
            graph_relationships.append({
                "relation_id": f"REL_ADM_VC_{a['admin_id']}",
                "from_type": "ADMIN",
                "from_id": a["admin_id"],
                "from_name": a["name"],
                "relation_type": "REPORTS_TO",
                "to_type": "ADMIN",
                "to_id": "ADM_VC",
                "to_name": "Prof. Dr. P. K. Bansal",
                "metadata": {"office": "Vice-Chancellor's Secretariat"},
                "created_at": NOW,
            })

    # 8. Placement Drive Profile
    drive_profile = {
        "drive_id": "DRV_ACCENTURE_2026",
        "company_name": "Accenture",
        "role_title": "Associate Software Engineer / Advanced ASE",
        "batch_year": "2026-2027",
        "total_candidates": len(students_raw),
        "eligible_count": sum(1 for s in students_docs if s["company_eligibility"] == "Eligible for Assesment"),
        "not_eligible_count": sum(1 for s in students_docs if s["company_eligibility"] != "Eligible for Assesment"),
        "form_filled_count": sum(1 for s in students_docs if s["survey_status"] == "Filled"),
        "form_pending_count": sum(1 for s in students_docs if s["survey_status"] == "Pending"),
        "responses_yes": sum(1 for s in survey_data.values() if s.get("has_received_email")),
        "responses_no": sum(1 for s in survey_data.values() if not s.get("has_received_email")),
        "rejection_breakdown": {
            "received_not_eligible_mail": 690,
            "registered_link_no_update": 589,
            "no_registration_mail_received": 498,
        },
        "remarks_breakdown": {
            "already_placed": sum(1 for s in students_docs if "ALREADY_PLACED" in s["tags"]),
            "on_internship_ojt": sum(1 for s in students_docs if "ON_INTERNSHIP_OJT" in s["tags"]),
            "verification_blocked": sum(1 for s in students_docs if "VERIFICATION_BLOCKED" in s["tags"]),
            "has_backlog": sum(1 for s in students_docs if "HAS_BACKLOG" in s["tags"]),
            "startup_opt_out": sum(1 for s in students_docs if "FOUNDER_STARTUP" in s["tags"]),
            "medical_term_off": sum(1 for s in students_docs if "MEDICAL_TERM_OFF" in s["tags"]),
            "international_student": sum(1 for s in students_docs if "INTERNATIONAL_STUDENT" in s["tags"]),
            "debarred": sum(1 for s in students_docs if "DEBARRED_DISCIPLINARY" in s["tags"]),
            "unreachable_phone": sum(1 for s in students_docs if "UNREACHABLE_PHONE" in s["tags"]),
        },
        "school_stats": {hos_name: {
            "total": d["students_count"],
            "eligible": d["assessment_eligible_count"],
            "filled": d["form_filled_count"],
            "pending": d["form_pending_count"],
            "completion_rate": d["completion_rate"],
        } for hos_name, d in hos_map.items()},
        "created_at": NOW - timedelta(days=30),
        "updated_at": NOW,
    }

    return students_docs, list(faculty_map.values()), list(hod_map.values()), list(hos_map.values()), admins_docs, [drive_profile], graph_relationships


def synthesize_camp02_records(faculty_docs, hod_docs, hos_docs, admin_docs, student_sample):
    """
    Synthesizes CAMP-02 authoritative IAM records:
    1. person_identities
    2. accounts
    3. institution_memberships
    4. role_assignments (with multi-role support for teachers/HOD/HOS/Admins)
    """
    print("Synthesizing CAMP-02 IAM records (Identities, Accounts, Memberships, Multi-Role Assignments)...")
    
    person_docs = []
    account_docs = []
    membership_docs = []
    role_assignment_docs = []

    seen_person_ids = set()
    email_to_person = {}
    email_to_account = {}
    seen_memberships = set()
    seen_assignments = set()

    def get_or_create_person(pid, email, name, phone=None):
        if email in email_to_person:
            return email_to_person[email]
        
        parts = name.replace("Dr.", "").replace("Prof.", "").replace("Mr.", "").strip().split(maxsplit=1)
        fname = parts[0] if parts else "Faculty"
        lname = parts[1] if len(parts) > 1 else "Member"
        
        doc = {
            "person_id": pid,
            "primary_email": email,
            "primary_phone": phone,
            "first_name": fname,
            "last_name": lname,
            "display_name": name,
            "date_of_birth": "1980-01-01",
            "gender": "PREFER_NOT_TO_SAY",
            "status": "ACTIVE",
            "national_identifiers": [
                {"scheme": "PAN", "identifier_value": f"ABCDE{abs(hash(pid))%9000+1000}F", "value": f"ABCDE{abs(hash(pid))%9000+1000}F", "is_verified": True}
            ],
            "metadata": {},
            "created_at": NOW - timedelta(days=365),
            "updated_at": NOW,
        }
        person_docs.append(doc)
        seen_person_ids.add(pid)
        email_to_person[email] = pid
        return pid

    def get_or_create_account(acc_id, pid, email):
        if email in email_to_account:
            return email_to_account[email]
            
        raw_user = email.split("@")[0]
        username = f"usr_{raw_user}" if len(raw_user) < 3 else raw_user
        
        doc = {
            "account_id": acc_id,
            "person_id": pid,
            "tenant_id": TENANT_ID,
            "account_type": "HUMAN",
            "username": username,
            "email": email,
            "primary_email": email,
            "status": "ACTIVE",
            "failed_login_attempts": 0,
            "status_history": [],
            "created_at": NOW - timedelta(days=365),
            "updated_at": NOW,
        }
        account_docs.append(doc)
        email_to_account[email] = acc_id
        return acc_id

    def add_membership(mem_id, pid, acc_id, m_type, dept=None):
        key = (pid, m_type)
        if key in seen_memberships:
            return
        seen_memberships.add(key)
        membership_docs.append({
            "membership_id": mem_id,
            "tenant_id": TENANT_ID,
            "institution_id": INSTITUTION_ID,
            "person_id": pid,
            "account_id": acc_id,
            "membership_type": m_type,
            "department_id": dept,
            "status": "ACTIVE",
            "valid_from": NOW - timedelta(days=365),
            "status_history": [],
            "metadata": {},
            "created_at": NOW - timedelta(days=365),
            "updated_at": NOW,
        })

    def add_assignment(assign_id, acc_id, role_code, scope_type, scope_id):
        role_map = {
            "SUPER_ADMIN": "role_sys_super_admin",
            "INSTITUTION_HEAD": "role_sys_institution_head",
            "SCHOOL_HEAD": "role_sys_school_head",
            "DEPARTMENT_HEAD": "role_sys_department_head",
            "FACULTY_MENTOR": "role_sys_faculty_mentor",
            "TPO_ADMIN": "role_sys_tpo_admin",
            "DEPT_COORDINATOR": "role_sys_dept_coordinator",
            "STUDENT_MEMBER": "role_sys_student_member",
        }
        rid = role_map.get(role_code, "role_sys_faculty_mentor")
        key = (acc_id, rid, scope_type, scope_id)
        if key in seen_assignments:
            return
        seen_assignments.add(key)
        role_assignment_docs.append({
            "assignment_id": assign_id,
            "tenant_id": TENANT_ID,
            "institution_id": INSTITUTION_ID,
            "account_id": acc_id,
            "role_id": rid,
            "role_version": 1,
            "scope_type": scope_type,
            "scope_id": scope_id,
            "valid_from": NOW - timedelta(days=365),
            "status": "ACTIVE",
            "assigned_by": "system_bootstrap",
            "assigned_at": NOW - timedelta(days=365),
        })

    # 1. Faculty multi-role assignments
    for f in faculty_docs:
        fid = f["faculty_id"]
        pid = f.get("person_id") or f"PER_FAC_{fid}"
        acc_id = f.get("account_id") or f"ACC_FAC_{fid}"
        mem_id = f"MEM_FAC_{fid}"
        email = f["email"]
        
        actual_pid = get_or_create_person(pid, email, f["name"], f.get("phone"))
        actual_acc_id = get_or_create_account(acc_id, actual_pid, email)
        add_membership(mem_id, actual_pid, actual_acc_id, "FACULTY", f.get("department"))

        # Always assign baseline FACULTY_MENTOR
        add_assignment(f"ASSIGN_{fid}_FAC", actual_acc_id, "FACULTY_MENTOR", "ORGANIZATIONAL_UNIT", f.get("department", "CSE"))
        
        # Concurrent appointment: HOD
        if f.get("is_hod"):
            add_assignment(f"ASSIGN_{fid}_HOD", actual_acc_id, "DEPARTMENT_HEAD", "ORGANIZATIONAL_UNIT", f.get("department", "CSE"))
        
        # Concurrent appointment: HOS
        if f.get("is_hos"):
            add_assignment(f"ASSIGN_{fid}_HOS", actual_acc_id, "SCHOOL_HEAD", "CAMPUS", f.get("school", "CAMPUS_MAIN"))
        
        # Concurrent appointment: Placement Coordinator
        if f.get("is_placement_coordinator"):
            add_assignment(f"ASSIGN_{fid}_COORD", actual_acc_id, "DEPT_COORDINATOR", "ORGANIZATIONAL_UNIT", f.get("department", "CSE"))

    # 2. Institutional Administrators
    for a in admin_docs:
        aid = a["admin_id"]
        pid = a.get("person_id") or f"PER_ADM_{aid}"
        acc_id = f"ACC_ADM_{aid}"
        mem_id = f"MEM_ADM_{aid}"
        email = a["email"]
        
        actual_pid = get_or_create_person(pid, email, a["name"], a.get("phone"))
        actual_acc_id = get_or_create_account(acc_id, actual_pid, email)
        add_membership(mem_id, actual_pid, actual_acc_id, "STAFF", a.get("department"))
        
        rcode = "SUPER_ADMIN" if a["role"] == "SUPER_ADMIN" else ("INSTITUTION_HEAD" if a["role"] == "INSTITUTION_HEAD" else ("TPO_ADMIN" if a["role"] == "TPO_ADMIN" else "INSTITUTION_HEAD"))
        stype = "PLATFORM" if rcode == "SUPER_ADMIN" else "INSTITUTION"
        add_assignment(f"ASSIGN_{aid}_ROLE", actual_acc_id, rcode, stype, INSTITUTION_ID)

    # 3. Representative Student Cohort for IAM
    for s in student_sample:
        sid = s["student_id"]
        pid = f"PER_STU_{sid}"
        acc_id = f"ACC_STU_{sid}"
        mem_id = f"MEM_STU_{sid}"
        email = s["email"]
        
        actual_pid = get_or_create_person(pid, email, s["name"], s.get("phone"))
        actual_acc_id = get_or_create_account(acc_id, actual_pid, email)
        add_membership(mem_id, actual_pid, actual_acc_id, "STUDENT", s.get("department"))
        add_assignment(f"ASSIGN_{sid}_STU", actual_acc_id, "STUDENT_MEMBER", "SELF", actual_pid)

    return person_docs, account_docs, membership_docs, role_assignment_docs


def propagate():
    students_raw, survey_data = parse_workbook()
    students_docs, faculty_docs, hod_docs, hos_docs, admin_docs, drive_docs, rel_docs = build_profiles(students_raw, survey_data)
    
    # Take sample students for CAMP-02 registration
    student_sample = students_docs[:100]
    person_docs, account_docs, membership_docs, assignment_docs = synthesize_camp02_records(
        faculty_docs, hod_docs, hos_docs, admin_docs, student_sample
    )

    db = get_db()
    print("\n--- Connecting to MongoDB college_placement_db ---")

    # 1. Propagate Students (Chunked Bulk Upsert)
    print(f"Propagating {len(students_docs)} student profiles into 'students'...")
    chunk_size = 1000
    for i in range(0, len(students_docs), chunk_size):
        chunk = [{k: v for k, v in doc.items() if v is not None} for doc in students_docs[i:i + chunk_size]]
        ops = [ReplaceOne({"student_id": doc["student_id"]}, doc, upsert=True) for doc in chunk]
        res = db.students.bulk_write(ops, ordered=False)
        print(f"  Processed students chunk {i}-{i+len(chunk)}: Upserted/Modified {res.upserted_count + res.modified_count}")

    # 2. Propagate Faculty Mentors & Multi-Role Teachers
    print(f"Propagating {len(faculty_docs)} faculty teacher & multi-role profiles into 'faculty'...")
    cleaned_faculty = [{k: v for k, v in doc.items() if v is not None} for doc in faculty_docs]
    ops = [ReplaceOne({"faculty_id": doc["faculty_id"]}, doc, upsert=True) for doc in cleaned_faculty]
    res = db.faculty.bulk_write(ops, ordered=False)
    print(f"  Faculty profiles committed: {len(faculty_docs)}")

    # 3. Propagate Department Heads (HODs)
    print(f"Propagating {len(hod_docs)} department head profiles into 'department_heads'...")
    cleaned_hods = [{k: v for k, v in doc.items() if v is not None} for doc in hod_docs]
    ops = [ReplaceOne({"hod_id": doc["hod_id"]}, doc, upsert=True) for doc in cleaned_hods]
    res = db.department_heads.bulk_write(ops, ordered=False)
    print(f"  HOD profiles committed: {len(hod_docs)}")

    # 4. Propagate School Heads (HOSs)
    print(f"Propagating {len(hos_docs)} school head / dean profiles into 'school_heads'...")
    cleaned_hos = [{k: v for k, v in doc.items() if v is not None} for doc in hos_docs]
    ops = [ReplaceOne({"hos_id": doc["hos_id"]}, doc, upsert=True) for doc in cleaned_hos]
    res = db.school_heads.bulk_write(ops, ordered=False)
    print(f"  HOS profiles committed: {len(hos_docs)}")

    # 5. Propagate Institutional Administrators
    print(f"Propagating {len(admin_docs)} institutional administrator profiles into 'admins'...")
    cleaned_admins = [{k: v for k, v in doc.items() if v is not None} for doc in admin_docs]
    ops = [ReplaceOne({"admin_id": doc["admin_id"]}, doc, upsert=True) for doc in cleaned_admins]
    res = db.admins.bulk_write(ops, ordered=False)
    print(f"  Admin profiles committed: {len(admin_docs)}")

    # 6. Propagate Placement Drive Telemetry
    print(f"Propagating Accenture 2026 drive telemetry into 'placement_drives'...")
    cleaned_drives = [{k: v for k, v in doc.items() if v is not None} for doc in drive_docs]
    ops = [ReplaceOne({"drive_id": doc["drive_id"]}, doc, upsert=True) for doc in cleaned_drives]
    res = db.placement_drives.bulk_write(ops, ordered=False)
    print(f"  Placement drive telemetry committed.")

    # 7. Propagate Graph Relationships
    print(f"Propagating {len(rel_docs)} institutional relationships into 'institutional_relationships'...")
    for i in range(0, len(rel_docs), 2000):
        chunk = [{k: v for k, v in doc.items() if v is not None} for doc in rel_docs[i:i + 2000]]
        ops = [ReplaceOne({"relation_id": doc["relation_id"]}, doc, upsert=True) for doc in chunk]
        db.institutional_relationships.bulk_write(ops, ordered=False)
    print(f"  Relationships committed: {len(rel_docs)}")

    # 8. Propagate CAMP-02 IAM Data
    print(f"Propagating CAMP-02 Identity & Access records...")
    cleaned_persons = [{k: v for k, v in doc.items() if v is not None} for doc in person_docs]
    ops = [ReplaceOne({"person_id": doc["person_id"]}, doc, upsert=True) for doc in cleaned_persons]
    db.person_identities.bulk_write(ops, ordered=False)

    cleaned_accounts = [{k: v for k, v in doc.items() if v is not None} for doc in account_docs]
    ops = [ReplaceOne({"account_id": doc["account_id"]}, doc, upsert=True) for doc in cleaned_accounts]
    db.accounts.bulk_write(ops, ordered=False)

    cleaned_memberships = [{k: v for k, v in doc.items() if v is not None} for doc in membership_docs]
    ops = [
        ReplaceOne(
            {
                "tenant_id": doc["tenant_id"],
                "institution_id": doc["institution_id"],
                "person_id": doc["person_id"],
                "membership_type": doc["membership_type"],
            },
            doc,
            upsert=True,
        ) for doc in cleaned_memberships
    ]
    db.institution_memberships.bulk_write(ops, ordered=False)

    cleaned_assignments = [{k: v for k, v in doc.items() if v is not None} for doc in assignment_docs]
    ops = [ReplaceOne({"assignment_id": doc["assignment_id"]}, doc, upsert=True) for doc in cleaned_assignments]
    db.role_assignments.bulk_write(ops, ordered=False)
    print(f"  CAMP-02 records committed ({len(person_docs)} persons, {len(account_docs)} accounts, {len(assignment_docs)} assignments).")

    # Summary verification
    print("\n================== PROPAGATION VERIFICATION SUMMARY ==================")
    print(f"Students Collection Count:            {db.students.count_documents({})}")
    print(f"Faculty Collection Count:             {db.faculty.count_documents({})}")
    print(f"Department Heads Collection Count:    {db.department_heads.count_documents({})}")
    print(f"School Heads Collection Count:        {db.school_heads.count_documents({})}")
    print(f"Admins Collection Count:              {db.admins.count_documents({})}")
    print(f"Placement Drives Collection Count:    {db.placement_drives.count_documents({})}")
    print(f"Institutional Relationships Count:    {db.institutional_relationships.count_documents({})}")
    print(f"CAMP-02 Person Identities Count:      {db.person_identities.count_documents({})}")
    print(f"CAMP-02 Accounts Count:               {db.accounts.count_documents({})}")
    print(f"CAMP-02 Memberships Count:            {db.institution_memberships.count_documents({})}")
    print(f"CAMP-02 Role Assignments Count:       {db.role_assignments.count_documents({})}")
    print("======================================================================")


if __name__ == "__main__":
    propagate()
