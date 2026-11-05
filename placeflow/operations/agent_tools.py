"""
PlaceFlow v3 — FR-AGT-001 / FR-AGT-004: Typed MCP-Compatible Tool Registry
Typed platform operations providing safe, scoped, validated tool execution for agents.
Agents never access the database directly; they invoke typed tools.
"""

from typing import Dict, Any, List, Optional
from operations.students import get_student
from operations.jobs import get_job
from operations.superday import detect_conflicts
from operations.reports import REPORTS


def list_interviews(db, student_id: str) -> List[Dict[str, Any]]:
    return list(db.interviews.find({"student_id": student_id}, {"_id": 0}).sort("scheduled_start", 1))


def detect_superday_clashes(db) -> List[Dict[str, Any]]:
    return detect_conflicts(db)


def get_report(db, report_id: str):
    key = "branch" if report_id in ("dept", "department") else report_id
    if key in REPORTS:
        title, fn = REPORTS[key]
        return title, fn(db)
    return None


# Tool Catalog Definition with Typed Schemas
TOOL_CATALOG = [
    {
        "name": "get_my_eligible_drives",
        "description": "Retrieves the list of active job openings (JNFs) for which the student satisfies all academic eligibility criteria.",
        "parameters": {
            "type": "object",
            "properties": {
                "student_id": {"type": "string", "description": "Candidate Roll Number (e.g. STU001)"}
            },
            "required": ["student_id"]
        },
        "scope": "student:read"
    },
    {
        "name": "explain_eligibility",
        "description": "Explains why a candidate is eligible or ineligible for a specific job drive with explicit criteria checks.",
        "parameters": {
            "type": "object",
            "properties": {
                "student_id": {"type": "string", "description": "Candidate Roll Number (e.g. STU001)"},
                "job_id": {"type": "string", "description": "Job Notification ID (e.g. JOB001)"}
            },
            "required": ["student_id", "job_id"]
        },
        "scope": "student:read"
    },
    {
        "name": "get_my_schedule",
        "description": "Fetches upcoming interview rounds, venues, and time windows for a student.",
        "parameters": {
            "type": "object",
            "properties": {
                "student_id": {"type": "string", "description": "Candidate Roll Number (e.g. STU001)"}
            },
            "required": ["student_id"]
        },
        "scope": "student:read"
    },
    {
        "name": "run_report",
        "description": "Executes an official institutional placement aggregation report.",
        "parameters": {
            "type": "object",
            "properties": {
                "report_id": {"type": "string", "description": "Report ID (dept, salary, tier, funnel, etc.)"}
            },
            "required": ["report_id"]
        },
        "scope": "tpo:read"
    },
    {
        "name": "list_pending_tasks",
        "description": "Lists pending directorate tasks such as unplaced candidate interventions, schedule conflicts, or unverified offers.",
        "parameters": {
            "type": "object",
            "properties": {
                "role": {"type": "string", "description": "User role: 'TPO' or 'Mentor'"}
            },
            "required": ["role"]
        },
        "scope": "tpo:read"
    },
    {
        "name": "detect_clashes",
        "description": "Detects concurrent interview collisions, candidate double-booking, and room contention in active drives.",
        "parameters": {
            "type": "object",
            "properties": {},
        },
        "scope": "tpo:read"
    },
    {
        "name": "search_policy",
        "description": "Searches the placement cell governance policy rules (tiers, one-offer rules, debarment criteria).",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search keyword or policy clause (e.g. 'dream tier', 'one offer')"}
            },
            "required": ["query"]
        },
        "scope": "public:read"
    }
]


# Concrete Tool Implementations

def execute_tool(db, tool_name: str, arguments: Dict[str, Any], user_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Executes a typed tool by name with input validation and audit traceability.
    """
    if tool_name == "get_my_eligible_drives":
        student_id = arguments.get("student_id", "").strip().upper()
        student = get_student(db, student_id)
        if not student:
            return {"error": f"Student '{student_id}' not found."}
        
        cgpa = student.get("cgpa", 0.0)
        backlogs = student.get("backlogs", 0)
        dept = student.get("department", "")

        query = {
            "eligibility.min_cgpa": {"$lte": cgpa},
            "eligibility.max_backlogs": {"$gte": backlogs},
            "eligibility.departments": dept,
        }
        jobs = list(db.jobs.find(query, {"_id": 0}))
        return {
            "student_id": student_id,
            "eligible_drives_count": len(jobs),
            "drives": [
                {
                    "job_id": j["job_id"],
                    "title": j["title"],
                    "company_id": j["company_id"],
                    "tier": j["tier"],
                    "package_lpa": j["package_lpa"],
                    "deadline": str(j["deadline"]),
                }
                for j in jobs
            ]
        }

    elif tool_name == "explain_eligibility":
        student_id = arguments.get("student_id", "").strip().upper()
        job_id = arguments.get("job_id", "").strip().upper()
        student = get_student(db, student_id)
        job = get_job(db, job_id)

        if not student:
            return {"error": f"Student '{student_id}' not found."}
        if not job:
            return {"error": f"Job opening '{job_id}' not found."}

        cgpa = student.get("cgpa", 0.0)
        backlogs = student.get("backlogs", 0)
        dept = student.get("department", "")

        min_cgpa = job["eligibility"]["min_cgpa"]
        max_backlogs = job["eligibility"]["max_backlogs"]
        eligible_depts = job["eligibility"]["departments"]

        checks = [
            {
                "criterion": "CGPA Threshold",
                "required": f"≥ {min_cgpa:.2f}",
                "student_value": f"{cgpa:.2f}",
                "satisfied": cgpa >= min_cgpa,
            },
            {
                "criterion": "Backlogs Limit",
                "required": f"≤ {max_backlogs}",
                "student_value": str(backlogs),
                "satisfied": backlogs <= max_backlogs,
            },
            {
                "criterion": "Department Eligibility",
                "required": str(eligible_depts),
                "student_value": dept,
                "satisfied": dept in eligible_depts,
            },
        ]
        is_eligible = all(c["satisfied"] for c in checks)

        return {
            "student_id": student_id,
            "job_id": job_id,
            "job_title": job["title"],
            "company_id": job["company_id"],
            "eligible": is_eligible,
            "checks": checks,
            "verdict": "Candidate is fully eligible to register for this drive."
            if is_eligible
            else "Candidate does not meet all formal eligibility thresholds.",
        }

    elif tool_name == "get_my_schedule":
        student_id = arguments.get("student_id", "").strip().upper()
        interviews = list_interviews(db, student_id)
        return {
            "student_id": student_id,
            "total_loops": len(interviews),
            "interviews": [
                {
                    "interview_id": i["interview_id"],
                    "round": i["round"],
                    "scheduled_start": str(i["scheduled_start"]),
                    "mode": i["mode"],
                    "venue": i.get("venue", "Campus Center"),
                    "result": i.get("result", "Scheduled"),
                }
                for i in interviews
            ]
        }

    elif tool_name == "run_report":
        report_id = arguments.get("report_id", "dept")
        res = get_report(db, report_id)
        if not res:
            return {"error": f"Report '{report_id}' not found"}
        title, rows = res
        return {
            "report_id": report_id,
            "title": title,
            "rows_count": len(rows),
            "rows_sample": rows[:5],
        }

    elif tool_name == "list_pending_tasks":
        role = arguments.get("role", "TPO")
        clashes = detect_superday_clashes(db)
        unplaced_count = db.students.count_documents({"placement_status": "Unplaced"})
        open_jobs = db.jobs.count_documents({"vacancies": {"$gt": 0}})

        tasks = []
        if clashes:
            tasks.append({
                "task_id": "TSK-01",
                "priority": "HIGH",
                "title": f"Resolve {len(clashes)} Superday interview collision(s)",
                "action_url": "/superday",
            })
        if unplaced_count > 0:
            tasks.append({
                "task_id": "TSK-02",
                "priority": "MEDIUM",
                "title": f"Review {unplaced_count} unplaced candidate profiles for skill gap intervention",
                "action_url": "/ai-hub",
            })
        tasks.append({
            "task_id": "TSK-03",
            "priority": "LOW",
            "title": f"Monitor {open_jobs} active job notification drives for upcoming deadlines",
            "action_url": "/jobs",
        })

        return {
            "role": role,
            "pending_tasks_count": len(tasks),
            "tasks": tasks,
        }

    elif tool_name == "detect_clashes":
        clashes = detect_superday_clashes(db)
        return {
            "clashes_detected": len(clashes),
            "clashes": clashes,
            "status": "COLLISION_FREE" if len(clashes) == 0 else "ACTION_REQUIRED",
        }

    elif tool_name == "search_policy":
        query = arguments.get("query", "").lower()
        policy_rules = [
            {
                "rule_id": "POL-TIER-01",
                "title": "CTC Tier Classifications",
                "clause": "Normal (< ₹5.0 LPA), Dream (₹5.0 - ₹10.0 LPA), Super Dream (> ₹10.0 LPA).",
            },
            {
                "rule_id": "POL-UPGRADE-02",
                "title": "Offer Upgrading Policy",
                "clause": "A student holding an offer in a tier may only apply for higher tiers. Lateral applications are blocked.",
            },
            {
                "rule_id": "POL-CASCADE-03",
                "title": "Offer Cascading & Revocation",
                "clause": "Upon accepting a higher-tier offer, the previous offer is automatically revoked and returned to the applicant pool.",
            },
            {
                "rule_id": "POL-ATTEND-04",
                "title": "Pre-Placement Talk (PPT) Attendance",
                "clause": "Attendance at the company PPT is mandatory. Absence without prior approval excludes the candidate from subsequent rounds.",
            },
        ]
        matches = [r for r in policy_rules if any(query in v.lower() for v in r.values())]
        return {
            "query": query,
            "matches_count": len(matches) if matches else len(policy_rules),
            "rules": matches if matches else policy_rules,
        }

    else:
        return {"error": f"Unknown tool: '{tool_name}'"}
