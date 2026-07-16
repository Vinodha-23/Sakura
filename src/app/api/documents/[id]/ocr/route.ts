import { NextResponse } from "next/server";
import { retryDocumentOcr } from "@/lib/documents";
import { getSession } from "@/lib/session";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const document = await retryDocumentOcr(id);
    if (!document) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ document });
  } catch (err) {
    const message = err instanceof Error ? err.message : "OCR failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
