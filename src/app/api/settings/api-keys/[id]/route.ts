import { NextResponse } from "next/server";
import { revokeApiKey } from "@/lib/settings";
import { getSession } from "@/lib/session";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const key = await revokeApiKey(id, {
    id: session.user.id,
    name: session.user.name,
  });
  if (!key) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ key });
}
