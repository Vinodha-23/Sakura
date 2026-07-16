export type RiskLevel = "critical" | "high" | "medium" | "low" | "none";
export type AlertSeverity = "critical" | "high" | "medium" | "low";
export type AlertStatus = "open" | "assigned" | "resolved";
export type ClaimStatus = "pending" | "approved" | "rejected" | "review";
export type DocumentStatus = "processed" | "processing" | "failed" | "pending";

export interface Patient {
  id: string;
  mrn: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  bloodType: string;
  riskLevel: RiskLevel;
  alertCount: number;
  lastVisit: string;
  assignedDoctor: string;
  department: string;
  trustScore: number;
  conditions: string[];
  medications: Medication[];
  allergies: string[];
  vitals: Vitals;
  insuranceProvider: string;
  policyNumber: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  startDate: string;
  riskFlag?: boolean;
  interactions?: string[];
}

export interface Vitals {
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  weight: number;
  height: number;
  oxygenSaturation: number;
  recordedAt: string;
}

export interface ClinicalAlert {
  id: string;
  patientId: string;
  patientName: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  category: string;
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
  recommendedAction: string;
  source: string;
}

export interface Document {
  id: string;
  patientId: string;
  patientName: string;
  name: string;
  type: string;
  status: DocumentStatus;
  uploadedAt: string;
  size: string;
  pages: number;
  tags: string[];
  ocrStatus: "complete" | "processing" | "failed";
  extractedEntities: string[];
  version: number;
  mimeType?: string;
  ocrText?: string;
  ocrError?: string;
  /** Present on detail responses when file is stored */
  contentBase64?: string;
}

export interface InsuranceClaim {
  id: string;
  patientId: string;
  patientName: string;
  claimNumber: string;
  provider: string;
  amount: number;
  status: ClaimStatus;
  submittedAt: string;
  approvalProbability: number;
  missingDocuments: string[];
  suggestedCorrections: string[];
  diagnosis: string;
  procedure: string;
}

export interface ActivityItem {
  id: string;
  type: "alert" | "document" | "patient" | "insurance" | "ai";
  title: string;
  description: string;
  timestamp: string;
  patientName?: string;
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  confidence: number;
  category: string;
  patientId?: string;
  patientName?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "alert" | "info" | "success" | "warning";
  read: boolean;
  archived: boolean;
  timestamp: string;
  link?: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "visit" | "lab" | "medication" | "alert" | "document" | "insurance";
  actor?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  citations?: Citation[];
  reasoningSteps?: string[];
  trustScore?: number;
  /** data URL for attached clinical image (vision) */
  imagePreview?: string;
  model?: string;
}

export interface Citation {
  id: string;
  source: string;
  excerpt: string;
  page?: number;
  documentId?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: "patient" | "disease" | "medication" | "guideline" | "symptom";
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar?: string;
}
