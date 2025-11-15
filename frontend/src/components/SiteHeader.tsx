"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/context/auth-context";

export function SiteHeader() {
  const { token, user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const navLinkClass = (href: string) =>
    `nav-link${pathname === href ? " nav-link--active" : ""}`;

  const handleWrite = () => {
    if (token) {
      router.push("/compose");
    } else {
      router.push("/auth");
    }
  };

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="logo" href="/">
          PulseMedium
        </Link>
        <nav className="nav">
        <Link className={navLinkClass("/")} href="/">
          Stories
        </Link>
        {token && (
          <Link className={navLinkClass("/my-stories")} href="/my-stories">
            My stories
          </Link>
        )}
        <button className="nav-link nav-link--ghost" type="button" onClick={handleWrite}>
          {token ? "Write" : "Start writing"}
        </button>
        </nav>
        <div className="header-actions">
          {token && user ? (
            <>
              <span className="avatar" aria-label="Profile">
                {user.username.slice(0, 2).toUpperCase()}
              </span>
              <button className="ghost-button" type="button" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <button className="pill" type="button" onClick={() => router.push("/auth")}>
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
