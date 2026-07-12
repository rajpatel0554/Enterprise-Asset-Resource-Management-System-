from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Department

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ['username', 'email', 'role', 'department', 'is_staff', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('role', 'department')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Custom Fields', {'fields': ('role', 'department')}),
    )

admin.site.register(User, CustomUserAdmin)
admin.site.register(Department)
