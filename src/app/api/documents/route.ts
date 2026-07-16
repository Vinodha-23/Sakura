import { NextResponse } from "next/server";
import {
  createDocumentWithOcr,
  listDocumentsFromDb,
  MAX_DOCUMENT_BYTES,
} from "@/lib/documents";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const documents = await listDocumentsFromDb({
    patientId: searchParams.get("patientId") || undefined,
    status: searchParams.get("status") || undefined,
    q: searchParams.get("q") || undefined,
  });

  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const patientId = String(form.get("patientId") || "");
    const name = String(form.get("name") || "");
    const type = String(form.get("type") || "Clinical Note");
    const tagsRaw = String(form.get("tags") || "");

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId is required" },
        { status: 400 }
      );
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      return NextResponse.json(
        {
          error: `File exceeds ${MAX_DOCUMENT_BYTES / (1024 * 1024)} MB limit`,
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const document = await createDocumentWithOcr({
      patientId,
      name: name || file.name || "Untitled document",
      type,
      tags: tagsRaw
        .split(/[,|]/)
        .map((t) => t.trim())
        .filter(Boolean),
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      contentBase64: buffer.toString("base64"),
      uploadedBy: session.user.name,
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
