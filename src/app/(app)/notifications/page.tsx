"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Info,
  Archive,
  CheckCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader, Tabs, EmptyState, LoadingScreen } from "@/components/ui/common";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils";
import type { Notification } from "@/lib/types";

const typeIcons = {
  alert: AlertTriangle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

const typeColors = {
  alert: "text-red-500 bg-red-50",
  success: "text-emerald-500 bg-emerald-50",
  warning: "text-amber-500 bg-amber-50",
  info: "text-sakura-500 bg-sakura-50",
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("unread");
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    if (res.ok) setNotifs(data.notifications || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await load();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const tabs = [
    {
      id: "unread",
      label: "Unread",
      count: notifs.filter((n) => !n.read && !n.archived).length,
    },
    {
      id: "read",
      label: "Read",
      count: notifs.filter((n) => n.read && !n.archived).length,
    },
    {
      id: "archived",
      label: "Archived",
      count: notifs.filter((n) => n.archived).length,
    },
  ];

  const filtered = notifs.filter((n) => {
    if (activeTab === "unread") return !n.read && !n.archived;
    if (activeTab === "read") return n.read && !n.archived;
    if (activeTab === "archived") return n.archived;
    return true;
  });

  const markAllRead = async () => {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
    if (!res.ok) {
      toast("error", "Failed to mark all read");
      return;
    }
    toast("success", "All notifications marked as read");
    await load();
  };

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read" }),
    });
    await load();
  };

  const archive = async (id: string) => {
    const res = await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive" }),
    });
    if (!res.ok) {
      toast("error", "Archive failed");
      return;
    }
    toast("success", "Notification archived");
    await load();
  };

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Persisted inbox for clinical events and system activity"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Notifications" },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => void markAllRead()}>
            <CheckCheck className="h-4 w-4" /> Mark All Read
          </Button>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6 space-y-2">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description={
              activeTab === "unread"
                ? "You're all caught up!"
                : `No ${activeTab} notifications.`
            }
          />
        ) : (
          filtered.map((notif) => {
            const Icon = typeIcons[notif.type];
            return (
              <Card
                key={notif.id}
                className={`${!notif.read ? "border-sakura-100 bg-sakura-50/30" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`rounded-xl p-2.5 ${typeColors[notif.type]}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900">
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="h-2 w-2 rounded-full bg-sakura-500" />
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {notif.message}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatDateTime(notif.timestamp)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {notif.link && (
                        <Link href={notif.link}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void markRead(notif.id)}
                          >
                            View
                          </Button>
                        </Link>
                      )}
                      {!notif.read && (
                        <button
                          onClick={() => void markRead(notif.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-surface-subtle"
                          title="Mark read"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                      {!notif.archived && (
                        <button
                          onClick={() => void archive(notif.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-surface-subtle"
                          title="Archive"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
