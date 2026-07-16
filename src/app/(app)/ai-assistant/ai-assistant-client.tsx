"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Send,
  Bot,
  User,
  Copy,
  Download,
  Share2,
  ThumbsUp,
  ThumbsDown,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Shield,
  ImagePlus,
  X,
  UserRound,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/common";
import { useToast } from "@/components/ui/toast";
import type { ChatMessage } from "@/lib/types";

function storageKey(patientId: string | null) {
  return `sakura-ai-chat:${patientId || "panel"}`;
}

function defaultGreeting(patientName?: string | null): ChatMessage {
  return {
    id: "greeting",
    role: "assistant",
    content: patientName
      ? `You're in focused mode for ${patientName}. I'll answer using only this patient's chart (meds, alerts, claims, documents). Ask a clinical question or attach an image.`
      : "Hello. I'm your Sakura clinical assistant (free NVIDIA NIM). Ask about your panel — or open a patient and click AI Assistant for focused answers. You can also attach an image for vision analysis.",
    timestamp: new Date().toISOString(),
    trustScore: 98,
  };
}

export function AIAssistantClient() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");

  const [patientName, setPatientName] = useState<string | null>(
    searchParams.get("patient")
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    defaultGreeting(searchParams.get("patient")),
  ]);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<string | null>(
    null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = useMemo(() => {
    if (patientName) {
      return [
        `What medication interactions should I watch for ${patientName}?`,
        `Summarize open alerts for ${patientName}`,
        `What is the insurance claim status for ${patientName}?`,
        `Review recent documents and labs for ${patientName}`,
        `Give a concise clinical consistency check for ${patientName}`,
      ];
    }
    return [
      "What are the medication interactions for James Mitchell?",
      "Summarize today's critical alerts",
      "Which patients have pending insurance claims?",
      "Analyze CKD progression trends in my panel",
      "What guidelines apply to atrial fibrillation management?",
    ];
  }, [patientName]);

  const latestCitations = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].citations?.length) return messages[i].citations!;
    }
    return [];
  }, [messages]);

  // Load patient name + restore chat memory for this scope
  useEffect(() => {
    let cancelled = false;
    setHydrated(false);

    (async () => {
      let name = searchParams.get("patient");
      if (patientId) {
        try {
          const res = await fetch(`/api/patients/${patientId}`);
          const data = await res.json();
          if (res.ok && data.patient?.name) name = data.patient.name;
        } catch {
          /* keep query name */
        }
      }
      if (cancelled) return;
      setPatientName(name);

      try {
        const raw = localStorage.getItem(storageKey(patientId));
        if (raw) {
          const parsed = JSON.parse(raw) as ChatMessage[];
          if (Array.isArray(parsed) && parsed.length) {
            setMessages(parsed);
            setHydrated(true);
            return;
          }
        }
      } catch {
        /* ignore corrupt storage */
      }
      setMessages([defaultGreeting(name)]);
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [patientId, searchParams]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey(patientId), JSON.stringify(messages));
    } catch {
      /* quota */
    }
  }, [messages, patientId, hydrated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const clearChat = useCallback(() => {
    const next = [defaultGreeting(patientName)];
    setMessages(next);
    localStorage.setItem(storageKey(patientId), JSON.stringify(next));
    toast("success", "Chat cleared");
  }, [patientId, patientName, toast]);

  const exportMessage = (content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sakura-ai-response-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast("success", "Exported", "Response saved as a text file");
  };

  const shareMessage = async (content: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Sakura AI response", text: content });
        return;
      }
      await navigator.clipboard.writeText(content);
      toast("success", "Copied for sharing");
    } catch {
      toast("info", "Share cancelled");
    }
  };

  const onPickImage = (file: File | null) => {
    setImageFile(file);
    if (!file) {
      setImagePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() && !imageFile) return;
    const content = text.trim() || "Please analyze this clinical image.";
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
      imagePreview: imagePreview || undefined,
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    let imagePayload: { mimeType: string; contentBase64: string } | null =
      null;
    if (imageFile && imagePreview?.includes("base64,")) {
      imagePayload = {
        mimeType: imageFile.type || "image/png",
        contentBase64: imagePreview.split("base64,")[1] || "",
      };
    }
    setImageFile(null);
    setImagePreview(null);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patientId || undefined,
          messages: nextMessages
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({ role: m.role, content: m.content })),
          image: imagePayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast("error", "AI request failed", data.error || "Unknown error");
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `I couldn't complete that request: ${data.error || "Unknown error"}`,
            timestamp: new Date().toISOString(),
            trustScore: 0,
          },
        ]);
        return;
      }
      const msg = data.message;
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: msg.content,
          timestamp: new Date().toISOString(),
          citations: msg.citations,
          reasoningSteps: msg.reasoningSteps,
          trustScore: msg.trustScore,
          model: msg.model,
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      toast("error", "AI request failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        title="AI Assistant"
        description={
          patientName
            ? `Focused on ${patientName} · chat saved in this browser`
            : "Panel mode · free NVIDIA text + vision · chat saved per scope"
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "AI Assistant" },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={clearChat}>
            Clear chat
          </Button>
        }
      />

      {patientId && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sakura-200 bg-sakura-50 px-4 py-3 text-sm text-sakura-900">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4" />
            <span>
              Patient scope: <strong>{patientName || patientId}</strong> — answers
              use only this chart.
            </span>
          </div>
          <div className="flex gap-2">
            <Link href={`/patients/${patientId}`}>
              <Button variant="outline" size="sm">
                Open chart
              </Button>
            </Link>
            <Link href="/ai-assistant">
              <Button variant="ghost" size="sm">
                Switch to panel mode
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-6">
        <div className="flex min-h-0 flex-1 flex-col">
          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sakura-100">
                      <Bot className="h-4 w-4 text-sakura-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] ${msg.role === "user" ? "order-first" : ""}`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-sakura-600 text-white"
                          : "border border-border bg-surface-muted"
                      }`}
                    >
                      {msg.imagePreview && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={msg.imagePreview}
                          alt="Attached"
                          className="mb-2 max-h-48 rounded-lg border border-white/20 object-contain"
                        />
                      )}
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {msg.content}
                      </p>
                    </div>

                    {msg.role === "assistant" && (
                      <div className="mt-2 space-y-2">
                        {(msg.trustScore != null || msg.model) && (
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            {msg.trustScore != null && (
                              <>
                                <Shield className="h-3.5 w-3.5 text-sakura-500" />
                                Trust Score:{" "}
                                <span className="font-medium text-sakura-600">
                                  {msg.trustScore}%
                                </span>
                              </>
                            )}
                            {msg.model && (
                              <Badge variant="outline" className="text-[10px]">
                                {msg.model}
                              </Badge>
                            )}
                          </div>
                        )}

                        {msg.citations && msg.citations.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-slate-500">
                              Sources
                            </p>
                            {msg.citations.map((cite) => (
                              <Link
                                key={cite.id}
                                href={
                                  cite.documentId
                                    ? `/documents/${cite.documentId}`
                                    : "/documents"
                                }
                                className="block rounded-xl border border-border bg-white p-3 transition-colors hover:border-sakura-200"
                              >
                                <div className="mb-1 flex items-center gap-2">
                                  <FileText className="h-3.5 w-3.5 text-sakura-500" />
                                  <span className="text-xs font-medium text-slate-900">
                                    {cite.source}
                                  </span>
                                </div>
                                <p className="text-xs italic text-slate-500">
                                  &ldquo;{cite.excerpt}&rdquo;
                                </p>
                              </Link>
                            ))}
                          </div>
                        )}

                        {msg.reasoningSteps && (
                          <div>
                            <button
                              onClick={() =>
                                setExpandedReasoning(
                                  expandedReasoning === msg.id ? null : msg.id
                                )
                              }
                              className="flex items-center gap-1 text-xs font-medium text-sakura-600 hover:text-sakura-700"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              Reasoning Steps
                              {expandedReasoning === msg.id ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                            {expandedReasoning === msg.id && (
                              <div className="mt-2 space-y-1.5 border-l-2 border-sakura-200 pl-4">
                                {msg.reasoningSteps.map((step, i) => (
                                  <p key={i} className="text-xs text-slate-600">
                                    <span className="font-medium text-sakura-600">
                                      {i + 1}.
                                    </span>{" "}
                                    {step}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(msg.content);
                              toast("success", "Copied to clipboard");
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-surface-subtle hover:text-slate-600"
                            title="Copy"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => exportMessage(msg.content)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-surface-subtle hover:text-slate-600"
                            title="Export"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void shareMessage(msg.content)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-surface-subtle hover:text-slate-600"
                            title="Share"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              toast("success", "Thanks for the feedback")
                            }
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                            title="Helpful"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              toast(
                                "info",
                                "Feedback noted — we'll use this to improve"
                              )
                            }
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="Not helpful"
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200">
                      <User className="h-4 w-4 text-slate-600" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sakura-100">
                    <Bot className="h-4 w-4 text-sakura-600" />
                  </div>
                  <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-sakura-400" />
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-sakura-400"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-sakura-400"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border p-4">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0] || null)}
              />
              {imagePreview && (
                <div className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-surface-muted p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1 text-xs text-slate-600">
                    Vision mode — image will be sent with your question
                  </div>
                  <button
                    type="button"
                    onClick={() => onPickImage(null)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendMessage(input);
                }}
                className="flex gap-2"
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={loading}
                  title="Attach image"
                >
                  <ImagePlus className="h-4 w-4" />
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    patientName
                      ? `Ask about ${patientName}…`
                      : "Ask about patients, medications, guidelines…"
                  }
                  className="flex-1"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  disabled={loading || (!input.trim() && !imageFile)}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>

        <div className="hidden w-80 shrink-0 space-y-4 xl:block">
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Suggested Questions
              </h3>
              <div className="space-y-2">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => void sendMessage(q)}
                    className="w-full rounded-xl border border-border p-3 text-left text-xs text-slate-600 transition-colors hover:border-sakura-200 hover:bg-sakura-50/50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Evidence Viewer
              </h3>
              {latestCitations.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Citations from the latest AI response appear here.
                </p>
              ) : (
                <div className="space-y-2">
                  {latestCitations.map((cite) => (
                    <Link
                      key={cite.id}
                      href={
                        cite.documentId
                          ? `/documents/${cite.documentId}`
                          : "/documents"
                      }
                      className="block rounded-xl border border-border p-3 transition-colors hover:border-sakura-200"
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-sakura-500" />
                        <span className="text-xs font-medium text-slate-900">
                          {cite.source}
                        </span>
                      </div>
                      <p className="line-clamp-3 text-xs italic text-slate-500">
                        &ldquo;{cite.excerpt}&rdquo;
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
