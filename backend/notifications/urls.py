from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, ActivityLogViewSet, NotificationUnreadCountView

router = DefaultRouter()
router.register('messages', NotificationViewSet, basename='notification')
router.register('logs', ActivityLogViewSet, basename='activitylog')

urlpatterns = [
    path('unread-count/', NotificationUnreadCountView.as_view(), name='notification-unread-count'),
    path('', include(router.urls)),
]
