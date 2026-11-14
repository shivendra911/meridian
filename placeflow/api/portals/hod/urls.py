"""PlaceFlow / Meridian — HOD Portal URL Routing (Phase 6).
Maps namespaced /api/hod/* routes for Department Leadership.
Gated strictly by PortalAccess("hod").
"""

from django.urls import path
from api import views_students, views_hierarchy
from api.auth.permissions import portal_gated

def hod(cls):
    return portal_gated(cls, "hod")

urlpatterns = [
    path("students/", hod(views_students.HodStudentsView).as_view(), name="hod_students"),
    path("students/<str:student_id>/", hod(views_students.StudentDetailView).as_view(), name="hod_student_detail"),
    path("faculty/", hod(views_hierarchy.FacultyListView).as_view(), name="hod_faculty"),
    path("summary/", hod(views_hierarchy.InstitutionalSummaryView).as_view(), name="hod_summary"),
]
