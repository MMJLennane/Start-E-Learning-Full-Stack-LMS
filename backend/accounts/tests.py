from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

User = get_user_model()


# API-level checks for the public registration endpoint and its security constraints.
class RegistrationTests(APITestCase):
    def test_registration_creates_a_student_and_does_not_allow_role_escalation(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "learner",
                "email": "learner@example.com",
                "password": "a-strong-password-123",
                "role": "admin",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["role"], User.Role.STUDENT)
        self.assertFalse(User.objects.get(username="learner").is_staff)

    def test_registration_rejects_short_password(self):
        response = self.client.post(
            "/api/auth/register/",
            {"username": "learner", "password": "short"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
