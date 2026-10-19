from rest_framework import serializers

from .models import Course, Enrollment


class CourseSerializer(serializers.ModelSerializer):
    # Add display-only teacher/count fields while keeping ownership server-controlled.
    teacher_name = serializers.CharField(source="teacher.username", read_only=True)
    enrollment_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = (
            "id",
            "title",
            "description",
            "teacher",
            "teacher_name",
            "enrollment_count",
            "created_at",
        )
        read_only_fields = ("id", "teacher", "teacher_name", "enrollment_count", "created_at")


class EnrollmentSerializer(serializers.ModelSerializer):
    # Nest course details so the frontend can render a student's learning list directly.
    course = CourseSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = ("id", "course", "enrolled_at")
