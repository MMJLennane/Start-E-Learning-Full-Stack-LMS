from django.apps import AppConfig


# Registers the accounts app that provides the project's custom user model.
class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"
