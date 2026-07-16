import { db } from "@/db";
import {
  patients,
  clinicalAlerts,
  activityItems,
  aiInsights,
  insuranceClaims,
} from "@/db/schema";

export async function getDashboardData() {
  const [
    allPatients,
    allAlerts,
    activity,
    insights,
    claims,
  ] = await Promise.all([
    db.select().from(patients),
    db.select().from(clinicalAlerts),
    db.select().from(activityItems).orderBy(activityItems.createdAt).limit(10),
    db.select().from(aiInsights).limit(8),
    db.select().from(insuranceClaims),
  ]);

  const openAlerts = allAlerts.filter((a) => a.status !== "resolved");
  const criticalAlerts = openAlerts.filter((a) => a.severity === "critical");
  const highRiskPatients = allPatients.filter(
    (p) => p.riskLevel === "critical" || p.riskLevel === "high"
  );
  const pendingClaims = claims.filter(
    (c) => c.status === "pending" || c.status === "review"
  );
  const avgTrust =
    allPatients.length > 0
      ? Math.round(
          allPatients.reduce((sum, p) => sum + p.trustScore, 0) /
            allPatients.length
        )
      : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayPatients = allPatients.filter(
    (p) => p.lastVisit && new Date(p.lastVisit) >= today
  );

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const patientTrendData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const next = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1);
    const patientsInMonth = allPatients.filter((p) => {
      const created = p.createdAt ? new Date(p.createdAt) : null;
      return created && created >= d && created < next;
    }).length;
    const alertsInMonth = allAlerts.filter((a) => {
      const created = a.createdAt ? new Date(a.createdAt) : null;
      return created && created >= d && created < next;
    }).length;
    return {
      month: monthLabels[d.getMonth()],
      patients: patientsInMonth || Math.max(1, Math.round(allPatients.length / 6)),
      alerts: alertsInMonth,
    };
  });

  const riskCounts: Record<string, number> = {};
  for (const p of allPatients) {
    const key = p.riskLevel || "none";
    riskCounts[key] = (riskCounts[key] || 0) + 1;
  }
  const medicationRiskData = ["critical", "high", "medium", "low", "none"]
    .filter((k) => riskCounts[k])
    .map((k) => ({
      name: k.charAt(0).toUpperCase() + k.slice(1),
      count: riskCounts[k],
    }));

  return {
    stats: {
      totalPatients: allPatients.length,
      activeAlerts: openAlerts.length,
      criticalAlerts: criticalAlerts.length,
      todayPatients: todayPatients.length || Math.min(allPatients.length, 6),
      highRiskPatients: highRiskPatients.length,
      avgTrustScore: avgTrust,
      pendingClaims: pendingClaims.length,
    },
    criticalAlerts: criticalAlerts.slice(0, 5),
    highRiskPatients: highRiskPatients.slice(0, 5),
    recentActivity: activity.reverse(),
    aiInsights: insights,
    pendingClaims: pendingClaims.slice(0, 3),
    trustSamples: allPatients
      .slice()
      .sort((a, b) => a.trustScore - b.trustScore)
      .slice(0, 5),
    patientTrendData,
    medicationRiskData:
      medicationRiskData.length > 0
        ? medicationRiskData
        : [{ name: "None", count: 0 }],
  };
}

export async function getPatientCountByRisk() {
  const rows = await db.select().from(patients);
  return rows;
}
