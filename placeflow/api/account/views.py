"""PlaceFlow / Meridian — Account & Profile Management API Views (Phase 1).

Implements:
- Full composed profile retrieval (GET /api/account/profile/)
- Self-asserted allowlist updates (PATCH /api/account/profile/)
- Secure avatar upload and serving (POST /api/account/avatar/ & GET /api/media/avatar/<id>/)
- RBAC-masked person cards (GET /api/people/<id>/card/)
- Active session management & password change
- Notifications inbox & mark-as-read
"""

from datetime import datetime, timezone
import io
import os
from pathlib import Path
import uuid
from typing import Any, Dict

from django.conf import settings
from django.http import HttpResponse, Http404
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from database.connection import get_db
from camp_02.accounts import set_account_password, authenticate_account_credentials
from camp_02.sessions import list_account_sessions, revoke_session, revoke_all_account_sessions
from api.account.profile_service import (
    get_full_composed_profile,
    update_self_profile,
    get_person_card,
)

AVATAR_MAX_BYTES = 2 * 1024 * 1024  # 2 MB limit
AVATAR_ALLOWED_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
MEDIA_DIR = getattr(settings, "MEDIA_ROOT", None) or (Path(__file__).resolve().parent.parent.parent / "media")
if not isinstance(MEDIA_DIR, Path) or not str(MEDIA_DIR).strip():
    MEDIA_DIR = Path(__file__).resolve().parent.parent.parent / "media"
AVATARS_DIR = MEDIA_DIR / "avatars"


class AccountProfileView(APIView):
    """GET /api/account/profile/ — Authoritative composed personal dossier.
    PATCH /api/account/profile/ — Update self-asserted fields strictly matching allowlist.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        db = get_db()
        user = request.user
        profile = get_full_composed_profile(
            account_id=user.account_id,
            person_id=user.person_id,
            tenant_id=user.tenant_id,
            institution_id=user.institution_id,
            db=db,
        )
        return Response(profile, status=status.HTTP_200_OK)

    def patch(self, request):
        db = get_db()
        user = request.user
        data = request.data or {}

        subject = getattr(user, "subject", None) or {}
        student_id = subject.get("id") if subject.get("type") == "student" else None

        try:
            update_self_profile(
                person_id=user.person_id,
                student_id=student_id,
                tenant_id=user.tenant_id,
                patch_data=data,
                db=db,
            )
            # Return fresh composed profile
            updated = get_full_composed_profile(
                account_id=user.account_id,
                person_id=user.person_id,
                tenant_id=user.tenant_id,
                institution_id=user.institution_id,
                db=db,
            )
            return Response(updated, status=status.HTTP_200_OK)
        except ValueError as exc:
            return Response(
                {"error": "InvalidField", "detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class AccountAvatarUploadView(APIView):
    """POST /api/account/avatar/ — Upload personal avatar image (max 2MB, WebP re-encoded, stripped EXIF)."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded_file = request.FILES.get("avatar") or request.FILES.get("file")
        if not uploaded_file:
            return Response({"error": "NoFileProvided"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Size check: max 2 MB
        if uploaded_file.size > AVATAR_MAX_BYTES:
            return Response(
                {"error": "FileTooLarge", "detail": "Avatar file exceeds maximum 2 MB limit."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Content type check
        content_type = getattr(uploaded_file, "content_type", "").lower()
        if content_type not in AVATAR_ALLOWED_TYPES:
            return Response(
                {"error": "InvalidImageFormat", "detail": "Only PNG, JPEG, and WebP images are allowed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. Pillow re-encoding & stripping EXIF
        from PIL import Image

        try:
            img = Image.open(uploaded_file)
            if img.format not in ["PNG", "JPEG", "WEBP"]:
                return Response(
                    {"error": "InvalidImageFormat", "detail": "Image file header is not a valid PNG, JPEG, or WebP."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Convert to RGB / RGBA to strip EXIF and normalize color space
            if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                clean_img = img.convert("RGBA")
            else:
                clean_img = img.convert("RGB")

            # Resize if dimensions exceed 512x512
            if clean_img.width > 512 or clean_img.height > 512:
                clean_img.thumbnail((512, 512), Image.Resampling.LANCZOS)

            output_io = io.BytesIO()
            clean_img.save(output_io, format="WEBP", quality=85, method=6)
            output_bytes = output_io.getvalue()
        except Exception as exc:
            return Response(
                {"error": "ImageProcessingFailed", "detail": f"Failed to process image: {str(exc)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 4. Save to filesystem
        AVATARS_DIR.mkdir(parents=True, exist_ok=True)
        person_id = request.user.person_id or request.user.account_id
        avatar_key = f"avatar_{person_id}_{int(datetime.now(timezone.utc).timestamp())}.webp"
        file_path = AVATARS_DIR / avatar_key
        file_path.write_bytes(output_bytes)

        # 5. Store avatar record in person identity
        db = get_db()
        now = datetime.now(timezone.utc)
        avatar_doc = {
            "key": avatar_key,
            "content_type": "image/webp",
            "bytes": len(output_bytes),
            "updated_at": now,
        }

        if request.user.person_id:
            db.person_identities.update_one(
                {"person_id": request.user.person_id},
                {"$set": {"avatar": avatar_doc, "updated_at": now}},
            )

        avatar_url = f"/api/media/avatar/{person_id}/"
        return Response(
            {
                "success": True,
                "avatar_url": avatar_url,
                "key": avatar_key,
                "bytes": len(output_bytes),
            },
            status=status.HTTP_200_OK,
        )


class MediaAvatarServeView(APIView):
    """GET /api/media/avatar/<person_id>/ — Authenticated avatar media serving with private caching."""
    permission_classes = [IsAuthenticated]

    def get(self, request, person_id: str):
        db = get_db()
        person = db.person_identities.find_one({"person_id": person_id}, {"_id": 0, "avatar": 1})
        if not person or not person.get("avatar") or not person["avatar"].get("key"):
            raise Http404("Avatar not found.")

        avatar_key = person["avatar"]["key"]
        file_path = AVATARS_DIR / avatar_key
        if not file_path.exists():
            raise Http404("Avatar image file not found.")

        # ETag cache validation
        etag = f'"{avatar_key}"'
        if request.META.get("HTTP_IF_NONE_MATCH") == etag:
            return HttpResponse(status=304)

        data = file_path.read_bytes()
        response = HttpResponse(data, content_type=person["avatar"].get("content_type", "image/webp"))
        response["Cache-Control"] = "private, max-age=86400"
        response["ETag"] = etag
        return response


class PersonCardView(APIView):
    """GET /api/people/<person_id>/card/ — RBAC-masked profile card for any institutional subject."""
    permission_classes = [IsAuthenticated]

    def get(self, request, person_id: str):
        db = get_db()
        card_data = get_person_card(target_person_id=person_id, viewer_user=request.user, db=db)
        if "error" in card_data:
            return Response(card_data, status=status.HTTP_404_NOT_FOUND)
        return Response(card_data, status=status.HTTP_200_OK)


class AccountSessionsListView(APIView):
    """GET /api/account/sessions/ — List all active sessions for the current account."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        db = get_db()
        sessions = list_account_sessions(request.user.account_id, db=db)

        current_token_hash = None
        sess_record = getattr(request, "session_record", None)
        if sess_record:
            current_token_hash = sess_record.get("token_hash")

        results = []
        for s in sessions:
            item = dict(s)
            item["is_current"] = (s.get("session_id") == getattr(sess_record, "session_id", None) or (
                sess_record and s.get("session_id") == sess_record.get("session_id")
            ))
            results.append(item)

        return Response({"sessions": results, "total": len(results)}, status=status.HTTP_200_OK)


class AccountSessionDetailView(APIView):
    """DELETE /api/account/sessions/<session_id>/ — Terminate an individual session."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, session_id: str):
        db = get_db()
        sess = db.auth_sessions.find_one({"session_id": session_id, "account_id": request.user.account_id})
        if not sess:
            return Response({"error": "SessionNotFound"}, status=status.HTTP_404_NOT_FOUND)

        revoke_session(session_id, reason="user_self_revoked", db=db)
        return Response({"success": True, "message": "Session revoked."}, status=status.HTTP_200_OK)


class AccountSessionsRevokeOthersView(APIView):
    """POST /api/account/sessions/revoke-others/ — Terminate all sessions except the current active session."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        db = get_db()
        sess_record = getattr(request, "session_record", None)
        current_sess_id = sess_record.get("session_id") if sess_record else None

        revoked_count = revoke_all_account_sessions(
            account_id=request.user.account_id,
            except_session_id=current_sess_id,
            reason="user_revoked_others",
            db=db,
        )
        return Response(
            {"success": True, "revoked_count": revoked_count, "message": "All other sessions revoked."},
            status=status.HTTP_200_OK,
        )


class AccountPasswordChangeView(APIView):
    """POST /api/account/password/change/ — Self-service password change; invalidates other sessions."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        db = get_db()
        user = request.user
        data = request.data or {}

        current_password = data.get("current_password") or ""
        new_password = data.get("new_password") or ""

        if not current_password or not new_password:
            return Response(
                {"error": "MissingFields", "detail": "Both current_password and new_password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:
            return Response(
                {"error": "PasswordTooShort", "detail": "New password must be at least 8 characters long."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1. Verify current credentials
        account = db.accounts.find_one({"account_id": user.account_id})
        if not account:
            return Response({"error": "AccountNotFound"}, status=status.HTTP_404_NOT_FOUND)

        ok, _, msg = authenticate_account_credentials(
            username=account.get("username"),
            password=current_password,
            db=db,
            raise_on_error=False,
        )
        if not ok:
            return Response(
                {"error": "InvalidCredentials", "detail": "Current password does not match."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Set new password
        set_account_password(account["account_id"], new_password, db=db)

        # 3. Terminate all other sessions except current session
        sess_record = getattr(request, "session_record", None)
        current_sess_id = sess_record.get("session_id") if sess_record else None
        revoke_all_account_sessions(
            account_id=user.account_id,
            except_session_id=current_sess_id,
            reason="password_change",
            db=db,
        )

        return Response(
            {"success": True, "message": "Password successfully changed. Other sessions revoked."},
            status=status.HTTP_200_OK,
        )


class AccountNotificationsView(APIView):
    """GET /api/account/notifications/ — List user notifications and unread badge count."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        db = get_db()
        person_id = request.user.person_id
        if not person_id:
            return Response({"unread_count": 0, "notifications": []}, status=status.HTTP_200_OK)

        cursor = db.notifications.find({"person_id": person_id}, {"_id": 0}).sort("created_at", -1).limit(50)
        items = list(cursor)
        unread_count = sum(1 for n in items if n.get("read_at") is None)

        return Response(
            {
                "unread_count": unread_count,
                "total": len(items),
                "notifications": items,
            },
            status=status.HTTP_200_OK,
        )


class AccountNotificationsReadView(APIView):
    """POST /api/account/notifications/read/ — Mark notification(s) as read."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        db = get_db()
        person_id = request.user.person_id
        if not person_id:
            return Response({"success": True, "marked_count": 0}, status=status.HTTP_200_OK)

        data = request.data or {}
        now = datetime.now(timezone.utc)

        if data.get("all") is True:
            res = db.notifications.update_many(
                {"person_id": person_id, "read_at": None},
                {"$set": {"read_at": now}},
            )
            return Response({"success": True, "marked_count": res.modified_count}, status=status.HTTP_200_OK)

        nids = data.get("notification_ids") or []
        if isinstance(nids, str):
            nids = [nids]

        if not nids:
            return Response({"error": "NoNotificationIdsProvided"}, status=status.HTTP_400_BAD_REQUEST)

        res = db.notifications.update_many(
            {"person_id": person_id, "notification_id": {"$in": nids}},
            {"$set": {"read_at": now}},
        )
        return Response({"success": True, "marked_count": res.modified_count}, status=status.HTTP_200_OK)

