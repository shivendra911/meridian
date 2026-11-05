"""
PlaceFlow Django API — Demographic Slice Fairness & Sensitive Feature Auditing
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from database.connection import get_db
from ml.fairness_audit import run_cohort_fairness_audit, audit_feature_set, PROHIBITED_SENSITIVE_FEATURES


class FairnessAuditView(APIView):
    """
    Evaluates selection rate parity across academic departments
    and verifies that zero prohibited sensitive attributes appear in models.
    """

    def get(self, request):
        db = get_db()
        audit_report = run_cohort_fairness_audit(db)
        audit_report["prohibited_features_list"] = list(PROHIBITED_SENSITIVE_FEATURES)
        return Response(audit_report, status=status.HTTP_200_OK)

    def post(self, request):
        """Audits an arbitrary feature list submitted by an engineer."""
        features = request.data.get("features", [])
        result = audit_feature_set(features)
        return Response(result, status=status.HTTP_200_OK)

