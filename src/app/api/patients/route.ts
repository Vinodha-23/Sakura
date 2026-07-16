import { NextResponse } from "next/server";
import { createPatient, listPatientsFromDb } from "@/lib/patients";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patients = await listPatientsFromDb();
  return NextResponse.json({ patients });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.dateOfBirth || !body?.gender) {
    return NextResponse.json(
      { error: "name, dateOfBirth, and gender are required" },
      { status: 400 }
    );
  }

  const patient = await createPatient({
    name: String(body.name),
    dateOfBirth: String(body.dateOfBirth),
    gender: String(body.gender),
    email: body.email ? String(body.email) : undefined,
    phone: body.phone ? String(body.phone) : undefined,
    doctorName: session.user.name,
  });

  return NextResponse.json({ patient }, { status: 201 });
}
