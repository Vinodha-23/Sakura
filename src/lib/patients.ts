import { randomUUID } from "crypto";
import { and, count, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { clinicalAlerts, clinicalNotes, patients } from "@/db/schema";
import { ageFromDob, parseCsv, splitPipeList } from "@/lib/csv";

export type PatientRecord = typeof patients.$inferSelect;

export type PatientVitals = {
  bloodPressure: string;
  heartRate: number | null;
  temperature: number | null;
  weight: number | null;
  height: number | null;
  oxygenSaturation: number | null;
  recordedAt: string;
};

export type PatientDTO = {
  id: string;
  mrn: string;
  name: string;
  age: number;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  bloodType: string;
  department: string;
  assignedDoctor: string;
  riskLevel: string;
  alertCount: number;
  lastVisit: string;
  trustScore: number;
  conditions: string[];
  medications: string[];
  allergies: string[];
  insuranceProvider: string;
  policyNumber: string;
  source: string;
  vitals: PatientVitals | null;
};

export type ClinicalNoteDTO = {
  id: string;
  patientId: string;
  authorName: string;
  content: string;
  createdAt: string;
};

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseVitals(raw: string | null | undefined): PatientVitals | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      bloodPressure: String(parsed.bloodPressure || ""),
      heartRate: toNullableNumber(parsed.heartRate),
      temperature: toNullableNumber(parsed.temperature),
      weight: toNullableNumber(parsed.weight),
      height: toNullableNumber(parsed.height),
      oxygenSaturation: toNullableNumber(parsed.oxygenSaturation),
      recordedAt: String(parsed.recordedAt || ""),
    };
  } catch {
    return null;
  }
}

export function serializeVitals(vitals: PatientVitals | null | undefined): string | null {
  if (!vitals) return null;
  const hasAny =
    vitals.bloodPressure ||
    vitals.heartRate != null ||
    vitals.temperature != null ||
    vitals.weight != null ||
    vitals.height != null ||
    vitals.oxygenSaturation != null;
  if (!hasAny) return null;
  return JSON.stringify(vitals);
}

const DANGEROUS_PAIRS: { a: string; b: string; title: string; severity: "critical" | "high"; action: string }[] = [
  {
    a: "warfarin",
    b: "aspirin",
    title: "Warfarin–Aspirin Interaction",
    severity: "critical",
    action: "Review anticoagulation. Confirm indication for dual therapy and schedule INR check.",
  },
  {
    a: "warfarin",
    b: "ibuprofen",
    title: "Warfarin–NSAID Bleeding Risk",
    severity: "critical",
    action: "Avoid NSAIDs with warfarin when possible. Prefer acetaminophen after clinical review.",
  },
  {
    a: "clopidogrel",
    b: "aspirin",
    title: "Dual Antiplatelet Therapy Review",
    severity: "high",
    action: "Confirm DAPT duration and bleeding risk. Follow cardiology guidance.",
  },
  {
    a: "alprazolam",
    b: "trazodone",
    title: "Sedative Combination Risk",
    severity: "high",
    action: "Assess fall risk and respiratory depression. Consider deprescribing one agent.",
  },
];

export function toPatientDTO(row: PatientRecord): PatientDTO {
  return {
    id: row.id,
    mrn: row.mrn,
    name: row.name,
    age: row.age,
    gender: row.gender,
    dateOfBirth: row.dateOfBirth,
    phone: row.phone || "",
    email: row.email || "",
    address: row.address || "",
    bloodType: row.bloodType || "",
    department: row.department || "",
    assignedDoctor: row.assignedDoctorName || "Unassigned",
    riskLevel: row.riskLevel,
    alertCount: row.alertCount,
    lastVisit: row.lastVisit ? new Date(row.lastVisit).toISOString().slice(0, 10) : "",
    trustScore: row.trustScore,
    conditions: splitPipeList(row.conditions),
    medications: splitPipeList(row.medications),
    allergies: splitPipeList(row.allergies),
    insuranceProvider: row.insuranceProvider || "",
    policyNumber: row.policyNumber || "",
    source: row.source,
    vitals: parseVitals(row.vitals),
  };
}

export async function listPatientsFromDb() {
  const rows = await db.select().from(patients);
  return rows.map(toPatientDTO);
}

export async function getPatientFromDb(id: string) {
  const rows = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
  if (!rows[0]) return null;
  return toPatientDTO(rows[0]);
}

function get(row: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    if (row[key]?.trim()) return row[key].trim();
  }
  return "";
}

function normalizeRisk(value: string): string {
  const v = value.toLowerCase();
  if (["critical", "high", "medium", "low", "none"].includes(v)) return v;
  return "none";
}

function medNames(medications: string): string[] {
  return splitPipeList(medications).map((m) => m.toLowerCase());
}

async function generateSafetyAlerts(patient: {
  id: string;
  name: string;
  medications: string;
  allergies: string;
}) {
  const meds = medNames(patient.medications);
  const allergies = splitPipeList(patient.allergies).map((a) => a.toLowerCase());
  const created: string[] = [];

  for (const pair of DANGEROUS_PAIRS) {
    const hasA = meds.some((m) => m.includes(pair.a));
    const hasB = meds.some((m) => m.includes(pair.b));
    if (!hasA || !hasB) continue;

    const alertId = `imp-${patient.id}-${pair.a}-${pair.b}`;
    await db
      .insert(clinicalAlerts)
      .values({
        id: alertId,
        patientId: patient.id,
        patientName: patient.name,
        title: pair.title,
        description: `Detected concurrent ${pair.a} and ${pair.b} after CSV import for ${patient.name}.`,
        severity: pair.severity,
        status: "open",
        category: "Medication Safety",
        recommendedAction: pair.action,
        source: "CSV Import · AI Medication Analysis",
        createdAt: new Date(),
      })
      .onConflictDoNothing();
    created.push(alertId);
  }

  // Allergy vs medication name overlap
  for (const allergy of allergies) {
    if (allergy.length < 3) continue;
    const hit = meds.find((m) => m.includes(allergy) || allergy.includes(m.split(" ")[0]));
    if (!hit) continue;
    const alertId = `imp-${patient.id}-allergy-${allergy.replace(/\s+/g, "-")}`;
    await db
      .insert(clinicalAlerts)
      .values({
        id: alertId,
        patientId: patient.id,
        patientName: patient.name,
        title: `Possible Allergy Conflict: ${allergy}`,
        description: `Patient allergy "${allergy}" may conflict with medication list after import.`,
        severity: "high",
        status: "open",
        category: "Allergy Safety",
        recommendedAction: "Verify allergy history and discontinue conflicting medications if confirmed.",
        source: "CSV Import · Clinical Consistency",
        createdAt: new Date(),
      })
      .onConflictDoNothing();
    created.push(alertId);
  }

  return created;
}

async function refreshAlertCount(patientId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(clinicalAlerts)
    .where(
      and(eq(clinicalAlerts.patientId, patientId), ne(clinicalAlerts.status, "resolved"))
    );
  const alertCount = Number(row?.value ?? 0);
  await db
    .update(patients)
    .set({ alertCount, updatedAt: new Date() })
    .where(eq(patients.id, patientId));
  return alertCount;
}

export type ImportResult = {
  imported: number;
  updated: number;
  skipped: number;
  alertsCreated: number;
  errors: string[];
};

export async function importPatientsFromCsv(
  csvText: string,
  options?: { doctorName?: string; doctorId?: string | null }
): Promise<ImportResult> {
  const rows = parseCsv(csvText);
  const result: ImportResult = {
    imported: 0,
    updated: 0,
    skipped: 0,
    alertsCreated: 0,
    errors: [],
  };

  if (rows.length === 0) {
    result.errors.push("No data rows found. Check CSV headers and content.");
    return result;
  }

  for (const [index, row] of rows.entries()) {
    const line = index + 2;
    try {
      const mrn = get(row, "mrn", "patient_id", "id");
      const name = get(row, "name", "patient_name", "full_name");
      const dob = get(row, "date_of_birth", "dob", "birthdate", "birth_date");
      const gender = get(row, "gender", "sex") || "Other";

      if (!mrn || !name || !dob) {
        result.skipped++;
        result.errors.push(`Line ${line}: missing mrn, name, or date_of_birth`);
        continue;
      }

      const medications = get(row, "medications", "meds", "drugs");
      const conditions = get(row, "conditions", "diagnoses");
      const allergies = get(row, "allergies");
      const riskLevel = normalizeRisk(get(row, "risk_level", "risk"));
      const lastVisitRaw = get(row, "last_visit", "lastvisit");
      const trustScore = Number(get(row, "trust_score", "trust") || 80);

      const bp = get(row, "blood_pressure", "bp");
      const hrRaw = get(row, "heart_rate", "hr");
      const tempRaw = get(row, "temperature", "temp");
      const weightRaw = get(row, "weight");
      const heightRaw = get(row, "height");
      const spo2Raw = get(row, "oxygen_saturation", "spo2", "o2_sat");
      const vitalsAt = get(row, "vitals_recorded_at", "vitals_at") || lastVisitRaw;
      const vitalsPayload = serializeVitals({
        bloodPressure: bp,
        heartRate: hrRaw ? Number(hrRaw) : null,
        temperature: tempRaw ? Number(tempRaw) : null,
        weight: weightRaw ? Number(weightRaw) : null,
        height: heightRaw ? Number(heightRaw) : null,
        oxygenSaturation: spo2Raw ? Number(spo2Raw) : null,
        recordedAt: vitalsAt || "",
      });

      const existing = await db
        .select()
        .from(patients)
        .where(eq(patients.mrn, mrn))
        .limit(1);

      const payload = {
        mrn,
        name,
        age: ageFromDob(dob),
        gender,
        dateOfBirth: dob,
        phone: get(row, "phone", "telephone") || null,
        email: get(row, "email") || null,
        address: get(row, "address") || null,
        bloodType: get(row, "blood_type", "bloodtype") || null,
        department: get(row, "department", "dept") || "General Practice",
        assignedDoctorId: options?.doctorId || null,
        assignedDoctorName:
          get(row, "assigned_doctor", "doctor", "provider") ||
          options?.doctorName ||
          "Dr. Sarah Chen",
        riskLevel,
        lastVisit:
          lastVisitRaw && !Number.isNaN(Date.parse(lastVisitRaw))
            ? new Date(lastVisitRaw)
            : null,
        trustScore: Number.isFinite(trustScore) ? Math.min(100, Math.max(0, trustScore)) : 80,
        conditions: conditions || null,
        medications: medications || null,
        allergies: allergies || null,
        insuranceProvider: get(row, "insurance_provider", "insurance") || null,
        policyNumber: get(row, "policy_number", "policy") || null,
        vitals: vitalsPayload,
        source: "csv_import",
        updatedAt: new Date(),
      };

      let patientId: string;
      if (existing[0]) {
        patientId = existing[0].id;
        await db.update(patients).set(payload).where(eq(patients.id, patientId));
        result.updated++;
      } else {
        patientId = randomUUID();
        await db.insert(patients).values({
          id: patientId,
          ...payload,
          alertCount: 0,
          createdAt: new Date(),
        });
        result.imported++;
      }

      const alerts = await generateSafetyAlerts({
        id: patientId,
        name,
        medications,
        allergies,
      });
      result.alertsCreated += alerts.length;
      await refreshAlertCount(patientId);

      // Escalate risk if critical med alerts were generated and risk was low
      if (alerts.length > 0 && (riskLevel === "none" || riskLevel === "low")) {
        await db
          .update(patients)
          .set({ riskLevel: "high", updatedAt: new Date() })
          .where(eq(patients.id, patientId));
      }
    } catch (err) {
      result.skipped++;
      result.errors.push(
        `Line ${line}: ${err instanceof Error ? err.message : "import failed"}`
      );
    }
  }

  return result;
}

export async function createPatient(input: {
  name: string;
  dateOfBirth: string;
  gender: string;
  email?: string;
  phone?: string;
  doctorName?: string;
}) {
  const id = randomUUID();
  const mrn = `MRN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  await db.insert(patients).values({
    id,
    mrn,
    name: input.name,
    age: ageFromDob(input.dateOfBirth),
    gender: input.gender,
    dateOfBirth: input.dateOfBirth,
    email: input.email || null,
    phone: input.phone || null,
    assignedDoctorName: input.doctorName || "Dr. Sarah Chen",
    riskLevel: "none",
    alertCount: 0,
    trustScore: 90,
    source: "manual",
  });
  return getPatientFromDb(id);
}

export async function updatePatient(
  id: string,
  input: {
    name?: string;
    dateOfBirth?: string;
    gender?: string;
    phone?: string;
    email?: string;
    address?: string;
    bloodType?: string;
    department?: string;
    riskLevel?: string;
    insuranceProvider?: string;
    policyNumber?: string;
    conditions?: string[];
    medications?: string[];
    allergies?: string[];
    vitals?: PatientVitals | null;
  }
) {
  const existing = await getPatientFromDb(id);
  if (!existing) return null;

  const patch: Partial<typeof patients.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.dateOfBirth !== undefined) {
    patch.dateOfBirth = input.dateOfBirth;
    patch.age = ageFromDob(input.dateOfBirth);
  }
  if (input.gender !== undefined) patch.gender = input.gender;
  if (input.phone !== undefined) patch.phone = input.phone || null;
  if (input.email !== undefined) patch.email = input.email || null;
  if (input.address !== undefined) patch.address = input.address || null;
  if (input.bloodType !== undefined) patch.bloodType = input.bloodType || null;
  if (input.department !== undefined) patch.department = input.department || null;
  if (input.riskLevel !== undefined) patch.riskLevel = normalizeRisk(input.riskLevel);
  if (input.insuranceProvider !== undefined) {
    patch.insuranceProvider = input.insuranceProvider || null;
  }
  if (input.policyNumber !== undefined) patch.policyNumber = input.policyNumber || null;
  if (input.conditions !== undefined) {
    patch.conditions = input.conditions.length ? input.conditions.join("|") : null;
  }
  if (input.medications !== undefined) {
    patch.medications = input.medications.length ? input.medications.join("|") : null;
  }
  if (input.allergies !== undefined) {
    patch.allergies = input.allergies.length ? input.allergies.join("|") : null;
  }
  if (input.vitals !== undefined) patch.vitals = serializeVitals(input.vitals);

  await db.update(patients).set(patch).where(eq(patients.id, id));

  if (input.medications !== undefined || input.allergies !== undefined) {
    const refreshed = await getPatientFromDb(id);
    if (refreshed) {
      await generateSafetyAlerts({
        id: refreshed.id,
        name: refreshed.name,
        medications: refreshed.medications.join("|"),
        allergies: refreshed.allergies.join("|"),
      });
      await refreshAlertCount(id);
    }
  }

  return getPatientFromDb(id);
}

export async function listClinicalNotes(patientId: string): Promise<ClinicalNoteDTO[]> {
  const rows = await db
    .select()
    .from(clinicalNotes)
    .where(eq(clinicalNotes.patientId, patientId))
    .orderBy(desc(clinicalNotes.createdAt));
  return rows.map((r) => ({
    id: r.id,
    patientId: r.patientId,
    authorName: r.authorName,
    content: r.content,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function createClinicalNote(input: {
  patientId: string;
  authorId?: string | null;
  authorName: string;
  content: string;
}) {
  const content = input.content.trim();
  if (!content) throw new Error("Note content is required");

  const id = randomUUID();
  await db.insert(clinicalNotes).values({
    id,
    patientId: input.patientId,
    authorId: input.authorId || null,
    authorName: input.authorName,
    content,
    createdAt: new Date(),
  });

  const rows = await db.select().from(clinicalNotes).where(eq(clinicalNotes.id, id)).limit(1);
  const row = rows[0];
  return {
    id: row.id,
    patientId: row.patientId,
    authorName: row.authorName,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  } satisfies ClinicalNoteDTO;
}

export async function deletePatientFromDb(id: string) {
  await db.delete(clinicalNotes).where(eq(clinicalNotes.patientId, id));
  await db.delete(clinicalAlerts).where(eq(clinicalAlerts.patientId, id));
  await db.delete(patients).where(eq(patients.id, id));
}
