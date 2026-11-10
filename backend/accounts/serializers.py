from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    # This is the safe user shape returned to the signed-in frontend.
    class Meta:
        model = User
        fields = ("id", "username", "email", "role")
        read_only_fields = ("id", "role")


class RegistrationSerializer(serializers.ModelSerializer):
    # Passwords are accepted only as input; Django's user manager hashes them.
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "role")
        read_only_fields = ("id", "role")

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "role", "is_active", "date_joined")
        read_only_fields = fields


class AdminUserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "role", "is_active", "date_joined")
        read_only_fields = ("id", "username", "email", "is_active", "date_joined")

    def validate_role(self, value):
        if value not in (User.Role.STUDENT, User.Role.TEACHER):
            raise serializers.ValidationError("Administrators can assign student or teacher roles only.")
        return value
