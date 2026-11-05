"""CAMP-02: Identity, Membership & Authorization Architecture Domain Package.
Security foundation for the multi-tenant Campus Operating System.
"""

from camp_02.identities import create_person_identity, get_person_identity, merge_person_identities
from camp_02.accounts import create_account, authenticate_account, create_ai_agent_api_key, verify_ai_agent_api_key
from camp_02.memberships import create_institution_membership, transition_membership_status
from camp_02.permissions import ALL_PERMISSIONS, seed_baseline_permissions
from camp_02.roles import seed_baseline_roles, create_custom_role
from camp_02.scopes import is_in_scope, get_descendant_unit_ids
from camp_02.assignments import assign_role, revoke_role_assignment
from camp_02.delegation import create_role_delegation, revoke_role_delegation
from camp_02.governance import validate_static_sod, check_dynamic_sod
from camp_02.privileged import request_break_glass_access, revoke_break_glass_access
from camp_02.authorizer import can, Decision

__all__ = [
    "create_person_identity",
    "get_person_identity",
    "merge_person_identities",
    "create_account",
    "authenticate_account",
    "create_ai_agent_api_key",
    "verify_ai_agent_api_key",
    "create_institution_membership",
    "transition_membership_status",
    "ALL_PERMISSIONS",
    "seed_baseline_permissions",
    "seed_baseline_roles",
    "create_custom_role",
    "is_in_scope",
    "get_descendant_unit_ids",
    "assign_role",
    "revoke_role_assignment",
    "create_role_delegation",
    "revoke_role_delegation",
    "validate_static_sod",
    "check_dynamic_sod",
    "request_break_glass_access",
    "revoke_break_glass_access",
    "can",
    "Decision",
]
