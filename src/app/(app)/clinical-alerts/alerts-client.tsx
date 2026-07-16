"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Filter,
  Clock,
  User,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, severityBadgeVariant } from "@/components/ui/badge";
import { PageHeader, Tabs, EmptyState } from "@/components/ui/common";
import { formatDateTime } from "@/lib/utils";

type AlertItem = {
  id: string;
  patientId: string;
  patientName: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  category: string;
  assignedTo?: string;
  createdAt: string;
  source: string;
};

export function ClinicalAlertsClient({ initialAlerts }: { initialAlerts: AlertItem[] }) {
  const [severityFilter, setSeverityFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  const tabs = [
    { id: "all", label: "All", count: initialAlerts.length },
    {
      id: "critical",
      label: "Critical",
      count: initialAlerts.filter((a) => a.severity === "critical").length,
    },
    {
      id: "assigned",
      label: "Assigned",
      count: initialAlerts.filter((a) => a.status === "assigned").length,
    },
    {
      id: "resolved",
      label: "Resolved",
      count: initialAlerts.filter((a) => a.status === "resolved").length,
    },
  ];

  const filtered = useMemo(() => {
    return initialAlerts.filter((a) => {
      if (severityFilter !== "all" && a.severity !== severityFilter) return false;
      if (activeTab === "critical" && a.severity !== "critical") return false;
      if (activeTab === "assigned" && a.status !== "assigned") return false;
      if (activeTab === "resolved" && a.status !== "resolved") return false;
      return true;
    });
  }, [initialAlerts, severityFilter, activeTab]);

  return (
    <div>
      <PageHeader
        title="Clinical Alerts"
        description={`${initialAlerts.filter((a) => a.status !== "resolved").length} active alerts · includes CSV-import safety checks`}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Clinical Alerts" }]}
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mb-6 mt-6 flex flex-wrap gap-2">
        <Filter className="h-4 w-4 self-center text-slate-400" />
        <span className="mr-2 self-center text-xs text-slate-500">Severity:</span>
        {(["all", "critical", "high", "medium", "low"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
              severityFilter === s
                ? "bg-sakura-100 text-sakura-700"
                : "bg-surface-subtle text-slate-600"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No alerts"
            description="Import sample patients to generate medication safety alerts automatically."
          />
        ) : (
          filtered.map((alert) => (
            <Link key={alert.id} href={`/clinical-alerts/${alert.id}`}>
              <Card
                className={`transition-all hover:border-sakura-200 ${
                  alert.severity === "critical" ? "border-l-4 border-l-red-500" : ""
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`rounded-xl p-2.5 ${
                        alert.severity === "critical"
                          ? "bg-red-50"
                          : alert.severity === "high"
                            ? "bg-orange-50"
                            : "bg-amber-50"
                      }`}
                    >
                      <AlertTriangle
                        className={`h-5 w-5 ${
                          alert.severity === "critical"
                            ? "text-red-600"
                            : alert.severity === "high"
                              ? "text-orange-600"
                              : "text-amber-600"
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge variant={severityBadgeVariant(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        {alert.category && <Badge variant="outline">{alert.category}</Badge>}
                        {alert.status === "resolved" && (
                          <Badge variant="success">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Resolved
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-slate-900">{alert.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">
                        {alert.description}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {alert.patientName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatDateTime(alert.createdAt)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
