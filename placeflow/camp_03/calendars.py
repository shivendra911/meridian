"""Academic Calendar, Terms & Registration Windows Service for CAMP-03.

Supports concurrent multi-model academic calendars (Semesters, Trimesters, Annual),
term lifecycles, and time-bound registration windows.
"""

from datetime import datetime, timezone
import uuid
from typing import Dict, Any, List, Optional
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError


class CalendarNotFoundError(Exception):
    pass


class TermNotFoundError(Exception):
    pass


class DuplicateCalendarError(Exception):
    pass


class InvalidTermStateTransitionError(Exception):
    pass


class CalendarValidationError(Exception):
    pass


TERM_STATUS_TRANSITIONS = {
    "DRAFT": {"SCHEDULED", "ARCHIVED"},
    "SCHEDULED": {"REGISTRATION_OPEN", "ARCHIVED"},
    "REGISTRATION_OPEN": {"REGISTRATION_CLOSED", "IN_PROGRESS"},
    "REGISTRATION_CLOSED": {"IN_PROGRESS", "REGISTRATION_OPEN"},
    "IN_PROGRESS": {"RESULT_PROCESSING", "CLOSED"},
    "RESULT_PROCESSING": {"RESULTS_PUBLISHED", "IN_PROGRESS"},
    "RESULTS_PUBLISHED": {"CLOSED"},
    "CLOSED": {"ARCHIVED"},
    "ARCHIVED": set(),
}


def create_academic_calendar(
    db: Database,
    tenant_id: str,
    institution_id: str,
    calendar_name: str,
    calendar_type: str = "SEMESTER",
    status: str = "ACTIVE",
    metadata: Optional[Dict[str, Any]] = None,
    calendar_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Create an institutional calendar definition (Semester, Trimester, Annual)."""
    valid_types = {"SEMESTER", "TRIMESTER", "ANNUAL", "MODULAR"}
    if calendar_type not in valid_types:
        raise CalendarValidationError(
            f"Invalid calendar_type: {calendar_type}. Must be one of {valid_types}"
        )

    now = datetime.now(timezone.utc)
    c_id = calendar_id or f"cal_{uuid.uuid4().hex[:12]}"

    doc = {
        "calendar_id": c_id,
        "tenant_id": tenant_id,
        "institution_id": institution_id,
        "calendar_name": calendar_name.strip(),
        "calendar_type": calendar_type,
        "status": status,
        "metadata": metadata or {},
        "created_at": now,
        "updated_at": now,
    }

    try:
        db.academic_calendars.insert_one(doc)
    except DuplicateKeyError as e:
        raise DuplicateCalendarError(
            f"Calendar '{calendar_name}' already exists for institution '{institution_id}'"
        ) from e

    return doc


def get_academic_calendar(db: Database, calendar_id: str) -> Dict[str, Any]:
    """Retrieve calendar by ID."""
    doc = db.academic_calendars.find_one({"calendar_id": calendar_id})
    if not doc:
        raise CalendarNotFoundError(f"Academic calendar '{calendar_id}' not found")
    return doc


def create_academic_year(
    db: Database,
    tenant_id: str,
    institution_id: str,
    year_code: str,
    start_date: datetime,
    end_date: datetime,
    status: str = "CURRENT",
    academic_year_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Create an institutional academic year (e.g. 2026-2027)."""
    if end_date <= start_date:
        raise CalendarValidationError("end_date must be after start_date")

    now = datetime.now(timezone.utc)
    ay_id = academic_year_id or f"ay_{uuid.uuid4().hex[:12]}"

    doc = {
        "academic_year_id": ay_id,
        "tenant_id": tenant_id,
        "institution_id": institution_id,
        "year_code": year_code.strip(),
        "start_date": start_date,
        "end_date": end_date,
        "status": status,
        "created_at": now,
    }

    try:
        db.academic_years.insert_one(doc)
    except DuplicateKeyError as e:
        raise DuplicateCalendarError(
            f"Academic year '{year_code}' already exists for institution '{institution_id}'"
        ) from e

    return doc


def get_academic_year(db: Database, academic_year_id: str) -> Dict[str, Any]:
    """Retrieve academic year by ID."""
    doc = db.academic_years.find_one({"academic_year_id": academic_year_id})
    if not doc:
        raise CalendarNotFoundError(f"Academic year '{academic_year_id}' not found")
    return doc


def create_academic_term(
    db: Database,
    calendar_id: str,
    academic_year_id: str,
    term_code: str,
    term_name: str,
    sequence_number: int,
    term_type: str = "SEMESTER",
    instruction_start_date: Optional[datetime] = None,
    instruction_end_date: Optional[datetime] = None,
    metadata: Optional[Dict[str, Any]] = None,
    term_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Create an academic period/term (Semester 1..8, Trimester 1..6, Summer Session)."""
    cal = get_academic_calendar(db, calendar_id)
    get_academic_year(db, academic_year_id)

    valid_types = {
        "SEMESTER",
        "TRIMESTER",
        "ANNUAL_PERIOD",
        "SUMMER_SESSION",
        "WINTER_SESSION",
    }
    if term_type not in valid_types:
        raise CalendarValidationError(f"Invalid term_type: {term_type}")

    now = datetime.now(timezone.utc)
    start = instruction_start_date or now
    end = instruction_end_date or now

    t_id = term_id or f"term_{uuid.uuid4().hex[:12]}"

    doc = {
        "term_id": t_id,
        "calendar_id": calendar_id,
        "academic_year_id": academic_year_id,
        "tenant_id": cal["tenant_id"],
        "institution_id": cal["institution_id"],
        "term_code": term_code.strip(),
        "term_name": term_name.strip(),
        "sequence_number": int(sequence_number),
        "term_type": term_type,
        "instruction_start_date": start,
        "instruction_end_date": end,
        "term_status": "DRAFT",
        "metadata": metadata or {},
        "created_at": now,
        "updated_at": now,
    }

    try:
        db.academic_terms.insert_one(doc)
    except DuplicateKeyError as e:
        raise DuplicateCalendarError(
            f"Term code '{term_code}' already exists in calendar '{calendar_id}'"
        ) from e

    return doc


def get_academic_term(db: Database, term_id: str) -> Dict[str, Any]:
    """Retrieve term by ID."""
    doc = db.academic_terms.find_one({"term_id": term_id})
    if not doc:
        raise TermNotFoundError(f"Academic term '{term_id}' not found")
    return doc


def transition_term_status(db: Database, term_id: str, new_status: str) -> Dict[str, Any]:
    """Execute validated state machine transition on an academic term."""
    term = get_academic_term(db, term_id)
    current_status = term["term_status"]

    if current_status == new_status:
        return term

    allowed = TERM_STATUS_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise InvalidTermStateTransitionError(
            f"Cannot transition term from '{current_status}' to '{new_status}'. Allowed: {allowed}"
        )

    now = datetime.now(timezone.utc)
    res = db.academic_terms.find_one_and_update(
        {"term_id": term_id},
        {"$set": {"term_status": new_status, "updated_at": now}},
        return_document=True,
    )
    return res


def create_registration_window(
    db: Database,
    term_id: str,
    window_type: str = "REGULAR_REGISTRATION",
    open_timestamp: Optional[datetime] = None,
    close_timestamp: Optional[datetime] = None,
    is_active: bool = True,
    window_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Open a scheduled registration period for a term."""
    term = get_academic_term(db, term_id)

    valid_types = {
        "REGULAR_REGISTRATION",
        "LATE_REGISTRATION",
        "ADD_DROP_WINDOW",
        "COURSE_WITHDRAWAL",
    }
    if window_type not in valid_types:
        raise CalendarValidationError(f"Invalid window_type: {window_type}")

    now = datetime.now(timezone.utc)
    o_time = open_timestamp or now
    c_time = close_timestamp or now

    if c_time <= o_time:
        raise CalendarValidationError("close_timestamp must be after open_timestamp")

    w_id = window_id or f"regwin_{uuid.uuid4().hex[:12]}"

    doc = {
        "window_id": w_id,
        "term_id": term_id,
        "tenant_id": term["tenant_id"],
        "institution_id": term["institution_id"],
        "window_type": window_type,
        "open_timestamp": o_time,
        "close_timestamp": c_time,
        "is_active": bool(is_active),
        "created_at": now,
    }

    db.registration_windows.insert_one(doc)
    return doc


def is_registration_window_open(
    db: Database,
    term_id: str,
    window_type: str = "REGULAR_REGISTRATION",
    current_time: Optional[datetime] = None,
) -> bool:
    """Check if course registration is currently active and within time bounds."""
    now = current_time or datetime.now(timezone.utc)
    win = db.registration_windows.find_one(
        {
            "term_id": term_id,
            "window_type": window_type,
            "is_active": True,
            "open_timestamp": {"$lte": now},
            "close_timestamp": {"$gte": now},
        }
    )
    return win is not None

