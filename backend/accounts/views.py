from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User, Department
from .serializers import (
    UserSerializer,
    UserSignupSerializer,
    UserPromoteSerializer,
    DepartmentSerializer
)
from .permissions import IsAdmin, IsAdminOrReadOnly

class SignupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            if user.status != 'Active':
                return Response({'detail': 'User account is deactivated.'}, status=status.HTTP_400_BAD_REQUEST)
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if email:
            # Mock password reset
            return Response({'detail': 'If the email exists, a password reset link has been sent.'}, status=status.HTTP_200_OK)
        return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all().order_by('name')
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['destroy', 'update', 'partial_update']:
            return [IsAdmin()]
        return super().get_permissions()

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin], serializer_class=UserPromoteSerializer)
    def promote(self, request, pk=None):
        user = self.get_object()
        serializer = UserPromoteSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
