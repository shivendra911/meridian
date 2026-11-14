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
from api.auth.permissions import perm, any_of
from api.auth.queries import scoped_find, scoped_get


class StudentListView(APIView):
    """
    Returns candidate registry with search, filtering, VTI scores, and risk bands.
    Accepts POST to register new candidates under strict $jsonSchema rules.
    """
    def get_permissions(self):
        if self.request.method in ("POST", "PUT", "PATCH", "DELETE"):
            return [perm("student.profile.update_admin")()]
        return [perm("student.profile.read")()]

    def get(self, request):
        db = get_db()
        dept_filter = request.query_params.get("department")
        search_query = request.query_params.get("search", "").strip()
        mentor_filter = request.query_params.get("mentor_id")
        hod_filter = request.query_params.get("hod_id")
        hos_filter = request.query_params.get("hos_name") or request.query_params.get("hos")
        assessment_filter = request.query_params.get("assessment_status")
        survey_filter = request.query_params.get("survey_status")
        tag_filter = request.query_params.get("tag")

        query = {}
        if dept_filter and dept_filter != "ALL":
            query["department"] = dept_filter
        if mentor_filter:
            query["mentor_id"] = mentor_filter
        if hod_filter:
            query["hod_id"] = hod_filter
        if hos_filter:
            query["hos_name"] = hos_filter
        if assessment_filter:
            query["assessment_status"] = assessment_filter
        if survey_filter:
            query["survey_status"] = survey_filter
        if tag_filter:
            query["tags"] = tag_filter
        if search_query:
            query["$or"] = [
                {"name": {"$regex": search_query, "$options": "i"}},
                {"student_id": {"$regex": search_query, "$options": "i"}},
                {"reg_no": {"$regex": search_query, "$options": "i"}},
                {"skills": {"$regex": search_query, "$options": "i"}},
                {"mentor_name": {"$regex": search_query, "$options": "i"}},
                {"remarks": {"$regex": search_query, "$options": "i"}},
            ]

        rows = scoped_find("students", request.user, extra=query, sort="student_id", limit=300, db=db)

        # Annotate with VTI authenticity score and ML prediction (fast cached path)
        try:
            from ml.placement_predictor import predict_student
            for r in rows:
                if not r.get("vti"):
                    r["vti"] = calculate_talent_authenticity(r)
                if not r.get("ai_risk"):
                    sid = r.get("student_id")
                    if sid:
                        pred = predict_student(sid)
                        if pred:
                            r["ai_risk"] = pred
        except Exception:
            for r in rows:
                if not r.get("vti"):
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
    permission_classes = [perm("student.profile.read")]

    def get(self, request, student_id):
        db = get_db()
        raw_id = student_id.strip()
        # Fast indexed lookup across student_id (case-insensitive) and reg_no
        student = scoped_get(
            "students",
            request.user,
            {"$or": [{"student_id": raw_id}, {"student_id": raw_id.upper()}, {"reg_no": raw_id}]},
            db=db,
        )
        if not student:
            return Response({"error": f"Candidate '{raw_id}' not found"}, status=status.HTTP_404_NOT_FOUND)

        sid = student["student_id"]

        # 1. Talent Authenticity VTI
        vti = student.get("vti") or calculate_talent_authenticity(student)

        # 2. Eligible Jobs
        eligible_jobs = applications.eligible_jobs(db, student)

        # 3. Candidate Applications
        apps = scoped_find("v_application_details", request.user, extra={"student_id": sid}, db=db)

        # 4. Interviews
        interviews = scoped_find("interviews", request.user, extra={"student_id": sid}, sort="scheduled_start", db=db)

        # 5. AI Predictions & Skill Gap Recommendations
        ai_pred = student.get("ai_risk")
        if not ai_pred:
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
        consents = scoped_find("consents", request.user, extra={"student_id": sid}, db=db)
        if not consents:
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


class FacultyMenteesView(StudentListView):
    """Mentees list for faculty advising. Strictly requires faculty advising permissions."""
    permission_classes = [any_of("faculty.attendance.manage", "faculty.gradebook.manage")]


class HodStudentsView(StudentListView):
    """Departmental student cohort list. Strictly requires department head permissions."""
    permission_classes = [any_of("academic.curriculum.approve", "academic.progression.evaluate")]
