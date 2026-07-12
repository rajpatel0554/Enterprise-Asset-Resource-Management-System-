from django.contrib import admin
from .models import Allocation, TransferRequest, AssetBooking

@admin.register(Allocation)
class AllocationAdmin(admin.ModelAdmin):
    list_display = ('asset', 'employee', 'is_active', 'allocated_at', 'returned_at')
    list_filter = ('is_active',)
    search_fields = ('asset__tag', 'employee__username')

@admin.register(TransferRequest)
class TransferRequestAdmin(admin.ModelAdmin):
    list_display = ('asset', 'from_employee', 'to_employee', 'status', 'request_date')
    list_filter = ('status',)
    search_fields = ('asset__tag',)

@admin.register(AssetBooking)
class AssetBookingAdmin(admin.ModelAdmin):
    list_display = ('asset', 'employee', 'start_time', 'end_time')
    list_filter = ('start_time', 'end_time')
    search_fields = ('asset__tag', 'employee__username')
