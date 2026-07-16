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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardCharts({
  patientTrendData,
  medicationRiskData,
}: {
  patientTrendData: { month: string; patients: number; alerts: number }[];
  medicationRiskData: { name: string; count: number }[];
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Patient Trends</CardTitle>
          <p className="text-xs text-slate-400 font-normal">From panel create dates</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={patientTrendData}>
              <defs>
                <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0c8ce9" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0c8ce9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="patients"
                stroke="#0c8ce9"
                fill="url(#colorPatients)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Panel Risk Distribution</CardTitle>
          <p className="text-xs text-slate-400 font-normal">Live risk levels from patients</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={medicationRiskData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis
                dataKey="name"
                type="category"
                width={90}
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
              />
              <Tooltip />
              <Bar dataKey="count" fill="#0c8ce9" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
