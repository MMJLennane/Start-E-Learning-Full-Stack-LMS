from rest_framework import generics, permissions
from .models import User
from .serializers import (
    AdminUserRoleSerializer,
    AdminUserSerializer,
    RegistrationSerializer,
    UserSerializer,
)


class IsLmsAdministrator(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.ADMIN
        )


class RegistrationView(generics.CreateAPIView):
    # Public registration creates accounts through the serializer's password-safe manager call.
    serializer_class = RegistrationSerializer
    permission_classes = (permissions.AllowAny,)


class CurrentUserView(generics.RetrieveAPIView):
    # Used by the frontend after login and on reload to restore the token's user session.
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = (IsLmsAdministrator,)
    queryset = User.objects.order_by("username")


class AdminUserRoleView(generics.UpdateAPIView):
    serializer_class = AdminUserRoleSerializer
    permission_classes = (IsLmsAdministrator,)
    queryset = User.objects.exclude(role=User.Role.ADMIN).exclude(is_superuser=True)
    http_method_names = ("patch", "options", "head")
