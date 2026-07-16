import Link from "next/link";
import {
  Users,
  AlertTriangle,
  FileText,
  Shield,
  TrendingUp,
  Activity,
  Bot,
  ArrowRight,
  Plus,
  Upload,
  Search,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, riskBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/common";
import { getDashboardData } from "@/lib/dashboard";
import { getSession } from "@/lib/session";
import { formatDateTime, getInitials } from "@/lib/utils";
import { DashboardCharts } from "./dashboard-charts";

const activityIcons = {
  alert: AlertTriangle,
  document: FileText,
  patient: Users,
  insurance: Shield,
  ai: Bot,
} as const;

export default async function DashboardPage() {
  const session = await getSession();
  const data = await getDashboardData();
  const firstName = session?.user.name?.split(" ")[0] || "Doctor";

  const statCards = [
    {
      label: "Total Patients",
      value: data.stats.totalPatients.toLocaleString(),
      change: "From database",
      icon: Users,
      color: "text-sakura-600 bg-sakura-50",
    },
    {
      label: "Active Alerts",
      value: data.stats.activeAlerts,
      change: `${data.stats.criticalAlerts} critical`,
      icon: AlertTriangle,
      color: "text-orange-600 bg-orange-50",
    },
    {
      label: "Today's Patients",
      value: data.stats.todayPatients,
      change: "Visits today",
      icon: Activity,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Avg Trust Score",
      value: `${data.stats.avgTrustScore}%`,
      change: "Panel average",
      icon: TrendingUp,
      color: "text-violet-600 bg-violet-50",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${firstName}. Here's your clinical overview for ${new Date().toLocaleDateString(
          "en-US",
          { weekday: "long", month: "long", day: "numeric" }
        )}.`}
        actions={
          <>
            <Link href="/documents">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
            </Link>
            <Link href="/patients?new=1">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Add Patient
              </Button>
            </Link>
          </>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`rounded-xl p-2.5 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-slate-500">{stat.change}</span>
              </div>
              <p className="mt-4 text-2xl font-semibold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Critical Alerts</CardTitle>
              <Link
                href="/clinical-alerts"
                className="flex items-center gap-1 text-sm text-sakura-600 hover:text-sakura-700"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.criticalAlerts.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">No critical alerts</p>
                ) : (
                  data.criticalAlerts.map((alert) => (
                    <Link
                      key={alert.id}
                      href={`/clinical-alerts/${alert.id}`}
                      className="flex items-start gap-4 rounded-xl border border-red-100 bg-red-50/50 p-4 transition-colors hover:bg-red-50"
                    >
                      <div className="mt-0.5 rounded-lg bg-red-100 p-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900">{alert.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {alert.patientName} · {formatDateTime(alert.createdAt)}
                        </p>
                      </div>
                      <Badge variant="critical">Critical</Badge>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <DashboardCharts
            patientTrendData={data.patientTrendData}
            medicationRiskData={data.medicationRiskData}
          />

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-sakura-600" />
                AI Insights
              </CardTitle>
              <Link
                href="/ai-assistant"
                className="flex items-center gap-1 text-sm text-sakura-600 hover:text-sakura-700"
              >
                Open Assistant <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.aiInsights.map((insight) => (
                  <div
                    key={insight.id}
                    className="rounded-xl border border-border p-4 transition-colors hover:border-sakura-200"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <Badge variant="info">{insight.category || "Insight"}</Badge>
                      <span className="text-xs font-medium text-sakura-600">
                        {insight.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{insight.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{insight.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { label: "Add Patient", href: "/patients?new=1", icon: Plus },
                { label: "Upload Doc", href: "/documents", icon: Upload },
                { label: "AI Search", href: "/ai-assistant", icon: Search },
                { label: "View Claims", href: "/insurance", icon: Shield },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center transition-colors hover:border-sakura-200 hover:bg-sakura-50/50"
                >
                  <action.icon className="h-5 w-5 text-sakura-600" />
                  <span className="text-xs font-medium text-slate-700">{action.label}</span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>High Risk Patients</CardTitle>
              <Link href="/patients" className="text-sm text-sakura-600 hover:text-sakura-700">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.highRiskPatients.map((patient) => (
                  <Link
                    key={patient.id}
                    href={`/patients/${patient.id}`}
                    className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-subtle"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-medium text-slate-600">
                      {getInitials(patient.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{patient.name}</p>
                      <p className="text-xs text-slate-500">{patient.department}</p>
                    </div>
                    <Badge variant={riskBadgeVariant(patient.riskLevel)}>{patient.riskLevel}</Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trust Score Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-center">
                <div className="relative flex h-28 w-28 items-center justify-center">
                  <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#0c8ce9"
                      strokeWidth="8"
                      strokeDasharray={`${data.stats.avgTrustScore * 2.64} 264`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-2xl font-semibold text-slate-900">
                    {data.stats.avgTrustScore}%
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {data.trustSamples.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="truncate text-slate-600">{p.name.split(" ")[0]}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full bg-sakura-500"
                          style={{ width: `${p.trustScore}%` }}
                        />
                      </div>
                      <span className="w-8 text-xs font-medium text-slate-700">{p.trustScore}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Insurance Summary</CardTitle>
              <Link href="/insurance" className="text-sm text-sakura-600">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Pending Claims</span>
                  <span className="font-medium">{data.stats.pendingClaims}</span>
                </div>
                {data.pendingClaims.map((claim) => (
                  <Link
                    key={claim.id}
                    href={`/insurance/${claim.id}`}
                    className="block rounded-xl border border-border p-3 transition-colors hover:border-sakura-200"
                  >
                    <p className="text-sm font-medium text-slate-900">{claim.patientName}</p>
                    <p className="text-xs text-slate-500">
                      ${Number(claim.amount).toLocaleString()} · {claim.approvalProbability}% approval
                    </p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentActivity.map((activity) => {
                  const Icon =
                    activityIcons[activity.type as keyof typeof activityIcons] || Activity;
                  return (
                    <div key={activity.id} className="flex gap-3">
                      <div className="mt-0.5 rounded-lg bg-surface-subtle p-1.5">
                        <Icon className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                        <p className="truncate text-xs text-slate-500">{activity.description}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
