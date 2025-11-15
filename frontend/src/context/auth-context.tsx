"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type User = {
  id: number | string;
  username: string;
};

type AuthState = {
  token: string | null;
  user: User | null;
};

type AuthContextValue = {
  token: string | null;
  user: User | null;
  initialized: boolean;
  setAuth: (payload: { token: string; user: User }) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, user: null });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const stored = typeof window === "undefined" ? null : window.localStorage.getItem("blog-auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setState({ token: parsed.token ?? null, user: parsed.user ?? null });
      } catch {
        window.localStorage.removeItem("blog-auth");
      }
    }
    setInitialized(true);
  }, []);

  const setAuth = useCallback((payload: { token: string; user: User }) => {
    setState(payload);
    window.localStorage.setItem("blog-auth", JSON.stringify(payload));
  }, []);

  const logout = useCallback(() => {
    setState({ token: null, user: null });
    window.localStorage.removeItem("blog-auth");
  }, []);

  return (
    <AuthContext.Provider value={{ token: state.token, user: state.user, initialized, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
