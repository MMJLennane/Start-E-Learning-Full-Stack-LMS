# Northstar Learning

Northstar Learning is a full-stack learning management system for students, teachers, and administrators. It provides JWT-backed sign-in, a role-specific workspace, a course catalogue, student enrollments, teacher course tools, and an administrator account-management page. The API is built with Django REST Framework and uses MySQL by default; SQLite can be selected for a quick local demo or tests.

## Page flow

The application is organized as five page types:

1. **Splash and sign-in** (`/`) — sign in or register a student account.
2. **Role workspace** (`/dashboard`) — a Student, Teacher, or Administrator overview.
3. **Courses** (`/courses`) — browse the course library; students can enroll and unenroll.
4. **Teacher tasks** (`/teacher-tasks`) — teachers create, edit, and delete their own courses. Administrators can manage all courses from this page.
5. **Administrator tasks** (`/admin-tasks`) — administrators review account status and assign Student or Teacher roles.

Students also have a **My learning** page (`/my-learning`). Route access is role-checked in the frontend and permissions are enforced independently by the API. Public registration always creates a student; it cannot grant teacher or administrator access.

## Design and shared styles

The shared Northstar palette and the application page styles are in [`frontend/src/components/page_style/page_style.css`](frontend/src/components/page_style/page_style.css). Change the CSS custom properties in its `:root` block to update the colors used across the application. [`frontend/src/styles.css`](frontend/src/styles.css) is intentionally a small import entry point. The reusable button component is in `frontend/src/components/button/`; its variants use the shared color variables.

The interface retains the existing responsive sidebar and dashboard layout. It uses DM Sans and Manrope with sans-serif fallbacks.

## Technology

- **Backend:** Python 3.10+, Django 5.2, Django REST Framework, Simple JWT, `django-cors-headers`
- **Database:** MySQL 8+ by default (`mysqlclient` driver); optional SQLite mode
- **Frontend:** Node.js 20.19+ or 22.12+, React 19, React Router, Vite
- **Tests:** Django API tests, Vitest, and React Testing Library

## Setup

### 1. Create a MySQL database and user

Start MySQL, then create a database and a dedicated local application user. For example, run the following in a MySQL client, replacing the example password with your own:

```sql
CREATE DATABASE northstar_learning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'northstar'@'localhost' IDENTIFIED BY 'use-a-strong-local-password';
GRANT ALL PRIVILEGES ON northstar_learning.* TO 'northstar'@'localhost';
```

### 2. Configure and run the Django API

From the repository root in PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
$env:MYSQL_DATABASE = "northstar_learning"
$env:MYSQL_USER = "northstar"
$env:MYSQL_PASSWORD = "use-a-strong-local-password"
$env:MYSQL_HOST = "127.0.0.1"
$env:MYSQL_PORT = "3306"
$env:DJANGO_SECRET_KEY = "replace-with-a-long-random-secret"
Set-Location backend
py manage.py migrate
py manage.py createsuperuser
py manage.py runserver
```

Django reads its database and secret settings from environment variables; it does not load `.env` files automatically. The superuser receives the Administrator role and can use both the Northstar administrator page and Django Admin at `http://127.0.0.1:8000/admin/`. For additional administrators, use Django Admin to assign the `admin` role. The Northstar role editor intentionally cannot grant administrator access.

For a quick local run without MySQL, set `$env:DB_ENGINE = "sqlite"` before starting Django. MySQL remains the default. Database migrations apply to either configured engine.

### 3. Run the React client

In another PowerShell terminal:

```powershell
Set-Location frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). The API URL defaults to `http://127.0.0.1:8000/api`; set `VITE_API_URL` in the frontend environment if your API runs elsewhere. The allowed frontend origins are configured with `CORS_ALLOWED_ORIGINS`.

## Authentication and account roles

The API issues JSON Web Tokens at `POST /api/auth/token/`. The React app keeps the access token in browser local storage and sends it as a Bearer token on protected API requests. Access tokens last 30 minutes and refresh tokens last one day. The current-user endpoint resolves the token's account on sign-in and page reload. Registration accepts username, email, and password and always assigns the Student role.

Local development settings are not production hardened. For production, use HTTPS, a unique secret from a secrets manager, `DEBUG=false`, restrictive allowed-host and CORS lists, secure token storage (consider an HttpOnly cookie strategy), appropriate database backups, and monitored account provisioning.

## API overview

All API paths are under `/api/`. Protected endpoints require `Authorization: Bearer <access-token>`.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/register/` | Public | Create a Student account |
| `POST` | `/auth/token/` | Public | Obtain access and refresh JWTs |
| `POST` | `/auth/token/refresh/` | Public | Refresh an access JWT |
| `GET` | `/auth/me/` | Authenticated | Return the current account and role |
| `GET` | `/courses/` | Public | Browse courses and enrollment counts |
| `POST` | `/courses/` | Teacher/admin | Publish a course |
| `GET`, `PUT`, `PATCH`, `DELETE` | `/courses/{id}/` | Public read; owner teacher/admin write | View or manage a course |
| `POST` | `/courses/{id}/enroll/` | Student | Enroll in a course |
| `DELETE` | `/courses/{id}/unenroll/` | Student | Leave a course |
| `GET` | `/enrollments/` | Authenticated student | List the current student's enrollments |
| `GET` | `/admin/users/` | Administrator | List account role and status information |
| `PATCH` | `/admin/users/{id}/role/` | Administrator | Assign `student` or `teacher` to an account |

Course ownership is taken from the authenticated user, not submitted in the request body. Teachers can only modify their own courses; administrators can modify any course. Enrollment uniqueness is enforced by a database constraint. Administrator role assignment through the API is deliberately disallowed; use Django Admin for administrator provisioning.

## Project layout

```text
backend/
  accounts/       Custom user model, registration, JWT profile and admin account API
  courses/        Course and enrollment models, serializers, permissions and API
  config/         Django settings, database configuration and API routing
frontend/
  src/
    components/   Authentication, shared workspace, course cards and buttons
    components/page_style/
                    Shared palette and responsive page styles
    roles/        Student, Teacher and Administrator overview panels
    App.jsx       Authentication state and page routing
```

## Tests and production build

Run backend tests from the repository root using the optional SQLite mode:

```powershell
$env:DB_ENGINE = "sqlite"
Set-Location backend
py manage.py test
```

Run frontend tests and build:

```powershell
Set-Location frontend
npm test
npm run build
```

The backend tests cover registration role restrictions, role-gated account management, course ownership, and enrollment behavior. The frontend tests cover sign-in, registration, role-specific overviews, course visibility, and displayed API errors.

## License

This project is available under the MIT License. See [`LICENSE`](LICENSE).
