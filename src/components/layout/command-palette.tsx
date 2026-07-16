"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  FileText,
  Bot,
  LayoutDashboard,
  AlertTriangle,
  Shield,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onOpen?: () => void;
}

const quickLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Clinical Alerts", href: "/clinical-alerts", icon: AlertTriangle },
  { name: "Insurance", href: "/insurance", icon: Shield },
  { name: "AI Assistant", href: "/ai-assistant", icon: Bot },
  { name: "Documents", href: "/documents", icon: FileText },
];

type SearchPayload = {
  patients: { id: string; name: string; mrn: string }[];
  alerts: { id: string; title: string; patientName: string }[];
  claims: { id: string; claimNumber: string; patientName: string }[];
  documents: { id: string; name: string; patientName: string }[];
};

export function CommandPalette({ open, onClose, onOpen }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchPayload>({
    patients: [],
    alerts: [],
    claims: [],
    documents: [],
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) onClose();
        else onOpen?.();
      }
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, onOpen]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults({ patients: [], alerts: [], claims: [], documents: [] });
    }
  }, [open]);

  useEffect(() => {
    if (!open || !query.trim()) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults({
          patients: data.patients || [],
          alerts: data.alerts || [],
          claims: data.claims || [],
          documents: data.documents || [],
        });
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query, open]);

  if (!open) return null;

  const navigate = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-white shadow-elevated">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients, alerts, claims, documents..."
            className="flex-1 py-4 text-sm outline-none placeholder:text-slate-400"
          />
          <kbd className="rounded-md border border-border bg-surface-muted px-2 py-0.5 text-xs text-slate-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {!query && (
            <div className="mb-2">
              <p className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                Quick Navigation
              </p>
              {quickLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => navigate(link.href)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-surface-subtle"
                >
                  <link.icon className="h-4 w-4 text-slate-400" />
                  {link.name}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <p className="px-3 py-6 text-center text-sm text-slate-500">Searching...</p>
          )}

          {!loading && query && results.patients.length > 0 && (
            <ResultGroup title="Patients">
              {results.patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/patients/${p.id}`)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-surface-subtle"
                >
                  <Users className="h-4 w-4 text-sakura-500" />
                  <div className="text-left">
                    <p className="font-medium text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.mrn}</p>
                  </div>
                </button>
              ))}
            </ResultGroup>
          )}

          {!loading && query && results.alerts.length > 0 && (
            <ResultGroup title="Alerts">
              {results.alerts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => navigate(`/clinical-alerts/${a.id}`)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-surface-subtle"
                >
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <div className="text-left">
                    <p className="font-medium text-slate-900">{a.title}</p>
                    <p className="text-xs text-slate-500">{a.patientName}</p>
                  </div>
                </button>
              ))}
            </ResultGroup>
          )}

          {!loading && query && results.claims.length > 0 && (
            <ResultGroup title="Claims">
              {results.claims.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/insurance/${c.id}`)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-surface-subtle"
                >
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <div className="text-left">
                    <p className="font-medium text-slate-900">{c.claimNumber}</p>
                    <p className="text-xs text-slate-500">{c.patientName}</p>
                  </div>
                </button>
              ))}
            </ResultGroup>
          )}

          {!loading && query && results.documents.length > 0 && (
            <ResultGroup title="Documents">
              {results.documents.map((d) => (
                <button
                  key={d.id}
                  onClick={() => navigate(`/documents/${d.id}`)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-surface-subtle"
                >
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">{d.name}</span>
                </button>
              ))}
            </ResultGroup>
          )}

          {!loading &&
            query &&
            results.patients.length === 0 &&
            results.alerts.length === 0 &&
            results.claims.length === 0 &&
            results.documents.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-slate-500">
                No results for &ldquo;{query}&rdquo;
              </p>
            )}
        </div>
      </div>
    </div>
  );
}

function ResultGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-slate-400">
        {title}
      </p>
      {children}
    </div>
  );
}
