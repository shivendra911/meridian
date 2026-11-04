# PlaceFlow — Solo Build Guide, Start to Finish

Companion to `PlaceFlow_SRS_v2.md`. The SRS says what to build; this says what to do, in what order, with the exact commands and code.

How to use it:

1. Do the phases in order. Every phase ends with a **Checkpoint**: a command and the output you should see. Do not start the next phase until it passes.
2. After each checkpoint run `git add -A && git commit -m "phase N: <what>"`. If something breaks later, you can go back to the last working phase.
3. Each code block is preceded by a bold line of the form **File: `<path>`**. Create that file and paste the block as its full content.
4. Commands are shown for Windows PowerShell where they differ from Linux/macOS, with both given.

---

## 0. Read this first (10 minutes)

### 0.1 What is being built, in one paragraph

A MongoDB database for a university placement cell, with strict validation, a deliberate index strategy, atomic placement finalization, and live aggregation reports. A Python `operations/` package holds every business rule. A Flask web app and a terminal CLI are thin shells over it. Shell scripts (`mongosh`) demonstrate every MongoDB feature on their own, so you can present the database without the app.

### 0.2 You already know most of this (SQL to MongoDB)

| MySQL / SQL | MongoDB | Where in PlaceFlow |
|---|---|---|
| Table | Collection | `students`, `jobs`, ... |
| Row | Document | One student |
| Column types, NOT NULL, CHECK | `$jsonSchema` validator | `database/validation.py` |
| UNIQUE / PRIMARY KEY | Unique index | `uq_student_id`, `uq_student_job` |
| FOREIGN KEY ... ON DELETE RESTRICT | Does not exist; you write the check | `operations/integrity.py` |
| JOIN | `$lookup` | Pipelines A3, A4, the view |
| GROUP BY / HAVING | `$group` + `$match` | `operations/pipelines.py` |
| AUTO_INCREMENT | A `counters` document with `$inc` | `operations/ids.py` |
| VIEW | View | `v_application_details` |
| BEGIN / COMMIT / ROLLBACK | `start_transaction` / commit / abort | `operations/placements.py` |
| EXPLAIN | `explain("executionStats")` | Demo scripts, Demo Lab |
| Triggers | Change streams | `09_change_stream_demo.js` |
| mysqldump | `mongodump` | `scripts/admin.py` |

The one real difference: MongoDB does not enforce relationships between collections. Everything the SRS calls "referential integrity" is code you write, and the project is graded on how well you do that.

### 0.3 The five rules that keep a solo project from becoming a mess

1. **Only `database/connection.py` creates a `MongoClient`.** Everything else receives `db` as an argument. This is why testing is easy.
2. **Validators and indexes are defined once**, in `database/validation.py`. The `mongosh` setup script is generated from it.
3. **Aggregation pipelines are defined once**, in `operations/pipelines.py`. The reports page, the Demo Lab and the `mongosh` aggregation script all read that one registry.
4. **Web routes and CLI never write to collections directly.** They call functions in `operations/`. Business rules live in exactly one place.
5. **Dates are always timezone-aware UTC.** The client is created with `tz_aware=True` and the code uses `utcnow()`. Mixing naive and aware datetimes is the most common source of silent bugs.

### 0.4 How the pieces connect

```
 web_app.py ───┐                              ┌── database/validation.py  (schemas, indexes, view)
 main.py (CLI)─┼──> operations/ ──(db)──> database/connection.py ──> MongoDB (replica set)
 tests/ ───────┘      │                       └── database/sample_data.py, bulk_seed.py
                      ├── pipelines.py  (all aggregations) ──┬─> reports.py ──> pages / CLI
                      ├── ids.py, common.py, errors.py       └─> demo_registry.py ──> Demo Lab
                      └── applications / interviews / placements / students / jobs / integrity

 scripts/generate_mongosh.py reads validation.py + sample_data.py + pipelines.py
        └─> queries/01_setup_database.js, 02_seed_data.js, 05_aggregation_pipelines.js
```

### 0.5 Plan, effort and what to cut

| Phase | Output | Hours | Tier |
|---|---|---|---|
| 0 | Machine ready, MongoDB replica set running | 1 | Must |
| 1 | Project skeleton, git, environment | 0.5 | Must |
| 2 | Connection layer | 0.5 | Must |
| 3 | Schemas, indexes, view | 3 | Must |
| 4 | Seed data, IDs, integrity audit, `setup_database.py` | 2 | Must |
| 5 | Generated `mongosh` setup/seed + validation demo | 1.5 | Must |
| 6 | Business rules (`operations/`) | 6 | Must |
| 7 | Pipelines and reports | 3 | Must |
| 8 | `mongosh` demos: CRUD, transactions, view, change stream | 3 | Must |
| 9 | Bulk dataset and index/explain demo | 2 | Must |
| 10 | Web app | 5 | Should |
| 11 | CLI | 2 | Must |
| 12 | Demo Lab | 2 | Could |
| 13 | Tests | 2 | Should |
| 14 | Admin scripts, README, rehearsal | 2 | Must |

About 34 hours, roughly 9 working days at 4 hours a day. If time runs short, cut in this order: Demo Lab, change stream demo, reports page extras, web portal. Never cut Phases 3, 6, 8, 9: they are the MongoDB demonstration.

---

## Phase 0 — Prepare the machine (1 hour)

### 0.1 Install

| Tool | Why | Check |
|---|---|---|
| Python 3.10+ | App code | `python --version` |
| Git | Version control | `git --version` |
| `mongosh` | Run the demo scripts | `mongosh --version` |
| MongoDB Database Tools | `mongodump`, `mongorestore`, `mongoexport` | `mongodump --version` |
| MongoDB Compass (optional) | Look at your data while you build | open it |
| VS Code | Editor | |

### 0.2 Start MongoDB as a replica set

Transactions and change streams do not work on a standalone `mongod`. Pick **one** option.

**Option A — Docker (fastest, works everywhere):**

```
docker run -d --name placeflow-mongo -p 27017:27017 -v placeflow-data:/data/db mongo:7 --replSet rs0
docker exec placeflow-mongo mongosh --quiet --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]})"
```

**Option B — Local install:** edit the config file and add the replication block.

- Windows: `C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg`
- Linux: `/etc/mongod.conf`

```
replication:
  replSetName: rs0
```

Restart the service (Windows, admin terminal: `net stop MongoDB` then `net start MongoDB`; Linux: `sudo systemctl restart mongod`), then:

```
mongosh --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]})"
```

**Option C — Atlas (backup plan for demo day):** create a free M0 cluster, add a database user, allow your IP, copy the `mongodb+srv://...` string. It is already a replica set.

Why the explicit `host:'localhost:27017'`: plain `rs.initiate()` registers the machine's hostname, and your Python driver then tries to reach that hostname instead of `localhost`, which often fails.

**Checkpoint:**

```
mongosh "mongodb://localhost:27017/?replicaSet=rs0" --quiet --eval "db.hello().isWritablePrimary"
```

Expected: `true`.

---

## Phase 1 — Skeleton, git, environment (30 minutes)

```
mkdir placeflow
cd placeflow
git init
python -m venv .venv
```

Activate the environment:

| OS | Command |
|---|---|
| Windows PowerShell | `.venv\Scripts\Activate.ps1` (if blocked: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`) |
| Linux / macOS | `source .venv/bin/activate` |

Create the folders (works on every OS):

```
python -c "import pathlib; [pathlib.Path(d).mkdir(exist_ok=True) for d in ['database','operations','queries','scripts','static','templates','tests']]; [pathlib.Path(f).touch() for f in ['database/__init__.py','operations/__init__.py']]"
```

**File: `requirements.txt`**

```
pymongo>=4.6
python-dotenv>=1.0
Flask>=3.0
pytest>=8.0
```

**File: `.env.example`**

```
MONGODB_URI="mongodb://localhost:27017/?replicaSet=rs0"
MONGODB_DB="college_placement_db"
FLASK_SECRET_KEY="change-me"
```

**File: `.gitignore`**

```
.venv/
.env
__pycache__/
backups/
exports/
.pytest_cache/
```

**File: `pytest.ini`**

```
[pytest]
pythonpath = .
```

Then:

```
pip install -r requirements.txt
```

Copy `.env.example` to `.env` (`copy .env.example .env` on Windows, `cp .env.example .env` elsewhere).

**Checkpoint:**

```
python -c "import pymongo, flask, dotenv; print('ok', pymongo.version)"
git add -A
git commit -m "phase 1: skeleton"
```

---

## Phase 2 — Connection layer (30 minutes)

**File: `database/connection.py`**

```python
import os
from functools import lru_cache

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError

load_dotenv()


@lru_cache(maxsize=1)
def get_client() -> MongoClient:
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/?replicaSet=rs0")
    client = MongoClient(uri, serverSelectionTimeoutMS=4000, tz_aware=True)
    try:
        client.admin.command("ping")
    except ServerSelectionTimeoutError as exc:
        raise SystemExit("Cannot reach MongoDB. Check MONGODB_URI and that mongod is running.") from exc
    return client


def get_db():
    return get_client()[os.getenv("MONGODB_DB", "college_placement_db")]


def supports_transactions() -> bool:
    """True only on a replica set (or Atlas). Transactions and change streams need it."""
    return "setName" in get_client().admin.command("hello")
```

Why `tz_aware=True`: without it PyMongo returns naive datetimes, and comparing them with `utcnow()` raises `TypeError`.

**Checkpoint:**

```
python -c "from database.connection import get_db, supports_transactions; print(get_db().name, supports_transactions())"
```

Expected: `college_placement_db True`. If it prints `False`, your URI lacks `?replicaSet=rs0` or Phase 0 was not completed.

---

## Phase 3 — Schemas, indexes, view (3 hours)

This is the heart of the project. Everything else depends on it.

**File: `database/validation.py`**

```python
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
```

Why each decision:

- `validationLevel: strict` means the rules apply to every insert **and** every update. `validationAction: error` rejects violations instead of only logging them.
- `additionalProperties: false` catches typos such as `cgpaa`. Without it MongoDB happily stores any extra field.
- The unique compound index `(student_id, job_id)` is the entire duplicate-application defence. No application code can race past it.
- The partial index and the full compound index serve different queries; you will compare them with `explain` in Phase 9.

**Checkpoint:**

```
python -m database.validation
```

Expected: `Schemas, indexes and view applied to college_placement_db`. Then open Compass (or run the line below) and confirm 7 collections, 1 view and the indexes exist:

```
mongosh "mongodb://localhost:27017/college_placement_db?replicaSet=rs0" --quiet --eval "db.getCollectionNames()"
```

Negative test, which proves the validator is live. This must fail with `code: 121`:

```
mongosh "mongodb://localhost:27017/college_placement_db?replicaSet=rs0" --quiet --eval "db.students.insertOne({student_id:'STU999', name:'X', email:'x@y.z', department:'CSE', year:4, cgpa:11, backlogs:0, placement_status:'Unplaced', created_at:new Date()})"
```

Commit: `git add -A && git commit -m "phase 3: schemas and indexes"`.

---

## Phase 4 — Seed data, IDs, integrity audit (2 hours)

Four small shared modules first, then the seed.

**File: `operations/errors.py`**

```python
from pymongo.errors import DuplicateKeyError, ServerSelectionTimeoutError, WriteError


class PlaceFlowError(Exception):
    """A business-rule violation. The message is safe to show to the user."""


class VacancyExhausted(PlaceFlowError):
    """Raised inside the placement transaction when no seat is left."""


def _find_rules(node):
    """Validators wrapped in $and nest the details one level deeper, so search recursively."""
    if isinstance(node, dict):
        if "schemaRulesNotSatisfied" in node:
            return node["schemaRulesNotSatisfied"]
        children = node.values()
    elif isinstance(node, list):
        children = node
    else:
        return None
    for child in children:
        found = _find_rules(child)
        if found:
            return found
    return None


def _validation_reason(exc):
    try:
        details = (exc.details or {}).get("errInfo", {}).get("details", {})
        parts = []
        for rule in _find_rules(details) or []:
            if "missingProperties" in rule:
                parts.append("missing " + ", ".join(rule["missingProperties"]))
            for prop in rule.get("propertiesNotSatisfied", []):
                info = prop["details"][0]
                parts.append(f'{prop["propertyName"]}: {info.get("operatorName")} rule failed '
                             f'(value {info.get("consideredValue")!r})')
            if rule.get("operatorName") == "additionalProperties":
                parts.append("unknown field(s): " + ", ".join(rule["additionalProperties"]))
        if not parts and "$expr" in str(details):
            parts.append("a cross-field rule failed (filled above vacancies, or interview ending before it starts)")
        return "; ".join(parts) or "document does not match the schema"
    except (KeyError, IndexError, TypeError, AttributeError):
        return "document does not match the schema"


def friendly(exc):
    """Translate any exception into a message a user can act on."""
    if isinstance(exc, (PlaceFlowError, ValueError)):
        return str(exc)
    if isinstance(exc, DuplicateKeyError):  # subclass of WriteError: check first
        key = (exc.details or {}).get("keyValue")
        return f"Record already exists: {key}" if key else "Record already exists (duplicate key)"
    if isinstance(exc, WriteError) and exc.code == 121:
        return "Validation failed: " + _validation_reason(exc)
    if isinstance(exc, ServerSelectionTimeoutError):
        return "Cannot reach MongoDB; check MONGODB_URI"
    return f"Unexpected error: {exc}"
```

**File: `operations/common.py`**

```python
from datetime import datetime, timezone

TIER_RANK = {"Normal": 1, "Dream": 2, "Super Dream": 3}


def utcnow():
    return datetime.now(timezone.utc)


def parse_date(text):
    return datetime.strptime(text.strip(), "%Y-%m-%d").replace(tzinfo=timezone.utc)


def strip_id(doc):
    doc = dict(doc)
    doc.pop("_id", None)
    return doc


def log_event(db, event_type, entity_id, message):
    """Append to the capped activity feed. Call it AFTER a transaction commits:
    MongoDB does not allow writes to capped collections inside a transaction."""
    db.activity_feed.insert_one({"event_type": event_type, "entity_id": entity_id,
                                 "message": message, "at": utcnow()})
```

**File: `operations/ids.py`**

```python
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
```

**File: `operations/integrity.py`**

```python
"""Everything that replaces foreign keys: guarded deletes and an audit for orphaned references."""
from .errors import PlaceFlowError
from .ids import PREFIX

# parent collection -> [(child collection, child field)] that must not reference a deleted parent
DEPENDENTS = {
    "students": [("applications", "student_id"), ("placements", "student_id"), ("interviews", "student_id")],
    "companies": [("jobs", "company_id"), ("placements", "company_id")],
    "jobs": [("applications", "job_id"), ("placements", "job_id")],
    "applications": [("interviews", "application_id")],
}

# (child collection, child field, parent collection, parent field)
REFERENCES = [
    ("jobs", "company_id", "companies", "company_id"),
    ("applications", "student_id", "students", "student_id"),
    ("applications", "job_id", "jobs", "job_id"),
    ("interviews", "application_id", "applications", "application_id"),
    ("placements", "student_id", "students", "student_id"),
    ("placements", "job_id", "jobs", "job_id"),
]


def safe_delete(db, collection, value):
    """ON DELETE RESTRICT, implemented by hand."""
    if collection == "placements":
        raise PlaceFlowError("Placements cannot be deleted: it would break vacancy counts")
    key, _ = PREFIX[collection]
    for child, field in DEPENDENTS.get(collection, []):
        count = db[child].count_documents({field: value})
        if count:
            raise PlaceFlowError(f"Cannot delete {value}: {count} record(s) in {child} refer to it")
    if db[collection].delete_one({key: value}).deleted_count == 0:
        raise PlaceFlowError(f"{value} not found")


def orphans(db, child, field, parent, parent_field):
    rows = db[child].aggregate([
        {"$lookup": {"from": parent, "localField": field, "foreignField": parent_field, "as": "p"}},
        {"$match": {"p": {"$size": 0}}},
        {"$project": {"_id": 0, field: 1}}])
    return [row[field] for row in rows]


def consistency_issues(db):
    """Audit: dangling references, job.filled vs placements, Placed flag vs placements."""
    issues = []
    for child, field, parent, parent_field in REFERENCES:
        for value in orphans(db, child, field, parent, parent_field):
            issues.append(f"{child}.{field}={value} has no matching {parent}")
    counts = {r["_id"]: r["n"] for r in db.placements.aggregate(
        [{"$group": {"_id": "$job_id", "n": {"$sum": 1}}}])}
    for job in db.jobs.find({}, {"job_id": 1, "filled": 1}):
        if job["filled"] != counts.get(job["job_id"], 0):
            issues.append(f'{job["job_id"]}: filled={job["filled"]} but '
                          f'{counts.get(job["job_id"], 0)} placement(s) exist')
    placed = set(db.placements.distinct("student_id"))
    for student in db.students.find({"placement_status": "Placed"}, {"student_id": 1}):
        if student["student_id"] not in placed:
            issues.append(f'{student["student_id"]}: marked Placed but has no placement')
    return issues
```

**File: `database/sample_data.py`**

```python
"""Small, readable, consistent demo data (sample data only). Safe to re-run: it upserts."""
from datetime import datetime, timedelta, timezone

from pymongo import ReplaceOne

NOW = datetime.now(timezone.utc).replace(microsecond=0)


def days(n):
    return NOW + timedelta(days=n)


def history(*steps):
    return [{"status": status, "at": days(offset)} for status, offset in steps]


def student(n, name, dept, cgpa, backlogs, skills, tier=None):
    doc = {"student_id": f"STU{n:03d}", "name": name,
           "email": f"{name.split()[0].lower()}{n}@univ.edu", "department": dept, "year": 4,
           "cgpa": cgpa, "backlogs": backlogs, "skills": skills,
           "placement_status": "Placed" if tier else "Unplaced", "created_at": days(-120)}
    if tier:
        doc["highest_tier"] = tier
    return doc


def job(n, company, title, tier, lpa, location, skills, min_cgpa, max_backlogs, depts,
        vacancies, filled, deadline_days):
    return {"job_id": f"JOB{n:03d}", "company_id": company, "title": title, "tier": tier,
            "package_lpa": lpa, "location": location, "skills_required": skills,
            "eligibility": {"min_cgpa": min_cgpa, "max_backlogs": max_backlogs, "departments": depts},
            "vacancies": vacancies, "filled": filled, "deadline": days(deadline_days), "status": "Open"}


def application(n, student_id, job_id, steps):
    hist = history(*steps)
    return {"application_id": f"APP{n:03d}", "student_id": student_id, "job_id": job_id,
            "application_date": hist[0]["at"], "status": hist[-1]["status"], "status_history": hist}


def interview(n, app_id, student_id, round_name, offset_days, hour, mode, result, venue=None):
    start = days(offset_days).replace(hour=hour, minute=0)
    doc = {"interview_id": f"INT{n:03d}", "application_id": app_id, "student_id": student_id,
           "round": round_name, "scheduled_start": start,
           "scheduled_end": start + timedelta(minutes=45), "mode": mode, "result": result}
    if venue:
        doc["venue"] = venue
    return doc


ALL = ["CSE", "ISE", "ECE", "EEE", "ME", "CE", "IT"]
IT_BRANCHES = ["CSE", "ISE", "IT", "ECE"]

COMPANIES = [
    {"company_id": "COMP001", "name": "Cognizant", "industry": "IT Services", "location": "Chennai",
     "website": "https://www.cognizant.com"},
    {"company_id": "COMP002", "name": "Zoho", "industry": "Software Products", "location": "Chennai",
     "website": "https://www.zoho.com"},
    {"company_id": "COMP003", "name": "Razorpay", "industry": "Fintech", "location": "Bengaluru",
     "website": "https://razorpay.com"},
    {"company_id": "COMP004", "name": "Capgemini", "industry": "IT Services", "location": "Mumbai",
     "website": "https://www.capgemini.com"},
]

STUDENTS = [
    student(1, "Aarav Sharma", "CSE", 8.9, 0, ["Java", "Spring Boot", "MySQL"]),
    student(2, "Diya Patel", "CSE", 9.2, 0, ["Python", "ML", "SQL"], "Dream"),
    student(3, "Rohan Mehta", "ECE", 7.4, 1, ["C", "Embedded", "Python"]),
    student(4, "Sneha Reddy", "ISE", 8.1, 0, ["Java", "React", "Docker"]),
    student(5, "Karan Singh", "CSE", 6.8, 2, ["C++", "DSA"]),
    student(6, "Ananya Iyer", "IT", 8.6, 0, ["Python", "Django", "AWS"], "Normal"),
    student(7, "Vikram Nair", "ME", 7.9, 0, ["AutoCAD", "Python"]),
    student(8, "Meera Joshi", "CSE", 9.5, 0, ["Java", "DSA", "System Design"]),  # no applications: at-risk demo
]

JOBS = [
    job(1, "COMP001", "Programmer Analyst", "Normal", 4.0, "Chennai", ["Java", "SQL"], 6.0, 1, IT_BRANCHES, 10, 1, 20),
    job(2, "COMP001", "GenC Next", "Dream", 7.0, "Chennai", ["Java", "Spring Boot"], 7.5, 0, ["CSE", "ISE", "IT"], 3, 0, 25),
    job(3, "COMP002", "Member Technical Staff", "Dream", 8.0, "Chennai", ["Java", "DSA"], 7.0, 0, IT_BRANCHES, 2, 1, 15),
    job(4, "COMP003", "Backend Engineer", "Super Dream", 24.0, "Bengaluru", ["Java", "System Design", "SQL"], 8.5, 0, ["CSE", "ISE", "IT"], 2, 0, 30),
    job(5, "COMP004", "Analyst", "Normal", 4.5, "Mumbai", ["Python", "SQL"], 6.5, 2, ALL, 20, 0, 40),
    job(6, "COMP002", "Support Engineer", "Normal", 3.5, "Chennai", ["Communication"], 6.0, 2, ALL, 5, 0, -5),  # past deadline but Open: expiry-sweep demo
]

APPLICATIONS = [
    application(1, "STU001", "JOB001", [("Applied", -12)]),
    application(2, "STU001", "JOB002", [("Applied", -12), ("Shortlisted", -6)]),
    application(3, "STU002", "JOB003", [("Applied", -30), ("Shortlisted", -20), ("Selected", -10)]),
    application(4, "STU002", "JOB004", [("Applied", -5)]),  # Dream-placed student upgrading to Super Dream
    application(5, "STU003", "JOB001", [("Applied", -14), ("Rejected", -8)]),
    application(6, "STU004", "JOB002", [("Applied", -11), ("Shortlisted", -4)]),
    application(7, "STU006", "JOB001", [("Applied", -25), ("Shortlisted", -18), ("Selected", -9)]),
    application(8, "STU004", "JOB005", [("Applied", -7)]),
    application(9, "STU005", "JOB005", [("Applied", -7)]),
    application(10, "STU007", "JOB005", [("Applied", -6)]),
]

INTERVIEWS = [
    interview(1, "APP002", "STU001", "Technical", 3, 10, "Online", "Scheduled"),
    interview(2, "APP006", "STU004", "Technical", 3, 10, "Online", "Scheduled"),
    interview(3, "APP003", "STU002", "HR", -12, 11, "Offline", "Passed", "Seminar Hall A"),
]

PLACEMENTS = [
    {"placement_id": "PLC001", "student_id": "STU002", "company_id": "COMP002", "job_id": "JOB003",
     "package_lpa": 8.0, "placement_date": days(-10), "status": "Placed"},
    {"placement_id": "PLC002", "student_id": "STU006", "company_id": "COMP001", "job_id": "JOB001",
     "package_lpa": 4.0, "placement_date": days(-9), "status": "Placed"},
]

# Order matters: parents before children.
DATA = {
    "companies": (COMPANIES, "company_id"),
    "students": (STUDENTS, "student_id"),
    "jobs": (JOBS, "job_id"),
    "applications": (APPLICATIONS, "application_id"),
    "interviews": (INTERVIEWS, "interview_id"),
    "placements": (PLACEMENTS, "placement_id"),
}


def seed(db):
    for collection, (docs, key) in DATA.items():
        db[collection].bulk_write([ReplaceOne({key: d[key]}, d, upsert=True) for d in docs])
```

**File: `setup_database.py`**

```python
import argparse

from database import sample_data
from database.connection import get_client, get_db, supports_transactions
from database.validation import apply_indexes, apply_schemas, create_views
from operations.ids import sync_counters
from operations.integrity import consistency_issues


def build(reset=False, bulk=False):
    db = get_db()
    if reset or bulk:  # bulk data must never be mixed with the curated set
        get_client().drop_database(db.name)
    apply_schemas(db)
    apply_indexes(db)
    create_views(db)
    if bulk:
        from database import bulk_seed  # built in Phase 9
        bulk_seed.load(db)
    else:
        sample_data.seed(db)
    sync_counters(db)
    return db


def main():
    parser = argparse.ArgumentParser(description="Create/seed the PlaceFlow database")
    parser.add_argument("--reset", action="store_true", help="drop the database first")
    parser.add_argument("--bulk", action="store_true", help="load the large dataset (implies --reset)")
    args = parser.parse_args()
    db = build(args.reset, args.bulk)
    print("Database:", db.name, "| transactions available:", supports_transactions())
    for name in sorted(db.list_collection_names()):
        print(f"  {name:24} {db[name].count_documents({})}")
    print("Consistency issues:", consistency_issues(db) or "none")


if __name__ == "__main__":
    main()
```

**Checkpoint:**

```
python setup_database.py --reset
```

Expected: counts of `companies 4, students 8, jobs 6, applications 10, interviews 3, placements 2, counters 6, activity_feed 0`, the view listed, and `Consistency issues: none`. Run it a second time without `--reset`: it must still work and show the same counts (idempotent).

Commit: `git add -A && git commit -m "phase 4: seed, ids, integrity"`.

---

## Phase 5 — Generate the `mongosh` setup and seed scripts (1.5 hours)

You need standalone `mongosh` scripts for the demonstration, but writing validators twice (Python and JavaScript) guarantees they drift apart. Generate the JavaScript from the Python definitions instead.

**File: `scripts/generate_mongosh.py`**

```python
"""Writes queries/01_setup_database.js, 02_seed_data.js and 05_aggregation_pipelines.js
from the same Python definitions the app uses, so the shell demos can never drift from the app.
Re-run after changing validation.py, sample_data.py or pipelines.py."""
import json
import pathlib
import sys
from datetime import datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from database import sample_data, validation  # noqa: E402
from operations.ids import ID_SPECS  # noqa: E402

try:
    from operations.pipelines import PIPELINES  # created in Phase 7
except ImportError:
    PIPELINES = {}

DB = "college_placement_db"
HEADER = "// GENERATED by scripts/generate_mongosh.py. Edit the Python source, then re-run it.\n"


def js(value):
    """Python value -> mongosh literal."""
    if isinstance(value, datetime):
        return f'ISODate("{value.strftime("%Y-%m-%dT%H:%M:%S")}Z")'
    if isinstance(value, dict):
        return "{" + ", ".join(f"{json.dumps(k)}: {js(v)}" for k, v in value.items()) + "}"
    if isinstance(value, (list, tuple)):
        return "[" + ", ".join(js(v) for v in value) + "]"
    return json.dumps(value)


def setup_script():
    out = [HEADER, f'db = db.getSiblingDB("{DB}");', "db.dropDatabase();", ""]
    for name in validation.SCHEMAS:
        options = {"validator": validation.validator_for(name), "validationLevel": "strict",
                   "validationAction": "error", **validation.CAPPED.get(name, {})}
        out.append(f'db.createCollection("{name}", {js(options)});')
    out.append("")
    for collection, keys, options in validation.INDEXES:
        out.append(f"db.{collection}.createIndex({js(dict(keys))}, {js(options)});")
    out.append("")
    out.append(f'db.createView("{validation.VIEW_NAME}", "applications", {js(validation.VIEW_PIPELINE)});')
    out.append('print("Setup complete: " + db.getCollectionNames().join(", "));')
    return "\n".join(out) + "\n"


def seed_script():
    out = [HEADER, f'db = db.getSiblingDB("{DB}");', ""]
    for collection, (docs, _key) in sample_data.DATA.items():
        rows = ",\n  ".join(js(d) for d in docs)
        out.append(f"db.{collection}.insertMany([\n  {rows}\n]);")
    for collection, key, prefix in ID_SPECS:
        top = max(int(d[key][len(prefix):]) for d in sample_data.DATA[collection][0])
        out.append(f"db.counters.replaceOne({js({'_id': collection})}, "
                   f"{js({'_id': collection, 'seq': top})}, {{upsert: true}});")
    out.append('print("Seeded: " + db.getCollectionNames().map(n => n + "=" + db[n].countDocuments()).join(", "));')
    return "\n".join(out) + "\n"


def aggregation_script():
    out = [HEADER, f'db = db.getSiblingDB("{DB}");', ""]
    for pid, p in PIPELINES.items():
        out.append(f'print("\\n--- {pid}: {p["title"]}");')
        stages = js(p["stages"])
        last = p["stages"][-1]
        if "$merge" in last:
            out.append(f'db.{p["collection"]}.aggregate({stages});')
            out.append(f'print("rows now in {last["$merge"]["into"]}:", db.{last["$merge"]["into"]}.countDocuments());')
        else:
            out.append(f'printjson(db.{p["collection"]}.aggregate({stages}).toArray());')
    return "\n".join(out) + "\n"


def main():
    target = ROOT / "queries"
    target.mkdir(exist_ok=True)
    files = {"01_setup_database.js": setup_script(), "02_seed_data.js": seed_script()}
    if PIPELINES:
        files["05_aggregation_pipelines.js"] = aggregation_script()
    for name, text in files.items():
        (target / name).write_text(text, encoding="utf-8")
        print("wrote", target / name)


if __name__ == "__main__":
    main()
```

Now the hand-written validation demo. Every attempt must be rejected by the database.

**File: `queries/04_validation_demo.js`**

```javascript
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
```

Generate and run:

```
python scripts/generate_mongosh.py
mongosh "mongodb://localhost:27017/?replicaSet=rs0" --file queries/01_setup_database.js
mongosh "mongodb://localhost:27017/?replicaSet=rs0" --file queries/02_seed_data.js
mongosh "mongodb://localhost:27017/?replicaSet=rs0" --file queries/04_validation_demo.js
```

Note: `01_setup_database.js` drops the database. Run it only when you want a clean slate.

**Checkpoint:** every line in the validation demo starts with `REJECTED`, V1–V6 show `code=121`, V7–V8 show `code=11000`, and V9 prints `true` then `back to error mode`. Any `UNEXPECTED SUCCESS` means a validator is wrong: fix `validation.py`, regenerate, rerun.

Commit: `git add -A && git commit -m "phase 5: generated mongosh scripts, validation demo"`.

---

## Phase 6 — Business rules (6 hours)

Build these one file at a time. Each function takes `db` as its first argument and raises `PlaceFlowError` with a message that says exactly what is wrong.

**File: `operations/students.py`**

```python
from .common import utcnow
from .errors import PlaceFlowError
from .ids import insert_with_id

EDITABLE = {"name", "phone", "department", "year", "cgpa", "backlogs", "skills"}


def add_student(db, data):
    doc = {"placement_status": "Unplaced", "skills": [], "created_at": utcnow(), **data}
    return insert_with_id(db, "students", doc)


def get_student(db, student_id):
    doc = db.students.find_one({"student_id": student_id})
    if not doc:
        raise PlaceFlowError(f"Student {student_id} does not exist")
    return doc


def update_student(db, student_id, changes):
    bad = set(changes) - EDITABLE
    if bad:
        raise PlaceFlowError("Cannot edit: " + ", ".join(sorted(bad)))
    if db.students.update_one({"student_id": student_id}, {"$set": changes}).matched_count == 0:
        raise PlaceFlowError(f"Student {student_id} does not exist")
```

**File: `operations/jobs.py`**

```python
from .errors import PlaceFlowError
from .ids import insert_with_id


def add_job(db, data):
    """BR-03: a job may only be created for a company that exists."""
    company_id = data.get("company_id")
    if db.companies.count_documents({"company_id": company_id}, limit=1) == 0:
        raise PlaceFlowError(f"Company {company_id} does not exist")
    return insert_with_id(db, "jobs", {"filled": 0, "status": "Open", **data})


def get_job(db, job_id):
    doc = db.jobs.find_one({"job_id": job_id})
    if not doc:
        raise PlaceFlowError(f"Job {job_id} does not exist")
    return doc
```

**File: `operations/applications.py`**

```python
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from .common import TIER_RANK, log_event, utcnow
from .errors import PlaceFlowError
from .ids import next_id


def check_eligibility(student, job, now=None):
    """Raise PlaceFlowError stating the specific reason. Shared by apply, the bulk seeder and tests."""
    now = now or utcnow()
    if job["status"] != "Open":
        raise PlaceFlowError(f'{job["job_id"]} is closed')
    if job["deadline"] <= now:
        raise PlaceFlowError(f'The deadline for {job["job_id"]} has passed')
    if job["filled"] >= job["vacancies"]:
        raise PlaceFlowError(f'All vacancies for {job["job_id"]} are filled')
    rule = job["eligibility"]
    if student["cgpa"] < rule["min_cgpa"]:
        raise PlaceFlowError(f'CGPA {student["cgpa"]} is below the minimum {rule["min_cgpa"]}')
    if student["backlogs"] > rule["max_backlogs"]:
        raise PlaceFlowError(f'{student["backlogs"]} backlog(s) exceed the allowed {rule["max_backlogs"]}')
    if student["department"] not in rule["departments"]:
        raise PlaceFlowError(f'{student["department"]} is not an eligible department')
    if student["placement_status"] == "Placed" and TIER_RANK[job["tier"]] <= TIER_RANK[student["highest_tier"]]:
        raise PlaceFlowError(f'Already placed in {student["highest_tier"]}; may only apply to a higher tier')


def allowed_tiers(student):
    floor = TIER_RANK.get(student.get("highest_tier"), 0)
    return [tier for tier, rank in TIER_RANK.items() if rank > floor]


def apply_for_job(db, student_id, job_id):
    student = db.students.find_one({"student_id": student_id})
    job = db.jobs.find_one({"job_id": job_id})
    if not student:
        raise PlaceFlowError(f"Student {student_id} does not exist")
    if not job:
        raise PlaceFlowError(f"Job {job_id} does not exist")
    check_eligibility(student, job)
    now = utcnow()
    doc = {"application_id": next_id(db, "applications"), "student_id": student_id,
           "job_id": job_id, "application_date": now, "status": "Applied",
           "status_history": [{"status": "Applied", "at": now}]}
    try:
        db.applications.insert_one(doc)
    except DuplicateKeyError:  # the unique (student_id, job_id) index fired
        raise PlaceFlowError(f"{student_id} has already applied to {job_id}") from None
    log_event(db, "APPLIED", doc["application_id"], f'{student["name"]} applied to {job["title"]}')
    return doc["application_id"]


def eligible_jobs(db, student):
    applied = db.applications.distinct("job_id", {"student_id": student["student_id"]})
    return list(db.jobs.find({
        "status": "Open",
        "deadline": {"$gt": utcnow()},
        "eligibility.min_cgpa": {"$lte": student["cgpa"]},
        "eligibility.max_backlogs": {"$gte": student["backlogs"]},
        "eligibility.departments": student["department"],
        "tier": {"$in": allowed_tiers(student)},
        "job_id": {"$nin": applied},
        "$expr": {"$lt": ["$filled", "$vacancies"]},
    }, {"_id": 0}).sort("package_lpa", -1))


def eligible_candidates(db, job):
    rule = job["eligibility"]
    applied = db.applications.distinct("student_id", {"job_id": job["job_id"]})
    lower = [tier for tier, rank in TIER_RANK.items() if rank < TIER_RANK[job["tier"]]]
    return list(db.students.find({
        "department": {"$in": rule["departments"]},
        "cgpa": {"$gte": rule["min_cgpa"]},
        "backlogs": {"$lte": rule["max_backlogs"]},
        "student_id": {"$nin": applied},
        "$or": [{"placement_status": "Unplaced"}, {"highest_tier": {"$in": lower}}],
    }, {"_id": 0, "student_id": 1, "name": 1, "department": 1, "cgpa": 1}).sort("cgpa", -1))


def update_status(db, application_id, new_status, note=None):
    """Move an application through its pipeline and record the change in status_history."""
    if new_status == "Selected":
        raise PlaceFlowError("Use Finalize Placement to select a student")
    if new_status not in ("Applied", "Shortlisted", "Rejected"):
        raise PlaceFlowError(f"Unknown status {new_status}")
    entry = {"status": new_status, "at": utcnow()}
    if note:
        entry["note"] = note
    app = db.applications.find_one_and_update(
        {"application_id": application_id, "status": {"$ne": "Selected"}},
        {"$set": {"status": new_status},
         "$push": {"status_history": {"$each": [entry], "$slice": -20}}},
        return_document=ReturnDocument.AFTER)
    if app is None:
        raise PlaceFlowError("Application not found, or already Selected")
    log_event(db, new_status.upper(), application_id, f"{application_id} moved to {new_status}")
    return app
```

**File: `operations/interviews.py`**

```python
from .common import log_event
from .errors import PlaceFlowError
from .ids import next_id


def schedule_interview(db, application_id, round_name, start, end, mode, venue=None):
    """BR-07: existing, Shortlisted application only; no overlap with the student's other interviews."""
    if end <= start:
        raise PlaceFlowError("An interview must end after it starts")
    app = db.applications.find_one({"application_id": application_id})
    if not app:
        raise PlaceFlowError(f"Application {application_id} does not exist")
    if app["status"] != "Shortlisted":
        raise PlaceFlowError("Only Shortlisted applications can be scheduled for interview")
    clash = db.interviews.find_one({
        "student_id": app["student_id"], "result": "Scheduled",
        "scheduled_start": {"$lt": end}, "scheduled_end": {"$gt": start}})
    if clash:
        raise PlaceFlowError(f'Clashes with {clash["interview_id"]} ({clash["round"]})')
    doc = {"interview_id": next_id(db, "interviews"), "application_id": application_id,
           "student_id": app["student_id"], "round": round_name, "scheduled_start": start,
           "scheduled_end": end, "mode": mode, "result": "Scheduled"}
    if venue:
        doc["venue"] = venue
    db.interviews.insert_one(doc)
    log_event(db, "INTERVIEW_SCHEDULED", doc["interview_id"], f'{app["student_id"]}: {round_name} round')
    return doc["interview_id"]
```

**File: `operations/placements.py`**

```python
from pymongo import ReadConcern, WriteConcern

from .common import TIER_RANK, log_event, utcnow
from .errors import PlaceFlowError, VacancyExhausted
from .ids import next_id


def finalize_placement(db, student_id, job_id):
    """Atomic: placement + application + job seat + student, or nothing at all."""

    def txn(session):
        student = db.students.find_one({"student_id": student_id}, session=session)
        job = db.jobs.find_one({"job_id": job_id}, session=session)
        if not student:
            raise PlaceFlowError(f"Student {student_id} does not exist")
        if not job:
            raise PlaceFlowError(f"Job {job_id} does not exist")
        app = db.applications.find_one({"student_id": student_id, "job_id": job_id}, session=session)
        if not app or app["status"] != "Shortlisted":
            raise PlaceFlowError("Only a Shortlisted application can be finalized")
        if student["placement_status"] == "Placed" and TIER_RANK[job["tier"]] <= TIER_RANK[student["highest_tier"]]:
            raise PlaceFlowError(f'Already placed in {student["highest_tier"]}; a higher tier is required')

        # Claim a seat. The filter makes this safe under concurrency: if another
        # transaction took the last seat, nothing matches and we abort.
        claimed = db.jobs.update_one(
            {"job_id": job_id, "status": "Open", "$expr": {"$lt": ["$filled", "$vacancies"]}},
            [{"$set": {
                "filled": {"$add": ["$filled", 1]},
                "status": {"$cond": [{"$gte": [{"$add": ["$filled", 1]}, "$vacancies"]},
                                     "Closed", "$status"]}}}],
            session=session)
        if claimed.matched_count == 0:
            raise VacancyExhausted(f"No vacancy left for {job_id}")

        now = utcnow()
        placement_id = next_id(db, "placements", session)
        db.placements.insert_one({
            "placement_id": placement_id, "student_id": student_id, "company_id": job["company_id"],
            "job_id": job_id, "package_lpa": job["package_lpa"], "placement_date": now,
            "status": "Placed"}, session=session)
        db.applications.update_one(
            {"application_id": app["application_id"]},
            {"$set": {"status": "Selected"},
             "$push": {"status_history": {"status": "Selected", "at": now}}}, session=session)
        db.students.update_one(
            {"student_id": student_id},
            {"$set": {"placement_status": "Placed", "highest_tier": job["tier"]}}, session=session)
        return placement_id, f'{student["name"]} placed as {job["title"]}'

    with db.client.start_session() as session:
        # with_transaction retries automatically on TransientTransactionError
        placement_id, message = session.with_transaction(
            txn, read_concern=ReadConcern("snapshot"), write_concern=WriteConcern("majority"))
    log_event(db, "PLACED", placement_id, message)  # outside the transaction: capped collections can't be written inside one
    return placement_id
```

Why each rule lives where it does:

- Eligibility is checked in code **and** can be demonstrated with the `eligible_jobs` query, because the query is what a placement officer would actually run.
- The duplicate check is *not* a pre-check (`find` then `insert` can race). The unique index decides; the code only translates the error.
- The seat claim uses a filter, not a read-then-write, so two concurrent transactions cannot both succeed.

**Checkpoint** (a quick manual run before you write tests):

```
python -c "
from database.connection import get_db
from operations import applications, placements
from operations.errors import friendly
db = get_db()
try: applications.apply_for_job(db, 'STU005', 'JOB004')
except Exception as e: print('1.', friendly(e))
try: applications.apply_for_job(db, 'STU001', 'JOB001')
except Exception as e: print('2.', friendly(e))
print('3.', placements.finalize_placement(db, 'STU001', 'JOB002'))
"
```

Expected: line 1 says CGPA 6.8 is below the minimum 8.5; line 2 says STU001 has already applied to JOB001; line 3 prints a new placement ID (`PLC003`). Then:

```
python -c "from database.connection import get_db; from operations.integrity import consistency_issues; print(consistency_issues(get_db()) or 'none')"
```

Expected: `none`. Reset with `python setup_database.py --reset` when you want the seed state back.

Commit: `git add -A && git commit -m "phase 6: business rules"`.

---

## Phase 7 — Pipelines, reports, demo registry (3 hours)

Every aggregation goes into one registry. Reports, the CLI, the Demo Lab and the generated `mongosh` script all read it.

**File: `operations/pipelines.py`**

```python
"""Every parameterless aggregation in one registry. Read by reports.py, demo_registry.py and
scripts/generate_mongosh.py, so the app and the shell demos always run the same pipelines."""


def lookup(source, local, foreign, alias):
    return {"$lookup": {"from": source, "localField": local, "foreignField": foreign, "as": alias}}


def pct(part, whole):
    return {"$round": [{"$multiply": [{"$divide": [part, {"$max": [whole, 1]}]}, 100]}, 1]}


# Branch-wise placement statistics (A9), reused by A13 which materializes it.
BRANCH = [
    lookup("placements", "student_id", "student_id", "plc"),
    {"$addFields": {"best": {"$max": "$plc.package_lpa"}}},  # the student's best offer, null if none
    {"$group": {
        "_id": "$department",
        "students": {"$sum": 1},
        "placed": {"$sum": {"$cond": [{"$gt": [{"$size": "$plc"}, 0]}, 1, 0]}},
        "avg_package": {"$avg": "$best"},
        "max_package": {"$max": "$best"},
        "median_package": {"$median": {"input": "$best", "method": "approximate"}}}},  # MongoDB 7.0+
    {"$project": {"students": 1, "placed": 1, "placement_pct": pct("$placed", "$students"),
                  "avg_package": {"$round": ["$avg_package", 2]},
                  "max_package": 1, "median_package": 1}},
]

PIPELINES = {
    "A1": {
        "title": "Application KPIs in one pass ($facet)", "collection": "applications",
        "scenario": "Status counts and the most-applied job from a single scan of applications.",
        "stages": [{"$facet": {
            "by_status": [{"$group": {"_id": "$status", "n": {"$sum": 1}}}, {"$sort": {"n": -1}}],
            "most_applied": [
                {"$group": {"_id": "$job_id", "n": {"$sum": 1}}}, {"$sort": {"n": -1}}, {"$limit": 1},
                lookup("jobs", "_id", "job_id", "job"), {"$unwind": "$job"},
                {"$project": {"_id": 0, "title": "$job.title", "applications": "$n"}}]}}]},
    "A1b": {
        "title": "Placement KPIs in one pass ($facet)", "collection": "placements",
        "scenario": "Average and highest package plus the top hiring company in one scan.",
        "stages": [{"$facet": {
            "stats": [{"$group": {"_id": None, "avg": {"$avg": "$package_lpa"}, "max": {"$max": "$package_lpa"}}}],
            "top_company": [
                {"$group": {"_id": "$company_id", "hires": {"$sum": 1}}}, {"$sort": {"hires": -1}}, {"$limit": 1},
                lookup("companies", "_id", "company_id", "company"), {"$unwind": "$company"},
                {"$project": {"_id": 0, "company": "$company.name", "hires": 1}}]}}]},
    "A2": {
        "title": "Top hiring companies", "collection": "placements",
        "scenario": "Which companies hired the most students, with their names.",
        "stages": [
            {"$group": {"_id": "$company_id", "hires": {"$sum": 1}, "avg_package": {"$avg": "$package_lpa"}}},
            {"$sort": {"hires": -1}}, {"$limit": 5},
            lookup("companies", "_id", "company_id", "company"), {"$unwind": "$company"},
            {"$project": {"_id": 0, "company": "$company.name", "hires": 1,
                          "avg_package": {"$round": ["$avg_package", 2]}}}]},
    "A3": {
        "title": "Applications joined with students", "collection": "applications",
        "scenario": "The classic join: each application with the student's name, department and CGPA.",
        "stages": [
            lookup("students", "student_id", "student_id", "student"), {"$unwind": "$student"},
            {"$project": {"_id": 0, "application_id": 1, "status": 1, "name": "$student.name",
                          "department": "$student.department", "cgpa": "$student.cgpa"}}]},
    "A4": {
        "title": "Student, job and company in one chain", "collection": "applications",
        "scenario": "Chained joins, using a sub-pipeline $lookup for the job.",
        "stages": [
            lookup("students", "student_id", "student_id", "s"), {"$unwind": "$s"},
            {"$lookup": {"from": "jobs", "let": {"jid": "$job_id"},
                         "pipeline": [{"$match": {"$expr": {"$eq": ["$job_id", "$$jid"]}}},
                                      {"$project": {"_id": 0, "title": 1, "tier": 1,
                                                    "package_lpa": 1, "company_id": 1}}],
                         "as": "j"}},
            {"$unwind": "$j"},
            lookup("companies", "j.company_id", "company_id", "c"), {"$unwind": "$c"},
            {"$project": {"_id": 0, "application_id": 1, "student": "$s.name", "job": "$j.title",
                          "company": "$c.name", "package_lpa": "$j.package_lpa", "status": 1}}]},
    "A5": {
        "title": "Per-job funnel", "collection": "applications",
        "scenario": "Applied, shortlisted and selected counts per job with conversion percentage.",
        "stages": [
            {"$group": {
                "_id": "$job_id", "applied": {"$sum": 1},
                "shortlisted": {"$sum": {"$cond": [{"$in": ["Shortlisted", "$status_history.status"]}, 1, 0]}},
                "selected": {"$sum": {"$cond": [{"$eq": ["$status", "Selected"]}, 1, 0]}}}},
            lookup("jobs", "_id", "job_id", "job"), {"$unwind": "$job"},
            {"$project": {"_id": 0, "job_id": "$_id", "title": "$job.title", "applied": 1,
                          "shortlisted": 1, "selected": 1, "conversion_pct": pct("$selected", "$applied")}},
            {"$sort": {"applied": -1}}]},
    "A6": {
        "title": "At-risk students (unplaced, no applications)", "collection": "students",
        "scenario": "Who has not even applied yet, so the cell can intervene early.",
        "stages": [
            {"$match": {"placement_status": "Unplaced"}},
            lookup("applications", "student_id", "student_id", "apps"),
            {"$match": {"apps": {"$size": 0}}},
            {"$project": {"_id": 0, "student_id": 1, "name": 1, "department": 1, "cgpa": 1, "skills": 1}},
            {"$sort": {"cgpa": -1}}]},
    "A7a": {
        "title": "Skill demand (open seats per skill)", "collection": "jobs",
        "scenario": "How many open seats require each skill.",
        "stages": [
            {"$match": {"status": "Open"}}, {"$unwind": "$skills_required"},
            {"$group": {"_id": {"$toLower": "$skills_required"},
                        "seats": {"$sum": {"$subtract": ["$vacancies", "$filled"]}}}},
            {"$sort": {"seats": -1}}]},
    "A7b": {
        "title": "Skill supply (unplaced students per skill)", "collection": "students",
        "scenario": "How many unplaced students have each skill.",
        "stages": [
            {"$match": {"placement_status": "Unplaced"}}, {"$unwind": "$skills"},
            {"$group": {"_id": {"$toLower": "$skills"}, "students": {"$sum": 1}}},
            {"$sort": {"students": -1}}]},
    "A8": {
        "title": "Package distribution histogram", "collection": "placements",
        "scenario": "How many placements fall into each package band.",
        "stages": [{"$bucket": {"groupBy": "$package_lpa", "boundaries": [0, 4, 6, 8, 12, 20, 1000],
                                "default": "other", "output": {"placements": {"$sum": 1}}}}]},
    "A9": {
        "title": "Branch-wise placement statistics", "collection": "students",
        "scenario": "Placement %, average, median and highest package per department.",
        "stages": BRANCH + [{"$sort": {"_id": 1}}]},
    "A10": {
        "title": "Monthly placement trend", "collection": "placements",
        "scenario": "Placements and average package per month.",
        "stages": [{"$group": {"_id": {"$dateToString": {"format": "%Y-%m", "date": "$placement_date"}},
                               "placements": {"$sum": 1}, "avg_package": {"$avg": "$package_lpa"}}},
                   {"$project": {"placements": 1, "avg_package": {"$round": ["$avg_package", 2]}}},
                   {"$sort": {"_id": 1}}]},
    "A11": {
        "title": "Interview load per day", "collection": "interviews",
        "scenario": "How many interviews are scheduled each day, to plan rooms and panels.",
        "stages": [{"$group": {"_id": {"$dateTrunc": {"date": "$scheduled_start", "unit": "day"}},
                               "interviews": {"$sum": 1}}},
                   {"$sort": {"_id": 1}}]},
    "A12": {
        "title": "Top 3 by CGPA within each department", "collection": "students",
        "scenario": "A window function ranks students inside their department.",
        "stages": [{"$setWindowFields": {"partitionBy": "$department", "sortBy": {"cgpa": -1},
                                         "output": {"dept_rank": {"$rank": {}}}}},
                   {"$match": {"dept_rank": {"$lte": 3}}},
                   {"$project": {"_id": 0, "department": 1, "student_id": 1, "name": 1,
                                 "cgpa": 1, "dept_rank": 1}},
                   {"$sort": {"department": 1, "dept_rank": 1}}]},
    "A13": {
        "title": "Materialize branch report ($merge)", "collection": "students",
        "scenario": "Write the branch statistics into branch_placement_stats for export and accreditation.",
        "stages": BRANCH + [{"$merge": {"into": "branch_placement_stats",
                                        "whenMatched": "replace", "whenNotMatched": "insert"}}]},
    "A14": {
        "title": "Applications and placements on one timeline ($unionWith)", "collection": "applications",
        "scenario": "One chronological feed built from two collections.",
        "stages": [{"$project": {"_id": 0, "type": {"$literal": "application"}, "ref": "$application_id",
                                 "at": "$application_date"}},
                   {"$unionWith": {"coll": "placements", "pipeline": [
                       {"$project": {"_id": 0, "type": {"$literal": "placement"}, "ref": "$placement_id",
                                     "at": "$placement_date"}}]}},
                   {"$sort": {"at": -1}}, {"$limit": 20}]},
    "A15": {
        "title": "Offered CTC by tier", "collection": "jobs",
        "scenario": "Average posted package per tier, shown beside what students actually received.",
        "stages": [{"$group": {"_id": "$tier", "jobs": {"$sum": 1}, "avg_offered_lpa": {"$avg": "$package_lpa"}}},
                   {"$project": {"jobs": 1, "avg_offered_lpa": {"$round": ["$avg_offered_lpa", 2]}}},
                   {"$sort": {"avg_offered_lpa": 1}}]},
}
```

**File: `operations/reports.py`**

```python
from .pipelines import PIPELINES


def run(db, pipeline_id):
    spec = PIPELINES[pipeline_id]
    return list(db[spec["collection"]].aggregate(spec["stages"]))


def placement_report(db):
    """The 9 dashboard cards. Every figure comes from a query or pipeline; nothing is hardcoded."""
    apps = (run(db, "A1") or [{}])[0]
    plc = (run(db, "A1b") or [{}])[0]
    stats = (plc.get("stats") or [{"avg": 0, "max": 0}])[0]
    by_status = {r["_id"]: r["n"] for r in apps.get("by_status", [])}
    top = (plc.get("top_company") or [{"company": "-"}])[0]["company"]
    students = db.students.count_documents({})
    placed = db.students.count_documents({"placement_status": "Placed"})
    return [
        ("Total Students", students),
        ("Placement %", round(100 * placed / students, 1) if students else 0),
        ("Total Companies", db.companies.count_documents({})),
        ("Open Jobs", db.jobs.count_documents({"status": "Open"})),
        ("Total Applications", sum(by_status.values())),
        ("Offers (Selected)", by_status.get("Selected", 0)),
        ("Average Package (LPA)", round(stats["avg"] or 0, 2)),
        ("Highest Package (LPA)", stats["max"] or 0),
        ("Top Hiring Company", top),
    ]


def pipeline_health(db):
    rows = (run(db, "A1") or [{}])[0].get("by_status", [])
    total = sum(r["n"] for r in rows) or 1
    return [{"status": r["_id"], "n": r["n"], "pct": round(100 * r["n"] / total, 1)} for r in rows]


def top_roles(db, limit=5):
    return list(db.jobs.find(
        {"status": "Open"},
        {"_id": 0, "title": 1, "location": 1, "package_lpa": 1, "tier": 1, "status": 1}
    ).sort("package_lpa", -1).limit(limit))


def recent_activity(db, limit=10):
    return list(db.activity_feed.find({}, {"_id": 0}).sort([("$natural", -1)]).limit(limit))


def skill_gap(db):
    seats = {r["_id"]: r["seats"] for r in run(db, "A7a")}
    students = {r["_id"]: r["students"] for r in run(db, "A7b")}
    rows = [{"skill": skill, "open_seats": n, "unplaced_students": students.get(skill, 0),
             "gap": n - students.get(skill, 0)} for skill, n in seats.items()]
    return sorted(rows, key=lambda r: -r["gap"])


def _rename(rows, new, old="_id"):
    return [{new: r.pop(old), **r} for r in rows]


# id -> (title, function(db) -> list of dict rows). Drives the Reports page, CSV export and the CLI.
REPORTS = {
    "branch": ("Branch-wise placement", lambda db: _rename(run(db, "A9"), "department")),
    "funnel": ("Per-job funnel", lambda db: run(db, "A5")),
    "skills": ("Skill gap: open seats vs unplaced students", skill_gap),
    "at_risk": ("At-risk students", lambda db: run(db, "A6")),
    "histogram": ("Package distribution", lambda db: _rename(run(db, "A8"), "from_lpa")),
    "trend": ("Monthly placements", lambda db: _rename(run(db, "A10"), "month")),
    "offered": ("Offered CTC by tier", lambda db: _rename(run(db, "A15"), "tier")),
}
```

**File: `operations/demo_registry.py`**

```python
"""Catalogue of live demos used by the Demo Lab page and the CLI.
Each demo returns {"rows": [...]} plus optional timing."""
import json
import time

from .common import utcnow
from .pipelines import PIPELINES

DEMOS = {}


def demo(demo_id, title, scenario, mongosh):
    def register(fn):
        DEMOS[demo_id] = {"id": demo_id, "title": title, "scenario": scenario,
                          "mongosh": mongosh, "run": fn}
        return fn
    return register


def stages_of(plan, found=None):
    """Collect every plan stage name (IXSCAN, COLLSCAN, FETCH, ...) from an explain plan."""
    found = [] if found is None else found
    if isinstance(plan, dict):
        if "stage" in plan:
            found.append(plan["stage"])
        for value in plan.values():
            stages_of(value, found)
    elif isinstance(plan, list):
        for value in plan:
            stages_of(value, found)
    return found


def explain_find(db, collection, flt, hint=None, projection=None):
    command = {"find": collection, "filter": flt}
    if hint:
        command["hint"] = hint
    if projection:
        command["projection"] = projection
    out = db.command({"explain": command, "verbosity": "executionStats"})
    stats = out["executionStats"]
    found = stages_of(out["queryPlanner"]["winningPlan"])
    return {"plan": "IXSCAN" if any("IXSCAN" in s for s in found) else "COLLSCAN",
            "returned": stats["nReturned"], "docs_examined": stats["totalDocsExamined"],
            "keys_examined": stats["totalKeysExamined"], "ms": stats["executionTimeMillis"]}


ELIGIBLE = {"department": "CSE", "cgpa": {"$gte": 8.5}, "backlogs": 0, "placement_status": "Unplaced"}


@demo("I1", "Eligible candidates: index vs collection scan",
      "The same query run twice: once forced to scan every document, once with the planner's index. "
      "Load the bulk dataset (setup_database.py --bulk) to see a real difference.",
      'db.students.find({department:"CSE", cgpa:{$gte:8.5}, backlogs:0, placement_status:"Unplaced"})'
      '.hint({$natural:1}).explain("executionStats")')
def i1(db):
    return {"rows": [
        {"run": "forced COLLSCAN", **explain_find(db, "students", ELIGIBLE, hint={"$natural": 1})},
        {"run": "planner's choice", **explain_find(db, "students", ELIGIBLE)}]}


@demo("I2", "Covered query",
      "Project only indexed fields and exclude _id: MongoDB answers from the index alone (0 documents read).",
      'db.students.find({department:"CSE", cgpa:{$gte:9}}, {_id:0, department:1, cgpa:1}).explain("executionStats")')
def i2(db):
    row = explain_find(db, "students", {"department": "CSE", "cgpa": {"$gte": 9}},
                       projection={"_id": 0, "department": 1, "cgpa": 1})
    return {"rows": [{"run": "covered by ix_dept_cgpa", **row}]}


@demo("T1", "Transaction: atomic, then rolled back",
      "Insert a placement and bump a job's filled count inside a transaction, read it from inside and "
      "outside, then abort. Nothing is left behind.",
      "session.startTransaction(); ...; session.abortTransaction()")
def t1(db):
    def snapshot(session=None):
        return {"placement_rows": db.placements.count_documents({"placement_id": "PLC999"}, session=session),
                "job_filled": db.jobs.find_one({"job_id": "JOB005"}, session=session)["filled"]}

    with db.client.start_session() as session:
        session.start_transaction()
        db.placements.insert_one({
            "placement_id": "PLC999", "student_id": "STU001", "company_id": "COMP004", "job_id": "JOB005",
            "package_lpa": 4.5, "placement_date": utcnow(), "status": "Placed"}, session=session)
        db.jobs.update_one({"job_id": "JOB005"}, {"$inc": {"filled": 1}}, session=session)
        inside = snapshot(session)
        outside = snapshot()
        session.abort_transaction()
    return {"rows": [{"where": "inside the transaction", **inside},
                     {"where": "outside (other clients)", **outside},
                     {"where": "after abort", **snapshot()}]}


def _pipeline_demo(spec):
    def run(db):
        started = time.perf_counter()
        rows = list(db[spec["collection"]].aggregate(spec["stages"]))
        return {"rows": rows[:20], "total": len(rows),
                "ms": round((time.perf_counter() - started) * 1000, 1)}
    return run


for _pid, _spec in PIPELINES.items():
    DEMOS[_pid] = {"id": _pid, "title": _spec["title"], "scenario": _spec["scenario"],
                   "mongosh": f'db.{_spec["collection"]}.aggregate({json.dumps(_spec["stages"])})',
                   "run": _pipeline_demo(_spec)}
```

**Checkpoint:**

```
python scripts/generate_mongosh.py
python -c "from database.connection import get_db; from operations import reports; db=get_db(); print(reports.placement_report(db)); print(reports.run(db,'A6'))"
mongosh "mongodb://localhost:27017/?replicaSet=rs0" --file queries/05_aggregation_pipelines.js
```

Expected on the seed data: Total Students 8, Placement % 25.0, Companies 4, Open Jobs 6, Applications 10, Offers 2, Average Package 6.0, Highest 8.0; `A6` returns Meera Joshi (STU008); the `mongosh` run prints every pipeline's result and ends with `rows now in branch_placement_stats: 5`. If `$median` errors, your MongoDB is older than 7.0.

Commit: `git add -A && git commit -m "phase 7: pipelines and reports"`.

---

## Phase 8 — `mongosh` demonstration scripts (3 hours)

These run with no Python at all. Run `python setup_database.py --reset` (or scripts 01 + 02) before each so the data is in its seed state.

**File: `queries/03_crud_operations.js`**

```javascript
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
```

**File: `queries/07_transactions.js`**

```javascript
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
```

**File: `queries/08_views_and_reports.js`**

```javascript
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
```

**File: `queries/09_change_stream_demo.js`**

```javascript
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
```

Run them:

```
python setup_database.py --reset
mongosh "mongodb://localhost:27017/?replicaSet=rs0" --file queries/03_crud_operations.js
python setup_database.py --reset
mongosh "mongodb://localhost:27017/?replicaSet=rs0" --file queries/07_transactions.js
mongosh "mongodb://localhost:27017/?replicaSet=rs0" --file queries/08_views_and_reports.js
```

For `09`: open two terminals; run the script in one, run the printed `updateOne` in the other, and watch the event appear. Stop it with `Ctrl+C`.

**Checkpoint:** in `03`, C2 reports 2 valid rows inserted despite the duplicate, U3 shows `Docker` once, D1 prints `deleted: 1`. In `07`, T1 prints `COMMITTED PLC901` and JOB002 shows `filled: 1`; T2 prints `ABORTED: VacancyExhausted` and `placement PLC902 exists: false`. In `08`, `isCapped: true | documents: 500`.

Commit: `git add -A && git commit -m "phase 8: mongosh demos"`.

---

## Phase 9 — Bulk dataset and index evidence (2 hours)

Indexes only matter at scale, so generate a realistic large dataset that obeys every business rule. It reuses `check_eligibility`, so the generator and the app can never disagree about eligibility.

**File: `database/bulk_seed.py`**

```python
import random
from datetime import timedelta

from database.sample_data import NOW
from database.validation import DEPARTMENTS, TIERS
from operations.applications import check_eligibility
from operations.errors import PlaceFlowError

SKILLS = ["Java", "Python", "C++", "SQL", "React", "Spring Boot", "Docker", "AWS", "ML", "DSA", "Node.js", "Git"]
CITIES = ["Bengaluru", "Chennai", "Pune", "Hyderabad", "Mumbai"]
BANDS = {"Normal": (3.5, 6.5), "Dream": (7.0, 14.0), "Super Dream": (15.0, 40.0)}


def insert_all(db, name, docs):
    for start in range(0, len(docs), 1000):
        db[name].insert_many(docs[start:start + 1000], ordered=False)


def load(db, n_students=5000, n_companies=300, n_jobs=1500, n_apps=25000, seed=42):
    rng = random.Random(seed)  # fixed seed: identical data on every run

    students = [{
        "student_id": f"STU{i:04d}", "name": f"Student {i}", "email": f"student{i}@univ.edu",
        "department": rng.choice(DEPARTMENTS), "year": 4, "cgpa": round(rng.uniform(5.5, 9.8), 2),
        "backlogs": rng.choice([0, 0, 0, 0, 1, 2]), "skills": rng.sample(SKILLS, rng.randint(2, 5)),
        "placement_status": "Unplaced", "created_at": NOW} for i in range(1, n_students + 1)]
    companies = [{
        "company_id": f"COMP{i:03d}", "name": f"Company {i}",
        "industry": rng.choice(["IT Services", "Fintech", "Product", "Core Engineering"]),
        "location": rng.choice(CITIES)} for i in range(1, n_companies + 1)]

    jobs = []
    for i in range(1, n_jobs + 1):
        tier = rng.choices(TIERS, weights=[6, 3, 1])[0]
        low, high = BANDS[tier]
        jobs.append({
            "job_id": f"JOB{i:04d}", "company_id": f"COMP{rng.randint(1, n_companies):03d}",
            "title": f"Role {i}", "tier": tier, "package_lpa": round(rng.uniform(low, high), 1),
            "location": rng.choice(CITIES), "skills_required": rng.sample(SKILLS, rng.randint(1, 3)),
            "eligibility": {"min_cgpa": round(rng.uniform(6, 8.5), 1), "max_backlogs": rng.choice([0, 1, 2]),
                            "departments": rng.sample(DEPARTMENTS, rng.randint(2, 6))},
            "vacancies": rng.randint(1, 15), "filled": 0,
            "deadline": NOW + timedelta(days=rng.randint(5, 90)), "status": "Open"})
    by_student = {s["student_id"]: s for s in students}
    by_job = {j["job_id"]: j for j in jobs}

    applications, seen, attempts = [], set(), 0
    while len(applications) < n_apps and attempts < n_apps * 20:
        attempts += 1
        student, job = rng.choice(students), rng.choice(jobs)
        if (student["student_id"], job["job_id"]) in seen:
            continue
        try:
            check_eligibility(student, job, NOW)
        except PlaceFlowError:
            continue
        seen.add((student["student_id"], job["job_id"]))
        final = rng.choices(["Applied", "Shortlisted", "Rejected"], weights=[50, 30, 20])[0]
        steps = {"Applied": ["Applied"], "Shortlisted": ["Applied", "Shortlisted"],
                 "Rejected": ["Applied", "Rejected"]}[final]
        applied_at = NOW - timedelta(days=rng.randint(5, 30))
        history = [{"status": s, "at": applied_at + timedelta(days=n)} for n, s in enumerate(steps)]
        applications.append({
            "application_id": f"APP{len(applications) + 1:05d}", "student_id": student["student_id"],
            "job_id": job["job_id"], "application_date": applied_at, "status": final,
            "status_history": history})

    placements = []
    shortlisted = [a for a in applications if a["status"] == "Shortlisted"]
    rng.shuffle(shortlisted)
    for app in shortlisted:
        student, job = by_student[app["student_id"]], by_job[app["job_id"]]
        if student["placement_status"] == "Placed" or job["filled"] >= job["vacancies"] or rng.random() > 0.35:
            continue
        when = app["status_history"][-1]["at"] + timedelta(days=1)
        app["status"] = "Selected"
        app["status_history"].append({"status": "Selected", "at": when})
        job["filled"] += 1
        if job["filled"] == job["vacancies"]:
            job["status"] = "Closed"
        student["placement_status"], student["highest_tier"] = "Placed", job["tier"]
        placements.append({
            "placement_id": f"PLC{len(placements) + 1:05d}", "student_id": student["student_id"],
            "company_id": job["company_id"], "job_id": job["job_id"], "package_lpa": job["package_lpa"],
            "placement_date": when, "status": "Placed"})

    interviews, busy = [], {}
    for app in applications:
        if app["status"] not in ("Shortlisted", "Selected"):
            continue
        for _ in range(10):  # find a slot that does not clash with this student's other interviews
            offset = rng.randint(-10, -1) if app["status"] == "Selected" else rng.randint(1, 30)
            start = (NOW + timedelta(days=offset)).replace(hour=rng.randint(9, 16), minute=0, second=0)
            end = start + timedelta(minutes=45)
            slots = busy.setdefault(app["student_id"], [])
            if all(end <= s0 or start >= s1 for s0, s1 in slots):
                slots.append((start, end))
                interviews.append({
                    "interview_id": f"INT{len(interviews) + 1:05d}", "application_id": app["application_id"],
                    "student_id": app["student_id"], "round": rng.choice(["Technical", "HR", "Aptitude"]),
                    "scheduled_start": start, "scheduled_end": end, "mode": rng.choice(["Online", "Offline"]),
                    "result": "Passed" if app["status"] == "Selected" else "Scheduled"})
                break

    for name, docs in [("companies", companies), ("students", students), ("jobs", jobs),
                       ("applications", applications), ("interviews", interviews), ("placements", placements)]:
        insert_all(db, name, docs)
    print(f"bulk: {len(students)} students, {len(jobs)} jobs, {len(applications)} applications, "
          f"{len(interviews)} interviews, {len(placements)} placements")
```

**File: `queries/06_indexing_and_explain.js`**

```javascript
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
```

**Checkpoint:**

```
python setup_database.py --bulk
mongosh "mongodb://localhost:27017/?replicaSet=rs0" --file queries/06_indexing_and_explain.js
```

Expected: `setup_database.py` prints roughly `students 5000`, `applications` near 25000 (the generator stops at 25000 or when it runs out of eligible pairs), and `Consistency issues: none`. In I1 the forced scan examines about 5000 documents; the planner's choice examines a few hundred at most (at least 90% fewer). I2 shows `docs examined: 0`. I6 shows `code 11000`. Switch back to the small seed with `python setup_database.py --reset`.

Commit: `git add -A && git commit -m "phase 9: bulk data and explain"`.

---

## Phase 10 — Web app (5 hours)

Build order: configuration, helpers, routes, templates, style. Routes only call `operations/`.

**File: `operations/ui_config.py`**

```python
"""Describes the generic collection pages and converts form text into typed values."""
from datetime import datetime, timezone

from database.validation import DEPARTMENTS, TIERS

from .common import parse_date


def F(name, kind="str", type_="text", required=False, options=None, step=None, label=None):
    return {"name": name, "kind": kind, "type": type_, "required": required, "options": options,
            "step": step, "label": label or name.split(".")[-1].replace("_", " ").title()}


COLLECTIONS = {
    "students": {"pk": "student_id", "fields": [
        F("name", required=True), F("email", type_="email", required=True),
        F("department", type_="select", options=DEPARTMENTS, required=True),
        F("year", "int", "number", True), F("cgpa", "float", "number", True, step="0.01"),
        F("backlogs", "int", "number", True), F("skills", "list"), F("phone")]},
    "companies": {"pk": "company_id", "fields": [
        F("name", required=True), F("industry", required=True), F("location", required=True),
        F("website", type_="url"), F("contact_email", type_="email")]},
    "jobs": {"pk": "job_id", "fields": [
        F("company_id", required=True), F("title", required=True),
        F("tier", type_="select", options=TIERS, required=True),
        F("package_lpa", "float", "number", True, step="0.1", label="Package (LPA)"),
        F("location"), F("skills_required", "list"),
        F("eligibility.min_cgpa", "float", "number", True, step="0.1", label="Minimum CGPA"),
        F("eligibility.max_backlogs", "int", "number", True, label="Maximum backlogs"),
        F("eligibility.departments", "list", required=True, label="Departments (comma separated)"),
        F("vacancies", "int", "number", True), F("deadline", "date", "date", True)]},
    "applications": {"pk": "application_id", "fields": [
        F("student_id", required=True), F("job_id", required=True)]},
    "interviews": {"pk": "interview_id", "fields": [
        F("application_id", required=True), F("round", required=True),
        F("scheduled_start", "datetime", "datetime-local", True),
        F("scheduled_end", "datetime", "datetime-local", True),
        F("mode", type_="select", options=["Online", "Offline"], required=True), F("venue")]},
    "placements": {"pk": "placement_id", "fields": [
        F("student_id", required=True), F("job_id", required=True)]},
}


def coerce(raw, field):
    text = (raw or "").strip()
    if not text:
        if field["required"]:
            raise ValueError(f'{field["label"]} is required')
        return None
    kind = field["kind"]
    try:
        if kind == "int":
            return int(text)
        if kind == "float":
            return float(text)
        if kind == "list":
            return [part.strip() for part in text.split(",") if part.strip()]
        if kind == "date":
            return parse_date(text)
        if kind == "datetime":
            return datetime.strptime(text, "%Y-%m-%dT%H:%M").replace(tzinfo=timezone.utc)
    except ValueError:
        raise ValueError(f'{field["label"]}: expected {kind}') from None
    return text


def build_doc(cfg, form):
    """Form fields -> typed document. Dotted names (eligibility.min_cgpa) become nested objects."""
    doc = {}
    for field in cfg["fields"]:
        value = coerce(form.get(field["name"]), field)
        if value is None:
            continue
        *parents, leaf = field["name"].split(".")
        node = doc
        for parent in parents:
            node = node.setdefault(parent, {})
        node[leaf] = value
    return doc


def fmt(value):
    """Display formatting used by every table: dates DD Mon YYYY, arrays comma-separated, numbers fixed."""
    if value is None:
        return "—"
    if isinstance(value, datetime):
        pattern = "%d %b %Y" if (value.hour, value.minute) == (0, 0) else "%d %b %Y %H:%M"
        return value.strftime(pattern)
    if isinstance(value, float):
        return f"{value:.2f}"
    if isinstance(value, (list, tuple)):
        return ", ".join(fmt(v) for v in value)
    if isinstance(value, dict):
        return "; ".join(f"{k}: {fmt(v)}" for k, v in value.items())
    return str(value)
```

**File: `web_app.py`**

```python
import csv
import io
import os

from flask import Flask, Response, abort, flash, redirect, render_template, request, url_for

from database.connection import get_client, get_db, supports_transactions
from operations import applications, integrity, interviews, jobs, placements, reports, students
from operations.errors import friendly
from operations.ids import insert_with_id
from operations.ui_config import COLLECTIONS, build_doc, fmt

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-only-change-me")
app.jinja_env.filters["fmt"] = fmt

# Routes never insert directly: every add goes through the function that enforces the business rules.
HANDLERS = {
    "students": lambda db, d: students.add_student(db, d),
    "companies": lambda db, d: insert_with_id(db, "companies", d),
    "jobs": lambda db, d: jobs.add_job(db, d),
    "applications": lambda db, d: applications.apply_for_job(db, d["student_id"], d["job_id"]),
    "interviews": lambda db, d: interviews.schedule_interview(
        db, d["application_id"], d["round"], d["scheduled_start"], d["scheduled_end"], d["mode"], d.get("venue")),
    "placements": lambda db, d: placements.finalize_placement(db, d["student_id"], d["job_id"]),
}


@app.context_processor
def layout():
    try:
        get_client().admin.command("ping")
        live = True
    except Exception:
        live = False
    return {"nav": list(COLLECTIONS), "live": live}


def attempt(action, ok_message, back):
    try:
        flash(ok_message.format(result=action()), "success")
    except Exception as exc:  # every failure becomes a readable banner
        app.logger.info("action failed: %r", exc)
        flash(friendly(exc), "error")
    return redirect(back)


def safe_back(default):
    target = request.form.get("next", "")
    return target if target.startswith("/") and not target.startswith("//") else default


@app.get("/")
def overview():
    db = get_db()
    return render_template("dashboard.html", kpi=reports.placement_report(db), roles=reports.top_roles(db),
                           health=reports.pipeline_health(db), feed=reports.recent_activity(db))


@app.get("/reports")
def reports_page():
    db = get_db()
    return render_template("reports.html",
                           sections=[(rid, title, fn(db)) for rid, (title, fn) in reports.REPORTS.items()])


@app.get("/reports/<rid>.csv")
def report_csv(rid):
    if rid not in reports.REPORTS:
        abort(404)
    rows = reports.REPORTS[rid][1](get_db())
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=list(rows[0]) if rows else [])
    writer.writeheader()
    writer.writerows(rows)
    return Response(buffer.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": f"attachment; filename={rid}.csv"})


@app.get("/activity")
def activity():
    rows = list(get_db().activity_feed.find({}, {"_id": 0}).sort([("$natural", -1)]).limit(100))
    return render_template("generic.html", title="Activity feed (latest 100)", rows=rows)


@app.get("/student")
def student_lookup():
    return redirect(url_for("portal", student_id=request.args.get("id", "").strip().upper()))


@app.get("/student/<student_id>")
def portal(student_id):
    db = get_db()
    student = db.students.find_one({"student_id": student_id}, {"_id": 0}) or abort(404)
    return render_template(
        "student_portal.html", student=student, jobs=applications.eligible_jobs(db, student),
        apps=list(db.v_application_details.find({"student_id": student_id}, {"_id": 0})),
        interviews=list(db.interviews.find({"student_id": student_id}, {"_id": 0}).sort("scheduled_start", 1)))


@app.get("/jobs/<job_id>/candidates")
def candidates(job_id):
    db = get_db()
    job = db.jobs.find_one({"job_id": job_id}) or abort(404)
    return render_template("generic.html", title=f"Eligible candidates for {job_id}",
                           rows=applications.eligible_candidates(db, job))


@app.post("/applications/<application_id>/status")
def application_status(application_id):
    return attempt(lambda: applications.update_status(get_db(), application_id, request.form["status"],
                                                      request.form.get("note") or None),
                   f"{application_id} updated", safe_back(url_for("records", collection="applications")))


@app.get("/<collection>")
def records(collection):
    cfg = COLLECTIONS.get(collection) or abort(404)
    rows = list(get_db()[collection].find({}, {"_id": 0}).sort(cfg["pk"], 1).limit(300))
    columns = list(dict.fromkeys(key for row in rows for key in row))
    return render_template("records.html", name=collection, cfg=cfg, rows=rows, columns=columns)


@app.post("/<collection>/add")
def add(collection):
    cfg = COLLECTIONS.get(collection) or abort(404)
    return attempt(lambda: HANDLERS[collection](get_db(), build_doc(cfg, request.form)),
                   "Saved ({result})", safe_back(url_for("records", collection=collection)))


@app.post("/<collection>/<record_id>/delete")
def delete(collection, record_id):
    COLLECTIONS.get(collection) or abort(404)
    return attempt(lambda: integrity.safe_delete(get_db(), collection, record_id),
                   f"{record_id} deleted", url_for("records", collection=collection))


if __name__ == "__main__":
    if not supports_transactions():
        print("WARNING: MongoDB is not a replica set; placement finalization will fail.")
    app.run(host="127.0.0.1", port=5000, debug=True)
```

**File: `templates/base.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PlaceFlow</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{{ url_for('static', filename='styles.css') }}">
</head>
<body>
  <aside class="sidebar">
    <div class="brand">PlaceFlow</div>
    <nav>
      <a href="/">Overview</a>
      {% for c in nav %}<a href="/{{ c }}">{{ c|title }}</a>{% endfor %}
      <a href="/reports">Reports</a>
      <a href="/activity">Activity</a>
      <a href="/lab">Demo Lab</a>
    </nav>
    <div class="status">{% if live %}LIVE DATA · MongoDB connected{% else %}MongoDB unreachable{% endif %}</div>
  </aside>
  <main>
    {% for category, message in get_flashed_messages(with_categories=true) %}
      <div class="flash {{ category }}">{{ message }}</div>
    {% endfor %}
    {% block content %}{% endblock %}
  </main>
</body>
</html>
```

**File: `templates/_macros.html`**

```html
{% macro table(rows, cols=None) %}
  {% if rows %}
    {% set columns = cols or (rows[0].keys()|list) %}
    <div class="scroll"><table>
      <thead><tr>{% for c in columns %}<th>{{ c|replace('_', ' ')|title }}</th>{% endfor %}</tr></thead>
      <tbody>{% for r in rows %}<tr>{% for c in columns %}<td>{{ r.get(c)|fmt }}</td>{% endfor %}</tr>{% endfor %}</tbody>
    </table></div>
  {% else %}<p class="muted">No data.</p>{% endif %}
{% endmacro %}
```

**File: `templates/dashboard.html`**

```html
{% extends "base.html" %}
{% from "_macros.html" import table %}
{% block content %}
<section class="hero">
  <h1>Placement season at a glance</h1>
  <p>Every figure below is computed live from MongoDB.</p>
  <a class="btn" href="/jobs#new">Post a job</a>
  <form action="/student" method="get" class="inline"><input name="id" placeholder="Student ID, e.g. STU001"><button>Open portal</button></form>
</section>
<div class="cards">
  {% for label, value in kpi %}<div class="card"><span>{{ label }}</span><strong>{{ value|fmt }}</strong></div>{% endfor %}
</div>
<div class="two">
  <section><h2>Top paying open roles</h2>{{ table(roles, ['title', 'location', 'package_lpa', 'tier', 'status']) }}</section>
  <section><h2>Application pipeline health</h2>
    {% for h in health %}
      <div class="bar"><span>{{ h.status }} · {{ h.n }} ({{ h.pct }}%)</span><div><i style="width: {{ h.pct }}%"></i></div></div>
    {% else %}<p class="muted">No applications yet.</p>{% endfor %}
  </section>
</div>
<section><h2>Recent activity</h2>{{ table(feed, ['at', 'event_type', 'message']) }}</section>
{% endblock %}
```

**File: `templates/records.html`**

```html
{% extends "base.html" %}
{% block content %}
<h1>{{ name|title }}</h1>
<div class="scroll"><table>
  <thead><tr>{% for c in columns %}<th>{{ c|replace('_', ' ')|title }}</th>{% endfor %}<th></th></tr></thead>
  <tbody>
  {% for r in rows %}
    <tr>
      {% for c in columns %}
        <td>
        {% if name == 'students' and c == 'student_id' %}<a href="/student/{{ r[c] }}">{{ r[c] }}</a>
        {% elif name == 'jobs' and c == 'job_id' %}<a href="/jobs/{{ r[c] }}/candidates">{{ r[c] }}</a>
        {% else %}{{ r.get(c)|fmt }}{% endif %}
        </td>
      {% endfor %}
      <td><form method="post" action="/{{ name }}/{{ r[cfg.pk] }}/delete"><button class="link">Delete</button></form></td>
    </tr>
  {% else %}<tr><td colspan="99" class="muted">No records.</td></tr>{% endfor %}
  </tbody>
</table></div>

<section id="new">
  <h2>{% if name == 'applications' %}Apply for a job{% elif name == 'placements' %}Finalize a placement{% elif name == 'interviews' %}Schedule an interview{% else %}Add {{ name }}{% endif %}</h2>
  <form method="post" action="/{{ name }}/add" class="grid">
    {% for f in cfg.fields %}
      <label>{{ f.label }}
        {% if f.type == 'select' %}
          <select name="{{ f.name }}">{% for o in f.options %}<option>{{ o }}</option>{% endfor %}</select>
        {% else %}
          <input name="{{ f.name }}" type="{{ f.type }}" {% if f.required %}required{% endif %} {% if f.step %}step="{{ f.step }}"{% endif %}>
        {% endif %}
      </label>
    {% endfor %}
    <button>Save</button>
  </form>
</section>
{% endblock %}
```

**File: `templates/generic.html`**

```html
{% extends "base.html" %}
{% from "_macros.html" import table %}
{% block content %}<h1>{{ title }}</h1>{{ table(rows) }}{% endblock %}
```

**File: `templates/reports.html`**

```html
{% extends "base.html" %}
{% from "_macros.html" import table %}
{% block content %}
<h1>Reports</h1>
{% for rid, title, rows in sections %}
  <section><h2>{{ title }} <a class="muted small" href="/reports/{{ rid }}.csv">CSV</a></h2>{{ table(rows) }}</section>
{% endfor %}
{% endblock %}
```

**File: `templates/student_portal.html`**

```html
{% extends "base.html" %}
{% from "_macros.html" import table %}
{% block content %}
<h1>{{ student.name }} <span class="muted">{{ student.student_id }}</span></h1>
<p class="muted">{{ student.department }} · CGPA {{ student.cgpa|fmt }} · {{ student.backlogs }} backlog(s) · {{ student.placement_status }}{% if student.highest_tier %} ({{ student.highest_tier }}){% endif %}</p>
<section><h2>Eligible jobs</h2>
  {% if jobs %}
  <div class="scroll"><table>
    <thead><tr><th>Job</th><th>Title</th><th>Tier</th><th>Package (LPA)</th><th>Deadline</th><th></th></tr></thead>
    <tbody>{% for j in jobs %}
      <tr><td>{{ j.job_id }}</td><td>{{ j.title }}</td><td>{{ j.tier }}</td><td>{{ j.package_lpa|fmt }}</td><td>{{ j.deadline|fmt }}</td>
        <td><form method="post" action="/applications/add">
          <input type="hidden" name="student_id" value="{{ student.student_id }}">
          <input type="hidden" name="job_id" value="{{ j.job_id }}">
          <input type="hidden" name="next" value="/student/{{ student.student_id }}">
          <button>Apply</button></form></td></tr>
    {% endfor %}</tbody>
  </table></div>
  {% else %}<p class="muted">No open job matches this profile.</p>{% endif %}
</section>
<section><h2>My applications</h2>{{ table(apps, ['application_id', 'job_title', 'company_name', 'status', 'application_date']) }}</section>
<section><h2>Interviews</h2>{{ table(interviews, ['interview_id', 'round', 'scheduled_start', 'mode', 'result']) }}</section>
{% endblock %}
```

**File: `static/styles.css`**

```css
:root { --navy: #1e293b; --ink: #0f172a; --muted: #64748b; --line: #e2e8f0; --bg: #f8fafc; --ok: #166534; --err: #991b1b; }
* { box-sizing: border-box; }
body { margin: 0; display: flex; min-height: 100vh; font: 15px/1.5 "DM Sans", system-ui, sans-serif; color: var(--ink); background: var(--bg); }
h1, .brand { font-family: "Playfair Display", Georgia, serif; }
.sidebar { width: 230px; flex: none; background: var(--navy); color: #e2e8f0; padding: 24px 16px; display: flex; flex-direction: column; gap: 20px; position: sticky; top: 0; height: 100vh; }
.brand { font-size: 24px; color: #fff; }
nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
nav a { color: #cbd5e1; text-decoration: none; padding: 7px 10px; border-radius: 6px; }
nav a:hover { background: #334155; color: #fff; }
.status { font-size: 11px; letter-spacing: .06em; color: #94a3b8; }
main { flex: 1; min-width: 0; padding: 28px 36px; }
h1 { margin: 0 0 12px; } h2 { font-size: 17px; margin: 0 0 10px; }
section { margin-bottom: 28px; }
.hero { background: var(--navy); color: #fff; padding: 26px; border-radius: 10px; margin-bottom: 22px; }
.hero p { color: #cbd5e1; margin: 4px 0 14px; }
.btn, button { background: var(--navy); color: #fff; border: 0; padding: 8px 14px; border-radius: 6px; cursor: pointer; font: inherit; text-decoration: none; display: inline-block; }
.hero .btn { background: #fff; color: var(--navy); }
.inline { display: inline-flex; gap: 8px; margin-left: 12px; } .inline input { padding: 8px; border-radius: 6px; border: 0; }
button.link { background: none; color: var(--err); padding: 0; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; margin-bottom: 26px; }
.card { background: #fff; border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; }
.card span { display: block; color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .05em; }
.card strong { font-size: 24px; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.scroll { overflow-x: auto; background: #fff; border: 1px solid var(--line); border-radius: 8px; }
table { border-collapse: collapse; width: 100%; }
th, td { padding: 9px 12px; text-align: left; border-bottom: 1px solid var(--line); white-space: nowrap; }
th { background: #f1f5f9; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
.bar { margin-bottom: 10px; } .bar div { background: var(--line); border-radius: 4px; height: 8px; } .bar i { display: block; height: 8px; background: var(--navy); border-radius: 4px; }
.flash { padding: 10px 14px; border-radius: 6px; margin-bottom: 14px; }
.flash.success { background: #dcfce7; color: var(--ok); } .flash.error { background: #fee2e2; color: var(--err); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; align-items: end; }
label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--muted); }
input, select { padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font: inherit; }
.muted { color: var(--muted); } .small { font-size: 12px; font-weight: 400; }
pre { background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: 6px; overflow-x: auto; white-space: pre-wrap; }
@media (max-width: 800px) { body { flex-direction: column; } .sidebar { width: auto; height: auto; position: static; } .two { grid-template-columns: 1fr; } main { padding: 18px; } }
```

**Checkpoint:**

```
python setup_database.py --reset
python web_app.py
```

Open `http://127.0.0.1:5000` (on macOS, if port 5000 is taken by AirPlay, change the port in the last line to 5001). Check, in order:

1. The overview shows 9 cards and the pipeline bars. Quick status check: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/` prints `200` (PowerShell: `(Invoke-WebRequest http://127.0.0.1:5000/).StatusCode`).
2. Students page: add a student with CGPA 11. A red banner must say `Validation failed: cgpa: ...`.
3. Add another student with an existing email. The banner says the record already exists.
4. Open `/student/STU001`, apply for a job. Applying a second time shows `has already applied`.
5. Placements page: finalize `STU001` for `JOB002`, then try `STU004` for a full job and read the vacancy message.
6. `/reports` shows seven tables, and the CSV links download.

Commit: `git add -A && git commit -m "phase 10: web app"`.

---

## Phase 11 — CLI (2 hours)

The CLI calls the same `operations/` functions as the web app. It adds no new rules.

**File: `main.py`**

```python
import subprocess
import sys
from datetime import datetime, timezone

from database.connection import get_db
from operations import applications, integrity, interviews, jobs, placements, reports, students
from operations.common import strip_id
from operations.demo_registry import DEMOS
from operations.errors import friendly
from operations.ids import insert_with_id
from operations.ui_config import fmt

MENU = """
PLACEFLOW - CAMPUS PLACEMENT MANAGEMENT SYSTEM

 MASTER DATA                       WORKFLOW
  1. Add Student                   10. Apply for Job
  2. View Students                 11. View Applications
  3. Update Student                12. Update Application Status
  4. Delete Student                13. Schedule Interview
  5. Add Company                   14. Finalize Placement (transaction)
  6. View Companies                15. Eligible Jobs for a Student
  7. Add Job                       16. Eligible Candidates for a Job
  8. View Jobs
  9. View Placements

 REPORTS                           MONGODB DEMOS
  17. Placement Report             20. Run All Demos
  18. Branch-wise Statistics       21. Run One Demo (e.g. I1, T1, A9)
  19. At-risk Students             22. Export Reports to CSV

  0. Exit
"""


def ask(label, cast=str, required=True):
    while True:
        raw = input(f"{label}: ").strip()
        if not raw:
            if required:
                print("  a value is required")
                continue
            return None
        try:
            return cast(raw)
        except ValueError:
            print("  invalid value, try again")


def when(label):
    return ask(f"{label} (YYYY-MM-DD HH:MM)",
               lambda s: datetime.strptime(s, "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc))


def show(rows):
    rows = list(rows)
    if not rows:
        print("  (no records)")
    for row in rows:
        print("-" * 44)
        for key, value in strip_id(row).items():
            print(f"  {key:18} {fmt(value)}")
    print(f"\n{len(rows)} record(s)")


def view(collection, key):
    return lambda db: show(db[collection].find({}).sort(key, 1))


def add_student(db):
    data = {"name": ask("Name"), "email": ask("Email"), "department": ask("Department (CSE/ISE/ECE/EEE/ME/CE/IT)"),
            "year": ask("Year (1-4)", int), "cgpa": ask("CGPA", float), "backlogs": ask("Active backlogs", int)}
    skills = ask("Skills (comma separated, optional)", required=False)
    if skills:
        data["skills"] = [s.strip() for s in skills.split(",") if s.strip()]
    print("Created", students.add_student(db, data))


def update_student(db):
    student_id = ask("Student ID")
    field = ask("Field (name/phone/department/year/cgpa/backlogs)")
    value = ask("New value", float if field == "cgpa" else int if field in ("year", "backlogs") else str)
    students.update_student(db, student_id, {field: value})
    print("Updated")


def add_company(db):
    print("Created", insert_with_id(db, "companies", {
        "name": ask("Name"), "industry": ask("Industry"), "location": ask("Location")}))


def add_job(db):
    data = {"company_id": ask("Company ID"), "title": ask("Title"), "tier": ask("Tier (Normal/Dream/Super Dream)"),
            "package_lpa": ask("Package (LPA)", float), "vacancies": ask("Vacancies", int),
            "deadline": ask("Deadline (YYYY-MM-DD)", lambda s: datetime.strptime(s, "%Y-%m-%d").replace(tzinfo=timezone.utc)),
            "eligibility": {"min_cgpa": ask("Minimum CGPA", float), "max_backlogs": ask("Maximum backlogs", int),
                            "departments": [d.strip() for d in ask("Departments (comma separated)").split(",")]}}
    print("Created", jobs.add_job(db, data))


def set_status(db):
    app = applications.update_status(db, ask("Application ID"), ask("New status (Applied/Shortlisted/Rejected)"))
    print("Now", app["status"])


def schedule(db):
    print("Scheduled", interviews.schedule_interview(
        db, ask("Application ID"), ask("Round"), when("Start"), when("End"), ask("Mode (Online/Offline)"),
        ask("Venue (optional)", required=False)))


def show_report(db):
    for label, value in reports.placement_report(db):
        print(f"  {label:26} {fmt(value)}")


def run_demo(db, demo):
    result = demo["run"](db)
    print(f"\n[{demo['id']}] {demo['title']}" + (f"  ({result['ms']} ms)" if "ms" in result else ""))
    show(result["rows"][:5])


ACTIONS = {
    "1": add_student, "2": view("students", "student_id"), "3": update_student,
    "4": lambda db: print(integrity.safe_delete(db, "students", ask("Student ID")) or "Deleted"),
    "5": add_company, "6": view("companies", "company_id"), "7": add_job, "8": view("jobs", "job_id"),
    "9": view("placements", "placement_id"),
    "10": lambda db: print("Created", applications.apply_for_job(db, ask("Student ID"), ask("Job ID"))),
    "11": view("applications", "application_id"), "12": set_status, "13": schedule,
    "14": lambda db: print("Placement", placements.finalize_placement(db, ask("Student ID"), ask("Job ID"))),
    "15": lambda db: show(applications.eligible_jobs(db, students.get_student(db, ask("Student ID")))),
    "16": lambda db: show(applications.eligible_candidates(db, jobs.get_job(db, ask("Job ID")))),
    "17": show_report,
    "18": lambda db: show(reports.REPORTS["branch"][1](db)),
    "19": lambda db: show(reports.REPORTS["at_risk"][1](db)),
    "20": lambda db: [run_demo(db, d) for d in DEMOS.values()],
    "21": lambda db: run_demo(db, DEMOS[ask("Demo ID").upper()]),
    "22": lambda db: subprocess.run([sys.executable, "scripts/admin.py", "export"], check=False),
}


def main():
    db = get_db()
    while True:
        print(MENU)
        choice = input("Choose: ").strip()
        if choice == "0":
            break
        action = ACTIONS.get(choice)
        if not action:
            print("Invalid option")
            continue
        try:
            action(db)
        except KeyError:
            print("ERROR: unknown demo ID")
        except Exception as exc:
            print("ERROR:", friendly(exc))


if __name__ == "__main__":
    main()
```

**Checkpoint:** run `python main.py` and try, in order: option 1 with CGPA `11` (an error that names `cgpa`), option 10 twice for the same student and job (second says already applied), option 14 (placement), option 17 (report), option 21 with `I1`.

Commit: `git add -A && git commit -m "phase 11: cli"`.

---

## Phase 12 — Demo Lab page (2 hours, optional)

The registry already exists (Phase 7). Add two routes to `web_app.py`, above the `if __name__ == "__main__":` block, and one import.

Add to the imports in `web_app.py`:

```python
from operations.demo_registry import DEMOS
```

Add these routes:

```python
@app.get("/lab")
def lab():
    return render_template("lab.html", demos=list(DEMOS.values()), ran=None, result=None, error=None)


@app.post("/lab/run/<demo_id>")
def lab_run(demo_id):
    demo = DEMOS.get(demo_id) or abort(404)
    try:
        result, error = demo["run"](get_db()), None
    except Exception as exc:
        result, error = None, friendly(exc)
    return render_template("lab.html", demos=list(DEMOS.values()), ran=demo_id, result=result, error=error)
```

**File: `templates/lab.html`**

```html
{% extends "base.html" %}
{% from "_macros.html" import table %}
{% block content %}
<h1>MongoDB Demo Lab</h1>
<p class="muted">Every demo runs against the live database. Load the bulk dataset to see real index differences.</p>
{% for d in demos %}
<section>
  <h2>{{ d.id }} · {{ d.title }}</h2>
  <p>{{ d.scenario }}</p>
  <details><summary>mongosh</summary><pre>{{ d.mongosh }}</pre></details>
  <form method="post" action="/lab/run/{{ d.id }}"><button>Run</button></form>
  {% if ran == d.id %}
    {% if error %}<div class="flash error">{{ error }}</div>
    {% else %}
      <p class="muted">{% if result.ms is defined %}{{ result.ms }} ms · {% endif %}{% if result.total is defined %}{{ result.total }} row(s){% endif %}</p>
      {{ table(result.rows) }}
    {% endif %}
  {% endif %}
</section>
{% endfor %}
{% endblock %}
```

Safety rule: the Lab only runs registered demos and has no free-text query box. To add a demo, copy the `@demo(...)` pattern in `demo_registry.py`.

**Checkpoint:** open `/lab`, run `I1`, `T1` and `A9`. T1 must show three rows: inside the transaction `placement_rows 1`, outside `0`, after abort `0`.

Commit: `git add -A && git commit -m "phase 12: demo lab"`.

---

## Phase 13 — Tests (2 hours)

Tests run against a separate database, `college_placement_test`, and rebuild it before every test.

**File: `tests/conftest.py`**

```python
import os

os.environ["MONGODB_DB"] = "college_placement_test"  # hard assignment: never touch the real database

import pytest  # noqa: E402

from setup_database import build  # noqa: E402


@pytest.fixture()
def db():
    return build(reset=True)
```

**File: `tests/test_business_rules.py`**

```python
import threading
from datetime import timedelta

import pytest
from pymongo.errors import WriteError

from operations import applications, integrity, interviews, placements
from operations.common import utcnow
from operations.errors import PlaceFlowError, VacancyExhausted


def test_validator_rejects_bad_cgpa(db):
    with pytest.raises(WriteError) as exc:
        db.students.insert_one({
            "student_id": "STU999", "name": "Bad Cgpa", "email": "bad@univ.edu", "department": "CSE",
            "year": 4, "cgpa": 11, "backlogs": 0, "placement_status": "Unplaced", "created_at": utcnow()})
    assert exc.value.code == 121


def test_duplicate_application_is_blocked(db):
    applications.apply_for_job(db, "STU003", "JOB005")
    with pytest.raises(PlaceFlowError, match="already applied"):
        applications.apply_for_job(db, "STU003", "JOB005")
    assert db.applications.count_documents({"student_id": "STU003", "job_id": "JOB005"}) == 1


def test_ineligible_cgpa_names_the_reason(db):
    with pytest.raises(PlaceFlowError, match="CGPA"):
        applications.apply_for_job(db, "STU005", "JOB004")


def test_tier_policy(db):
    with pytest.raises(PlaceFlowError, match="higher tier"):
        applications.apply_for_job(db, "STU006", "JOB005")      # placed in Normal, job is Normal
    assert applications.apply_for_job(db, "STU006", "JOB002")   # Dream is an upgrade


def test_interview_clash(db):
    existing = db.interviews.find_one({"interview_id": "INT001"})
    with pytest.raises(PlaceFlowError, match="Clashes"):
        interviews.schedule_interview(db, "APP002", "HR", existing["scheduled_start"] + timedelta(minutes=15),
                                      existing["scheduled_end"] + timedelta(minutes=15), "Online")


def test_delete_student_with_applications_is_blocked(db):
    with pytest.raises(PlaceFlowError, match="refer to it"):
        integrity.safe_delete(db, "students", "STU001")


def test_finalize_changes_everything_together(db):
    placement_id = placements.finalize_placement(db, "STU001", "JOB002")
    assert db.placements.count_documents({"placement_id": placement_id}) == 1
    assert db.applications.find_one({"application_id": "APP002"})["status"] == "Selected"
    assert db.jobs.find_one({"job_id": "JOB002"})["filled"] == 1
    student = db.students.find_one({"student_id": "STU001"})
    assert (student["placement_status"], student["highest_tier"]) == ("Placed", "Dream")
    assert integrity.consistency_issues(db) == []


def test_full_job_rolls_back(db):
    db.jobs.update_one({"job_id": "JOB002"}, {"$set": {"vacancies": 1, "filled": 1}})
    with pytest.raises(VacancyExhausted):
        placements.finalize_placement(db, "STU001", "JOB002")
    assert db.placements.count_documents({"student_id": "STU001"}) == 0
    assert db.applications.find_one({"application_id": "APP002"})["status"] == "Shortlisted"


def test_concurrent_last_seat(db):
    db.jobs.update_one({"job_id": "JOB002"}, {"$set": {"vacancies": 1}})
    barrier, results = threading.Barrier(2), []

    def attempt(student_id):
        barrier.wait()
        try:
            results.append(("ok", placements.finalize_placement(db, student_id, "JOB002")))
        except Exception as exc:
            results.append(("err", exc))

    threads = [threading.Thread(target=attempt, args=(s,)) for s in ("STU001", "STU004")]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert sorted(kind for kind, _ in results) == ["err", "ok"]
    assert any(isinstance(v, VacancyExhausted) for kind, v in results if kind == "err")
    assert db.placements.count_documents({"job_id": "JOB002"}) == 1
    assert db.jobs.find_one({"job_id": "JOB002"})["filled"] == 1


def test_audit_finds_orphans_because_mongodb_has_no_foreign_keys(db):
    db.applications.insert_one({
        "application_id": "APP777", "student_id": "STU777", "job_id": "JOB001", "application_date": utcnow(),
        "status": "Applied", "status_history": [{"status": "Applied", "at": utcnow()}]})
    assert any("STU777" in issue for issue in integrity.consistency_issues(db))
```

**File: `tests/mongosh_smoke_test.js`**

```javascript
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
```

**Checkpoint:**

```
pytest -v
python setup_database.py --reset
mongosh "mongodb://localhost:27017/?replicaSet=rs0" --file tests/mongosh_smoke_test.js
```

Expected: all pytest tests pass and the smoke test ends with `ALL PASSED`. If `test_concurrent_last_seat` is the only failure, read the error: it almost always means MongoDB is not a replica set.

Commit: `git add -A && git commit -m "phase 13: tests"`.

---

## Phase 14 — Admin scripts, README, rehearsal (2 hours)

One cross-platform Python script replaces three shell scripts (they would not run on plain Windows).

**File: `scripts/admin.py`**

```python
"""python scripts/admin.py backup | restore <backup-folder> | export"""
import os
import pathlib
import subprocess
import sys
from datetime import datetime

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()
URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/?replicaSet=rs0")
DB = os.getenv("MONGODB_DB", "college_placement_db")


def run(cmd):
    print(">", " ".join(cmd))
    subprocess.run(cmd, check=True)


def backup():
    out = pathlib.Path("backups") / datetime.now().strftime("%Y%m%d_%H%M%S")
    run(["mongodump", "--uri", URI, "--db", DB, "--out", str(out)])
    print("Backup written to", out)


def restore(folder):
    """Restore into <db>_restore and compare document counts with the original."""
    run(["mongorestore", "--uri", URI, "--nsInclude", f"{DB}.*", "--nsFrom", f"{DB}.*",
         "--nsTo", f"{DB}_restore.*", folder])
    client = MongoClient(URI)
    for name in sorted(client[DB].list_collection_names()):
        original = client[DB][name].count_documents({})
        restored = client[DB + "_restore"][name].count_documents({})
        print(f"{name:26} original={original:6} restored={restored:6} {'OK' if original == restored else 'MISMATCH'}")


def export():
    pathlib.Path("exports").mkdir(exist_ok=True)
    targets = {
        "branch_placement_stats": "_id,students,placed,placement_pct,avg_package,max_package,median_package",
        "placements": "placement_id,student_id,company_id,job_id,package_lpa,placement_date",
    }
    for collection, fields in targets.items():
        run(["mongoexport", "--uri", URI, "--db", DB, "--collection", collection, "--type=csv",
             f"--fields={fields}", "--out", f"exports/{collection}.csv"])


if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else ""
    if command == "backup":
        backup()
    elif command == "restore" and len(sys.argv) > 2:
        restore(sys.argv[2])
    elif command == "export":
        export()
    else:
        print(__doc__)
```

Run `branch_placement_stats` first: execute `queries/05_aggregation_pipelines.js` once, because the export reads that materialized collection.

**Checkpoint:**

```
python scripts/admin.py backup
python scripts/admin.py restore backups/<the folder just created>
python scripts/admin.py export
```

Expected: every collection prints `OK` in the restore comparison, and `exports/*.csv` exist.

Write `README.md` in your own words. It must contain these sections, in this order:

1. What PlaceFlow solves (the problem table from SRS 1.2, shortened).
2. Requirements and how to start MongoDB as a replica set (Phase 0).
3. Setup in five commands: venv, `pip install -r requirements.txt`, copy `.env`, `python setup_database.py --reset`, `python web_app.py`.
4. Project layout and the five rules from section 0.3.
5. The demonstration runbook (SRS section 11), with the exact commands per minute.
6. How to run tests.

### Rehearsal (30 minutes, do it twice)

Run the SRS Demonstration Runbook end to end with a stopwatch. Before each run: `python setup_database.py --reset`, `python scripts/generate_mongosh.py`. Before the index minute: `python setup_database.py --bulk`. Practise the transitions: what you say to move from validation to CRUD to transactions.

Commit and tag: `git add -A && git commit -m "phase 14: admin, readme" && git tag v1.0`.

---

## Final layout (what the repository should look like)

```
.env.example  .gitignore  pytest.ini  requirements.txt  README.md
setup_database.py  main.py  web_app.py
database/    __init__.py  connection.py  validation.py  sample_data.py  bulk_seed.py
operations/  __init__.py  common.py  errors.py  ids.py  integrity.py  students.py  jobs.py
             applications.py  interviews.py  placements.py  pipelines.py  reports.py
             demo_registry.py  ui_config.py
queries/     01_setup_database.js (generated)  02_seed_data.js (generated)  03_crud_operations.js
             04_validation_demo.js  05_aggregation_pipelines.js (generated)  06_indexing_and_explain.js
             07_transactions.js  08_views_and_reports.js  09_change_stream_demo.js
scripts/     generate_mongosh.py  admin.py
static/       styles.css
templates/   base.html  _macros.html  dashboard.html  records.html  generic.html
             reports.html  student_portal.html  lab.html
tests/       conftest.py  test_business_rules.py  mongosh_smoke_test.js
```

---

## Problems you will probably hit

| Symptom | Cause | Fix |
|---|---|---|
| `Transaction numbers are only allowed on a replica set member or mongos` | MongoDB is running standalone | Phase 0.2; URI must contain `?replicaSet=rs0` |
| Driver hangs, then `ServerSelectionTimeoutError` naming a strange hostname | `rs.initiate()` was run without `host:'localhost:27017'` | Re-initiate with the explicit host (Phase 0.2) |
| `can't compare offset-naive and offset-aware datetimes` | A naive `datetime.now()` somewhere | Always use `utcnow()`; client has `tz_aware=True` |
| `Document failed validation` for a value that looks right | Wrong type, e.g. a string `"8"` for CGPA | `build_doc` coerces types; in mongosh use numbers, not strings |
| `Index already exists with different options` | Index definition changed after creation | `python setup_database.py --reset` (or drop that index) |
| `E11000 duplicate key` while re-seeding | Mixed curated and bulk data | Use `--reset`; `--bulk` already resets |
| `Unrecognized expression '$median'` | MongoDB older than 7.0 | Upgrade, or change `mongo:7` Docker tag |
| Update rejected on an old document after changing a validator | `validationLevel: strict` validates updated old documents too | Fix the document, or `collMod` to `moderate` temporarily |
| `$text` query fails | No text index, or two text indexes | Only one text index per collection is allowed (`ix_job_text`) |
| `mongosh --file` prints nothing for a query | Expression results are not echoed in script mode | Wrap in `print` / `printjson(...toArray())` |
| `use college_placement_db` does nothing in a script | `use` only works interactively | `db = db.getSiblingDB("...")` |
| PowerShell breaks `--eval` strings | Quote nesting | Double quotes outside, single quotes inside |
| Write to `activity_feed` fails inside a transaction | Capped collections cannot be written in transactions | Log events after commit, as `finalize_placement` does |
| `.venv\Scripts\Activate.ps1` is blocked | PowerShell execution policy | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |

---

## Viva questions you should be able to answer in two sentences

1. **Why MongoDB for this?** Applications carry an embedded status history, jobs carry nested eligibility rules, and students carry skill arrays; documents hold these naturally. Where the data is relational (students, jobs, applications), I use references plus validators, unique indexes and transactions to get the same guarantees.
2. **Embed or reference?** I embed what is owned by one parent, always read with it, and bounded (skills, eligibility, history). I reference what has its own lifecycle and is queried independently (students, companies, jobs).
3. **There are no foreign keys. How is integrity kept?** Existence checks on writes, guarded deletes in `integrity.safe_delete`, and an audit pipeline (`consistency_issues`) that finds orphans with `$lookup`.
4. **How do you prevent duplicate applications?** A unique compound index on `(student_id, job_id)`. A check-then-insert in code could race; the index cannot.
5. **What if two officers finalize the last seat together?** The seat is claimed with a filtered update inside a transaction; only one matches, the other aborts with `VacancyExhausted`. The concurrency test proves it.
6. **Why does that need a replica set?** Transactions use the oplog and snapshot reads, which only exist on replica sets.
7. **Why this index and not another?** Show `explain`: the forced scan reads every document, the indexed plan reads a few hundred. The compound index puts the equality field (department) before the range field (cgpa).
8. **What is the partial index for?** It indexes only unplaced students, so it stays small as the season progresses; queries must include `placement_status: "Unplaced"` to use it.
9. **Why a capped collection for the feed?** Fixed size, insertion order and automatic eviction: a perfect "latest 500 events" store. It is written after commit because MongoDB does not allow capped writes inside transactions.
10. **Validation level and action?** `strict` validates all inserts and updates; `error` rejects, while `warn` would only log. I demonstrate both with `collMod`.
11. **Why `$facet` and `$merge`?** `$facet` computes several aggregates in one scan of a collection; `$merge` writes a report into a collection so it can be exported without recomputing.
12. **What changes at ten times the scale?** The indexes already match the query shapes; I would archive closed seasons, cache the dashboard KPIs, and consider sharding `applications` by `student_id` if it ever outgrows one replica set.

---

## Changes compared with `PlaceFlow_SRS_v2.md`

| SRS v2 said | This guide does | Why |
|---|---|---|
| `rs.initiate()` | `rs.initiate({... host:'localhost:27017'})` | Plain initiate registers the machine hostname, which often cannot be resolved |
| Integer fields as `int` | `number` with `multipleOf: 1` | A number's stored type (int32, int64, double) depends on the client and value, so `int` can reject valid input; this accepts all numeric types and still rejects 3.5 |
| Partial index on `(department, cgpa)` | Partial index on `{cgpa: -1}` | MongoDB 7.0 rejects two indexes with the same key pattern |
| A1 `$facet` for all dashboard KPIs | Two facets (applications, placements) plus counts | `$facet` works on one collection per pipeline |
| Feed event written inside the transaction | Written after commit | Capped collections cannot be written inside transactions |
| 7 collections | Adds a `counters` collection | Auto-generated IDs (the `AUTO_INCREMENT` equivalent) |
| Three `.sh` admin scripts | One `scripts/admin.py` | Works on Windows, Linux and macOS |
| `05_aggregation_pipelines.js` hand-written | Generated from `pipelines.py` | One definition for app and shell demos |
| About 20 curated students | 8 curated students plus a 5,000-student bulk generator | Small data for walkthroughs, large data for index evidence |

---

## Definition of done

- [ ] `python setup_database.py --reset` runs clean and prints `Consistency issues: none`
- [ ] `04_validation_demo.js`: every attempt is `REJECTED`
- [ ] `pytest -v` all green, including the concurrency test
- [ ] `tests/mongosh_smoke_test.js` ends with `ALL PASSED`
- [ ] `06_indexing_and_explain.js` on the bulk data shows COLLSCAN vs IXSCAN with at least 90% fewer documents examined
- [ ] The web app, CLI and Demo Lab all work from a freshly reset database
- [ ] The 10-minute runbook is rehearsed twice with a stopwatch
- [ ] `git tag v1.0` is on a commit where all of the above are true

