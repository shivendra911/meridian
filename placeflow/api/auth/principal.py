"""PlaceFlow / Meridian — Authenticated Principal Dataclass (Phase 2).

Represents an immutable authenticated actor identity derived from a validated session.
Carries account, person, tenant, institution, subject, assignments, permissions, and portals.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set, Tuple
from database.connection import get_db
from camp_02.identities import resolve_subject
from camp_02.assignments import list_active_role_assignments, get_effective_user_permissions


PORTAL_PRIORITY = ["tpo", "admin", "management", "hod", "faculty", "student"]


ROLE_PORTALS_MAP: Dict[str, List[str]] = {
    "STUDENT_MEMBER": ["student"],
    "PLACEMENT_REP": ["student"],
    "FACULTY_MENTOR": ["faculty"],
    "DEPT_COORDINATOR": ["faculty"],
    "DEPARTMENT_HEAD": ["hod"],
    "SCHOOL_HEAD": ["hod"],
    "TPO_COORDINATOR": ["tpo"],
    "TPO_ADMIN": ["tpo"],
    "INSTITUTION_HEAD": ["management"],
    "AUDITOR": ["management"],
    "INSTITUTION_ADMIN": ["admin"],
    "SUPER_ADMIN": ["admin"],
    "RECRUITER_EXTERNAL": [],
}

ROLE_DEFAULT_PORTAL_MAP: Dict[str, str] = {
    "STUDENT_MEMBER": "student",
    "PLACEMENT_REP": "student",
    "FACULTY_MENTOR": "faculty",
    "DEPT_COORDINATOR": "faculty",
    "DEPARTMENT_HEAD": "hod",
    "SCHOOL_HEAD": "hod",
    "TPO_COORDINATOR": "tpo",
    "TPO_ADMIN": "tpo",
    "INSTITUTION_HEAD": "management",
    "AUDITOR": "management",
    "INSTITUTION_ADMIN": "admin",
    "SUPER_ADMIN": "admin",
    "RECRUITER_EXTERNAL": "",
}

ROLE_PREF_ORDER: List[str] = [
    "SUPER_ADMIN",
    "INSTITUTION_ADMIN",
    "INSTITUTION_HEAD",
    "TPO_ADMIN",
    "TPO_COORDINATOR",
    "SCHOOL_HEAD",
    "DEPARTMENT_HEAD",
    "AUDITOR",
    "DEPT_COORDINATOR",
    "FACULTY_MENTOR",
    "PLACEMENT_REP",
    "STUDENT_MEMBER",
    "RECRUITER_EXTERNAL",
]


def compute_portals(
    permissions: frozenset[str],
    subject: Optional[Dict[str, Any]] = None,
    assignments: Optional[List[Dict[str, Any]]] = None,
) -> Tuple[List[str], str]:
    """Computes available portals and default portal from primary role assignment.
    
    Default portal rule: the portal corresponding to the account's primary role assignment.
    Portals list: narrowed to the specific workspace intended for the active roles.
    """
    assigned_roles: List[str] = []
    if assignments:
        for a in assignments:
            if isinstance(a, dict):
                rc = a.get("role_code")
                if not rc and a.get("role_id"):
                    rc = a.get("role_id", "").replace("role_sys_", "").upper()
                if rc and rc not in assigned_roles:
                    assigned_roles.append(rc)

    # 1. Primary role assignment resolution
    primary_role: Optional[str] = None
    for r in ROLE_PREF_ORDER:
        if r in assigned_roles:
            primary_role = r
            break

    if primary_role:
        default_portal = ROLE_DEFAULT_PORTAL_MAP.get(primary_role, "")
        # Narrow portal entry: dominant institutional roles map strictly to their primary workspace
        if primary_role in (
            "TPO_ADMIN", "TPO_COORDINATOR", "INSTITUTION_HEAD", "AUDITOR",
            "DEPARTMENT_HEAD", "SCHOOL_HEAD", "INSTITUTION_ADMIN", "SUPER_ADMIN", "RECRUITER_EXTERNAL"
        ):
            portals = list(ROLE_PORTALS_MAP.get(primary_role, []))
        else:
            portals = []
            for r in ROLE_PREF_ORDER:
                if r in assigned_roles:
                    for p in ROLE_PORTALS_MAP.get(r, []):
                        if p not in portals:
                            portals.append(p)
        return portals, default_portal

    # 2. Subject fallback when no formal role assignment is loaded
    subj_type = subject.get("type") if subject else None
    if subj_type == "student":
        return ["student"], "student"
    if subj_type == "recruiter":
        return [], ""
    if subj_type in ("faculty", "department_head", "school_head"):
        return ["faculty"], "faculty"

    return [], ""


@dataclass(frozen=True)
class Principal:
    """Immutable authoritative security context for the active request."""
    account_id: str
    person_id: Optional[str]
    display_name: str
    tenant_id: str
    institution_id: Optional[str]
    subject: Optional[Dict[str, Any]]
    assignments: Tuple[Dict[str, Any], ...]
    permissions: frozenset[str]
    portals: Tuple[str, ...]
    default_portal: str
    delegation: Optional[Dict[str, Any]] = None
    break_glass: Optional[Dict[str, Any]] = None
    profile: Optional[Dict[str, Any]] = None
    unread_notifications: int = 0

    @property
    def is_authenticated(self) -> bool:
        """Django auth compatibility."""
        return True

    @property
    def is_anonymous(self) -> bool:
        """Django auth compatibility."""
        return False

    @property
    def pk(self) -> str:
        """DRF and Django user identifier compatibility."""
        return self.account_id

    @property
    def id(self) -> str:
        """DRF and Django user identifier compatibility."""
        return self.account_id

    def has(self, permission: str) -> bool:
        """Checks if the principal holds the given permission key or wildcard."""
        return "*" in self.permissions or permission in self.permissions

    def has_any(self, *permissions: str) -> bool:
        """Checks if the principal holds at least one of the specified permissions."""
        if "*" in self.permissions:
            return True
        return any(p in self.permissions for p in permissions)

    def has_all(self, *permissions: str) -> bool:
        """Checks if the principal holds all of the specified permissions."""
        if "*" in self.permissions:
            return True
        return all(p in self.permissions for p in permissions)

    def to_dict(self) -> Dict[str, Any]:
        """Serializes to the authoritative contract required by docs/RBAC_SPEC.md Section 5."""
        clean_assignments = []
        for a in self.assignments:
            clean_assignments.append({
                "assignment_id": a.get("assignment_id"),
                "role_code": a.get("role_code") or a.get("role_id", "").replace("role_sys_", "").upper(),
                "scope_type": a.get("scope_type"),
                "scope_id": a.get("scope_id"),
            })

        return {
            "account_id": self.account_id,
            "person_id": self.person_id,
            "display_name": self.display_name,
            "tenant_id": self.tenant_id,
            "institution_id": self.institution_id,
            "subject": self.subject,
            "assignments": clean_assignments,
            "permissions": sorted(list(self.permissions)),
            "portals": list(self.portals),
            "default_portal": self.default_portal,
            "delegation": self.delegation,
            "break_glass": self.break_glass,
            "profile": self.profile,
            "unread_notifications": self.unread_notifications,
        }


def build_principal(
    account_id: str,
    tenant_id: str,
    institution_id: Optional[str] = None,
    db=None,
) -> Principal:
    """Constructs a validated Principal instance from database state."""
    if db is None:
        db = get_db()

    account = db.accounts.find_one({"account_id": account_id}, {"_id": 0})
    if not account:
        raise LookupError(f"Account '{account_id}' not found.")

    person_id = account.get("person_id")
    display_name = account.get("username", "User")
    if person_id:
        person = db.person_identities.find_one({"person_id": person_id}, {"_id": 0})
        if person:
            fn = person.get("first_name", "")
            ln = person.get("last_name", "")
            full = f"{fn} {ln}".strip()
            if full:
                display_name = full

    subject = resolve_subject(person_id, db=db) if person_id else None

    # Resolve active assignments and permissions
    raw_assignments = list_active_role_assignments(account_id, institution_id=institution_id, db=db)
    effective_perms_list = get_effective_user_permissions(account_id, institution_id=institution_id, db=db)

    all_perms: Set[str] = set()
    for item in effective_perms_list:
        all_perms.update(item.get("permissions", []))

    # Attach role_code to assignments
    formatted_assignments = []
    for a in raw_assignments:
        role_doc = db.roles.find_one({"role_id": a.get("role_id")}, {"_id": 0, "role_code": 1})
        role_code = role_doc.get("role_code") if role_doc else a.get("role_id", "").replace("role_sys_", "").upper()
        a_copy = dict(a)
        a_copy["role_code"] = role_code
        formatted_assignments.append(a_copy)

    frozen_perms = frozenset(all_perms)
    portals, default_portal = compute_portals(frozen_perms, subject=subject, assignments=formatted_assignments)

    # Compose platform profile and unread notifications count (PLATFORM_SPEC Section 2)
    from api.account.profile_service import get_profile_summary, get_unread_notifications_count
    profile_summary = get_profile_summary(
        account_id=account_id,
        person_id=person_id,
        subject=subject,
        tenant_id=tenant_id,
        institution_id=institution_id,
        db=db,
    )
    unread_notifs = get_unread_notifications_count(person_id, db=db)

    return Principal(
        account_id=account_id,
        person_id=person_id,
        display_name=display_name,
        tenant_id=tenant_id,
        institution_id=institution_id,
        subject=subject,
        assignments=tuple(formatted_assignments),
        permissions=frozen_perms,
        portals=tuple(portals),
        default_portal=default_portal,
        delegation=None,
        break_glass=None,
        profile=profile_summary,
        unread_notifications=unread_notifs,
    )
