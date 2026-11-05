"""
PlaceFlow Django API — NIRF Graduation Outcome Accreditation Calculator
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from database.connection import get_db
from operations.nirf import compute_nirf_metrics


class NirfMetricsView(APIView):
    """
    Computes official NIRF Graduation Outcome scores (GPH 40, GMS 40)
    and recruiter salary dispersion table with small-cell (<5) privacy masking.
    """

    def get(self, request):
        db = get_db()
        metrics = compute_nirf_metrics(db)
        return Response(metrics, status=status.HTTP_200_OK)

