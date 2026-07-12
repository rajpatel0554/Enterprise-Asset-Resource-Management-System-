from rest_framework import serializers
from django.utils import timezone
from .models import MaintenanceRequest
from assets.serializers import AssetSerializer

class MaintenanceRequestSerializer(serializers.ModelSerializer):
    asset_details = AssetSerializer(source='asset', read_only=True)
    reported_by_name = serializers.CharField(source='reported_by.get_full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)

    class Meta:
        model = MaintenanceRequest
        fields = '__all__'
        read_only_fields = ['reported_by', 'created_at', 'resolved_at']

    def update(self, instance, validated_data):
        # Check if status is changing to Resolved
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        
        if old_status != 'Resolved' and new_status == 'Resolved':
            validated_data['resolved_at'] = timezone.now()

        return super().update(instance, validated_data)
