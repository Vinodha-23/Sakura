"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, riskBadgeVariant, severityBadgeVariant } from "@/components/ui/badge";
import type { Document } from "@/lib/types";
import type { PatientDTO } from "@/lib/patients";

type AlertDTO = {
  id: string;
  title: string;
  severity: string;
  status: string;
};

type ClaimDTO = {
  id: string;
  claimNumber: string;
  status: string;
  amount: number;
  approvalProbability: number;
};

const PIE_COLORS = ["#0c8ce9", "#f59e0b", "#10b981", "#ef4444", "#94a3b8"];

export function PatientClinicalDashboard({
  patient,
  alerts,
  claims,
  documents,
}: {
  patient: PatientDTO;
  alerts: AlertDTO[];
  claims: ClaimDTO[];
  documents: Document[];
}) {
  const openAlerts = alerts.filter((a) => a.status !== "resolved");
  const vitalsBars = patient.vitals
    ? [
        {
          name: "HR",
          value: Number(patient.vitals.heartRate) || 0,
        },
        {
          name: "Temp",
          value: Number(patient.vitals.temperature) || 0,
        },
        {
          name: "SpO₂",
          value: Number(patient.vitals.oxygenSaturation) || 0,
        },
        {
          name: "Wt",
          value: Number(patient.vitals.weight) || 0,
        },
      ].filter((v) => v.value > 0)
    : [];

  const alertSeverity = ["critical", "high", "medium", "low"]
    .map((sev) => ({
      name: sev,
      count: openAlerts.filter((a) => a.severity === sev).length,
    }))
    .filter((d) => d.count > 0);

  const claimStatus = ["pending", "review", "approved", "rejected"]
    .map((status) => ({
      name: status,
      value: claims.filter((c) => c.status === status).length,
    }))
    .filter((d) => d.value > 0);

  const docStatus = ["processed", "processing", "pending", "failed"]
    .map((status) => ({
      name: status,
      count: documents.filter((d) => d.status === status).length,
    }))
    .filter((d) => d.count > 0);

  const riskScore =
    patient.riskLevel === "critical"
      ? 95
      : patient.riskLevel === "high"
        ? 75
        : patient.riskLevel === "medium"
          ? 50
          : patient.riskLevel === "low"
            ? 25
            : 10;

  const timelineSpark = [
    { label: "Risk", value: riskScore },
    { label: "Trust", value: patient.trustScore },
    {
      label: "Alerts",
      value: Math.min(100, openAlerts.length * 25),
    },
    {
      label: "Claims",
      value: Math.min(
        100,
        claims.filter((c) => c.status === "pending" || c.status === "review")
          .length * 30
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Clinical risk</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={riskBadgeVariant(patient.riskLevel as "critical")}>
                {patient.riskLevel}
              </Badge>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {patient.conditions.length} conditions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Open alerts</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {openAlerts.length}
            </p>
            <p className="text-xs text-slate-500">
              {openAlerts.filter((a) => a.severity === "critical").length} critical
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Medications</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {patient.medications.length}
            </p>
            <p className="text-xs text-slate-500">
              {patient.allergies.length} allergies on file
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500">Trust score</p>
            <p className="mt-2 text-2xl font-semibold text-sakura-600">
              {patient.trustScore}%
            </p>
            <p className="text-xs text-slate-500">
              {documents.length} docs · {claims.length} claims
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Patient signal mix</CardTitle>
            <p className="text-xs font-normal text-slate-400">
              Risk, trust, open alerts & pending claims (0–100 scale)
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={timelineSpark}>
                <defs>
                  <linearGradient id="patientSignal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0c8ce9" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0c8ce9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#0c8ce9"
                  fill="url(#patientSignal)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest vitals</CardTitle>
            <p className="text-xs font-normal text-slate-400">
              {patient.vitals?.bloodPressure
                ? `BP ${patient.vitals.bloodPressure}`
                : "No blood pressure on file"}
              {patient.vitals?.recordedAt
                ? ` · recorded ${new Date(patient.vitals.recordedAt).toLocaleDateString()}`
                : ""}
            </p>
          </CardHeader>
          <CardContent>
            {vitalsBars.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">
                No numeric vitals yet for charts.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={vitalsBars}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0c8ce9" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Open alert severity</CardTitle>
          </CardHeader>
          <CardContent>
            {alertSeverity.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No open alerts</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={alertSeverity} layout="vertical">
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={70}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f97316" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="mt-2 space-y-1">
              {openAlerts.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-center justify-between text-xs">
                  <span className="truncate text-slate-600">{a.title}</span>
                  <Badge variant={severityBadgeVariant(a.severity as "critical")}>
                    {a.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Claims mix</CardTitle>
          </CardHeader>
          <CardContent>
            {claimStatus.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No claims</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={claimStatus}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {claimStatus.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="mt-1 flex flex-wrap gap-2 justify-center">
              {claimStatus.map((c, i) => (
                <span key={c.name} className="text-[11px] text-slate-500">
                  <span
                    className="mr-1 inline-block h-2 w-2 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  {c.name} ({c.value})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents OCR</CardTitle>
          </CardHeader>
          <CardContent>
            {docStatus.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No documents</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={docStatus}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clinical snapshot</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Conditions
            </p>
            <div className="flex flex-wrap gap-2">
              {patient.conditions.length ? (
                patient.conditions.map((c) => (
                  <Badge key={c} variant="outline">
                    {c}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-slate-500">None listed</span>
              )}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Medications
            </p>
            <div className="flex flex-wrap gap-2">
              {patient.medications.length ? (
                patient.medications.map((m) => (
                  <Badge key={m} variant="info">
                    {m}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-slate-500">None listed</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
