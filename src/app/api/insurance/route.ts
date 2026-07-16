import { NextResponse } from "next/server";
import { listClaimsFromDb } from "@/lib/insurance";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const claims = await listClaimsFromDb();
  return NextResponse.json({ claims });
}
