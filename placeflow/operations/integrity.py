"""Everything that replaces foreign keys: guarded deletes and an audit for orphaned references."""
from .errors import PlaceFlowError
from .ids import PREFIX

# parent collection -> [(child collection, child field)] that must not reference a deleted parent
DEPENDENTS = {
    "students": [("applications", "student_id"), ("placements", "student_id"), ("interviews", "student_id")],
    "companies": [("jobs", "company_id"), ("placements", "company_id")],
    "jobs": [("applications", "job_id"), ("placements", "job_id")],
    "applications": [("interviews", "application_id")],
}

# (child collection, child field, parent collection, parent field)
REFERENCES = [
    ("jobs", "company_id", "companies", "company_id"),
    ("applications", "student_id", "students", "student_id"),
    ("applications", "job_id", "jobs", "job_id"),
    ("interviews", "application_id", "applications", "application_id"),
    ("interviews", "student_id", "students", "student_id"),
    ("placements", "student_id", "students", "student_id"),
    ("placements", "company_id", "companies", "company_id"),
    ("placements", "job_id", "jobs", "job_id"),
]


def safe_delete(db, collection, value):
    """ON DELETE RESTRICT, implemented by hand."""
    if collection == "placements":
        raise PlaceFlowError("Placements cannot be deleted: it would break vacancy counts")
    key, _ = PREFIX[collection]
    for child, field in DEPENDENTS.get(collection, []):
        count = db[child].count_documents({field: value})
        if count:
            raise PlaceFlowError(f"Cannot delete {value}: {count} record(s) in {child} refer to it")
    if db[collection].delete_one({key: value}).deleted_count == 0:
        raise PlaceFlowError(f"{value} not found")


def orphans(db, child, field, parent, parent_field):
    rows = db[child].aggregate([
        {"$lookup": {"from": parent, "localField": field, "foreignField": parent_field, "as": "p"}},
        {"$match": {"p": {"$size": 0}}},
        {"$project": {"_id": 0, field: 1}}])
    return [row[field] for row in rows]


def consistency_issues(db):
    """Audit: dangling references, job.filled vs placements, Placed flag vs placements."""
    issues = []
    for child, field, parent, parent_field in REFERENCES:
        for value in orphans(db, child, field, parent, parent_field):
            issues.append(f"{child}.{field}={value} has no matching {parent}")
    counts = {r["_id"]: r["n"] for r in db.placements.aggregate(
        [{"$group": {"_id": "$job_id", "n": {"$sum": 1}}}])}
    for job in db.jobs.find({}, {"job_id": 1, "filled": 1}):
        if job["filled"] != counts.get(job["job_id"], 0):
            issues.append(f'{job["job_id"]}: filled={job["filled"]} but '
                          f'{counts.get(job["job_id"], 0)} placement(s) exist')
    placed = set(db.placements.distinct("student_id"))
    for student in db.students.find({"placement_status": "Placed"}, {"student_id": 1}):
        if student["student_id"] not in placed:
            issues.append(f'{student["student_id"]}: marked Placed but has no placement')
    return issues

