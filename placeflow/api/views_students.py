"""
PlaceFlow Django API — Verified Candidate Registry & Career Dossiers
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from database.connection import get_db
from operations import students, applications
from operations.authenticity import calculate_talent_authenticity
from operations.errors import friendly
from operations.consent import get_student_consents


class StudentListView(APIView):
    """
    Returns candidate registry with search, filtering, VTI scores, and risk bands.
    Accepts POST to register new candidates under strict $jsonSchema rules.
    """

    def get(self, request):
        db = get_db()
        dept_filter = request.query_params.get("department")
        search_query = request.query_params.get("search", "").strip()

        query = {}
        if dept_filter and dept_filter != "ALL":
            query["department"] = dept_filter
        if search_query:
            query["$or"] = [
                {"name": {"$regex": search_query, "$options": "i"}},
                {"student_id": {"$regex": search_query, "$options": "i"}},
                {"skills": {"$regex": search_query, "$options": "i"}},
            ]

        rows = list(db.students.find(query, {"_id": 0}).sort("student_id", 1).limit(300))

        # Annotate with VTI authenticity score and ML prediction
        try:
            from ml.placement_predictor import predict_student
            for r in rows:
                r["vti"] = calculate_talent_authenticity(r)
                sid = r.get("student_id")
                if sid:
                    pred = predict_student(sid)
                    if pred:
                        r["ai_risk"] = pred
        except Exception:
            for r in rows:
                r["vti"] = calculate_talent_authenticity(r)

        return Response({
            "count": len(rows),
            "students": rows,
        }, status=status.HTTP_200_OK)

    def post(self, request):
        db = get_db()
        try:
            student_id = students.add_student(db, request.data)
            return Response({
                "status": "SUCCESS",
                "student_id": student_id,
                "message": f"Candidate {student_id} successfully enrolled in Verified Registry."
            }, status=status.HTTP_201_CREATED)
        except Exception as exc:
            return Response({
                "status": "ERROR",
                "message": friendly(exc)
            }, status=status.HTTP_400_BAD_REQUEST)


class StudentDetailView(APIView):
    """
    Returns comprehensive candidate career dossier:
    - Academic profile & VTI honors badge
    - Eligible jobs matching thresholds
    - Active applications & status pipeline
    - Scheduled interview loops
    - ML placement likelihood & competency roadmap
    - DPDP consent records
    """

    def get(self, request, student_id):
        db = get_db()
        sid = student_id.strip().upper()
        student = db.students.find_one({"student_id": sid}, {"_id": 0})
        if not student:
            return Response({"error": f"Candidate '{sid}' not found"}, status=status.HTTP_404_NOT_FOUND)

        # 1. Talent Authenticity VTI
        vti = calculate_talent_authenticity(student)

        # 2. Eligible Jobs
        eligible_jobs = applications.eligible_jobs(db, student)

        # 3. Candidate Applications
        apps = list(db.v_application_details.find({"student_id": sid}, {"_id": 0}))

        # 4. Interviews
        interviews = list(db.interviews.find({"student_id": sid}, {"_id": 0}).sort("scheduled_start", 1))

        # 5. AI Predictions & Skill Gap Recommendations
        ai_pred = None
        try:
            from ml.placement_predictor import predict_student
            ai_pred = predict_student(sid)
        except Exception:
            pass

        ai_recs = []
        try:
            from ml.skill_recommender import recommend
            rec_res = recommend(db, sid)
            ai_recs = rec_res.get("recommendations", [])
        except Exception:
            pass

        # 6. DPDP Consents
        consents = get_student_consents(db, sid)

        return Response({
            "student": student,
            "vti": vti,
            "eligible_jobs": eligible_jobs,
            "applications": apps,
            "interviews": interviews,
            "ai_prediction": ai_pred,
            "skill_recommendations": ai_recs,
            "consents": consents,
        }, status=status.HTTP_200_OK)

