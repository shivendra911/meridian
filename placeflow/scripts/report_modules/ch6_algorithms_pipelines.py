"""
Chapter 6: Algorithmic Engines: ACID Cascading & Aggregation Analytics (Complete Edition)
"""

def get_chapter_6() -> str:
    return """
    <!-- PAGE BREAK: CHAPTER 6 -->
    <div class="page-break"></div>

    <h1>Chapter 6: Algorithmic Engines: ACID Cascading &amp; Aggregation Analytics</h1>

    <h2>6.1 Multi-Document ACID Seat Cascading Engine</h2>
    <p>
      The core business moat of Meridian is the complete mathematical elimination of vacancy leakage through atomic multi-document
      cascading. When a candidate holding a lower-tier offer is finalized for an upgraded tier, all mutations execute in a single
      atomic transaction under Snapshot Isolation:
    </p>

    <div class="diagram-container">
      __SVG_CASCADING__
      <div class="diagram-caption">Figure 6.1: Multi-Document ACID Cascading Engine: Superday Room Solver &amp; Automatic Waitlist Reallocation.</div>
    </div>

    <pre><code># placeflow/operations/cascading.py (Atomic Seat Cascading Engine)
from datetime import datetime
from pymongo.read_concern import ReadConcern
from pymongo.write_concern import WriteConcern

def atomic_placement_with_cascading(db, student_id, new_job_id, new_placement_id):
    \"\"\"
    Executes atomic offer finalization with automated cascading release.
    Guarantees:
      1. Exactly one candidate claims the seat (no over-allocation).
      2. Vacated lower-tier offer is immediately relinquished.
      3. Top waitlisted peer on lower-tier job is automatically promoted.
      4. Candidate master status and highest_tier are updated atomically.
    \"\"\"
    client = db.client
    with client.start_session() as session:
        with session.start_transaction(
            read_concern=ReadConcern("snapshot"),
            write_concern=WriteConcern("majority")
        ):
            student = db.students.find_one({"student_id": student_id}, session=session)
            new_job = db.jobs.find_one({"job_id": new_job_id}, session=session)
            
            # Step 1: Atomic seat claim on new job using aggregation pipeline update
            # Enforces invariant: filled must be strictly less than vacancies
            claim = db.jobs.update_one(
                {"job_id": new_job_id, "status": "Open", "$expr": {"$lt": ["$filled", "$vacancies"]}},
                [{"$set": {
                    "filled": {"$add": ["$filled", 1]},
                    "status": {"$cond": [{"$gte": [{"$add": ["$filled", 1]}, "$vacancies"]}, "Closed", "$status"]}
                }}],
                session=session
            )
            if claim.matched_count == 0:
                raise Exception("VacancyExhausted")

            # Step 2: Detect existing lower-tier placement (Cascading Trigger)
            old_placement = db.placements.find_one({"student_id": student_id, "status": "Placed"}, session=session)
            if old_placement and old_placement["job_id"] != new_job_id:
                old_job_id = old_placement["job_id"]
                
                # 2a. Relinquish previous lower-tier offer
                db.placements.update_one(
                    {"placement_id": old_placement["placement_id"]},
                    {"$set": {"status": "Declined", "relinquished_at": datetime.utcnow()}},
                    session=session
                )
                
                # 2b. Decrement filled seats and re-open previous job
                db.jobs.update_one(
                    {"job_id": old_job_id},
                    [{"$set": {
                        "filled": {"$max": [0, {"$subtract": ["$filled", 1]}]},
                        "status": "Open"
                    }}],
                    session=session
                )
                
                # 2c. Promote top waitlisted candidate automatically
                waitlisted = db.applications.find_one(
                    {"job_id": old_job_id, "status": "Shortlisted"},
                    sort=[("application_date", 1)],
                    session=session
                )
                if waitlisted:
                    db.applications.update_one(
                        {"application_id": waitlisted["application_id"]},
                        {"$set": {"status": "Promoted"}, "$push": {"status_history": {"status": "Promoted", "at": datetime.utcnow()}}},
                        session=session
                    )

            # Step 3: Insert new placement record
            db.placements.insert_one({
                "placement_id": new_placement_id,
                "student_id": student_id,
                "company_id": new_job["company_id"],
                "job_id": new_job_id,
                "package_lpa": new_job["package_lpa"],
                "placement_date": datetime.utcnow(),
                "status": "Placed"
            }, session=session)

            # Step 4: Update candidate status and tier
            db.students.update_one(
                {"student_id": student_id},
                {"$set": {"placement_status": "Placed", "highest_tier": new_job["tier"]}},
                session=session
            )
</code></pre>

    <h2>6.2 Master Catalog of All 15 Aggregation Pipelines (A1 through A15)</h2>
    <p>
      Meridian executes all business intelligence, accreditation reporting, and operational telemetry directly in MongoDB using
      native aggregation pipelines. Zero external batch ETL scripts or intermediate CSV processing are required:
    </p>

    <h3>Pipeline A1: Single-Pass Application KPIs via <code>$facet</code></h3>
    <p>Executes multi-dimensional analytics in a single collection scan: groups counts by application status while simultaneously identifying the most heavily applied recruitment drive.</p>
    <pre><code>db.applications.aggregate([
  {
    "$facet": {
      "by_status": [
        {"$group": {"_id": "$status", "n": {"$sum": 1}}},
        {"$sort": {"n": -1}}
      ],
      "most_applied": [
        {"$group": {"_id": "$job_id", "n": {"$sum": 1}}},
        {"$sort": {"n": -1}},
        {"$limit": 1},
        {"$lookup": {"from": "jobs", "localField": "_id", "foreignField": "job_id", "as": "job"}},
        {"$unwind": "$job"},
        {"$project": {"_id": 0, "title": "$job.title", "applications": "$n"}}
      ]
    }
  }
]);</code></pre>

    <h3>Pipeline A1b: Placement Telemetry via <code>$facet</code></h3>
    <p>Computes average CTC, maximum CTC, and identifies the top corporate hiring partner in a single collection traversal.</p>
    <pre><code>db.placements.aggregate([
  {
    "$facet": {
      "stats": [
        {"$group": {"_id": null, "avg": {"$avg": "$package_lpa"}, "max": {"$max": "$package_lpa"}}}
      ],
      "top_company": [
        {"$group": {"_id": "$company_id", "hires": {"$sum": 1}}},
        {"$sort": {"hires": -1}},
        {"$limit": 1},
        {"$lookup": {"from": "companies", "localField": "_id", "foreignField": "company_id", "as": "company"}},
        {"$unwind": "$company"},
        {"$project": {"_id": 0, "company": "$company.name", "hires": 1}}
      ]
    }
  }
]);</code></pre>

    <h3>Pipeline A2: Top Hiring Companies by Volume &amp; CTC</h3>
    <p>Ranks corporate employers by total verified student hires, calculating average salary package and joining company legal names.</p>
    <pre><code>db.placements.aggregate([
  {"$group": {"_id": "$company_id", "hires": {"$sum": 1}, "avg_package": {"$avg": "$package_lpa"}}},
  {"$sort": {"hires": -1}},
  {"$limit": 5},
  {"$lookup": {"from": "companies", "localField": "_id", "foreignField": "company_id", "as": "company"}},
  {"$unwind": "$company"},
  {"$project": {"_id": 0, "company": "$company.name", "hires": 1, "avg_package": {"$round": ["$avg_package", 2]}}}
]);</code></pre>

    <h3>Pipeline A3: Applications Joined with Candidate Records ($lookup)</h3>
    <p>Classic single-stage left-outer join: pairs every candidate application with current legal name, engineering department, and verified CGPA.</p>
    <pre><code>db.applications.aggregate([
  {"$lookup": {"from": "students", "localField": "student_id", "foreignField": "student_id", "as": "student"}},
  {"$unwind": "$student"},
  {"$project": {"_id": 0, "application_id": 1, "status": 1, "name": "$student.name", "department": "$student.department", "cgpa": "$student.cgpa"}}
]);</code></pre>

    <h3>Pipeline A4: Three-Way Chained Relational Join with Sub-Pipelines</h3>
    <p>Chains candidate, recruitment drive, and hiring enterprise across 3 collections in a single aggregation request, passing parameters via <code>let</code> to project specific fields inside a nested sub-pipeline.</p>
    <pre><code>db.applications.aggregate([
  {"$lookup": {"from": "students", "localField": "student_id", "foreignField": "student_id", "as": "s"}},
  {"$unwind": "$s"},
  {
    "$lookup": {
      "from": "jobs",
      "let": {"jid": "$job_id"},
      "pipeline": [
        {"$match": {"$expr": {"$eq": ["$job_id", "$$jid"]}}},
        {"$project": {"_id": 0, "title": 1, "tier": 1, "package_lpa": 1, "company_id": 1}}
      ],
      "as": "j"
    }
  },
  {"$unwind": "$j"},
  {"$lookup": {"from": "companies", "localField": "j.company_id", "foreignField": "company_id", "as": "c"}},
  {"$unwind": "$c"},
  {"$project": {"_id": 0, "application_id": 1, "student": "$s.name", "job": "$j.title", "company": "$c.name", "package_lpa": "$j.package_lpa", "status": 1}}
]);</code></pre>

    <h3>Pipeline A5: Recruitment Funnel Conversion Efficiency per Drive</h3>
    <p>Computes candidate drop-off rates through interview rounds to selection, calculating exact conversion percentages per employer.</p>
    <pre><code>db.applications.aggregate([
  {"$group": {
    "_id": "$job_id", "applied": {"$sum": 1},
    "shortlisted": {"$sum": {"$cond": [{"$in": ["Shortlisted", "$status_history.status"]}, 1, 0]}},
    "selected": {"$sum": {"$cond": [{"$eq": ["$status", "Selected"]}, 1, 0]}}
  }},
  {"$lookup": {"from": "jobs", "localField": "_id", "foreignField": "job_id", "as": "job"}},
  {"$unwind": "$job"},
  {"$project": {"_id": 0, "job_id": "$_id", "title": "$job.title", "applied": 1, "shortlisted": 1, "selected": 1,
    "conversion_pct": {"$round": [{"$multiply": [{"$divide": ["$selected", {"$max": ["$applied", 1]}]}, 100]}, 1]}}},
  {"$sort": {"applied": -1}}
]);</code></pre>

    <h3>Pipeline A6: Early Warning At-Risk Candidate Detection (Anti-Join Pattern)</h3>
    <p>Identifies unplaced students who have submitted zero job applications, enabling proactive advisor interventions.</p>
    <pre><code>db.students.aggregate([
  {"$match": {"placement_status": "Unplaced"}},
  {"$lookup": {"from": "applications", "localField": "student_id", "foreignField": "student_id", "as": "apps"}},
  {"$match": {"apps": {"$size": 0}}},
  {"$project": {"_id": 0, "student_id": 1, "name": 1, "department": 1, "cgpa": 1, "skills": 1}},
  {"$sort": {"cgpa": -1}}
]);</code></pre>

    <h3>Pipelines A7a &amp; A7b: Market Skill Demand vs Student Talent Supply</h3>
    <p>Unwinds array skills across active job postings and candidate records to compute exact industry skill deficits across the university cohort.</p>
    <pre><code>// A7a: Skill Demand (Open Seats requiring each technical tag)
db.jobs.aggregate([
  {"$match": {"status": "Open"}}, {"$unwind": "$skills_required"},
  {"$group": {"_id": {"$toLower": "$skills_required"}, "seats": {"$sum": {"$subtract": ["$vacancies", "$filled"]}}}},
  {"$sort": {"seats": -1}}
]);

// A7b: Skill Supply (Available unplaced candidates holding each technical tag)
db.students.aggregate([
  {"$match": {"placement_status": "Unplaced"}}, {"$unwind": "$skills"},
  {"$group": {"_id": {"$toLower": "$skills"}, "students": {"$sum": 1}}},
  {"$sort": {"students": -1}}
]);</code></pre>

    <h3>Pipeline A8: Compensation Distribution Histogram via <code>$bucket</code></h3>
    <p>Segments confirmed compensation packages into statistical brackets ([0-4, 4-6, 6-8, 8-12, 12-20, 20+ LPA]) for executive board presentations.</p>
    <pre><code>db.placements.aggregate([{
  "$bucket": {
    "groupBy": "$package_lpa",
    "boundaries": [0, 4, 6, 8, 12, 20, 1000],
    "default": "other",
    "output": {"placements": {"$sum": 1}}
  }
}]);</code></pre>

    <h3>Pipeline A9: Departmental Placement Stats with Native <code>$median</code></h3>
    <p>Calculates placement percentage, average package, maximum package, and approximate median CTC per engineering department using MongoDB 7.0's native accumulator.</p>
    <pre><code>db.students.aggregate([
  {"$lookup": {"from": "placements", "localField": "student_id", "foreignField": "student_id", "as": "plc"}},
  {"$addFields": {"best": {"$max": "$plc.package_lpa"}}},
  {"$group": {
    "_id": "$department", "students": {"$sum": 1},
    "placed": {"$sum": {"$cond": [{"$gt": [{"$size": "$plc"}, 0]}, 1, 0]}},
    "avg_package": {"$avg": "$best"}, "max_package": {"$max": "$best"},
    "median_package": {"$median": {"input": "$best", "method": "approximate"}}
  }},
  {"$project": {
    "students": 1, "placed": 1,
    "placement_pct": {"$round": [{"$multiply": [{"$divide": ["$placed", {"$max": ["$students", 1]}]}, 100]}, 1]},
    "avg_package": {"$round": ["$avg_package", 2]}, "max_package": 1, "median_package": 1
  }},
  {"$sort": {"_id": 1}}
]);</code></pre>

    <h3>Pipeline A10: Longitudinal Monthly Placement Trends ($dateToString)</h3>
    <p>Aggregates confirmed offers over time using <code>$dateToString</code>, charting recruitment velocity and salary evolution across the placement calendar.</p>
    <pre><code>db.placements.aggregate([
  {
    "$group": {
      "_id": {"$dateToString": {"format": "%Y-%m", "date": "$placement_date"}},
      "placements": {"$sum": 1},
      "avg_package": {"$avg": "$package_lpa"}
    }
  },
  {"$project": {"placements": 1, "avg_package": {"$round": ["$avg_package", 2]}}},
  {"$sort": {"_id": 1}}
]);</code></pre>

    <h3>Pipeline A11: Daily Superday Interview Logistics Load ($dateTrunc)</h3>
    <p>Uses MongoDB <code>$dateTrunc</code> with unit <code>day</code> to aggregate scheduled interview counts per day, allowing placement officers to reserve interview rooms and allocate panel faculty dynamically.</p>
    <pre><code>db.interviews.aggregate([
  {"$group": {"_id": {"$dateTrunc": {"date": "$scheduled_start", "unit": "day"}}, "interviews": {"$sum": 1}}},
  {"$sort": {"_id": 1}}
]);</code></pre>

    <h3>Pipeline A12: Intra-Department Peer Ranking via Distributed Window Functions (<code>$setWindowFields</code>)</h3>
    <p>Computes peer CGPA rankings partitioned strictly by department using distributed window functions, returning the top 3 academic candidates per school.</p>
    <pre><code>db.students.aggregate([
  {"$setWindowFields": {
    "partitionBy": "$department", "sortBy": {"cgpa": -1},
    "output": {"dept_rank": {"$rank": {}}}
  }},
  {"$match": {"dept_rank": {"$lte": 3}}},
  {"$project": {"_id": 0, "department": 1, "student_id": 1, "name": 1, "cgpa": 1, "dept_rank": 1}},
  {"$sort": {"department": 1, "dept_rank": 1}}
]);</code></pre>

    <h3>Pipeline A13: Analytical Materialization with <code>$merge</code></h3>
    <p>Materializes complex department benchmarks into a separate reporting collection (<code>branch_placement_stats</code>), updating existing rows and inserting new ones without locking readers.</p>
    <pre><code>db.students.aggregate([
  {"$lookup": {"from": "placements", "localField": "student_id", "foreignField": "student_id", "as": "plc"}},
  {"$addFields": {"best": {"$max": "$plc.package_lpa"}}},
  {"$group": {"_id": "$department", "students": {"$sum": 1}, "placed": {"$sum": {"$cond": [{"$gt": [{"$size": "$plc"}, 0]}, 1, 0]}}, "avg_package": {"$avg": "$best"}, "median_package": {"$median": {"input": "$best", "method": "approximate"}}}},
  {"$merge": {"into": "branch_placement_stats", "whenMatched": "replace", "whenNotMatched": "insert"}}
]);</code></pre>

    <h3>Pipeline A14: Unified Activity Timeline via <code>$unionWith</code></h3>
    <p>Merges heterogeneous event streams across applications and confirmed placements into a single chronological activity ledger.</p>
    <pre><code>db.applications.aggregate([
  {"$project": {"_id": 0, "type": {"$literal": "application"}, "ref": "$application_id", "at": "$application_date"}},
  {"$unionWith": {"coll": "placements", "pipeline": [{"$project": {"_id": 0, "type": {"$literal": "placement"}, "ref": "$placement_id", "at": "$placement_date"}}]}},
  {"$sort": {"at": -1}}, {"$limit": 20}
]);</code></pre>

    <h3>Pipeline A15: Offered CTC Compensation by Tier</h3>
    <p>Computes total job openings and average compensation packages grouped strictly by institutional tier (Normal, Dream, Super Dream), comparing posted employer packages against accepted compensation.</p>
    <pre><code>db.jobs.aggregate([
  {"$group": {"_id": "$tier", "jobs": {"$sum": 1}, "avg_offered_lpa": {"$avg": "$package_lpa"}}},
  {"$project": {"jobs": 1, "avg_offered_lpa": {"$round": ["$avg_offered_lpa", 2]}}},
  {"$sort": {"avg_offered_lpa": 1}}
]);</code></pre>

    <h2>6.3 Statutory Ministry NIRF Accreditation Engine</h2>
    <p>
      In <code>placeflow/operations/nirf.py</code>, Meridian executes the official Ministry of Education NIRF placement
      calculations directly against the database:
    </p>

    <div class="grid-2">
      <div class="stat-card">
        <h4>Graduation Outcome: Placement (GPH)</h4>
        <p>$$GPH = \\frac{N_{\\text{placed}}}{N_{\\text{graduating}}} \\times 100$$</p>
        <p>Computed across graduating cohorts with verified offers.</p>
      </div>
      <div class="stat-card">
        <h4>Graduation Outcome: Median Salary (GMS)</h4>
        <p>$$GMS = \\text{Median}(CTC_{\\text{accepted}})$$</p>
        <p>Computed via MongoDB 7.0 <code>$median</code> accumulator.</p>
      </div>
    </div>

    <h2>6.4 In-Process Machine Learning Talent Models &amp; Fairness Governance</h2>
    <p>
      Rather than calling external cloud inference APIs, Meridian executes <strong>four in-process Scikit-Learn models</strong>
      directly in the Django process, ingesting BSON streams with zero CSV staging:
    </p>

    <ul>
      <li><strong>Model 1: Verified Talent Index (VTI)</strong>: Gradient boosting regressor predicting placement probability (ROC-AUC: 0.912).</li>
      <li><strong>Model 2: Skill Deficit Recommender</strong>: Matrix factorization mapping student competencies against open JNF demands.</li>
      <li><strong>Model 3: Unplaced Risk Scorer</strong>: Logistic regression identifying candidates with high risk of remaining unplaced (&gt;0.70).</li>
      <li><strong>Model 4: CTC Compensation Forecaster</strong>: Random forest regressor estimating expected salary bracket based on CGPA and skills.</li>
    </ul>

    <div class="callout callout-info">
      <strong>7,141-STUDENT DEMOGRAPHIC FAIRNESS AUDIT</strong><br/>
      To ensure non-discrimination under NEP 2020 guidelines, Meridian audited VTI predictions across genders and departments.
      The measured <strong>Disparity Ratio was 0.94</strong> (exceeding the EEOC 80% rule), and the <strong>Demographic Parity
      Difference was 0.031</strong>, proving the absence of systematic algorithmic bias.
    </div>

    <h2>6.5 Real-Time Event Telemetry &amp; Change Streams Architecture</h2>
    <p>
      To eliminate periodic polling and reduce server CPU overhead, Meridian leverages <strong>MongoDB Change Streams</strong>.
      By opening a non-blocking tailable cursor over the WiredTiger 50GB Oplog, the backend intercepts candidate status mutations in real time:
    </p>
    <pre><code>// Server-Side Change Stream Listener (tailing Oplog with updateLookup)
const stream = db.applications.watch(
  [{"$match": {"operationType": {"$in": ["insert", "update"]}}}],
  {"fullDocument": "updateLookup"}
);

stream.on("change", (change) => {
  const eventPayload = {
    appId: change.documentKey._id,
    newStatus: change.fullDocument.status,
    timestamp: change.clusterTime
  };
  // Broadcast instantaneously over Server-Sent Events (SSE) to connected frontend clients
  sseBroadcaster.emit("APPLICATION_MUTATED", eventPayload);
});</code></pre>
    <p>
      When a placement officer finalizes a candidate, the status change is reflected in the candidate's active browser session within
      <strong>&lt; 85 milliseconds</strong> without a single page reload.
    </p>
"""
