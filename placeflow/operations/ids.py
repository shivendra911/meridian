"""AUTO_INCREMENT equivalent: one counter document per collection, bumped atomically with $inc."""
from pymongo import ReturnDocument

ID_SPECS = [  # (collection, id field, prefix)
    ("students", "student_id", "STU"),
    ("companies", "company_id", "COMP"),
    ("jobs", "job_id", "JOB"),
    ("applications", "application_id", "APP"),
    ("interviews", "interview_id", "INT"),
    ("placements", "placement_id", "PLC"),
]
PREFIX = {collection: (key, prefix) for collection, key, prefix in ID_SPECS}


def next_id(db, collection, session=None):
    _, prefix = PREFIX[collection]
    row = db.counters.find_one_and_update(
        {"_id": collection}, {"$inc": {"seq": 1}},
        upsert=True, return_document=ReturnDocument.AFTER, session=session)
    return f"{prefix}{row['seq']:03d}"


def insert_with_id(db, collection, doc, session=None):
    key, _ = PREFIX[collection]
    if not doc.get(key):
        doc[key] = next_id(db, collection, session)
    db[collection].insert_one(doc, session=session)
    return doc[key]


def sync_counters(db):
    """After seeding with explicit IDs, move each counter past the highest ID in use."""
    for collection, key, prefix in ID_SPECS:
        top = list(db[collection].aggregate([
            {"$project": {"n": {"$toInt": {"$substrCP": [f"${key}", len(prefix), 20]}}}},
            {"$group": {"_id": None, "max": {"$max": "$n"}}}]))
        db.counters.update_one({"_id": collection}, {"$max": {"seq": top[0]["max"] if top else 0}},
                               upsert=True)

