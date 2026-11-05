"""Post-Offer Renege & Ghosting Risk Predictor."""
from datetime import datetime, timezone


def calculate_renege_risk(db, student_id):
    """Calculates offer renege / flight risk for a placed student based on:
      1. Salary gap vs department cohort average.
      2. Package tier (Normal tier candidates are 3.5x more likely to renege than Super Dream).
      3. Post-offer activity leakage (browsing/applying after being placed).
    """
    student = db.students.find_one({"student_id": student_id}, {"_id": 0})
    if not student:
        return None

    placement = db.placements.find_one(
        {"student_id": student_id, "status": {"$ne": "Revoked_Upgraded"}},
        {"_id": 0}
    )
    if not placement:
        return None

    package = placement.get("package_lpa", 0.0)
    tier = placement.get("tier", "Normal")
    dept = student.get("department", "CSE")

    # 1. Department Average CTC Benchmark
    pipeline = [
        {"$match": {"department": dept, "placement_status": "Placed"}},
        {"$lookup": {"from": "placements", "localField": "student_id", "foreignField": "student_id", "as": "plc"}},
        {"$unwind": "$plc"},
        {"$match": {"plc.status": {"$ne": "Revoked_Upgraded"}}},
        {"$group": {"_id": None, "avg_ctc": {"$avg": "$plc.package_lpa"}}},
    ]
    avg_result = list(db.students.aggregate(pipeline))
    dept_avg = avg_result[0]["avg_ctc"] if avg_result else package or 6.0
    dept_avg = round(dept_avg, 2)

    # 2. Salary Delta Calculation
    salary_ratio = package / dept_avg if dept_avg else 1.0

    # 3. Post-Offer Activity Leakage
    placement_date = placement.get("placement_date")
    post_offer_leaks = 0
    if placement_date:
        post_offer_leaks = db.applications.count_documents({
            "student_id": student_id,
            "application_date": {"$gt": placement_date},
        })

    # 4. Composite Probability Calculation (0 - 100%)
    # Base probability
    prob = 15.0

    # Salary Delta factor
    if salary_ratio < 0.7:
        prob += 35.0  # severely below cohort average
    elif salary_ratio < 0.9:
        prob += 20.0  # moderately below cohort average
    elif salary_ratio > 1.3:
        prob -= 10.0  # high package anchor

    # Tier vulnerability factor
    if tier == "Normal":
        prob += 20.0
    elif tier == "Dream":
        prob += 5.0
    elif tier == "Super Dream":
        prob -= 15.0

    # Post-offer leak penalty
    if post_offer_leaks > 0:
        prob += min(30.0, post_offer_leaks * 15.0)

    # Clamp between 5% and 95%
    prob = max(5.0, min(95.0, prob))

    risk_level = "CRITICAL" if prob >= 65 else "MODERATE" if prob >= 35 else "STABLE"

    if risk_level == "CRITICAL":
        recommendation = "High flight risk. Immediate HR touchpoint recommended; issue sign-on pre-onboarding kit."
    elif risk_level == "MODERATE":
        recommendation = "Moderate risk. Add candidate to automated bi-weekly keep-warm digest."
    else:
        recommendation = "Candidate profile is stable. High conversion likelihood."

    return {
        "student_id": student_id,
        "name": student.get("name"),
        "department": dept,
        "company_id": placement.get("company_id"),
        "package_lpa": package,
        "tier": tier,
        "dept_avg_lpa": dept_avg,
        "salary_ratio": round(salary_ratio, 2),
        "post_offer_leaks": post_offer_leaks,
        "renege_probability": round(prob, 1),
        "risk_level": risk_level,
        "recommendation": recommendation,
    }


def batch_renege_radar(db):
    """Calculates flight risk for all active placed students, sorted by highest risk first."""
    placed = db.students.find({"placement_status": "Placed"}, {"student_id": 1, "_id": 0})
    radar = []
    for s in placed:
        r = calculate_renege_risk(db, s["student_id"])
        if r:
            radar.append(r)
    radar.sort(key=lambda x: -x["renege_probability"])
    return radar

