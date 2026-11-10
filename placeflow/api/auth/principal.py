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


def compute_portals(
    permissions: frozenset[str],
    subject: Optional[Dict[str, Any]] = None,
    assignments: Optional[List[Dict[str, Any]]] = None,
) -> Tuple[List[str], str]:
    """Computes available portals and default portal from effective permissions and subject.
    
    Portals entry permissions (from docs/RBAC_SPEC.md Section 2):
    - student: student.profile.update_self + placement.application.create
    - faculty: student.profile.read at OU scope and a faculty subject
    - hod: academic.curriculum.approve or academic.progression.evaluate
    - tpo: placement.drive.manage or placement.jnf.approve
    - management: nirf.report.view or agent.trace.view
    - admin: iam.role.assign or organization.unit.create or configuration.version.create
    
    Default portal priority: tpo > admin > management > hod > faculty > student.
    """
    has_wildcard = "*" in permissions
    portals: List[str] = []

    # 1. Student Portal
    can_student = (
        has_wildcard
        or (
            "student.profile.update_self" in permissions
            and "placement.application.create" in permissions
        )
    )
    if can_student:
        portals.append("student")

    # 2. Faculty Portal
    subj_type = subject.get("type") if subject else None
    can_faculty = (
        has_wildcard
        or (
            "student.profile.read" in permissions
            and subj_type in ("faculty", "department_head", "school_head")
        )
    )
    if can_faculty:
        portals.append("faculty")

    # 3. HOD Portal
    can_hod = (
        has_wildcard
        or "academic.curriculum.approve" in permissions
        or "academic.progression.evaluate" in permissions
    )
    if can_hod:
        portals.append("hod")

    # 4. TPO Portal
    can_tpo = (
        has_wildcard
        or "placement.drive.manage" in permissions
        or "placement.jnf.approve" in permissions
    )
    if can_tpo:
        portals.append("tpo")

    # 5. Management Portal
    can_mgmt = (
        has_wildcard
        or "nirf.report.view" in permissions
        or "agent.trace.view" in permissions
    )
    if can_mgmt:
        portals.append("management")

    # 6. Admin Portal
    can_admin = (
        has_wildcard
        or "iam.role.assign" in permissions
        or "organization.unit.create" in permissions
        or "configuration.version.create" in permissions
    )
    if can_admin:
        portals.append("admin")

    # Default portal by priority
    default_portal = "student"
    for p in PORTAL_PRIORITY:
        if p in portals:
            default_portal = p
            break
    if not portals:
        portals = ["student"]
        default_portal = "student"

    return portals, default_portal


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

    frozen_perms = frozenset(all_perms)
    portals, default_portal = compute_portals(frozen_perms, subject=subject, assignments=raw_assignments)

    # Attach role_code to assignments
    formatted_assignments = []
    for a in raw_assignments:
        role_doc = db.roles.find_one({"role_id": a.get("role_id")}, {"_id": 0, "role_code": 1})
        role_code = role_doc.get("role_code") if role_doc else a.get("role_id", "").replace("role_sys_", "").upper()
        a_copy = dict(a)
        a_copy["role_code"] = role_code
        formatted_assignments.append(a_copy)

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
    )
