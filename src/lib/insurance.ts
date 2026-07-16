import { eq } from "drizzle-orm";
import { db } from "@/db";
import { insuranceClaims } from "@/db/schema";
import { splitPipeList } from "@/lib/csv";

export type ClaimDTO = {
  id: string;
  patientId: string;
  patientName: string;
  claimNumber: string;
  provider: string;
  amount: number;
  status: string;
  approvalProbability: number;
  submittedAt: string;
  diagnosis: string;
  procedure: string;
  missingDocuments: string[];
  suggestedCorrections: string[];
  notes: string;
};

function toClaimDTO(row: typeof insuranceClaims.$inferSelect): ClaimDTO {
  return {
    id: row.id,
    patientId: row.patientId,
    patientName: row.patientName,
    claimNumber: row.claimNumber,
    provider: row.provider,
    amount: Number(row.amount),
    status: row.status,
    approvalProbability: row.approvalProbability,
    submittedAt: row.submittedAt.toISOString(),
    diagnosis: row.diagnosis || "",
    procedure: row.procedure || "",
    missingDocuments: splitPipeList(row.missingDocuments),
    suggestedCorrections: splitPipeList(row.suggestedCorrections),
    notes: row.notes || "",
  };
}

export async function listClaimsFromDb() {
  const rows = await db.select().from(insuranceClaims);
  return rows.map(toClaimDTO);
}

export async function getClaimFromDb(id: string) {
  const rows = await db
    .select()
    .from(insuranceClaims)
    .where(eq(insuranceClaims.id, id))
    .limit(1);
  if (!rows[0]) return null;
  return toClaimDTO(rows[0]);
}

export async function updateClaimStatus(
  id: string,
  status: string,
  extras?: Partial<{
    notes: string;
    missingDocuments: string;
    suggestedCorrections: string;
  }>
) {
  const existing = await getClaimFromDb(id);
  if (!existing) return null;
  await db
    .update(insuranceClaims)
    .set({
      status,
      ...(extras?.notes !== undefined ? { notes: extras.notes } : {}),
      ...(extras?.missingDocuments !== undefined
        ? { missingDocuments: extras.missingDocuments }
        : {}),
      ...(extras?.suggestedCorrections !== undefined
        ? { suggestedCorrections: extras.suggestedCorrections }
        : {}),
      updatedAt: new Date(),
      approvalProbability:
        status === "approved"
          ? Math.max(existing.approvalProbability, 90)
          : status === "rejected"
            ? Math.min(existing.approvalProbability, 40)
            : existing.approvalProbability,
    })
    .where(eq(insuranceClaims.id, id));
  return getClaimFromDb(id);
}
