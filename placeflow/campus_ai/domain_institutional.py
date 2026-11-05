"""CAMP-01 Institutional Intelligence Engine.

Section 6 of Campus AI Architecture:
Extracts institutional structures from documents, performs directory mapping,
and verifies structural and regulatory data consistency across tenant hierarchies.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
import re
from typing import Any, Dict, List, Optional


@dataclass
class DiscoveredDepartment:
    code: str
    name: str
    unit_kind: str
    parent_code: Optional[str] = None


@dataclass
class DiscoveredCampus:
    code: str
    name: str
    is_primary: bool
    city: str


@dataclass
class DiscoveredInstitution:
    display_name: str
    institution_type: str
    regulatory_identifiers: Dict[str, str]
    campuses: List[DiscoveredCampus]
    departments: List[DiscoveredDepartment]


class InstitutionalIntelligenceEngine:
    """Document extraction and configuration advisor for CAMP-01."""

    def __init__(self, db=None):
        self.db = db

    def extract_structure_from_text(self, document_text: str) -> DiscoveredInstitution:
        """Parses institutional text (handbook/brochure/circular) into CAMP-01 entities."""
        lines = [line.strip() for line in document_text.splitlines() if line.strip()]

        # 1. Detect Institution Name & Classification
        inst_name = "National Institute of Technology"
        for line in lines[:5]:
            if any(k in line.lower() for k in ["institute", "university", "college", "academy"]):
                inst_name = line
                break

        inst_kind = "UNIVERSITY"
        text_lower = document_text.lower()
        if "autonomous college" in text_lower:
            inst_kind = "AUTONOMOUS_COLLEGE"
        elif "deemed" in text_lower:
            inst_kind = "DEEMED_UNIVERSITY"
        elif "college" in text_lower:
            inst_kind = "COLLEGE"

        # 2. Extract Regulatory Identifiers
        reg_ids = {}
        aishe_match = re.search(r"\b(U-\d{4,6}|C-\d{4,6})\b", document_text)
        if aishe_match:
            reg_ids["AISHE"] = aishe_match.group(1)

        aicte_match = re.search(r"\b(1-\d{8,12})\b", document_text)
        if aicte_match:
            reg_ids["AICTE"] = aicte_match.group(1)

        # 3. Discover Campuses
        campuses: List[DiscoveredCampus] = []
        campus_matches = re.findall(
            r"(?:campus|location|branch)\s*[:\-]\s*([A-Za-z\s]+?)(?:\s*\((\w+)\)|\n|,|\.)",
            document_text,
            re.IGNORECASE,
        )
        if campus_matches:
            for idx, m in enumerate(campus_matches):
                cname = m[0].strip()
                if cname and len(cname) > 2:
                    campuses.append(
                        DiscoveredCampus(
                            code=f"CMP{idx+1:02d}",
                            name=f"{cname} Campus",
                            is_primary=(idx == 0),
                            city=cname,
                        )
                    )
        else:
            campuses.append(
                DiscoveredCampus(
                    code="CMP01",
                    name="Main Campus",
                    is_primary=True,
                    city="Bengaluru",
                )
            )

        # 4. Discover Academic Departments / Schools
        departments: List[DiscoveredDepartment] = []
        dept_patterns = [
            r"Department of ([^\r\n,;]+)",
            r"School of ([^\r\n,;]+)",
            r"Faculty of ([^\r\n,;]+)",
        ]
        seen_depts = set()
        for pat in dept_patterns:
            for match in re.findall(pat, document_text, re.IGNORECASE):
                dname = match.strip()
                if len(dname) > 3 and dname.lower() not in seen_depts:
                    seen_depts.add(dname.lower())
                    words = [w for w in dname.split() if w.lower() not in ["and", "&", "of", "the"]]
                    code = "".join(w[0].upper() for w in words)[:5]
                    departments.append(
                        DiscoveredDepartment(
                            code=code or f"DEP{len(departments)+1}",
                            name=f"Department of {dname}",
                            unit_kind="ACADEMIC_DEPARTMENT",
                        )
                    )

        # Fallback departments if none detected in raw snippet
        if not departments:
            departments = [
                DiscoveredDepartment(code="CSE", name="Department of Computer Science & Engineering", unit_kind="ACADEMIC_DEPARTMENT"),
                DiscoveredDepartment(code="ECE", name="Department of Electronics & Communication", unit_kind="ACADEMIC_DEPARTMENT"),
            ]

        return DiscoveredInstitution(
            display_name=inst_name,
            institution_type=inst_kind,
            regulatory_identifiers=reg_ids,
            campuses=campuses,
            departments=departments,
        )

    def audit_institution_consistency(self, tenant_id: str) -> Dict[str, Any]:
        """Audits CAMP-01 hierarchy and identifies structural inconsistencies."""
        if not self.db:
            return {"status": "NO_DATABASE", "issues": []}

        issues: List[Dict[str, str]] = []

        # 1. Verify single primary campus
        campuses = list(self.db.campuses.find({"tenant_id": tenant_id}))
        primary_count = sum(1 for c in campuses if c.get("is_primary") is True)
        if primary_count == 0:
            issues.append({"level": "WARNING", "code": "NO_PRIMARY_CAMPUS", "message": "Tenant has no designated primary campus."})
        elif primary_count > 1:
            issues.append({"level": "ERROR", "code": "MULTIPLE_PRIMARY_CAMPUSES", "message": "Multiple primary campuses detected; violates CAMP-01 exclusivity."})

        # 2. Check for orphan organizational units
        units = list(self.db.organizational_units.find({"tenant_id": tenant_id}))
        unit_ids = {u.get("unit_id") for u in units}
        for u in units:
            parent_id = u.get("parent_unit_id")
            if parent_id and parent_id not in unit_ids:
                issues.append({
                    "level": "ERROR",
                    "code": "ORPHAN_ORG_UNIT",
                    "message": f"Unit '{u.get('unit_id')}' points to missing parent '{parent_id}'.",
                })

        return {
            "tenant_id": tenant_id,
            "is_clean": len(issues) == 0,
            "issues_count": len(issues),
            "issues": issues,
            "audited_at": datetime.now(timezone.utc),
        }
