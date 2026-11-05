"""Student Mobility & Academic Bank of Credits (ABC) Adapter for CAMP-03.

Manages APAAR/ABC ID linkages, inter-institutional credit transfers,
and statutory credit recognition under the National Credit Framework (NCrF).
"""

from datetime import datetime, timezone
import re
import uuid
from typing import Dict, Any, Optional
from pymongo.database import Database

from camp_03.students import get_student_record, add_student_identifier
from camp_03.ledger import record_credit_entry


class MobilityValidationError(Exception):
    pass


class ABCNotFoundError(Exception):
    pass


APAAR_REGEX = re.compile(r"^[0-9]{12}$")


def link_student_abc_account(
    db: Database,
    student_id: str,
    apaar_id: str,
    abc_account_id: str,
) -> Dict[str, Any]:
    """Link a student's institutional record to their national APAAR and ABC accounts."""
    get_student_record(db, student_id)

    apaar_clean = apaar_id.strip()
    if not APAAR_REGEX.match(apaar_clean):
        raise MobilityValidationError(
            f"Invalid APAAR ID format: '{apaar_id}'. Must be exactly 12 numeric digits."
        )

    abc_clean = abc_account_id.strip()
    now = datetime.now(timezone.utc)
    r_id = f"abc_{uuid.uuid4().hex[:12]}"

    doc = {
        "abc_record_id": r_id,
        "student_id": student_id,
        "apaar_id": apaar_clean,
        "abc_account_id": abc_clean,
        "transferred_in_credits": 0.0,
        "redeemed_credits": 0.0,
        "sync_status": "SYNCED",
        "last_synced_at": now,
        "metadata": {},
        "created_at": now,
    }

    db.academic_bank_of_credits.update_one(
        {"student_id": student_id},
        {"$set": doc},
        upsert=True,
    )

    # Sync into student_identifiers catalogue
    add_student_identifier(db, student_id, "APAAR_ID", apaar_clean, "NATIONAL_API_VERIFIED")
    add_student_identifier(db, student_id, "ABC_ACCOUNT_ID", abc_clean, "NATIONAL_API_VERIFIED")

    return doc


def record_external_credit_transfer(
    db: Database,
    enrollment_id: str,
    external_institution_name: str,
    external_course_code: str,
    credits_awarded: float,
    authorized_by_membership_id: str,
    credit_type: str = "TRANSFER",
    course_category: str = "MULTIDISCIPLINARY_MDC",
) -> Dict[str, Any]:
    """Recognize and award credits transferred from an external institution or ABC repository."""
    if credits_awarded <= 0:
        raise MobilityValidationError("Transferred credits must be greater than zero")

    enr = db.student_program_enrollments.find_one({"enrollment_id": enrollment_id})
    if not enr:
        raise MobilityValidationError(f"Enrollment '{enrollment_id}' not found")

    now = datetime.now(timezone.utc)
    source_ref = f"EXT-{external_institution_name.strip()[:10].upper()}-{external_course_code.strip().upper()}"

    # Append to immutable credit ledger
    entry = record_credit_entry(
        db=db,
        enrollment_id=enrollment_id,
        source_type="INTER_INSTITUTIONAL_TRANSFER",
        source_record_id=source_ref,
        credit_amount=float(credits_awarded),
        credit_type=credit_type,
        course_id=None,
        course_category=course_category,
        effective_date=now,
        recognition_status="RECOGNIZED",
        authorized_by_membership_id=authorized_by_membership_id,
        metadata={
            "external_institution": external_institution_name.strip(),
            "external_course_code": external_course_code.strip(),
            "approved_at": now.isoformat(),
        },
    )

    # Update ABC record transferred credits if linked
    db.academic_bank_of_credits.update_one(
        {"student_id": enr["student_id"]},
        {"$inc": {"transferred_in_credits": float(credits_awarded)}},
    )

    return entry

