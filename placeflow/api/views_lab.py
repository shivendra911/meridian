"""
PlaceFlow Django API — Database Engine Lab & Latency Diagnostic Benchmarks
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from database.connection import get_db
from operations.demo_registry import DEMOS
from operations.errors import friendly
from api.auth.permissions import perm


class LabDemosView(APIView):
    """Returns list of database diagnostic demos."""
    permission_classes = [perm("iam.role.create")]

    def get(self, request):
        demo_list = []
        for did, d in DEMOS.items():
            demo_list.append({
                "id": did,
                "title": d.get("title", did),
                "description": d.get("description", ""),
                "mongosh": d.get("mongosh", ""),
            })
        return Response({"demos": demo_list}, status=status.HTTP_200_OK)


class LabRunDemoView(APIView):
    """Executes a diagnostic demo and measures live query performance."""
    permission_classes = [perm("iam.role.create")]

    def post(self, request, demo_id):
        demo = DEMOS.get(demo_id)
        if not demo:
            return Response({"error": f"Demo '{demo_id}' not found"}, status=status.HTTP_404_NOT_FOUND)

        db = get_db()
        try:
            result = demo["run"](db)
            return Response({
                "status": "SUCCESS",
                "demo_id": demo_id,
                "result": result,
            }, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response({
                "status": "ERROR",
                "demo_id": demo_id,
                "error": friendly(exc)
            }, status=status.HTTP_400_BAD_REQUEST)

