"""CAMP-03: Academic Structure & Student Lifecycle REST API Endpoints.
Mounted under /api/v4/academic/ for complete institutional academic lifecycle operations.
"""

from datetime import datetime, timezone
from typing import Any, Dict
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from database.connection import get_db
from camp_03.qualifications import create_qualification_definition, list_qualifications
from camp_03.programs import (
    create_academic_program,
    list_academic_programs,
    create_program_version,
    get_program_version,
    approve_program_version,
)
from camp_03.offerings import create_program_offering, list_program_offerings
from camp_03.courses import create_course, list_courses, create_course_version
from camp_03.calendars import (
    create_academic_calendar,
    create_academic_year,
    create_academic_term,
)
from camp_03.students import (
    create_student_record,
    enroll_student_in_program,
    get_student_record,
)
from camp_03.registration import (
    publish_course_offering,
    register_student_for_course,
)
from camp_03.ledger import (
    record_credit_entry,
    get_student_credit_balance,
    list_student_credit_ledger,
)
from camp_03.evaluations import (
    evaluate_term_summary,
    evaluate_student_progression,
)


def _get_tenant_inst(request):
    tenant_id = request.headers.get("X-Tenant-ID") or request.query_params.get("tenant_id") or "ten_default"
    inst_id = request.headers.get("X-Institution-ID") or request.query_params.get("institution_id") or "inst_default"
    return tenant_id, inst_id


@api_view(["GET", "POST"])
def qualifications_view(request):
    db = get_db()
    tenant_id, inst_id = _get_tenant_inst(request)

    if request.method == "GET":
        category = request.query_params.get("category")
        quals = list_qualifications(db, tenant_id=tenant_id, institution_id=inst_id, category=category)
        for q in quals:
            q.pop("_id", None)
        return Response({"qualifications": quals})

    data = request.data
    try:
        doc = create_qualification_definition(
            db=db,
            tenant_id=data.get("tenant_id", tenant_id),
            institution_id=data.get("institution_id", inst_id),
            qualification_code=data["qualification_code"],
            official_title=data["official_title"],
            qualification_level=float(data["qualification_level"]),
            qualification_category=data["qualification_category"],
            awarding_authority_type=data.get("awarding_authority_type", "UNIVERSITY"),
            framework_reference=data.get("framework_reference"),
        )
        doc.pop("_id", None)
        return Response(doc, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
def programs_view(request):
    db = get_db()
    tenant_id, inst_id = _get_tenant_inst(request)

    if request.method == "GET":
        progs = list_academic_programs(db, tenant_id=tenant_id, institution_id=inst_id)
        for p in progs:
            p.pop("_id", None)
        return Response({"programs": progs})

    data = request.data
    try:
        doc = create_academic_program(
            db=db,
            tenant_id=data.get("tenant_id", tenant_id),
            institution_id=data.get("institution_id", inst_id),
            program_code=data["program_code"],
            program_title=data["program_title"],
            qualification_id=data["qualification_id"],
            primary_academic_unit_id=data["primary_academic_unit_id"],
            is_interdisciplinary=data.get("is_interdisciplinary", False),
            nominal_duration_semesters=data.get("nominal_duration_semesters", 8),
            maximum_duration_semesters=data.get("maximum_duration_semesters", 12),
        )
        doc.pop("_id", None)
        return Response(doc, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
def courses_view(request):
    db = get_db()
    tenant_id, inst_id = _get_tenant_inst(request)

    if request.method == "GET":
        courses = list_courses(db, tenant_id=tenant_id, institution_id=inst_id)
        for c in courses:
            c.pop("_id", None)
        return Response({"courses": courses})

    data = request.data
    try:
        doc = create_course(
            db=db,
            tenant_id=data.get("tenant_id", tenant_id),
            institution_id=data.get("institution_id", inst_id),
            course_code=data["course_code"],
            course_title=data["course_title"],
            offering_academic_unit_id=data["offering_academic_unit_id"],
            course_level=data.get("course_level", 100),
        )
        doc.pop("_id", None)
        return Response(doc, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
def calendars_view(request):
    db = get_db()
    tenant_id, inst_id = _get_tenant_inst(request)

    if request.method == "GET":
        cursor = db.academic_calendars.find(
            {"tenant_id": tenant_id, "institution_id": inst_id}, {"_id": 0}
        )
        return Response({"calendars": list(cursor)})

    data = request.data
    try:
        doc = create_academic_calendar(
            db=db,
            tenant_id=data.get("tenant_id", tenant_id),
            institution_id=data.get("institution_id", inst_id),
            calendar_name=data["calendar_name"],
            calendar_type=data.get("calendar_type", "SEMESTER"),
        )
        doc.pop("_id", None)
        return Response(doc, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
def students_view(request):
    db = get_db()
    tenant_id, inst_id = _get_tenant_inst(request)

    if request.method == "GET":
        q = request.query_params.get("search", "").strip()
        query: Dict[str, Any] = {"tenant_id": tenant_id, "institution_id": inst_id}
        if q:
            query["$or"] = [
                {"registration_number": {"$regex": q, "$options": "i"}},
                {"roll_number": {"$regex": q, "$options": "i"}},
            ]
        cursor = db.student_records.find(query, {"_id": 0}).limit(50)
        return Response({"students": list(cursor)})

    data = request.data
    try:
        doc = create_student_record(
            db=db,
            tenant_id=data.get("tenant_id", tenant_id),
            institution_id=data.get("institution_id", inst_id),
            person_id=data["person_id"],
            membership_id=data["membership_id"],
            registration_number=data["registration_number"],
            roll_number=data["roll_number"],
            admission_number=data.get("admission_number"),
        )
        doc.pop("_id", None)
        return Response(doc, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
def student_ledger_view(request, enrollment_id):
    db = get_db()
    if request.method == "GET":
        balance = get_student_credit_balance(db, enrollment_id)
        entries = list_student_credit_ledger(db, enrollment_id)
        for e in entries:
            e.pop("_id", None)
        return Response({"balance": balance, "entries": entries})

    data = request.data
    try:
        doc = record_credit_entry(
            db=db,
            enrollment_id=enrollment_id,
            source_type=data.get("source_type", "COURSE_COMPLETION"),
            source_record_id=data["source_record_id"],
            credit_amount=float(data["credit_amount"]),
            credit_type=data.get("credit_type", "ACADEMIC"),
            course_category=data.get("course_category", "MAJOR_CORE"),
            course_id=data.get("course_id"),
        )
        doc.pop("_id", None)
        return Response(doc, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def progression_evaluate_view(request):
    db = get_db()
    data = request.data
    try:
        res = evaluate_student_progression(
            db=db,
            enrollment_id=data["enrollment_id"],
            academic_year_id=data["academic_year_id"],
            from_sequence=data.get("from_sequence", 1),
            to_sequence=data.get("to_sequence", 2),
            promotion_policy=data.get("promotion_policy"),
            authorized_by_membership_id=data.get("authorized_by_membership_id"),
        )
        res.pop("_id", None)
        return Response(res, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

