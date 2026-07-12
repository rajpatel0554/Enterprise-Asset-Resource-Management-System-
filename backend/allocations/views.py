from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Allocation, TransferRequest, AssetBooking
from .serializers import AllocationSerializer, TransferRequestSerializer, AssetBookingSerializer
from assets.models import AssetStatusLog

class AllocationViewSet(viewsets.ModelViewSet):
    queryset = Allocation.objects.select_related('asset', 'employee', 'allocated_by').all().order_by('-allocated_at')
    serializer_class = AllocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['asset', 'employee', 'is_active']

    def perform_create(self, serializer):
        allocation = serializer.save(allocated_by=self.request.user)
        # Update asset status
        asset = allocation.asset
        old_status = asset.status
        asset.status = 'Allocated'
        asset.save(update_fields=['status'])
        
        # Log status change
        AssetStatusLog.objects.create(
            asset=asset, old_status=old_status, new_status='Allocated',
            changed_by=self.request.user, notes=f'Allocated to {allocation.employee.username}'
        )

    def perform_update(self, serializer):
        old_active = self.get_object().is_active
        allocation = serializer.save()
        if old_active and not allocation.is_active:
            # Asset returned
            allocation.returned_at = timezone.now()
            allocation.save(update_fields=['returned_at'])
            
            asset = allocation.asset
            old_status = asset.status
            asset.status = 'Available'
            asset.save(update_fields=['status'])
            
            AssetStatusLog.objects.create(
                asset=asset, old_status=old_status, new_status='Available',
                changed_by=self.request.user, notes='Asset returned'
            )

class TransferRequestViewSet(viewsets.ModelViewSet):
    queryset = TransferRequest.objects.select_related('asset', 'from_employee', 'to_employee').all().order_by('-request_date')
    serializer_class = TransferRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status != 'Pending':
            return Response({'detail': 'Only pending requests can be approved.'}, status=status.HTTP_400_BAD_REQUEST)
        
        transfer.status = 'Approved'
        transfer.save(update_fields=['status'])

        # End old allocation
        old_alloc = Allocation.objects.filter(asset=transfer.asset, employee=transfer.from_employee, is_active=True).first()
        if old_alloc:
            old_alloc.is_active = False
            old_alloc.returned_at = timezone.now()
            old_alloc.save(update_fields=['is_active', 'returned_at'])

        # Create new allocation
        Allocation.objects.create(
            asset=transfer.asset,
            employee=transfer.to_employee,
            allocated_by=request.user,
            notes=f'Transferred from {transfer.from_employee.username}. Reason: {transfer.reason}'
        )
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status != 'Pending':
            return Response({'detail': 'Only pending requests can be rejected.'}, status=status.HTTP_400_BAD_REQUEST)
        
        transfer.status = 'Rejected'
        transfer.save(update_fields=['status'])
        return Response({'status': 'rejected'})

class AssetBookingViewSet(viewsets.ModelViewSet):
    queryset = AssetBooking.objects.select_related('asset', 'employee').all().order_by('-start_time')
    serializer_class = AssetBookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['asset', 'employee']

    def perform_create(self, serializer):
        serializer.save(employee=self.request.user)
