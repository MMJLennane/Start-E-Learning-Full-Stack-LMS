import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "./api.js";
import AuthForm from "./components/AuthForm.jsx";
import CourseList from "./components/CourseList.jsx";
import AdminDashboard, { permissions as adminPermissions } from "./roles/AdminDashboard.jsx";
import StudentDashboard, { permissions as studentPermissions } from "./roles/StudentDashboard.jsx";
import TeacherDashboard, { permissions as teacherPermissions } from "./roles/TeacherDashboard.jsx";

// Human-readable role labels are shared by the dashboard's profile and summary cards.
const roleNames = {
  student: "Student",
  teacher: "Teacher",
  admin: "Administrator",
};

const roleModules = {
  student: { component: StudentDashboard, permissions: studentPermissions },
  teacher: { component: TeacherDashboard, permissions: teacherPermissions },
  admin: { component: AdminDashboard, permissions: adminPermissions },
};

function Dashboard({ user, token, onLogout }) {
  // Dashboard state is refreshed from the API; role flags control which actions and views are shown.
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [activeView, setActiveView] = useState("overview");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const roleModule = roleModules[user.role];
  const RoleDashboard = roleModule?.component;
  const enrolledIds = useMemo(
    () => new Set(enrollments.map((enrollment) => enrollment.course.id)),
    [enrollments],
  );
  const canManageCourses = roleModule?.permissions.canManageCourses ?? false;
  const canEnroll = roleModule?.permissions.canEnroll ?? false;

  const loadDashboard = useCallback(async () => {
    // Catalog data is public, while only students need their private enrollment list.
    setIsLoading(true);
    setError("");
    try {
      const courseList = await api.listCourses();
      setCourses(courseList);
      if (canEnroll) {
        setEnrollments(await api.listEnrollments(token));
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }, [canEnroll, token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function changeEnrollment(courseId, action) {
    // After a write, reload both lists so counts and enrolled badges reflect server state.
    setError("");
    try {
      await action(courseId, token);
      setEnrollments(await api.listEnrollments(token));
      setCourses(await api.listCourses());
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleSaveCourse(event) {
    // The same form creates or edits depending on editingCourse, then refreshes the catalog.
    event.preventDefault();
    const formElement = event.currentTarget;
    setError("");
    setIsCreatingCourse(true);
    const form = new FormData(formElement);
    try {
      const details = { title: form.get("title"), description: form.get("description") };
      if (editingCourse) {
        await api.updateCourse(editingCourse.id, details, token);
      } else {
        await api.createCourse(details, token);
      }
      formElement.reset();
      setEditingCourse(null);
      await loadDashboard();
      setActiveView("courses");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsCreatingCourse(false);
    }
  }

  async function handleDeleteCourse(course) {
    // Deleting a course also deletes its enrollments on the backend, so confirm the cascade.
    if (!window.confirm(`Delete "${course.title}" and its enrollments?`)) return;
    setError("");
    try {
      await api.deleteCourse(course.id, token);
      if (editingCourse?.id === course.id) setEditingCourse(null);
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const displayedCourses = activeView === "enrolled"
    ? courses.filter((course) => enrolledIds.has(course.id))
    : courses;
  const managedCourses = courses.filter(
    (course) => user.role === "admin" || course.teacher === user.id,
  );

  // Navigation switches local views; the corresponding sections below share the same loaded data.
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" aria-label="Northstar Learning home">
          <span className="brand-mark">N</span>
          <span>northstar<span className="brand-dot">.</span></span>
        </a>
        <div className="side-label">LEARNING</div>
        <nav className="side-nav" aria-label="Main navigation">
          <button className={activeView === "overview" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("overview")}>
            <span className="nav-icon" aria-hidden="true">⌂</span> Overview
          </button>
          <button className={activeView === "courses" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("courses")}>
            <span className="nav-icon" aria-hidden="true">▤</span> Explore courses
          </button>
          {canEnroll && (
            <button className={activeView === "enrolled" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("enrolled")}>
              <span className="nav-icon" aria-hidden="true">◷</span> My learning
            </button>
          )}
          {canManageCourses && (
            <button className={activeView === "manage" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("manage")}>
              <span className="nav-icon" aria-hidden="true">＋</span> Manage courses
            </button>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-sparkle" aria-hidden="true">✳</span>
            <strong>Keep your momentum</strong>
            <p>One lesson today is a win.</p>
          </div>
          <div className="profile-row">
            <div className="avatar">{user.username.slice(0, 1).toUpperCase()}</div>
            <div className="profile-info">
              <strong>{user.username}</strong>
              <span>{roleNames[user.role] ?? user.role}</span>
            </div>
            <button className="logout-button" onClick={onLogout} aria-label="Sign out" title="Sign out">↗</button>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span aria-hidden="true">/</span><strong>{activeView === "manage" ? "Manage courses" : activeView === "enrolled" ? "My learning" : activeView === "courses" ? "Explore courses" : "Overview"}</strong></div>
          <div className="topbar-right"><span className="today-label">A good day to learn something new.</span><div className="avatar avatar-small">{user.username.slice(0, 1).toUpperCase()}</div></div>
        </header>

        <section className="page-content">
          {activeView === "overview" && RoleDashboard && (
            <RoleDashboard
              user={user}
              courses={courses}
              enrollments={enrollments}
              enrolledIds={enrolledIds}
              onViewCourses={() => setActiveView("courses")}
              onEnroll={(id) => changeEnrollment(id, api.enroll)}
              onUnenroll={(id) => changeEnrollment(id, api.unenroll)}
              isLoading={isLoading}
            />
          )}

          {(activeView === "courses" || activeView === "enrolled") && (
            <>
              <div className="section-heading page-heading">
                <div><p className="eyebrow">{activeView === "enrolled" ? "YOUR LEARNING LIBRARY" : "FIND YOUR NEXT SPARK"}</p><h1>{activeView === "enrolled" ? "My learning" : "Explore courses"}</h1><p className="muted">{activeView === "enrolled" ? "Pick up where you left off." : "Fresh ideas and useful skills, ready when you are."}</p></div>
              </div>
              <CourseList
                courses={displayedCourses}
                enrolledIds={enrolledIds}
                canEnroll={canEnroll}
                onEnroll={(id) => changeEnrollment(id, api.enroll)}
                onUnenroll={(id) => changeEnrollment(id, api.unenroll)}
                isLoading={isLoading}
              />
            </>
          )}

          {activeView === "manage" && canManageCourses && (
            <div className="manage-layout">
              <div className="section-heading page-heading">
                <div><p className="eyebrow">SHARE WHAT YOU KNOW</p><h1>Manage courses</h1><p className="muted">Create a course for curious minds to discover.</p></div>
              </div>
              <form key={editingCourse?.id ?? "new-course"} className="manage-card stack" onSubmit={handleSaveCourse}>
                <div className="manage-form-heading">
                  <h2>{editingCourse ? "Edit course" : "Create a course"}</h2>
                  {editingCourse && <button type="button" className="text-button" onClick={() => setEditingCourse(null)}>Cancel edit</button>}
                </div>
                <label>Course title<input name="title" maxLength="160" defaultValue={editingCourse?.title ?? ""} required /></label>
                <label>Course description<textarea name="description" rows="5" defaultValue={editingCourse?.description ?? ""} required /></label>
                <div><button className="button button-primary" disabled={isCreatingCourse}>{isCreatingCourse ? "Saving…" : editingCourse ? "Save changes" : "Publish course"}</button></div>
              </form>
              <div className="managed-courses">
                <h2>Your courses</h2>
                {managedCourses.length === 0 && <p className="muted">Your published courses will appear here.</p>}
                {managedCourses.map((course) => (
                  <article className="managed-course" key={course.id}>
                    <div><strong>{course.title}</strong><p>{course.description}</p></div>
                    <div className="managed-course-actions">
                      <button className="button button-outline" onClick={() => setEditingCourse(course)}>Edit</button>
                      <button className="button button-quiet" onClick={() => handleDeleteCourse(course)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {!RoleDashboard && <div className="error-banner" role="alert">This account has an unsupported role: {user.role}.</div>}
          {error && <div className="error-banner" role="alert">{error}</div>}
        </section>
      </main>
    </div>
  );
}

export default function App() {
  // The root restores a saved access token, resolves its user, then selects auth or dashboard UI.
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("northstar-access-token"));
  const [isRestoringSession, setIsRestoringSession] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return;
    // Invalid/expired tokens are cleared so the app returns to the sign-in form.
    api.currentUser(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("northstar-access-token");
        setToken(null);
      })
      .finally(() => setIsRestoringSession(false));
  }, [token]);

  function handleAuthenticated(authenticatedUser, accessToken) {
    // Persist only the access token; Dashboard receives it for later authenticated API requests.
    localStorage.setItem("northstar-access-token", accessToken);
    setToken(accessToken);
    setUser(authenticatedUser);
  }

  function handleLogout() {
    // Clear both persisted and in-memory session state on sign-out.
    localStorage.removeItem("northstar-access-token");
    setToken(null);
    setUser(null);
  }

  if (isRestoringSession) {
    return <main className="loading-screen">Opening your learning space…</main>;
  }
  return user
    ? <Dashboard user={user} token={token} onLogout={handleLogout} />
    : <AuthForm onAuthenticated={handleAuthenticated} />;
}
