import type {
  Patient,
  ClinicalAlert,
  Document,
  InsuranceClaim,
  ActivityItem,
  AIInsight,
  Notification,
  TimelineEvent,
  GraphNode,
  GraphEdge,
  User,
} from "@/lib/types";

export const currentUser: User = {
  id: "u1",
  name: "Dr. Sarah Chen",
  email: "sarah.chen@memorial-hospital.org",
  role: "Attending Physician",
  department: "Internal Medicine",
};

export const patients: Patient[] = [
  {
    id: "p1",
    mrn: "MRN-2024-0847",
    name: "James Mitchell",
    age: 67,
    gender: "Male",
    dateOfBirth: "1958-03-15",
    phone: "(555) 234-8901",
    email: "j.mitchell@email.com",
    address: "1247 Oak Street, Boston, MA 02108",
    bloodType: "A+",
    riskLevel: "critical",
    alertCount: 4,
    lastVisit: "2026-07-10",
    assignedDoctor: "Dr. Sarah Chen",
    department: "Cardiology",
    trustScore: 72,
    conditions: ["Atrial Fibrillation", "Type 2 Diabetes", "Hypertension", "CKD Stage 3"],
    medications: [
      { id: "m1", name: "Warfarin", dosage: "5mg", frequency: "Daily", prescribedBy: "Dr. Chen", startDate: "2024-01-15", riskFlag: true, interactions: ["Aspirin"] },
      { id: "m2", name: "Metformin", dosage: "1000mg", frequency: "Twice daily", prescribedBy: "Dr. Chen", startDate: "2023-06-20" },
      { id: "m3", name: "Lisinopril", dosage: "20mg", frequency: "Daily", prescribedBy: "Dr. Patel", startDate: "2022-11-08" },
      { id: "m4", name: "Aspirin", dosage: "81mg", frequency: "Daily", prescribedBy: "Dr. Chen", startDate: "2024-03-01", riskFlag: true, interactions: ["Warfarin"] },
    ],
    allergies: ["Penicillin", "Sulfa drugs"],
    vitals: { bloodPressure: "142/88", heartRate: 78, temperature: 98.4, weight: 185, height: 70, oxygenSaturation: 96, recordedAt: "2026-07-10T09:30:00" },
    insuranceProvider: "BlueCross BlueShield",
    policyNumber: "BCB-8847291",
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
    address: "892 Maple Ave, Cambridge, MA 02139",
    bloodType: "O-",
    riskLevel: "high",
    alertCount: 2,
    lastVisit: "2026-07-11",
    assignedDoctor: "Dr. James Park",
    department: "Oncology",
    trustScore: 85,
    conditions: ["Breast Cancer Stage II", "Anemia"],
    medications: [
      { id: "m5", name: "Tamoxifen", dosage: "20mg", frequency: "Daily", prescribedBy: "Dr. Park", startDate: "2025-09-01" },
      { id: "m6", name: "Ferrous Sulfate", dosage: "325mg", frequency: "Daily", prescribedBy: "Dr. Park", startDate: "2025-10-15" },
    ],
    allergies: ["Latex"],
    vitals: { bloodPressure: "118/76", heartRate: 72, temperature: 98.1, weight: 142, height: 64, oxygenSaturation: 98, recordedAt: "2026-07-11T14:00:00" },
    insuranceProvider: "Aetna",
    policyNumber: "AET-3392018",
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
    address: "456 Pine Road, Somerville, MA 02143",
    bloodType: "B+",
    riskLevel: "medium",
    alertCount: 1,
    lastVisit: "2026-07-08",
    assignedDoctor: "Dr. Sarah Chen",
    department: "Pulmonology",
    trustScore: 91,
    conditions: ["COPD", "Sleep Apnea"],
    medications: [
      { id: "m7", name: "Albuterol", dosage: "90mcg", frequency: "As needed", prescribedBy: "Dr. Chen", startDate: "2023-02-10" },
      { id: "m8", name: "Tiotropium", dosage: "18mcg", frequency: "Daily", prescribedBy: "Dr. Chen", startDate: "2023-02-10" },
    ],
    allergies: [],
    vitals: { bloodPressure: "128/82", heartRate: 68, temperature: 97.9, weight: 175, height: 68, oxygenSaturation: 94, recordedAt: "2026-07-08T10:15:00" },
    insuranceProvider: "UnitedHealthcare",
    policyNumber: "UHC-7721045",
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
    address: "2100 Beacon St, Brookline, MA 02445",
    bloodType: "AB+",
    riskLevel: "low",
    alertCount: 0,
    lastVisit: "2026-07-05",
    assignedDoctor: "Dr. Lisa Nguyen",
    department: "General Practice",
    trustScore: 96,
    conditions: ["Migraine", "Vitamin D Deficiency"],
    medications: [
      { id: "m9", name: "Sumatriptan", dosage: "50mg", frequency: "As needed", prescribedBy: "Dr. Nguyen", startDate: "2025-01-20" },
    ],
    allergies: ["Codeine"],
    vitals: { bloodPressure: "112/70", heartRate: 65, temperature: 98.2, weight: 128, height: 66, oxygenSaturation: 99, recordedAt: "2026-07-05T11:00:00" },
    insuranceProvider: "Cigna",
    policyNumber: "CIG-5519023",
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
    address: "78 Elder Lane, Newton, MA 02458",
    bloodType: "O+",
    riskLevel: "high",
    alertCount: 3,
    lastVisit: "2026-07-12",
    assignedDoctor: "Dr. James Park",
    department: "Geriatrics",
    trustScore: 68,
    conditions: ["Dementia", "Osteoporosis", "Heart Failure", "Polypharmacy"],
    medications: [
      { id: "m10", name: "Donepezil", dosage: "10mg", frequency: "Daily", prescribedBy: "Dr. Park", startDate: "2024-06-01" },
      { id: "m11", name: "Furosemide", dosage: "40mg", frequency: "Daily", prescribedBy: "Dr. Park", startDate: "2023-08-15" },
      { id: "m12", name: "Carvedilol", dosage: "12.5mg", frequency: "Twice daily", prescribedBy: "Dr. Park", startDate: "2023-08-15" },
    ],
    allergies: ["Aspirin", "Ibuprofen"],
    vitals: { bloodPressure: "138/84", heartRate: 82, temperature: 97.8, weight: 160, height: 69, oxygenSaturation: 93, recordedAt: "2026-07-12T08:45:00" },
    insuranceProvider: "Medicare",
    policyNumber: "MED-9981234",
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
    address: "330 Harvard St, Cambridge, MA 02138",
    bloodType: "A-",
    riskLevel: "none",
    alertCount: 0,
    lastVisit: "2026-06-28",
    assignedDoctor: "Dr. Lisa Nguyen",
    department: "General Practice",
    trustScore: 98,
    conditions: [],
    medications: [],
    allergies: [],
    vitals: { bloodPressure: "110/68", heartRate: 62, temperature: 98.0, weight: 125, height: 63, oxygenSaturation: 99, recordedAt: "2026-06-28T15:30:00" },
    insuranceProvider: "Harvard Pilgrim",
    policyNumber: "HP-4412087",
  },
];

export const clinicalAlerts: ClinicalAlert[] = [
  {
    id: "a1",
    patientId: "p1",
    patientName: "James Mitchell",
    title: "Warfarin-Aspirin Interaction Detected",
    description: "Concurrent use of Warfarin and Aspirin significantly increases bleeding risk. INR monitoring required.",
    severity: "critical",
    status: "open",
    category: "Medication Safety",
    createdAt: "2026-07-12T08:15:00",
    recommendedAction: "Review anticoagulation regimen. Consider discontinuing aspirin or adjusting Warfarin dose. Schedule INR test within 48 hours.",
    source: "AI Medication Analysis",
  },
  {
    id: "a2",
    patientId: "p1",
    patientName: "James Mitchell",
    title: "Elevated Blood Pressure Reading",
    description: "Latest BP reading 142/88 mmHg exceeds target for patient with CKD Stage 3.",
    severity: "high",
    status: "assigned",
    category: "Vitals",
    assignedTo: "Dr. Sarah Chen",
    createdAt: "2026-07-10T09:45:00",
    recommendedAction: "Adjust antihypertensive therapy. Target BP < 130/80 for CKD patients.",
    source: "Vital Signs Monitor",
  },
  {
    id: "a3",
    patientId: "p5",
    patientName: "William Thompson",
    title: "Polypharmacy Risk Assessment",
    description: "Patient on 12+ medications with potential drug-drug interactions identified.",
    severity: "high",
    status: "open",
    category: "Medication Safety",
    createdAt: "2026-07-12T07:30:00",
    recommendedAction: "Conduct comprehensive medication review. Deprescribe non-essential medications.",
    source: "AI Clinical Consistency",
  },
  {
    id: "a4",
    patientId: "p2",
    patientName: "Maria Rodriguez",
    title: "Lab Result Anomaly",
    description: "Hemoglobin dropped to 9.2 g/dL from 11.5 g/dL in 3 weeks.",
    severity: "medium",
    status: "assigned",
    category: "Laboratory",
    assignedTo: "Dr. James Park",
    createdAt: "2026-07-11T16:00:00",
    recommendedAction: "Order iron studies and reticulocyte count. Consider transfusion if Hgb < 8.",
    source: "Lab Integration",
  },
  {
    id: "a5",
    patientId: "p3",
    patientName: "Robert Kim",
    title: "Oxygen Saturation Below Threshold",
    description: "SpO2 reading of 94% during routine visit. Below COPD management target.",
    severity: "medium",
    status: "resolved",
    category: "Vitals",
    assignedTo: "Dr. Sarah Chen",
    createdAt: "2026-07-08T10:30:00",
    resolvedAt: "2026-07-08T14:00:00",
    recommendedAction: "Supplemental oxygen assessment completed. Home O2 therapy initiated.",
    source: "Vital Signs Monitor",
  },
  {
    id: "a6",
    patientId: "p5",
    patientName: "William Thompson",
    title: "Fall Risk Alert",
    description: "Multiple fall incidents documented in past 30 days combined with dementia diagnosis.",
    severity: "critical",
    status: "open",
    category: "Safety",
    createdAt: "2026-07-11T11:00:00",
    recommendedAction: "Implement fall prevention protocol. Home safety assessment recommended.",
    source: "Clinical Notes Analysis",
  },
];

export const documents: Document[] = [
  { id: "d1", patientId: "p1", patientName: "James Mitchell", name: "Cardiology Consultation Report", type: "Consultation", status: "processed", uploadedAt: "2026-07-10T10:00:00", size: "2.4 MB", pages: 8, tags: ["cardiology", "afib"], ocrStatus: "complete", extractedEntities: ["Atrial Fibrillation", "Warfarin", "INR 2.8"], version: 1 },
  { id: "d2", patientId: "p1", patientName: "James Mitchell", name: "Lab Results - Comprehensive Panel", type: "Laboratory", status: "processed", uploadedAt: "2026-07-09T14:30:00", size: "1.1 MB", pages: 3, tags: ["labs", "blood work"], ocrStatus: "complete", extractedEntities: ["Creatinine 1.8", "eGFR 42", "HbA1c 7.2%"], version: 1 },
  { id: "d3", patientId: "p2", patientName: "Maria Rodriguez", name: "Oncology Treatment Plan", type: "Treatment Plan", status: "processed", uploadedAt: "2026-07-11T09:00:00", size: "3.8 MB", pages: 12, tags: ["oncology", "treatment"], ocrStatus: "complete", extractedEntities: ["Tamoxifen", "Stage II", "Lumpectomy"], version: 2 },
  { id: "d4", patientId: "p3", patientName: "Robert Kim", name: "Pulmonary Function Test", type: "Diagnostic", status: "processing", uploadedAt: "2026-07-12T11:00:00", size: "890 KB", pages: 5, tags: ["pulmonary", "pft"], ocrStatus: "processing", extractedEntities: [], version: 1 },
  { id: "d5", patientId: "p5", patientName: "William Thompson", name: "Geriatric Assessment", type: "Assessment", status: "processed", uploadedAt: "2026-07-12T08:00:00", size: "1.5 MB", pages: 6, tags: ["geriatric", "cognitive"], ocrStatus: "complete", extractedEntities: ["MMSE 18/30", "Fall risk: High", "Dementia"], version: 1 },
  { id: "d6", patientId: "p4", patientName: "Emily Watson", name: "MRI Brain Report", type: "Imaging", status: "processed", uploadedAt: "2026-07-04T16:00:00", size: "4.2 MB", pages: 4, tags: ["imaging", "neurology"], ocrStatus: "complete", extractedEntities: ["Normal MRI", "No structural abnormalities"], version: 1 },
];

export const insuranceClaims: InsuranceClaim[] = [
  { id: "c1", patientId: "p1", patientName: "James Mitchell", claimNumber: "CLM-2026-44821", provider: "BlueCross BlueShield", amount: 12450, status: "pending", submittedAt: "2026-07-08", approvalProbability: 78, missingDocuments: ["Prior authorization form"], suggestedCorrections: ["Attach cardiology referral letter"], diagnosis: "I48.91 - Atrial Fibrillation", procedure: "Cardiac catheterization" },
  { id: "c2", patientId: "p2", patientName: "Maria Rodriguez", claimNumber: "CLM-2026-44835", provider: "Aetna", amount: 28750, status: "review", submittedAt: "2026-07-05", approvalProbability: 65, missingDocuments: ["Treatment plan", "Pathology report"], suggestedCorrections: ["Update ICD-10 code to C50.912"], diagnosis: "C50.912 - Breast cancer", procedure: "Chemotherapy cycle 4" },
  { id: "c3", patientId: "p3", patientName: "Robert Kim", claimNumber: "CLM-2026-44790", provider: "UnitedHealthcare", amount: 3200, status: "approved", submittedAt: "2026-06-28", approvalProbability: 95, missingDocuments: [], suggestedCorrections: [], diagnosis: "J44.1 - COPD exacerbation", procedure: "Pulmonary rehabilitation" },
  { id: "c4", patientId: "p5", patientName: "William Thompson", claimNumber: "CLM-2026-44850", provider: "Medicare", amount: 8900, status: "rejected", submittedAt: "2026-07-01", approvalProbability: 32, missingDocuments: ["Cognitive assessment", "Care plan documentation"], suggestedCorrections: ["Resubmit with MMSE scores", "Include geriatric care plan"], diagnosis: "F03.90 - Dementia", procedure: "Geriatric evaluation" },
  { id: "c5", patientId: "p4", patientName: "Emily Watson", claimNumber: "CLM-2026-44765", provider: "Cigna", amount: 4500, status: "approved", submittedAt: "2026-06-25", approvalProbability: 92, missingDocuments: [], suggestedCorrections: [], diagnosis: "G43.909 - Migraine", procedure: "MRI Brain" },
];

export const recentActivity: ActivityItem[] = [
  { id: "act1", type: "alert", title: "Critical alert generated", description: "Warfarin-Aspirin interaction for James Mitchell", timestamp: "2026-07-12T08:15:00", patientName: "James Mitchell" },
  { id: "act2", type: "document", title: "Document processed", description: "Geriatric Assessment OCR complete", timestamp: "2026-07-12T08:30:00", patientName: "William Thompson" },
  { id: "act3", type: "ai", title: "AI analysis completed", description: "Clinical consistency report generated", timestamp: "2026-07-12T07:45:00", patientName: "James Mitchell" },
  { id: "act4", type: "insurance", title: "Claim submitted", description: "Cardiac catheterization claim pending review", timestamp: "2026-07-08T14:00:00", patientName: "James Mitchell" },
  { id: "act5", type: "patient", title: "Patient checked in", description: "William Thompson arrived for geriatric follow-up", timestamp: "2026-07-12T08:00:00", patientName: "William Thompson" },
];

export const aiInsights: AIInsight[] = [
  { id: "ai1", title: "Medication Interaction Pattern", description: "3 patients in your panel have concurrent anticoagulant and antiplatelet therapy", confidence: 94, category: "Medication Safety", patientId: "p1", patientName: "James Mitchell" },
  { id: "ai2", title: "Rising CKD Progression", description: "James Mitchell's eGFR declined 8% over 6 months. Consider nephrology referral.", confidence: 87, category: "Clinical Trend", patientId: "p1", patientName: "James Mitchell" },
  { id: "ai3", title: "Anemia Trend Detected", description: "Maria Rodriguez shows progressive anemia likely treatment-related", confidence: 91, category: "Laboratory", patientId: "p2", patientName: "Maria Rodriguez" },
  { id: "ai4", title: "Insurance Approval Optimization", description: "2 pending claims could improve approval rate with documentation updates", confidence: 82, category: "Insurance" },
];

export const notifications: Notification[] = [
  { id: "n1", title: "Critical Medication Alert", message: "Warfarin-Aspirin interaction detected for James Mitchell", type: "alert", read: false, archived: false, timestamp: "2026-07-12T08:15:00", link: "/clinical-alerts/a1" },
  { id: "n2", title: "Document Processing Complete", message: "Geriatric Assessment for William Thompson is ready for review", type: "success", read: false, archived: false, timestamp: "2026-07-12T08:30:00", link: "/documents/d5" },
  { id: "n3", title: "Claim Rejected", message: "Medicare claim CLM-2026-44850 requires additional documentation", type: "warning", read: false, archived: false, timestamp: "2026-07-11T16:00:00", link: "/insurance/c4" },
  { id: "n4", title: "AI Report Ready", message: "Clinical consistency analysis completed for 3 patients", type: "info", read: true, archived: false, timestamp: "2026-07-11T09:00:00", link: "/dashboard" },
  { id: "n5", title: "Lab Results Available", message: "New lab results uploaded for Maria Rodriguez", type: "info", read: true, archived: false, timestamp: "2026-07-10T14:00:00", link: "/patients/p2" },
  { id: "n6", title: "Session Reminder", message: "Your scheduled patient review begins in 30 minutes", type: "info", read: true, archived: true, timestamp: "2026-07-09T08:30:00" },
];

export const patientTimeline = (patientId: string): TimelineEvent[] => {
  const timelines: Record<string, TimelineEvent[]> = {
    p1: [
      { id: "t1", date: "2026-07-10T09:30:00", title: "Cardiology Follow-up", description: "BP elevated, medication review conducted", type: "visit", actor: "Dr. Sarah Chen" },
      { id: "t2", date: "2026-07-09T14:30:00", title: "Lab Results Received", description: "Comprehensive metabolic panel - CKD progression noted", type: "lab" },
      { id: "t3", date: "2026-07-08T10:00:00", title: "Insurance Claim Submitted", description: "Cardiac catheterization claim CLM-2026-44821", type: "insurance" },
      { id: "t4", date: "2026-07-01T11:00:00", title: "Medication Adjustment", description: "Warfarin dose increased to 5mg daily", type: "medication", actor: "Dr. Sarah Chen" },
      { id: "t5", date: "2026-06-15T09:00:00", title: "Document Uploaded", description: "Cardiology consultation report added", type: "document" },
    ],
  };
  return timelines[patientId] || [
    { id: "t-default", date: "2026-07-01T10:00:00", title: "Routine Visit", description: "Annual wellness check completed", type: "visit", actor: "Dr. Chen" },
  ];
};

export const graphNodes: GraphNode[] = [
  { id: "patient", label: "James Mitchell", type: "patient" },
  { id: "afib", label: "Atrial Fibrillation", type: "disease" },
  { id: "diabetes", label: "Type 2 Diabetes", type: "disease" },
  { id: "ckd", label: "CKD Stage 3", type: "disease" },
  { id: "warfarin", label: "Warfarin", type: "medication" },
  { id: "aspirin", label: "Aspirin", type: "medication" },
  { id: "metformin", label: "Metformin", type: "medication" },
  { id: "bleeding", label: "Bleeding Risk", type: "symptom" },
  { id: "guideline1", label: "ACC/AHA AFib Guidelines", type: "guideline" },
];

export const graphEdges: GraphEdge[] = [
  { id: "e1", source: "patient", target: "afib", label: "diagnosed with" },
  { id: "e2", source: "patient", target: "diabetes", label: "diagnosed with" },
  { id: "e3", source: "patient", target: "ckd", label: "diagnosed with" },
  { id: "e4", source: "warfarin", target: "afib", label: "treats" },
  { id: "e5", source: "metformin", target: "diabetes", label: "treats" },
  { id: "e6", source: "patient", target: "warfarin", label: "prescribed" },
  { id: "e7", source: "patient", target: "aspirin", label: "prescribed" },
  { id: "e8", source: "warfarin", target: "bleeding", label: "risk of" },
  { id: "e9", source: "aspirin", target: "bleeding", label: "risk of" },
  { id: "e10", source: "guideline1", target: "afib", label: "addresses" },
];

export const dashboardStats = {
  totalPatients: 1247,
  activeAlerts: 23,
  criticalAlerts: 5,
  todayPatients: 18,
  highRiskPatients: 34,
  avgTrustScore: 84,
  pendingClaims: 12,
  documentsProcessed: 156,
  aiAnalysesToday: 47,
};

export const patientTrendData = [
  { month: "Jan", patients: 1100, alerts: 45 },
  { month: "Feb", patients: 1125, alerts: 52 },
  { month: "Mar", patients: 1150, alerts: 48 },
  { month: "Apr", patients: 1175, alerts: 61 },
  { month: "May", patients: 1200, alerts: 55 },
  { month: "Jun", patients: 1225, alerts: 58 },
  { month: "Jul", patients: 1247, alerts: 63 },
];

export const diseaseDistribution = [
  { name: "Cardiovascular", value: 28, color: "#0c8ce9" },
  { name: "Diabetes", value: 22, color: "#36a5f6" },
  { name: "Respiratory", value: 15, color: "#7cc4fb" },
  { name: "Oncology", value: 12, color: "#b9dffd" },
  { name: "Neurological", value: 10, color: "#0159a1" },
  { name: "Other", value: 13, color: "#94a3b8" },
];

export const medicationRiskData = [
  { name: "Interactions", count: 8 },
  { name: "Dosage Issues", count: 3 },
  { name: "Allergies", count: 2 },
  { name: "Duplicates", count: 1 },
];

export function getPatientById(id: string): Patient | undefined {
  return patients.find((p) => p.id === id);
}

export function getAlertById(id: string): ClinicalAlert | undefined {
  return clinicalAlerts.find((a) => a.id === id);
}

export function getDocumentById(id: string): Document | undefined {
  return documents.find((d) => d.id === id);
}

export function getClaimById(id: string): InsuranceClaim | undefined {
  return insuranceClaims.find((c) => c.id === id);
}
