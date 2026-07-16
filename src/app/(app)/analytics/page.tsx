"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/common";
import {
  patientTrendData,
  diseaseDistribution,
  medicationRiskData,
  dashboardStats,
} from "@/lib/mock-data";

const alertStats = [
  { month: "Jan", critical: 3, high: 8, medium: 12, low: 22 },
  { month: "Feb", critical: 5, high: 10, medium: 15, low: 22 },
  { month: "Mar", critical: 2, high: 7, medium: 14, low: 25 },
  { month: "Apr", critical: 6, high: 12, medium: 18, low: 25 },
  { month: "May", critical: 4, high: 9, medium: 16, low: 26 },
  { month: "Jun", critical: 3, high: 11, medium: 17, low: 27 },
  { month: "Jul", critical: 5, high: 10, medium: 19, low: 29 },
];

const insuranceSuccess = [
  { month: "Jan", rate: 72 },
  { month: "Feb", rate: 75 },
  { month: "Mar", rate: 78 },
  { month: "Apr", rate: 74 },
  { month: "May", rate: 80 },
  { month: "Jun", rate: 82 },
  { month: "Jul", rate: 78 },
];

const trustScoreTrends = [
  { month: "Jan", score: 79 },
  { month: "Feb", score: 80 },
  { month: "Mar", score: 81 },
  { month: "Apr", score: 80 },
  { month: "May", score: 82 },
  { month: "Jun", score: 83 },
  { month: "Jul", score: 84 },
];

const aiPerformance = [
  { metric: "Accuracy", value: 94 },
  { metric: "Precision", value: 91 },
  { metric: "Recall", value: 88 },
  { metric: "F1 Score", value: 89 },
];

const usageData = [
  { day: "Mon", logins: 45, aiQueries: 120, documents: 34 },
  { day: "Tue", logins: 52, aiQueries: 145, documents: 28 },
  { day: "Wed", logins: 48, aiQueries: 132, documents: 41 },
  { day: "Thu", logins: 55, aiQueries: 158, documents: 36 },
  { day: "Fri", logins: 42, aiQueries: 110, documents: 22 },
];

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Clinical intelligence metrics · sample charts for product demos"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Analytics" }]}
      />

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Preview charts use representative demo datasets. Live panel aggregates power the Dashboard.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        {[
          { label: "Total Patients", value: dashboardStats.totalPatients.toLocaleString() },
          { label: "AI Analyses Today", value: dashboardStats.aiAnalysesToday },
          { label: "Documents Processed", value: dashboardStats.documentsProcessed },
          { label: "Avg Trust Score", value: `${dashboardStats.avgTrustScore}%` },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader><CardTitle>Patient Trends</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={patientTrendData}>
                <defs>
                  <linearGradient id="patients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0c8ce9" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0c8ce9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="patients" stroke="#0c8ce9" fill="url(#patients)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Disease Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={diseaseDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {diseaseDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader><CardTitle>Alert Statistics</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={alertStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="critical" stackId="a" fill="#ef4444" />
                <Bar dataKey="high" stackId="a" fill="#f97316" />
                <Bar dataKey="medium" stackId="a" fill="#f59e0b" />
                <Bar dataKey="low" stackId="a" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Medication Statistics</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={medicationRiskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0c8ce9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader><CardTitle>Insurance Success Rate</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={insuranceSuccess}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Trust Score Trends</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trustScoreTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis domain={[70, 90]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#0c8ce9" strokeWidth={2} dot={{ fill: "#0c8ce9" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>AI Performance</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={aiPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis dataKey="metric" type="category" width={70} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Usage Analytics</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="logins" fill="#0c8ce9" name="Logins" radius={[4, 4, 0, 0]} />
              <Bar dataKey="aiQueries" fill="#8b5cf6" name="AI Queries" radius={[4, 4, 0, 0]} />
              <Bar dataKey="documents" fill="#10b981" name="Documents" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
