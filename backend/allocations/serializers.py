from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import Allocation, TransferRequest, AssetBooking
from assets.serializers import AssetSerializer

class AllocationSerializer(serializers.ModelSerializer):
    asset_details = AssetSerializer(source='asset', read_only=True)
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    allocated_by_name = serializers.CharField(source='allocated_by.get_full_name', read_only=True)

    class Meta:
        model = Allocation
        fields = ['id', 'asset', 'asset_details', 'employee', 'employee_name', 'allocated_by', 'allocated_by_name', 'allocated_at', 'returned_at', 'is_active', 'notes']
        read_only_fields = ['allocated_by', 'allocated_at', 'returned_at']

    def validate(self, data):
        # Enforce uniqueness if creating an active allocation
        if data.get('is_active', True):
            asset = data.get('asset')
            if self.instance:
                active_allocs = Allocation.objects.filter(asset=asset, is_active=True).exclude(pk=self.instance.pk)
            else:
                active_allocs = Allocation.objects.filter(asset=asset, is_active=True)
                
            if active_allocs.exists():
                active_alloc = active_allocs.first()
                holder_name = active_alloc.employee.get_full_name() or active_alloc.employee.username
                holder_id = active_alloc.employee.id
                
                # We return a specific error that the frontend can parse or display
                raise serializers.ValidationError({
                    "asset": f"This asset is currently held by {holder_name}.",
                    "holder_id": holder_id
                })
        return data

class TransferRequestSerializer(serializers.ModelSerializer):
    asset_details = AssetSerializer(source='asset', read_only=True)
    from_employee_name = serializers.CharField(source='from_employee.get_full_name', read_only=True)
    to_employee_name = serializers.CharField(source='to_employee.get_full_name', read_only=True)

    class Meta:
        model = TransferRequest
        fields = '__all__'
        read_only_fields = ['requested_by', 'request_date', 'status']

class AssetBookingSerializer(serializers.ModelSerializer):
    asset_details = AssetSerializer(source='asset', read_only=True)
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)

    class Meta:
        model = AssetBooking
        fields = '__all__'
        read_only_fields = ['employee', 'created_at']

    def validate(self, data):
        # We manually call model's clean method to catch overlaps
        instance = AssetBooking(**data)
        if self.instance:
            instance.pk = self.instance.pk
            # If partial update, merge existing fields
            if 'asset' not in data: instance.asset = self.instance.asset
            if 'start_time' not in data: instance.start_time = self.instance.start_time
            if 'end_time' not in data: instance.end_time = self.instance.end_time
        
        try:
            instance.clean()
        except ValidationError as e:
            # Raise validation error using messages list if present to avoid brackets
            raise serializers.ValidationError(e.messages if hasattr(e, 'messages') else str(e))
        except Exception as e:
            raise serializers.ValidationError(str(e))
        return data
