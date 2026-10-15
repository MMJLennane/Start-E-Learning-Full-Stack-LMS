from django.db.models import Count
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from accounts.models import User

from .models import Course, Enrollment
from .permissions import IsTeacherOrAdminOrReadOnly
from .serializers import CourseSerializer, EnrollmentSerializer


class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = (IsTeacherOrAdminOrReadOnly,)

    def get_queryset(self):
        return Course.objects.select_related("teacher").annotate(
            enrollment_count=Count("enrollments")
        )

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

    @action(detail=True, methods=("post",), url_path="enroll")
    def enroll(self, request, pk=None):
        course = self.get_object()
        if request.user.role != User.Role.STUDENT:
            raise PermissionDenied("Only students can enroll in courses.")
        enrollment, created = Enrollment.objects.get_or_create(
            student=request.user,
            course=course,
        )
        return Response(
            EnrollmentSerializer(enrollment).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(detail=True, methods=("delete",), url_path="unenroll")
    def unenroll(self, request, pk=None):
        course = self.get_object()
        if request.user.role != User.Role.STUDENT:
            raise PermissionDenied("Only students can unenroll from courses.")
        Enrollment.objects.filter(student=request.user, course=course).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EnrollmentListView(generics.ListAPIView):
    serializer_class = EnrollmentSerializer

    def get_queryset(self):
        if self.request.user.role != User.Role.STUDENT:
            return Enrollment.objects.none()
        return Enrollment.objects.filter(student=self.request.user).select_related(
            "course", "course__teacher"
        )
