import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { account } from "@/db/schema";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");

  if (!currentPassword || newPassword.length < 8) {
    return NextResponse.json(
      { error: "Current password and a new password (8+ chars) are required" },
      { status: 400 }
    );
  }

  const accounts = await db
    .select()
    .from(account)
    .where(eq(account.userId, session.user.id))
    .limit(5);
  const cred = accounts.find((a) => a.providerId === "credential" && a.password);
  if (!cred?.password) {
    return NextResponse.json({ error: "No password credential on this account" }, { status: 400 });
  }

  const ctx = await auth.$context;
  const valid = await ctx.password.verify({
    hash: cred.password,
    password: currentPassword,
  });
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const hash = await ctx.password.hash(newPassword);
  await db
    .update(account)
    .set({ password: hash, updatedAt: new Date() })
    .where(eq(account.id, cred.id));

  return NextResponse.json({ ok: true, message: "Password updated" });
}
