"""PlaceFlow / Meridian — Machine Learning Model Management API Views (Phase 2).

Endpoints for retraining, hot-reloading, and inspecting machine learning model manifests.
Accessible to authorized TPO administrators with `placement.drive.manage`.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from database.connection import get_db
from api.auth.permissions import perm
from ml.registry import registry
from ml.placement_predictor import train


class ModelRetrainView(APIView):
    """POST /api/tpo/models/retrain/ — Retrain and register placement and package estimation models."""
    permission_classes = [perm("placement.drive.manage")]

    def post(self, request):
        db = get_db()
        tenant_id = getattr(request.user, "tenant_id", None)

        try:
            metrics = train(tenant_id=tenant_id, db=db)
            return Response(
                {
                    "success": True,
                    "message": "Placement and package models successfully retrained and registered.",
                    "metrics": metrics,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as exc:
            return Response(
                {"error": "ModelTrainingFailed", "detail": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ModelRegistryListView(APIView):
    """GET /api/tpo/models/ — List registered ML model artifacts, versions, risk tiers, and metrics."""
    permission_classes = [perm("placement.drive.manage")]

    def get(self, request):
        models = registry.list_models()
        return Response(
            {
                "total_models": len(models),
                "models": [m.to_dict() for m in models],
            },
            status=status.HTTP_200_OK,
        )

