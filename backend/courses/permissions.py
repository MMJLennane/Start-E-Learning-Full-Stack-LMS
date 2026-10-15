from rest_framework.permissions import SAFE_METHODS, BasePermission

from accounts.models import User


class IsTeacherOrAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if getattr(view, "action", None) in ("enroll", "unenroll"):
            return bool(
                request.user
                and request.user.is_authenticated
                and request.user.role == User.Role.STUDENT
            )
        if request.method in SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (User.Role.TEACHER, User.Role.ADMIN)
        )

    def has_object_permission(self, request, view, obj):
        if getattr(view, "action", None) in ("enroll", "unenroll"):
            return request.user.role == User.Role.STUDENT
        if request.method in SAFE_METHODS:
            return True
        return request.user.role == User.Role.ADMIN or obj.teacher_id == request.user.id
