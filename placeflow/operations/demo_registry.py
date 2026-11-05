"""Catalogue of live demos used by the Demo Lab page and the CLI.
Each demo returns {"rows": [...]} plus optional timing."""
import json
import time

from .common import utcnow
from .pipelines import PIPELINES

DEMOS = {}


def demo(demo_id, title, scenario, mongosh):
    def register(fn):
        DEMOS[demo_id] = {"id": demo_id, "title": title, "scenario": scenario,
                          "mongosh": mongosh, "run": fn}
        return fn
    return register


def stages_of(plan, found=None):
    """Collect every plan stage name (IXSCAN, COLLSCAN, FETCH, ...) from an explain plan."""
    found = [] if found is None else found
    if isinstance(plan, dict):
        if "stage" in plan:
            found.append(plan["stage"])
        for value in plan.values():
            stages_of(value, found)
    elif isinstance(plan, list):
        for value in plan:
            stages_of(value, found)
    return found


def explain_find(db, collection, flt, hint=None, projection=None):
    command = {"find": collection, "filter": flt}
    if hint:
        command["hint"] = hint
    if projection:
        command["projection"] = projection
    out = db.command({"explain": command, "verbosity": "executionStats"})
    stats = out["executionStats"]
    found = stages_of(out["queryPlanner"]["winningPlan"])
    return {"plan": "IXSCAN" if any("IXSCAN" in s for s in found) else "COLLSCAN",
            "returned": stats["nReturned"], "docs_examined": stats["totalDocsExamined"],
            "keys_examined": stats["totalKeysExamined"], "ms": stats["executionTimeMillis"]}


ELIGIBLE = {"department": "CSE", "cgpa": {"$gte": 8.5}, "backlogs": 0, "placement_status": "Unplaced"}


@demo("I1", "Eligible candidates: index vs collection scan",
      "The same query run twice: once forced to scan every document, once with the planner's index. "
      "Load the bulk dataset (setup_database.py --bulk) to see a real difference.",
      'db.students.find({department:"CSE", cgpa:{$gte:8.5}, backlogs:0, placement_status:"Unplaced"})'
      '.hint({$natural:1}).explain("executionStats")')
def i1(db):
    return {"rows": [
        {"run": "forced COLLSCAN", **explain_find(db, "students", ELIGIBLE, hint={"$natural": 1})},
        {"run": "planner's choice", **explain_find(db, "students", ELIGIBLE)}]}


@demo("I2", "Covered query",
      "Project only indexed fields and exclude _id: MongoDB answers from the index alone (0 documents read).",
      'db.students.find({department:"CSE", cgpa:{$gte:9}}, {_id:0, department:1, cgpa:1}).explain("executionStats")')
def i2(db):
    row = explain_find(db, "students", {"department": "CSE", "cgpa": {"$gte": 9}},
                       projection={"_id": 0, "department": 1, "cgpa": 1})
    return {"rows": [{"run": "covered by ix_dept_cgpa", **row}]}


@demo("T1", "Transaction: atomic, then rolled back",
      "Insert a placement and bump a job's filled count inside a transaction, read it from inside and "
      "outside, then abort. Nothing is left behind.",
      "session.startTransaction(); ...; session.abortTransaction()")
def t1(db):
    def snapshot(session=None):
        job = db.jobs.find_one({"job_id": "JOB005"}, session=session)
        return {"placement_rows": db.placements.count_documents({"placement_id": "PLC999"}, session=session),
                "job_filled": job["filled"] if job else 0}

    with db.client.start_session() as session:
        session.start_transaction()
        db.placements.insert_one({
            "placement_id": "PLC999", "student_id": "STU001", "company_id": "COMP004", "job_id": "JOB005",
            "package_lpa": 4.5, "placement_date": utcnow(), "status": "Placed"}, session=session)
        db.jobs.update_one({"job_id": "JOB005"}, {"$inc": {"filled": 1}}, session=session)
        inside = snapshot(session)
        outside = snapshot()
        session.abort_transaction()
    return {"rows": [{"where": "inside the transaction", **inside},
                     {"where": "outside (other clients)", **outside},
                     {"where": "after abort", **snapshot()}]}


def _pipeline_demo(spec):
    def run(db):
        started = time.perf_counter()
        rows = list(db[spec["collection"]].aggregate(spec["stages"]))
        return {"rows": rows[:20], "total": len(rows),
                "ms": round((time.perf_counter() - started) * 1000, 1)}
    return run


for _pid, _spec in PIPELINES.items():
    DEMOS[_pid] = {"id": _pid, "title": _spec["title"], "scenario": _spec["scenario"],
                   "mongosh": f'db.{_spec["collection"]}.aggregate({json.dumps(_spec["stages"])})',
                   "run": _pipeline_demo(_spec)}

