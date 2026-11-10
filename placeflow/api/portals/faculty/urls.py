"""PlaceFlow / Meridian — Faculty Portal URL Routing (Phase 6).
Maps namespaced /api/faculty/* routes for Faculty Advising & Course Delivery.
"""

from django.urls import path
from api import views_students, views_hierarchy

urlpatterns = [
    path("mentees/", views_students.FacultyMenteesView.as_view(), name="faculty_mentees"),
    path("mentees/<str:student_id>/", views_students.StudentDetailView.as_view(), name="faculty_mentee_detail"),
    path("summary/", views_hierarchy.InstitutionalSummaryView.as_view(), name="faculty_summary"),
]

