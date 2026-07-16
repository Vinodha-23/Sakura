"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Clock, CheckCircle2, Bot, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, severityBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export type AlertView = {
  id: string;
  patientId: string;
  patientName: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  category: string;
  assignedTo?: string | null;
  recommendedAction?: string | null;
  source?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
};

export function AlertDetailClient({ alert: initial }: { alert: AlertView }) {
  const [alert, setAlert] = useState(initial);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const act = async (action: "resolve" | "assign") => {
    setLoading(true);
    const res = await fetch(`/api/alerts/${alert.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast("error", "Action failed", data.error);
      return;
    }
    setAlert({
      ...alert,
      status: data.alert.status,
      assignedTo: data.alert.assignedTo,
      resolvedAt: data.alert.resolvedAt
        ? new Date(data.alert.resolvedAt).toISOString()
        : alert.resolvedAt,
    });
    toast("success", action === "resolve" ? "Alert resolved" : "Alert assigned to you");
    router.refresh();
  };

  return (
    <div>
      <Link
        href="/clinical-alerts"
        className="mb-6 inline-flex items-center gap-2 text-sm text-sakura-600 hover:text-sakura-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to alerts
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className={alert.severity === "critical" ? "border-l-4 border-l-red-500" : ""}>
            <CardContent className="p-6">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge variant={severityBadgeVariant(alert.severity)}>{alert.severity}</Badge>
                {alert.category && <Badge variant="outline">{alert.category}</Badge>}
                <Badge
                  variant={
                    alert.status === "resolved"
                      ? "success"
                      : alert.status === "assigned"
                        ? "info"
                        : "warning"
                  }
                >
                  {alert.status}
                </Badge>
              </div>
              <h1 className="text-2xl font-semibold text-slate-900">{alert.title}</h1>
              <p className="mt-3 leading-relaxed text-slate-600">{alert.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" /> {alert.patientName}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {formatDateTime(alert.createdAt)}
                </span>
                {alert.assignedTo && <span>Assigned to {alert.assignedTo}</span>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-sakura-600" />
                Recommended Action
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-sakura-100 bg-sakura-50 p-4">
                <p className="text-sm leading-relaxed text-slate-700">
                  {alert.recommendedAction || "Review chart and document clinical decision."}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {alert.status !== "resolved" && (
                  <>
                    <Button disabled={loading} onClick={() => act("resolve")}>
                      <CheckCircle2 className="h-4 w-4" /> Mark Resolved
                    </Button>
                    <Button variant="outline" disabled={loading} onClick={() => act("assign")}>
                      Assign to Me
                    </Button>
                  </>
                )}
                <Link href={`/patients/${alert.patientId}`}>
                  <Button variant="outline">View Patient</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alert Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="mt-2 h-2 w-2 rounded-full bg-red-500" />
                  <div>
                    <p className="text-sm font-medium">Alert generated</p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(alert.createdAt)} · {alert.source || "System"}
                    </p>
                  </div>
                </div>
                {alert.assignedTo && (
                  <div className="flex gap-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-sakura-500" />
                    <div>
                      <p className="text-sm font-medium">Assigned to {alert.assignedTo}</p>
                    </div>
                  </div>
                )}
                {alert.status === "resolved" && (
                  <div className="flex gap-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-sm font-medium">Resolved</p>
                      {alert.resolvedAt && (
                        <p className="text-xs text-slate-500">
                          {formatDateTime(alert.resolvedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/patients/${alert.patientId}`}
                className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-sakura-200"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sakura-50 text-sm font-medium text-sakura-700">
                  {alert.patientName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{alert.patientName}</p>
                  <p className="text-xs text-slate-500">View patient record</p>
                </div>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Source</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{alert.source || "System"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
