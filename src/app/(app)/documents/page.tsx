"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  Search,
  FileText,
  Filter,
  Trash2,
  Edit,
  Tag,
  Clock,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader, EmptyState, LoadingScreen } from "@/components/ui/common";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils";
import type { Document } from "@/lib/types";
import type { PatientDTO } from "@/lib/patients";

export default function DocumentsPage() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [patients, setPatients] = useState<PatientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [uploadModal, setUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [renameDoc, setRenameDoc] = useState<Document | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [uploadPatientId, setUploadPatientId] = useState("");
  const [uploadType, setUploadType] = useState("Clinical Note");
  const [uploadTags, setUploadTags] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadDocs = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search.trim()) params.set("q", search.trim());
    const res = await fetch(`/api/documents?${params}`);
    const data = await res.json();
    if (res.ok) setDocs(data.documents || []);
  }, [search, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [docsRes, patientsRes] = await Promise.all([
          fetch("/api/documents"),
          fetch("/api/patients"),
        ]);
        const docsData = await docsRes.json();
        const patientsData = await patientsRes.json();
        if (cancelled) return;
        if (docsRes.ok) setDocs(docsData.documents || []);
        if (patientsRes.ok) {
          const list = patientsData.patients || [];
          setPatients(list);
          const params = new URLSearchParams(window.location.search);
          const fromPatient = params.get("patientId");
          if (fromPatient && list.some((p: PatientDTO) => p.id === fromPatient)) {
            setUploadPatientId(fromPatient);
            setUploadModal(true);
          } else if (list[0]?.id) {
            setUploadPatientId(list[0].id);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      void loadDocs();
    }, 250);
    return () => clearTimeout(t);
  }, [search, statusFilter, loadDocs, loading]);

  const handleUpload = async () => {
    if (!selectedFile || !uploadPatientId) {
      toast("error", "Missing file or patient");
      return;
    }
    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");
    const isImage = selectedFile.type.startsWith("image/");
    const isTxt =
      selectedFile.type === "text/plain" ||
      selectedFile.name.toLowerCase().endsWith(".txt");
    if (!isImage && !isTxt && !isPdf) {
      toast(
        "error",
        "Unsupported file",
        "Use PNG, JPG, WEBP, TXT (OCR), or PDF (stored only)."
      );
      return;
    }
    if (isPdf) {
      toast(
        "info",
        "PDF note",
        "PDF will be stored as Pending — OCR needs a PNG/JPG/WEBP page image in the free pipeline."
      );
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", selectedFile);
      form.set("patientId", uploadPatientId);
      form.set("name", selectedFile.name);
      form.set("type", uploadType);
      form.set("tags", uploadTags);
      const res = await fetch("/api/documents", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        toast("error", "Upload failed", data.error || "Unknown error");
        return;
      }
      const doc = data.document;
      const statusHint =
        doc?.status === "processed"
          ? "OCR complete — open the document to read text."
          : doc?.status === "pending"
            ? "Stored without OCR (common for PDF). Upload a page image for text extraction."
            : doc?.status === "failed"
              ? doc.ocrError ||
                "OCR failed — check NVIDIA_API_KEY or try a clearer PNG/JPG."
              : `Status: ${doc?.status} / OCR: ${doc?.ocrStatus}`;
      toast(
        doc?.status === "processed" ? "success" : "info",
        "Document uploaded",
        statusHint
      );
      setUploadModal(false);
      setSelectedFile(null);
      setUploadTags("");
      await loadDocs();
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDoc) return;
    const res = await fetch(`/api/documents/${deleteDoc.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast("error", "Delete failed", data.error || "Unknown error");
      return;
    }
    toast("success", "Document deleted");
    setDeleteDoc(null);
    await loadDocs();
  };

  const handleRename = async () => {
    if (!renameDoc || !renameValue.trim()) return;
    const res = await fetch(`/api/documents/${renameDoc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast("error", "Rename failed", data.error || "Unknown error");
      return;
    }
    toast("success", "Document renamed");
    setRenameDoc(null);
    await loadDocs();
  };

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <PageHeader
        title="Documents"
        description={`${docs.length} documents · upload images/txt for free NVIDIA OCR`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Documents" },
        ]}
        actions={
          <Button size="sm" onClick={() => setUploadModal(true)}>
            <Upload className="h-4 w-4" /> Upload Document
          </Button>
        }
      />

      <Card className="mb-6">
        <CardContent className="space-y-3 p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800">What document statuses mean</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <p>
              <Badge variant="success">processed</Badge> OCR finished — text/entities ready
            </p>
            <p>
              <Badge variant="info">processing</Badge> Upload accepted; OCR still running
            </p>
            <p>
              <Badge variant="warning">pending</Badge> Stored but OCR skipped (e.g. PDF) — use PNG/JPG for OCR
            </p>
            <p>
              <Badge variant="critical">failed</Badge> OCR error — open the doc for the reason, or Retry OCR
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            {["all", "processed", "processing", "pending", "failed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
                  statusFilter === s
                    ? "bg-sakura-100 text-sakura-700"
                    : "bg-surface-subtle text-slate-600"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {docs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents found"
          description="Upload a PNG/JPG/WEBP or .txt linked to a patient to run OCR."
          action={
            <Button onClick={() => setUploadModal(true)}>
              <Upload className="h-4 w-4" /> Upload
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <Card
              key={doc.id}
              className="group transition-all hover:border-sakura-200"
            >
              <CardContent className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <Link
                    href={`/documents/${doc.id}`}
                    className="flex min-w-0 flex-1 items-start gap-3"
                  >
                    <div className="rounded-xl bg-sakura-50 p-2.5">
                      <FileText className="h-5 w-5 text-sakura-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {doc.name}
                      </p>
                      <p className="text-xs text-slate-500">{doc.patientName}</p>
                    </div>
                  </Link>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => {
                        setRenameDoc(doc);
                        setRenameValue(doc.name);
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-surface-subtle"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteDoc(doc)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <Badge
                    variant={
                      doc.status === "processed"
                        ? "success"
                        : doc.status === "processing"
                          ? "info"
                          : doc.status === "failed"
                            ? "critical"
                            : "warning"
                    }
                    title={
                      doc.status === "processed"
                        ? "OCR finished"
                        : doc.status === "processing"
                          ? "OCR in progress"
                          : doc.status === "failed"
                            ? "OCR failed — open for details"
                            : "Stored; OCR not run (often PDF)"
                    }
                  >
                    {doc.status === "processed"
                      ? "Processed (OCR done)"
                      : doc.status === "processing"
                        ? "Processing OCR…"
                        : doc.status === "failed"
                          ? "Failed"
                          : "Pending (no OCR)"}
                  </Badge>
                  <Badge variant="outline">OCR: {doc.ocrStatus}</Badge>
                </div>
                <div className="mb-3 flex flex-wrap gap-1">
                  {doc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-md bg-surface-subtle px-2 py-0.5 text-[10px] text-slate-600"
                    >
                      <Tag className="h-2.5 w-2.5" /> {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {doc.type} · {doc.pages}p · {doc.size}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />{" "}
                    {formatDateTime(doc.uploadedAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={uploadModal}
        onClose={() => !uploading && setUploadModal(false)}
        title="Upload Document"
        description="Best for OCR: PNG/JPG/WEBP or .txt (≤4MB). PDF is stored as Pending without OCR."
      >
        <input
          ref={fileRef}
          type="file"
          accept=".txt,image/png,image/jpeg,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        />
        <div
          className="cursor-pointer rounded-xl border-2 border-dashed border-border p-10 text-center transition-colors hover:border-sakura-300"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="mx-auto mb-3 h-10 w-10 text-slate-400" />
          <p className="mb-1 text-sm text-slate-600">
            {selectedFile ? selectedFile.name : "Click to choose a file"}
          </p>
          <p className="text-xs text-slate-400">
            OCR works on PNG / JPG / WEBP / TXT. PDF uploads stay Pending (no text extract yet).
          </p>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Patient
            </label>
            <select
              className="flex h-10 w-full rounded-xl border border-border bg-white px-3 text-sm"
              value={uploadPatientId}
              onChange={(e) => setUploadPatientId(e.target.value)}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.mrn})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Type
            </label>
            <select
              className="flex h-10 w-full rounded-xl border border-border bg-white px-3 text-sm"
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value)}
            >
              {[
                "Clinical Note",
                "Consultation",
                "Laboratory",
                "Treatment Plan",
                "Diagnostic",
                "Assessment",
                "Imaging",
              ].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tags
            </label>
            <Input
              placeholder="cardiology, labs"
              value={uploadTags}
              onChange={(e) => setUploadTags(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            disabled={uploading}
            onClick={() => setUploadModal(false)}
          >
            Cancel
          </Button>
          <Button disabled={uploading || !selectedFile} onClick={handleUpload}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
              </>
            ) : (
              "Upload & OCR"
            )}
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!deleteDoc}
        onClose={() => setDeleteDoc(null)}
        title="Delete Document"
        size="sm"
      >
        <p className="mb-6 text-sm text-slate-600">
          Delete <strong>{deleteDoc?.name}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteDoc(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!renameDoc}
        onClose={() => setRenameDoc(null)}
        title="Rename Document"
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          className="mb-4"
        />
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setRenameDoc(null)}>
            Cancel
          </Button>
          <Button onClick={handleRename}>Save</Button>
        </div>
      </Modal>
    </div>
  );
}
