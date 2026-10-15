from django.conf import settings
from django.db import models


class Course(models.Model):
    title = models.CharField(max_length=160)
    description = models.TextField()
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="courses",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("title",)

    def __str__(self):
        return self.title


class Enrollment(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="enrollments",
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-enrolled_at",)
        constraints = [
            models.UniqueConstraint(
                fields=("student", "course"),
                name="unique_student_course_enrollment",
            )
        ]

    def __str__(self):
        return f"{self.student} enrolled in {self.course}"
