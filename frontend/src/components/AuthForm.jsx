import { useState } from "react";

import { api } from "../api.js";

export default function AuthForm({ onAuthenticated }) {
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
