from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SignupView,
    LoginView,
    ForgotPasswordView,
    DepartmentViewSet,
    UserViewSet
)

router = DefaultRouter()
router.register('departments', DepartmentViewSet, basename='department')
router.register('users', UserViewSet, basename='user')

urlpatterns = [
    path('auth/signup/', SignupView.as_view(), name='signup'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('', include(router.urls)),
]
