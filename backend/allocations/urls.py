from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AllocationViewSet, TransferRequestViewSet, AssetBookingViewSet

router = DefaultRouter()
router.register('allocations', AllocationViewSet, basename='allocation')
router.register('transfers', TransferRequestViewSet, basename='transfer')
router.register('bookings', AssetBookingViewSet, basename='booking')

urlpatterns = [
    path('', include(router.urls)),
]
