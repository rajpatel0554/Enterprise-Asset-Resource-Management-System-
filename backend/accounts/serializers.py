from rest_framework import serializers
from .models import User, Department

class DepartmentSerializer(serializers.ModelSerializer):
    parent_department_name = serializers.ReadOnlyField(source='parent_department.name')
    head_name = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'parent_department', 'parent_department_name', 'head', 'head_name', 'status']

    def get_head_name(self, obj):
        if obj.head:
            name = f"{obj.head.first_name} {obj.head.last_name}".strip()
            return name if name else obj.head.username
        return None

class UserSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'role', 'status', 'department', 'department_name']

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name if name else obj.username

class UserSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            role='Employee',  # Enforces default Employee role
            status='Active'
        )
        return user

class UserPromoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['role', 'department']

    def validate_role(self, value):
        if value not in ['Employee', 'DepartmentHead', 'AssetManager', 'Admin']:
            raise serializers.ValidationError("Invalid role choice.")
        return value
