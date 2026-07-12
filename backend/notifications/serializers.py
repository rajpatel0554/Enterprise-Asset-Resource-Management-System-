from rest_framework import serializers
from .models import Notification, ActivityLog

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    asset_tag = serializers.CharField(source='asset.tag', read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = '__all__'
