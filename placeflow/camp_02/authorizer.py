"""CAMP-02: Authorization Decision Pipeline (Section 7).

Implements the 13-step deterministic authorization decision engine:
can(Principal, Action, Resource, Context) -> Decision(ALLOWED | DENIED, reason_code)

Guarantees:
- Tenant-isolated decision boundary
- Downward inheritance scope enforcement
- Delegation validation & anti-cascade
- Dynamic Separation of Duties (SoD)
- Break-glass elevation detection
"""

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import ipaddress

from database.connection import get_db
from camp_02.scopes import is_in_scope, SCOPE_RANKS
from camp_02.governance import check_dynamic_sod
from camp_02.privileged import is_break_glass_active


ACTION_ALIASES = {
    "placement:student:read": "student.profile.read",
    "placement.student.read": "student.profile.read",
    "placement:student:verify": "student.verification.approve",
    "placement.student.verify": "student.verification.approve",
    "placement:offer:verify": "placement.offer.approve",
    "placement.offer.verify": "placement.offer.approve",
    "placement:offer:create": "placement.offer.record",
    "placement.offer.create": "placement.offer.record",
    "camp01:institution:update": "institution.profile.update",
    "camp01.institution.update": "institution.profile.update",
}


@dataclass
class Decision:
    allowed: bool
    reason_code: str
    message: str
    evaluated_at: datetime
    principal_id: str
    action: str
    target_resource_id: Optional[str] = None
    matched_role_id: Optional[str] = None
    delegation_id: Optional[str] = None


def can(
    tenant_id: str,
    principal_membership_id: str,
    action: str,
    resource: Dict[str, Any],
    context: Optional[Dict[str, Any]] = None,
    db=None,
) -> Decision:
    """Evaluates an authorization query against the CAMP-02 13-step pipeline."""
    if db is None:
        db = get_db()

    now = datetime.now(timezone.utc)
    ctx = context or {}
    resource_id = resource.get("resource_id") or resource.get("id")
    target_scope_type = (resource.get("scope_type") or "INSTITUTION").upper().strip()
    target_scope_id = resource.get("scope_id") or resource.get("institution_id") or ""
    resource_owner_id = resource.get("owner_id") or resource.get("person_id")

    # Normalize action representation (supports both dot and colon and synonyms)
    action_variants = {action, action.replace(":", "."), action.replace(".", ":")}
    if action in ACTION_ALIASES:
        aliased = ACTION_ALIASES[action]
        action_variants.update({aliased, aliased.replace(":", "."), aliased.replace(".", ":")})

    # Step 1: Identity & Membership Verification
    membership = db.institution_memberships.find_one({
        "membership_id": principal_membership_id,
        "tenant_id": tenant_id,
    })
    if not membership or membership.get("status") != "ACTIVE":
        return Decision(
            allowed=False,
            reason_code="AUTH_INVALID",
            message="Principal membership is not found or is not ACTIVE.",
            evaluated_at=now,
            principal_id=principal_membership_id,
            action=action,
            target_resource_id=resource_id,
        )

    person = db.person_identities.find_one({
        "person_id": membership["person_id"],
    })
    if not person or person.get("status") != "ACTIVE":
        return Decision(
            allowed=False,
            reason_code="AUTH_INVALID",
            message="Person identity associated with membership is inactive or deceased.",
            evaluated_at=now,
            principal_id=principal_membership_id,
            action=action,
            target_resource_id=resource_id,
        )

    # Step 2: Super Admin Override
    super_admin_assignment = db.role_assignments.find_one({
        "tenant_id": tenant_id,
        "membership_id": principal_membership_id,
        "scope_type": "PLATFORM",
        "status": "ACTIVE",
        "$or": [
            {"valid_to": None},
            {"valid_to": {"$gt": now}},
        ],
        "$and": [
            {
                "$or": [
                    {"role_code": {"$in": ["SUPER_ADMIN", "ROLE_SUPER_ADMIN"]}},
                    {"role_id": {"$in": ["role_sys_super_admin", "SUPER_ADMIN", "ROLE_SUPER_ADMIN"]}},
                ]
            }
        ],
    })
    if super_admin_assignment:
        return Decision(
            allowed=True,
            reason_code="SUPER_ADMIN_OVERRIDE",
            message="Action permitted under Platform Super Administrator override.",
            evaluated_at=now,
            principal_id=principal_membership_id,
            action=action,
            target_resource_id=resource_id,
            matched_role_id=super_admin_assignment.get("role_id"),
        )

    # Step 3: Break-Glass Check
    if is_break_glass_active(tenant_id, principal_membership_id, target_scope_type, target_scope_id, db=db):
        return Decision(
            allowed=True,
            reason_code="BREAK_GLASS_ACTIVE",
            message="Emergency elevated break-glass session is active.",
            evaluated_at=now,
            principal_id=principal_membership_id,
            action=action,
            target_resource_id=resource_id,
        )

    # Step 4: Explicit Deny Check (Account/Membership level)
    if action in membership.get("explicit_deny_actions", []):
        return Decision(
            allowed=False,
            reason_code="EXPLICIT_DENY",
            message=f"Action '{action}' is explicitly denied for this membership.",
            evaluated_at=now,
            principal_id=principal_membership_id,
            action=action,
            target_resource_id=resource_id,
        )

    # Step 5: Separation of Duties (Dynamic SoD Check)
    if resource_id:
        sod_ok, sod_err = check_dynamic_sod(principal_membership_id, action, resource_id, db=db)
        if not sod_ok:
            return Decision(
                allowed=False,
                reason_code="SOD_CONFLICT",
                message=sod_err or "Action violates Separation of Duties four-eyes principle.",
                evaluated_at=now,
                principal_id=principal_membership_id,
                action=action,
                target_resource_id=resource_id,
            )

    # Step 6: Self-Action Check
    if resource_owner_id and (resource_owner_id == membership["person_id"] or resource_owner_id == principal_membership_id):
        # Check if user holds a SELF scope role that permits this action
        self_assignment = db.role_assignments.find_one({
            "tenant_id": tenant_id,
            "membership_id": principal_membership_id,
            "scope_type": "SELF",
            "status": "ACTIVE",
            "valid_to": {"$gt": now},
        })
        if self_assignment:
            role = db.roles.find_one({"role_id": self_assignment["role_id"], "tenant_id": tenant_id})
            if role and (action in role.get("permissions", []) or role.get("role_code") == "ROLE_STUDENT"):
                return Decision(
                    allowed=True,
                    reason_code="SELF_ACTION_PERMITTED",
                    message="Action permitted under personal self-scope authority.",
                    evaluated_at=now,
                    principal_id=principal_membership_id,
                    action=action,
                    target_resource_id=resource_id,
                    matched_role_id=self_assignment["role_id"],
                )

    # Step 7: Resolve Active Role Assignments & Delegations
    assignments = list(db.role_assignments.find({
        "tenant_id": tenant_id,
        "membership_id": principal_membership_id,
        "status": "ACTIVE",
        "$or": [
            {"valid_to": None},
            {"valid_to": {"$gt": now}},
        ],
    }))

    delegations = list(db.role_delegations.find({
        "tenant_id": tenant_id,
        "delegatee_membership_id": principal_membership_id,
        "status": "ACTIVE",
        "$or": [
            {"valid_to": None},
            {"valid_to": {"$gt": now}},
        ],
    }))

    if not assignments and not delegations:
        return Decision(
            allowed=False,
            reason_code="ROLE_EXPIRED",
            message="No active or valid role assignments or delegations found for principal.",
            evaluated_at=now,
            principal_id=principal_membership_id,
            action=action,
            target_resource_id=resource_id,
        )

    # Step 8-12: Evaluate Candidates
    matched_role_id = None
    matched_delegation_id = None
    has_permission = False
    scope_failed = False
    ceiling_failed = False

    # Check Direct Assignments First
    for a in assignments:
        role = db.roles.find_one({"$or": [{"role_id": a["role_id"]}, {"role_code": a.get("role_code", "")}]})
        if not role:
            continue
        v_doc = db.role_versions.find_one({"role_id": role["role_id"], "version_number": a.get("role_version", role.get("current_version", 1))})
        perms = set(role.get("permissions", []))
        if v_doc:
            perms.update(v_doc.get("permissions", []))

        if not any(act in perms for act in action_variants):
            continue

        has_permission = True

        # Check Scope Ceiling
        assign_rank = SCOPE_RANKS.get(a["scope_type"], 0)
        target_rank = SCOPE_RANKS.get(target_scope_type, 0)
        if assign_rank < target_rank:
            ceiling_failed = True
            continue

        # Check Downward Inheritance Scope Matching
        in_scope = is_in_scope(
            assignment_scope_type=a["scope_type"],
            assignment_scope_id=a["scope_id"],
            target_scope_type=target_scope_type,
            target_scope_id=target_scope_id,
            tenant_id=tenant_id,
            institution_id=membership.get("institution_id"),
            subject_person_id=membership["person_id"],
            target_resource_owner_id=resource_owner_id,
            db=db,
        )
        if not in_scope:
            scope_failed = True
            continue

        # Context Conditions (e.g. IP restrictions or time-of-day)
        ip_whitelist = a.get("ip_whitelist") or role.get("ip_whitelist")
        if ip_whitelist and ctx.get("ip_address"):
            client_ip = ipaddress.ip_address(ctx["ip_address"])
            allowed_nets = [ipaddress.ip_network(net, strict=False) for net in ip_whitelist]
            if not any(client_ip in net for net in allowed_nets):
                return Decision(
                    allowed=False,
                    reason_code="CONTEXT_VIOLATION",
                    message=f"Client IP '{ctx['ip_address']}' is not in authorized IP whitelist.",
                    evaluated_at=now,
                    principal_id=principal_membership_id,
                    action=action,
                    target_resource_id=resource_id,
                )

        # Successfully Authorized via Direct Assignment!
        return Decision(
            allowed=True,
            reason_code="ACTION_PERMITTED",
            message=f"Action '{action}' authorized under role '{role.get('name')}' ({a['scope_type']}).",
            evaluated_at=now,
            principal_id=principal_membership_id,
            action=action,
            target_resource_id=resource_id,
            matched_role_id=a["role_id"],
        )

    # Check Delegated Roles
    for d in delegations:
        if any(act in d.get("excluded_actions", []) for act in action_variants):
            continue

        role = db.roles.find_one({"$or": [{"role_id": d["role_id"]}, {"role_code": d.get("role_code", "")}]})
        if not role:
            continue
        v_doc = db.role_versions.find_one({"role_id": role["role_id"], "version_number": role.get("current_version", 1)})
        perms = set(role.get("permissions", []))
        if v_doc:
            perms.update(v_doc.get("permissions", []))

        if not any(act in perms for act in action_variants):
            continue

        has_permission = True

        in_scope = is_in_scope(
            assignment_scope_type=d["scope_type"],
            assignment_scope_id=d["scope_id"],
            target_scope_type=target_scope_type,
            target_scope_id=target_scope_id,
            tenant_id=tenant_id,
            institution_id=membership.get("institution_id"),
            db=db,
        )
        if not in_scope:
            scope_failed = True
            continue

        # Successfully Authorized via Delegation!
        return Decision(
            allowed=True,
            reason_code="ACTION_PERMITTED_DELEGATED",
            message=f"Action '{action}' authorized via active delegation from membership '{d['delegator_membership_id']}'.",
            evaluated_at=now,
            principal_id=principal_membership_id,
            action=action,
            target_resource_id=resource_id,
            matched_role_id=d["role_id"],
            delegation_id=d["delegation_id"],
        )

    # Determine Specific Rejection Reason
    if not has_permission:
        return Decision(
            allowed=False,
            reason_code="PERMISSION_NOT_GRANTED",
            message=f"Principal does not possess required permission '{action}'.",
            evaluated_at=now,
            principal_id=principal_membership_id,
            action=action,
            target_resource_id=resource_id,
        )

    if ceiling_failed:
        return Decision(
            allowed=False,
            reason_code="SCOPE_CEILING_EXCEEDED",
            message="Role assignment scope rank is lower than target resource scope rank.",
            evaluated_at=now,
            principal_id=principal_membership_id,
            action=action,
            target_resource_id=resource_id,
        )

    if scope_failed:
        return Decision(
            allowed=False,
            reason_code="SCOPE_MISMATCH",
            message="Target resource falls outside of the principal's authorized scope boundary.",
            evaluated_at=now,
            principal_id=principal_membership_id,
            action=action,
            target_resource_id=resource_id,
        )

    # Step 13: Default Deny
    return Decision(
        allowed=False,
        reason_code="DEFAULT_DENY",
        message="Default deny: No explicit authorization grant matched.",
        evaluated_at=now,
        principal_id=principal_membership_id,
        action=action,
        target_resource_id=resource_id,
    )
