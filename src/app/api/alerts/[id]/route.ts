import { NextResponse } from "next/server";
import { assignAlertInDb, getAlertFromDb, resolveAlertInDb } from "@/lib/alerts";
import { getSession } from "@/lib/session";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const alert = await getAlertFromDb(id);
  if (!alert) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    alert: {
      ...alert,
      createdAt: alert.createdAt.toISOString(),
      resolvedAt: alert.resolvedAt?.toISOString() ?? null,
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (body.action === "resolve") {
    const alert = await resolveAlertInDb(id, session.user.name);
    if (!alert) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ alert });
  }

  if (body.action === "assign") {
    const alert = await assignAlertInDb(id, body.assignee || session.user.name);
    if (!alert) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ alert });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
