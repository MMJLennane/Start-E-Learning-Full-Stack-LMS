const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

// Centralize fetch details so UI components share JSON handling, JWT auth, and API errors.
async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = Object.values(errorData).flat().join(" ") || "The request failed.";
    throw new Error(message);
  }

  return response.status === 204 ? null : response.json();
}

// These operations match Django URL routes; authenticated calls pass the access token here.
export const api = {
  listCourses: () => request("/courses/"),
  register: (details) =>
    request("/auth/register/", { method: "POST", body: JSON.stringify(details) }),
  login: (credentials) =>
    request("/auth/token/", { method: "POST", body: JSON.stringify(credentials) }),
  currentUser: (token) => request("/auth/me/", { token }),
  listEnrollments: (token) => request("/enrollments/", { token }),
  enroll: (courseId, token) =>
    request(`/courses/${courseId}/enroll/`, { method: "POST", token }),
  unenroll: (courseId, token) =>
    request(`/courses/${courseId}/unenroll/`, { method: "DELETE", token }),
  createCourse: (details, token) =>
    request("/courses/", { method: "POST", body: JSON.stringify(details), token }),
  updateCourse: (courseId, details, token) =>
    request(`/courses/${courseId}/`, { method: "PATCH", body: JSON.stringify(details), token }),
  deleteCourse: (courseId, token) =>
    request(`/courses/${courseId}/`, { method: "DELETE", token }),
};
