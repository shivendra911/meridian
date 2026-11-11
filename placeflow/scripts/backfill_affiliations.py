"""PlaceFlow / Meridian — Backfill Person Affiliations & Profile Extensions (Phase 1).

Creates authoritative `person_affiliations` linking human `person_id`s to institutional records:
- Students -> students.student_id (type: STUDENT)
- Faculty -> faculty.faculty_id (type: FACULTY)
- Department Heads -> department_heads.hod_id (type: HOD)
- Deans / School Heads -> school_heads.hos_id (type: DEAN)

Enforces strict unique constraint on (tenant_id, type, record_id).
"""

import os
import sys
from pathlib import Path
from datetime import datetime, timezone

# Ensure placeflow root is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from database.connection import get_db

DEFAULT_TENANT_ID = "3f0708bc-4852-4900-a0b2-5e27865a36fe"


def backfill_person_affiliations(db=None) -> dict:
    if db is None:
        db = get_db()

    now = datetime.now(timezone.utc)
    counts = {"student": 0, "faculty": 0, "hod": 0, "dean": 0, "profiles_extended": 0}

    # 1. Backfill from Students
    for s in db.students.find({"person_id": {"$exists": True, "$ne": None}}):
        sid = s["student_id"]
        pid = s["person_id"]
        tid = s.get("tenant_id") or DEFAULT_TENANT_ID
        aff_id = f"aff_stu_{sid}"

        db.person_affiliations.update_one(
            {"tenant_id": tid, "type": "STUDENT", "record_id": sid},
            {
                "$set": {
                    "affiliation_id": aff_id,
                    "tenant_id": tid,
                    "person_id": pid,
                    "type": "STUDENT",
                    "record_id": sid,
                    "status": "VERIFIED",
                    "verified_by": "SYSTEM_IMPORT",
                    "verified_at": s.get("created_at") or now,
                    "source": "IMPORT",
                    "created_at": s.get("created_at") or now,
                    "metadata": {
                        "reg_no": s.get("reg_no"),
                        "department": s.get("department"),
                        "batch": s.get("batch"),
                    },
                }
            },
            upsert=True,
        )
        counts["student"] += 1

    # 2. Backfill from Faculty
    for f in db.faculty.find({"person_id": {"$exists": True, "$ne": None}}):
        fid = f.get("faculty_id") or f.get("mentor_uid") or str(f["_id"])
        pid = f["person_id"]
        tid = f.get("tenant_id") or DEFAULT_TENANT_ID
        aff_id = f"aff_fac_{fid}"

        db.person_affiliations.update_one(
            {"tenant_id": tid, "type": "FACULTY", "record_id": fid},
            {
                "$set": {
                    "affiliation_id": aff_id,
                    "tenant_id": tid,
                    "person_id": pid,
                    "type": "FACULTY",
                    "record_id": fid,
                    "status": "VERIFIED",
                    "verified_by": "SYSTEM_IMPORT",
                    "verified_at": f.get("created_at") or now,
                    "source": "IMPORT",
                    "created_at": f.get("created_at") or now,
                    "metadata": {
                        "department": f.get("department"),
                        "designation": f.get("academic_rank") or f.get("designation"),
                    },
                }
            },
            upsert=True,
        )
        counts["faculty"] += 1

    # 3. Backfill from Department Heads
    for h in db.department_heads.find({"person_id": {"$exists": True, "$ne": None}}):
        hid = h.get("hod_id") or str(h["_id"])
        pid = h["person_id"]
        tid = h.get("tenant_id") or DEFAULT_TENANT_ID
        aff_id = f"aff_hod_{hid}"

        db.person_affiliations.update_one(
            {"tenant_id": tid, "type": "HOD", "record_id": hid},
            {
                "$set": {
                    "affiliation_id": aff_id,
                    "tenant_id": tid,
                    "person_id": pid,
                    "type": "HOD",
                    "record_id": hid,
                    "status": "VERIFIED",
                    "verified_by": "SYSTEM_IMPORT",
                    "verified_at": h.get("created_at") or now,
                    "source": "IMPORT",
                    "created_at": h.get("created_at") or now,
                    "metadata": {
                        "department": h.get("department"),
                        "school": h.get("school"),
                    },
                }
            },
            upsert=True,
        )
        counts["hod"] += 1

    # 4. Backfill from School Heads (Deans)
    for sh in db.school_heads.find({"person_id": {"$exists": True, "$ne": None}}):
        hos_id = sh.get("hos_id") or str(sh["_id"])
        pid = sh["person_id"]
        tid = sh.get("tenant_id") or DEFAULT_TENANT_ID
        aff_id = f"aff_dean_{hos_id}"

        db.person_affiliations.update_one(
            {"tenant_id": tid, "type": "DEAN", "record_id": hos_id},
            {
                "$set": {
                    "affiliation_id": aff_id,
                    "tenant_id": tid,
                    "person_id": pid,
                    "type": "DEAN",
                    "record_id": hos_id,
                    "status": "VERIFIED",
                    "verified_by": "SYSTEM_IMPORT",
                    "verified_at": sh.get("created_at") or now,
                    "source": "IMPORT",
                    "created_at": sh.get("created_at") or now,
                    "metadata": {
                        "school": sh.get("school"),
                    },
                }
            },
            upsert=True,
        )
        counts["dean"] += 1

    # 5. Extend Person Identity default attributes
    updated_persons = db.person_identities.update_many(
        {"locale": {"$exists": False}},
        {
            "$set": {
                "locale": "en-IN",
                "timezone": "Asia/Kolkata",
                "notification_prefs": {"email": True, "in_app": True},
            }
        },
    )
    counts["profiles_extended"] = updated_persons.modified_count

    return counts


if __name__ == "__main__":
    res = backfill_person_affiliations()
    print("Backfill complete:", res)

