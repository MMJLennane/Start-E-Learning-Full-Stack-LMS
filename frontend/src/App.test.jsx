import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import App from "./App.jsx";

const courses = [
  {
    id: 1,
    title: "Designing with care",
    description: "Build better experiences.",
    teacher_name: "alex",
    enrollment_count: 0,
  },
];

describe("Learning Management System", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows the sign-in experience and lets a student explore courses", async () => {
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
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Create an account" }));

    expect(screen.getByRole("heading", { name: "Create your account" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
  });

  it("shows API failures instead of silently hiding them", async () => {
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
