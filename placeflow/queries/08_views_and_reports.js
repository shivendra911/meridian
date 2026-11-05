db = db.getSiblingDB("college_placement_db");

print("=== W1 view: query it like a collection");
printjson(db.v_application_details.find({status: "Shortlisted"}, {student_name: 1, job_title: 1, company_name: 1, _id: 0}).toArray());

print("\n=== W2 materialized report written by $merge in 05_aggregation_pipelines.js (A13)");
printjson(db.branch_placement_stats.find().sort({_id: 1}).toArray());

print("\n=== W3 capped collection keeps only the newest 500 events, in insertion order");
for (let i = 0; i < 600; i++) {
  db.activity_feed.insertOne({event_type: "DEMO", entity_id: "X" + i, message: "event " + i, at: new Date()});
}
print("isCapped:", db.activity_feed.isCapped(), "| documents:", db.activity_feed.countDocuments());
printjson(db.activity_feed.find({}, {_id: 0, entity_id: 1}).sort({$natural: 1}).limit(1).toArray());  // oldest kept: X100
print("(this filled the feed with demo events; reset with python setup_database.py --reset)");

