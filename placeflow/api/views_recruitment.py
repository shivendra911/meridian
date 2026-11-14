"""
PlaceFlow Django API — Recruitment Operations & Multi-Tier Cascading Engine
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from database.connection import get_db
from operations import jobs, applications, interviews, placements
from operations.ids import insert_with_id
from operations.errors import friendly
from operations.cascading import atomic_placement_with_cascading
from api.auth.permissions import perm, any_of
from api.auth.queries import scoped_find, scoped_get
from camp_02.notify import notify, get_person_id_for_student


class CompanyListView(APIView):
    """Lists and registers participating corporate partner organizations."""
    def get_permissions(self):
        if self.request.method in ("POST", "PUT", "PATCH", "DELETE"):
            return [perm("placement.company.create")()]
        return [any_of("placement.company.create", "placement.company.verify", "placement.drive.manage")()]

    def get(self, request):
        db = get_db()
        companies = scoped_find("companies", request.user, sort="company_id", db=db)
        return Response({"count": len(companies), "companies": companies}, status=status.HTTP_200_OK)

    def post(self, request):
        db = get_db()
        try:
            cid = insert_with_id(db, "companies", request.data)
            return Response({"status": "SUCCESS", "company_id": cid}, status=status.HTTP_201_CREATED)
        except Exception as exc:
            return Response({"status": "ERROR", "message": friendly(exc)}, status=status.HTTP_400_BAD_REQUEST)


class JobListView(APIView):
    """Lists open JNFs (Job Notification Forms) and registers new corporate drives."""
    def get_permissions(self):
        if self.request.method in ("POST", "PUT", "PATCH", "DELETE"):
            return [perm("placement.drive.manage")()]
        return [any_of("placement.drive.manage", "placement.application.view")()]

    def get(self, request):
        db = get_db()
        job_list = scoped_find("jobs", request.user, sort="job_id", db=db)
        return Response({"count": len(job_list), "jobs": job_list}, status=status.HTTP_200_OK)

    def post(self, request):
        db = get_db()
        try:
            jid = jobs.add_job(db, request.data)
            # Notify eligible student cohort about newly published drive
            title = request.data.get("title", "New Placement Drive")
            pkg = request.data.get("package_lpa", "")
            depts = (request.data.get("eligibility") or {}).get("departments") or []
            query = {}
            if depts:
                query["department"] = {"$in": depts}
            for stu in scoped_find("students", request.user, extra=query, limit=50, db=db):
                spid = stu.get("person_id") or get_person_id_for_student(stu.get("student_id"), db=db)
                if spid:
                    notify(
                        spid,
                        "DRIVE",
                        f"New Drive: {title}",
                        f"A new placement drive '{title}' (Rs {pkg} LPA) is now open for applications.",
                        link="/student/opportunities",
                        db=db,
                    )
            return Response({"status": "SUCCESS", "job_id": jid}, status=status.HTTP_201_CREATED)
        except Exception as exc:
            return Response({"status": "ERROR", "message": friendly(exc)}, status=status.HTTP_400_BAD_REQUEST)


class JobDetailView(APIView):
    """Retrieves full details of a single placement drive / JNF."""
    permission_classes = [any_of("placement.drive.manage", "placement.application.view")]

    def get(self, request, job_id):
        db = get_db()
        job = scoped_get("jobs", request.user, {"job_id": job_id}, db=db)
        if not job:
            return Response({"error": f"Job opening '{job_id}' not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(job, status=status.HTTP_200_OK)


class JobCandidatesView(APIView):
    """Returns candidate pool matching a specific job's academic eligibility thresholds."""
    permission_classes = [perm("placement.drive.manage")]

    def get(self, request, job_id):
        db = get_db()
        job = scoped_get("jobs", request.user, {"job_id": job_id}, db=db)
        if not job:
            return Response({"error": f"Job opening '{job_id}' not found."}, status=status.HTTP_404_NOT_FOUND)
        candidates = applications.eligible_candidates(db, job)
        return Response({"job_id": job_id, "candidates": candidates, "count": len(candidates)}, status=status.HTTP_200_OK)


class ApplicationListView(APIView):
    """Application ledger and registration endpoint."""
    def get_permissions(self):
        if self.request.method in ("POST", "PUT", "PATCH", "DELETE"):
            return [any_of("placement.application.create", "placement.drive.manage")()]
        return [perm("placement.application.view")()]

    def get(self, request):
        db = get_db()
        apps = scoped_find("v_application_details", request.user, sort=[("applied_at", -1)], limit=300, db=db)
        return Response({"count": len(apps), "applications": apps}, status=status.HTTP_200_OK)

    def post(self, request):
        db = get_db()
        sid = request.data.get("student_id")
        jid = request.data.get("job_id")
        if not sid or not jid:
            return Response({"error": "student_id and job_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        # IDOR prevention on apply: students can only apply for themselves
        user_subj = getattr(request.user, "subject", {}) or {}
        if user_subj.get("type") == "student" and user_subj.get("id") != sid:
            raise PermissionDenied("Students may only submit applications for their own identity.")

        try:
            app_id = applications.apply_for_job(db, sid, jid)
            return Response({"status": "SUCCESS", "application_id": app_id}, status=status.HTTP_201_CREATED)
        except Exception as exc:
            return Response({"status": "ERROR", "message": friendly(exc)}, status=status.HTTP_400_BAD_REQUEST)


class ApplicationStatusView(APIView):
    """Updates application progression stage."""
    permission_classes = [perm("placement.application.status_update")]

    def post(self, request, application_id):
        db = get_db()
        new_status = request.data.get("status")
        note = request.data.get("note")
        if not new_status:
            return Response({"error": "status is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            applications.update_status(db, application_id, new_status, note)
            app_doc = scoped_get("applications", request.user, {"application_id": application_id}, db=db)
            if app_doc:
                sid = app_doc.get("student_id")
                job_doc = scoped_get("jobs", request.user, {"job_id": app_doc.get("job_id")}, db=db) or {}
                pid = get_person_id_for_student(sid, db=db)
                if pid:
                    notify(
                        pid,
                        "APPLICATION",
                        f"Application Status Updated: {new_status}",
                        f"Your application for {job_doc.get('title', 'Role')} has moved to '{new_status}'.",
                        link="/student/applications",
                        db=db,
                    )
            return Response({"status": "SUCCESS", "application_id": application_id, "new_status": new_status})
        except Exception as exc:
            return Response({"status": "ERROR", "message": friendly(exc)}, status=status.HTTP_400_BAD_REQUEST)


class InterviewListView(APIView):
    """Official master interview schedule and slot booking."""
    permission_classes = [perm("placement.interview.schedule")]

    def get(self, request):
        db = get_db()
        loops = scoped_find("interviews", request.user, sort="scheduled_start", limit=300, db=db)
        return Response({"count": len(loops), "interviews": loops}, status=status.HTTP_200_OK)

    def post(self, request):
        db = get_db()
        d = request.data
        try:
            iid = interviews.schedule_interview(
                db,
                application_id=d["application_id"],
                round_name=d["round"],
                start=d["scheduled_start"],
                end=d["scheduled_end"],
                mode=d["mode"],
                venue=d.get("venue")
            )
            app_doc = scoped_get("applications", request.user, {"application_id": d["application_id"]}, db=db)
            if app_doc:
                sid = app_doc.get("student_id")
                pid = get_person_id_for_student(sid, db=db)
                if pid:
                    notify(
                        pid,
                        "INTERVIEW",
                        f"Interview Scheduled: {d.get('round', 'Round')}",
                        f"An interview ({d.get('mode', 'Online')}) has been scheduled for {d.get('scheduled_start')}.",
                        link="/student/interviews",
                        db=db,
                    )
            return Response({"status": "SUCCESS", "interview_id": iid}, status=status.HTTP_201_CREATED)
        except Exception as exc:
            return Response({"status": "ERROR", "message": friendly(exc)}, status=status.HTTP_400_BAD_REQUEST)


class PlacementListView(APIView):
    """Placement register and atomic multi-tier cascading placement execution."""
    permission_classes = [perm("placement.offer.record")]

    def get(self, request):
        db = get_db()
        records = scoped_find("placements", request.user, sort=[("placement_date", -1)], db=db)
        return Response({"count": len(records), "placements": records}, status=status.HTTP_200_OK)

    def post(self, request):
        db = get_db()
        sid = request.data.get("student_id")
        jid = request.data.get("job_id")
        if not sid or not jid:
            return Response({"error": "student_id and job_id are required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            plc_id, cascaded_id = atomic_placement_with_cascading(db, sid, jid)
            job_doc = scoped_get("jobs", request.user, {"job_id": jid}, db=db) or {}
            pid = get_person_id_for_student(sid, db=db)
            if pid:
                notify(
                    pid,
                    "OFFER",
                    "Placement Offer Extended",
                    f"Congratulations! You received a placement offer for {job_doc.get('title', 'Role')} ({job_doc.get('package_lpa', '')} LPA).",
                    link="/student/offers",
                    db=db,
                )
            return Response({
                "status": "SUCCESS",
                "placement_id": plc_id,
                "cascaded_seat_student_id": cascaded_id,
                "message": f"Placement {plc_id} finalized successfully." + (f" Vacated seat cascaded to {cascaded_id}." if cascaded_id else "")
            }, status=status.HTTP_201_CREATED)
        except Exception as exc:
            return Response({"status": "ERROR", "message": friendly(exc)}, status=status.HTTP_400_BAD_REQUEST)
