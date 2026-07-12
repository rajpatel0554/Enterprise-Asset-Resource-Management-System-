from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuditCycleViewSet, AuditEntryViewSet

router = DefaultRouter()
router.register('cycles', AuditCycleViewSet, basename='auditcycle')
router.register('entries', AuditEntryViewSet, basename='auditentry')

urlpatterns = [
    path('', include(router.urls)),
]
