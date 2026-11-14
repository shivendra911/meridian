"""
PlaceFlow Django API — Superday Multi-Track Conflict Arbitrator
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from database.connection import get_db
from operations.superday import detect_conflicts, auto_resolve_conflicts
from operations.errors import friendly
from api.auth.permissions import perm
from api.auth.queries import scoped_find


class SuperdayConflictsView(APIView):
    """Detects concurrent interview collisions, candidate double-booking, and room contention."""
    permission_classes = [perm("placement.superday.solve")]

    def get(self, request):
        db = get_db()
        conflicts = detect_conflicts(db)
        interviews = scoped_find("interviews", request.user, sort="scheduled_start", db=db)

        return Response({
            "clashes_count": len(conflicts),
            "status": "COLLISION_FREE" if len(conflicts) == 0 else "ACTION_REQUIRED",
            "conflicts": conflicts,
            "interviews": interviews,
        }, status=status.HTTP_200_OK)


class SuperdayResolveView(APIView):
    """Executes the 1-click algorithmic constraint solver within an ACID session."""
    permission_classes = [perm("placement.superday.solve")]

    def post(self, request):
        db = get_db()
        try:
            resolved_count = auto_resolve_conflicts(db)
            return Response({
                "status": "SUCCESS",
                "resolved_count": resolved_count,
                "message": f"Successfully resolved {resolved_count} scheduling collision(s) via constraint satisfaction solver."
            }, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response({
                "status": "ERROR",
                "message": friendly(exc)
            }, status=status.HTTP_400_BAD_REQUEST)

