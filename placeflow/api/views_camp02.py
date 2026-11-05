"""CAMP-02: Identity, Membership & Authorization Management REST API Endpoints.
Mounted under /api/v4/iam/ for full institutional security governance.
"""

from datetime import datetime, timezone
from typing import Any, Dict
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from database.connection import get_db
from camp_02.identities import create_person_identity, get_person_by_id
from camp_02.accounts import create_account, transition_account_status
from camp_02.memberships import create_institutional_membership, transition_membership_status
from camp_02.permissions import list_permissions
from camp_02.roles import get_role_by_id, create_institution_role
from camp_02.assignments import assign_role, revoke_role_assignment
from camp_02.delegation import create_role_delegation, revoke_role_delegation
from camp_02.privileged import request_break_glass_access, revoke_break_glass_access
from camp_02.sessions import create_auth_session, revoke_session, revoke_all_account_sessions
from camp_02.authorizer import can
from camp_02.provisioning import ingest_student_cohort


def _get_tenant_id(request) -> str:
    return request.headers.get("X-Tenant-ID") or request.query_params.get("tenant_id") or "global"


@api_view(["GET", "POST"])
def identities_view(request):
    db = get_db()
    if request.method == "GET":
        q = request.query_params.get("search", "").strip()
        query: Dict[str, Any] = {}
        if q:
            query = {
                "$or": [
                    {"primary_email": {"$regex": q, "$options": "i"}},
                    {"display_name": {"$regex": q, "$options": "i"}},
                    {"national_identifiers.identifier_value": q},
                ]
            }
        cursor = db.person_identities.find(query, {"_id": 0}).sort("created_at", -1).limit(50)
        return Response({"identities": list(cursor)})

    data = request.data
    try:
        doc = create_person_identity(
            primary_email=data["primary_email"],
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            date_of_birth=data.get("date_of_birth"),
            gender=data.get("gender"),
            national_identifiers=data.get("national_identifiers"),
            tenant_id=_get_tenant_id(request),
            db=db,
        )
        return Response(doc, status=status.HTTP_201_CREATED)
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def identity_detail_view(request, person_id: str):
    db = get_db()
    try:
        p = get_person_by_id(person_id, db=db)
        # Fetch memberships and accounts
        mems = list(db.institution_memberships.find({"person_id": person_id}, {"_id": 0}))
        accs = list(db.accounts.find({"person_id": person_id}, {"_id": 0}))
        return Response({"person": p, "memberships": mems, "accounts": accs})
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
def accounts_list_view(request):
    db = get_db()
    t_id = _get_tenant_id(request)
    cursor = db.accounts.find({}, {"_id": 0}).sort("created_at", -1).limit(50)
    return Response({"accounts": list(cursor)})


@api_view(["POST"])
def account_lock_view(request, account_id: str):
    db = get_db()
    reason = request.data.get("reason", "Administrative lockout")
    try:
        acc = transition_account_status(account_id, "LOCKED", reason=reason, db=db)
        # Invalidate all active sessions for this account
        revoke_all_account_sessions(account_id, reason="account_locked", db=db)
        return Response({"message": f"Account '{account_id}' locked.", "account": acc})
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def account_unlock_view(request, account_id: str):
    db = get_db()
    reason = request.data.get("reason", "Administrative unlock")
    try:
        acc = transition_account_status(account_id, "ACTIVE", reason=reason, db=db)
        return Response({"message": f"Account '{account_id}' unlocked.", "account": acc})
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
def memberships_view(request):
    db = get_db()
    t_id = _get_tenant_id(request)

    if request.method == "GET":
        query: Dict[str, Any] = {}
        if t_id and t_id != "global":
            query["tenant_id"] = t_id
        if request.query_params.get("institution_id"):
            query["institution_id"] = request.query_params["institution_id"]
        if request.query_params.get("membership_type"):
            query["membership_type"] = request.query_params["membership_type"]

        cursor = db.institution_memberships.find(query, {"_id": 0}).sort("created_at", -1).limit(100)
        return Response({"memberships": list(cursor)})

    data = request.data
    try:
        mem = create_institutional_membership(
            tenant_id=data.get("tenant_id") or t_id,
            institution_id=data["institution_id"],
            person_id=data["person_id"],
            account_id=data.get("account_id"),
            membership_type=data.get("membership_type", "STUDENT"),
            member_number=data.get("member_number"),
            department_id=data.get("department_id"),
            db=db,
        )
        return Response(mem, status=status.HTTP_201_CREATED)
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def membership_status_view(request, membership_id: str):
    db = get_db()
    new_status = request.data.get("status")
    reason = request.data.get("reason", "Status change")
    try:
        mem = transition_membership_status(membership_id, new_status, reason=reason, db=db)
        return Response({"message": f"Membership transitioned to {new_status}.", "membership": mem})
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def permissions_list_view(request):
    db = get_db()
    domain = request.query_params.get("domain")
    perms = list_permissions(domain=domain, db=db)
    return Response({"count": len(perms), "permissions": perms})


@api_view(["GET", "POST"])
def roles_view(request):
    db = get_db()
    t_id = _get_tenant_id(request)

    if request.method == "GET":
        query = {"$or": [{"role_owner_type": "PLATFORM"}, {"tenant_id": t_id}]}
        cursor = db.roles.find(query, {"_id": 0}).sort("role_name", 1)
        roles_list = list(cursor)
        # Attach active versions
        for r in roles_list:
            v = db.role_versions.find_one({"role_id": r["role_id"], "version_number": r.get("current_version", 1)}, {"_id": 0})
            if v:
                r["active_version"] = v
        return Response({"roles": roles_list})

    data = request.data
    try:
        r_doc = create_institution_role(
            tenant_id=t_id,
            institution_id=data["institution_id"],
            role_code=data["role_code"],
            role_name=data["role_name"],
            role_category=data.get("role_category", "ACADEMIC"),
            max_allowed_scope=data.get("max_allowed_scope", "ORGANIZATIONAL_UNIT"),
            initial_permissions=data.get("permissions", []),
            description=data.get("description"),
            created_by=data.get("created_by", "system"),
            db=db,
        )
        return Response(r_doc, status=status.HTTP_201_CREATED)
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
def assignments_view(request):
    db = get_db()
    t_id = _get_tenant_id(request)

    if request.method == "GET":
        query: Dict[str, Any] = {}
        if t_id and t_id != "global":
            query["tenant_id"] = t_id
        if request.query_params.get("membership_id"):
            query["membership_id"] = request.query_params["membership_id"]
        cursor = db.role_assignments.find(query, {"_id": 0}).sort("assigned_at", -1).limit(100)
        return Response({"assignments": list(cursor)})

    data = request.data
    try:
        asgn = assign_role(
            tenant_id=data.get("tenant_id") or t_id,
            institution_id=data.get("institution_id"),
            membership_id=data.get("membership_id"),
            account_id=data.get("account_id"),
            role_id=data["role_id"],
            scope_type=data.get("scope_type", "ORGANIZATIONAL_UNIT"),
            scope_id=data.get("scope_id", ""),
            db=db,
        )
        return Response(asgn, status=status.HTTP_201_CREATED)
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def assignment_revoke_view(request, assignment_id: str):
    db = get_db()
    reason = request.data.get("reason", "Revoked by administrator")
    try:
        asgn = revoke_role_assignment(assignment_id, reason=reason, db=db)
        return Response({"message": f"Assignment '{assignment_id}' revoked.", "assignment": asgn})
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
def delegations_view(request):
    db = get_db()
    t_id = _get_tenant_id(request)

    if request.method == "GET":
        cursor = db.role_delegations.find({"tenant_id": t_id}, {"_id": 0}).sort("created_at", -1).limit(50)
        return Response({"delegations": list(cursor)})

    data = request.data
    try:
        v_from = datetime.fromisoformat(data["valid_from"]) if "valid_from" in data else datetime.now(timezone.utc)
        v_to = datetime.fromisoformat(data["valid_to"])
        del_doc = create_role_delegation(
            tenant_id=t_id,
            institution_id=data["institution_id"],
            delegator_membership_id=data["delegator_membership_id"],
            delegatee_membership_id=data["delegatee_membership_id"],
            role_id=data["role_id"],
            scope_type=data.get("scope_type", "ORGANIZATIONAL_UNIT"),
            scope_id=data.get("scope_id", ""),
            valid_from=v_from,
            valid_to=v_to,
            reason=data.get("reason", "Temporary operational cover"),
            excluded_actions=data.get("excluded_actions"),
            db=db,
        )
        return Response(del_doc, status=status.HTTP_201_CREATED)
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def delegation_revoke_view(request, delegation_id: str):
    db = get_db()
    t_id = _get_tenant_id(request)
    reason = request.data.get("reason", "Delegation revoked")
    try:
        d = revoke_role_delegation(delegation_id, t_id, revoked_by="admin", revocation_reason=reason, db=db)
        return Response({"message": "Delegation revoked.", "delegation": d})
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def break_glass_view(request):
    db = get_db()
    t_id = _get_tenant_id(request)
    data = request.data
    try:
        bg = request_break_glass_access(
            tenant_id=t_id,
            institution_id=data["institution_id"],
            membership_id=data["membership_id"],
            incident_ticket_id=data["incident_ticket_id"],
            justification=data["justification"],
            target_scope_type=data.get("scope_type", "INSTITUTION"),
            target_scope_id=data.get("scope_id", data["institution_id"]),
            duration_hours=int(data.get("duration_hours", 2)),
            db=db,
        )
        return Response(bg, status=status.HTTP_201_CREATED)
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def sessions_view(request):
    db = get_db()
    cursor = db.auth_sessions.find({"status": "ACTIVE"}, {"_id": 0, "token_hash": 0}).sort("last_activity_at", -1).limit(50)
    return Response({"sessions": list(cursor)})


@api_view(["POST"])
def session_revoke_view(request, session_id: str):
    db = get_db()
    success = revoke_session(session_id, reason="Admin revoked", db=db)
    if success:
        return Response({"message": f"Session '{session_id}' terminated."})
    return Response({"error": "Session not found or already inactive."}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
def authorize_check_view(request):
    db = get_db()
    t_id = _get_tenant_id(request)
    data = request.data
    try:
        dec = can(
            tenant_id=t_id,
            principal_membership_id=data["membership_id"],
            action=data["action"],
            resource=data.get("resource", {}),
            context=data.get("context", {}),
            db=db,
        )
        return Response({
            "allowed": dec.allowed,
            "reason_code": dec.reason_code,
            "message": dec.message,
            "evaluated_at": dec.evaluated_at.isoformat(),
            "principal_id": dec.principal_id,
            "action": dec.action,
            "matched_role_id": dec.matched_role_id,
            "delegation_id": dec.delegation_id,
        })
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def provision_students_view(request):
    db = get_db()
    t_id = _get_tenant_id(request)
    data = request.data
    try:
        res = ingest_student_cohort(
            tenant_id=t_id,
            institution_id=data["institution_id"],
            student_records=data.get("students", []),
            default_campus_id=data.get("campus_id"),
            db=db,
        )
        return Response(res, status=status.HTTP_200_OK)
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

