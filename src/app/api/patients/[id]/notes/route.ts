import { NextResponse } from "next/server";
import {
  createClinicalNote,
  getPatientFromDb,
  listClinicalNotes,
} from "@/lib/patients";
import { getSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const patient = await getPatientFromDb(id);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const notes = await listClinicalNotes(id);
  return NextResponse.json({ notes });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const patient = await getPatientFromDb(id);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const content = body?.content ? String(body.content) : "";
  if (!content.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  try {
    const note = await createClinicalNote({
      patientId: id,
      authorId: session.user.id,
      authorName: session.user.name || "Clinician",
      content,
    });
    return NextResponse.json({ note }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create note" },
      { status: 400 }
    );
  }
}
