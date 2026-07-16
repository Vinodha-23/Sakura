import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { auth } from "../src/lib/auth";
import { db } from "../src/db";
import {
  patients,
  clinicalAlerts,
  clinicalNotes,
  activityItems,
  aiInsights,
  insuranceClaims,
  documents,
  notifications,
  organizationSettings,
  apiKeys,
  auditLogs,
  user,
} from "../src/db/schema";
import { extractClinicalEntities } from "../src/lib/nvidia-ocr";
import { ensureDefaultRoles } from "../src/lib/settings";

// Demo credentials are configurable via env so a public clone can set its own.
// Safe defaults keep the out-of-the-box demo usable.
const DEMO_EMAIL =
  process.env.SEED_DEMO_EMAIL || "sarah.chen@memorial-hospital.org";
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || "SakuraDemo2026!";

async function ensureDemoUser() {
  const existing = await db.select().from(user).where(eq(user.email, DEMO_EMAIL)).limit(1);
  if (existing.length > 0) {
    console.log("Demo user already exists:", DEMO_EMAIL);
    return existing[0];
  }

  const result = await auth.api.signUpEmail({
    body: {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      name: "Dr. Sarah Chen",
    },
  });

  if (!result?.user) {
    throw new Error("Failed to create demo user via Better Auth");
  }

  await db
    .update(user)
    .set({
      role: "Attending Physician",
      department: "Internal Medicine",
      emailVerified: true,
    })
    .where(eq(user.id, result.user.id));

  console.log("Created demo user:", DEMO_EMAIL);
  return result.user;
}

async function seedClinicalData(doctorId: string) {
  const patientRows = [
    {
      id: "p1",
      mrn: "MRN-2024-0847",
      name: "James Mitchell",
      age: 67,
      gender: "Male",
      dateOfBirth: "1958-03-15",
      phone: "(555) 234-8901",
      email: "j.mitchell@email.com",
      address: "42 Oak Street, Boston, MA",
      bloodType: "A+",
      department: "Cardiology",
      assignedDoctorId: doctorId,
      assignedDoctorName: "Dr. Sarah Chen",
      riskLevel: "critical",
      alertCount: 4,
      lastVisit: new Date("2026-07-10T09:30:00"),
      trustScore: 72,
      conditions: "Atrial Fibrillation|Type 2 Diabetes|CKD Stage 3",
      medications: "Warfarin 5mg|Metformin 1000mg|Lisinopril 20mg|Aspirin 81mg",
      allergies: "Penicillin|Sulfa drugs",
      insuranceProvider: "BlueCross BlueShield",
      policyNumber: "BCB-8847291",
      vitals: JSON.stringify({
        bloodPressure: "142/88",
        heartRate: 78,
        temperature: 98.4,
        weight: 185,
        height: 70,
        oxygenSaturation: 96,
        recordedAt: "2026-07-10T09:30:00",
      }),
      source: "seed",
    },
    {
      id: "p2",
      mrn: "MRN-2024-1203",
      name: "Maria Rodriguez",
      age: 45,
      gender: "Female",
      dateOfBirth: "1981-07-22",
      phone: "(555) 876-5432",
      email: "m.rodriguez@email.com",
      department: "Oncology",
      assignedDoctorId: doctorId,
      assignedDoctorName: "Dr. Sarah Chen",
      riskLevel: "high",
      alertCount: 2,
      lastVisit: new Date("2026-07-11T14:00:00"),
      trustScore: 85,
      conditions: "Breast Cancer|Anemia",
      medications: "Paclitaxel|Doxorubicin|Ondansetron",
      allergies: "Latex",
      insuranceProvider: "Aetna",
      policyNumber: "AET-5521983",
      vitals: JSON.stringify({
        bloodPressure: "118/76",
        heartRate: 72,
        temperature: 98.1,
        weight: 142,
        height: 64,
        oxygenSaturation: 98,
        recordedAt: "2026-07-11T14:00:00",
      }),
      source: "seed",
    },
    {
      id: "p3",
      mrn: "MRN-2024-0562",
      name: "Robert Kim",
      age: 52,
      gender: "Male",
      dateOfBirth: "1974-11-30",
      phone: "(555) 345-6789",
      email: "r.kim@email.com",
      department: "Pulmonology",
      assignedDoctorId: doctorId,
      assignedDoctorName: "Dr. Sarah Chen",
      riskLevel: "medium",
      alertCount: 1,
      lastVisit: new Date("2026-07-08T10:15:00"),
      trustScore: 91,
      conditions: "COPD|Hypertension",
      medications: "Albuterol|Tiotropium|Amlodipine 5mg",
      allergies: "",
      vitals: JSON.stringify({
        bloodPressure: "128/82",
        heartRate: 68,
        temperature: 97.9,
        weight: 175,
        height: 68,
        oxygenSaturation: 94,
        recordedAt: "2026-07-08T10:15:00",
      }),
      source: "seed",
    },
    {
      id: "p4",
      mrn: "MRN-2024-1891",
      name: "Emily Watson",
      age: 34,
      gender: "Female",
      dateOfBirth: "1992-04-18",
      phone: "(555) 567-1234",
      email: "e.watson@email.com",
      department: "General Practice",
      assignedDoctorId: doctorId,
      assignedDoctorName: "Dr. Sarah Chen",
      riskLevel: "low",
      alertCount: 0,
      lastVisit: new Date("2026-07-05T11:00:00"),
      trustScore: 96,
      conditions: "Seasonal allergies",
      medications: "Loratadine 10mg",
      allergies: "Shellfish",
      vitals: JSON.stringify({
        bloodPressure: "112/70",
        heartRate: 65,
        temperature: 98.2,
        weight: 128,
        height: 66,
        oxygenSaturation: 99,
        recordedAt: "2026-07-05T11:00:00",
      }),
      source: "seed",
    },
    {
      id: "p5",
      mrn: "MRN-2024-2234",
      name: "William Thompson",
      age: 78,
      gender: "Male",
      dateOfBirth: "1948-09-05",
      phone: "(555) 789-0123",
      email: "w.thompson@email.com",
      department: "Geriatrics",
      assignedDoctorId: doctorId,
      assignedDoctorName: "Dr. Sarah Chen",
      riskLevel: "high",
      alertCount: 3,
      lastVisit: new Date("2026-07-12T08:45:00"),
      trustScore: 68,
      conditions: "Dementia|Heart Failure|Osteoporosis",
      medications: "Donepezil 10mg|Furosemide 40mg|Alendronate",
      allergies: "Codeine",
      insuranceProvider: "Medicare",
      policyNumber: "MED-4410298",
      vitals: JSON.stringify({
        bloodPressure: "138/84",
        heartRate: 82,
        temperature: 97.8,
        weight: 160,
        height: 69,
        oxygenSaturation: 93,
        recordedAt: "2026-07-12T08:45:00",
      }),
      source: "seed",
    },
    {
      id: "p6",
      mrn: "MRN-2024-3012",
      name: "Aisha Patel",
      age: 29,
      gender: "Female",
      dateOfBirth: "1997-01-28",
      phone: "(555) 901-2345",
      email: "a.patel@email.com",
      department: "General Practice",
      assignedDoctorId: doctorId,
      assignedDoctorName: "Dr. Sarah Chen",
      riskLevel: "none",
      alertCount: 0,
      lastVisit: new Date("2026-06-28T15:30:00"),
      trustScore: 98,
      conditions: "",
      medications: "",
      allergies: "",
      vitals: JSON.stringify({
        bloodPressure: "110/68",
        heartRate: 62,
        temperature: 98.0,
        weight: 125,
        height: 63,
        oxygenSaturation: 99,
        recordedAt: "2026-06-28T15:30:00",
      }),
      source: "seed",
    },
  ];

  await db.delete(clinicalNotes);
  await db.delete(clinicalAlerts);
  await db.delete(activityItems);
  await db.delete(aiInsights);
  await db.delete(insuranceClaims);
  await db.delete(documents);
  await db.delete(notifications);
  await db.delete(apiKeys);
  await db.delete(auditLogs);
  await db.delete(patients);

  await db.insert(patients).values(patientRows);

  await db.insert(clinicalNotes).values([
    {
      id: "note-p1-1",
      patientId: "p1",
      authorId: doctorId,
      authorName: "Dr. Sarah Chen",
      content:
        "Follow-up for atrial fibrillation. INR 2.8. Continue Warfarin 5mg daily. Patient reports mild bruising — reinforce bleeding precautions given concurrent aspirin.",
      createdAt: new Date("2026-07-10T10:00:00"),
    },
  ]);

  await db.insert(clinicalAlerts).values([
    {
      id: "a1",
      patientId: "p1",
      patientName: "James Mitchell",
      title: "Warfarin-Aspirin Interaction Detected",
      description:
        "Concurrent use of Warfarin and Aspirin significantly increases bleeding risk.",
      severity: "critical",
      status: "open",
      category: "Medication Safety",
      recommendedAction:
        "Review anticoagulation regimen. Schedule INR test within 48 hours.",
      source: "AI Medication Analysis",
      createdAt: new Date("2026-07-12T08:15:00"),
    },
    {
      id: "a2",
      patientId: "p5",
      patientName: "William Thompson",
      title: "Fall Risk Alert",
      description: "Multiple fall incidents with dementia diagnosis.",
      severity: "critical",
      status: "open",
      category: "Safety",
      recommendedAction: "Implement fall prevention protocol.",
      source: "Clinical Notes Analysis",
      createdAt: new Date("2026-07-11T11:00:00"),
    },
    {
      id: "a3",
      patientId: "p1",
      patientName: "James Mitchell",
      title: "Elevated Blood Pressure Reading",
      description: "Latest BP reading 142/88 exceeds CKD target.",
      severity: "high",
      status: "assigned",
      category: "Vitals",
      assignedTo: "Dr. Sarah Chen",
      recommendedAction: "Adjust antihypertensive therapy.",
      source: "Vital Signs Monitor",
      createdAt: new Date("2026-07-10T09:45:00"),
    },
    {
      id: "a4",
      patientId: "p2",
      patientName: "Maria Rodriguez",
      title: "Lab Result Anomaly",
      description: "Hemoglobin dropped to 9.2 g/dL from 11.5 g/dL.",
      severity: "medium",
      status: "assigned",
      category: "Laboratory",
      assignedTo: "Dr. Sarah Chen",
      recommendedAction: "Order iron studies.",
      source: "Lab Integration",
      createdAt: new Date("2026-07-11T16:00:00"),
    },
  ]);

  await db.insert(activityItems).values([
    {
      id: randomUUID(),
      type: "alert",
      title: "Critical alert generated",
      description: "Warfarin-Aspirin interaction for James Mitchell",
      patientName: "James Mitchell",
      createdAt: new Date("2026-07-12T08:15:00"),
    },
    {
      id: randomUUID(),
      type: "document",
      title: "Document processed",
      description: "Geriatric Assessment OCR complete",
      patientName: "William Thompson",
      createdAt: new Date("2026-07-12T08:30:00"),
    },
    {
      id: randomUUID(),
      type: "ai",
      title: "AI analysis completed",
      description: "Clinical consistency report generated",
      patientName: "James Mitchell",
      createdAt: new Date("2026-07-12T07:45:00"),
    },
    {
      id: randomUUID(),
      type: "patient",
      title: "Patient checked in",
      description: "William Thompson arrived for geriatric follow-up",
      patientName: "William Thompson",
      createdAt: new Date("2026-07-12T08:00:00"),
    },
  ]);

  await db.insert(aiInsights).values([
    {
      id: randomUUID(),
      title: "Medication Interaction Pattern",
      description:
        "Patients on concurrent anticoagulant and antiplatelet therapy need review.",
      confidence: 94,
      category: "Medication Safety",
      patientId: "p1",
      patientName: "James Mitchell",
    },
    {
      id: randomUUID(),
      title: "Rising CKD Progression",
      description:
        "James Mitchell's eGFR declined recently. Consider nephrology referral.",
      confidence: 87,
      category: "Clinical Trend",
      patientId: "p1",
      patientName: "James Mitchell",
    },
    {
      id: randomUUID(),
      title: "Anemia Trend Detected",
      description: "Maria Rodriguez shows progressive anemia likely treatment-related.",
      confidence: 91,
      category: "Laboratory",
      patientId: "p2",
      patientName: "Maria Rodriguez",
    },
  ]);

  await db.insert(insuranceClaims).values([
    {
      id: "c1",
      patientId: "p1",
      patientName: "James Mitchell",
      claimNumber: "CLM-2026-44821",
      provider: "BlueCross BlueShield",
      amount: "12450.00",
      status: "pending",
      approvalProbability: 78,
      submittedAt: new Date("2026-07-08"),
      diagnosis: "I48.91 - Atrial Fibrillation",
      procedure: "Cardiac catheterization",
      missingDocuments: "Prior authorization form",
      suggestedCorrections: "Attach cardiology referral letter",
    },
    {
      id: "c2",
      patientId: "p2",
      patientName: "Maria Rodriguez",
      claimNumber: "CLM-2026-44835",
      provider: "Aetna",
      amount: "28750.00",
      status: "review",
      approvalProbability: 65,
      submittedAt: new Date("2026-07-05"),
      diagnosis: "C50.912 - Breast cancer",
      procedure: "Chemotherapy cycle 4",
      missingDocuments: "Treatment plan|Pathology report",
      suggestedCorrections: "Update ICD-10 code to C50.912",
    },
    {
      id: "c4",
      patientId: "p5",
      patientName: "William Thompson",
      claimNumber: "CLM-2026-44850",
      provider: "Medicare",
      amount: "8900.00",
      status: "rejected",
      approvalProbability: 32,
      submittedAt: new Date("2026-07-01"),
      diagnosis: "F03.90 - Dementia",
      procedure: "Geriatric evaluation",
      missingDocuments: "Cognitive assessment|Care plan documentation",
      suggestedCorrections: "Resubmit with MMSE scores|Include geriatric care plan",
    },
  ]);

  const seedDocTexts: {
    id: string;
    patientId: string;
    patientName: string;
    name: string;
    type: string;
    tags: string;
    text: string;
    createdAt: Date;
  }[] = [
    {
      id: "d1",
      patientId: "p1",
      patientName: "James Mitchell",
      name: "Cardiology Consultation Report",
      type: "Consultation",
      tags: "cardiology|afib",
      text: `Cardiology Consultation
Patient: James Mitchell
Diagnosis: Atrial Fibrillation
Medications: Warfarin 5mg daily, Aspirin 81mg
Labs: INR 2.8, Creatinine 1.8, eGFR 42, HbA1c 7.2%
Plan: Continue anticoagulation and cardiology follow-up.`,
      createdAt: new Date("2026-07-10T10:00:00"),
    },
    {
      id: "d2",
      patientId: "p1",
      patientName: "James Mitchell",
      name: "Lab Results - Comprehensive Panel",
      type: "Laboratory",
      tags: "labs|blood work",
      text: `Comprehensive Metabolic Panel
Creatinine 1.8 mg/dL
eGFR 42
HbA1c 7.2%
Type 2 Diabetes and CKD Stage 3 noted.`,
      createdAt: new Date("2026-07-09T14:30:00"),
    },
    {
      id: "d3",
      patientId: "p2",
      patientName: "Maria Rodriguez",
      name: "Oncology Treatment Plan",
      type: "Treatment Plan",
      tags: "oncology|treatment",
      text: `Oncology Treatment Plan
Diagnosis: Stage II breast cancer
Therapy: Tamoxifen, prior Lumpectomy
Monitor for treatment-related anemia during chemotherapy.`,
      createdAt: new Date("2026-07-11T09:00:00"),
    },
    {
      id: "d5",
      patientId: "p5",
      patientName: "William Thompson",
      name: "Geriatric Assessment",
      type: "Assessment",
      tags: "geriatric|cognitive",
      text: `Geriatric Assessment
MMSE 18/30
Fall risk: High
Clinical impression: Dementia
Care plan: cognitive support and fall precautions.`,
      createdAt: new Date("2026-07-12T08:00:00"),
    },
  ];

  await db.insert(documents).values(
    seedDocTexts.map((d) => {
      const entities = extractClinicalEntities(d.text);
      const contentBase64 = Buffer.from(d.text, "utf8").toString("base64");
      return {
        id: d.id,
        patientId: d.patientId,
        patientName: d.patientName,
        name: d.name,
        type: d.type,
        status: "processed",
        ocrStatus: "complete",
        mimeType: "text/plain",
        sizeBytes: Buffer.byteLength(d.text, "utf8"),
        pages: 1,
        version: 1,
        tags: d.tags,
        extractedEntities: entities.join("|") || null,
        ocrText: d.text,
        contentBase64,
        ocrError: null,
        uploadedBy: "seed",
        createdAt: d.createdAt,
        updatedAt: d.createdAt,
      };
    })
  );

  await db
    .insert(organizationSettings)
    .values({
      id: "default",
      hospitalName: "Memorial Hospital System",
      department: "Internal Medicine",
      address: "55 Fruit Street, Boston, MA 02114",
      phone: "(617) 555-0100",
      npiNumber: "1234567890",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: organizationSettings.id,
      set: {
        hospitalName: "Memorial Hospital System",
        department: "Internal Medicine",
        address: "55 Fruit Street, Boston, MA 02114",
        phone: "(617) 555-0100",
        npiNumber: "1234567890",
        updatedAt: new Date(),
      },
    });

  await ensureDefaultRoles();

  await db.insert(notifications).values([
    {
      id: randomUUID(),
      userId: doctorId,
      title: "Critical Medication Alert",
      message: "Warfarin-Aspirin interaction detected for James Mitchell",
      type: "alert",
      read: false,
      archived: false,
      link: "/clinical-alerts/a1",
      createdAt: new Date("2026-07-12T08:15:00"),
    },
    {
      id: randomUUID(),
      userId: doctorId,
      title: "Document Processing Complete",
      message: "Geriatric Assessment for William Thompson is ready for review",
      type: "success",
      read: false,
      archived: false,
      link: "/documents/d5",
      createdAt: new Date("2026-07-12T08:30:00"),
    },
    {
      id: randomUUID(),
      userId: doctorId,
      title: "Claim Rejected",
      message: "Medicare claim CLM-2026-44850 requires additional documentation",
      type: "warning",
      read: false,
      archived: false,
      link: "/insurance/c4",
      createdAt: new Date("2026-07-11T16:00:00"),
    },
    {
      id: randomUUID(),
      userId: doctorId,
      title: "AI Report Ready",
      message: "Clinical consistency analysis completed for 3 patients",
      type: "info",
      read: true,
      archived: false,
      link: "/ai-assistant",
      createdAt: new Date("2026-07-11T09:00:00"),
    },
  ]);

  console.log(
    "Seeded patients, alerts, activity, insights, claims, documents, notifications, and org settings."
  );
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Set it in .env.local");
  }

  const doctor = await ensureDemoUser();
  await seedClinicalData(doctor.id);

  console.log("\n--- Demo credentials ---");
  console.log(`Email:    ${DEMO_EMAIL}`);
  console.log(`Password: ${DEMO_PASSWORD}`);
  console.log("2FA:      Optional — enable from Profile → Security (TOTP app)");
  console.log("------------------------\n");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
