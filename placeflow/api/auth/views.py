"""PlaceFlow / Meridian — Authentication Endpoints & Session Dispatcher (Phase 2).

Implements the contract defined in docs/RBAC_SPEC.md Section 5:
- GET  /api/auth/csrf/           -> Sets CSRF cookie and returns token
- POST /api/auth/login/          -> Validates credentials, sets HttpOnly cookie, returns { me }
- POST /api/auth/logout/         -> Revokes session, deletes cookie, returns 200
- GET  /api/auth/me/             -> Returns authenticated Principal contract, 401 if unauthenticated
- POST /api/auth/switch-context/ -> Switches active institutional context within valid session
"""

from django.conf import settings
from django.middleware.csrf import get_token
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from rest_framework import status

from database.connection import get_db
from camp_02.accounts import authenticate_account_credentials
from camp_02.sessions import create_auth_session, revoke_session, validate_session
from api.auth.principal import build_principal


class CsrfTokenView(APIView):
    """Issues and sets the CSRF token cookie for single-page applications."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        token = get_token(request)
        return Response({"csrfToken": token}, status=status.HTTP_200_OK)


class LoginView(APIView):
    """Validates user credentials, creates an active CAMP-02 session, and sets HttpOnly cookie."""
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        password = request.data.get("password") or ""
        req_tenant = request.data.get("tenant_id")

        if not username or not password:
            return Response(
                {"error": "InvalidCredentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        db = get_db()
        ok, account, msg = authenticate_account_credentials(
            username=username,
            password=password,
            db=db,
            raise_on_error=False,
        )

        if not ok or not account:
            return Response(
                {"error": "InvalidCredentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Resolve tenant and institution context
        tenant_id = req_tenant or account.get("tenant_id")
        if not tenant_id:
            tenant = db.platform_tenants.find_one({"status": "ACTIVE"})
            tenant_id = tenant["id"] if tenant else "ten_default"

        inst = db.institutions.find_one({"tenant_id": tenant_id})
        institution_id = inst["institution_id"] if inst else "inst_default"

        ip = request.META.get("REMOTE_ADDR")
        ua = request.META.get("HTTP_USER_AGENT", "")

        sess = create_auth_session(
            account_id=account["account_id"],
            tenant_id=tenant_id,
            institution_id=institution_id,
            ip_address=ip,
            user_agent=ua,
            auth_assurance="AAL1_PASSWORD",
            lifespan_hours=24,
            db=db,
        )

        principal = build_principal(
            account_id=account["account_id"],
            tenant_id=tenant_id,
            institution_id=institution_id,
            db=db,
        )

        response = Response({"me": principal.to_dict()}, status=status.HTTP_200_OK)
        response.set_cookie(
            "pf_session",
            sess["raw_token"],
            httponly=True,
            samesite="Lax",
            secure=not settings.DEBUG,
            max_age=24 * 3600,
        )
        return response


class LogoutView(APIView):
    """Terminates active user session and clears the session cookie."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        db = get_db()

        # 1. Revoke by active session record on request
        sess_record = getattr(request, "session_record", None)
        if sess_record:
            revoke_session(sess_record["session_id"], reason="user_logout", db=db)
        else:
            # Fallback: check cookie or bearer header directly
            raw_token = request.COOKIES.get("pf_session")
            if not raw_token:
                auth_h = request.META.get("HTTP_AUTHORIZATION", "")
                if auth_h.startswith("Bearer "):
                    raw_token = auth_h.split(" ", 1)[1].strip()

            if raw_token:
                sess = validate_session(raw_token, db=db)
                if sess:
                    revoke_session(sess["session_id"], reason="user_logout", db=db)

        response = Response({"success": True}, status=status.HTTP_200_OK)
        response.delete_cookie("pf_session")
        return response


class MeView(APIView):
    """Returns the authenticated principal contract payload."""
    def get(self, request):
        if not request.user or not getattr(request.user, "is_authenticated", False):
            return Response(
                {"error": "Unauthorized"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(request.user.to_dict(), status=status.HTTP_200_OK)


class SwitchContextView(APIView):
    """Switches active institution or campus context within the current validated session."""
    def post(self, request):
        if not request.user or not getattr(request.user, "is_authenticated", False):
            return Response(
                {"error": "Unauthorized"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        new_inst_id = request.data.get("institution_id")
        if not new_inst_id:
            return Response(
                {"error": "MissingInstitutionId"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        db = get_db()
        sess_record = getattr(request, "session_record", None)
        if sess_record:
            db.auth_sessions.update_one(
                {"session_id": sess_record["session_id"]},
                {"$set": {"institution_id": new_inst_id}},
            )

        updated_principal = build_principal(
            account_id=request.user.account_id,
            tenant_id=request.user.tenant_id,
            institution_id=new_inst_id,
            db=db,
        )

        return Response({"me": updated_principal.to_dict()}, status=status.HTTP_200_OK)

