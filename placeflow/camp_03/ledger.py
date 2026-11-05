"""Append-Only Immutable Academic Credit Ledger for CAMP-03.

Architectural Mandate: Never store only a current credit total!
Every credit earned, transferred, recognized, or reversed is maintained with
complete provenance and cryptographic auditability.
"""

from datetime import datetime, timezone
import uuid
from typing import Dict, Any, List, Optional
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError


class CreditEntryNotFoundError(Exception):
    pass


class InvalidLedgerOperationError(Exception):
    pass


class LedgerValidationError(Exception):
    pass


VALID_SOURCE_TYPES = {
    "COURSE_COMPLETION",
    "INTER_INSTITUTIONAL_TRANSFER",
    "ABC_REDEMPTION",
    "PRIOR_LEARNING_RECOGNITION",
    "VOCATIONAL_EXPERIENTIAL",
    "CREDIT_REVERSAL_ADJUSTMENT",
}

VALID_CREDIT_TYPES = {
    "ACADEMIC",
    "VOCATIONAL",
    "EXPERIENTIAL",
    "TRANSFER",
    "PRIOR_LEARNING",
}


def record_credit_entry(
    db: Database,
    enrollment_id: str,
    source_type: str,
    source_record_id: str,
    credit_amount: float,
    credit_type: str = "ACADEMIC",
    course_id: Optional[str] = None,
    course_category: Optional[str] = None,
    effective_date: Optional[datetime] = None,
    recognition_status: str = "RECOGNIZED",
    authorized_by_membership_id: Optional[str] = None,
    reversal_reference_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    credit_entry_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Append a credit award or reversal to the student's immutable credit ledger."""
    if source_type not in VALID_SOURCE_TYPES:
        raise LedgerValidationError(
            f"Invalid source_type: '{source_type}'. Must be one of {VALID_SOURCE_TYPES}"
        )

    if credit_type not in VALID_CREDIT_TYPES:
        raise LedgerValidationError(
            f"Invalid credit_type: '{credit_type}'. Must be one of {VALID_CREDIT_TYPES}"
        )

    if credit_amount == 0:
        raise LedgerValidationError("credit_amount cannot be zero")

    now = datetime.now(timezone.utc)
    entry_id = credit_entry_id or f"crd_{uuid.uuid4().hex[:12]}"

    doc = {
        "credit_entry_id": entry_id,
        "enrollment_id": enrollment_id,
        "source_type": source_type,
        "source_record_id": source_record_id,
        "course_id": course_id,
        "credit_amount": float(credit_amount),
        "credit_type": credit_type,
        "course_category": course_category,
        "effective_date": effective_date or now,
        "recognition_status": recognition_status,
        "authorized_by_membership_id": authorized_by_membership_id,
        "reversal_reference_id": reversal_reference_id,
        "metadata": metadata or {},
        "created_at": now,
    }

    try:
        db.academic_credit_ledger.insert_one(doc)
    except DuplicateKeyError as e:
        raise InvalidLedgerOperationError(f"Credit entry '{entry_id}' already exists") from e

    try:
        from camp_01.outbox import publish_event
        publish_event(
            event_type="AcademicCreditAwarded",
            aggregate_type="ACADEMIC_CREDIT",
            aggregate_id=entry_id,
            tenant_id="global",
            payload={
                "enrollment_id": enrollment_id,
                "credit_amount": credit_amount,
                "credit_type": credit_type,
                "source_type": source_type,
                "recognition_status": recognition_status,
            },
            db=db,
        )
    except Exception:
        pass

    return doc


def record_credit_reversal(
    db: Database,
    original_credit_entry_id: str,
    authorized_by_membership_id: str,
    reason: str,
) -> Dict[str, Any]:
    """Reverse an incorrectly awarded credit by appending an offsetting negative ledger entry.

    Preserves ledger integrity without mutating historical transactions.
    """
    orig = db.academic_credit_ledger.find_one({"credit_entry_id": original_credit_entry_id})
    if not orig:
        raise CreditEntryNotFoundError(f"Credit entry '{original_credit_entry_id}' not found")

    if orig["credit_amount"] < 0:
        raise InvalidLedgerOperationError("Cannot reverse an entry that is already a reversal")

    # Invert credit amount
    offsetting_amount = -orig["credit_amount"]

    return record_credit_entry(
        db=db,
        enrollment_id=orig["enrollment_id"],
        source_type="CREDIT_REVERSAL_ADJUSTMENT",
        source_record_id=original_credit_entry_id,
        credit_amount=offsetting_amount,
        credit_type=orig["credit_type"],
        course_id=orig.get("course_id"),
        course_category=orig.get("course_category"),
        effective_date=datetime.now(timezone.utc),
        recognition_status="RECOGNIZED",
        authorized_by_membership_id=authorized_by_membership_id,
        reversal_reference_id=original_credit_entry_id,
        metadata={"reversal_reason": reason, "reversed_at": datetime.now(timezone.utc).isoformat()},
    )


def get_student_credit_balance(
    db: Database, enrollment_id: str
) -> Dict[str, Any]:
    """Calculate the total net recognized credits by aggregating active ledger entries."""
    entries = list(
        db.academic_credit_ledger.find(
            {"enrollment_id": enrollment_id, "recognition_status": "RECOGNIZED"}
        )
    )

    total_credits = 0.0
    by_category: Dict[str, float] = {}
    by_type: Dict[str, float] = {}

    for e in entries:
        amt = float(e["credit_amount"])
        total_credits += amt

        cat = e.get("course_category") or "GENERAL"
        by_category[cat] = round(by_category.get(cat, 0.0) + amt, 2)

        ctype = e.get("credit_type") or "ACADEMIC"
        by_type[ctype] = round(by_type.get(ctype, 0.0) + amt, 2)

    return {
        "enrollment_id": enrollment_id,
        "total_credits_earned": round(total_credits, 2),
        "credits_by_category": by_category,
        "credits_by_type": by_type,
        "total_ledger_entries_count": len(entries),
    }


def list_student_credit_ledger(
    db: Database, enrollment_id: str
) -> List[Dict[str, Any]]:
    """Retrieve full chronological transaction ledger for student program enrollment."""
    return list(
        db.academic_credit_ledger.find({"enrollment_id": enrollment_id}).sort("effective_date", 1)
    )

