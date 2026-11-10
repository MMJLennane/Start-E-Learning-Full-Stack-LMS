import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../api.js";
import Button from "./button/button.jsx";
import CourseList from "./CourseList.jsx";
import AdminDashboard, { permissions as adminPermissions } from "../roles/AdminDashboard.jsx";
import StudentDashboard, { permissions as studentPermissions } from "../roles/StudentDashboard.jsx";
import TeacherDashboard, { permissions as teacherPermissions } from "../roles/TeacherDashboard.jsx";

const roleNames = { student: "Student", teacher: "Teacher", admin: "Administrator" };
const roleModules = {
  student: { component: StudentDashboard, permissions: studentPermissions },
  teacher: { component: TeacherDashboard, permissions: teacherPermissions },
  admin: { component: AdminDashboard, permissions: adminPermissions },
};
const pageDetails = {
  overview: { title: "Overview", path: "/dashboard" },
  courses: { title: "Courses", path: "/courses" },
  enrolled: { title: "My learning", path: "/my-learning" },
  teacher: { title: "Teacher tasks", path: "/teacher-tasks" },
  admin: { title: "Administrator tasks", path: "/admin-tasks" },
};

export default function Workspace({ page, user, token, onLogout }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const roleModule = roleModules[user.role];
  const RoleDashboard = roleModule?.component;
  const isTeacher = user.role === "teacher" || user.role === "admin";
  const isAdmin = user.role === "admin";
  const canEnroll = roleModule?.permissions.canEnroll ?? false;
  const enrolledIds = useMemo(
    () => new Set(enrollments.map(({ course }) => course.id)),
    [enrollments],
  );
  const managedCourses = courses.filter(
    (course) => user.role === "admin" || course.teacher === user.id,
  );
  const activePage = pageDetails[page] ?? pageDetails.overview;

  const loadWorkspace = useCallback(async () => {
    setError("");
    setIsLoading(true);
    try {
      const courseList = await api.listCourses();
      setCourses(courseList);
      if (canEnroll) setEnrollments(await api.listEnrollments(token));
      if (page === "admin") setUsers(await api.listUsers(token));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }, [canEnroll, page, token]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

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

  async function saveCourse(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setError("");
    setIsSaving(true);
    try {
      const details = { title: form.get("title"), description: form.get("description") };
      if (editingCourse) {
        await api.updateCourse(editingCourse.id, details, token);
      } else {
        await api.createCourse(details, token);
      }
      formElement.reset();
      setEditingCourse(null);
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteCourse(course) {
    if (!window.confirm(`Delete "${course.title}" and its enrollments?`)) return;
    setError("");
    try {
      await api.deleteCourse(course.id, token);
      if (editingCourse?.id === course.id) setEditingCourse(null);
      await loadWorkspace();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function updateUserRole(accountId, role) {
    setError("");
    try {
      const updatedUser = await api.updateUserRole(accountId, role, token);
      setUsers((currentUsers) => currentUsers.map((account) => (
        account.id === updatedUser.id ? updatedUser : account
      )));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function navigateTo(target) {
    navigate(pageDetails[target].path);
  }

  const courseList = page === "enrolled"
    ? courses.filter((course) => enrolledIds.has(course.id))
    : courses;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/dashboard" aria-label="Northstar Learning home">
          <span className="brand-mark">N</span><span>northstar<span className="brand-dot">.</span></span>
        </a>
        <div className="side-label">LEARNING</div>
        <nav className="side-nav" aria-label="Main navigation">
          <NavButton active={page === "overview"} onClick={() => navigateTo("overview")}>Overview</NavButton>
          <NavButton active={page === "courses"} onClick={() => navigateTo("courses")}>Courses</NavButton>
          {canEnroll && <NavButton active={page === "enrolled"} onClick={() => navigateTo("enrolled")}>My learning</NavButton>}
          {isTeacher && <NavButton active={page === "teacher"} onClick={() => navigateTo("teacher")}>Teacher tasks</NavButton>}
          {isAdmin && <NavButton active={page === "admin"} onClick={() => navigateTo("admin")}>Administrator tasks</NavButton>}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-sparkle" aria-hidden="true">✳</span><strong>Keep your momentum</strong><p>One lesson today is a win.</p></div>
          <div className="profile-row">
            <div className="avatar">{user.username.slice(0, 1).toUpperCase()}</div>
            <div className="profile-info"><strong>{user.username}</strong><span>{roleNames[user.role] ?? user.role}</span></div>
            <button className="logout-button" onClick={onLogout} aria-label="Sign out" title="Sign out">↗</button>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span aria-hidden="true">/</span><strong>{activePage.title}</strong></div>
          <div className="topbar-right"><span className="today-label">A good day to learn something new.</span><div className="avatar avatar-small">{user.username.slice(0, 1).toUpperCase()}</div></div>
        </header>
        <section className="page-content">
          {page === "overview" && RoleDashboard && (
            <RoleDashboard
              user={user}
              courses={courses}
              enrollments={enrollments}
              enrolledIds={enrolledIds}
              onViewCourses={() => navigateTo("courses")}
              onEnroll={(id) => changeEnrollment(id, api.enroll)}
              onUnenroll={(id) => changeEnrollment(id, api.unenroll)}
              isLoading={isLoading}
            />
          )}

          {(page === "courses" || page === "enrolled") && (
            <>
              <div className="section-heading page-heading">
                <div>
                  <p className="eyebrow">{page === "enrolled" ? "YOUR LEARNING LIBRARY" : "FIND YOUR NEXT SPARK"}</p>
                  <h1>{pageDetails[page].title}</h1>
                  <p className="muted">{page === "enrolled" ? "Pick up where you left off." : "Fresh ideas and useful skills, ready when you are."}</p>
                </div>
              </div>
              <CourseList
                courses={courseList}
                enrolledIds={enrolledIds}
                canEnroll={canEnroll}
                onEnroll={(id) => changeEnrollment(id, api.enroll)}
                onUnenroll={(id) => changeEnrollment(id, api.unenroll)}
                isLoading={isLoading}
              />
            </>
          )}

          {page === "teacher" && isTeacher && (
            <CourseManagement
              courses={managedCourses}
              editingCourse={editingCourse}
              isSaving={isSaving}
              onSave={saveCourse}
              onEdit={setEditingCourse}
              onDelete={deleteCourse}
              onCancelEdit={() => setEditingCourse(null)}
              isAdmin={isAdmin}
            />
          )}

          {page === "admin" && isAdmin && (
            <section className="admin-tasks">
              <div className="section-heading page-heading">
                <div><p className="eyebrow">PLATFORM OVERSIGHT</p><h1>Administrator tasks</h1><p className="muted">Manage account roles and the full course library.</p></div>
                <Button variant="primary" onClick={() => navigateTo("teacher")}>Manage all courses</Button>
              </div>
              <h2>Accounts <span className="count-badge">{users.length}</span></h2>
              {isLoading ? <p className="empty-state">Loading accounts…</p> : (
                <div className="user-table-wrap">
                  <table className="user-table">
                    <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
                    <tbody>{users.map((account) => (
                      <tr key={account.id}>
                        <td>{account.username}</td>
                        <td>{account.email || "—"}</td>
                        <td>
                          {account.role === "admin" || account.is_superuser
                            ? <span className="role-label">{roleNames[account.role]}</span>
                            : <div className="role-select">
                              <label className="visually-hidden" htmlFor={`role-${account.id}`}>Role for {account.username}</label>
                              <select id={`role-${account.id}`} value={account.role} onChange={(event) => updateUserRole(account.id, event.target.value)}>
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                              </select>
                            </div>}
                        </td>
                        <td>{account.is_active ? "Active" : "Inactive"}</td>
                        <td>{new Date(account.date_joined).toLocaleDateString()}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                  {!users.length && <p className="empty-state">No accounts are available.</p>}
                </div>
              )}
            </section>
          )}
          {!RoleDashboard && page === "overview" && <div className="error-banner" role="alert">This account has an unsupported role: {user.role}.</div>}
          {error && <div className="error-banner" role="alert">{error}</div>}
        </section>
      </main>
    </div>
  );
}

function NavButton({ active, children, onClick }) {
  return (
    <button className={active ? "nav-item active" : "nav-item"} onClick={onClick}>
      <span className="nav-icon" aria-hidden="true">•</span>{children}
    </button>
  );
}

function CourseManagement({ courses, editingCourse, isSaving, onSave, onEdit, onDelete, onCancelEdit, isAdmin }) {
  return (
    <div className="manage-layout">
      <div className="section-heading page-heading">
        <div><p className="eyebrow">{isAdmin ? "PLATFORM OVERSIGHT" : "SHARE WHAT YOU KNOW"}</p><h1>{isAdmin ? "Manage all courses" : "Teacher tasks"}</h1><p className="muted">{isAdmin ? "Create, update, and remove any course." : "Create a course for curious minds to discover."}</p></div>
      </div>
      <form key={editingCourse?.id ?? "new-course"} className="manage-card stack" onSubmit={onSave}>
        <div className="manage-form-heading">
          <h2>{editingCourse ? "Edit course" : "Create a course"}</h2>
          {editingCourse && <Button variant="text" onClick={onCancelEdit}>Cancel edit</Button>}
        </div>
        <label>Course title<input name="title" maxLength="160" defaultValue={editingCourse?.title ?? ""} required /></label>
        <label>Course description<textarea name="description" rows="5" defaultValue={editingCourse?.description ?? ""} required /></label>
        <div><Button type="submit" disabled={isSaving}>{isSaving ? "Saving…" : editingCourse ? "Save changes" : "Publish course"}</Button></div>
      </form>
      <div className="managed-courses">
        <h2>{isAdmin ? "All courses" : "Your courses"}</h2>
        {courses.length === 0 && <p className="muted">Your published courses will appear here.</p>}
        {courses.map((course) => (
          <article className="managed-course" key={course.id}>
            <div><strong>{course.title}</strong><p>{course.description}</p></div>
            <div className="managed-course-actions">
              <Button variant="outline" onClick={() => onEdit(course)}>Edit</Button>
              <Button variant="quiet" onClick={() => onDelete(course)}>Delete</Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
