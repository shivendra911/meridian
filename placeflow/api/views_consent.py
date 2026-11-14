"""
PlaceFlow Django API — DPDP Act 2023 Purpose Consent & Revocation Ledger
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from database.connection import get_db
from operations.consent import get_student_consents, record_consent, withdraw_consent, PURPOSE_DEFINITIONS, CURRENT_NOTICE_VERSION
from api.auth.permissions import perm, any_of
from api.auth.queries import scoped_get


class ConsentDetailView(APIView):
    """Retrieves all purpose consent records for a student."""
    permission_classes = [any_of("consent.audit.export", "consent.grant.record")]

    def get(self, request, student_id):
        db = get_db()
        sid = student_id.strip().upper()
        student = scoped_get("students", request.user, {"student_id": sid}, db=db)
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

        # IDOR prevention: student cannot grant consent for another student
        user_subj = getattr(request.user, "subject", {}) or {}
        if user_subj.get("type") == "student" and user_subj.get("id") != sid:
            raise PermissionDenied("Students may only grant consent for their own identity.")

        res = record_consent(db, sid, purpose)
        if "error" in res:
            return Response(res, status=status.HTTP_400_BAD_REQUEST)
        return Response(res if isinstance(res, dict) else {"status": "SUCCESS", "message": f"Consent granted for {purpose}."}, status=status.HTTP_200_OK)


class ConsentWithdrawView(APIView):
    """Withdraws consent for a specific processing purpose with cryptographic audit trail."""
    permission_classes = [any_of("consent.withdraw.process", "placement.drive.manage", "iam.role.assign")]

    def post(self, request):
        db = get_db()
        sid = request.data.get("student_id", "").strip().upper()
        purpose = request.data.get("purpose", "").strip()

        if not sid or not purpose:
            return Response({"error": "student_id and purpose are required"}, status=status.HTTP_400_BAD_REQUEST)

        # IDOR prevention: student cannot withdraw consent for another student
        user_subj = getattr(request.user, "subject", {}) or {}
        if user_subj.get("type") == "student" and user_subj.get("id") != sid:
            raise PermissionDenied("Students may only withdraw consent for their own identity.")

        res = withdraw_consent(db, sid, purpose)
        if "error" in res:
            return Response(res, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "SUCCESS", "message": f"Consent revoked for {purpose}."}, status=status.HTTP_200_OK)


class ManagementConsentRecordsView(APIView):
    """GET /api/management/consent/records/ — Institutional DPDP consent compliance aggregates."""
    permission_classes = [any_of("consent.audit.export", "nirf.report.view")]

    def get(self, request):
        db = get_db()
        from api.auth.queries import scoped_find
        total_students = db.students.count_documents({})
        records = scoped_find("consents", request.user, db=db)
        active_count = len([r for r in records if r.get("status") in ("ACTIVE", "GRANTED_BY_DEFAULT", "Active")])
        rate = f"{(active_count / max(len(records), 1) * 100):.1f}%" if records else "100.0%"
        return Response({
            "status": "ACTIVE",
            "verified_students": total_students,
            "compliance_rate": rate,
            "total_records": len(records),
            "records": records[:100],
        }, status=status.HTTP_200_OK)
