import { randomUUID } from "crypto";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { activityItems, documents, patients } from "@/db/schema";
import { splitPipeList } from "@/lib/csv";
import {
  extractClinicalEntities,
  isImageMime,
  isPlainTextMime,
  runDocumentOcr,
} from "@/lib/nvidia-ocr";
import type { Document, DocumentStatus } from "@/lib/types";

export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;

export type DocumentRecord = typeof documents.$inferSelect;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function toDocumentDTO(
  row: DocumentRecord,
  opts?: { includeContent?: boolean }
): Document {
  return {
    id: row.id,
    patientId: row.patientId,
    patientName: row.patientName,
    name: row.name,
    type: row.type,
    status: (row.status as DocumentStatus) || "pending",
    uploadedAt: row.createdAt?.toISOString?.() ?? String(row.createdAt),
    size: formatSize(row.sizeBytes ?? 0),
    pages: row.pages ?? 1,
    tags: splitPipeList(row.tags),
    ocrStatus: (row.ocrStatus as Document["ocrStatus"]) || "processing",
    extractedEntities: splitPipeList(row.extractedEntities),
    version: row.version ?? 1,
    mimeType: row.mimeType ?? undefined,
    ocrText: row.ocrText ?? undefined,
    ocrError: row.ocrError ?? undefined,
    ...(opts?.includeContent && row.contentBase64
      ? { contentBase64: row.contentBase64 }
      : {}),
  };
}

export async function listDocumentsFromDb(filters?: {
  patientId?: string;
  status?: string;
  q?: string;
}): Promise<Document[]> {
  const conditions = [];
  if (filters?.patientId) {
    conditions.push(eq(documents.patientId, filters.patientId));
  }
  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(documents.status, filters.status));
  }
  if (filters?.q?.trim()) {
    const q = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        ilike(documents.name, q),
        ilike(documents.patientName, q),
        ilike(documents.ocrText, q),
        ilike(documents.tags, q)
      )!
    );
  }

  const rows = await db
    .select()
    .from(documents)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(documents.createdAt));

  return rows.map((r) => toDocumentDTO(r));
}

export async function getDocumentFromDb(
  id: string,
  opts?: { includeContent?: boolean }
): Promise<Document | null> {
  const rows = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);
  if (!rows[0]) return null;
  return toDocumentDTO(rows[0], opts);
}

export async function searchDocumentsFromDb(q: string, limit = 8): Promise<Document[]> {
  const term = q.trim();
  if (!term) return [];
  const pattern = `%${term}%`;
  const rows = await db
    .select()
    .from(documents)
    .where(
      or(
        ilike(documents.name, pattern),
        ilike(documents.patientName, pattern),
        ilike(documents.type, pattern),
        ilike(documents.ocrText, pattern),
        ilike(documents.extractedEntities, pattern)
      )
    )
    .orderBy(desc(documents.createdAt))
    .limit(limit);
  return rows.map((r) => toDocumentDTO(r));
}

async function logDocumentActivity(
  title: string,
  description: string,
  patientName: string
) {
  await db.insert(activityItems).values({
    id: randomUUID(),
    type: "document",
    title,
    description,
    patientName,
  });
}

export type CreateDocumentInput = {
  patientId: string;
  name: string;
  type?: string;
  tags?: string[];
  mimeType: string;
  sizeBytes: number;
  contentBase64: string;
  uploadedBy?: string;
};

export async function createDocumentWithOcr(
  input: CreateDocumentInput
): Promise<Document> {
  if (input.sizeBytes > MAX_DOCUMENT_BYTES) {
    throw new Error(`File exceeds ${MAX_DOCUMENT_BYTES / (1024 * 1024)} MB limit`);
  }

  const patientRows = await db
    .select()
    .from(patients)
    .where(eq(patients.id, input.patientId))
    .limit(1);
  const patient = patientRows[0];
  if (!patient) {
    throw new Error("Patient not found");
  }

  const id = randomUUID();
  const mime = input.mimeType || "application/octet-stream";
  const tagsPipe = (input.tags || []).filter(Boolean).join("|") || null;

  let status: DocumentStatus = "processing";
  let ocrStatus: Document["ocrStatus"] = "processing";
  let ocrText: string | null = null;
  let extractedEntities: string | null = null;
  let ocrError: string | null = null;

  if (isPlainTextMime(mime, input.name)) {
    const text = Buffer.from(input.contentBase64, "base64").toString("utf8");
    ocrText = text;
    extractedEntities = extractClinicalEntities(text).join("|") || null;
    status = "processed";
    ocrStatus = "complete";
  } else if (isImageMime(mime)) {
    const result = await runDocumentOcr({
      mimeType: mime,
      contentBase64: input.contentBase64,
    });
    ocrText = result.text || null;
    extractedEntities = result.entities.join("|") || null;
    ocrError = result.error;
    if (result.ok) {
      status = "processed";
      ocrStatus = "complete";
    } else {
      status = "failed";
      ocrStatus = "failed";
    }
  } else {
    status = "pending";
    ocrStatus = "failed";
    ocrError =
      "OCR in the free Module 3 pipeline supports images (PNG/JPG/WEBP) and plain text. Upload a page image for OCR.";
  }

  await db.insert(documents).values({
    id,
    patientId: patient.id,
    patientName: patient.name,
    name: input.name.trim() || "Untitled document",
    type: input.type?.trim() || "Clinical Note",
    status,
    ocrStatus,
    mimeType: mime,
    sizeBytes: input.sizeBytes,
    pages: 1,
    version: 1,
    tags: tagsPipe,
    extractedEntities,
    ocrText,
    contentBase64: input.contentBase64,
    ocrError,
    uploadedBy: input.uploadedBy || null,
  });

  await logDocumentActivity(
    ocrStatus === "complete" ? "Document processed" : "Document uploaded",
    ocrStatus === "complete"
      ? `${input.name} OCR complete`
      : `${input.name} uploaded (${ocrStatus})`,
    patient.name
  );

  const created = await getDocumentFromDb(id, { includeContent: true });
  if (!created) throw new Error("Failed to load created document");
  return created;
}

export async function updateDocument(
  id: string,
  patch: { name?: string; tags?: string[]; type?: string }
): Promise<Document | null> {
  const existing = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);
  if (!existing[0]) return null;

  await db
    .update(documents)
    .set({
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.type !== undefined ? { type: patch.type.trim() } : {}),
      ...(patch.tags !== undefined
        ? { tags: patch.tags.filter(Boolean).join("|") || null }
        : {}),
      updatedAt: new Date(),
      version: (existing[0].version ?? 1) + 1,
    })
    .where(eq(documents.id, id));

  return getDocumentFromDb(id);
}

export async function deleteDocument(id: string): Promise<boolean> {
  const existing = await db
    .select({ id: documents.id, name: documents.name, patientName: documents.patientName })
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);
  if (!existing[0]) return false;

  await db.delete(documents).where(eq(documents.id, id));
  await logDocumentActivity(
    "Document deleted",
    `${existing[0].name} removed`,
    existing[0].patientName
  );
  return true;
}

export async function retryDocumentOcr(id: string): Promise<Document | null> {
  const rows = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);
  const row = rows[0];
  if (!row?.contentBase64) return null;

  const mime = row.mimeType || "application/octet-stream";

  if (isPlainTextMime(mime, row.name)) {
    const text = Buffer.from(row.contentBase64, "base64").toString("utf8");
    const entities = extractClinicalEntities(text);
    await db
      .update(documents)
      .set({
        ocrText: text,
        extractedEntities: entities.join("|") || null,
        status: "processed",
        ocrStatus: "complete",
        ocrError: null,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, id));
    return getDocumentFromDb(id, { includeContent: true });
  }

  if (!isImageMime(mime)) {
    await db
      .update(documents)
      .set({
        status: "pending",
        ocrStatus: "failed",
        ocrError:
          "OCR supports images (PNG/JPG/WEBP) and plain text only in this free pipeline.",
        updatedAt: new Date(),
      })
      .where(eq(documents.id, id));
    return getDocumentFromDb(id, { includeContent: true });
  }

  await db
    .update(documents)
    .set({
      status: "processing",
      ocrStatus: "processing",
      ocrError: null,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, id));

  const result = await runDocumentOcr({
    mimeType: mime,
    contentBase64: row.contentBase64,
  });

  await db
    .update(documents)
    .set({
      ocrText: result.text || null,
      extractedEntities: result.entities.join("|") || null,
      ocrError: result.error,
      status: result.ok ? "processed" : "failed",
      ocrStatus: result.ok ? "complete" : "failed",
      updatedAt: new Date(),
    })
    .where(eq(documents.id, id));

  if (result.ok) {
    await logDocumentActivity(
      "Document processed",
      `${row.name} OCR complete`,
      row.patientName
    );
  }

  return getDocumentFromDb(id, { includeContent: true });
}
