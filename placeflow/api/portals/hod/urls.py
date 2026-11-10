"""PlaceFlow / Meridian — HOD Portal URL Routing (Phase 6).
Maps namespaced /api/hod/* routes for Department Leadership.
"""

from django.urls import path
from api import views_students, views_hierarchy

urlpatterns = [
    path("students/", views_students.HodStudentsView.as_view(), name="hod_students"),
    path("students/<str:student_id>/", views_students.StudentDetailView.as_view(), name="hod_student_detail"),
    path("faculty/", views_hierarchy.FacultyListView.as_view(), name="hod_faculty"),
    path("summary/", views_hierarchy.InstitutionalSummaryView.as_view(), name="hod_summary"),
]

