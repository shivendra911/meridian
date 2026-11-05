"""Platform Institutional Directory Service & Registry for CAMP-01.
Maintains verified public institutional references (AISHE registry, public universities)
strictly isolated from private customer tenant workspaces (ADR-C01-003).
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from database.connection import get_db

INITIAL_DIRECTORY_ENTRIES = [
    {
        "directory_id": "AISHE-U-0053",
        "aishe_code": "U-0053",
        "legal_name": "Indian Institute of Technology Bombay",
        "display_name": "IIT Bombay",
        "institution_type": "INSTITUTE_OF_NATIONAL_IMPORTANCE",
        "state": "Maharashtra",
        "district": "Mumbai Suburban",
        "website_url": "https://www.iitb.ac.in",
        "is_verified": True,
    },
    {
        "directory_id": "AISHE-U-0120",
        "aishe_code": "U-0120",
        "legal_name": "University of Delhi",
        "display_name": "Delhi University",
        "institution_type": "CENTRAL_UNIVERSITY",
        "state": "Delhi",
        "district": "North Delhi",
        "website_url": "https://www.du.ac.in",
        "is_verified": True,
    },
    {
        "directory_id": "AISHE-U-0306",
        "aishe_code": "U-0306",
        "legal_name": "University of Mumbai",
        "display_name": "Mumbai University",
        "institution_type": "STATE_UNIVERSITY",
        "state": "Maharashtra",
        "district": "Mumbai",
        "website_url": "https://mu.ac.in",
        "is_verified": True,
    },
    {
        "directory_id": "AISHE-U-0217",
        "aishe_code": "U-0217",
        "legal_name": "Visvesvaraya Technological University",
        "display_name": "VTU Belagavi",
        "institution_type": "STATE_UNIVERSITY",
        "state": "Karnataka",
        "district": "Belagavi",
        "website_url": "https://vtu.ac.in",
        "is_verified": True,
    },
    {
        "directory_id": "AISHE-U-0440",
        "aishe_code": "U-0440",
        "legal_name": "Anna University",
        "display_name": "Anna University Chennai",
        "institution_type": "STATE_UNIVERSITY",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "website_url": "https://www.annauniv.edu",
        "is_verified": True,
    },
]


def seed_public_directory(db=None) -> int:
    """Seeds verified initial Indian university and institutional directory entries."""
    if db is None:
        db = get_db()
    count = 0
    now = datetime.now(timezone.utc)

    for entry in INITIAL_DIRECTORY_ENTRIES:
        doc = dict(entry)
        doc["created_at"] = now
        res = db.platform_directory_entries.update_one(
            {"directory_id": entry["directory_id"]},
            {"$setOnInsert": doc},
            upsert=True,
        )
        if res.upserted_id:
            count += 1
    return count


def get_directory_entry_by_id(directory_id: str, db=None) -> Optional[Dict[str, Any]]:
    """Retrieves a public directory entry by its ID."""
    if db is None:
        db = get_db()
    return db.platform_directory_entries.find_one({"directory_id": directory_id}, {"_id": 0})


def get_directory_entry_by_aishe(aishe_code: str, db=None) -> Optional[Dict[str, Any]]:
    """Retrieves a directory entry by its exact AISHE code."""
    if db is None:
        db = get_db()
    code = aishe_code.strip().upper()
    return db.platform_directory_entries.find_one({"aishe_code": code}, {"_id": 0})


def search_public_directory(
    query: Optional[str] = None,
    state: Optional[str] = None,
    institution_type: Optional[str] = None,
    limit: int = 20,
    db=None,
) -> List[Dict[str, Any]]:
    """Searches the verified public directory by text query, state, or institution type."""
    if db is None:
        db = get_db()

    filter_dict = {}
    if state:
        filter_dict["state"] = state
    if institution_type:
        filter_dict["institution_type"] = institution_type

    if query:
        q = query.strip()
        # Regex or text search across legal and display names
        filter_dict["$or"] = [
            {"legal_name": {"$regex": q, "$options": "i"}},
            {"display_name": {"$regex": q, "$options": "i"}},
            {"aishe_code": {"$regex": q, "$options": "i"}},
        ]

    return list(db.platform_directory_entries.find(filter_dict, {"_id": 0}).limit(limit))

