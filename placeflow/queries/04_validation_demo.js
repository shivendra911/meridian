db = db.getSiblingDB("college_placement_db");

const goodStudent = {student_id: "STU901", name: "Test Student", email: "t901@univ.edu",
  department: "CSE", year: 4, cgpa: 8, backlogs: 0, placement_status: "Unplaced", created_at: new Date()};
const goodJob = {job_id: "JOB901", company_id: "COMP001", title: "Test Role", tier: "Normal",
  package_lpa: 5, eligibility: {min_cgpa: 6, max_backlogs: 1, departments: ["CSE"]},
  vacancies: 2, filled: 0, deadline: new Date(Date.now() + 864e5), status: "Open"};
const goodHistory = [{status: "Applied", at: new Date()}];

function attempt(label, fn) {
  try { fn(); print("UNEXPECTED SUCCESS  " + label); }
  catch (e) { print("REJECTED  " + label.padEnd(36) + " code=" + e.code + " " + (e.codeName || "")); }
}

print("=== Schema validation (expect code 121)");
attempt("V1 CGPA 11", () => db.students.insertOne({...goodStudent, cgpa: 11}));
attempt("V2 application status 'Pending'", () => db.applications.insertOne(
  {application_id: "APP901", student_id: "STU001", job_id: "JOB005",
   application_date: new Date(), status: "Pending", status_history: goodHistory}));
attempt("V3 job without eligibility", () => { const {eligibility, ...rest} = goodJob; db.jobs.insertOne(rest); });
attempt("V4 unknown field 'nickname'", () => db.students.insertOne(
  {...goodStudent, student_id: "STU902", email: "t902@univ.edu", nickname: "Tester"}));
attempt("V5 job filled 5 > vacancies 2", () => db.jobs.insertOne({...goodJob, filled: 5}));
attempt("V6 interview ends before it starts", () => db.interviews.insertOne(
  {interview_id: "INT901", application_id: "APP002", student_id: "STU001", round: "HR",
   scheduled_start: new Date(), scheduled_end: new Date(Date.now() - 36e5),
   mode: "Online", result: "Scheduled"}));

print("\n=== Unique indexes (expect code 11000)");
attempt("V7 duplicate student email", () => db.students.insertOne(
  {...goodStudent, student_id: "STU903", email: "aarav1@univ.edu"}));
attempt("V8 duplicate application (STU001, JOB001)", () => db.applications.insertOne(
  {application_id: "APP902", student_id: "STU001", job_id: "JOB001",
   application_date: new Date(), status: "Applied", status_history: goodHistory}));

print("\n=== V9 warn vs error");
db.runCommand({collMod: "students", validationAction: "warn"});
db.students.insertOne({...goodStudent, student_id: "STU904", email: "t904@univ.edu", cgpa: 11});
print("warn mode accepted cgpa=11; document exists:", db.students.countDocuments({student_id: "STU904"}) === 1);
db.students.deleteOne({student_id: "STU904"});
db.runCommand({collMod: "students", validationAction: "error"});
print("back to error mode");

print("\n=== V10 active validator");
printjson(db.getCollectionInfos({name: "students"})[0].options);

