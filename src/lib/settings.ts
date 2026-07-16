import { createHash, randomBytes, randomUUID } from "crypto";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  apiKeys,
  appRoles,
  auditLogs,
  organizationSettings,
  user,
} from "@/db/schema";

export type OrganizationDTO = {
  id: string;
  hospitalName: string;
  department: string;
  address: string;
  phone: string;
  npiNumber: string;
  updatedAt: string;
};

export type RoleDTO = {
  id: string;
  name: string;
  permissions: string;
  userCount: number;
  createdAt: string;
};

export type ApiKeyDTO = {
  id: string;
  name: string;
  keyPrefix: string;
  maskedKey: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

export type AuditLogDTO = {
  id: string;
  action: string;
  userName: string;
  type: string;
  createdAt: string;
};

async function writeAudit(input: {
  action: string;
  userName: string;
  userId?: string;
  type?: string;
}) {
  await db.insert(auditLogs).values({
    id: randomUUID(),
    action: input.action,
    userName: input.userName,
    userId: input.userId || null,
    type: input.type || "update",
  });
}

export async function getOrganization(): Promise<OrganizationDTO> {
  const rows = await db
    .select()
    .from(organizationSettings)
    .where(eq(organizationSettings.id, "default"))
    .limit(1);
  if (rows[0]) {
    const r = rows[0];
    return {
      id: r.id,
      hospitalName: r.hospitalName,
      department: r.department,
      address: r.address || "",
      phone: r.phone || "",
      npiNumber: r.npiNumber || "",
      updatedAt: r.updatedAt?.toISOString?.() ?? String(r.updatedAt),
    };
  }
  await db.insert(organizationSettings).values({ id: "default" });
  return getOrganization();
}

export async function updateOrganization(
  patch: {
    hospitalName?: string;
    department?: string;
    address?: string;
    phone?: string;
    npiNumber?: string;
  },
  actor: { id: string; name: string }
): Promise<OrganizationDTO> {
  await getOrganization();
  await db
    .update(organizationSettings)
    .set({
      ...(patch.hospitalName !== undefined
        ? { hospitalName: patch.hospitalName.trim() }
        : {}),
      ...(patch.department !== undefined
        ? { department: patch.department.trim() }
        : {}),
      ...(patch.address !== undefined ? { address: patch.address.trim() } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone.trim() } : {}),
      ...(patch.npiNumber !== undefined
        ? { npiNumber: patch.npiNumber.trim() }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(organizationSettings.id, "default"));

  await writeAudit({
    action: "Organization settings updated",
    userName: actor.name,
    userId: actor.id,
    type: "update",
  });
  return getOrganization();
}

export async function listRoles(): Promise<RoleDTO[]> {
  const roles = await db.select().from(appRoles).orderBy(appRoles.name);
  const counts = await db
    .select({ role: user.role, n: count() })
    .from(user)
    .groupBy(user.role);
  const map = new Map(counts.map((c) => [c.role || "", Number(c.n)]));
  return roles.map((r) => ({
    id: r.id,
    name: r.name,
    permissions: r.permissions,
    userCount: map.get(r.name) || 0,
    createdAt: r.createdAt?.toISOString?.() ?? String(r.createdAt),
  }));
}

export async function createRole(
  name: string,
  permissions: string,
  actor: { id: string; name: string }
): Promise<RoleDTO> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Role name is required");
  const id = randomUUID();
  await db.insert(appRoles).values({
    id,
    name: trimmed,
    permissions: permissions.trim() || "Custom role",
  });
  await writeAudit({
    action: `Role created: ${trimmed}`,
    userName: actor.name,
    userId: actor.id,
    type: "create",
  });
  const roles = await listRoles();
  return roles.find((r) => r.id === id)!;
}

function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function listApiKeys(): Promise<ApiKeyDTO[]> {
  const rows = await db
    .select()
    .from(apiKeys)
    .orderBy(desc(apiKeys.createdAt));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    keyPrefix: r.keyPrefix,
    maskedKey: `${r.keyPrefix}${"•".repeat(8)}`,
    createdAt: r.createdAt?.toISOString?.() ?? String(r.createdAt),
    lastUsedAt: r.lastUsedAt
      ? r.lastUsedAt.toISOString?.() ?? String(r.lastUsedAt)
      : null,
    revokedAt: r.revokedAt
      ? r.revokedAt.toISOString?.() ?? String(r.revokedAt)
      : null,
  }));
}

export async function createApiKey(
  name: string,
  actor: { id: string; name: string }
): Promise<{ key: ApiKeyDTO; plaintext: string }> {
  const trimmed = name.trim() || "Integration key";
  const secret = randomBytes(24).toString("hex");
  const plaintext = `sk_live_${secret}`;
  const keyPrefix = plaintext.slice(0, 12);
  const id = randomUUID();
  const createdAt = new Date();
  await db.insert(apiKeys).values({
    id,
    name: trimmed,
    keyPrefix,
    keyHash: hashKey(plaintext),
    createdBy: actor.id,
    createdAt,
  });
  await writeAudit({
    action: `API key generated: ${trimmed}`,
    userName: actor.name,
    userId: actor.id,
    type: "security",
  });
  return {
    plaintext,
    key: {
      id,
      name: trimmed,
      keyPrefix,
      maskedKey: `${keyPrefix}${"•".repeat(8)}`,
      createdAt: createdAt.toISOString(),
      lastUsedAt: null,
      revokedAt: null,
    },
  };
}

export async function revokeApiKey(
  id: string,
  actor: { id: string; name: string }
): Promise<ApiKeyDTO | null> {
  const rows = await db.select().from(apiKeys).where(eq(apiKeys.id, id)).limit(1);
  if (!rows[0]) return null;
  if (rows[0].revokedAt) {
    return (await listApiKeys()).find((k) => k.id === id) || null;
  }
  await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(eq(apiKeys.id, id));
  await writeAudit({
    action: `API key revoked: ${rows[0].name}`,
    userName: actor.name,
    userId: actor.id,
    type: "security",
  });
  return (await listApiKeys()).find((k) => k.id === id) || null;
}

export async function listAuditLogs(limit = 40): Promise<AuditLogDTO[]> {
  const rows = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    userName: r.userName,
    type: r.type,
    createdAt: r.createdAt?.toISOString?.() ?? String(r.createdAt),
  }));
}

export async function ensureDefaultRoles() {
  const existing = await db.select({ id: appRoles.id }).from(appRoles).limit(1);
  if (existing.length) return;
  const defaults = [
    { name: "Attending Physician", permissions: "Full clinical access" },
    { name: "Resident", permissions: "Read + limited write" },
    { name: "Nurse Practitioner", permissions: "Clinical read + vitals" },
    { name: "Administrator", permissions: "System administration" },
    { name: "Billing Specialist", permissions: "Insurance + claims" },
  ];
  for (const d of defaults) {
    await db.insert(appRoles).values({
      id: randomUUID(),
      name: d.name,
      permissions: d.permissions,
    });
  }
}
