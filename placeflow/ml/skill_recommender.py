"""Skill gap recommender. Suggests skills each unplaced student should learn.

Usage:
    python -m ml.skill_recommender STU001
    python -m ml.skill_recommender --all
"""
import sys
import pathlib
import time

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from database.connection import get_db  # noqa: E402
from operations.reports import run  # noqa: E402

_CACHE = {
    "demand": None,
    "demand_time": 0,
    "placed": None,
    "placed_time": 0,
}
CACHE_TTL_SECS = 120


def _demand_scores(db):
    """Compute a demand score for each skill based on open seats (cached 120s)."""
    now = time.time()
    if _CACHE["demand"] is not None and (now - _CACHE["demand_time"] < CACHE_TTL_SECS):
        return _CACHE["demand"]
    demand = run(db, "A7a")  # skill -> open seats
    if not demand:
        return {}
    max_seats = max(r["seats"] for r in demand)
    res = {r["_id"]: r["seats"] / max_seats for r in demand}  # normalize to 0-1
    _CACHE["demand"] = res
    _CACHE["demand_time"] = now
    return res


def _placed_skills(db):
    """Skills that placed students had — weighted by frequency (cached 120s)."""
    now = time.time()
    if _CACHE["placed"] is not None and (now - _CACHE["placed_time"] < CACHE_TTL_SECS):
        return _CACHE["placed"]
    pipeline = [
        {"$match": {"placement_status": "Placed"}},
        {"$unwind": "$skills"},
        {"$group": {"_id": {"$toLower": "$skills"}, "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    results = list(db.students.aggregate(pipeline))
    if not results:
        return {}
    max_count = max(r["count"] for r in results)
    res = {r["_id"]: r["count"] / max_count for r in results}
    _CACHE["placed"] = res
    _CACHE["placed_time"] = now
    return res


def recommend(db, student_id, top_n=5):
    """Recommend skills for a student based on market demand and placement success patterns."""
    student = db.students.find_one({"student_id": student_id}, {"_id": 0})
    if not student:
        return {"error": f"Student {student_id} not found"}

    current_skills = {s.lower() for s in student.get("skills", [])}
    demand = _demand_scores(db)
    success = _placed_skills(db)

    all_skills = set(demand.keys()) | set(success.keys())
    missing = all_skills - current_skills

    scored = []
    for skill in missing:
        # Combined score: 60% demand weight + 40% success correlation weight
        d = demand.get(skill, 0)
        s = success.get(skill, 0)
        score = 0.6 * d + 0.4 * s
        scored.append({"skill": skill, "demand_score": round(d, 3),
                       "success_score": round(s, 3), "combined": round(score, 3)})

    scored.sort(key=lambda r: -r["combined"])

    return {
        "student_id": student_id,
        "name": student["name"],
        "current_skills": sorted(current_skills),
        "recommendations": scored[:top_n],
    }


if __name__ == "__main__":
    db = get_db()
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    if sys.argv[1] == "--all":
        for s in db.students.find({"placement_status": "Unplaced"}, {"student_id": 1, "_id": 0}):
            r = recommend(db, s["student_id"], top_n=3)
            skills = ", ".join(x["skill"] for x in r["recommendations"])
            print(f"  {r['student_id']} {r['name']:20s} → learn: {skills}")
    else:
        r = recommend(db, sys.argv[1])
        print(f"\n  Student: {r.get('name', '?')} ({r.get('student_id', '?')})")
        print(f"  Current: {', '.join(r.get('current_skills', []))}")
        print(f"\n  Recommended skills to learn:")
        for rec in r.get("recommendations", []):
            print(f"    {rec['skill']:20s} demand={rec['demand_score']:.3f}  "
                  f"success={rec['success_score']:.3f}  combined={rec['combined']:.3f}")

