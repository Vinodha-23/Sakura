import { NextResponse } from "next/server";
import { listAlertsFromDb } from "@/lib/alerts";
import { searchDocumentsFromDb } from "@/lib/documents";
import { listClaimsFromDb } from "@/lib/insurance";
import { listPatientsFromDb } from "@/lib/patients";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").toLowerCase().trim();
  if (!q) {
    return NextResponse.json({
      patients: [],
      alerts: [],
      claims: [],
      documents: [],
    });
  }

  const [patients, alerts, claims, documents] = await Promise.all([
    listPatientsFromDb(),
    listAlertsFromDb(),
    listClaimsFromDb(),
    searchDocumentsFromDb(q, 6),
  ]);

  return NextResponse.json({
    patients: patients
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.mrn.toLowerCase().includes(q) ||
          p.conditions.some((c) => c.toLowerCase().includes(q)) ||
          p.medications.some((m) => m.toLowerCase().includes(q))
      )
      .slice(0, 8),
    alerts: alerts
      .filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.patientName.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
      )
      .slice(0, 8)
      .map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        patientName: a.patientName,
        severity: a.severity,
      })),
    claims: claims
      .filter(
        (c) =>
          c.claimNumber.toLowerCase().includes(q) ||
          c.patientName.toLowerCase().includes(q) ||
          c.provider.toLowerCase().includes(q)
      )
      .slice(0, 6),
    documents,
  });
}
