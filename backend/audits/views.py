from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import AuditCycle, AuditEntry
from .serializers import AuditCycleSerializer, AuditEntrySerializer
from assets.models import Asset

class AuditCycleViewSet(viewsets.ModelViewSet):
    queryset = AuditCycle.objects.all().order_by('-created_at')
    serializer_class = AuditCycleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status']
    search_fields = ['name']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def populate(self, request, pk=None):
        cycle = self.get_object()
        if cycle.status != 'Draft':
            return Response({'detail': 'Can only populate Draft cycles.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get all non-disposed assets
        assets = Asset.objects.exclude(status__in=['Disposed', 'Lost'])
        entries = []
        for asset in assets:
            if not AuditEntry.objects.filter(audit_cycle=cycle, asset=asset).exists():
                entries.append(AuditEntry(audit_cycle=cycle, asset=asset))
        
        AuditEntry.objects.bulk_create(entries)
        return Response({'detail': f'Populated {len(entries)} assets.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        cycle = self.get_object()
        if cycle.status == 'Completed':
            return Response({'detail': 'Already completed.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update asset statuses based on audit entries
        entries = cycle.entries.all()
        for entry in entries:
            if entry.status == 'Missing':
                entry.asset.status = 'Lost'
                entry.asset.save(update_fields=['status'])
            elif entry.status == 'Damaged':
                entry.asset.status = 'Out of Service'
                entry.asset.save(update_fields=['status'])
        
        cycle.status = 'Completed'
        cycle.save(update_fields=['status'])
        return Response({'detail': 'Audit completed.'}, status=status.HTTP_200_OK)

class AuditEntryViewSet(viewsets.ModelViewSet):
    queryset = AuditEntry.objects.select_related('asset', 'auditor').all()
    serializer_class = AuditEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['audit_cycle', 'status', 'auditor']
    search_fields = ['asset__tag', 'asset__name']

    def perform_update(self, serializer):
        serializer.save(auditor=self.request.user)
