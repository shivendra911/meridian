"""Superday Multi-Track Drive Conflict Detection & Constraint-Satisfaction Auto-Slotter."""
from datetime import datetime, timedelta, timezone

from operations.common import log_event, parse_date, utcnow


def detect_conflicts(db, target_date=None):
    """Detect overlapping interview intervals for the same candidate or same venue.
    
    Two intervals [s1, e1] and [s2, e2] overlap if:
        s1 < e2 AND e1 > s2
    """
    interviews = list(db.interviews.find({}, {"_id": 0}).sort("scheduled_start", 1))
    conflicts = []

    for i in range(len(interviews)):
        for j in range(i + 1, len(interviews)):
            a = interviews[i]
            b = interviews[j]

            # Parse start and end times
            s_a = a["scheduled_start"]
            e_a = a["scheduled_end"]
            s_b = b["scheduled_start"]
            e_b = b["scheduled_end"]

            # Overlap condition
            if s_a < e_b and e_a > s_b:
                # Type 1: Candidate double-booked across companies
                if a["student_id"] == b["student_id"]:
                    conflicts.append({
                        "type": "CANDIDATE_CLASH",
                        "severity": "CRITICAL",
                        "student_id": a["student_id"],
                        "interview_a": a["interview_id"],
                        "interview_b": b["interview_id"],
                        "start_a": s_a,
                        "end_a": e_a,
                        "start_b": s_b,
                        "end_b": e_b,
                        "description": f"Candidate {a['student_id']} scheduled simultaneously for {a['interview_id']} and {b['interview_id']}.",
                    })
                # Type 2: Venue / Room Collision
                elif a.get("venue") and b.get("venue") and a["venue"] == b["venue"]:
                    conflicts.append({
                        "type": "VENUE_CLASH",
                        "severity": "HIGH",
                        "venue": a["venue"],
                        "interview_a": a["interview_id"],
                        "interview_b": b["interview_id"],
                        "start_a": s_a,
                        "end_a": e_a,
                        "start_b": s_b,
                        "end_b": e_b,
                        "description": f"Venue '{a['venue']}' double-booked for interviews {a['interview_id']} and {b['interview_id']}.",
                    })

    return conflicts


def auto_resolve_conflicts(db):
    """Interval Scheduling Constraint-Satisfaction Solver.
    
    For any clashing interview, finds the next available 45-minute continuous slot
    where neither the candidate nor the venue is occupied, and reschedules it atomically.
    """
    conflicts = detect_conflicts(db)
    if not conflicts:
        return 0, "No scheduling conflicts detected. Drive schedule is optimal."

    resolved_count = 0

    for clash in conflicts:
        # Reschedule interview_b
        target_id = clash["interview_b"]
        target = db.interviews.find_one({"interview_id": target_id})
        if not target:
            continue

        student_id = target["student_id"]
        venue = target.get("venue")
        base_date = target["scheduled_start"].date()

        # Search for available 45-minute slot starting from 09:00 to 18:00
        slot_duration = timedelta(minutes=45)
        candidate_time = datetime(base_date.year, base_date.month, base_date.day, 9, 0, tzinfo=timezone.utc)
        end_of_day = datetime(base_date.year, base_date.month, base_date.day, 18, 0, tzinfo=timezone.utc)

        slot_found = False
        while candidate_time + slot_duration <= end_of_day:
            slot_end = candidate_time + slot_duration

            # Check if student is busy during this slot
            student_busy = db.interviews.find_one({
                "interview_id": {"$ne": target_id},
                "student_id": student_id,
                "scheduled_start": {"$lt": slot_end},
                "scheduled_end": {"$gt": candidate_time},
            })

            # Check if venue is busy during this slot
            venue_busy = False
            if venue:
                venue_busy = db.interviews.find_one({
                    "interview_id": {"$ne": target_id},
                    "venue": venue,
                    "scheduled_start": {"$lt": slot_end},
                    "scheduled_end": {"$gt": candidate_time},
                })

            if not student_busy and not venue_busy:
                # Found clean slot! Reschedule target
                db.interviews.update_one(
                    {"interview_id": target_id},
                    {"$set": {
                        "scheduled_start": candidate_time,
                        "scheduled_end": slot_end,
                    }}
                )
                log_event(
                    db, "CLASH_RESOLVED", target_id,
                    f"Superday Solver rescheduled {target_id} ({student_id}) to {candidate_time.strftime('%H:%M')} - {slot_end.strftime('%H:%M')} (resolved clash with {clash['interview_a']})."
                )
                resolved_count += 1
                slot_found = True
                break

            candidate_time += timedelta(minutes=30)

    remaining = len(detect_conflicts(db))
    return resolved_count, f"Resolved {resolved_count} conflict(s). Remaining conflicts: {remaining}."
