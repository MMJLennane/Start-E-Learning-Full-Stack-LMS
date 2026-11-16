import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { api } from "./api.js";
import AuthForm from "./components/AuthForm.jsx";
import Workspace from "./components/Workspace.jsx";
import Button from "./components/button/button.jsx";

function AppRoutes({ user, token, onAuthenticated, onLogout }) {
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<AuthForm onAuthenticated={onAuthenticated} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  const isTeacher = user.role === "teacher" || user.role === "admin";
  const isAdmin = user.role === "admin";
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Workspace page="overview" user={user} token={token} onLogout={onLogout} />} />
      <Route path="/courses" element={<Workspace page="courses" user={user} token={token} onLogout={onLogout} />} />
      <Route path="/my-learning" element={user.role === "student"
        ? <Workspace page="enrolled" user={user} token={token} onLogout={onLogout} />
        : <Navigate to="/dashboard" replace />} />
      <Route path="/teacher-tasks" element={isTeacher
        ? <Workspace page="teacher" user={user} token={token} onLogout={onLogout} />
        : <RoleAccessNotice role="Teacher" />} />
      <Route path="/admin-tasks" element={isAdmin
        ? <Workspace page="admin" user={user} token={token} onLogout={onLogout} />
        : <RoleAccessNotice role="Admin" />} />
      <Route path="/student-lounge" element={user.role === "student"
        ? <Workspace page="lounge" user={user} token={token} onLogout={onLogout} />
        : <RoleAccessNotice role="Student" />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function RoleAccessNotice({ role }) {
  const navigate = useNavigate();

  return (
    <main className="access-notice">
      <span className="brand-mark" aria-hidden="true">N</span>
      <p className="eyebrow">NORTHSTAR LEARNING</p>
      <h1>This page is for {role} only</h1>
      <p className="muted">Sign in with an account that has the required role to continue.</p>
      <Button variant="outline" onClick={() => navigate("/dashboard")}>Back to my dashboard</Button>
    </main>
  );
}

function AppWithState() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("northstar-access-token"));
  const [isRestoringSession, setIsRestoringSession] = useState(Boolean(token));
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    api.currentUser(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("northstar-access-token");
        setToken(null);
        navigate("/");
      })
      .finally(() => setIsRestoringSession(false));
  }, [token, navigate]);

  function handleAuthenticated(authenticatedUser, accessToken) {
    localStorage.setItem("northstar-access-token", accessToken);
    setToken(accessToken);
    setUser(authenticatedUser);
    navigate("/dashboard");
  }

  function handleLogout() {
    localStorage.removeItem("northstar-access-token");
    setToken(null);
    setUser(null);
    navigate("/");
  }

  if (isRestoringSession) return <main className="loading-screen">Opening your learning space…</main>;
  return (
    <AppRoutes
      user={user}
      token={token}
      onAuthenticated={handleAuthenticated}
      onLogout={handleLogout}
    />
  );
}

export default function App() {
  return <BrowserRouter><AppWithState /></BrowserRouter>;
}
