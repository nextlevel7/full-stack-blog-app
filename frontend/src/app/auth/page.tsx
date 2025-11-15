"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { login, register, type AuthPayload } from "@/lib/api";

type Mode = "login" | "register";

export default function AuthPage() {
  const router = useRouter();
  const { setAuth, token } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [values, setValues] = useState<AuthPayload>({ username: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!values.username.trim() || !values.password.trim()) {
      setError("Enter both username and password.");
      return;
    }
    setLoading(true);
    try {
      const action = mode === "login" ? login : register;
      const result = await action(values);
      setAuth(result);
      router.push("/compose");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      router.push("/");
    }
  }, [router, token]);

  return (
    <main className="page auth-layout">
      <section className="auth-hero">
        <h1>Sign in to keep writing.</h1>
        <p>One credential gives you access to publishing, editing, and tracking all of your stories across the platform.</p>
        <p className="auth-note">
          Prefer browsing? <Link href="/">Go back home</Link>
        </p>
      </section>
      <section className="auth-panel">
        <div className="auth-toggle">
          <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>
            Log in
          </button>
          <button className={mode === "register" ? "active" : ""} type="button" onClick={() => setMode("register")}>
            Register
          </button>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-control">
            Username
            <input
              name="username"
              placeholder="@artfulwriter"
              value={values.username}
              onChange={(event) => setValues((prev) => ({ ...prev, username: event.target.value }))}
            />
          </label>
          <label className="form-control">
            Password
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={values.password}
              onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
            />
          </label>
          {error && <div className="status-callout">{error}</div>}
          <button type="submit" className="pill" disabled={loading} style={{ justifySelf: "flex-start" }}>
            {loading ? "Please wait..." : mode === "login" ? "Log me in" : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}
