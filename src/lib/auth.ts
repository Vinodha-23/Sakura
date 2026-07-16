import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { twoFactor } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  appName: "Sakura",
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      twoFactor: schema.twoFactor,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // No email sending — reset tokens only work via demo API / admin
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "Attending Physician",
        input: false,
      },
      department: {
        type: "string",
        required: false,
        defaultValue: "Internal Medicine",
        input: false,
      },
    },
  },
  session: {
    // 30 minute idle-friendly session for clinical workstations
    expiresIn: 60 * 30,
    updateAge: 60 * 5,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  plugins: [
    twoFactor({
      issuer: "Sakura",
      // TOTP only — no SMS/email OTP
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
