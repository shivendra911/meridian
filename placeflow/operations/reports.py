from .pipelines import PIPELINES


def run(db, pipeline_id):
    spec = PIPELINES[pipeline_id]
    return list(db[spec["collection"]].aggregate(spec["stages"]))


def placement_report(db):
    """The 9 dashboard cards. Every figure comes from a query or pipeline; nothing is hardcoded."""
    apps = (run(db, "A1") or [{}])[0]
    plc = (run(db, "A1b") or [{}])[0]
    stats = (plc.get("stats") or [{"avg": 0, "max": 0}])[0]
    by_status = {r["_id"]: r["n"] for r in apps.get("by_status", [])}
    top = (plc.get("top_company") or [{"company": "-"}])[0]["company"]
    students = db.students.count_documents({})
    placed = db.students.count_documents({"placement_status": "Placed"})
    return [
        ("Total Students", students),
        ("Placement %", round(100 * placed / students, 1) if students else 0),
        ("Total Companies", db.companies.count_documents({})),
        ("Open Jobs", db.jobs.count_documents({"status": "Open"})),
        ("Total Applications", sum(by_status.values())),
        ("Offers (Selected)", by_status.get("Selected", 0)),
        ("Average Package (LPA)", round(stats["avg"] or 0, 2)),
        ("Highest Package (LPA)", stats["max"] or 0),
        ("Top Hiring Company", top),
    ]


def pipeline_health(db):
    rows = (run(db, "A1") or [{}])[0].get("by_status", [])
    total = sum(r["n"] for r in rows) or 1
    return [{"status": r["_id"], "n": r["n"], "pct": round(100 * r["n"] / total, 1)} for r in rows]


def top_roles(db, limit=5):
    return list(db.jobs.find(
        {"status": "Open"},
        {"_id": 0, "title": 1, "location": 1, "package_lpa": 1, "tier": 1, "status": 1}
    ).sort("package_lpa", -1).limit(limit))


def recent_activity(db, limit=10):
    return list(db.activity_feed.find({}, {"_id": 0}).sort([("$natural", -1)]).limit(limit))


def skill_gap(db):
    seats = {r["_id"]: r["seats"] for r in run(db, "A7a")}
    students = {r["_id"]: r["students"] for r in run(db, "A7b")}
    rows = [{"skill": skill, "open_seats": n, "unplaced_students": students.get(skill, 0),
             "gap": n - students.get(skill, 0)} for skill, n in seats.items()]
    return sorted(rows, key=lambda r: -r["gap"])


def _rename(rows, new, old="_id"):
    return [{new: r.pop(old), **r} for r in rows]


# id -> (title, function(db) -> list of dict rows). Drives the Reports page, CSV export and the CLI.
REPORTS = {
    "branch": ("Branch-wise placement", lambda db: _rename(run(db, "A9"), "department")),
    "funnel": ("Per-job funnel", lambda db: run(db, "A5")),
    "skills": ("Skill gap: open seats vs unplaced students", skill_gap),
    "at_risk": ("At-risk students", lambda db: run(db, "A6")),
    "histogram": ("Package distribution", lambda db: _rename(run(db, "A8"), "from_lpa")),
    "trend": ("Monthly placements", lambda db: _rename(run(db, "A10"), "month")),
    "offered": ("Offered CTC by tier", lambda db: _rename(run(db, "A15"), "tier")),
}

