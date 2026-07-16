"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Tag,
  Bot,
  Highlighter,
  History,
  Download,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, LoadingScreen } from "@/components/ui/common";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils";
import type { Document } from "@/lib/types";

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const [ocrLoading, setOcrLoading] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const res = await fetch(`/api/documents/${id}`);
    if (res.status === 404) {
      setMissing(true);
      setDoc(null);
      return;
    }
    const data = await res.json();
    if (res.ok) setDoc(data.document);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await load();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  if (loading) return <LoadingScreen />;
  if (missing || !doc) notFound();

  const isImage = Boolean(doc.mimeType?.startsWith("image/") && doc.contentBase64);
  const downloadPreview = () => {
    const lines = [
      doc.name,
      `Patient: ${doc.patientName}`,
      `Type: ${doc.type}`,
      `Status: ${doc.status}`,
      "",
      "OCR text:",
      doc.ocrText || "(empty)",
      "",
      "Extracted entities:",
      ...doc.extractedEntities.map((e) => `- ${e}`),
      "",
      "— Export from Sakura Documents —",
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.name.replace(/[^\w.-]+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast("success", "Download started", "OCR text export saved locally");
  };

  const retryOcr = async () => {
    setOcrLoading(true);
    try {
      const res = await fetch(`/api/documents/${id}/ocr`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast("error", "OCR failed", data.error || "Unknown error");
        return;
      }
      setDoc(data.document);
      toast(
        data.document.ocrStatus === "complete" ? "success" : "info",
        "OCR finished",
        data.document.ocrError || data.document.ocrStatus
      );
    } finally {
      setOcrLoading(false);
    }
  };

  const tabs = [
    { id: "preview", label: "Preview" },
    { id: "entities", label: "Extracted Entities" },
    { id: "citations", label: "Citations" },
    { id: "history", label: "Version History" },
  ];

  return (
    <div>
      <Link
        href="/documents"
        className="mb-6 inline-flex items-center gap-2 text-sm text-sakura-600 hover:text-sakura-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to documents
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-sakura-50 p-3">
            <FileText className="h-8 w-8 text-sakura-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{doc.name}</h1>
            <p className="text-sm text-slate-500">
              {doc.patientName} · {doc.type} · v{doc.version}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge
                variant={doc.status === "processed" ? "success" : "info"}
              >
                {doc.status}
              </Badge>
              <Badge variant="outline">OCR: {doc.ocrStatus}</Badge>
              {doc.tags.map((t) => (
                <Badge key={t} variant="outline">
                  <Tag className="mr-1 h-3 w-3" />
                  {t}
                </Badge>
              ))}
            </div>
            {doc.ocrError && (
              <p className="mt-2 text-sm text-amber-700">{doc.ocrError}</p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              {doc.status === "processed"
                ? "Status: Processed — OCR finished successfully."
                : doc.status === "processing"
                  ? "Status: Processing — OCR is still running."
                  : doc.status === "failed"
                    ? "Status: Failed — OCR error (see message above). Try Retry OCR or a clearer PNG/JPG."
                    : "Status: Pending — file stored but OCR was not run (common for PDF). Upload a page image for text extraction."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={retryOcr}
            disabled={ocrLoading}
          >
            {ocrLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Retry OCR
          </Button>
          <Button variant="outline" size="sm" onClick={downloadPreview}>
            <Download className="h-4 w-4" /> Download
          </Button>
          <Link href={`/patients/${doc.patientId}`}>
            <Button variant="outline" size="sm">
              View Patient
            </Button>
          </Link>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {activeTab === "preview" && (
            <Card>
              <CardContent className="p-0">
                <div className="flex items-center justify-between rounded-t-2xl border-b border-border bg-slate-100 p-4">
                  <span className="text-sm text-slate-500">
                    Document Preview · {doc.pages} pages
                  </span>
                  <span className="text-xs text-slate-400">{doc.size}</span>
                </div>
                <div className="min-h-[500px] bg-white p-8">
                  {isImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`data:${doc.mimeType};base64,${doc.contentBase64}`}
                      alt={doc.name}
                      className="mb-6 max-h-[420px] w-full rounded-xl border border-border object-contain"
                    />
                  )}
                  <div className="mx-auto max-w-2xl space-y-4 text-sm leading-relaxed text-slate-700">
                    <h2 className="text-lg font-semibold text-slate-900">
                      OCR text
                    </h2>
                    <p className="text-slate-500">Patient: {doc.patientName}</p>
                    <hr className="border-border" />
                    {doc.ocrText ? (
                      <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700">
                        {doc.ocrText}
                      </pre>
                    ) : (
                      <p className="text-slate-400">
                        No OCR text yet. Upload a PNG/JPG/WEBP or retry OCR when
                        NVIDIA_API_KEY is set.
                      </p>
                    )}
                    {doc.extractedEntities.length > 0 && (
                      <div className="space-y-2 pt-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Highlighted entities
                        </p>
                        {doc.extractedEntities.map((entity) => (
                          <p key={entity}>
                            <Highlighter className="mr-1 inline h-4 w-4 text-amber-500" />
                            <span className="rounded border-b-2 border-amber-300 bg-amber-50 px-1">
                              {entity}
                            </span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "entities" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-sakura-600" /> Extracted Entities
                </CardTitle>
              </CardHeader>
              <CardContent>
                {doc.extractedEntities.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {doc.extractedEntities.map((entity) => (
                      <div
                        key={entity}
                        className="rounded-xl border border-border p-4"
                      >
                        <p className="font-medium text-slate-900">{entity}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          From OCR / vision extract
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500">
                    <Bot className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <p>
                      {doc.ocrStatus === "processing"
                        ? "OCR processing in progress..."
                        : "No entities extracted yet"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "citations" && (
            <Card>
              <CardHeader>
                <CardTitle>Citation Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                {doc.extractedEntities.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    Citations appear after entities are extracted.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {doc.extractedEntities.map((entity) => {
                      const snippet =
                        doc.ocrText
                          ?.split(/\n/)
                          .find((line) =>
                            line.toLowerCase().includes(entity.toLowerCase())
                          ) ||
                        `Entity “${entity}” extracted from document OCR.`;
                      return (
                        <div
                          key={entity}
                          className="rounded-xl border border-amber-100 bg-amber-50/30 p-4"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <Badge variant="warning">{entity}</Badge>
                          </div>
                          <p className="text-sm italic text-slate-600">
                            &ldquo;{snippet}&rdquo;
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "history" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" /> Version History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: Math.max(doc.version, 1) }, (_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-border p-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          Version {doc.version - i}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(doc.uploadedAt)}
                        </p>
                      </div>
                      {i === 0 && <Badge variant="success">Current</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Processing Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { step: "Upload", done: true },
                { step: "OCR Processing", done: doc.ocrStatus === "complete" },
                {
                  step: "Entity Extraction",
                  done: doc.extractedEntities.length > 0,
                },
                { step: "Ready for review", done: doc.status === "processed" },
              ].map((step) => (
                <div key={step.step} className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      step.done ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      step.done ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {step.step}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Uploaded</dt>
                  <dd>{formatDateTime(doc.uploadedAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Size</dt>
                  <dd>{doc.size}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">MIME</dt>
                  <dd>{doc.mimeType || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Version</dt>
                  <dd>v{doc.version}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
