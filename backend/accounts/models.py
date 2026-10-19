from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    # Roles drive which course and enrollment actions the API permits.
    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        TEACHER = "teacher", "Teacher"
        ADMIN = "admin", "Admin"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.STUDENT)

    def save(self, *args, **kwargs):
        # Keep Django superusers aligned with the role used by application permissions.
        if self.is_superuser:
            self.role = self.Role.ADMIN
        super().save(*args, **kwargs)
