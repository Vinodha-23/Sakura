import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* -------------------------------------------------------------------------- */
/* Better Auth tables                                                          */
/* -------------------------------------------------------------------------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  role: text("role").default("Attending Physician"),
  department: text("department").default("Internal Medicine"),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)]
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const twoFactor = pgTable("two_factor", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  verified: boolean("verified"),
  failedVerificationCount: integer("failed_verification_count"),
  lockedUntil: timestamp("locked_until"),
});

/* -------------------------------------------------------------------------- */
/* App domain tables (Module 1 dashboard)                                      */
/* -------------------------------------------------------------------------- */

export const patients = pgTable(
  "patients",
  {
    id: text("id").primaryKey(),
    mrn: text("mrn").notNull().unique(),
    name: text("name").notNull(),
    age: integer("age").notNull(),
    gender: text("gender").notNull(),
    dateOfBirth: text("date_of_birth").notNull(),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    bloodType: text("blood_type"),
    department: text("department"),
    assignedDoctorId: text("assigned_doctor_id").references(() => user.id, {
      onDelete: "set null",
    }),
    assignedDoctorName: text("assigned_doctor_name"),
    riskLevel: text("risk_level").notNull().default("none"),
    alertCount: integer("alert_count").notNull().default(0),
    lastVisit: timestamp("last_visit"),
    trustScore: integer("trust_score").notNull().default(80),
    /** Pipe-separated clinical lists from CSV import / Synthea-style exports */
    conditions: text("conditions"),
    medications: text("medications"),
    allergies: text("allergies"),
    insuranceProvider: text("insurance_provider"),
    policyNumber: text("policy_number"),
    /** JSON: { bloodPressure, heartRate, temperature, weight, height, oxygenSaturation, recordedAt } */
    vitals: text("vitals"),
    /** manual | seed | csv_import */
    source: text("source").notNull().default("manual"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("patients_risk_idx").on(t.riskLevel),
    index("patients_mrn_idx").on(t.mrn),
  ]
);

export const clinicalNotes = pgTable(
  "clinical_notes",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    authorId: text("author_id").references(() => user.id, {
      onDelete: "set null",
    }),
    authorName: text("author_name").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("clinical_notes_patient_idx").on(t.patientId)]
);

export const clinicalAlerts = pgTable(
  "clinical_alerts",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    patientName: text("patient_name").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    severity: text("severity").notNull(),
    status: text("status").notNull().default("open"),
    category: text("category"),
    assignedTo: text("assigned_to"),
    recommendedAction: text("recommended_action"),
    source: text("source"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at"),
  },
  (t) => [
    index("alerts_severity_idx").on(t.severity),
    index("alerts_status_idx").on(t.status),
  ]
);

export const activityItems = pgTable("activity_items", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  patientName: text("patient_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const aiInsights = pgTable("ai_insights", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  confidence: integer("confidence").notNull().default(80),
  category: text("category"),
  patientId: text("patient_id").references(() => patients.id, {
    onDelete: "set null",
  }),
  patientName: text("patient_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insuranceClaims = pgTable("insurance_claims", {
  id: text("id").primaryKey(),
  patientId: text("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  patientName: text("patient_name").notNull(),
  claimNumber: text("claim_number").notNull().unique(),
  provider: text("provider").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  approvalProbability: integer("approval_probability").notNull().default(50),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  diagnosis: text("diagnosis"),
  procedure: text("procedure"),
  missingDocuments: text("missing_documents"),
  suggestedCorrections: text("suggested_corrections"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/* Documents & OCR (Module 3)                                                  */
/* -------------------------------------------------------------------------- */

export const documents = pgTable(
  "documents",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    patientName: text("patient_name").notNull(),
    name: text("name").notNull(),
    type: text("type").notNull().default("Clinical Note"),
    status: text("status").notNull().default("pending"),
    ocrStatus: text("ocr_status").notNull().default("processing"),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes").notNull().default(0),
    pages: integer("pages").notNull().default(1),
    version: integer("version").notNull().default(1),
    /** Pipe-separated tags */
    tags: text("tags"),
    /** Pipe-separated extracted entities */
    extractedEntities: text("extracted_entities"),
    ocrText: text("ocr_text"),
    contentBase64: text("content_base64"),
    ocrError: text("ocr_error"),
    uploadedBy: text("uploaded_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("documents_patient_idx").on(t.patientId),
    index("documents_status_idx").on(t.status),
  ]
);

/* -------------------------------------------------------------------------- */
/* Notifications, org settings, roles, API keys                                */
/* -------------------------------------------------------------------------- */

export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    message: text("message").notNull(),
    type: text("type").notNull().default("info"),
    read: boolean("read").notNull().default(false),
    archived: boolean("archived").notNull().default(false),
    link: text("link"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("notifications_user_idx").on(t.userId),
    index("notifications_read_idx").on(t.read),
  ]
);

/** Singleton hospital profile (id = "default") */
export const organizationSettings = pgTable("organization_settings", {
  id: text("id").primaryKey(),
  hospitalName: text("hospital_name").notNull().default("Memorial Hospital System"),
  department: text("department").notNull().default("Internal Medicine"),
  address: text("address"),
  phone: text("phone"),
  npiNumber: text("npi_number"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const appRoles = pgTable("app_roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  permissions: text("permissions").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    keyPrefix: text("key_prefix").notNull(),
    keyHash: text("key_hash").notNull(),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    lastUsedAt: timestamp("last_used_at"),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("api_keys_prefix_idx").on(t.keyPrefix)]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    action: text("action").notNull(),
    userName: text("user_name").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    type: text("type").notNull().default("access"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("audit_logs_created_idx").on(t.createdAt)]
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  notifications: many(notifications),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const schema = {
  user,
  session,
  account,
  verification,
  twoFactor,
  patients,
  clinicalNotes,
  clinicalAlerts,
  activityItems,
  aiInsights,
  insuranceClaims,
  documents,
  notifications,
  organizationSettings,
  appRoles,
  apiKeys,
  auditLogs,
};
