import { notFound } from "next/navigation";
import { getAlertFromDb } from "@/lib/alerts";
import { AlertDetailClient } from "./alert-detail-client";

export default async function AlertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const alert = await getAlertFromDb(id);
  if (!alert) notFound();

  return (
    <AlertDetailClient
      alert={{
        id: alert.id,
        patientId: alert.patientId,
        patientName: alert.patientName,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        status: alert.status,
        category: alert.category || "",
        assignedTo: alert.assignedTo,
        recommendedAction: alert.recommendedAction,
        source: alert.source,
        createdAt: alert.createdAt.toISOString(),
        resolvedAt: alert.resolvedAt?.toISOString() ?? null,
      }}
    />
  );
}
