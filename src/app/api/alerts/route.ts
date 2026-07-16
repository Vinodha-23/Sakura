import { NextResponse } from "next/server";
import { assignAlertInDb, getAlertFromDb, listAlertsFromDb, resolveAlertInDb } from "@/lib/alerts";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const alerts = await listAlertsFromDb();
  return NextResponse.json({
    alerts: alerts.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      resolvedAt: a.resolvedAt?.toISOString() ?? null,
    })),
  });
}
