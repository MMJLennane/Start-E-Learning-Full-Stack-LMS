from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import Course, Enrollment

User = get_user_model()


# API tests cover public catalog access, student enrollment, and teacher ownership rules.
class CourseApiTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(username="student", password="a-good-password")
        self.teacher = User.objects.create_user(
            username="teacher",
            password="a-good-password",
            role=User.Role.TEACHER,
        )
        self.other_teacher = User.objects.create_user(
            username="other",
            password="a-good-password",
            role=User.Role.TEACHER,
        )
        self.course = Course.objects.create(
            title="Introduction",
            description="A starting course",
            teacher=self.teacher,
        )

    def test_course_catalog_is_public(self):
        response = self.client.get("/api/courses/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["title"], self.course.title)
        self.assertEqual(response.data[0]["enrollment_count"], 0)

    def test_student_can_enroll_and_list_their_courses(self):
        self.client.force_authenticate(self.student)
        response = self.client.post(f"/api/courses/{self.course.id}/enroll/")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Enrollment.objects.count(), 1)
        enrolled_response = self.client.get("/api/enrollments/")
        self.assertEqual(enrolled_response.status_code, 200)
        self.assertEqual(enrolled_response.data[0]["course"]["id"], self.course.id)
        self.assertEqual(enrolled_response.data[0]["teacher_email"], "")

    def test_enrollment_contact_details_are_limited_to_the_students_own_courses(self):
        self.teacher.email = "teacher@example.com"
        self.teacher.save(update_fields=("email",))
        other_course = Course.objects.create(
            title="Another course",
            description="Not enrolled",
            teacher=self.other_teacher,
        )
        self.client.force_authenticate(self.student)
        self.client.post(f"/api/courses/{self.course.id}/enroll/")

        response = self.client.get("/api/enrollments/")
        catalog_response = self.client.get("/api/courses/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["teacher_email"], "teacher@example.com")
        self.assertNotIn("teacher_email", catalog_response.data[0])
        self.assertNotEqual(response.data[0]["course"]["id"], other_course.id)

    def test_repeated_enrollment_does_not_create_duplicates(self):
        self.client.force_authenticate(self.student)
        self.client.post(f"/api/courses/{self.course.id}/enroll/")
        response = self.client.post(f"/api/courses/{self.course.id}/enroll/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Enrollment.objects.count(), 1)

    def test_student_cannot_create_a_course(self):
        self.client.force_authenticate(self.student)
        response = self.client.post(
            "/api/courses/",
            {"title": "Nope", "description": "Students cannot publish courses."},
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_teacher_can_only_edit_their_own_course(self):
        self.client.force_authenticate(self.other_teacher)
        response = self.client.patch(
            f"/api/courses/{self.course.id}/",
            {"title": "Changed"},
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.course.refresh_from_db()
        self.assertEqual(self.course.title, "Introduction")
