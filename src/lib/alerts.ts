import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clinicalAlerts, patients } from "@/db/schema";

export async function listAlertsFromDb() {
  return db.select().from(clinicalAlerts);
}

export async function getAlertFromDb(id: string) {
  const rows = await db
    .select()
    .from(clinicalAlerts)
    .where(eq(clinicalAlerts.id, id))
    .limit(1);
  return rows[0] || null;
}

export async function resolveAlertInDb(id: string, assignedTo?: string) {
  const existing = await getAlertFromDb(id);
  if (!existing) return null;

  await db
    .update(clinicalAlerts)
    .set({
      status: "resolved",
      resolvedAt: new Date(),
      assignedTo: assignedTo || existing.assignedTo,
    })
    .where(eq(clinicalAlerts.id, id));

  // Keep patient alertCount in sync
  const open = await db
    .select()
    .from(clinicalAlerts)
    .where(eq(clinicalAlerts.patientId, existing.patientId));
  const openCount = open.filter((a) => a.status !== "resolved").length;
  await db
    .update(patients)
    .set({ alertCount: openCount, updatedAt: new Date() })
    .where(eq(patients.id, existing.patientId));

  return getAlertFromDb(id);
}

export async function assignAlertInDb(id: string, assignee: string) {
  const existing = await getAlertFromDb(id);
  if (!existing) return null;
  await db
    .update(clinicalAlerts)
    .set({
      status: existing.status === "resolved" ? "resolved" : "assigned",
      assignedTo: assignee,
    })
    .where(eq(clinicalAlerts.id, id));
  return getAlertFromDb(id);
}
