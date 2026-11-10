"""PlaceFlow / Meridian — Student Portal URL Dispatcher."""

from django.urls import path
from api.portals.student import views

urlpatterns = [
    path("me/", views.StudentMeView.as_view(), name="student_me"),
    path("profile/", views.StudentProfileUpdateView.as_view(), name="student_profile"),
    path("opportunities/", views.StudentOpportunitiesView.as_view(), name="student_opportunities"),
    path("opportunities/<str:job_id>/apply/", views.StudentApplyView.as_view(), name="student_apply"),
    path("applications/", views.StudentApplicationsListView.as_view(), name="student_applications"),
    path("interviews/", views.StudentInterviewsListView.as_view(), name="student_interviews"),
    path("offers/", views.StudentOffersListView.as_view(), name="student_offers"),
    path("offers/<str:offer_id>/respond/", views.StudentOfferRespondView.as_view(), name="student_offer_respond"),
    path("consents/", views.StudentConsentsView.as_view(), name="student_consents"),
    path("consents/record/", views.StudentConsentRecordView.as_view(), name="student_consent_record"),
    path("consents/withdraw/", views.StudentConsentWithdrawView.as_view(), name="student_consent_withdraw"),
    path("academics/", views.StudentAcademicsView.as_view(), name="student_academics"),
]

