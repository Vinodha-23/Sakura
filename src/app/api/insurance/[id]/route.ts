import { NextResponse } from "next/server";
import { getClaimFromDb, updateClaimStatus } from "@/lib/insurance";
import { getSession } from "@/lib/session";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const claim = await getClaimFromDb(id);
  if (!claim) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ claim });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const status = String(body.status || "");
  if (!["pending", "review", "approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const claim = await updateClaimStatus(id, status, {
    notes: body.notes ? String(body.notes) : undefined,
  });
  if (!claim) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ claim });
}
