"""
PlaceFlow Django API — Post-Offer Retention & Renege Radar
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from database.connection import get_db
from ml.renege_predictor import batch_renege_radar
from api.auth.permissions import perm


class RenegeRadarView(APIView):
    """
    Evaluates candidate flight risk using salary disparity ratios,
    post-offer application leaks, and lag days.
    """
    permission_classes = [perm("placement.application.view")]

    def get(self, request):
        db = get_db()
        radar = batch_renege_radar(db)
        critical_count = sum(1 for r in radar if r["risk_level"] == "CRITICAL")
        moderate_count = sum(1 for r in radar if r["risk_level"] == "MODERATE")
        low_count = sum(1 for r in radar if r["risk_level"] == "LOW")
        avg_prob = round(sum(r["renege_probability"] for r in radar) / len(radar), 1) if radar else 0.0

        return Response({
            "total_placed_monitored": len(radar),
            "critical_count": critical_count,
            "moderate_count": moderate_count,
            "low_count": low_count,
            "avg_renege_probability": avg_prob,
            "candidates": radar,
        }, status=status.HTTP_200_OK)

