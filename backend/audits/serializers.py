from rest_framework import serializers
from django.utils import timezone
from .models import AuditCycle, AuditEntry
from assets.serializers import AssetSerializer

class AuditEntrySerializer(serializers.ModelSerializer):
    asset_details = AssetSerializer(source='asset', read_only=True)
    auditor_name = serializers.CharField(source='auditor.get_full_name', read_only=True)

    class Meta:
        model = AuditEntry
        fields = '__all__'

    def update(self, instance, validated_data):
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        if old_status == 'Pending' and new_status != 'Pending':
            validated_data['scanned_at'] = timezone.now()
        return super().update(instance, validated_data)

class AuditCycleSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    entries_count = serializers.IntegerField(source='entries.count', read_only=True)
    verified_count = serializers.SerializerMethodField()

    class Meta:
        model = AuditCycle
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']

    def get_verified_count(self, obj):
        return obj.entries.filter(status='Verified').count()
