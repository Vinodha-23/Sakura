import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user, account } from "@/db/schema";

/**
 * Demo-only password reset — no email/SMS.
 * Returns a temporary password on-screen when DEMO_MODE=true.
 */
export async function POST(request: Request) {
  if (process.env.DEMO_MODE !== "true") {
    return NextResponse.json(
      {
        error:
          "Password reset messaging is disabled. Contact your hospital administrator.",
      },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const rows = await db.select().from(user).where(eq(user.email, email)).limit(1);
  if (rows.length === 0) {
    // Avoid account enumeration in tone, but demo mode can be clearer
    return NextResponse.json({
      ok: true,
      message:
        "If this account exists, a temporary password was generated. (Demo: account not found.)",
    });
  }

  const tempPassword = `Temp-${randomBytes(4).toString("hex")}!A1`;

  // Use Better Auth internal context via update
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(tempPassword);

  await db
    .update(account)
    .set({ password: hash, updatedAt: new Date() })
    .where(eq(account.userId, rows[0].id));

  return NextResponse.json({
    ok: true,
    message: "Demo password reset (no email sent).",
    temporaryPassword: tempPassword,
    email,
  });
}
