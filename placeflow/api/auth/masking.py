"""PlaceFlow / Meridian — DPDP Field Masking Engine (Phase 3).

Applies statutory data protection masking to student PII, contact info, and national identifiers
for principals lacking `student.record.export` or `placement.export.pii`.
"""

import re
from typing import Any, Dict, List, Union
from campus_ai.privacy import DPDPPrivacyEngine


_privacy_engine = DPDPPrivacyEngine()


def mask_email(email: str) -> str:
    if not email or "@" not in email:
        return ""
    user, domain = email.split("@", 1)
    if len(user) <= 2:
        masked_user = user[0] + "*"
    else:
        masked_user = user[0] + "*" * (len(user) - 2) + user[-1]
    return f"{masked_user}@{domain}"


def mask_phone(phone: str) -> str:
    if not phone or len(phone) < 4:
        return ""
    digits = re.sub(r"\D", "", phone)
    if len(digits) >= 10:
        return f"+91-XXXXXX{digits[-4:]}"
    return "****" + phone[-4:]


def mask_record_pii(record: Dict[str, Any], principal: Any) -> Dict[str, Any]:
    """Conditionally masks PII fields on a dictionary record."""
    if not record or not isinstance(record, dict):
        return record

    has_export = getattr(principal, "has_any", lambda *p: False)(
        "student.record.export", "placement.export.pii"
    ) or getattr(principal, "has", lambda p: False)("*")

    if has_export:
        return record  # Unmasked for privileged export administrators

    # Self access: students can view their own contact details
    subj = getattr(principal, "subject", None) or {}
    if subj.get("type") == "student" and record.get("student_id") == subj.get("id"):
        return record

    masked = dict(record)
    if "phone" in masked and masked["phone"]:
        masked["phone"] = mask_phone(str(masked["phone"]))
    if "email" in masked and masked["email"]:
        masked["email"] = mask_email(str(masked["email"]))
    if "date_of_birth" in masked:
        masked["date_of_birth"] = "[REDACTED_DOB]"
    if "national_identifiers" in masked and isinstance(masked["national_identifiers"], list):
        masked_idents = []
        for ident in masked["national_identifiers"]:
            val = str(ident.get("value", ""))
            masked_idents.append({
                "scheme": ident.get("scheme"),
                "value": "XXXX" + val[-4:] if len(val) >= 4 else "****",
            })
        masked["national_identifiers"] = masked_idents

    return masked


def mask_records(records: Union[List[Dict[str, Any]], Dict[str, Any]], principal: Any) -> Any:
    """Recursively or iteratively applies DPDP masking across data payloads."""
    if isinstance(records, list):
        return [mask_record_pii(r, principal) for r in records]
    if isinstance(records, dict):
        return mask_record_pii(records, principal)
    return records

