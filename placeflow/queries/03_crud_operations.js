db = db.getSiblingDB("college_placement_db");
const sep = (t) => print("\n=== " + t);

sep("C1 insertOne: register a student");
printjson(db.students.insertOne({student_id: "STU101", name: "Test Student", email: "test101@univ.edu",
  department: "CSE", year: 4, cgpa: 8.2, backlogs: 0, skills: ["Java"],
  placement_status: "Unplaced", created_at: new Date()}));

sep("C2 insertMany ordered:false with one duplicate: valid rows still go in");
try {
  db.companies.insertMany([
    {company_id: "COMP101", name: "Acme Systems", industry: "IT Services", location: "Pune"},
    {company_id: "COMP001", name: "Duplicate Inc", industry: "IT Services", location: "Pune"},
    {company_id: "COMP102", name: "Beta Labs", industry: "Fintech", location: "Delhi"}
  ], {ordered: false});
} catch (e) { print("expected error:", e.message.split("\n")[0]); }
print("valid rows inserted:", db.companies.countDocuments({company_id: {$in: ["COMP101", "COMP102"]}}));

sep("R1 eligible unplaced candidates (operators, projection, sort, limit)");
printjson(db.students.find(
  {department: {$in: ["CSE", "IT"]}, cgpa: {$gte: 7.5}, backlogs: {$lte: 0}, placement_status: "Unplaced"},
  {_id: 0, student_id: 1, name: 1, cgpa: 1}).sort({cgpa: -1}).limit(10).toArray());

sep("R2 students having ALL required skills ($all)");
printjson(db.students.find({skills: {$all: ["Java", "MySQL"]}}, {_id: 0, name: 1, skills: 1}).toArray());

sep("R3 flexible search ($or / $and / $nor / regex)");
printjson(db.students.find({$or: [{name: /^a/i}, {$and: [{department: "ECE"}, {cgpa: {$gte: 7}}]}]},
  {_id: 0, name: 1, department: 1}).toArray());
printjson(db.students.find({$nor: [{department: "CSE"}, {backlogs: {$gt: 0}}]}, {_id: 0, name: 1}).toArray());

sep("R4 text search ranked by relevance");
printjson(db.jobs.find({$text: {$search: "java backend"}}, {_id: 0, title: 1, score: {$meta: "textScore"}})
  .sort({score: {$meta: "textScore"}}).toArray());

sep("R5 range-based pagination (faster than skip on large collections)");
printjson(db.students.find({student_id: {$gt: "STU003"}}, {_id: 0, student_id: 1}).sort({student_id: 1}).limit(3).toArray());

sep("R6 counts and distinct");
print("exact:", db.students.countDocuments(), "| estimated:", db.students.estimatedDocumentCount());
printjson(db.students.distinct("department"));

sep("U1 updateOne $set");
printjson(db.students.updateOne({student_id: "STU005"}, {$set: {cgpa: 7.0}}));

sep("U2 updateMany: expiry sweep closes jobs past their deadline");
printjson(db.jobs.updateMany({status: "Open", deadline: {$lt: new Date()}}, {$set: {status: "Closed"}}));

sep("U3 $addToSet / $pull");
db.students.updateOne({student_id: "STU001"}, {$addToSet: {skills: "Docker"}});
db.students.updateOne({student_id: "STU001"}, {$addToSet: {skills: "Docker"}});  // no duplicate added
printjson(db.students.findOne({student_id: "STU001"}, {_id: 0, skills: 1}));
db.students.updateOne({student_id: "STU001"}, {$pull: {skills: "Docker"}});

sep("U4 upsert: idempotent company sync");
printjson(db.companies.updateOne({company_id: "COMP005"},
  {$set: {name: "Freshworks", industry: "SaaS", location: "Chennai"}}, {upsert: true}));

sep("U5 findOneAndUpdate returns the new document");
printjson(db.applications.findOneAndUpdate({application_id: "APP001"},
  {$set: {status: "Shortlisted"}, $push: {status_history: {status: "Shortlisted", at: new Date()}}},
  {returnDocument: "after", projection: {_id: 0, application_id: 1, status: 1}}));

sep("U6 $push with $each and $slice keeps the history bounded");
db.applications.updateOne({application_id: "APP009"}, {
  $set: {status: "Rejected"},
  $push: {status_history: {$each: [{status: "Rejected", at: new Date(), note: "Backlogs"}], $slice: -20}}});
printjson(db.applications.findOne({application_id: "APP009"}, {_id: 0, status: 1, status_history: 1}));

sep("U7 update with an aggregation pipeline: increment and auto-close in one statement");
printjson(db.jobs.updateOne({job_id: "JOB005", $expr: {$lt: ["$filled", "$vacancies"]}}, [
  {$set: {filled: {$add: ["$filled", 1]},
          status: {$cond: [{$gte: [{$add: ["$filled", 1]}, "$vacancies"]}, "Closed", "$status"]}}}]));

sep("U8 bulkWrite: shortlist one applicant, reject the rest of the pool");
printjson(db.applications.bulkWrite([
  {updateOne: {filter: {application_id: "APP008"},
    update: {$set: {status: "Shortlisted"}, $push: {status_history: {status: "Shortlisted", at: new Date()}}}}},
  {updateMany: {filter: {job_id: "JOB005", status: "Applied"},
    update: {$set: {status: "Rejected"}, $push: {status_history: {status: "Rejected", at: new Date(), note: "Batch decision"}}}}}
], {ordered: true}).modifiedCount);

sep("D1 guarded delete: only when nothing refers to the student");
const sid = "STU101";
const refs = db.applications.countDocuments({student_id: sid}) + db.placements.countDocuments({student_id: sid});
print(refs === 0 ? "deleted: " + db.students.deleteOne({student_id: sid}).deletedCount : "blocked: " + refs + " reference(s)");

sep("D2 deleteMany: purge stale rejected applications (older than 90 days)");
printjson(db.applications.deleteMany({status: "Rejected", application_date: {$lt: new Date(Date.now() - 90 * 864e5)}}));

