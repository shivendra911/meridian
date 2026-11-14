"""PlaceFlow / Meridian — Student Portal API Views (Phase 3).

All views in this module are strictly SELF-scoped:
- Candidate identity is derived solely from the authenticated Principal context.
- Any student_id parameter passed in query strings, URL paths, or request bodies is discarded.
- Out-of-scope requests or lookups return HTTP 404 (IDOR prevention).
"""

from datetime import datetime, timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from database.connection import get_db
from api.auth.permissions import perm, any_of, PortalBaseView
from api.auth.queries import scoped_find, scoped_get
from api.auth.masking import mask_records
from operations.applications import check_eligibility, apply_for_job
from operations.errors import PlaceFlowError
from operations.consent import record_consent, withdraw_consent, get_student_consents
from camp_02.notify import notify, get_tpo_person_ids


class StudentBaseView(PortalBaseView, APIView):
    """Base class extracting authoritative student subject ID from the active principal."""
    portal_name = "student"

    def get_student_id(self, request) -> str:
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return None
        subj = getattr(user, "subject", None) or {}
        if subj.get("type") != "student":
            return None
        return subj.get("id")


class StudentMeView(StudentBaseView):
    """GET /api/student/me/ — Authoritative career profile dossier of the authenticated student."""
    permission_classes = [perm("student.profile.read")]

    def get(self, request):
        student_id = self.get_student_id(request)
        if not student_id:
            return Response({"error": "CandidateProfileNotFound"}, status=status.HTTP_404_NOT_FOUND)

        db = get_db()
        student = scoped_get("students", request.user, {"student_id": student_id}, db=db)
        if not student:
            return Response({"error": "CandidateRecordNotFound"}, status=status.HTTP_404_NOT_FOUND)

        # Enrich with mentorship topology if present
        rels = list(db.institutional_relationships.find(
            {"from_id": student_id, "relation_type": "MENTORED_BY"},
            {"_id": 0},
        ))
        student["mentorship_relations"] = rels

        # Masking for self is identity-preserving
        return Response(mask_records(student, request.user), status=status.HTTP_200_OK)


class StudentProfileUpdateView(StudentBaseView):
    """PATCH /api/student/profile/ — Updates candidate portfolio, bio, skills, or ML opt-out."""
    permission_classes = [perm("student.profile.update_self")]

    def patch(self, request):
        student_id = self.get_student_id(request)
        if not student_id:
            return Response({"error": "CandidateProfileNotFound"}, status=status.HTTP_404_NOT_FOUND)

        db = get_db()
        student = scoped_get("students", request.user, {"student_id": student_id}, db=db)
        if not student:
            return Response({"error": "CandidateRecordNotFound"}, status=status.HTTP_404_NOT_FOUND)

        allowed_fields = {"skills", "remarks", "phone", "ml_opt_out"}
        update_data = {}
        for k in allowed_fields:
            if k in request.data:
                update_data[k] = request.data[k]

        if update_data:
            db.students.update_one({"student_id": student_id}, {"$set": update_data})

        updated = scoped_get("students", request.user, {"student_id": student_id}, db=db)
        return Response(mask_records(updated, request.user), status=status.HTTP_200_OK)


class StudentOpportunitiesView(StudentBaseView):
    """GET /api/student/opportunities/ — Published recruitment drives with server-computed eligibility."""
    permission_classes = [perm("placement.application.create")]

    def get(self, request):
        student_id = self.get_student_id(request)
        if not student_id:
            return Response({"error": "CandidateProfileNotFound"}, status=status.HTTP_404_NOT_FOUND)

        db = get_db()
        student = scoped_get("students", request.user, {"student_id": student_id}, db=db)
        if not student:
            return Response({"error": "CandidateRecordNotFound"}, status=status.HTTP_404_NOT_FOUND)

        jobs = scoped_find("jobs", request.user, extra={"status": "Open"}, db=db)
        company_ids = [j.get("company_id") for j in jobs if j.get("company_id")]
        comps = scoped_find("companies", request.user, extra={"company_id": {"$in": company_ids}}, db=db)
        companies = {c["company_id"]: c for c in comps}
        student_apps = scoped_find("applications", request.user, extra={"student_id": student_id}, db=db)
        applied_jobs = {a.get("job_id") for a in student_apps if a.get("job_id")}

        decorated_jobs = []
        for j in jobs:
            cid = j.get("company_id")
            comp = companies.get(cid, {})
            j_copy = dict(j)
            j_copy["company_name"] = comp.get("name", "Corporate Partner")
            j_copy["company_industry"] = comp.get("industry", "Technology")
            j_copy["has_applied"] = j.get("job_id") in applied_jobs

            try:
                check_eligibility(student, j)
                j_copy["eligible"] = True
                j_copy["reasons"] = []
            except PlaceFlowError as pfe:
                j_copy["eligible"] = False
                j_copy["reasons"] = [str(pfe)]
            except Exception as exc:
                j_copy["eligible"] = False
                j_copy["reasons"] = [str(exc)]

            decorated_jobs.append(j_copy)

        return Response(decorated_jobs, status=status.HTTP_200_OK)


class StudentApplyView(StudentBaseView):
    """POST /api/student/opportunities/<job_id>/apply/ — Applies for an open drive."""
    permission_classes = [perm("placement.application.create")]

    def post(self, request, job_id=None):
        student_id = self.get_student_id(request)
        if not student_id:
            return Response({"error": "CandidateProfileNotFound"}, status=status.HTTP_404_NOT_FOUND)

        actual_job_id = job_id or request.data.get("job_id")
        if not actual_job_id:
            return Response({"error": "MissingJobId"}, status=status.HTTP_400_BAD_REQUEST)

        db = get_db()
        try:
            app_id = apply_for_job(db, student_id=student_id, job_id=actual_job_id)
            return Response({"application_id": app_id, "status": "Applied"}, status=status.HTTP_201_CREATED)
        except PlaceFlowError as err:
            return Response({"error": str(err)}, status=status.HTTP_400_BAD_REQUEST)


class StudentApplicationsListView(StudentBaseView):
    """GET /api/student/applications/ — Lists active applications for the authenticated student."""
    permission_classes = [perm("placement.application.view")]

    def get(self, request):
        student_id = self.get_student_id(request)
        if not student_id:
            return Response({"error": "CandidateProfileNotFound"}, status=status.HTTP_404_NOT_FOUND)

        db = get_db()
        apps = scoped_find("applications", request.user, extra={"student_id": student_id}, sort=[("application_date", -1)], db=db)
        job_ids = [a.get("job_id") for a in apps if a.get("job_id")]
        jobs_list = scoped_find("jobs", request.user, extra={"job_id": {"$in": job_ids}}, db=db)
        jobs = {j["job_id"]: j for j in jobs_list}
        all_companies = scoped_find("companies", request.user, db=db)
        companies = {c["company_id"]: c.get("name", "") for c in all_companies}

        for a in apps:
            j = jobs.get(a.get("job_id"), {})
            a["job_title"] = j.get("title", "Corporate Position")
            a["tier"] = j.get("tier", "Standard")
            a["package_lpa"] = j.get("package_lpa", 0.0)
            a["company_name"] = companies.get(j.get("company_id"), "Corporate Partner")

        return Response(apps, status=status.HTTP_200_OK)


class StudentInterviewsListView(StudentBaseView):
    """GET /api/student/interviews/ — Scheduled interview rounds for the authenticated candidate."""
    permission_classes = [perm("placement.application.view")]

    def get(self, request):
        student_id = self.get_student_id(request)
        if not student_id:
            return Response({"error": "CandidateProfileNotFound"}, status=status.HTTP_404_NOT_FOUND)

        db = get_db()
        interviews = scoped_find("interviews", request.user, extra={"student_id": student_id}, sort="scheduled_start", db=db)

        # Enrich with company_name and role (job_title)
        for inv in interviews:
            app_id = inv.get("application_id")
            app = scoped_get("applications", request.user, {"application_id": app_id}, db=db) if app_id else None
            job = scoped_get("jobs", request.user, {"job_id": app.get("job_id")}, db=db) if app else None
            comp = scoped_get("companies", request.user, {"company_id": job.get("company_id")}, db=db) if job else None
            inv["role"] = job.get("title", "Candidate") if job else "Candidate"
            inv["job_title"] = job.get("title", "Candidate") if job else "Candidate"
            inv["company_name"] = comp.get("name", "Corporate Partner") if comp else "Corporate Partner"

        return Response(interviews, status=status.HTTP_200_OK)


class StudentOffersListView(StudentBaseView):
    """GET /api/student/offers/ — Final placement offer ledger records for the authenticated candidate."""
    permission_classes = [perm("placement.application.view")]

    def get(self, request):
        student_id = self.get_student_id(request)
        if not student_id:
            return Response({"error": "CandidateProfileNotFound"}, status=status.HTTP_404_NOT_FOUND)

        db = get_db()
        offers = scoped_find("placements", request.user, extra={"student_id": student_id}, sort=[("placement_date", -1)], db=db)
        return Response(offers, status=status.HTTP_200_OK)


class StudentOfferRespondView(StudentBaseView):
    """POST /api/student/offers/<offer_id>/respond/ — Student accepts or declines placement offer."""
    permission_classes = [perm("placement.offer.respond")]

    def post(self, request, offer_id):
        student_id = self.get_student_id(request)
        if not student_id:
            return Response({"error": "CandidateProfileNotFound"}, status=status.HTTP_404_NOT_FOUND)

        action = (request.data.get("action") or "").strip().upper()
        if action not in ("ACCEPT", "DECLINE"):
            return Response({"error": "InvalidAction", "message": "Action must be ACCEPT or DECLINE."}, status=status.HTTP_400_BAD_REQUEST)

        db = get_db()
        offer = scoped_get("placements", request.user, {"placement_id": offer_id, "student_id": student_id}, db=db)
        if not offer:
            # 404 to avoid leaking existence of out-of-scope offers
            return Response({"error": "OfferNotFound"}, status=status.HTTP_404_NOT_FOUND)

        new_status = "Accepted" if action == "ACCEPT" else "Declined"
        now = datetime.now(timezone.utc)
        db.placements.update_one(
            {"placement_id": offer_id},
            {"$set": {"response_status": new_status, "responded_at": now}},
        )

        # Notify TPO officers about student response
        stu_doc = scoped_get("students", request.user, {"student_id": student_id}, db=db)
        stu_name = (stu_doc or {}).get("name") or student_id
        for tpid in get_tpo_person_ids(db=db):
            notify(
                tpid,
                "OFFER",
                f"Placement Offer {new_status}: {stu_name}",
                f"Candidate {stu_name} ({student_id}) has {new_status.lower()} their placement offer.",
                link=f"/tpo/students/{student_id}",
                db=db,
            )

        return Response({"placement_id": offer_id, "status": new_status, "responded_at": now.isoformat()}, status=status.HTTP_200_OK)


class StudentConsentsView(StudentBaseView):
    """GET /api/student/consents/ — Active and historical DPDP consent notices and responses."""
    permission_classes = [any_of("consent.grant.record", "consent.withdraw.process")]

    def get(self, request):
        student_id = self.get_student_id(request)
        if not student_id:
            return Response({"error": "CandidateProfileNotFound"}, status=status.HTTP_404_NOT_FOUND)

        db = get_db()
        consents = get_student_consents(db, student_id)
        return Response(consents, status=status.HTTP_200_OK)


class StudentConsentRecordView(StudentBaseView):
    """POST /api/student/consents/record/ — Records candidate affirmative DPDP data sharing consent."""
    permission_classes = [perm("consent.grant.record")]

    def post(self, request):
        student_id = self.get_student_id(request)
        if not student_id:
            return Response({"error": "CandidateProfileNotFound"}, status=status.HTTP_404_NOT_FOUND)

        db = get_db()
        purpose = request.data.get("purpose")
        purposes = request.data.get("purposes")
        if not purpose and purposes and isinstance(purposes, list) and len(purposes) > 0:
            purpose = purposes[0]
        if not purpose:
            purpose = "PLACEMENT_MATCHING"

        purpose_alias_map = {
            "PlacementEligibility": "PLACEMENT_MATCHING",
            "CorporateSharing": "RECRUITER_DISCLOSURE",
            "AITelemetry": "AI_PREDICTIVE_MODELING",
        }
        canonical_purpose = purpose_alias_map.get(purpose, purpose)

        try:
            res = record_consent(db, student_id=student_id, purpose=canonical_purpose)
            cid = res.get("consent_id", f"c_{student_id}") if isinstance(res, dict) else str(res)
            return Response({"consent_id": cid, "status": "Active", "record": res}, status=status.HTTP_201_CREATED)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class StudentConsentWithdrawView(StudentBaseView):
    """POST /api/student/consents/withdraw/ — Instantly withdraws DPDP candidate consent."""
    permission_classes = [perm("consent.withdraw.process")]

    def post(self, request):
        student_id = self.get_student_id(request)
        if not student_id:
            return Response({"error": "CandidateProfileNotFound"}, status=status.HTTP_404_NOT_FOUND)

        db = get_db()
        purpose = request.data.get("purpose", "PLACEMENT_MATCHING")
        purpose_alias_map = {
            "PlacementEligibility": "PLACEMENT_MATCHING",
            "CorporateSharing": "RECRUITER_DISCLOSURE",
            "AITelemetry": "AI_PREDICTIVE_MODELING",
        }
        canonical_purpose = purpose_alias_map.get(purpose, purpose)

        try:
            res = withdraw_consent(db, student_id=student_id, purpose=canonical_purpose)
            return Response({"success": True, "message": "Consent successfully withdrawn.", "result": res}, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class StudentAcademicsView(StudentBaseView):
    """GET /api/student/academics/ — Academic standing, NEP progression, credits, and course ledger."""
    permission_classes = [any_of("student.profile.read", "academic.registration.self")]

    def get(self, request):
        student_id = self.get_student_id(request)
        if not student_id:
            return Response({"error": "CandidateProfileNotFound"}, status=status.HTTP_404_NOT_FOUND)

        db = get_db()
        student = scoped_get("students", request.user, {"student_id": student_id}, db=db)
        if not student:
            return Response({"error": "CandidateRecordNotFound"}, status=status.HTTP_404_NOT_FOUND)

        # Retrieve academic ledger entries
        ledger = list(db.student_academic_records.find({"student_id": student_id}, {"_id": 0}))
        courses = list(db.course_registrations.find({"student_id": student_id}, {"_id": 0}))

        return Response({
            "student_id": student_id,
            "name": student.get("name"),
            "cgpa": student.get("cgpa", 0.0),
            "attendance": student.get("attendance", 0.0),
            "backlogs": student.get("backlogs", 0),
            "department": student.get("department"),
            "year": student.get("year"),
            "batch": student.get("batch"),
            "academic_records": ledger,
            "courses": courses,
        }, status=status.HTTP_200_OK)


class StudentReadinessInsightsView(StudentBaseView):
    """GET /api/student/insights/readiness/ — Student placement probability, readiness band & explainability drivers."""
    permission_classes = [perm("student.profile.read")]

    def get(self, request):
        student_id = self.get_student_id(request)
        if not student_id:
            return Response({"error": "CandidateProfileNotFound"}, status=status.HTTP_404_NOT_FOUND)

        db = get_db()
        tenant_id = getattr(request.user, "tenant_id", None)
        actor_id = getattr(request.user, "user_id", None)

        from ml.serving import serving_manager
        result = serving_manager.predict_placement_readiness(
            student_id=student_id,
            tenant_id=tenant_id,
            actor_id=actor_id,
            db=db,
        )
        return Response(result, status=status.HTTP_200_OK)


class StudentSkillRecommendationsView(StudentBaseView):
    """GET /api/student/insights/skills/ — Market-aligned skill gap analysis and recommendations."""
    permission_classes = [perm("student.profile.read")]

    def get(self, request):
        student_id = self.get_student_id(request)
        if not student_id:
            return Response({"error": "CandidateProfileNotFound"}, status=status.HTTP_404_NOT_FOUND)

        db = get_db()
        tenant_id = getattr(request.user, "tenant_id", None)
        actor_id = getattr(request.user, "user_id", None)

        from ml.serving import serving_manager
        result = serving_manager.recommend_skills(
            student_id=student_id,
            tenant_id=tenant_id,
            actor_id=actor_id,
            db=db,
        )
        return Response(result, status=status.HTTP_200_OK)


class StudentWhatIfView(StudentBaseView):
    """POST /api/student/insights/whatif/ — What-if simulator evaluating hypothetical profile improvements."""
    permission_classes = [perm("student.profile.read")]

    def post(self, request):
        student_id = self.get_student_id(request)
        if not student_id:
            return Response({"error": "CandidateProfileNotFound"}, status=status.HTTP_404_NOT_FOUND)

        db = get_db()
        tenant_id = getattr(request.user, "tenant_id", None)
        data = request.data or {}

        target_cgpa = data.get("target_cgpa") or data.get("hypothetical_cgpa")
        target_cgpa = float(target_cgpa) if target_cgpa is not None else None

        target_backlogs = data.get("target_backlogs") if data.get("target_backlogs") is not None else data.get("resolved_backlogs")
        target_backlogs = int(target_backlogs) if target_backlogs is not None else None

        added_skills = data.get("added_skills") or data.get("additional_skills") or []
        if isinstance(added_skills, str):
            added_skills = [s.strip() for s in added_skills.split(",") if s.strip()]

        from ml.whatif_simulator import simulate_student_career
        result = simulate_student_career(
            db,
            student_id=student_id,
            target_cgpa=target_cgpa,
            target_backlogs=target_backlogs,
            added_skills=added_skills,
            tenant_id=tenant_id,
        )
        return Response(result, status=status.HTTP_200_OK)
