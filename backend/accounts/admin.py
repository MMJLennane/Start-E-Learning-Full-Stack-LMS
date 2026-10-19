from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


# Extend Django's built-in user management so staff can also assign LMS roles.
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("LMS role", {"fields": ("role",)}),)
    add_fieldsets = UserAdmin.add_fieldsets + (("LMS role", {"fields": ("role",)}),)
    list_display = (*UserAdmin.list_display, "role")
