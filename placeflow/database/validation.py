"""Single source of truth for validators, indexes and the view.
Used by setup_database.py (PyMongo) and scripts/generate_mongosh.py (mongosh)."""

TIERS = ["Normal", "Dream", "Super Dream"]
DEPARTMENTS = ["CSE", "ISE", "ECE", "EEE", "ME", "CE", "IT"]
APP_STATUSES = ["Applied", "Shortlisted", "Rejected", "Selected"]
EMAIL = r"^.+@.+\..+$"


# --- tiny schema builders -------------------------------------------------
def string(**rules):
    return {"bsonType": "string", **rules}


def number(**rules):
    return {"bsonType": "number", **rules}


def whole(**rules):
    # The stored type of a number (int32, int64 or double) depends on the client and the value,
    # so bsonType "int" rejects valid input from some clients. "number" + multipleOf 1 accepts
    # every numeric type but still rejects 3.5.
    return {"bsonType": "number", "multipleOf": 1, **rules}


def date():
    return {"bsonType": "date"}


def array(items, **rules):
    return {"bsonType": "array", "items": items, **rules}


def obj(required, properties):
    return {"bsonType": "object", "required": required,
            "additionalProperties": False, "properties": properties}


def collection_schema(required, properties):
    # additionalProperties:false rejects unknown fields, so _id must be allowed explicitly
    return obj(required, {"_id": {}, **properties})


# --- schemas --------------------------------------------------------------
STUDENTS = collection_schema(
    ["student_id", "name", "email", "department", "year", "cgpa", "backlogs",
     "placement_status", "created_at"],
    {
        "student_id": string(pattern=r"^STU\d{3,}$"),
        "name": string(minLength=2),
        "email": string(pattern=EMAIL),
        "phone": string(pattern=r"^[0-9+\- ]{7,15}$"),
        "department": string(enum=DEPARTMENTS),
        "year": whole(minimum=1, maximum=4),
        "cgpa": number(minimum=0, maximum=10),
        "backlogs": whole(minimum=0),
        "skills": array(string(), uniqueItems=True),
        "placement_status": string(enum=["Unplaced", "Placed"]),
        "highest_tier": string(enum=TIERS),
        "created_at": date(),
    })

COMPANIES = collection_schema(
    ["company_id", "name", "industry", "location"],
    {
        "company_id": string(pattern=r"^COMP\d{3,}$"),
        "name": string(minLength=1),
        "industry": string(),
        "location": string(),
        "website": string(pattern=r"^https?://"),
        "contact_email": string(pattern=EMAIL),
    })

JOBS = collection_schema(
    ["job_id", "company_id", "title", "tier", "package_lpa", "eligibility",
     "vacancies", "filled", "deadline", "status"],
    {
        "job_id": string(pattern=r"^JOB\d{3,}$"),
        "company_id": string(pattern=r"^COMP\d{3,}$"),
        "title": string(minLength=1),
        "tier": string(enum=TIERS),
        "package_lpa": number(minimum=0),
        "location": string(),
        "skills_required": array(string()),
        "eligibility": obj(
            ["min_cgpa", "max_backlogs", "departments"],
            {
                "min_cgpa": number(minimum=0, maximum=10),
                "max_backlogs": whole(minimum=0),
                "departments": array(string(enum=DEPARTMENTS), minItems=1),
            }),
        "vacancies": whole(minimum=1),
        "filled": whole(minimum=0),
        "deadline": date(),
        "status": string(enum=["Open", "Closed"]),
    })

STATUS_ENTRY = obj(
    ["status", "at"],
    {"status": string(enum=APP_STATUSES), "at": date(), "note": string()})

APPLICATIONS = collection_schema(
    ["application_id", "student_id", "job_id", "application_date", "status", "status_history"],
    {
        "application_id": string(pattern=r"^APP\d{3,}$"),
        "student_id": string(),
        "job_id": string(),
        "application_date": date(),
        "status": string(enum=APP_STATUSES),
        "status_history": array(STATUS_ENTRY, minItems=1),
    })

INTERVIEWS = collection_schema(
    ["interview_id", "application_id", "student_id", "round", "scheduled_start",
     "scheduled_end", "mode", "result"],
    {
        "interview_id": string(pattern=r"^INT\d{3,}$"),
        "application_id": string(),
        "student_id": string(),
        "round": string(minLength=1),
        "scheduled_start": date(),
        "scheduled_end": date(),
        "mode": string(enum=["Online", "Offline"]),
        "venue": string(),
        "result": string(enum=["Scheduled", "Passed", "Failed"]),
    })

PLACEMENTS = collection_schema(
    ["placement_id", "student_id", "company_id", "job_id", "package_lpa",
     "placement_date", "status"],
    {
        "placement_id": string(pattern=r"^PLC\d{3,}$"),
        "student_id": string(),
        "company_id": string(),
        "job_id": string(),
        "package_lpa": number(minimum=0),
        "placement_date": date(),
        "status": string(enum=["Placed"]),
    })

ACTIVITY_FEED = collection_schema(
    ["event_type", "entity_id", "message", "at"],
    {"event_type": string(), "entity_id": string(), "message": string(), "at": date()})

SCHEMAS = {
    "students": STUDENTS, "companies": COMPANIES, "jobs": JOBS,
    "applications": APPLICATIONS, "interviews": INTERVIEWS,
    "placements": PLACEMENTS, "activity_feed": ACTIVITY_FEED,
}

# Rules $jsonSchema cannot express (they compare two fields) go in $expr.
EXTRA_RULES = {
    "jobs": {"$expr": {"$lte": ["$filled", "$vacancies"]}},
    "interviews": {"$expr": {"$gt": ["$scheduled_end", "$scheduled_start"]}},
}

# Capped: fixed size, insertion order kept, oldest evicted automatically.
CAPPED = {"activity_feed": {"capped": True, "size": 1048576, "max": 500}}


def validator_for(name):
    base = {"$jsonSchema": SCHEMAS[name]}
    if name in EXTRA_RULES:
        return {"$and": [base, EXTRA_RULES[name]]}
    return base


# --- indexes: (collection, [(field, direction)], options) ----------------------
INDEXES = [
    ("students", [("student_id", 1)], {"name": "uq_student_id", "unique": True}),
    ("students", [("email", 1)], {"name": "uq_student_email", "unique": True}),
    ("students", [("department", 1), ("cgpa", -1)], {"name": "ix_dept_cgpa"}),
    # Partial: indexes only unplaced students, so it stays small as placements grow.
    # (MongoDB 7.0 refuses two indexes with the same key pattern, hence {cgpa: -1}.)
    ("students", [("cgpa", -1)],
     {"name": "ix_unplaced_cgpa", "partialFilterExpression": {"placement_status": "Unplaced"}}),
    ("students", [("skills", 1)], {"name": "ix_skills"}),
    ("companies", [("company_id", 1)], {"name": "uq_company_id", "unique": True}),
    ("jobs", [("job_id", 1)], {"name": "uq_job_id", "unique": True}),
    ("jobs", [("status", 1), ("package_lpa", -1)], {"name": "ix_status_package"}),
    ("jobs", [("status", 1), ("deadline", 1)], {"name": "ix_status_deadline"}),
    ("jobs", [("title", "text"), ("skills_required", "text")], {"name": "ix_job_text"}),
    ("applications", [("application_id", 1)], {"name": "uq_application_id", "unique": True}),
    # UNIQUE: this single index is what makes duplicate applications impossible.
    ("applications", [("student_id", 1), ("job_id", 1)], {"name": "uq_student_job", "unique": True}),
    ("applications", [("job_id", 1), ("status", 1)], {"name": "ix_job_status"}),
    ("interviews", [("interview_id", 1)], {"name": "uq_interview_id", "unique": True}),
    ("interviews", [("student_id", 1), ("scheduled_start", 1)], {"name": "ix_student_start"}),
    ("interviews", [("application_id", 1)], {"name": "ix_interview_application"}),
    ("placements", [("placement_id", 1)], {"name": "uq_placement_id", "unique": True}),
    ("placements", [("student_id", 1), ("job_id", 1)], {"name": "uq_placement_student_job", "unique": True}),
    ("placements", [("company_id", 1)], {"name": "ix_placement_company"}),
    ("placements", [("placement_date", 1)], {"name": "ix_placement_date"}),
]

VIEW_NAME = "v_application_details"
VIEW_PIPELINE = [
    {"$lookup": {"from": "students", "localField": "student_id", "foreignField": "student_id", "as": "student"}},
    {"$unwind": "$student"},
    {"$lookup": {"from": "jobs", "localField": "job_id", "foreignField": "job_id", "as": "job"}},
    {"$unwind": "$job"},
    {"$lookup": {"from": "companies", "localField": "job.company_id", "foreignField": "company_id", "as": "company"}},
    {"$unwind": "$company"},
    {"$project": {
        "_id": 0, "application_id": 1, "status": 1, "application_date": 1,
        "student_id": 1, "student_name": "$student.name", "department": "$student.department",
        "cgpa": "$student.cgpa", "job_id": 1, "job_title": "$job.title", "tier": "$job.tier",
        "package_lpa": "$job.package_lpa", "company_id": "$company.company_id",
        "company_name": "$company.name"}},
]


# --- applying everything to a live database -----------------------------------
def apply_schemas(db):
    existing = set(db.list_collection_names())
    for name in SCHEMAS:
        options = {"validator": validator_for(name), "validationLevel": "strict",
                   "validationAction": "error"}
        if name in existing:
            db.command("collMod", name, **options)  # idempotent: update the validator
        else:
            db.create_collection(name, **options, **CAPPED.get(name, {}))


def apply_indexes(db):
    for collection, keys, options in INDEXES:
        db[collection].create_index(keys, **options)


def create_views(db):
    if VIEW_NAME in db.list_collection_names():
        db.drop_collection(VIEW_NAME)
    db.create_collection(VIEW_NAME, viewOn="applications", pipeline=VIEW_PIPELINE)


if __name__ == "__main__":
    from database.connection import get_db

    _db = get_db()
    apply_schemas(_db)
    apply_indexes(_db)
    create_views(_db)
    print("Schemas, indexes and view applied to", _db.name)

