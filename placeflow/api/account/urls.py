"""PlaceFlow / Meridian — Account & Profile Management URL Routing (Phase 1)."""

from django.urls import path
from api.account import views

urlpatterns = [
    path("profile/", views.AccountProfileView.as_view(), name="account_profile"),
    path("avatar/", views.AccountAvatarUploadView.as_view(), name="account_avatar_upload"),
    path("sessions/", views.AccountSessionsListView.as_view(), name="account_sessions_list"),
    path("sessions/revoke-others/", views.AccountSessionsRevokeOthersView.as_view(), name="account_sessions_revoke_others"),
    path("sessions/<str:session_id>/", views.AccountSessionDetailView.as_view(), name="account_session_detail"),
    path("password/change/", views.AccountPasswordChangeView.as_view(), name="account_password_change"),
    path("notifications/", views.AccountNotificationsView.as_view(), name="account_notifications"),
    path("notifications/read/", views.AccountNotificationsReadView.as_view(), name="account_notifications_read"),
]

