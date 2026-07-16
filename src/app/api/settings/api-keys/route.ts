import { NextResponse } from "next/server";
import { createApiKey, listApiKeys } from "@/lib/settings";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const keys = await listApiKeys();
  return NextResponse.json({ keys });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const result = await createApiKey(String(body?.name || "Integration key"), {
    id: session.user.id,
    name: session.user.name,
  });
  return NextResponse.json(
    { key: result.key, plaintext: result.plaintext },
    { status: 201 }
  );
}
