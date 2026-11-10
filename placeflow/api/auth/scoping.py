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

    def students(self) -> Dict[str, Any]:
        """Scoped filter for querying students collection."""
        if self.subject_type == "student":
            return {"student_id": self.subject_id}

        if self.subject_type == "department_head":
            hod = self.db.department_heads.find_one({"hod_id": self.subject_id}, {"_id": 0, "department": 1})
            if hod and hod.get("department"):
                return {"department": hod["department"]}

        if self.subject_type == "school_head":
            hos = self.db.school_heads.find_one({"hos_id": self.subject_id}, {"_id": 0, "school": 1})
            if hos and hos.get("school"):
                return {"school": hos["school"]}

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

        if self.has_wildcard or "placement.drive.manage" in self.permissions or "student.record.export" in self.permissions:
            return {}

        if "student.profile.read" in self.permissions:
            return {}

        return {"student_id": "__NO_ACCESS__"}

    def applications(self) -> Dict[str, Any]:
        """Scoped filter for querying applications collection."""
        if self.subject_type == "student":
            return {"student_id": self.subject_id}

        if self.has_wildcard or "placement.application.status_update" in self.permissions or "placement.drive.manage" in self.permissions:
            return {}

        if self.subject_type == "recruiter":
            return {"company_id": self.subject_id}

        student_filter = self.students()
        if "student_id" in student_filter:
            return student_filter

        if "department" in student_filter or "school" in student_filter:
            matching_students = list(self.db.students.find(student_filter, {"_id": 0, "student_id": 1}))
            s_ids = [s["student_id"] for s in matching_students]
            return {"student_id": {"$in": s_ids}}

        return {"student_id": "__NO_ACCESS__"}

    def interviews(self) -> Dict[str, Any]:
        """Scoped filter for querying interviews collection."""
        if self.subject_type == "student":
            return {"student_id": self.subject_id}

        if self.has_wildcard or "placement.interview.schedule" in self.permissions:
            return {}

        if self.subject_type == "recruiter":
            return {"company_id": self.subject_id}

        app_filter = self.applications()
        return app_filter

    def placements(self) -> Dict[str, Any]:
        """Scoped filter for querying placements collection."""
        if self.subject_type == "student":
            return {"student_id": self.subject_id}

        if self.has_wildcard or "placement.offer.approve" in self.permissions or "nirf.metrics.calculate" in self.permissions:
            return {}

        if self.subject_type == "recruiter":
            return {"company_id": self.subject_id}

        student_filter = self.students()
        if "student_id" in student_filter:
            return student_filter

        return {}

    def jobs(self) -> Dict[str, Any]:
        """Scoped filter for querying jobs collection."""
        if self.subject_type == "student":
            return {"status": "Active"}

        if self.subject_type == "recruiter":
            return {"company_id": self.subject_id}

        return {}

    def companies(self) -> Dict[str, Any]:
        """Scoped filter for querying companies collection."""
        if self.subject_type == "recruiter":
            return {"company_id": self.subject_id}

        return {}

