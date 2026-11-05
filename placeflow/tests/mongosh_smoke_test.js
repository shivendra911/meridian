db = db.getSiblingDB("college_placement_db");
let failed = 0;
function check(label, ok) { print((ok ? "PASS  " : "FAIL  ") + label); if (!ok) failed++; }

const names = db.getCollectionNames();
["students", "companies", "jobs", "applications", "interviews", "placements", "activity_feed", "counters",
 "v_application_details"].forEach(n => check("exists " + n, names.includes(n)));
["students", "companies", "jobs", "applications", "interviews", "placements", "activity_feed"].forEach(n => {
  const o = db.getCollectionInfos({name: n})[0].options;
  check(n + " has strict/error validator", o.validationLevel === "strict" && o.validationAction === "error" && !!o.validator);
});
check("activity_feed is capped", db.activity_feed.isCapped());
check("unique (student_id, job_id) index", db.applications.getIndexes().some(i => i.name === "uq_student_job" && i.unique));
check("partial index exists", db.students.getIndexes().some(i => i.name === "ix_unplaced_cgpa" && i.partialFilterExpression));
check("text index exists", db.jobs.getIndexes().some(i => i.name === "ix_job_text"));
check("every application joins to a student", db.applications.aggregate([
  {$lookup: {from: "students", localField: "student_id", foreignField: "student_id", as: "s"}},
  {$match: {s: {$size: 1}}}, {$count: "n"}]).toArray()[0].n === db.applications.countDocuments());
check("view returns every application", db.v_application_details.countDocuments() === db.applications.countDocuments());

print(failed === 0 ? "ALL PASSED" : failed + " FAILED");
if (failed) quit(1);

