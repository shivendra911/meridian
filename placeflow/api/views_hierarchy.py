"""
PlaceFlow / Meridian API — Institutional Hierarchy, Faculty Mentorship & Drive Telemetry
========================================================================================
Exposes authoritative query endpoints for:
- Institutional Rollup Summary & School Heads (HOS)
- Department Heads (HODs) & Faculty Mentors
- Faculty Cohort Detail with Action Items & Mentees
- Accenture 2026 Drive Funnel Telemetry & Ineligibility Reasons
- Institutional Relationship Graph Queries
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from database.connection import get_db
from api.auth.permissions import perm, any_of


class InstitutionalSummaryView(APIView):
    """Returns high-level institutional rollup metrics across HOS, HODs, Faculty, Admins, and Students."""
    permission_classes = [any_of("organization.unit.create", "organization.unit.update", "student.profile.read", "placement.application.view")]

    def get(self, request):
        db = get_db()
        drive = db.placement_drives.find_one({"drive_id": "DRV_ACCENTURE_2026"}, {"_id": 0})
        hos_list = list(db.school_heads.find({}, {"_id": 0}).sort("students_count", -1))
        
        total_students = db.students.count_documents({})
        total_faculty = db.faculty.count_documents({})
        total_hods = db.department_heads.count_documents({})
        total_admins = db.admins.count_documents({})
        total_relationships = db.institutional_relationships.count_documents({})

        # Multi-role faculty breakdown
        teachers_count = db.faculty.count_documents({"roles": "TEACHER"})
        mentors_count = db.faculty.count_documents({"roles": "MENTOR"})
        faculty_hods_count = db.faculty.count_documents({"is_hod": True})
        faculty_hos_count = db.faculty.count_documents({"is_hos": True})
        coordinators_count = db.faculty.count_documents({"is_placement_coordinator": True})

        return Response({
            "status": "SUCCESS",
            "kpis": {
                "total_students": total_students,
                "total_faculty_personnel": total_faculty,
                "total_department_heads": total_hods,
                "total_school_deans": len(hos_list),
                "total_administrators": total_admins,
                "total_graph_relationships": total_relationships,
                "multi_role_breakdown": {
                    "active_teachers": teachers_count,
                    "active_mentors": mentors_count,
                    "teachers_serving_as_hod": faculty_hods_count,
                    "teachers_serving_as_hos": faculty_hos_count,
                    "faculty_placement_coordinators": coordinators_count,
                },
            },
            "drive": drive,
            "school_heads": hos_list,
        }, status=status.HTTP_200_OK)


class SchoolHeadsListView(APIView):
    """Returns the 4 School Heads (HOS) with their departmental breakdown and completion rates."""
    permission_classes = [any_of("organization.unit.create", "organization.unit.update", "student.profile.read")]

    def get(self, request):
        db = get_db()
        hos_list = list(db.school_heads.find({}, {"_id": 0}).sort("students_count", -1))
        return Response({
            "count": len(hos_list),
            "school_heads": hos_list,
        }, status=status.HTTP_200_OK)


class DepartmentHeadsListView(APIView):
    """Returns Department Heads (HODs) with filtering by HOS and sorting by completion rate."""
    permission_classes = [any_of("organization.unit.create", "organization.unit.update", "student.profile.read")]

    def get(self, request):
        db = get_db()
        hos_filter = request.query_params.get("hos")
        query = {}
        if hos_filter:
            query["hos_name"] = hos_filter

        hods = list(db.department_heads.find(query, {"_id": 0}).sort("students_count", -1))
        return Response({
            "count": len(hods),
            "department_heads": hods,
        }, status=status.HTTP_200_OK)


class FacultyListView(APIView):
    """Returns searchable, paginated Faculty Mentor profiles with cohort stats and action items."""
    permission_classes = [any_of("organization.unit.create", "organization.unit.update", "student.profile.read")]

    def get(self, request):
        db = get_db()
        hod_filter = request.query_params.get("hod_id")
        hos_filter = request.query_params.get("hos")
        role_filter = request.query_params.get("role")
        department_filter = request.query_params.get("department")
        search_query = request.query_params.get("search", "").strip()
        sort_by = request.query_params.get("sort", "mentees_count")
        
        query = {}
        if hod_filter:
            query["hod_id"] = hod_filter
        if hos_filter:
            query["hos_name"] = hos_filter
        if role_filter:
            query["roles"] = role_filter.upper()
        if department_filter:
            query["department"] = department_filter.upper()
        if search_query:
            query["$or"] = [
                {"name": {"$regex": search_query, "$options": "i"}},
                {"faculty_id": {"$regex": search_query, "$options": "i"}},
                {"school": {"$regex": search_query, "$options": "i"}},
                {"department": {"$regex": search_query, "$options": "i"}},
                {"roles": {"$regex": search_query, "$options": "i"}},
            ]

        # Sorting direction
        sort_dir = -1 if sort_by in ["mentees_count", "action_items_count", "completion_rate", "form_pending_count"] else 1
        
        try:
            page = max(1, int(request.query_params.get("page", 1)))
            page_size = min(100, max(10, int(request.query_params.get("limit", 25))))
        except ValueError:
            page = 1
            page_size = 25

        total_count = db.faculty.count_documents(query)
        skip = (page - 1) * page_size
        
        faculty_roster = list(db.faculty.find(query, {"_id": 0, "mentee_ids": 0})
                              .sort(sort_by, sort_dir)
                              .skip(skip)
                              .limit(page_size))

        return Response({
            "total_count": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": (total_count + page_size - 1) // page_size,
            "faculty": faculty_roster,
        }, status=status.HTTP_200_OK)


class FacultyDetailView(APIView):
    """Returns complete multi-role teacher dossier including courses, HOD/HOS appointments, and student mentees."""
    permission_classes = [any_of("organization.unit.create", "organization.unit.update", "student.profile.read")]

    def get(self, request, faculty_id):
        db = get_db()
        fid = faculty_id.strip()
        faculty = db.faculty.find_one({"faculty_id": fid}, {"_id": 0})
        if not faculty:
            return Response({"error": f"Faculty mentor '{fid}' not found"}, status=status.HTTP_404_NOT_FOUND)

        # Retrieve full student mentees
        mentees = list(db.students.find({"mentor_id": fid}, {"_id": 0}).sort("name", 1))

        # Categorize actionable student groups
        pending_students = [s for s in mentees if s.get("survey_status") == "Pending"]
        blocked_students = [s for s in mentees if s.get("verification_issue")]
        placed_students = [s for s in mentees if s.get("placement_status") == "Placed"]
        eligible_students = [s for s in mentees if s.get("company_eligibility") == "Eligible for Assesment"]

        # Associated administrative and leadership profiles
        hod_profile = None
        if faculty.get("is_hod") or faculty.get("hod_id"):
            hod_profile = db.department_heads.find_one({"hod_id": faculty.get("hod_id")}, {"_id": 0})

        hos_profile = None
        if faculty.get("is_hos"):
            hos_profile = db.school_heads.find_one({"faculty_id": fid}, {"_id": 0})

        admin_profile = None
        if faculty.get("is_admin"):
            admin_profile = db.admins.find_one({"faculty_id": fid}, {"_id": 0})

        # Directed graph connections for this faculty member
        network_edges = list(db.institutional_relationships.find(
            {"$or": [{"from_id": fid}, {"to_id": fid}]},
            {"_id": 0}
        ).limit(100))

        # Department colleagues (co-teachers)
        colleagues = list(db.faculty.find(
            {"department": faculty.get("department"), "faculty_id": {"$ne": fid}},
            {"_id": 0, "faculty_id": 1, "name": 1, "designation": 1, "roles": 1, "email": 1}
        ).limit(10))

        return Response({
            "faculty": faculty,
            "roles": faculty.get("roles", ["TEACHER"]),
            "teaching": {
                "courses": faculty.get("courses_taught", []),
                "office_location": faculty.get("office_location", "Main Faculty Block"),
                "academic_rank": faculty.get("academic_rank", "Assistant Professor"),
                "committees": faculty.get("committees", []),
            },
            "appointments": {
                "hod": hod_profile,
                "hos": hos_profile,
                "admin": admin_profile,
            },
            "colleagues": colleagues,
            "network_relationships": network_edges,
            "mentees_count": len(mentees),
            "mentees": mentees,
            "cohort_breakdown": {
                "eligible": len(eligible_students),
                "not_eligible": len(mentees) - len(eligible_students),
                "survey_filled": len(mentees) - len(pending_students),
                "survey_pending": len(pending_students),
                "placed_elsewhere": len(placed_students),
                "verification_issues": len(blocked_students),
            },
            "action_items": {
                "pending_submission": pending_students,
                "verification_blocked": blocked_students,
            }
        }, status=status.HTTP_200_OK)


class AdminListView(APIView):
    """Returns directory of institutional administrators, directorates, and executive officers."""
    permission_classes = [any_of("iam.account.create", "organization.unit.create", "student.profile.read")]

    def get(self, request):
        db = get_db()
        admins = list(db.admins.find({}, {"_id": 0}).sort("admin_id", 1))
        return Response({
            "count": len(admins),
            "admins": admins,
        }, status=status.HTTP_200_OK)


class AdminDetailView(APIView):
    """Returns administrative dossier including permissions, jurisdiction, and linked teacher profile."""
    permission_classes = [any_of("iam.account.create", "organization.unit.create", "student.profile.read")]

    def get(self, request, admin_id):
        db = get_db()
        aid = admin_id.strip()
        admin = db.admins.find_one({"admin_id": aid}, {"_id": 0})
        if not admin:
            return Response({"error": f"Administrator '{aid}' not found"}, status=status.HTTP_404_NOT_FOUND)

        linked_faculty = None
        if admin.get("faculty_id"):
            linked_faculty = db.faculty.find_one({"faculty_id": admin["faculty_id"]}, {"_id": 0})

        network_edges = list(db.institutional_relationships.find(
            {"$or": [{"from_id": aid}, {"to_id": aid}]},
            {"_id": 0}
        ))

        return Response({
            "admin": admin,
            "linked_faculty": linked_faculty,
            "network_relationships": network_edges,
        }, status=status.HTTP_200_OK)


class UnifiedPersonProfileView(APIView):
    """Resolves any individual (Student, Teacher, HOD, HOS, Admin) into a unified 360-degree profile."""
    permission_classes = [any_of("student.profile.read", "organization.unit.create", "placement.application.view")]

    def get(self, request, identifier):
        db = get_db()
        ident = identifier.strip()

        # 1. Search student
        student = db.students.find_one(
            {"$or": [{"student_id": ident}, {"reg_no": ident}, {"email": ident}]},
            {"_id": 0}
        )
        if student:
            mentor = db.faculty.find_one({"faculty_id": student.get("mentor_id")}, {"_id": 0, "name": 1, "email": 1, "phone": 1, "designation": 1})
            relationships = list(db.institutional_relationships.find({"from_id": student["student_id"]}, {"_id": 0}))
            return Response({
                "entity_type": "STUDENT",
                "profile": student,
                "mentor": mentor,
                "relationships": relationships,
            }, status=status.HTTP_200_OK)

        # 2. Search faculty / teacher (includes HODs and HOSs with teaching appointments)
        faculty = db.faculty.find_one(
            {"$or": [{"faculty_id": ident}, {"employee_code": ident}, {"email": ident}]},
            {"_id": 0}
        )
        if faculty:
            fid = faculty["faculty_id"]
            hod_info = db.department_heads.find_one({"hod_id": faculty.get("hod_id")}, {"_id": 0}) if faculty.get("is_hod") else None
            hos_info = db.school_heads.find_one({"faculty_id": fid}, {"_id": 0}) if faculty.get("is_hos") else None
            admin_info = db.admins.find_one({"faculty_id": fid}, {"_id": 0}) if faculty.get("is_admin") else None
            relationships = list(db.institutional_relationships.find({"$or": [{"from_id": fid}, {"to_id": fid}]}, {"_id": 0}))

            return Response({
                "entity_type": "FACULTY",
                "profile": faculty,
                "roles": faculty.get("roles", ["TEACHER"]),
                "appointments": {
                    "hod": hod_info,
                    "hos": hos_info,
                    "admin": admin_info,
                },
                "relationships": relationships,
            }, status=status.HTTP_200_OK)

        # 3. Search Admin
        admin = db.admins.find_one(
            {"$or": [{"admin_id": ident}, {"employee_code": ident}, {"email": ident}]},
            {"_id": 0}
        )
        if admin:
            linked_fac = db.faculty.find_one({"faculty_id": admin.get("faculty_id")}, {"_id": 0}) if admin.get("faculty_id") else None
            relationships = list(db.institutional_relationships.find({"$or": [{"from_id": admin["admin_id"]}, {"to_id": admin["admin_id"]}]}, {"_id": 0}))
            return Response({
                "entity_type": "ADMIN",
                "profile": admin,
                "linked_faculty": linked_fac,
                "relationships": relationships,
            }, status=status.HTTP_200_OK)

        # 4. Search HOD by ID
        hod = db.department_heads.find_one({"hod_id": ident}, {"_id": 0})
        if hod:
            fac = db.faculty.find_one({"faculty_id": hod.get("faculty_id", ident)}, {"_id": 0})
            return Response({
                "entity_type": "DEPARTMENT_HEAD",
                "profile": hod,
                "faculty_dossier": fac,
            }, status=status.HTTP_200_OK)

        # 5. Search HOS by ID
        hos = db.school_heads.find_one({"hos_id": ident}, {"_id": 0})
        if hos:
            fac = db.faculty.find_one({"faculty_id": hos.get("faculty_id")}, {"_id": 0})
            return Response({
                "entity_type": "SCHOOL_HEAD",
                "profile": hos,
                "faculty_dossier": fac,
            }, status=status.HTTP_200_OK)

        return Response({"error": f"Profile '{ident}' not found across Students, Faculty, Administrators, or Deans."}, status=status.HTTP_404_NOT_FOUND)


class PlacementDriveDetailView(APIView):
    """Returns comprehensive Accenture 2026 drive telemetry and candidate funnel analysis."""
    permission_classes = [perm("placement.drive.manage")]

    def get(self, request):
        db = get_db()
        drive = db.placement_drives.find_one({"drive_id": "DRV_ACCENTURE_2026"}, {"_id": 0})
        if not drive:
            return Response({"error": "Drive telemetry not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "status": "SUCCESS",
            "drive": drive,
        }, status=status.HTTP_200_OK)


class InstitutionalRelationshipsView(APIView):
    """Queries directed graph relationships for a given node or relation type."""
    permission_classes = [any_of("organization.unit.create", "organization.unit.update", "student.profile.read")]

    def get(self, request):
        db = get_db()
        node_id = request.query_params.get("node_id")
        relation_type = request.query_params.get("relation_type")
        
        query = {}
        if node_id:
            query["$or"] = [{"from_id": node_id}, {"to_id": node_id}]
        if relation_type:
            query["relation_type"] = relation_type

        limit = min(500, int(request.query_params.get("limit", 100)))
        relations = list(db.institutional_relationships.find(query, {"_id": 0}).limit(limit))

        return Response({
            "count": len(relations),
            "relationships": relations,
        }, status=status.HTTP_200_OK)

