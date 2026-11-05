"""Every parameterless aggregation in one registry. Read by reports.py, demo_registry.py and
scripts/generate_mongosh.py, so the app and the shell demos always run the same pipelines."""


def lookup(source, local, foreign, alias):
    return {"$lookup": {"from": source, "localField": local, "foreignField": foreign, "as": alias}}


def pct(part, whole):
    return {"$round": [{"$multiply": [{"$divide": [part, {"$max": [whole, 1]}]}, 100]}, 1]}


# Branch-wise placement statistics (A9), reused by A13 which materializes it.
BRANCH = [
    lookup("placements", "student_id", "student_id", "plc"),
    {"$addFields": {"best": {"$max": "$plc.package_lpa"}}},  # the student's best offer, null if none
    {"$group": {
        "_id": "$department",
        "students": {"$sum": 1},
        "placed": {"$sum": {"$cond": [{"$gt": [{"$size": "$plc"}, 0]}, 1, 0]}},
        "avg_package": {"$avg": "$best"},
        "max_package": {"$max": "$best"},
        "median_package": {"$median": {"input": "$best", "method": "approximate"}}}},  # MongoDB 7.0+
    {"$project": {"students": 1, "placed": 1, "placement_pct": pct("$placed", "$students"),
                  "avg_package": {"$round": ["$avg_package", 2]},
                  "max_package": 1, "median_package": 1}},
]

PIPELINES = {
    "A1": {
        "title": "Application KPIs in one pass ($facet)", "collection": "applications",
        "scenario": "Status counts and the most-applied job from a single scan of applications.",
        "stages": [{"$facet": {
            "by_status": [{"$group": {"_id": "$status", "n": {"$sum": 1}}}, {"$sort": {"n": -1}}],
            "most_applied": [
                {"$group": {"_id": "$job_id", "n": {"$sum": 1}}}, {"$sort": {"n": -1}}, {"$limit": 1},
                lookup("jobs", "_id", "job_id", "job"), {"$unwind": "$job"},
                {"$project": {"_id": 0, "title": "$job.title", "applications": "$n"}}]}}]},
    "A1b": {
        "title": "Placement KPIs in one pass ($facet)", "collection": "placements",
        "scenario": "Average and highest package plus the top hiring company in one scan.",
        "stages": [{"$facet": {
            "stats": [{"$group": {"_id": None, "avg": {"$avg": "$package_lpa"}, "max": {"$max": "$package_lpa"}}}],
            "top_company": [
                {"$group": {"_id": "$company_id", "hires": {"$sum": 1}}}, {"$sort": {"hires": -1}}, {"$limit": 1},
                lookup("companies", "_id", "company_id", "company"), {"$unwind": "$company"},
                {"$project": {"_id": 0, "company": "$company.name", "hires": 1}}]}}]},
    "A2": {
        "title": "Top hiring companies", "collection": "placements",
        "scenario": "Which companies hired the most students, with their names.",
        "stages": [
            {"$group": {"_id": "$company_id", "hires": {"$sum": 1}, "avg_package": {"$avg": "$package_lpa"}}},
            {"$sort": {"hires": -1}}, {"$limit": 5},
            lookup("companies", "_id", "company_id", "company"), {"$unwind": "$company"},
            {"$project": {"_id": 0, "company": "$company.name", "hires": 1,
                          "avg_package": {"$round": ["$avg_package", 2]}}}]},
    "A3": {
        "title": "Applications joined with students", "collection": "applications",
        "scenario": "The classic join: each application with the student's name, department and CGPA.",
        "stages": [
            lookup("students", "student_id", "student_id", "student"), {"$unwind": "$student"},
            {"$project": {"_id": 0, "application_id": 1, "status": 1, "name": "$student.name",
                          "department": "$student.department", "cgpa": "$student.cgpa"}}]},
    "A4": {
        "title": "Student, job and company in one chain", "collection": "applications",
        "scenario": "Chained joins, using a sub-pipeline $lookup for the job.",
        "stages": [
            lookup("students", "student_id", "student_id", "s"), {"$unwind": "$s"},
            {"$lookup": {"from": "jobs", "let": {"jid": "$job_id"},
                         "pipeline": [{"$match": {"$expr": {"$eq": ["$job_id", "$$jid"]}}},
                                      {"$project": {"_id": 0, "title": 1, "tier": 1,
                                                    "package_lpa": 1, "company_id": 1}}],
                         "as": "j"}},
            {"$unwind": "$j"},
            lookup("companies", "j.company_id", "company_id", "c"), {"$unwind": "$c"},
            {"$project": {"_id": 0, "application_id": 1, "student": "$s.name", "job": "$j.title",
                          "company": "$c.name", "package_lpa": "$j.package_lpa", "status": 1}}]},
    "A5": {
        "title": "Per-job funnel", "collection": "applications",
        "scenario": "Applied, shortlisted and selected counts per job with conversion percentage.",
        "stages": [
            {"$group": {
                "_id": "$job_id", "applied": {"$sum": 1},
                "shortlisted": {"$sum": {"$cond": [{"$in": ["Shortlisted", "$status_history.status"]}, 1, 0]}},
                "selected": {"$sum": {"$cond": [{"$eq": ["$status", "Selected"]}, 1, 0]}}}},
            lookup("jobs", "_id", "job_id", "job"), {"$unwind": "$job"},
            {"$project": {"_id": 0, "job_id": "$_id", "title": "$job.title", "applied": 1,
                          "shortlisted": 1, "selected": 1, "conversion_pct": pct("$selected", "$applied")}},
            {"$sort": {"applied": -1}}]},
    "A6": {
        "title": "At-risk students (unplaced, no applications)", "collection": "students",
        "scenario": "Who has not even applied yet, so the cell can intervene early.",
        "stages": [
            {"$match": {"placement_status": "Unplaced"}},
            lookup("applications", "student_id", "student_id", "apps"),
            {"$match": {"apps": {"$size": 0}}},
            {"$project": {"_id": 0, "student_id": 1, "name": 1, "department": 1, "cgpa": 1, "skills": 1}},
            {"$sort": {"cgpa": -1}}]},
    "A7a": {
        "title": "Skill demand (open seats per skill)", "collection": "jobs",
        "scenario": "How many open seats require each skill.",
        "stages": [
            {"$match": {"status": "Open"}}, {"$unwind": "$skills_required"},
            {"$group": {"_id": {"$toLower": "$skills_required"},
                        "seats": {"$sum": {"$subtract": ["$vacancies", "$filled"]}}}},
            {"$sort": {"seats": -1}}]},
    "A7b": {
        "title": "Skill supply (unplaced students per skill)", "collection": "students",
        "scenario": "How many unplaced students have each skill.",
        "stages": [
            {"$match": {"placement_status": "Unplaced"}}, {"$unwind": "$skills"},
            {"$group": {"_id": {"$toLower": "$skills"}, "students": {"$sum": 1}}},
            {"$sort": {"students": -1}}]},
    "A8": {
        "title": "Package distribution histogram", "collection": "placements",
        "scenario": "How many placements fall into each package band.",
        "stages": [{"$bucket": {"groupBy": "$package_lpa", "boundaries": [0, 4, 6, 8, 12, 20, 1000],
                                "default": "other", "output": {"placements": {"$sum": 1}}}}]},
    "A9": {
        "title": "Branch-wise placement statistics", "collection": "students",
        "scenario": "Placement %, average, median and highest package per department.",
        "stages": BRANCH + [{"$sort": {"_id": 1}}]},
    "A10": {
        "title": "Monthly placement trend", "collection": "placements",
        "scenario": "Placements and average package per month.",
        "stages": [{"$group": {"_id": {"$dateToString": {"format": "%Y-%m", "date": "$placement_date"}},
                               "placements": {"$sum": 1}, "avg_package": {"$avg": "$package_lpa"}}},
                   {"$project": {"placements": 1, "avg_package": {"$round": ["$avg_package", 2]}}},
                   {"$sort": {"_id": 1}}]},
    "A11": {
        "title": "Interview load per day", "collection": "interviews",
        "scenario": "How many interviews are scheduled each day, to plan rooms and panels.",
        "stages": [{"$group": {"_id": {"$dateTrunc": {"date": "$scheduled_start", "unit": "day"}},
                               "interviews": {"$sum": 1}}},
                   {"$sort": {"_id": 1}}]},
    "A12": {
        "title": "Top 3 by CGPA within each department", "collection": "students",
        "scenario": "A window function ranks students inside their department.",
        "stages": [{"$setWindowFields": {"partitionBy": "$department", "sortBy": {"cgpa": -1},
                                         "output": {"dept_rank": {"$rank": {}}}}},
                   {"$match": {"dept_rank": {"$lte": 3}}},
                   {"$project": {"_id": 0, "department": 1, "student_id": 1, "name": 1,
                                 "cgpa": 1, "dept_rank": 1}},
                   {"$sort": {"department": 1, "dept_rank": 1}}]},
    "A13": {
        "title": "Materialize branch report ($merge)", "collection": "students",
        "scenario": "Write the branch statistics into branch_placement_stats for export and accreditation.",
        "stages": BRANCH + [{"$merge": {"into": "branch_placement_stats",
                                        "whenMatched": "replace", "whenNotMatched": "insert"}}]},
    "A14": {
        "title": "Applications and placements on one timeline ($unionWith)", "collection": "applications",
        "scenario": "One chronological feed built from two collections.",
        "stages": [{"$project": {"_id": 0, "type": {"$literal": "application"}, "ref": "$application_id",
                                 "at": "$application_date"}},
                   {"$unionWith": {"coll": "placements", "pipeline": [
                       {"$project": {"_id": 0, "type": {"$literal": "placement"}, "ref": "$placement_id",
                                     "at": "$placement_date"}}]}},
                   {"$sort": {"at": -1}}, {"$limit": 20}]},
    "A15": {
        "title": "Offered CTC by tier", "collection": "jobs",
        "scenario": "Average posted package per tier, shown beside what students actually received.",
        "stages": [{"$group": {"_id": "$tier", "jobs": {"$sum": 1}, "avg_offered_lpa": {"$avg": "$package_lpa"}}},
                   {"$project": {"jobs": 1, "avg_offered_lpa": {"$round": ["$avg_offered_lpa", 2]}}},
                   {"$sort": {"avg_offered_lpa": 1}}]},
}

