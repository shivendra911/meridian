"""PlaceFlow / Meridian — Account Lifecycle & Self-Service Views (Phase 2).

Implements:
- POST /api/auth/accept-invite/
- POST /api/auth/claim/start/
- POST /api/auth/claim/verify/
- POST /api/auth/password/forgot/
- POST /api/auth/password/reset/
- GET  /api/admin/claims/
- POST /api/admin/claims/<claim_id>/resolve/
- POST /api/admin/affiliations/link/
- POST /api/admin/affiliations/unlink/
- POST /api/admin/accounts/<account_id>/resend-invite/
- POST /api/admin/accounts/<account_id>/force-reset/
- POST /api/admin/accounts/<account_id>/deactivate/
"""

import logging
import secrets
import uuid
from datetime import datetime, timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.throttling import ScopedRateThrottle

from database.connection import get_db
from camp_02.accounts import (
    create_account,
    set_account_password,
    transition_account_status,
    get_account_by_id,
    AccountNotFoundError,
)
from camp_02.assignments import assign_role
from camp_02.identities import create_person_identity
from camp_02.mailer import send_lifecycle_email
from camp_02.sessions import revoke_all_account_sessions
from camp_02.tokens import (
    create_invite_token,
    create_reset_token,
    create_claim_otp,
    verify_and_consume_token,
    verify_and_consume_claim_otp,
    TokenError,
    TokenInvalidError,
    TokenExpiredError,
    TokenLockedError,
)
from api.auth.audit import audit_log
from api.auth.permissions import any_of

logger = logging.getLogger("meridian.lifecycle")

GENERIC_CLAIM_MSG = "If a record matches, we sent a verification code to your institutional email."
GENERIC_FORGOT_MSG = "If an account matches that email, we sent a password reset link."

ADMIN_IAM_PERMS = any_of(
    "iam.account.create",
    "iam.membership.invite",
    "iam.membership.activate",
    "student.verification.approve",
)


class AcceptInviteView(APIView):
    """Consumes an invitation token, sets the initial account password, and activates the account."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        token = (request.data.get("token") or "").strip()
        password = request.data.get("password") or ""

        if not token or not password:
            return Response(
                {"error": "Token and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(password) < 8:
            return Response(
                {"error": "Password must be at least 8 characters in length."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        db = get_db()
        try:
            token_doc = verify_and_consume_token(token, purpose="INVITE", db=db)
        except TokenExpiredError:
            return Response(
                {"error": "Invitation token has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except TokenInvalidError:
            return Response(
                {"error": "Invalid or already used invitation token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        account_id = token_doc["account_id"]
        try:
            acc = get_account_by_id(account_id, db=db)
        except AccountNotFoundError:
            return Response(
                {"error": "Associated account not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Set password credential
        set_account_password(account_id, password, db=db)

        # Transition account from INVITED to ACTIVE
        if acc.get("status") == "INVITED":
            transition_account_status(
                account_id=account_id,
                new_status="ACTIVE",
                reason="Invitation accepted",
                actor_id=account_id,
                db=db,
            )

        # Mark affiliations as VERIFIED (source: IMPORT)
        now = datetime.now(timezone.utc)
        person_id = acc.get("person_id")
        if person_id:
            db.person_affiliations.update_many(
                {"person_id": person_id, "status": "UNVERIFIED"},
                {
                    "$set": {
                        "status": "VERIFIED",
                        "source": "IMPORT",
                        "verified_at": now,
                        "verified_by": "SYSTEM_INVITE",
                    }
                },
            )

        return Response(
            {"message": "Account activated successfully. You can now log in."},
            status=status.HTTP_200_OK,
        )


class ClaimStartView(APIView):
    """Step 1 of self-service claim: sends a 6-digit OTP to the institutional email on file.

    Always returns 200 with the exact same message to prevent record enumeration attacks.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "claim_start"

    def post(self, request):
        reg_no = (request.data.get("registration_no") or "").strip()
        submitted_email = (request.data.get("institutional_email") or "").strip().lower()

        fallback_claim_id = f"clm_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)
        db = get_db()

        if not reg_no or not submitted_email:
            return Response(
                {"message": GENERIC_CLAIM_MSG, "claim_id": fallback_claim_id},
                status=status.HTTP_200_OK,
            )

        # Look up student record by reg_no or student_id
        student = db.students.find_one({"$or": [{"reg_no": reg_no}, {"student_id": reg_no}]})

        if not student:
            # Record ambiguous / not-found claim in admin queue
            db.claim_requests.insert_one({
                "claim_id": fallback_claim_id,
                "tenant_id": "tenant_default",
                "registration_no": reg_no,
                "email_submitted": submitted_email,
                "student_id": None,
                "status": "PENDING",
                "notes": "No matching student record found for registration number",
                "created_at": now,
                "resolved_at": None,
                "resolved_by": None,
            })
            return Response(
                {"message": GENERIC_CLAIM_MSG, "claim_id": fallback_claim_id},
                status=status.HTTP_200_OK,
            )

        student_id = student["student_id"]
        tenant_id = student.get("tenant_id") or "tenant_default"
        student_email = (student.get("email") or "").strip().lower()

        # Check if already claimed / verified
        existing_aff = db.person_affiliations.find_one({
            "type": "STUDENT",
            "record_id": student_id,
            "status": "VERIFIED",
        })
        existing_active_acc = None
        if student.get("person_id"):
            existing_active_acc = db.accounts.find_one({
                "person_id": student["person_id"],
                "status": "ACTIVE",
            })

        if existing_aff or existing_active_acc:
            db.claim_requests.insert_one({
                "claim_id": fallback_claim_id,
                "tenant_id": tenant_id,
                "registration_no": reg_no,
                "email_submitted": submitted_email,
                "student_id": student_id,
                "status": "PENDING",
                "notes": "Student record already claimed by active account",
                "created_at": now,
                "resolved_at": None,
                "resolved_by": None,
            })
            return Response(
                {"message": GENERIC_CLAIM_MSG, "claim_id": fallback_claim_id},
                status=status.HTTP_200_OK,
            )

        # Verify whether submitted email matches the institutional email on record
        if submitted_email != student_email:
            db.claim_requests.insert_one({
                "claim_id": fallback_claim_id,
                "tenant_id": tenant_id,
                "registration_no": reg_no,
                "email_submitted": submitted_email,
                "student_id": student_id,
                "status": "PENDING",
                "notes": f"Email mismatch: submitted '{submitted_email}' vs on-record '{student_email}'",
                "created_at": now,
                "resolved_at": None,
                "resolved_by": None,
            })
            return Response(
                {"message": GENERIC_CLAIM_MSG, "claim_id": fallback_claim_id},
                status=status.HTTP_200_OK,
            )

        # Valid unclaimed record with matching institutional email: create claim OTP
        claim_id, raw_otp, _ = create_claim_otp(
            student_id=student_id,
            registration_no=reg_no,
            institutional_email=student_email,
            tenant_id=tenant_id,
            expires_in_minutes=10,
            db=db,
        )

        send_lifecycle_email(
            to_email=student_email,
            subject="Meridian Account Claim Verification Code",
            body=(
                f"Hello {student.get('name', 'Student')},\n\n"
                f"Your 6-digit Meridian claim verification code is: {raw_otp}\n\n"
                f"This code will expire in 10 minutes. Enter it to complete activating your Meridian account."
            ),
        )

        return Response(
            {"message": GENERIC_CLAIM_MSG, "claim_id": claim_id},
            status=status.HTTP_200_OK,
        )


class ClaimVerifyView(APIView):
    """Step 2 of self-service claim: verifies 6-digit OTP, creates Account and sets affiliation VERIFIED."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        claim_id = (request.data.get("claim_id") or "").strip()
        otp = (request.data.get("otp") or "").strip()
        password = request.data.get("password") or ""

        if not claim_id or not otp or not password:
            return Response(
                {"error": "Claim ID, verification code, and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(password) < 8:
            return Response(
                {"error": "Password must be at least 8 characters in length."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        db = get_db()
        try:
            token = verify_and_consume_claim_otp(claim_id=claim_id, raw_otp=otp, db=db)
        except TokenLockedError as exc:
            return Response(
                {"error": str(exc), "locked": True},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except TokenExpiredError as exc:
            return Response(
                {"error": str(exc), "expired": True},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except TokenInvalidError as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        meta = token.get("metadata", {})
        student_id = meta.get("student_id")
        tenant_id = meta.get("tenant_id") or "tenant_default"

        student = db.students.find_one({"student_id": student_id})
        if not student:
            return Response(
                {"error": "Student record not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # 1. Authoritative Person Identity
        person_id = student.get("person_id")
        if not person_id or not db.person_identities.find_one({"person_id": person_id}):
            name_parts = (student.get("name") or "Student").split(" ", 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ""
            person_doc = create_person_identity(
                first_name=first_name,
                last_name=last_name,
                primary_email=student["email"],
                tenant_id=tenant_id,
                actor_id="system_claim",
                db=db,
            )
            person_id = person_doc["person_id"]
            db.students.update_one(
                {"student_id": student_id},
                {"$set": {"person_id": person_id}},
            )

        # 2. Account
        account = db.accounts.find_one({"person_id": person_id})
        if account:
            account_id = account["account_id"]
            if account.get("status") != "ACTIVE":
                transition_account_status(
                    account_id=account_id,
                    new_status="ACTIVE",
                    reason="Self-service claim completed",
                    actor_id=account_id,
                    db=db,
                )
            set_account_password(account_id, password, db=db)
        else:
            base_username = student["email"].split("@")[0].lower()
            norm_username = base_username
            if db.accounts.find_one({"username": norm_username}):
                norm_username = f"{base_username}_{secrets.randbelow(1000)}"

            account = create_account(
                person_id=person_id,
                username=norm_username,
                email=student["email"],
                password=password,
                status="ACTIVE",
                tenant_id=tenant_id,
                actor_id=person_id,
                db=db,
            )
            account_id = account["account_id"]

        # 3. Person Affiliation: set VERIFIED (source CLAIM)
        now = datetime.now(timezone.utc)
        aff_id = f"aff_{uuid.uuid4().hex[:12]}"
        db.person_affiliations.update_one(
            {
                "tenant_id": tenant_id,
                "type": "STUDENT",
                "record_id": student_id,
            },
            {
                "$set": {
                    "affiliation_id": aff_id,
                    "tenant_id": tenant_id,
                    "person_id": person_id,
                    "type": "STUDENT",
                    "record_id": student_id,
                    "status": "VERIFIED",
                    "source": "CLAIM",
                    "verified_at": now,
                    "verified_by": "SELF_CLAIM",
                    "created_at": now,
                }
            },
            upsert=True,
        )

        # 4. Assign STUDENT_MEMBER role if available
        student_role = db.roles.find_one({"role_code": "STUDENT_MEMBER"})
        if student_role:
            try:
                assign_role(
                    tenant_id=tenant_id,
                    account_id=account_id,
                    role_id=student_role["role_id"],
                    scope_type="TENANT",
                    scope_id=tenant_id,
                    assigned_by="self_claim",
                    db=db,
                )
            except Exception as exc:
                logger.warning("Role assignment on claim: %s", exc)

        return Response(
            {
                "message": "Account created and verified successfully. You can now log in.",
                "account_id": account_id,
            },
            status=status.HTTP_200_OK,
        )


class PasswordForgotView(APIView):
    """Requests a single-use password reset link.

    Always returns 200 with generic message to prevent account enumeration.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_forgot"

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        db = get_db()

        if not email:
            return Response({"message": GENERIC_FORGOT_MSG}, status=status.HTTP_200_OK)

        account = db.accounts.find_one({
            "email": email,
            "status": {"$in": ["ACTIVE", "INVITED"]},
        })

        if account:
            tenant_id = account.get("tenant_id") or "tenant_default"
            raw_token, _ = create_reset_token(
                account_id=account["account_id"],
                tenant_id=tenant_id,
                expires_in_hours=1,
                db=db,
            )
            reset_link = f"/reset-password?token={raw_token}"
            send_lifecycle_email(
                to_email=email,
                subject="Meridian Password Reset Link",
                body=(
                    "We received a request to reset your Meridian account password.\n\n"
                    "Click the link below to set a new password. The link expires in 1 hour.\n\n"
                    "If you did not make this request, you can safely ignore this email."
                ),
                link=reset_link,
            )

        return Response({"message": GENERIC_FORGOT_MSG}, status=status.HTTP_200_OK)


class PasswordResetView(APIView):
    """Consumes a password reset token, sets the new password, and revokes all existing sessions."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        token = (request.data.get("token") or "").strip()
        password = request.data.get("password") or ""

        if not token or not password:
            return Response(
                {"error": "Token and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(password) < 8:
            return Response(
                {"error": "Password must be at least 8 characters in length."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        db = get_db()
        try:
            token_doc = verify_and_consume_token(token, purpose="RESET", db=db)
        except TokenExpiredError:
            return Response(
                {"error": "Password reset token has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except TokenInvalidError:
            return Response(
                {"error": "Invalid or already used password reset token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        account_id = token_doc["account_id"]
        set_account_password(account_id, password, db=db)

        # Spec: revokes all sessions on password reset
        revoke_all_account_sessions(account_id, db=db, reason="PASSWORD_RESET")

        return Response(
            {"message": "Password updated successfully. Please log in with your new password."},
            status=status.HTTP_200_OK,
        )


# --- Admin Claims & Affiliation Lifecycle Management --------------------------

class AdminClaimsListView(APIView):
    """Lists student claim requests for administrative review."""
    permission_classes = [ADMIN_IAM_PERMS]

    def get(self, request):
        status_filter = request.query_params.get("status")
        query = {}
        if status_filter:
            query["status"] = status_filter.upper()

        db = get_db()
        claims = list(db.claim_requests.find(query, {"_id": 0}).sort("created_at", -1))
        return Response({"claims": claims, "count": len(claims)}, status=status.HTTP_200_OK)


class AdminClaimsResolveView(APIView):
    """Resolves a pending student claim request (APPROVE or REJECT)."""
    permission_classes = [ADMIN_IAM_PERMS]

    def post(self, request, claim_id: str):
        action = (request.data.get("action") or "").upper()
        notes = request.data.get("notes") or ""

        if action not in ["APPROVE", "REJECT"]:
            return Response(
                {"error": "Action must be APPROVE or REJECT."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        db = get_db()
        claim = db.claim_requests.find_one({"claim_id": claim_id})
        if not claim:
            return Response(
                {"error": "Claim request not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        now = datetime.now(timezone.utc)
        actor_id = getattr(request.user, "account_id", "admin")
        target_status = "APPROVED" if action in ["APPROVE", "APPROVED"] else "REJECTED"

        db.claim_requests.update_one(
            {"claim_id": claim_id},
            {
                "$set": {
                    "status": target_status,
                    "notes": notes,
                    "resolved_at": now,
                    "resolved_by": actor_id,
                }
            },
        )

        audit_log(
            event_type=f"CLAIM_{target_status}",
            principal=request.user,
            permission="iam.account.create",
            path=request.path,
            method=request.method,
            decision="ALLOWED",
            reason_code=f"ADMIN_{target_status}",
            details={"claim_id": claim_id, "student_id": claim.get("student_id")},
        )

        return Response(
            {"message": f"Claim request {claim_id} resolved as {target_status}."},
            status=status.HTTP_200_OK,
        )


class AdminAffiliationLinkView(APIView):
    """Links an authoritative person identity to an institutional record."""
    permission_classes = [ADMIN_IAM_PERMS]

    def post(self, request):
        person_id = (request.data.get("person_id") or "").strip()
        aff_type = (request.data.get("type") or "").strip().upper()
        record_id = (request.data.get("record_id") or "").strip()
        tenant_id = request.data.get("tenant_id") or getattr(request.user, "tenant_id", "tenant_default")

        if not person_id or not aff_type or not record_id:
            return Response(
                {"error": "person_id, type, and record_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        db = get_db()
        # Verify person exists
        if not db.person_identities.find_one({"person_id": person_id}):
            return Response(
                {"error": "Person identity not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check unique constraint: (tenant_id, type, record_id)
        existing = db.person_affiliations.find_one({
            "tenant_id": tenant_id,
            "type": aff_type,
            "record_id": record_id,
        })
        if existing and existing.get("person_id") != person_id and existing.get("status") != "REVOKED":
            return Response(
                {"error": f"Record '{record_id}' is already affiliated with another person."},
                status=status.HTTP_409_CONFLICT,
            )

        now = datetime.now(timezone.utc)
        aff_id = f"aff_{uuid.uuid4().hex[:12]}"
        db.person_affiliations.update_one(
            {
                "tenant_id": tenant_id,
                "type": aff_type,
                "record_id": record_id,
            },
            {
                "$set": {
                    "affiliation_id": aff_id,
                    "tenant_id": tenant_id,
                    "person_id": person_id,
                    "type": aff_type,
                    "record_id": record_id,
                    "status": "VERIFIED",
                    "source": "ADMIN",
                    "verified_at": now,
                    "verified_by": getattr(request.user, "account_id", "admin"),
                    "updated_at": now,
                },
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )

        return Response(
            {"message": "Affiliation linked successfully.", "affiliation_id": aff_id},
            status=status.HTTP_200_OK,
        )


class AdminAffiliationUnlinkView(APIView):
    """Unlinks or revokes an affiliation.

    Cannot remove the last affiliation of an active student without explicit confirmation.
    """
    permission_classes = [ADMIN_IAM_PERMS]

    def post(self, request):
        affiliation_id = (request.data.get("affiliation_id") or "").strip()
        confirm_last = bool(request.data.get("confirm_last", False))

        if not affiliation_id:
            return Response(
                {"error": "affiliation_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        db = get_db()
        aff = db.person_affiliations.find_one({"affiliation_id": affiliation_id})
        if not aff:
            return Response(
                {"error": "Affiliation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        person_id = aff["person_id"]
        # Check active affiliations count
        active_affs = list(db.person_affiliations.find({
            "person_id": person_id,
            "status": "VERIFIED",
        }))

        if len(active_affs) <= 1 and not confirm_last:
            return Response(
                {
                    "error": "Cannot remove the last active affiliation of a user without explicit confirmation.",
                    "requires_confirmation": True,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = datetime.now(timezone.utc)
        db.person_affiliations.update_one(
            {"affiliation_id": affiliation_id},
            {
                "$set": {
                    "status": "REVOKED",
                    "revoked_at": now,
                    "revoked_by": getattr(request.user, "account_id", "admin"),
                    "updated_at": now,
                }
            },
        )

        return Response(
            {"message": "Affiliation revoked successfully."},
            status=status.HTTP_200_OK,
        )


class AdminAccountResendInviteView(APIView):
    """Generates a new invitation token and sends an invite email to an INVITED account."""
    permission_classes = [ADMIN_IAM_PERMS]

    def post(self, request, account_id: str):
        db = get_db()
        acc = db.accounts.find_one({"account_id": account_id})
        if not acc:
            return Response({"error": "Account not found."}, status=status.HTTP_404_NOT_FOUND)

        tenant_id = acc.get("tenant_id") or "tenant_default"
        raw_token, _ = create_invite_token(
            account_id=account_id,
            tenant_id=tenant_id,
            expires_in_days=7,
            db=db,
        )

        invite_link = f"/accept-invite?token={raw_token}"
        send_lifecycle_email(
            to_email=acc["email"],
            subject="Meridian Account Invitation",
            body=(
                f"You have been invited to Meridian.\n\n"
                f"Click the link below to accept your invitation and set your password.\n\n"
                f"The link will expire in 7 days."
            ),
            link=invite_link,
        )

        return Response(
            {"message": "Invitation resent successfully."},
            status=status.HTTP_200_OK,
        )


class AdminAccountForceResetView(APIView):
    """Forces a password reset link to be sent to an account and revokes their active sessions."""
    permission_classes = [ADMIN_IAM_PERMS]

    def post(self, request, account_id: str):
        db = get_db()
        acc = db.accounts.find_one({"account_id": account_id})
        if not acc:
            return Response({"error": "Account not found."}, status=status.HTTP_404_NOT_FOUND)

        tenant_id = acc.get("tenant_id") or "tenant_default"
        raw_token, _ = create_reset_token(
            account_id=account_id,
            tenant_id=tenant_id,
            expires_in_hours=1,
            db=db,
        )

        # Revoke sessions immediately
        revoke_all_account_sessions(account_id, db=db, reason="ADMIN_FORCE_RESET")

        reset_link = f"/reset-password?token={raw_token}"
        send_lifecycle_email(
            to_email=acc["email"],
            subject="Meridian Security Notice: Password Reset Required",
            body=(
                f"An administrator has requested a password reset for your Meridian account.\n\n"
                f"Click the link below to set a new password."
            ),
            link=reset_link,
        )

        return Response(
            {"message": "Password reset link generated and active sessions revoked."},
            status=status.HTTP_200_OK,
        )


class AdminAccountDeactivateView(APIView):
    """Deactivates / terminates an account and revokes all active sessions."""
    permission_classes = [ADMIN_IAM_PERMS]

    def post(self, request, account_id: str):
        reason = request.data.get("reason") or "Administrative deactivation"
        db = get_db()
        try:
            transition_account_status(
                account_id=account_id,
                new_status="TERMINATED",
                reason=reason,
                actor_id=getattr(request.user, "account_id", "admin"),
                db=db,
            )
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        revoke_all_account_sessions(account_id, db=db, reason="ACCOUNT_TERMINATED")

        return Response(
            {"message": "Account terminated and sessions revoked."},
            status=status.HTTP_200_OK,
        )
