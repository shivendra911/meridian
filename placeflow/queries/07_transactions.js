const DB = "college_placement_db";
db = db.getSiblingDB(DB);

function finalize(studentId, jobId, placementId) {
  const session = db.getMongo().startSession();
  const sdb = session.getDatabase(DB);          // every operation must go through the session's db
  session.startTransaction({readConcern: {level: "snapshot"}, writeConcern: {w: "majority"}});
  try {
    const job = sdb.jobs.findOne({job_id: jobId});
    const app = sdb.applications.findOne({student_id: studentId, job_id: jobId, status: "Shortlisted"});
    if (!job || !app) throw new Error("job or shortlisted application not found");
    const claim = sdb.jobs.updateOne(
      {job_id: jobId, status: "Open", $expr: {$lt: ["$filled", "$vacancies"]}},
      [{$set: {filled: {$add: ["$filled", 1]},
               status: {$cond: [{$gte: [{$add: ["$filled", 1]}, "$vacancies"]}, "Closed", "$status"]}}}]);
    if (claim.matchedCount === 0) throw new Error("VacancyExhausted");
    sdb.placements.insertOne({placement_id: placementId, student_id: studentId, company_id: job.company_id,
      job_id: jobId, package_lpa: job.package_lpa, placement_date: new Date(), status: "Placed"});
    sdb.applications.updateOne({application_id: app.application_id},
      {$set: {status: "Selected"}, $push: {status_history: {status: "Selected", at: new Date()}}});
    sdb.students.updateOne({student_id: studentId}, {$set: {placement_status: "Placed", highest_tier: job.tier}});
    session.commitTransaction();
    print("COMMITTED", placementId);
  } catch (e) {
    try { session.abortTransaction(); } catch (_) {}
    print("ABORTED:", e.message);
  } finally {
    session.endSession();
  }
}

print("=== T1 successful finalization");
finalize("STU001", "JOB002", "PLC901");
printjson(db.jobs.findOne({job_id: "JOB002"}, {_id: 0, job_id: 1, filled: 1, vacancies: 1, status: 1}));
printjson(db.students.findOne({student_id: "STU001"}, {_id: 0, placement_status: 1, highest_tier: 1}));

print("\n=== T2 full job: everything rolls back");
db.jobs.updateOne({job_id: "JOB002"}, {$set: {vacancies: 1}});     // JOB002 is now 1 of 1 filled
finalize("STU004", "JOB002", "PLC902");
print("placement PLC902 exists:", db.placements.countDocuments({placement_id: "PLC902"}) === 1);
printjson(db.applications.findOne({student_id: "STU004", job_id: "JOB002"}, {_id: 0, status: 1}));
print("\nT3 and T4 (retry and two clients racing for the last seat): run  pytest tests -k concurrent -s");

