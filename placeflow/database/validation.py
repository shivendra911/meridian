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
        "student_id": string(pattern=r"^(STU\d{3,}|\d{7,10})$"),
        "reg_no": string(),
        "name": string(minLength=2),
        "email": string(pattern=EMAIL),
        "phone": string(),
        "department": string(),
        "school": string(),
        "year": whole(minimum=1, maximum=5),
        "batch": string(),
        "cgpa": number(minimum=0, maximum=10),
        "attendance": number(minimum=0, maximum=100),
        "backlogs": whole(minimum=0),
        "skills": array(string()),
        "placement_status": string(),
        "highest_tier": string(),
        "created_at": date(),
        "mentor_id": string(),
        "mentor_name": string(),
        "mentor_school": string(),
        "mentor_hod": string(),
        "mentor_hos": string(),
        "assessment_status": string(),
        "remarks": string(),
        "vti": {"bsonType": "object"},
        "ai_risk": {"bsonType": "object"},
        "survey_status": string(),
        "survey_response": {"bsonType": "object"},
        "tags": array(string()),
        "company_eligibility": string(),
        "placement_company": string(),
        "placement_lpa": number(),
        "verification_issue": string(),
        "internship_status": string(),
        "internship_location": string(),
        "action_required": string(),
        "mentor_info": {"bsonType": "object"},
        "hod_id": string(),
        "hod_name": string(),
        "hos_name": string(),
        "school_code": string(),
        "person_id": string(),
        "tenant_id": string(),
        "institution_id": string(),
        "ml_opt_out": {"bsonType": "bool"},
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
        "status": string(enum=["Placed", "Accepted", "Declined"]),
        "response_status": string(),
        "responded_at": date(),
    })

ACTIVITY_FEED = collection_schema(
    ["event_type", "entity_id", "message", "at"],
    {"event_type": string(), "entity_id": string(), "message": string(), "at": date()})

FACULTY = collection_schema(
    ["faculty_id", "name", "created_at"],
    {
        "faculty_id": string(),
        "employee_code": string(),
        "name": string(minLength=2),
        "email": string(pattern=EMAIL),
        "phone": string(),
        "school": string(),
        "department": string(),
        "designation": string(),
        "academic_rank": string(),
        "roles": array(string()),
        "is_hod": {"bsonType": "bool"},
        "is_hos": {"bsonType": "bool"},
        "is_mentor": {"bsonType": "bool"},
        "is_admin": {"bsonType": "bool"},
        "is_placement_coordinator": {"bsonType": "bool"},
        "appointments": {"bsonType": "array"},
        "courses_taught": array(string()),
        "committees": array(string()),
        "office_location": string(),
        "person_id": string(),
        "account_id": string(),
        "hod_id": string(),
        "hod_name": string(),
        "hos_name": string(),
        "mentees_count": whole(minimum=0),
        "mentee_ids": array(string()),
        "assessment_eligible_count": whole(minimum=0),
        "assessment_not_eligible_count": whole(minimum=0),
        "form_filled_count": whole(minimum=0),
        "form_pending_count": whole(minimum=0),
        "already_placed_count": whole(minimum=0),
        "verification_issues_count": whole(minimum=0),
        "completion_rate": number(minimum=0, maximum=100),
        "action_items_count": whole(minimum=0),
        "created_at": date(),
        "updated_at": date(),
    })

DEPARTMENT_HEADS = collection_schema(
    ["hod_id", "name", "created_at"],
    {
        "hod_id": string(),
        "name": string(minLength=2),
        "email": string(pattern=EMAIL),
        "school": string(),
        "department": string(),
        "hos_name": string(),
        "faculty_id": string(),
        "person_id": string(),
        "academic_rank": string(),
        "is_active_teacher": {"bsonType": "bool"},
        "office_location": string(),
        "faculty_count": whole(minimum=0),
        "faculty_ids": array(string()),
        "students_count": whole(minimum=0),
        "assessment_eligible_count": whole(minimum=0),
        "assessment_not_eligible_count": whole(minimum=0),
        "form_filled_count": whole(minimum=0),
        "form_pending_count": whole(minimum=0),
        "completion_rate": number(minimum=0, maximum=100),
        "placed_count": whole(minimum=0),
        "verification_issues_count": whole(minimum=0),
        "created_at": date(),
        "updated_at": date(),
    })

SCHOOL_HEADS = collection_schema(
    ["hos_id", "name", "school", "created_at"],
    {
        "hos_id": string(),
        "name": string(minLength=2),
        "school": string(),
        "designation": string(),
        "faculty_id": string(),
        "person_id": string(),
        "email": string(),
        "phone": string(),
        "is_active_teacher": {"bsonType": "bool"},
        "academic_rank": string(),
        "office_location": string(),
        "hod_count": whole(minimum=0),
        "hod_ids": array(string()),
        "faculty_count": whole(minimum=0),
        "faculty_ids": array(string()),
        "students_count": whole(minimum=0),
        "assessment_eligible_count": whole(minimum=0),
        "assessment_not_eligible_count": whole(minimum=0),
        "form_filled_count": whole(minimum=0),
        "form_pending_count": whole(minimum=0),
        "completion_rate": number(minimum=0, maximum=100),
        "placed_count": whole(minimum=0),
        "created_at": date(),
        "updated_at": date(),
    })

ADMINS = collection_schema(
    ["admin_id", "name", "role", "email", "created_at"],
    {
        "admin_id": string(),
        "employee_code": string(),
        "name": string(minLength=2),
        "email": string(pattern=EMAIL),
        "phone": string(),
        "role": string(),
        "office": string(),
        "department": string(),
        "designation": string(),
        "permissions": array(string()),
        "faculty_id": string(),
        "person_id": string(),
        "status": string(),
        "created_at": date(),
        "updated_at": date(),
    })

PLACEMENT_DRIVES = collection_schema(
    ["drive_id", "company_name", "batch_year", "total_candidates", "created_at"],
    {
        "drive_id": string(),
        "company_name": string(),
        "role_title": string(),
        "batch_year": string(),
        "total_candidates": whole(minimum=0),
        "eligible_count": whole(minimum=0),
        "not_eligible_count": whole(minimum=0),
        "form_filled_count": whole(minimum=0),
        "form_pending_count": whole(minimum=0),
        "responses_yes": whole(minimum=0),
        "responses_no": whole(minimum=0),
        "rejection_breakdown": {"bsonType": "object"},
        "remarks_breakdown": {"bsonType": "object"},
        "school_stats": {"bsonType": "object"},
        "created_at": date(),
        "updated_at": date(),
    })

INSTITUTIONAL_RELATIONSHIPS = collection_schema(
    ["relation_id", "from_type", "from_id", "relation_type", "to_type", "to_id", "created_at"],
    {
        "relation_id": string(),
        "from_type": string(),
        "from_id": string(),
        "from_name": string(),
        "relation_type": string(),
        "to_type": string(),
        "to_id": string(),
        "to_name": string(),
        "metadata": {"bsonType": "object"},
        "created_at": date(),
    })

SCHEMAS = {
    "students": STUDENTS, "companies": COMPANIES, "jobs": JOBS,
    "applications": APPLICATIONS, "interviews": INTERVIEWS,
    "placements": PLACEMENTS, "activity_feed": ACTIVITY_FEED,
    "faculty": FACULTY, "department_heads": DEPARTMENT_HEADS,
    "school_heads": SCHOOL_HEADS, "admins": ADMINS, "placement_drives": PLACEMENT_DRIVES,
    "institutional_relationships": INSTITUTIONAL_RELATIONSHIPS,
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
    ("faculty", [("faculty_id", 1)], {"name": "uq_faculty_id", "unique": True}),
    ("faculty", [("roles", 1)], {"name": "ix_faculty_roles"}),
    ("faculty", [("hod_id", 1)], {"name": "ix_faculty_hod"}),
    ("faculty", [("school", 1)], {"name": "ix_faculty_school"}),
    ("department_heads", [("hod_id", 1)], {"name": "uq_hod_id", "unique": True}),
    ("department_heads", [("hos_name", 1)], {"name": "ix_hod_hos"}),
    ("school_heads", [("hos_id", 1)], {"name": "uq_hos_id", "unique": True}),
    ("admins", [("admin_id", 1)], {"name": "uq_admin_id", "unique": True}),
    ("admins", [("email", 1)], {"name": "uq_admin_email", "unique": True}),
    ("placement_drives", [("drive_id", 1)], {"name": "uq_drive_id", "unique": True}),
    ("institutional_relationships", [("relation_id", 1)], {"name": "uq_relation_id", "unique": True}),
    ("institutional_relationships", [("from_id", 1), ("relation_type", 1)], {"name": "ix_rel_from"}),
    ("institutional_relationships", [("to_id", 1), ("relation_type", 1)], {"name": "ix_rel_to"}),
    ("students", [("reg_no", 1)], {"name": "uq_students_reg_no", "unique": True, "sparse": True}),
    ("students", [("person_id", 1)], {"name": "uq_students_person_id", "unique": True, "sparse": True}),
    ("faculty", [("person_id", 1)], {"name": "uq_faculty_person_id", "unique": True, "sparse": True}),
    ("department_heads", [("person_id", 1)], {"name": "uq_hod_person_id", "unique": True, "sparse": True}),
    ("school_heads", [("person_id", 1)], {"name": "uq_hos_person_id", "unique": True, "sparse": True}),
    ("students", [("mentor_id", 1)], {"name": "ix_student_mentor"}),
    ("students", [("mentor_hod", 1)], {"name": "ix_student_hod"}),
    ("students", [("mentor_hos", 1)], {"name": "ix_student_hos"}),
    ("students", [("assessment_status", 1)], {"name": "ix_student_assessment"}),
    ("students", [("survey_status", 1)], {"name": "ix_student_survey"}),
    ("consent_records", [("student_id", 1)], {"name": "ix_consent_student"}),
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

