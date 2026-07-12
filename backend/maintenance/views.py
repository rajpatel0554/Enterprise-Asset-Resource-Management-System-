from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import MaintenanceRequest
from .serializers import MaintenanceRequestSerializer

class MaintenanceRequestViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceRequest.objects.select_related('asset', 'reported_by', 'assigned_to').all().order_by('-created_at')
    serializer_class = MaintenanceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'asset', 'reported_by', 'assigned_to']
    search_fields = ['issue_description', 'asset__tag', 'asset__name']

    def perform_create(self, serializer):
        request = serializer.save(reported_by=self.request.user)
        self._sync_asset_status(request)

    def perform_update(self, serializer):
        request = serializer.save()
        self._sync_asset_status(request)

    def _sync_asset_status(self, request):
        asset = request.asset
        old_status = asset.status

        # If maintenance is in progress, mark asset as Maintenance
        if request.status == 'In Progress':
            asset.status = 'Maintenance'
        # If maintenance resolved and asset was in maintenance, make it available
        elif request.status == 'Resolved' and asset.status == 'Maintenance':
            # Check if there are other open/in-progress requests for this asset
            active_requests = MaintenanceRequest.objects.filter(
                asset=asset, 
                status__in=['Open', 'In Progress']
            ).exclude(id=request.id).exists()
            
            if not active_requests:
                asset.status = 'Available'
        
        if asset.status != old_status:
            asset.save(update_fields=['status'])
