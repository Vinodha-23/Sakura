import { NextResponse } from "next/server";
import { createRole, ensureDefaultRoles, listRoles } from "@/lib/settings";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureDefaultRoles();
  const roles = await listRoles();
  return NextResponse.json({ roles });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  try {
    await ensureDefaultRoles();
    const role = await createRole(
      String(body.name),
      String(body.permissions || "Custom role"),
      { id: session.user.id, name: session.user.name }
    );
    return NextResponse.json({ role }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create role";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
