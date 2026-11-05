db = db.getSiblingDB("college_placement_db");
const stream = db.applications.watch([{$match: {operationType: "update"}}], {fullDocument: "updateLookup"});
print("Watching applications. In a second shell run:");
print('  db.applications.updateOne({application_id:"APP001"},{$set:{status:"Shortlisted"}})');
while (!stream.isClosed()) {
  const event = stream.tryNext();
  if (event) {
    printjson({application: event.documentKey, changed: event.updateDescription.updatedFields,
               now: event.fullDocument.status});
  } else { sleep(500); }
}

