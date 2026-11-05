"""
PlaceFlow Django API — What-If Career Simulation & Conformal Package Bands
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from database.connection import get_db
from ml.whatif_simulator import simulate_student_career


class WhatIfSimulateView(APIView):
    """
    Evaluates hypothetical profile changes (CGPA, backlog clearance, new skills)
    and returns 80% conformal package intervals with plain-language explanations.
    """

    def post(self, request):
        db = get_db()
        data = request.data
        student_id = data.get("student_id")
        if not student_id:
            return Response({"error": "student_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        hypothetical_cgpa = float(data.get("hypothetical_cgpa")) if data.get("hypothetical_cgpa") is not None else None
        resolved_backlogs = int(data.get("resolved_backlogs")) if data.get("resolved_backlogs") is not None else None
        additional_skills = data.get("additional_skills", [])
        if isinstance(additional_skills, str):
            additional_skills = [s.strip() for s in additional_skills.split(",") if s.strip()]

        result = simulate_student_career(
            db,
            student_id=student_id,
            target_cgpa=hypothetical_cgpa,
            target_backlogs=resolved_backlogs,
            added_skills=additional_skills,
        )
        return Response(result, status=status.HTTP_200_OK)

