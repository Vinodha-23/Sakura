"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { SessionIdleGuard } from "./session-idle-guard";
import { ToastProvider } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export type AppUser = {
  name: string;
  email: string;
  role: string;
  image?: string | null;
};

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: AppUser;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ToastProvider>
      <SessionIdleGuard />
      <div className="min-h-screen bg-surface-muted">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed left-0 top-0 z-40 lg:hidden">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </>
        )}

        <div
          className={cn(
            "transition-all duration-300",
            sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
          )}
        >
          <Header
            user={user}
            onMenuClick={() => setMobileOpen(!mobileOpen)}
            sidebarCollapsed={sidebarCollapsed}
          />
          <main className="p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
