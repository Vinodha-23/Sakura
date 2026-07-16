"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Command, Bell, Menu, LogOut } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { CommandPalette } from "./command-palette";
import type { AppUser } from "./app-shell";

interface HeaderProps {
  user: AppUser;
  onMenuClick?: () => void;
  sidebarCollapsed?: boolean;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        if (!cancelled && res.ok) setUnread(data.unreadCount || 0);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-white/80 px-6 backdrop-blur-md">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-surface-subtle lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          onClick={() => setCommandOpen(true)}
          className="flex flex-1 max-w-md items-center gap-2 rounded-xl border border-border bg-surface-muted px-4 py-2 text-sm text-slate-400 transition-colors hover:border-slate-300 hover:bg-white"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search patients, documents, medications...</span>
          <kbd className="hidden items-center gap-0.5 rounded-md border border-border bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>

        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="relative rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-surface-subtle hover:text-slate-700"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sakura-600 px-1 text-[10px] font-medium text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 rounded-xl p-1.5 pr-3 transition-colors hover:bg-surface-subtle"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sakura-100 text-sm font-medium text-sakura-700">
                {getInitials(user.name)}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{user.role}</p>
              </div>
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-white py-1 shadow-elevated">
                  <div className="border-b border-border px-4 py-2">
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-surface-subtle"
                    onClick={() => setProfileOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-surface-subtle"
                    onClick={() => setProfileOpen(false)}
                  >
                    Settings
                  </Link>
                  <hr className="my-1 border-border" />
                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onOpen={() => setCommandOpen(true)}
      />
    </>
  );
}
