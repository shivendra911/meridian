"""PlaceFlow / Meridian — Faculty Portal URL Routing (Phase 6).
Maps namespaced /api/faculty/* routes for Faculty Advising & Course Delivery.
Gated strictly by PortalAccess("faculty").
"""

from django.urls import path
from api import views_students, views_hierarchy
from api.auth.permissions import portal_gated

def faculty(cls):
    return portal_gated(cls, "faculty")

urlpatterns = [
    path("mentees/", faculty(views_students.FacultyMenteesView).as_view(), name="faculty_mentees"),
    path("mentees/<str:student_id>/", faculty(views_students.StudentDetailView).as_view(), name="faculty_mentee_detail"),
    path("summary/", faculty(views_hierarchy.InstitutionalSummaryView).as_view(), name="faculty_summary"),
]
