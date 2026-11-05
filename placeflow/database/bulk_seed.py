import random
from datetime import timedelta

from database.sample_data import NOW
from database.validation import DEPARTMENTS, TIERS
from operations.applications import check_eligibility
from operations.errors import PlaceFlowError

SKILLS = ["Java", "Python", "C++", "SQL", "React", "Spring Boot", "Docker", "AWS", "ML", "DSA", "Node.js", "Git"]
CITIES = ["Bengaluru", "Chennai", "Pune", "Hyderabad", "Mumbai"]
BANDS = {"Normal": (3.5, 6.5), "Dream": (7.0, 14.0), "Super Dream": (15.0, 40.0)}


def insert_all(db, name, docs):
    for start in range(0, len(docs), 1000):
        db[name].insert_many(docs[start:start + 1000], ordered=False)


def load(db, n_students=5000, n_companies=300, n_jobs=1500, n_apps=25000, seed=42):
    rng = random.Random(seed)  # fixed seed: identical data on every run

    students = [{
        "student_id": f"STU{i:04d}", "name": f"Student {i}", "email": f"student{i}@univ.edu",
        "department": rng.choice(DEPARTMENTS), "year": 4, "cgpa": round(rng.uniform(5.5, 9.8), 2),
        "backlogs": rng.choice([0, 0, 0, 0, 1, 2]), "skills": rng.sample(SKILLS, rng.randint(2, 5)),
        "placement_status": "Unplaced", "created_at": NOW} for i in range(1, n_students + 1)]
    companies = [{
        "company_id": f"COMP{i:03d}", "name": f"Company {i}",
        "industry": rng.choice(["IT Services", "Fintech", "Product", "Core Engineering"]),
        "location": rng.choice(CITIES)} for i in range(1, n_companies + 1)]

    jobs = []
    for i in range(1, n_jobs + 1):
        tier = rng.choices(TIERS, weights=[6, 3, 1])[0]
        low, high = BANDS[tier]
        jobs.append({
            "job_id": f"JOB{i:04d}", "company_id": f"COMP{rng.randint(1, n_companies):03d}",
            "title": f"Role {i}", "tier": tier, "package_lpa": round(rng.uniform(low, high), 1),
            "location": rng.choice(CITIES), "skills_required": rng.sample(SKILLS, rng.randint(1, 3)),
            "eligibility": {"min_cgpa": round(rng.uniform(6, 8.5), 1), "max_backlogs": rng.choice([0, 1, 2]),
                            "departments": rng.sample(DEPARTMENTS, rng.randint(2, 6))},
            "vacancies": rng.randint(1, 15), "filled": 0,
            "deadline": NOW + timedelta(days=rng.randint(5, 90)), "status": "Open"})
    by_student = {s["student_id"]: s for s in students}
    by_job = {j["job_id"]: j for j in jobs}

    applications, seen, attempts = [], set(), 0
    while len(applications) < n_apps and attempts < n_apps * 20:
        attempts += 1
        student, job = rng.choice(students), rng.choice(jobs)
        if (student["student_id"], job["job_id"]) in seen:
            continue
        try:
            check_eligibility(student, job, NOW)
        except PlaceFlowError:
            continue
        seen.add((student["student_id"], job["job_id"]))
        final = rng.choices(["Applied", "Shortlisted", "Rejected"], weights=[50, 30, 20])[0]
        steps = {"Applied": ["Applied"], "Shortlisted": ["Applied", "Shortlisted"],
                 "Rejected": ["Applied", "Rejected"]}[final]
        applied_at = NOW - timedelta(days=rng.randint(5, 30))
        history = [{"status": s, "at": applied_at + timedelta(days=n)} for n, s in enumerate(steps)]
        applications.append({
            "application_id": f"APP{len(applications) + 1:05d}", "student_id": student["student_id"],
            "job_id": job["job_id"], "application_date": applied_at, "status": final,
            "status_history": history})

    placements = []
    shortlisted = [a for a in applications if a["status"] == "Shortlisted"]
    rng.shuffle(shortlisted)
    for app in shortlisted:
        student, job = by_student[app["student_id"]], by_job[app["job_id"]]
        if student["placement_status"] == "Placed" or job["filled"] >= job["vacancies"] or rng.random() > 0.35:
            continue
        when = app["status_history"][-1]["at"] + timedelta(days=1)
        app["status"] = "Selected"
        app["status_history"].append({"status": "Selected", "at": when})
        job["filled"] += 1
        if job["filled"] == job["vacancies"]:
            job["status"] = "Closed"
        student["placement_status"], student["highest_tier"] = "Placed", job["tier"]
        placements.append({
            "placement_id": f"PLC{len(placements) + 1:05d}", "student_id": student["student_id"],
            "company_id": job["company_id"], "job_id": job["job_id"], "package_lpa": job["package_lpa"],
            "placement_date": when, "status": "Placed"})

    interviews, busy = [], {}
    for app in applications:
        if app["status"] not in ("Shortlisted", "Selected"):
            continue
        for _ in range(10):  # find a slot that does not clash with this student's other interviews
            offset = rng.randint(-10, -1) if app["status"] == "Selected" else rng.randint(1, 30)
            start = (NOW + timedelta(days=offset)).replace(hour=rng.randint(9, 16), minute=0, second=0)
            end = start + timedelta(minutes=45)
            slots = busy.setdefault(app["student_id"], [])
            if all(end <= s0 or start >= s1 for s0, s1 in slots):
                slots.append((start, end))
                interviews.append({
                    "interview_id": f"INT{len(interviews) + 1:05d}", "application_id": app["application_id"],
                    "student_id": app["student_id"], "round": rng.choice(["Technical", "HR", "Aptitude"]),
                    "scheduled_start": start, "scheduled_end": end, "mode": rng.choice(["Online", "Offline"]),
                    "result": "Passed" if app["status"] == "Selected" else "Scheduled"})
                break

    for name, docs in [("companies", companies), ("students", students), ("jobs", jobs),
                       ("applications", applications), ("interviews", interviews), ("placements", placements)]:
        insert_all(db, name, docs)
    print(f"bulk: {len(students)} students, {len(jobs)} jobs, {len(applications)} applications, "
          f"{len(interviews)} interviews, {len(placements)} placements")

