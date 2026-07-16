import { NextResponse } from "next/server";
import {
  archiveNotification,
  markNotificationRead,
} from "@/lib/notifications";
import { getSession } from "@/lib/session";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const action = body?.action || "read";

  if (action === "archive") {
    const notification = await archiveNotification(session.user.id, id);
    if (!notification) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ notification });
  }

  const notification = await markNotificationRead(session.user.id, id);
  if (!notification) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ notification });
}
