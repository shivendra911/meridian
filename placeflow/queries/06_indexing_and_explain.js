db = db.getSiblingDB("college_placement_db");

function stagesOf(plan, out = []) {
  if (plan && typeof plan === "object") {
    if (plan.stage) out.push(plan.stage);
    Object.values(plan).forEach(v => stagesOf(v, out));
  }
  return out;
}
function report(label, cursor) {
  const e = cursor.explain("executionStats");
  const s = e.executionStats;
  const plan = stagesOf(e.queryPlanner.winningPlan).some(x => x.includes("IXSCAN")) ? "IXSCAN" : "COLLSCAN";
  print(label.padEnd(30), "plan:", plan, "| returned:", s.nReturned, "| docs examined:", s.totalDocsExamined,
        "| keys examined:", s.totalKeysExamined, "| ms:", s.executionTimeMillis);
}

print("students:", db.students.countDocuments(), "(load the bulk dataset first for meaningful numbers)\n");
const q = {department: "CSE", cgpa: {$gte: 8.5}, backlogs: 0, placement_status: "Unplaced"};

print("=== I1 same query, with and without an index");
report("I1 forced scan", db.students.find(q).hint({$natural: 1}));
report("I1 planner's choice", db.students.find(q));

print("\n=== I2 covered query: totalDocsExamined must be 0");
report("I2 covered", db.students.find({department: "CSE", cgpa: {$gte: 9}}, {_id: 0, department: 1, cgpa: 1}));

print("\n=== I3 partial index is smaller than a full one");
printjson(db.students.stats().indexSizes);

print("\n=== I4 text index, ranked");
printjson(db.jobs.find({$text: {$search: "java"}}, {_id: 0, title: 1, score: {$meta: "textScore"}})
  .sort({score: {$meta: "textScore"}}).limit(3).toArray());

print("\n=== I5 a bad hint hurts: the planner's choice is usually right");
report("I5 planner (student_id)", db.students.find({student_id: "STU0500"}));
report("I5 forced wrong index", db.students.find({student_id: "STU0500"}).hint({department: 1, cgpa: -1}));

print("\n=== I6 unique index violation");
const existing = db.students.findOne({}, {_id: 0});
try { db.students.insertOne({...existing, student_id: "STU99999"}); }
catch (e) { print("code", e.code, "-", e.message.split("\n")[0]); }

print("\n=== I7 which indexes are actually used?");
printjson(db.students.aggregate([{$indexStats: {}}, {$project: {_id: 0, name: 1, ops: "$accesses.ops"}}]).toArray());

