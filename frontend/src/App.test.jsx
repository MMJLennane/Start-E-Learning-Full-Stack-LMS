import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import App from "./App.jsx";

const courses = [
  {
    id: 1,
    title: "Designing with care",
    description: "Build better experiences.",
    teacher_name: "alex",
    teacher: 2,
    enrollment_count: 0,
  },
  {
    id: 2,
    title: "A second course",
    description: "Explore another topic.",
    teacher_name: "jordan",
    teacher: 3,
    enrollment_count: 1,
  },
];

async function signInAs(role) {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
    if (String(url).endsWith("/auth/token/")) {
      return Response.json({ access: "access-token", refresh: "refresh-token" });
    }
    if (String(url).endsWith("/auth/me/")) {
      return Response.json({ id: 2, username: "sam", role });
    }
    if (String(url).endsWith("/enrollments/")) {
      return Response.json([]);
    }
    if (String(url).endsWith("/admin/users/")) {
      return Response.json([
        { id: 3, username: "learner", email: "learner@example.com", role: "student", is_active: true, date_joined: "2025-01-01T00:00:00Z" },
      ]);
    }
    if (String(url).includes("/admin/users/") && String(url).endsWith("/role/")) {
      return Response.json({
        id: 3,
        username: "learner",
        email: "learner@example.com",
        role: "teacher",
        is_active: true,
        date_joined: "2025-01-01T00:00:00Z",
      });
    }
    return Response.json(courses);
  });

  render(<App />);
  fireEvent.change(screen.getByLabelText("Username"), { target: { value: "sam" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "a-secure-password" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  return fetchMock;
}

// UI tests mock the API boundary and verify user-visible authentication flows.
describe("Learning Management System", () => {
  beforeEach(() => {
    // Isolate persisted sessions and mock behavior between tests.
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows the sign-in experience and lets a student explore courses", async () => {
    // Simulate the sequence: obtain a JWT, resolve the user, then load dashboard data.
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      if (String(url).endsWith("/auth/token/")) {
        return Response.json({ access: "access-token", refresh: "refresh-token" });
      }
      if (String(url).endsWith("/auth/me/")) {
        return Response.json({ id: 1, username: "sam", role: "student" });
      }
      if (String(url).endsWith("/enrollments/")) {
        return Response.json([]);
      }
      return Response.json(courses);
    });

    render(<App />);
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "sam" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "a-secure-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("heading", { name: /Good to see you, sam/ })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Designing with care" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalled();
  });

  it("offers account registration", () => {
    // Registration mode is a UI state change before submitting the registration request.
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Create an account" }));

    expect(screen.getByRole("heading", { name: "Create your account" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
  });

  it("shows teacher-specific courses and management navigation", async () => {
    await signInAs("teacher");

    expect(await screen.findByRole("heading", { name: "Your courses" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Designing with care" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "A second course" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Teacher tasks" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "My learning" })).not.toBeInTheDocument();
  });

  it("shows admins the full course library and management navigation", async () => {
    await signInAs("admin");

    expect(await screen.findByRole("heading", { name: "Recently available courses" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Designing with care" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "A second course" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Administrator tasks" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "My learning" })).not.toBeInTheDocument();
  });

  it("lets administrators review accounts and update a student role", async () => {
    const fetchMock = await signInAs("admin");
    fireEvent.click(await screen.findByRole("button", { name: "Administrator tasks" }));

    const roleSelector = await screen.findByLabelText("Role for learner");
    fireEvent.change(roleSelector, { target: { value: "teacher" } });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/admin/users/3/role/"),
      expect.objectContaining({ method: "PATCH" }),
    ));
    expect(screen.getByRole("heading", { name: "Administrator tasks" })).toBeInTheDocument();
  });

  it("shows API failures instead of silently hiding them", async () => {
    // Verify errors from the API client reach an accessible alert in the form.
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      if (String(url).endsWith("/auth/token/")) {
        return new Response(JSON.stringify({ detail: "Invalid credentials." }), { status: 401 });
      }
      return Response.json([]);
    });

    render(<App />);
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "sam" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials."));
  });
});
