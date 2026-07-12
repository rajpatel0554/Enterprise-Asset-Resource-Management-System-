from django.contrib import admin
from .models import AssetCategory, Asset, AssetStatusLog

@admin.register(AssetCategory)
class AssetCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('tag', 'name', 'category', 'status', 'purchase_date', 'cost')
    list_filter = ('status', 'category')
    search_fields = ('tag', 'name')
    readonly_fields = ('tag', 'created_at', 'updated_at')

@admin.register(AssetStatusLog)
class AssetStatusLogAdmin(admin.ModelAdmin):
    list_display = ('asset', 'old_status', 'new_status', 'changed_by', 'timestamp')
    list_filter = ('new_status', 'old_status', 'timestamp')
    search_fields = ('asset__tag', 'asset__name')
