"""PlaceFlow / Meridian — Session Token Authentication Engine (Phase 2).

Reads HttpOnly cookie `pf_session` (fallback `Authorization: Bearer <token>`).
Validates session with sliding activity expiration, verifies strict tenant binding,
enforces CSRF for cookie-based state-mutating requests, and constructs the Principal context.
"""

from typing import Optional, Tuple
from django.conf import settings
from rest_framework.authentication import BaseAuthentication, CSRFCheck
from rest_framework import exceptions

from database.connection import get_db
from camp_02.sessions import validate_session
from api.auth.principal import Principal, build_principal


class SessionTokenAuthentication(BaseAuthentication):
    """Authoritative Django REST Framework authentication scheme using CAMP-02 auth sessions."""

    def authenticate(self, request) -> Optional[Tuple[Principal, str]]:
        raw_token: Optional[str] = None
        is_cookie_auth = False

        # 1. Primary: HttpOnly Session Cookie
        if "pf_session" in request.COOKIES:
            raw_token = request.COOKIES["pf_session"]
            is_cookie_auth = True

        # 2. Secondary Fallback: Authorization: Bearer <token>
        if not raw_token:
            auth_header = request.META.get("HTTP_AUTHORIZATION", "")
            if auth_header.startswith("Bearer "):
                raw_token = auth_header.split(" ", 1)[1].strip()

        if not raw_token:
            return None  # Unauthenticated request

        db = get_db()
        sess = validate_session(raw_token, db=db)
        if not sess:
            raise exceptions.AuthenticationFailed("Invalid or expired session token")

        # 3. Tenant Binding Verification
        req_tenant = request.META.get("HTTP_X_TENANT_ID")
        if req_tenant and req_tenant != sess.get("tenant_id"):
            raise exceptions.PermissionDenied("TenantMismatch")

        # 4. Enforce CSRF on Cookie Auth for unsafe HTTP methods
        if is_cookie_auth and request.method not in ("GET", "HEAD", "OPTIONS", "TRACE"):
            self.enforce_csrf(request)

        # 5. Build authoritative Principal
        try:
            principal = build_principal(
                account_id=sess["account_id"],
                tenant_id=sess["tenant_id"],
                institution_id=sess.get("institution_id"),
                db=db,
            )
        except LookupError as exc:
            raise exceptions.AuthenticationFailed(f"Account identity not found: {exc}")

        # Store session record on request for audit and logout actions
        request.session_record = sess
        return (principal, raw_token)

    def enforce_csrf(self, request):
        """Enforces Django CSRF validation for cookie-authenticated requests."""
        check = CSRFCheck(request)
        check.process_request(request)
        reason = check.process_view(request, None, (), {})
        if reason:
            raise exceptions.PermissionDenied(f"CSRF Failed: {reason}")

    def authenticate_header(self, request) -> str:
        return "Bearer"

