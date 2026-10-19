from django.apps import AppConfig


# Registers the catalog and enrollment models used by the course API.
class CoursesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "courses"
