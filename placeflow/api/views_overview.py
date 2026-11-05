"""
PlaceFlow Django API — Executive Overview & Directorate Telemetry
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from database.connection import get_db
from operations import reports


class OverviewTelemetryView(APIView):
    """
    Returns high-level institutional placement KPIs, department placement velocity,
    tier distribution breakdown, and the live activity audit feed.
    """

    def get(self, request):
        db = get_db()
        kpi_list = reports.placement_report(db)
        # Convert kpi_list [('Total Students', 200), ...] to key-value dict
        kpis = {k.lower().replace(' ', '_').replace('%', 'pct').replace('(', '').replace(')', ''): v for k, v in kpi_list}

        top_roles = reports.top_roles(db)
        pipeline = reports.pipeline_health(db)
        activity = reports.recent_activity(db)

        # Department / Branch placement rates
        branch_labels, branch_rates = [], []
        try:
            branch_rows = reports.REPORTS["branch"][1](db)
            branch_labels = [r.get("department", "") for r in branch_rows]
            branch_rates = [r.get("placement_pct", 0) for r in branch_rows]
        except Exception:
            branch_rows = []

        # Tier breakdown
        tier_labels, tier_counts = [], []
        try:
            tier_pipeline = [
                {"$group": {"_id": "$tier", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            tier_data = list(db.jobs.aggregate(tier_pipeline))
            tier_labels = [t["_id"] for t in tier_data if t["_id"]]
            tier_counts = [t["count"] for t in tier_data if t["_id"]]
        except Exception:
            tier_data = []

        return Response({
            "kpis": kpis,
            "top_roles": top_roles,
            "pipeline_health": pipeline,
            "recent_activity": activity,
            "branch_velocity": {
                "labels": branch_labels,
                "rates": branch_rates,
                "rows": branch_rows,
            },
            "tier_distribution": {
                "labels": tier_labels,
                "counts": tier_counts,
            },
            "cluster_status": {
                "mongo_live": True,
                "replica_set": "rs0",
                "version": "v3.0 Production Platform (Django + React Native)",
            }
        }, status=status.HTTP_200_OK)

