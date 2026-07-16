import { randomUUID } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import type { Notification } from "@/lib/types";

export type NotificationRecord = typeof notifications.$inferSelect;

export function toNotificationDTO(row: NotificationRecord): Notification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: (row.type as Notification["type"]) || "info",
    read: Boolean(row.read),
    archived: Boolean(row.archived),
    timestamp: row.createdAt?.toISOString?.() ?? String(row.createdAt),
    link: row.link ?? undefined,
  };
}

export async function listNotificationsForUser(
  userId: string
): Promise<Notification[]> {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
  return rows.map(toNotificationDTO);
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.read, false),
        eq(notifications.archived, false)
      )
    );
  return rows.length;
}

export async function markNotificationRead(
  userId: string,
  id: string
): Promise<Notification | null> {
  const existing = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .limit(1);
  if (!existing[0]) return null;
  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, id));
  return toNotificationDTO({ ...existing[0], read: true });
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const unread = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.read, false),
        eq(notifications.archived, false)
      )
    );
  for (const row of unread) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, row.id));
  }
  return unread.length;
}

export async function archiveNotification(
  userId: string,
  id: string
): Promise<Notification | null> {
  const existing = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .limit(1);
  if (!existing[0]) return null;
  await db
    .update(notifications)
    .set({ archived: true, read: true })
    .where(eq(notifications.id, id));
  return toNotificationDTO({ ...existing[0], archived: true, read: true });
}

export async function createNotification(input: {
  userId: string;
  title: string;
  message: string;
  type?: Notification["type"];
  link?: string;
}): Promise<Notification> {
  const id = randomUUID();
  const createdAt = new Date();
  await db.insert(notifications).values({
    id,
    userId: input.userId,
    title: input.title,
    message: input.message,
    type: input.type || "info",
    read: false,
    archived: false,
    link: input.link || null,
    createdAt,
  });
  return {
    id,
    title: input.title,
    message: input.message,
    type: input.type || "info",
    read: false,
    archived: false,
    timestamp: createdAt.toISOString(),
    link: input.link,
  };
}
