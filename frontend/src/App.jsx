import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "./api.js";

const roleNames = {
  student: "Student",
  teacher: "Teacher",
  admin: "Administrator",
};

function AuthForm({ onAuthenticated }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    const username = form.get("username");
    const password = form.get("password");

    try {
      if (isRegistering) {
        await api.register({
          username,
          email: form.get("email"),
          password,
        });
      }
      const tokens = await api.login({ username, password });
      const user = await api.currentUser(tokens.access);
      onAuthenticated(user, tokens.access);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-copy">
        <span className="eyebrow">NORTHSTAR LEARNING</span>
        <h1>Make room for what you want to learn.</h1>
        <p>A thoughtful home for your courses, progress, and next big idea.</p>
        <div className="auth-note">
          <span className="note-mark" aria-hidden="true">✳</span>
          <span>Small steps add up. Start with one course.</span>
        </div>
      </section>
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="brand-mark" aria-hidden="true">N</div>
        <p className="eyebrow">YOUR LEARNING SPACE</p>
        <h2 id="auth-title">{isRegistering ? "Create your account" : "Welcome back"}</h2>
        <p className="muted">
          {isRegistering ? "Join the community and find your next course." : "Sign in to continue learning."}
        </p>
        <form onSubmit={handleSubmit} className="stack">
          <label>
            Username
            <input name="username" autoComplete="username" required />
          </label>
          {isRegistering && (
            <label>
              Email <span className="optional">(optional)</span>
              <input name="email" type="email" autoComplete="email" />
            </label>
          )}
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={isRegistering ? "new-password" : "current-password"}
              minLength={isRegistering ? 8 : undefined}
              required
            />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary full-width" disabled={isSubmitting}>
            {isSubmitting ? "Please wait…" : isRegistering ? "Create account" : "Sign in"}
          </button>
        </form>
        <p className="switch-auth">
          {isRegistering ? "Already have an account?" : "New to Northstar?"}{" "}
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setError("");
              setIsRegistering(!isRegistering);
            }}
          >
            {isRegistering ? "Sign in" : "Create an account"}
          </button>
        </p>
      </section>
    </main>
  );
}

function CourseCard({ course, isEnrolled, canEnroll, onEnroll, onUnenroll }) {
  return (
    <article className="course-card">
      <div className="course-art" aria-hidden="true">
        <span>{course.title.slice(0, 1).toUpperCase()}</span>
      </div>
      <div className="course-content">
        <div className="course-meta">
          <span className="course-tag">SELF-PACED</span>
          {isEnrolled && <span className="enrolled-tag">ENROLLED</span>}
        </div>
        <h3>{course.title}</h3>
        <p>{course.description}</p>
        <div className="course-footer">
          <span className="teacher-name">with {course.teacher_name}</span>
          {canEnroll && (
            <button
              className={`button ${isEnrolled ? "button-quiet" : "button-outline"}`}
              onClick={() => (isEnrolled ? onUnenroll(course.id) : onEnroll(course.id))}
            >
              {isEnrolled ? "Leave course" : "Explore course"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Dashboard({ user, token, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [activeView, setActiveView] = useState("overview");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const enrolledIds = useMemo(
    () => new Set(enrollments.map((enrollment) => enrollment.course.id)),
    [enrollments],
  );
  const canManageCourses = user.role === "teacher" || user.role === "admin";
  const canEnroll = user.role === "student";

  const loadDashboard = useCallback(async () => {
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
          {activeView === "overview" && (
            <>
              <div className="welcome-row">
                <div>
                  <p className="eyebrow">YOUR LEARNING, AT A GLANCE</p>
                  <h1>Good to see you, {user.username} <span aria-hidden="true">✳</span></h1>
                  <p className="muted">A little progress each day adds up to big results.</p>
                </div>
                <button className="button button-primary" onClick={() => setActiveView("courses")}>Find a course <span aria-hidden="true">↗</span></button>
              </div>
              <div className="stats-grid">
                <div className="stat-card"><span className="stat-icon mint" aria-hidden="true">▤</span><span className="stat-label">{canEnroll ? "COURSES IN PROGRESS" : "COURSES AVAILABLE"}</span><strong>{canEnroll ? enrollments.length : courses.length}</strong><span className="stat-foot">{canEnroll ? "Your learning journey" : "In the course library"}</span></div>
                <div className="stat-card"><span className="stat-icon peach" aria-hidden="true">✳</span><span className="stat-label">YOUR ROLE</span><strong className="role-stat">{roleNames[user.role] ?? user.role}</strong><span className="stat-foot">Your workspace is ready</span></div>
                <div className="stat-card stat-card-feature"><span className="stat-label">A NOTE TO SELF</span><strong>Curiosity looks<br />good on you.</strong><span className="stat-foot">Keep showing up.</span><span className="feature-sun" aria-hidden="true">✳</span></div>
              </div>
              <div className="section-heading">
                <div><p className="eyebrow">A PLACE TO BEGIN</p><h2>Picked for your next step</h2></div>
                <button className="text-button" onClick={() => setActiveView("courses")}>View all courses <span aria-hidden="true">→</span></button>
              </div>
              <CourseList
                courses={courses.slice(0, 3)}
                enrolledIds={enrolledIds}
                canEnroll={canEnroll}
                onEnroll={(id) => changeEnrollment(id, api.enroll)}
                onUnenroll={(id) => changeEnrollment(id, api.unenroll)}
                isLoading={isLoading}
              />
            </>
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

          {error && <div className="error-banner" role="alert">{error}</div>}
        </section>
      </main>
    </div>
  );
}

function CourseList({ courses, enrolledIds, canEnroll, onEnroll, onUnenroll, isLoading }) {
  if (isLoading) return <p className="empty-state">Loading courses…</p>;
  if (courses.length === 0) {
    return <p className="empty-state">No courses here just yet. Check back soon for a new place to start.</p>;
  }
  return (
    <div className="course-grid">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          isEnrolled={enrolledIds.has(course.id)}
          canEnroll={canEnroll}
          onEnroll={onEnroll}
          onUnenroll={onUnenroll}
        />
      ))}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("northstar-access-token"));
  const [isRestoringSession, setIsRestoringSession] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return;
    api.currentUser(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("northstar-access-token");
        setToken(null);
      })
      .finally(() => setIsRestoringSession(false));
  }, [token]);

  function handleAuthenticated(authenticatedUser, accessToken) {
    localStorage.setItem("northstar-access-token", accessToken);
    setToken(accessToken);
    setUser(authenticatedUser);
  }

  function handleLogout() {
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
