"""
PlaceFlow Django API — 15 MongoDB Aggregation Reports & CSV Exports
"""

import csv
import io
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from database.connection import get_db
from operations import reports


class ReportsSummaryView(APIView):
    """Returns catalog of institutional reports and execution data."""

    def get(self, request):
        db = get_db()
        catalog = {}
        for rid, (title, fn) in reports.REPORTS.items():
            try:
                data = fn(db)
                catalog[rid] = {
                    "id": rid,
                    "title": title,
                    "rows_count": len(data),
                    "sample": data[:10],
                    "data": data,
                }
            except Exception as e:
                catalog[rid] = {
                    "id": rid,
                    "title": title,
                    "error": str(e)
                }

        return Response({
            "reports_count": len(reports.REPORTS),
            "reports": catalog,
        }, status=status.HTTP_200_OK)


class ReportCsvExportView(APIView):
    """Exports any institutional aggregation report as CSV."""

    def get(self, request, report_id):
        if report_id not in reports.REPORTS:
            return Response({"error": f"Report '{report_id}' not found"}, status=status.HTTP_404_NOT_FOUND)

        db = get_db()
        title, fn = reports.REPORTS[report_id]
        rows = fn(db)

        buffer = io.StringIO()
        fieldnames = list(rows[0].keys()) if rows else ["result"]
        writer = csv.DictWriter(buffer, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

        response = HttpResponse(buffer.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="placeflow_{report_id}.csv"'
        return response

