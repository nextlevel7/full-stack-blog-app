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

 
  const clearError = () => {
    if (error) setError(null);
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    clearError();
  };

  const handleInputChange = (field: keyof AuthPayload, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    clearError();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    
 
    if (!values.username.trim() || !values.password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    if (values.username.trim().length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }

    if (values.password.trim().length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const action = mode === "login" ? login : register;
      const result = await action(values);
      setAuth(result);
      router.push("/compose");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "string") {
        setError(err);
      } else {
        setError("Unable to authenticate. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      router.push("/");
    }
  }, [router, token]);

  const handleOAuthClick = (providerName: string) => {
    setError(`${providerName} sign-in is not enabled in this preview.`);
  };

  return (
    <main className="auth-stage">
      <div className="auth-stage__glow" aria-hidden="true" />
      <div className="auth-dialog">
        <section className="auth-dialog__hero">
          <p className="eyebrow">Writer&apos;s Lounge</p>
          <h1>Sign in to keep writing.</h1>
          <p>One credential unlocks publishing, editing, and tracking every story you share.</p>
          <p className="auth-note">
            Prefer browsing? <Link href="/">Head back home</Link>
          </p>
        </section>
        <section className="auth-dialog__panel">
          <div className="auth-toggle" role="tablist" aria-label="Authentication mode">
            <button
              className={mode === "login" ? "active" : ""}
              type="button"
              onClick={() => handleModeChange("login")}
              aria-pressed={mode === "login"}
            >
              Log in
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              type="button"
              onClick={() => handleModeChange("register")}
              aria-pressed={mode === "register"}
            >
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
                onChange={(event) => handleInputChange("username", event.target.value)}
                disabled={loading}
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? "error-message" : undefined}
              />
            </label>
            <label className="form-control">
              Password
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={values.password}
                onChange={(event) => handleInputChange("password", event.target.value)}
                disabled={loading}
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? "error-message" : undefined}
              />
            </label>
            {error && (
              <div className="status-callout" id="error-message" role="alert" aria-live="polite">
                {error}
              </div>
            )}
            <button type="submit" className="pill" disabled={loading} style={{ justifySelf: "flex-start" }}>
              {loading ? "Please wait..." : mode === "login" ? "Log me in" : "Create account"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
