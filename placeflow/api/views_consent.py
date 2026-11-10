"""
PlaceFlow Django API — DPDP Act 2023 Purpose Consent & Revocation Ledger
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from database.connection import get_db
from operations.consent import get_student_consents, record_consent, withdraw_consent, PURPOSE_DEFINITIONS, CURRENT_NOTICE_VERSION
from api.auth.permissions import perm, any_of


class ConsentDetailView(APIView):
    """Retrieves all purpose consent records for a student."""
    permission_classes = [any_of("consent.audit.export", "consent.grant.record")]

    def get(self, request, student_id):
        db = get_db()
        sid = student_id.strip().upper()
        student = db.students.find_one({"student_id": sid}, {"_id": 0})
        if not student:
            return Response({"error": f"Student '{sid}' not found"}, status=status.HTTP_404_NOT_FOUND)

        consents = get_student_consents(db, sid)
        return Response({
            "student_id": sid,
            "student_name": student["name"],
            "department": student["department"],
            "ml_opt_out": student.get("ml_opt_out", False),
            "notice_version": CURRENT_NOTICE_VERSION,
            "purposes_catalog": PURPOSE_DEFINITIONS,
            "consents": consents,
        }, status=status.HTTP_200_OK)


class ConsentRecordView(APIView):
    """Grants explicit consent for a processing purpose under Notice v2026.1-DPDP."""
    permission_classes = [any_of("consent.grant.record", "placement.drive.manage", "iam.role.assign")]

    def post(self, request):
        db = get_db()
        sid = request.data.get("student_id", "").strip().upper()
        purpose = request.data.get("purpose", "").strip()

        if not sid or not purpose:
            return Response({"error": "student_id and purpose are required"}, status=status.HTTP_400_BAD_REQUEST)

        res = record_consent(db, sid, purpose)
        if "error" in res:
            return Response(res, status=status.HTTP_400_BAD_REQUEST)
        return Response(res, status=status.HTTP_200_OK)


class ConsentWithdrawView(APIView):
    """Revokes consent for a processing purpose and activates model opt-out."""
    permission_classes = [any_of("consent.withdraw.process", "placement.drive.manage", "iam.role.assign")]

    def post(self, request):
        db = get_db()
        sid = request.data.get("student_id", "").strip().upper()
        purpose = request.data.get("purpose", "").strip()

        if not sid or not purpose:
            return Response({"error": "student_id and purpose are required"}, status=status.HTTP_400_BAD_REQUEST)

        res = withdraw_consent(db, sid, purpose)
        if "error" in res:
            return Response(res, status=status.HTTP_400_BAD_REQUEST)
        return Response(res, status=status.HTTP_200_OK)

