from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import AssetCategory, Asset, AssetStatusLog
from .serializers import AssetCategorySerializer, AssetSerializer, AssetStatusLogSerializer

class IsAdminOrManagerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role in ['Admin', 'AssetManager']

class AssetCategoryViewSet(viewsets.ModelViewSet):
    queryset = AssetCategory.objects.all().order_by('name')
    serializer_class = AssetCategorySerializer
    permission_classes = [IsAdminOrManagerOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.select_related('category').all().order_by('-created_at')
    serializer_class = AssetSerializer
    permission_classes = [IsAdminOrManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status']
    search_fields = ['tag', 'name', 'description']
    ordering_fields = ['created_at', 'name', 'status']

    def perform_create(self, serializer):
        asset = serializer.save()
        # Create initial status log
        AssetStatusLog.objects.create(
            asset=asset,
            old_status='',
            new_status=asset.status,
            changed_by=self.request.user,
            notes='Asset registered in system'
        )

    def perform_update(self, serializer):
        # We need to check if the status is changing
        asset = self.get_object()
        old_status = asset.status
        new_asset = serializer.save()

        if old_status != new_asset.status:
            AssetStatusLog.objects.create(
                asset=new_asset,
                old_status=old_status,
                new_status=new_asset.status,
                changed_by=self.request.user,
                notes='Status updated via Asset edit'
            )

class AssetStatusLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AssetStatusLog.objects.select_related('asset', 'changed_by').all().order_by('-timestamp')
    serializer_class = AssetStatusLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['asset', 'new_status']
