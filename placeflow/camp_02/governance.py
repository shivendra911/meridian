"""CAMP-02: Separation of Duties (SoD) & Toxic Combinations Engine (Section 9).

Covers:
1. Static SoD: Prevents assigning mutually incompatible roles to the same identity.
2. Dynamic SoD: Prevents the same principal from performing conflicting four-eyes operations
   on the same target entity (e.g. Creator cannot be Approver / Verifier).
"""

from typing import Any, Dict, List, Optional, Set, Tuple
from database.connection import get_db

STATIC_TOXIC_ROLE_PAIRS: List[Tuple[str, str]] = [
    ("PLACEMENT_OFFICE_COORDINATOR", "STATUTORY_AUDITOR"),
    ("TPO_COORDINATOR", "AUDITOR"),
    ("TPO_ADMIN", "AUDITOR"),
    ("INSTITUTIONAL_ADMINISTRATOR", "STATUTORY_AUDITOR"),
    ("INSTITUTION_HEAD", "AUDITOR"),
    ("STUDENT", "PLACEMENT_OFFICE_COORDINATOR"),
    ("STUDENT_MEMBER", "TPO_COORDINATOR"),
    ("STUDENT", "CORPORATE_RELATIONS_LEAD"),
    ("STUDENT", "FACULTY_COORDINATOR"),
    ("STUDENT_MEMBER", "DEPT_COORDINATOR"),
    ("DEPARTMENT_HEAD", "STATUTORY_AUDITOR"),
    ("DEPT_COORDINATOR", "AUDITOR"),
]

DYNAMIC_CONFLICTING_ACTIONS: Dict[str, str] = {
    "placement:offer:verify": "placement:offer:create",
    "placement.offer.verify": "placement.offer.create",
    "placement:application:approve": "placement:application:submit",
    "placement.application.approve": "placement.application.submit",
    "iam:role:approve": "iam:role:request",
    "iam.role.approve": "iam.role.request",
    "placement:student:verify": "placement:student:create",
    "student.verification.approve": "student.profile.create",
}


class SodViolationError(Exception):
    pass


def _norm_role(code: Optional[str]) -> str:
    if not code:
        return ""
    c = code.upper().strip()
    return c[5:] if c.startswith("ROLE_") else c


def validate_static_sod(
    tenant_id: str,
    membership_id: str,
    new_role_code: str,
    db=None,
) -> None:
    """Checks whether assigning new_role_code would violate Static Separation of Duties."""
    if db is None:
        db = get_db()

    norm_new = _norm_role(new_role_code)

    # Get active assigned roles for this membership
    assignments = list(db.role_assignments.find({
        "tenant_id": tenant_id,
        "membership_id": membership_id,
        "status": "ACTIVE",
    }))
    active_role_ids = [a["role_id"] for a in assignments]
    roles = list(db.roles.find({"$or": [{"role_id": {"$in": active_role_ids}}, {"role_code": {"$in": active_role_ids}}]}))
    existing_codes = {_norm_role(r.get("role_code")) for r in roles}

    for (role_a, role_b) in STATIC_TOXIC_ROLE_PAIRS:
        norm_a, norm_b = _norm_role(role_a), _norm_role(role_b)
        if (norm_new == norm_a and norm_b in existing_codes) or (norm_new == norm_b and norm_a in existing_codes):
            raise SodViolationError(
                f"Static SoD Conflict: Incompatible role combination '{role_a}' and '{role_b}' cannot be assigned to the same membership."
            )


def check_dynamic_sod(
    principal_id: str,
    action: str,
    resource_id: str,
    db=None,
) -> Tuple[bool, Optional[str]]:
    """Evaluates whether the principal has previously performed a conflicting action on the resource."""
    if db is None:
        db = get_db()

    prior_conflicting_action = DYNAMIC_CONFLICTING_ACTIONS.get(action)
    if not prior_conflicting_action:
        return True, None

    # Check audit ledger or outbox event history for prior action on this resource by this actor
    conflict = db.outbox_events.find_one({
        "event_type": prior_conflicting_action,
        "payload.resource_id": resource_id,
        "payload.actor_id": principal_id,
    }) or db.agent_runs.find_one({
        "action": prior_conflicting_action,
        "target_id": resource_id,
        "triggered_by": principal_id,
    })

    if conflict:
        return False, f"Dynamic SoD Violation: Principal '{principal_id}' previously executed '{prior_conflicting_action}' on resource '{resource_id}' and cannot execute '{action}'."

    return True, None
