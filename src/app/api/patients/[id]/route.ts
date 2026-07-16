import { NextResponse } from "next/server";
import {
  deletePatientFromDb,
  getPatientFromDb,
  updatePatient,
  type PatientVitals,
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
  return NextResponse.json({ patient });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const listField = (value: unknown): string[] | undefined => {
    if (value === undefined) return undefined;
    if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
    if (typeof value === "string") {
      return value
        .split(/[|,]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return undefined;
  };

  let vitals: PatientVitals | null | undefined;
  if (body.vitals === null) vitals = null;
  else if (body.vitals && typeof body.vitals === "object") {
    vitals = {
      bloodPressure: String(body.vitals.bloodPressure || ""),
      heartRate:
        body.vitals.heartRate === "" || body.vitals.heartRate == null
          ? null
          : Number(body.vitals.heartRate),
      temperature:
        body.vitals.temperature === "" || body.vitals.temperature == null
          ? null
          : Number(body.vitals.temperature),
      weight:
        body.vitals.weight === "" || body.vitals.weight == null
          ? null
          : Number(body.vitals.weight),
      height:
        body.vitals.height === "" || body.vitals.height == null
          ? null
          : Number(body.vitals.height),
      oxygenSaturation:
        body.vitals.oxygenSaturation === "" || body.vitals.oxygenSaturation == null
          ? null
          : Number(body.vitals.oxygenSaturation),
      recordedAt: String(body.vitals.recordedAt || new Date().toISOString()),
    };
  }

  const patient = await updatePatient(id, {
    name: body.name !== undefined ? String(body.name) : undefined,
    dateOfBirth: body.dateOfBirth !== undefined ? String(body.dateOfBirth) : undefined,
    gender: body.gender !== undefined ? String(body.gender) : undefined,
    phone: body.phone !== undefined ? String(body.phone) : undefined,
    email: body.email !== undefined ? String(body.email) : undefined,
    address: body.address !== undefined ? String(body.address) : undefined,
    bloodType: body.bloodType !== undefined ? String(body.bloodType) : undefined,
    department: body.department !== undefined ? String(body.department) : undefined,
    riskLevel: body.riskLevel !== undefined ? String(body.riskLevel) : undefined,
    insuranceProvider:
      body.insuranceProvider !== undefined ? String(body.insuranceProvider) : undefined,
    policyNumber: body.policyNumber !== undefined ? String(body.policyNumber) : undefined,
    conditions: listField(body.conditions),
    medications: listField(body.medications),
    allergies: listField(body.allergies),
    vitals,
  });

  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  return NextResponse.json({ patient });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getPatientFromDb(id);
  if (!existing) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  await deletePatientFromDb(id);
  return NextResponse.json({ ok: true });
}
