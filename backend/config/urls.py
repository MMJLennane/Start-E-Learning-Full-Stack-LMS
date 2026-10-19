from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.views import CurrentUserView, RegistrationView
from courses.views import CourseViewSet, EnrollmentListView

# The router turns CourseViewSet actions into catalog, detail, and enrollment URLs.
router = DefaultRouter()
router.register("courses", CourseViewSet, basename="course")

# Explicit routes handle authentication and the signed-in user's enrollment list.
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/register/", RegistrationView.as_view(), name="register"),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/", CurrentUserView.as_view(), name="current_user"),
    path("api/enrollments/", EnrollmentListView.as_view(), name="enrollments"),
    path("api/", include(router.urls)),
]
