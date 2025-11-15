"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { login, register, type AuthPayload } from "@/lib/api";

type Mode = "login" | "register";

const oauthProviders = [
  { name: "Google", initials: "G", accent: "#EA4335" },
  { name: "GitHub", initials: "GH", accent: "#111827" },
  { name: "Twitter", initials: "X", accent: "#0EA5E9" },
];

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
              onClick={() => setMode("login")}
              aria-pressed={mode === "login"}
            >
              Log in
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              type="button"
              onClick={() => setMode("register")}
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
          <div className="oauth-divider">
            <span>or continue with</span>
          </div>
          <div className="oauth-buttons">
            {oauthProviders.map((provider) => (
              <button
                key={provider.name}
                type="button"
                className="oauth-button"
                onClick={() => handleOAuthClick(provider.name)}
              >
                <span className="oauth-button__icon" style={{ background: provider.accent }} aria-hidden="true">
                  {provider.initials}
                </span>
                <span>Continue with {provider.name}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
