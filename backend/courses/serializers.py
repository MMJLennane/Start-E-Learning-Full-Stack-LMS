from rest_framework import serializers

from .models import Course, Enrollment


class CourseSerializer(serializers.ModelSerializer):
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
    course = CourseSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = ("id", "course", "enrolled_at")
