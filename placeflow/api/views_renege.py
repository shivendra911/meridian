"""
PlaceFlow Django API — Post-Offer Retention & Renege Radar
"""

import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from database.connection import get_db
from ml.renege_predictor import batch_renege_radar
from api.auth.permissions import perm, BlockRecruiter


class RenegeRadarView(APIView):
    """
    Evaluates candidate flight risk using salary disparity ratios,
    post-offer application leaks, and lag days.
    """
    permission_classes = [BlockRecruiter, perm("placement.application.view")]

    def get(self, request):
        db = get_db()
        tenant_id = getattr(request.user, "tenant_id", None)
        radar = batch_renege_radar(db, tenant_id=tenant_id)
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


class RenegeResolveView(APIView):
    """
    POST /api/renege-radar/resolve/ (and /api/tpo/insights/renege/resolve/)
    Logs retention interventions and updates candidate flight monitoring state.
    """
    permission_classes = [BlockRecruiter, perm("placement.application.view")]

    def post(self, request):
        db = get_db()
        tenant_id = getattr(request.user, "tenant_id", None)
        actor_id = getattr(request.user, "user_id", "tpo_coordinator")
        data = request.data or {}

        student_id = data.get("student_id")
        action = data.get("action")
        notes = data.get("notes", "")

        if not student_id or not action:
            return Response(
                {"error": "Missing student_id or action"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        doc = {
            "student_id": student_id,
            "action": action,
            "notes": notes,
            "actor_id": actor_id,
            "tenant_id": tenant_id,
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
        db.renege_interventions.insert_one(doc)

        return Response({
            "status": "SUCCESS",
            "message": f"Retention intervention '{action}' logged successfully",
            "student_id": student_id,
            "action": action,
        }, status=status.HTTP_200_OK)

