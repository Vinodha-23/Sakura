"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Pill,
  Bot,
  Upload,
  Network,
  Edit,
  MessageSquare,
  ChevronRight,
  Clock,
  FileText,
  Activity,
  Heart,
  Thermometer,
  Scale,
  Droplets,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, riskBadgeVariant, severityBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Tabs, EmptyState } from "@/components/ui/common";
import { formatDate, formatDateTime, getInitials } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { Document } from "@/lib/types";
import type { ClinicalNoteDTO, PatientDTO, PatientVitals } from "@/lib/patients";
import { PatientClinicalDashboard } from "./patient-clinical-dashboard";

type AlertDTO = {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  recommendedAction: string;
  createdAt: string;
  category: string;
  source: string;
};

type ClaimDTO = {
  id: string;
  claimNumber: string;
  diagnosis: string;
  amount: number;
  status: string;
  approvalProbability: number;
  submittedAt: string;
};

function formatVital(value: string | number | null | undefined, suffix = "") {
  if (value == null || value === "") return "—";
  return `${value}${suffix}`;
}

export function PatientDetailClient({
  patient: initialPatient,
  alerts,
  claims,
}: {
  patient: PatientDTO;
  alerts: AlertDTO[];
  claims: ClaimDTO[];
}) {
  const [patient, setPatient] = useState(initialPatient);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [editOpen, setEditOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [notes, setNotes] = useState<ClinicalNoteDTO[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [patientDocs, setPatientDocs] = useState<Document[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const loadNotes = useCallback(async () => {
    setNotesLoading(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}/notes`);
      const data = await res.json();
      if (res.ok) setNotes(data.notes || []);
    } finally {
      setNotesLoading(false);
    }
  }, [patient.id]);

  const loadDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents?patientId=${patient.id}`);
      const data = await res.json();
      if (res.ok) setPatientDocs(data.documents || []);
    } catch {
      setPatientDocs([]);
    }
  }, [patient.id]);

  useEffect(() => {
    void loadNotes();
    void loadDocuments();
  }, [loadNotes, loadDocuments]);

  const timeline = useMemo(() => {
    const items = [
      patient.lastVisit
        ? {
            id: "visit",
            date: patient.lastVisit,
            title: "Last clinical visit",
            description: `${patient.department || "Clinic"} follow-up`,
            type: "visit",
          }
        : null,
      ...alerts.slice(0, 3).map((a) => ({
        id: a.id,
        date: a.createdAt,
        title: a.title,
        description: a.description,
        type: "alert",
      })),
      ...claims.slice(0, 2).map((c) => ({
        id: c.id,
        date: c.submittedAt || patient.lastVisit || new Date().toISOString(),
        title: `Insurance claim ${c.claimNumber}`,
        description: `Status: ${c.status}`,
        type: "insurance",
      })),
      {
        id: "source",
        date: patient.lastVisit || new Date().toISOString(),
        title:
          patient.source === "csv_import"
            ? "Record imported from CSV"
            : "Patient record created",
        description: "Sakura clinical intelligence panel",
        type: "document",
      },
    ].filter(Boolean) as {
      id: string;
      date: string;
      title: string;
      description: string;
      type: string;
    }[];
    return items;
  }, [patient, alerts, claims]);

  const tabs = [
    { id: "dashboard", label: "Clinical Dashboard" },
    { id: "overview", label: "Overview" },
    { id: "medications", label: "Medications", count: patient.medications.length },
    { id: "alerts", label: "Alerts", count: alerts.length },
    { id: "documents", label: "Documents", count: patientDocs.length },
    { id: "insurance", label: "Insurance", count: claims.length },
    { id: "timeline", label: "Timeline" },
    { id: "notes", label: "Notes", count: notes.length },
  ];

  const vitals = patient.vitals;

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-border bg-white p-6 shadow-card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sakura-100 to-sakura-200 text-xl font-semibold text-sakura-700">
              {getInitials(patient.name)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-slate-900">{patient.name}</h1>
                <Badge variant={riskBadgeVariant(patient.riskLevel as "critical")}>
                  {patient.riskLevel} risk
                </Badge>
                {patient.alertCount > 0 && (
                  <Badge variant="critical">{patient.alertCount} alerts</Badge>
                )}
                <Badge variant="outline">{patient.source.replace("_", " ")}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {patient.mrn} · {patient.age} years · {patient.gender}
                {patient.bloodType ? ` · ${patient.bloodType}` : ""}
              </p>
              <p className="text-sm text-slate-500">
                {patient.department} · {patient.assignedDoctor}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/ai-assistant?patientId=${patient.id}&patient=${encodeURIComponent(patient.name)}`}
            >
              <Button variant="outline" size="sm">
                <Bot className="h-4 w-4" /> AI Assistant
              </Button>
            </Link>
            <Link href={`/documents?patientId=${patient.id}`}>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4" /> Upload
              </Button>
            </Link>
            <Link href={`/knowledge-graph?patientId=${patient.id}`}>
              <Button variant="outline" size="sm">
                <Network className="h-4 w-4" /> Knowledge Graph
              </Button>
            </Link>
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Edit className="h-4 w-4" /> Edit
            </Button>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4 rounded-xl bg-surface-muted p-4">
          <div className="text-center">
            <p className="text-2xl font-semibold text-sakura-600">{patient.trustScore}%</p>
            <p className="text-xs text-slate-500">Trust Score</p>
          </div>
          <div className="flex-1">
            <div className="h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-sakura-500 transition-all"
                style={{ width: `${patient.trustScore}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Synthetic/demo clinical data · safe for public demos (no real PHI)
            </p>
          </div>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === "dashboard" && (
          <PatientClinicalDashboard
            patient={patient}
            alerts={alerts}
            claims={claims}
            documents={patientDocs}
          />
        )}

        {activeTab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="border-sakura-100 bg-gradient-to-br from-sakura-50/50 to-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-sakura-600" />
                    AI Patient Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-slate-700">
                    {patient.name} is a {patient.age}-year-old {patient.gender.toLowerCase()}
                    {patient.conditions.length
                      ? ` with ${patient.conditions.join(", ")}.`
                      : " with no documented chronic conditions."}
                    {patient.medications.length
                      ? ` Current medications: ${patient.medications.join("; ")}.`
                      : ""}
                    {alerts.length
                      ? ` ${alerts.length} clinical alert(s) require review.`
                      : " No active clinical alerts."}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    {[
                      ["Date of Birth", formatDate(patient.dateOfBirth)],
                      ["Phone", patient.phone || "—"],
                      ["Email", patient.email || "—"],
                      ["Address", patient.address || "—"],
                      ["Insurance", patient.insuranceProvider || "—"],
                      ["Policy #", patient.policyNumber || "—"],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-slate-500">{label}</dt>
                        <dd className="mt-0.5 font-medium text-slate-900">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {patient.conditions.length ? (
                      patient.conditions.map((c) => (
                        <Badge key={c} variant="outline">
                          {c}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No conditions documented</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Clinical Consistency Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        check: "Diagnosis–Medication Alignment",
                        status: patient.medications.length && patient.conditions.length ? "pass" : "info",
                        detail: patient.conditions.length
                          ? "Medications reviewed against documented conditions"
                          : "Add conditions to strengthen consistency checks",
                      },
                      {
                        check: "Allergy Cross-Reference",
                        status: patient.allergies.length ? "pass" : "info",
                        detail: patient.allergies.length
                          ? `${patient.allergies.length} allergies on file`
                          : "No known allergies documented",
                      },
                      {
                        check: "Open Safety Alerts",
                        status: alerts.some((a) => a.severity === "critical")
                          ? "warning"
                          : alerts.length
                            ? "info"
                            : "pass",
                        detail: alerts.length
                          ? `${alerts.length} alert(s) in workspace`
                          : "No open alerts",
                      },
                    ].map((item) => (
                      <div
                        key={item.check}
                        className="flex items-center gap-3 rounded-xl border border-border p-3"
                      >
                        <div
                          className={`h-2 w-2 rounded-full ${
                            item.status === "pass"
                              ? "bg-emerald-500"
                              : item.status === "warning"
                                ? "bg-amber-500"
                                : "bg-sakura-500"
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{item.check}</p>
                          <p className="text-xs text-slate-500">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vitals</CardTitle>
                </CardHeader>
                <CardContent>
                  {!vitals ? (
                    <div className="mb-3 rounded-xl border border-dashed border-border bg-surface-muted/60 p-3 text-xs text-slate-500">
                      No vitals on file. Edit the patient or import CSV columns{" "}
                      <code className="text-[10px]">blood_pressure</code>,{" "}
                      <code className="text-[10px]">heart_rate</code>, etc.
                    </div>
                  ) : (
                    vitals.recordedAt && (
                      <p className="mb-3 text-xs text-slate-500">
                        Recorded {formatDateTime(vitals.recordedAt)}
                      </p>
                    )
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        icon: Activity,
                        label: "Blood Pressure",
                        value: formatVital(vitals?.bloodPressure),
                      },
                      {
                        icon: Heart,
                        label: "Heart Rate",
                        value: formatVital(vitals?.heartRate, " bpm"),
                      },
                      {
                        icon: Thermometer,
                        label: "Temperature",
                        value: formatVital(vitals?.temperature, " °F"),
                      },
                      {
                        icon: Droplets,
                        label: "SpO2",
                        value: formatVital(vitals?.oxygenSaturation, "%"),
                      },
                      {
                        icon: Scale,
                        label: "Weight",
                        value: formatVital(vitals?.weight, " lb"),
                      },
                      {
                        icon: Scale,
                        label: "Height",
                        value: formatVital(vitals?.height, " in"),
                      },
                    ].map((vital) => (
                      <div key={vital.label} className="rounded-xl bg-surface-muted p-3">
                        <vital.icon className="mb-1 h-4 w-4 text-slate-400" />
                        <p className="text-xs text-slate-500">{vital.label}</p>
                        <p className="text-sm font-semibold text-slate-900">{vital.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Allergies</CardTitle>
                </CardHeader>
                <CardContent>
                  {patient.allergies.length > 0 ? (
                    <div className="space-y-2">
                      {patient.allergies.map((a) => (
                        <div
                          key={a}
                          className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          {a}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No known allergies</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>Clinical Alerts</CardTitle>
                  <Link href="/clinical-alerts" className="text-xs text-sakura-600">
                    View all
                  </Link>
                </CardHeader>
                <CardContent>
                  {alerts.length > 0 ? (
                    <div className="space-y-2">
                      {alerts.slice(0, 4).map((alert) => (
                        <Link
                          key={alert.id}
                          href={`/clinical-alerts/${alert.id}`}
                          className="block rounded-xl border border-border p-3 transition-colors hover:border-sakura-200"
                        >
                          <Badge variant={severityBadgeVariant(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <p className="mt-1 text-sm font-medium text-slate-900">{alert.title}</p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No active alerts</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "medications" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" /> Current Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patient.medications.length ? (
                <div className="space-y-3">
                  {patient.medications.map((med) => (
                    <div key={med} className="rounded-xl border border-border p-4">
                      <p className="font-medium text-slate-900">{med}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Pill}
                  title="No medications"
                  description="Import a CSV with a medications column or edit the patient record."
                />
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "alerts" && (
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title="No alerts"
                description="Medication safety alerts appear here after CSV import or analysis."
              />
            ) : (
              alerts.map((alert) => (
                <Link key={alert.id} href={`/clinical-alerts/${alert.id}`}>
                  <Card className="transition-colors hover:border-sakura-200">
                    <CardContent className="flex items-center gap-4 p-4">
                      <AlertTriangle
                        className={`h-5 w-5 ${
                          alert.severity === "critical" ? "text-red-500" : "text-amber-500"
                        }`}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{alert.title}</p>
                        <p className="text-sm text-slate-500">{alert.description}</p>
                      </div>
                      <Badge variant={severityBadgeVariant(alert.severity)}>{alert.severity}</Badge>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === "documents" && (
          patientDocs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents for this patient"
              description="Upload clinical images or text notes under Documents to attach them here."
              action={
                <Link href="/documents">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4" /> Open Documents
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {patientDocs.map((doc) => (
                <Link key={doc.id} href={`/documents/${doc.id}`}>
                  <Card className="transition-colors hover:border-sakura-200">
                    <CardContent className="flex items-center gap-4 p-4">
                      <FileText className="h-5 w-5 text-sakura-600" />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{doc.name}</p>
                        <p className="text-sm text-slate-500">
                          {doc.type} · {doc.size} · {formatDateTime(doc.uploadedAt)}
                        </p>
                      </div>
                      <Badge variant={doc.status === "processed" ? "success" : "info"}>
                        {doc.status}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )
        )}

        {activeTab === "insurance" && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 text-sm text-slate-600">
                Coverage: <strong>{patient.insuranceProvider || "Not on file"}</strong>
                {patient.policyNumber ? ` · ${patient.policyNumber}` : ""}
              </CardContent>
            </Card>
            {claims.length ? (
              claims.map((claim) => (
                <Link key={claim.id} href={`/insurance/${claim.id}`}>
                  <Card className="transition-colors hover:border-sakura-200">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-slate-900">{claim.claimNumber}</p>
                        <p className="text-sm text-slate-500">
                          {claim.diagnosis || "No diagnosis"} · ${claim.amount.toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          claim.status === "approved"
                            ? "success"
                            : claim.status === "rejected"
                              ? "critical"
                              : "warning"
                        }
                      >
                        {claim.status}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <EmptyState
                icon={FileText}
                title="No claims linked"
                description="Insurance claims for this patient will show here when present in the database."
                action={
                  <Link href="/insurance">
                    <Button variant="outline" size="sm">
                      View Insurance
                    </Button>
                  </Link>
                }
              />
            )}
          </div>
        )}

        {activeTab === "timeline" && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-0">
                {timeline.map((event, i) => (
                  <div key={event.id} className="flex gap-4 pb-8 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sakura-100 text-sakura-600">
                        <Clock className="h-4 w-4" />
                      </div>
                      {i < timeline.length - 1 && <div className="mt-2 w-px flex-1 bg-border" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-xs text-slate-400">{formatDateTime(event.date)}</p>
                      <p className="font-medium text-slate-900">{event.title}</p>
                      <p className="text-sm text-slate-500">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "notes" && (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> Clinical Notes
              </CardTitle>
              <Button size="sm" onClick={() => setNoteOpen(true)}>
                Add Note
              </Button>
            </CardHeader>
            <CardContent>
              {notesLoading ? (
                <p className="text-sm text-slate-500">Loading notes…</p>
              ) : notes.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="No clinical notes yet"
                  description="Add the first note for this patient. Notes persist in the database."
                />
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-xl border border-border p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900">{note.authorName}</p>
                        <p className="text-xs text-slate-400">{formatDateTime(note.createdAt)}</p>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-slate-700">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Patient"
        description="Update demographics, clinical lists, and vitals"
        size="lg"
      >
        <EditPatientForm
          patient={patient}
          saving={saving}
          onCancel={() => setEditOpen(false)}
          onSave={async (payload) => {
            setSaving(true);
            try {
              const res = await fetch(`/api/patients/${patient.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Update failed");
              setPatient(data.patient);
              setEditOpen(false);
              toast("success", "Patient updated");
              router.refresh();
            } catch (err) {
              toast("error", "Could not update patient", err instanceof Error ? err.message : "");
            } finally {
              setSaving(false);
            }
          }}
        />
      </Modal>

      <Modal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title="Add Clinical Note"
        description="Notes are saved to the database"
        size="md"
      >
        <AddNoteForm
          saving={saving}
          onCancel={() => setNoteOpen(false)}
          onSave={async (content) => {
            setSaving(true);
            try {
              const res = await fetch(`/api/patients/${patient.id}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Could not save note");
              setNotes((prev) => [data.note, ...prev]);
              setNoteOpen(false);
              toast("success", "Note added");
            } catch (err) {
              toast("error", "Could not add note", err instanceof Error ? err.message : "");
            } finally {
              setSaving(false);
            }
          }}
        />
      </Modal>
    </div>
  );
}

function AddNoteForm({
  saving,
  onCancel,
  onSave,
}: {
  saving: boolean;
  onCancel: () => void;
  onSave: (content: string) => void | Promise<void>;
}) {
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        void onSave(String(data.get("content") || ""));
      }}
    >
      <textarea
        name="content"
        required
        rows={5}
        placeholder="Clinical observation, plan, or follow-up…"
        className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
      />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save Note"}
        </Button>
      </div>
    </form>
  );
}

function EditPatientForm({
  patient,
  saving,
  onCancel,
  onSave,
}: {
  patient: PatientDTO;
  saving: boolean;
  onCancel: () => void;
  onSave: (payload: Record<string, unknown>) => void | Promise<void>;
}) {
  const v = patient.vitals;

  return (
    <form
      className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const vitals: PatientVitals = {
          bloodPressure: String(data.get("bloodPressure") || ""),
          heartRate: data.get("heartRate") ? Number(data.get("heartRate")) : null,
          temperature: data.get("temperature") ? Number(data.get("temperature")) : null,
          weight: data.get("weight") ? Number(data.get("weight")) : null,
          height: data.get("height") ? Number(data.get("height")) : null,
          oxygenSaturation: data.get("oxygenSaturation")
            ? Number(data.get("oxygenSaturation"))
            : null,
          recordedAt: String(data.get("vitalsRecordedAt") || new Date().toISOString()),
        };
        void onSave({
          name: String(data.get("name")),
          dateOfBirth: String(data.get("dateOfBirth")),
          gender: String(data.get("gender")),
          phone: String(data.get("phone") || ""),
          email: String(data.get("email") || ""),
          address: String(data.get("address") || ""),
          bloodType: String(data.get("bloodType") || ""),
          department: String(data.get("department") || ""),
          riskLevel: String(data.get("riskLevel") || "none"),
          insuranceProvider: String(data.get("insuranceProvider") || ""),
          policyNumber: String(data.get("policyNumber") || ""),
          conditions: String(data.get("conditions") || ""),
          medications: String(data.get("medications") || ""),
          allergies: String(data.get("allergies") || ""),
          vitals,
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="name" defaultValue={patient.name} required />
        <Field label="Date of birth" name="dateOfBirth" type="date" defaultValue={patient.dateOfBirth} required />
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Gender</label>
          <select
            name="gender"
            defaultValue={patient.gender}
            className="flex h-10 w-full rounded-xl border border-border bg-white px-3 text-sm"
          >
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Risk level</label>
          <select
            name="riskLevel"
            defaultValue={patient.riskLevel}
            className="flex h-10 w-full rounded-xl border border-border bg-white px-3 text-sm"
          >
            {["none", "low", "medium", "high", "critical"].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <Field label="Phone" name="phone" defaultValue={patient.phone} />
        <Field label="Email" name="email" type="email" defaultValue={patient.email} />
        <Field label="Blood type" name="bloodType" defaultValue={patient.bloodType} />
        <Field label="Department" name="department" defaultValue={patient.department} />
        <Field label="Insurance" name="insuranceProvider" defaultValue={patient.insuranceProvider} />
        <Field label="Policy #" name="policyNumber" defaultValue={patient.policyNumber} />
      </div>
      <Field label="Address" name="address" defaultValue={patient.address} />
      <Field
        label="Conditions (pipe or comma separated)"
        name="conditions"
        defaultValue={patient.conditions.join(" | ")}
      />
      <Field
        label="Medications (pipe or comma separated)"
        name="medications"
        defaultValue={patient.medications.join(" | ")}
      />
      <Field
        label="Allergies (pipe or comma separated)"
        name="allergies"
        defaultValue={patient.allergies.join(" | ")}
      />

      <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
        <p className="mb-3 text-sm font-medium text-slate-800">Vitals</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Blood pressure" name="bloodPressure" defaultValue={v?.bloodPressure || ""} placeholder="120/80" />
          <Field label="Heart rate" name="heartRate" type="number" defaultValue={v?.heartRate ?? ""} />
          <Field label="Temperature °F" name="temperature" type="number" step="0.1" defaultValue={v?.temperature ?? ""} />
          <Field label="SpO2 %" name="oxygenSaturation" type="number" defaultValue={v?.oxygenSaturation ?? ""} />
          <Field label="Weight lb" name="weight" type="number" defaultValue={v?.weight ?? ""} />
          <Field label="Height in" name="height" type="number" defaultValue={v?.height ?? ""} />
          <Field
            label="Recorded at"
            name="vitalsRecordedAt"
            type="datetime-local"
            defaultValue={
              v?.recordedAt
                ? new Date(v.recordedAt).toISOString().slice(0, 16)
                : new Date().toISOString().slice(0, 16)
            }
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  placeholder,
  step,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  placeholder?: string;
  step?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <Input
        name={name}
        type={type}
        defaultValue={defaultValue === null || defaultValue === undefined ? "" : defaultValue}
        required={required}
        placeholder={placeholder}
        step={step}
      />
    </div>
  );
}
