from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssetCategoryViewSet, AssetViewSet, AssetStatusLogViewSet

router = DefaultRouter()
router.register('categories', AssetCategoryViewSet, basename='assetcategory')
router.register('assets', AssetViewSet, basename='asset')
router.register('status-logs', AssetStatusLogViewSet, basename='assetstatuslog')

urlpatterns = [
    path('', include(router.urls)),
]
