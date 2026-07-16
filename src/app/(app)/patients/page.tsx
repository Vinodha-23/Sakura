"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Upload,
  Search,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Filter,
  ArrowUpDown,
  Download,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, riskBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader, EmptyState, LoadingScreen } from "@/components/ui/common";
import { useToast } from "@/components/ui/toast";
import { formatDate, getInitials } from "@/lib/utils";
import type { PatientDTO } from "@/lib/patients";

type ViewMode = "list" | "card";
type SortField = "name" | "lastVisit" | "riskLevel" | "alertCount";
type RiskLevel = "critical" | "high" | "medium" | "low" | "none";

const riskOrder: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
};

export default function PatientsPage() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [patients, setPatients] = useState<PatientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [addModal, setAddModal] = useState(false);
  const [deletePatient, setDeletePatient] = useState<PatientDTO | null>(null);
  const [importModal, setImportModal] = useState(false);
  const perPage = 8;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") {
      setAddModal(true);
      window.history.replaceState({}, "", "/patients");
    }
  }, []);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/patients");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load patients");
      setPatients(data.patients || []);
    } catch (err) {
      toast("error", "Could not load patients", err instanceof Error ? err.message : "");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const filtered = useMemo(() => {
    let result = [...patients];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.mrn.toLowerCase().includes(q) ||
          p.assignedDoctor.toLowerCase().includes(q) ||
          p.conditions.some((c) => c.toLowerCase().includes(q))
      );
    }
    if (riskFilter !== "all") {
      result = result.filter((p) => p.riskLevel === riskFilter);
    }
    result.sort((a, b) => {
      if (sortField === "riskLevel") {
        const diff = (riskOrder[a.riskLevel] ?? 9) - (riskOrder[b.riskLevel] ?? 9);
        return sortAsc ? diff : -diff;
      }
      if (sortField === "alertCount") {
        return sortAsc ? a.alertCount - b.alertCount : b.alertCount - a.alertCount;
      }
      if (sortField === "lastVisit") {
        return sortAsc
          ? a.lastVisit.localeCompare(b.lastVisit)
          : b.lastVisit.localeCompare(a.lastVisit);
      }
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });
    return result;
  }, [patients, search, riskFilter, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const runImport = async (payload: FormData | { useSample: true }) => {
    setImporting(true);
    try {
      const res =
        payload instanceof FormData
          ? await fetch("/api/patients/import", { method: "POST", body: payload })
          : await fetch("/api/patients/import", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      toast(
        "success",
        "Import complete",
        data.message ||
          `${data.imported} imported · ${data.alertsCreated} safety alerts created`
      );
      setImportModal(false);
      await loadPatients();
    } catch (err) {
      toast("error", "Import failed", err instanceof Error ? err.message : "");
    } finally {
      setImporting(false);
    }
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    await runImport(form);
  };

  const handleDelete = async () => {
    if (!deletePatient) return;
    const res = await fetch(`/api/patients/${deletePatient.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast("error", "Delete failed");
      return;
    }
    toast("success", "Patient deleted");
    setDeletePatient(null);
    await loadPatients();
  };

  return (
    <div>
      <PageHeader
        title="Patients"
        description={`${patients.length} patients in your care panel · CSV import supported`}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Patients" }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setImportModal(true)}>
              <Upload className="h-4 w-4" /> Import CSV
            </Button>
            <Button size="sm" onClick={() => setAddModal(true)}>
              <Plus className="h-4 w-4" /> Add Patient
            </Button>
          </>
        }
      />

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name, MRN, doctor, or condition..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              {["all", "critical", "high", "medium", "low", "none"].map((risk) => (
                <button
                  key={risk}
                  onClick={() => {
                    setRiskFilter(risk);
                    setPage(1);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    riskFilter === risk
                      ? "bg-sakura-100 text-sakura-700"
                      : "bg-surface-subtle text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {risk === "all" ? "All" : risk}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-border p-1">
              <button
                onClick={() => setView("list")}
                className={`rounded-lg p-2 ${view === "list" ? "bg-sakura-50 text-sakura-600" : "text-slate-400"}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("card")}
                className={`rounded-lg p-2 ${view === "card" ? "bg-sakura-50 text-sakura-600" : "text-slate-400"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingScreen message="Loading patients from database..." />
      ) : paginated.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No patients found"
          description="Import the free synthetic sample CSV to populate realistic clinical data."
          action={
            <Button onClick={() => setImportModal(true)}>
              <Upload className="h-4 w-4" /> Import sample patients
            </Button>
          }
        />
      ) : view === "list" ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">
                    <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-slate-700">
                      Patient <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-6 py-4">MRN</th>
                  <th className="px-6 py-4">
                    <button onClick={() => toggleSort("riskLevel")} className="flex items-center gap-1 hover:text-slate-700">
                      Risk <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-6 py-4">
                    <button onClick={() => toggleSort("alertCount")} className="flex items-center gap-1 hover:text-slate-700">
                      Alerts <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-6 py-4">
                    <button onClick={() => toggleSort("lastVisit")} className="flex items-center gap-1 hover:text-slate-700">
                      Last Visit <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Trust</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {paginated.map((patient) => (
                  <tr
                    key={patient.id}
                    className="border-b border-border last:border-0 hover:bg-surface-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link href={`/patients/${patient.id}`} className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-medium text-slate-600">
                          {getInitials(patient.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{patient.name}</p>
                          <p className="text-xs text-slate-500">
                            {patient.age}y · {patient.gender}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{patient.mrn}</td>
                    <td className="px-6 py-4">
                      <Badge variant={riskBadgeVariant(patient.riskLevel as RiskLevel)}>
                        {patient.riskLevel}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {patient.alertCount > 0 ? (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-medium text-red-700">
                          {patient.alertCount}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {patient.lastVisit ? formatDate(patient.lastVisit) : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{patient.assignedDoctor}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{patient.source.replace("_", " ")}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      {patient.trustScore}%
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setDeletePatient(patient)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paginated.map((patient) => (
            <Link key={patient.id} href={`/patients/${patient.id}`}>
              <Card className="h-full transition-all hover:border-sakura-200 hover:shadow-elevated">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sakura-50 text-sm font-medium text-sakura-700">
                        {getInitials(patient.name)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{patient.name}</p>
                        <p className="text-xs text-slate-500">{patient.mrn}</p>
                      </div>
                    </div>
                    <Badge variant={riskBadgeVariant(patient.riskLevel as RiskLevel)}>
                      {patient.riskLevel}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">Last Visit</p>
                      <p className="text-slate-700">
                        {patient.lastVisit ? formatDate(patient.lastVisit) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Alerts</p>
                      <p className="text-slate-700">{patient.alertCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Conditions</p>
                      <p className="truncate text-slate-700">
                        {patient.conditions[0] || "None"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Trust</p>
                      <p className="text-slate-700">{patient.trustScore}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!loading && filtered.length > perPage && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of{" "}
            {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="Add Patient"
        description="Register a new patient in the database"
      >
        <PatientForm
          onSubmit={async (values) => {
            const res = await fetch("/api/patients", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(values),
            });
            if (!res.ok) {
              toast("error", "Could not add patient");
              return;
            }
            setAddModal(false);
            toast("success", "Patient added");
            await loadPatients();
          }}
        />
      </Modal>

      <Modal
        open={!!deletePatient}
        onClose={() => setDeletePatient(null)}
        title="Delete Patient"
        size="sm"
      >
        <p className="mb-6 text-sm text-slate-600">
          Delete <strong>{deletePatient?.name}</strong>? Related alerts will also be removed.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeletePatient(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>

      <Modal
        open={importModal}
        onClose={() => !importing && setImportModal(false)}
        title="Import Patients"
        description="Upload a Synthea-style CSV, or load our free synthetic sample"
        size="lg"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-sakura-100 bg-sakura-50/50 p-4 text-sm text-slate-700">
            <p className="font-medium text-sakura-900">How it works</p>
            <p className="mt-1 text-slate-600">
              Import upserts by MRN, stores conditions/medications/allergies, and auto-generates
              medication safety alerts (e.g. Warfarin + Aspirin).
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a href="/samples/patients-sample.csv" download>
              <Button variant="outline" size="sm" type="button">
                <Download className="h-4 w-4" /> Download sample CSV
              </Button>
            </a>
            <Button
              size="sm"
              disabled={importing}
              onClick={() => runImport({ useSample: true })}
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Import sample (15 patients)
            </Button>
          </div>

          <div
            className="rounded-xl border-2 border-dashed border-border p-10 text-center transition-colors hover:border-sakura-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
          >
            <Upload className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <p className="text-sm text-slate-600">Drag and drop your CSV here</p>
            <p className="mt-1 text-xs text-slate-400">
              Required columns: mrn, name, date_of_birth · Optional: medications, conditions,
              allergies, risk_level
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              disabled={importing}
              onClick={() => fileRef.current?.click()}
            >
              {importing ? "Importing..." : "Browse CSV file"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function PatientForm({
  onSubmit,
}: {
  onSubmit: (values: {
    name: string;
    dateOfBirth: string;
    gender: string;
    email?: string;
    phone?: string;
  }) => void | Promise<void>;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        void onSubmit({
          name: `${data.get("firstName")} ${data.get("lastName")}`.trim(),
          dateOfBirth: String(data.get("dob")),
          gender: String(data.get("gender")),
          email: String(data.get("email") || "") || undefined,
          phone: String(data.get("phone") || "") || undefined,
        });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">First Name</label>
          <Input name="firstName" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Last Name</label>
          <Input name="lastName" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Date of Birth</label>
          <Input name="dob" type="date" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Gender</label>
          <select
            name="gender"
            className="flex h-10 w-full rounded-xl border border-border bg-white px-3 text-sm"
            defaultValue="Female"
          >
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Email</label>
        <Input name="email" type="email" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Phone</label>
        <Input name="phone" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit">Add Patient</Button>
      </div>
    </form>
  );
}
