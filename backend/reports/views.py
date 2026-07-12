from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from assets.models import Asset
from maintenance.models import MaintenanceRequest
from allocations.models import Allocation, TransferRequest
from audits.models import AuditCycle

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total_assets = Asset.objects.exclude(status__in=['Disposed', 'Lost']).count()
        available_assets = Asset.objects.filter(status='Available').count()
        allocated_assets = Asset.objects.filter(status='Allocated').count()
        maintenance_assets = Asset.objects.filter(status='Maintenance').count()
        
        pending_transfers = TransferRequest.objects.filter(status='Pending').count()
        open_maintenance = MaintenanceRequest.objects.filter(status__in=['Open', 'In Progress']).count()
        active_audits = AuditCycle.objects.filter(status='In Progress').count()

        status_breakdown = list(Asset.objects.values('status').annotate(count=Count('id')))

        return Response({
            'kpis': {
                'total_assets': total_assets,
                'available_assets': available_assets,
                'allocated_assets': allocated_assets,
                'maintenance_assets': maintenance_assets,
                'pending_transfers': pending_transfers,
                'open_maintenance': open_maintenance,
                'active_audits': active_audits
            },
            'status_breakdown': status_breakdown
        })
