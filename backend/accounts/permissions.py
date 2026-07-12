from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'Admin'

class IsAssetManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'AssetManager'

class IsDepartmentHead(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'DepartmentHead'

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and request.user.role == 'Admin'

class IsAdminOrAssetManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['Admin', 'AssetManager']

class IsAdminOrSelf(permissions.BasePermission):
    def has_object_permission(self, request, obj, view):
        return request.user and request.user.is_authenticated and (request.user.role == 'Admin' or request.user.id == obj.id)
