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


class AdminUserApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username="admin", password="a-strong-password-123", role=User.Role.ADMIN)
        self.student = User.objects.create_user(username="learner", password="a-strong-password-123")

    def test_only_administrators_can_list_accounts(self):
        self.client.force_authenticate(self.student)

        response = self.client.get("/api/admin/users/")

        self.assertEqual(response.status_code, 403)

    def test_administrator_can_list_accounts_and_change_student_role(self):
        self.client.force_authenticate(self.admin)

        list_response = self.client.get("/api/admin/users/")
        update_response = self.client.patch(
            f"/api/admin/users/{self.student.id}/role/",
            {"role": User.Role.TEACHER},
            format="json",
        )

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.data["role"], User.Role.TEACHER)
        self.student.refresh_from_db()
        self.assertEqual(self.student.role, User.Role.TEACHER)

    def test_administrator_cannot_assign_admin_role(self):
        self.client.force_authenticate(self.admin)

        response = self.client.patch(
            f"/api/admin/users/{self.student.id}/role/",
            {"role": User.Role.ADMIN},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
