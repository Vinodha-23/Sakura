import { NextResponse } from "next/server";
import {
  countUnreadNotifications,
  listNotificationsForUser,
  markAllNotificationsRead,
} from "@/lib/notifications";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    listNotificationsForUser(session.user.id),
    countUnreadNotifications(session.user.id),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (body?.action === "mark_all_read") {
    const updated = await markAllNotificationsRead(session.user.id);
    return NextResponse.json({ updated });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
