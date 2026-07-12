from rest_framework import serializers
from .models import AssetCategory, Asset, AssetStatusLog

class AssetCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetCategory
        fields = '__all__'

class AssetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Asset
        fields = ['id', 'tag', 'name', 'category', 'category_name', 'description', 'status', 'purchase_date', 'cost', 'created_at', 'updated_at']
        read_only_fields = ['tag', 'created_at', 'updated_at']

class AssetStatusLogSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True, default='System')

    class Meta:
        model = AssetStatusLog
        fields = ['id', 'asset', 'old_status', 'new_status', 'changed_by', 'changed_by_name', 'timestamp', 'notes']
        read_only_fields = ['timestamp']
