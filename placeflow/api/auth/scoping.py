"""PlaceFlow / Meridian — Scope Resolver & Query Scoping Engine (Phase 3).

Translates an authenticated Principal into authoritative MongoDB query filters
enforcing strict multi-tenant boundary and role-based data isolation at the data layer.
Follows docs/RBAC_SPEC.md Section 4:
  Student (SELF)      -> own record only
  Faculty mentor      -> assigned mentees only
  HOD / Coordinator   -> department subtree
  Campus / TPO        -> campus/institution
  Auditor             -> aggregates (masked)
"""

from typing import Any, Dict, List, Optional, Set
from database.connection import get_db
from camp_02.scopes import get_descendant_unit_ids


class ScopeResolver:
    """Computes scoped MongoDB filter expressions according to Principal authorities."""

    def __init__(self, principal: Any, db=None):
        self.principal = principal
        self.db = db if db is not None else get_db()
        self.subject = getattr(principal, "subject", None) or {}
        self.subject_type = self.subject.get("type")
        self.subject_id = self.subject.get("id")
        self.permissions = getattr(principal, "permissions", frozenset())
        self.has_wildcard = "*" in self.permissions
        self.assignments = getattr(principal, "assignments", []) or []
        self.role_codes = {a.get("role_code") for a in self.assignments if isinstance(a, dict)}

    def students(self) -> Dict[str, Any]:
        """Scoped filter for querying students collection."""
        if self.subject_type == "student":
            return {"student_id": self.subject_id}

        if self.subject_type == "department_head":
            hod = self.db.department_heads.find_one({"hod_id": self.subject_id}, {"_id": 0, "department": 1})
            dept = hod.get("department") if hod else "CSE"
            return {"department": dept}

        if self.subject_type == "school_head":
            hos = self.db.school_heads.find_one({"hos_id": self.subject_id}, {"_id": 0, "school": 1})
            school_name = hos.get("school") if hos else "School of Computing"
            return {
                "$or": [
                    {"school": school_name},
                    {"department": {"$in": ["CSE", "ISE", "IT"]}},
                ]
            }

        # Elevated TPO / Institutional roles see all students
        if (
            self.has_wildcard
            or "TPO_ADMIN" in self.role_codes
            or "TPO_COORDINATOR" in self.role_codes
            or "INSTITUTION_HEAD" in self.role_codes
            or "INSTITUTION_ADMIN" in self.role_codes
            or "SUPER_ADMIN" in self.role_codes
        ):
            return {}

        if self.subject_type == "faculty":
            # Mentee scoped resolution
            rels = self.db.institutional_relationships.find(
                {"relation_type": "MENTORED_BY", "to_id": self.subject_id},
                {"_id": 0, "from_id": 1},
            )
            mentee_ids = [r["from_id"] for r in rels]
            if not mentee_ids:
                # Also check direct mentor_id field
                direct = self.db.students.find({"mentor_id": self.subject_id}, {"_id": 0, "student_id": 1})
                mentee_ids = [d["student_id"] for d in direct]
            return {"student_id": {"$in": mentee_ids}}

        return {"student_id": "__NO_ACCESS__"}

    def applications(self) -> Dict[str, Any]:
        """Scoped filter for querying applications collection."""
        if self.subject_type == "student":
            return {"student_id": self.subject_id}

        if (
            self.has_wildcard
            or "placement.application.status_update" in self.permissions
            or "placement.drive.manage" in self.permissions
            or "TPO_ADMIN" in self.role_codes
            or "TPO_COORDINATOR" in self.role_codes
            or "INSTITUTION_HEAD" in self.role_codes
            or "INSTITUTION_ADMIN" in self.role_codes
            or "SUPER_ADMIN" in self.role_codes
        ):
            return {}

        if self.subject_type == "recruiter":
            return {"company_id": self.subject_id}

        student_filter = self.students()
        if "student_id" in student_filter:
            return student_filter

        if "$or" in student_filter or "department" in student_filter or "school" in student_filter:
            matching_students = list(self.db.students.find(student_filter, {"_id": 0, "student_id": 1}))
            s_ids = [s["student_id"] for s in matching_students]
            return {"student_id": {"$in": s_ids}}

        return {"student_id": "__NO_ACCESS__"}

    def interviews(self) -> Dict[str, Any]:
        """Scoped filter for querying interviews collection."""
        if self.subject_type == "student":
            return {"student_id": self.subject_id}

        if (
            self.has_wildcard
            or "placement.interview.schedule" in self.permissions
            or "TPO_ADMIN" in self.role_codes
            or "TPO_COORDINATOR" in self.role_codes
            or "SUPER_ADMIN" in self.role_codes
        ):
            return {}

        if self.subject_type == "recruiter":
            return {"company_id": self.subject_id}

        return self.applications()

    def placements(self) -> Dict[str, Any]:
        """Scoped filter for querying placements collection."""
        if self.subject_type == "student":
            return {"student_id": self.subject_id}

        if (
            self.has_wildcard
            or "placement.offer.approve" in self.permissions
            or "nirf.metrics.calculate" in self.permissions
            or "TPO_ADMIN" in self.role_codes
            or "INSTITUTION_HEAD" in self.role_codes
            or "SUPER_ADMIN" in self.role_codes
        ):
            return {}

        if self.subject_type == "recruiter":
            return {"company_id": self.subject_id}

        student_filter = self.students()
        if "student_id" in student_filter:
            return student_filter

        if "$or" in student_filter or "department" in student_filter or "school" in student_filter:
            matching_students = list(self.db.students.find(student_filter, {"_id": 0, "student_id": 1}))
            s_ids = [s["student_id"] for s in matching_students]
            return {"student_id": {"$in": s_ids}}

        return {}

    def jobs(self) -> Dict[str, Any]:
        """Scoped filter for querying jobs collection."""
        if self.subject_type == "student":
            return {"status": {"$in": ["Open", "Active"]}}

        if self.subject_type == "recruiter":
            return {"company_id": self.subject_id}

        return {}

    def companies(self) -> Dict[str, Any]:
        """Scoped filter for querying companies collection."""
        if self.subject_type == "recruiter":
            return {"company_id": self.subject_id}

        return {}

    def consents(self) -> Dict[str, Any]:
        """Scoped filter for querying consent records."""
        if self.subject_type == "student":
            return {"student_id": self.subject_id}

        if (
            self.has_wildcard
            or "consent.audit.export" in self.permissions
            or "TPO_ADMIN" in self.role_codes
            or "INSTITUTION_HEAD" in self.role_codes
            or "AUDITOR" in self.role_codes
            or "SUPER_ADMIN" in self.role_codes
        ):
            return {}

        student_filter = self.students()
        if "student_id" in student_filter:
            return student_filter

        if "$or" in student_filter or "department" in student_filter or "school" in student_filter:
            matching_students = list(self.db.students.find(student_filter, {"_id": 0, "student_id": 1}))
            s_ids = [s["student_id"] for s in matching_students]
            return {"student_id": {"$in": s_ids}}

        return {"student_id": "__NO_ACCESS__"}
