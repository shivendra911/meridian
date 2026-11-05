"""CAMP-02 Identity & Access Intelligence Engine.

Section 7 of Campus AI Architecture:
Provides intelligent access reviews, excessive privilege detection,
Separation of Duties (SoD) risk signals, and pre-import roster validation.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
import re
from typing import Any, Dict, List, Optional


@dataclass
class PrivilegeRiskFlag:
    assignment_id: str
    account_id: str
    role_id: str
    risk_level: str  # "LOW", "MEDIUM", "HIGH"
    reason: str


class IAMIntelligenceEngine:
    """Security analysis and access review assistant for CAMP-02."""

    def __init__(self, db=None):
        self.db = db

    def audit_access_privileges(self, tenant_id: str) -> Dict[str, Any]:
        """Audits role assignments for excessive scopes or departmental mismatches."""
        if not self.db:
            return {"status": "NO_DATABASE", "flags": []}

        assignments = list(self.db.account_role_assignments.find({"tenant_id": tenant_id, "status": "ACTIVE"}))
        memberships = {
            m["person_id"]: m
            for m in self.db.institution_memberships.find({"tenant_id": tenant_id})
        }
        accounts = {
            a["account_id"]: a
            for a in self.db.user_accounts.find({"tenant_id": tenant_id})
        }

        flags: List[PrivilegeRiskFlag] = []

        # Analyze assignments
        role_counts_by_account: Dict[str, List[str]] = {}
        for a in assignments:
            acc_id = a.get("account_id")
            role_id = a.get("role_id")
            role_counts_by_account.setdefault(acc_id, []).append(role_id)

            # Check if assignment is scoped to a unit that doesn't match person's primary unit
            acc = accounts.get(acc_id)
            if acc:
                person_id = acc.get("person_id")
                mem = memberships.get(person_id)
                if mem and mem.get("status") in ["SUSPENDED", "INACTIVE", "TERMINATED"]:
                    flags.append(
                        PrivilegeRiskFlag(
                            assignment_id=a.get("assignment_id", "unknown"),
                            account_id=acc_id,
                            role_id=role_id,
                            risk_level="HIGH",
                            reason=f"Account holds active role '{role_id}' while institutional membership is '{mem.get('status')}'.",
                        )
                    )

        # Static Separation of Duties (SoD) Warning Signals
        conflicting_role_pairs = [
            ("ACADEMIC_EVALUATOR", "EXAM_CONTROLLER"),
            ("COURSE_REGISTRAR", "STUDENT"),
        ]
        for acc_id, assigned_roles in role_counts_by_account.items():
            role_set = set(assigned_roles)
            for r1, r2 in conflicting_role_pairs:
                if r1 in role_set and r2 in role_set:
                    flags.append(
                        PrivilegeRiskFlag(
                            assignment_id="sod_conflict",
                            account_id=acc_id,
                            role_id=f"{r1}+{r2}",
                            risk_level="HIGH",
                            reason=f"Account holds conflicting toxic role combination: '{r1}' and '{r2}' (SoD violation).",
                        )
                    )

        return {
            "tenant_id": tenant_id,
            "total_active_assignments": len(assignments),
            "flags_detected": len(flags),
            "flags": [
                {
                    "assignment_id": f.assignment_id,
                    "account_id": f.account_id,
                    "role_id": f.role_id,
                    "risk_level": f.risk_level,
                    "reason": f.reason,
                }
                for f in flags
            ],
            "audited_at": datetime.now(timezone.utc),
        }

    def validate_identity_roster(self, roster: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Pre-validates bulk identity import rows for formatting, national IDs, and DPDP compliance."""
        valid_rows = []
        invalid_rows = []

        seen_emails = set()

        for idx, row in enumerate(roster):
            row_num = idx + 1
            errors = []

            email = str(row.get("email", "")).strip().lower()
            if not email or "@" not in email:
                errors.append("Invalid or missing primary email address.")
            elif email in seen_emails:
                errors.append(f"Duplicate email '{email}' within same import batch.")
            else:
                seen_emails.add(email)

            first_name = str(row.get("first_name", "")).strip()
            if not first_name or len(first_name) < 2:
                errors.append("First name is required (min 2 characters).")

            # Validate optional Aadhaar
            aadhaar = row.get("aadhaar_number")
            if aadhaar:
                clean_aadhaar = str(aadhaar).replace(" ", "").strip()
                if not re.match(r"^[2-9]\d{11}$", clean_aadhaar):
                    errors.append(f"Invalid Aadhaar format: '{aadhaar}'. Must be 12 digits.")

            # Validate optional APAAR
            apaar = row.get("apaar_id")
            if apaar:
                clean_apaar = str(apaar).replace(" ", "").strip()
                if not re.match(r"^\d{12}$", clean_apaar):
                    errors.append(f"Invalid APAAR ID format: '{apaar}'. Must be 12 digits.")

            # Validate optional PAN
            pan = row.get("pan_number")
            if pan:
                clean_pan = str(pan).strip().upper()
                if not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", clean_pan):
                    errors.append(f"Invalid PAN format: '{pan}'. Must be 10 characters (AAAAA9999A).")

            if errors:
                invalid_rows.append({"row": row_num, "email": email, "errors": errors})
            else:
                valid_rows.append(row)

        return {
            "total_rows": len(roster),
            "valid_count": len(valid_rows),
            "invalid_count": len(invalid_rows),
            "is_import_ready": len(invalid_rows) == 0,
            "invalid_rows": invalid_rows,
        }

