"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  Network,
  FileText,
  Bot,
  Shield,
  BarChart3,
  Settings,
  User,
  Bell,
  ChevronLeft,
  Flower2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Clinical Alerts", href: "/clinical-alerts", icon: AlertTriangle },
  { name: "Knowledge Graph", href: "/knowledge-graph", icon: Network },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "AI Assistant", href: "/ai-assistant", icon: Bot },
  { name: "Insurance", href: "/insurance", icon: Shield },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

const bottomNav = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Notifications", href: "/notifications", icon: Bell },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}

export function Sidebar({ collapsed = false, onToggle, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-white transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-rose-500">
          <Flower2 className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-lg font-semibold text-slate-900">Sakura</span>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Clinical Intelligence</p>
          </div>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            className={cn(
              "ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-surface-subtle hover:text-slate-600",
              collapsed && "ml-0"
            )}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sakura-50 text-sakura-700"
                  : "text-slate-600 hover:bg-surface-subtle hover:text-slate-900"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-sakura-600")} />
              {!collapsed && item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3 space-y-1">
        {bottomNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sakura-50 text-sakura-700"
                  : "text-slate-600 hover:bg-surface-subtle hover:text-slate-900"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="flex-1">{item.name}</span>}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
