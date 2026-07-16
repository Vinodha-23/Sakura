import { NextResponse } from "next/server";
import {
  deleteDocument,
  getDocumentFromDb,
  updateDocument,
} from "@/lib/documents";
import { getSession } from "@/lib/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const document = await getDocumentFromDb(id, { includeContent: true });
  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ document });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const document = await updateDocument(id, {
    name: body.name != null ? String(body.name) : undefined,
    type: body.type != null ? String(body.type) : undefined,
    tags: Array.isArray(body.tags)
      ? body.tags.map((t: unknown) => String(t))
      : body.tags != null
        ? String(body.tags)
            .split(/[,|]/)
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined,
  });

  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ document });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const ok = await deleteDocument(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
