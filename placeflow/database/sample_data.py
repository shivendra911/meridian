"""Small, readable, consistent demo data (sample data only). Safe to re-run: it upserts."""
from datetime import datetime, timedelta, timezone

from pymongo import ReplaceOne

NOW = datetime.now(timezone.utc).replace(microsecond=0)


def days(n):
    return NOW + timedelta(days=n)


def history(*steps):
    return [{"status": status, "at": days(offset)} for status, offset in steps]


def student(n, name, dept, cgpa, backlogs, skills, tier=None, mentor_id=None, school=None):
    doc = {"student_id": f"STU{n:03d}", "name": name,
           "email": f"{name.split()[0].lower()}{n}@univ.edu", "department": dept, "year": 4,
           "cgpa": cgpa, "backlogs": backlogs, "skills": skills,
           "placement_status": "Placed" if tier else "Unplaced", "created_at": days(-120)}
    if tier:
        doc["highest_tier"] = tier
    if mentor_id:
        doc["mentor_id"] = mentor_id
    if school:
        doc["school"] = school
    return doc


def job(n, company, title, tier, lpa, location, skills, min_cgpa, max_backlogs, depts,
        vacancies, filled, deadline_days):
    return {"job_id": f"JOB{n:03d}", "company_id": company, "title": title, "tier": tier,
            "package_lpa": lpa, "location": location, "skills_required": skills,
            "eligibility": {"min_cgpa": min_cgpa, "max_backlogs": max_backlogs, "departments": depts},
            "vacancies": vacancies, "filled": filled, "deadline": days(deadline_days), "status": "Open"}


def application(n, student_id, job_id, steps):
    hist = history(*steps)
    return {"application_id": f"APP{n:03d}", "student_id": student_id, "job_id": job_id,
            "application_date": hist[0]["at"], "status": hist[-1]["status"], "status_history": hist}


def interview(n, app_id, student_id, round_name, offset_days, hour, mode, result, venue=None):
    start = days(offset_days).replace(hour=hour, minute=0)
    doc = {"interview_id": f"INT{n:03d}", "application_id": app_id, "student_id": student_id,
           "round": round_name, "scheduled_start": start,
           "scheduled_end": start + timedelta(minutes=45), "mode": mode, "result": result}
    if venue:
        doc["venue"] = venue
    return doc


ALL = ["CSE", "ISE", "ECE", "EEE", "ME", "CE", "IT"]
IT_BRANCHES = ["CSE", "ISE", "IT", "ECE"]

COMPANIES = [
    {"company_id": "COMP001", "name": "Cognizant", "industry": "IT Services", "location": "Chennai",
     "website": "https://www.cognizant.com"},
    {"company_id": "COMP002", "name": "Zoho", "industry": "Software Products", "location": "Chennai",
     "website": "https://www.zoho.com"},
    {"company_id": "COMP003", "name": "Razorpay", "industry": "Fintech", "location": "Bengaluru",
     "website": "https://razorpay.com"},
    {"company_id": "COMP004", "name": "Capgemini", "industry": "IT Services", "location": "Mumbai",
     "website": "https://www.capgemini.com"},
]

STUDENTS = [
    student(1, "Aarav Sharma", "CSE", 8.9, 0, ["Java", "Spring Boot", "MySQL"], mentor_id="11266", school="School of Computing"),
    student(2, "Diya Patel", "CSE", 9.2, 0, ["Python", "ML", "SQL"], "Dream", mentor_id="11266", school="School of Computing"),
    student(3, "Rohan Mehta", "ECE", 7.4, 1, ["C", "Embedded", "Python"], mentor_id="FAC_ECE_01", school="School of Electronics & Communication"),
    student(4, "Sneha Reddy", "ISE", 8.1, 0, ["Java", "React", "Docker"], mentor_id="FAC_ISE_01", school="School of Computing"),
    student(5, "Karan Singh", "CSE", 6.8, 2, ["C++", "DSA"], mentor_id="FAC_CSE_02", school="School of Computing"),
    student(6, "Ananya Iyer", "IT", 8.6, 0, ["Python", "Django", "AWS"], "Normal", mentor_id="FAC_IT_01", school="School of Computing"),
    student(7, "Vikram Nair", "ME", 7.9, 0, ["AutoCAD", "Python"], mentor_id="FAC_ME_01", school="School of Mechanical Engineering"),
    student(8, "Meera Joshi", "CSE", 9.5, 0, ["Java", "DSA", "System Design"], mentor_id="FAC_CSE_02", school="School of Computing"),  # no applications: at-risk demo
]

JOBS = [
    job(1, "COMP001", "Programmer Analyst", "Normal", 4.0, "Chennai", ["Java", "SQL"], 6.0, 1, IT_BRANCHES, 10, 1, 20),
    job(2, "COMP001", "GenC Next", "Dream", 7.0, "Chennai", ["Java", "Spring Boot"], 7.5, 0, ["CSE", "ISE", "IT"], 3, 0, 25),
    job(3, "COMP002", "Member Technical Staff", "Dream", 8.0, "Chennai", ["Java", "DSA"], 7.0, 0, IT_BRANCHES, 2, 1, 15),
    job(4, "COMP003", "Backend Engineer", "Super Dream", 24.0, "Bengaluru", ["Java", "System Design", "SQL"], 8.5, 0, ["CSE", "ISE", "IT"], 2, 0, 30),
    job(5, "COMP004", "Analyst", "Normal", 4.5, "Mumbai", ["Python", "SQL"], 6.5, 2, ALL, 20, 0, 40),
    job(6, "COMP002", "Support Engineer", "Normal", 3.5, "Chennai", ["Communication"], 6.0, 2, ALL, 5, 0, -5),  # past deadline but Open: expiry-sweep demo
]

APPLICATIONS = [
    application(1, "STU001", "JOB001", [("Applied", -12)]),
    application(2, "STU001", "JOB002", [("Applied", -12), ("Shortlisted", -6)]),
    application(3, "STU002", "JOB003", [("Applied", -30), ("Shortlisted", -20), ("Selected", -10)]),
    application(4, "STU002", "JOB004", [("Applied", -5)]),  # Dream-placed student upgrading to Super Dream
    application(5, "STU003", "JOB001", [("Applied", -14), ("Rejected", -8)]),
    application(6, "STU004", "JOB002", [("Applied", -11), ("Shortlisted", -4)]),
    application(7, "STU006", "JOB001", [("Applied", -25), ("Shortlisted", -18), ("Selected", -9)]),
    application(8, "STU004", "JOB005", [("Applied", -7)]),
    application(9, "STU005", "JOB005", [("Applied", -7)]),
    application(10, "STU007", "JOB005", [("Applied", -6)]),
]

INTERVIEWS = [
    interview(1, "APP002", "STU001", "Technical", 3, 10, "Online", "Scheduled"),
    interview(2, "APP006", "STU004", "Technical", 3, 10, "Online", "Scheduled"),
    interview(3, "APP003", "STU002", "HR", -12, 11, "Offline", "Passed", "Seminar Hall A"),
]

PLACEMENTS = [
    {"placement_id": "PLC001", "student_id": "STU002", "company_id": "COMP002", "job_id": "JOB003",
     "package_lpa": 8.0, "placement_date": days(-10), "status": "Placed"},
    {"placement_id": "PLC002", "student_id": "STU006", "company_id": "COMP001", "job_id": "JOB001",
     "package_lpa": 4.0, "placement_date": days(-9), "status": "Placed"},
]

# Order matters: parents before children.
DATA = {
    "companies": (COMPANIES, "company_id"),
    "students": (STUDENTS, "student_id"),
    "jobs": (JOBS, "job_id"),
    "applications": (APPLICATIONS, "application_id"),
    "interviews": (INTERVIEWS, "interview_id"),
    "placements": (PLACEMENTS, "placement_id"),
}


def seed(db):
    for collection, (docs, key) in DATA.items():
        db[collection].bulk_write([ReplaceOne({key: d[key]}, d, upsert=True) for d in docs])

