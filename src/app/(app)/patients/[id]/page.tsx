import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { clinicalAlerts, insuranceClaims } from "@/db/schema";
import { getPatientFromDb } from "@/lib/patients";
import { PatientDetailClient } from "./patient-detail-client";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatientFromDb(id);
  if (!patient) notFound();

  const [alerts, claims] = await Promise.all([
    db.select().from(clinicalAlerts).where(eq(clinicalAlerts.patientId, id)),
    db.select().from(insuranceClaims).where(eq(insuranceClaims.patientId, id)),
  ]);

  return (
    <PatientDetailClient
      patient={patient}
      alerts={alerts.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        severity: a.severity,
        status: a.status,
        recommendedAction: a.recommendedAction || "",
        createdAt: a.createdAt.toISOString(),
        category: a.category || "",
        source: a.source || "",
      }))}
      claims={claims.map((c) => ({
        id: c.id,
        claimNumber: c.claimNumber,
        diagnosis: c.diagnosis || "",
        amount: Number(c.amount),
        status: c.status,
        approvalProbability: c.approvalProbability,
        submittedAt: c.submittedAt.toISOString(),
      }))}
    />
  );
}
