"use client";

import { SiteHeader } from "@/components/SiteHeader";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-shell">
      <SiteHeader />
      <div className="content-shell">{children}</div>
    </div>
  );
}
