import { PageHeader } from "@/components/ui/common";
import { listAlertsFromDb } from "@/lib/alerts";
import { ClinicalAlertsClient } from "./alerts-client";

export default async function ClinicalAlertsPage() {
  const alerts = await listAlertsFromDb();
  return (
    <ClinicalAlertsClient
      initialAlerts={alerts.map((a) => ({
        id: a.id,
        patientId: a.patientId,
        patientName: a.patientName,
        title: a.title,
        description: a.description,
        severity: a.severity,
        status: a.status,
        category: a.category || "",
        assignedTo: a.assignedTo || undefined,
        createdAt: a.createdAt.toISOString(),
        source: a.source || "",
      }))}
    />
  );
}
