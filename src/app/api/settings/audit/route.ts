import { NextResponse } from "next/server";
import { listAuditLogs } from "@/lib/settings";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const logs = await listAuditLogs(50);
  return NextResponse.json({ logs });
}
