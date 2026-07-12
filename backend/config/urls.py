from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/assets/', include('assets.urls')),
    path('api/allocations/', include('allocations.urls')),
]
