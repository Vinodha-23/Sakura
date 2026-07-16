"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Users, FileText, Pill, Activity, Bot, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader, Tabs, EmptyState, LoadingScreen } from "@/components/ui/common";

const categories = [
  { id: "all", label: "All Results" },
  { id: "patients", label: "Patients" },
  { id: "alerts", label: "Alerts" },
  { id: "claims", label: "Claims" },
  { id: "documents", label: "Documents" },
  { id: "medications", label: "Medications" },
];

type Results = {
  patients: {
    id: string;
    name: string;
    mrn: string;
    department?: string;
    riskLevel?: string;
    medications?: string[];
    conditions?: string[];
  }[];
  alerts: { id: string; title: string; description: string; patientName?: string }[];
  claims: { id: string; claimNumber: string; patientName: string; provider?: string }[];
  documents: { id: string; name: string; patientName: string; type?: string }[];
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results>({
    patients: [],
    alerts: [],
    claims: [],
    documents: [],
  });

  useEffect(() => {
    if (!query.trim()) {
      setResults({ patients: [], alerts: [], claims: [], documents: [] });
      return;
    }
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
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const medications = results.patients.flatMap((p) =>
    (p.medications || [])
      .filter((m) => m.toLowerCase().includes(query.toLowerCase()))
      .map((m) => ({ name: m, patientId: p.id, patientName: p.name }))
  );
  const diseases = results.patients.flatMap((p) =>
    (p.conditions || [])
      .filter((c) => c.toLowerCase().includes(query.toLowerCase()))
      .map((c) => ({ condition: c, patientId: p.id, patientName: p.name }))
  );

  const total =
    results.patients.length +
    results.alerts.length +
    results.claims.length +
    results.documents.length +
    medications.length;

  return (
    <div>
      <PageHeader
        title="Search"
        description={
          query ? `${total} results for "${query}"` : "Search patients, alerts, claims, and more"
        }
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Search" }]}
      />

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patients, medications, claims, alerts..."
              className="h-12 pl-12 text-base"
              autoFocus
            />
          </div>
        </CardContent>
      </Card>

      {query && (
        <>
          <Tabs
            tabs={categories.map((c) => ({
              id: c.id,
              label: c.label,
              count:
                c.id === "all"
                  ? total
                  : c.id === "medications"
                    ? medications.length
                    : (results as Record<string, unknown[]>)[c.id]?.length,
            }))}
            activeTab={activeCategory}
            onChange={setActiveCategory}
          />

          {loading ? (
            <LoadingScreen message="Searching..." />
          ) : (
            <div className="mt-6 space-y-6">
              {(activeCategory === "all" || activeCategory === "patients") &&
                results.patients.length > 0 && (
                  <Section title="Patients" icon={Users} count={results.patients.length}>
                    {results.patients.map((p) => (
                      <Link key={p.id} href={`/patients/${p.id}`}>
                        <Card className="transition-colors hover:border-sakura-200">
                          <CardContent className="flex items-center justify-between p-4">
                            <div>
                              <p className="font-medium text-slate-900">{p.name}</p>
                              <p className="text-sm text-slate-500">
                                {p.mrn} · {p.department}
                              </p>
                            </div>
                            {p.riskLevel && (
                              <Badge variant="outline">{p.riskLevel} risk</Badge>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </Section>
                )}

              {(activeCategory === "all" || activeCategory === "alerts") &&
                results.alerts.length > 0 && (
                  <Section title="Alerts" icon={Bot} count={results.alerts.length}>
                    {results.alerts.map((a) => (
                      <Link key={a.id} href={`/clinical-alerts/${a.id}`}>
                        <Card className="transition-colors hover:border-sakura-200">
                          <CardContent className="p-4">
                            <p className="font-medium text-slate-900">{a.title}</p>
                            <p className="text-sm text-slate-500">{a.description}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </Section>
                )}

              {(activeCategory === "all" || activeCategory === "claims") &&
                results.claims.length > 0 && (
                  <Section title="Claims" icon={Shield} count={results.claims.length}>
                    {results.claims.map((c) => (
                      <Link key={c.id} href={`/insurance/${c.id}`}>
                        <Card className="transition-colors hover:border-sakura-200">
                          <CardContent className="p-4">
                            <p className="font-medium text-slate-900">{c.claimNumber}</p>
                            <p className="text-sm text-slate-500">{c.patientName}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </Section>
                )}

              {(activeCategory === "all" || activeCategory === "documents") &&
                results.documents.length > 0 && (
                  <Section title="Documents" icon={FileText} count={results.documents.length}>
                    {results.documents.map((d) => (
                      <Link key={d.id} href={`/documents/${d.id}`}>
                        <Card className="transition-colors hover:border-sakura-200">
                          <CardContent className="p-4">
                            <p className="font-medium text-slate-900">{d.name}</p>
                            <p className="text-sm text-slate-500">{d.patientName}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </Section>
                )}

              {(activeCategory === "all" || activeCategory === "medications") &&
                medications.length > 0 && (
                  <Section title="Medications" icon={Pill} count={medications.length}>
                    {medications.map((m, i) => (
                      <Link key={`${m.patientId}-${i}`} href={`/patients/${m.patientId}`}>
                        <Card className="transition-colors hover:border-sakura-200">
                          <CardContent className="p-4">
                            <p className="font-medium text-slate-900">{m.name}</p>
                            <p className="text-sm text-slate-500">{m.patientName}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </Section>
                )}

              {activeCategory === "all" && diseases.length > 0 && (
                <Section title="Diseases" icon={Activity} count={diseases.length}>
                  {diseases.map((d, i) => (
                    <Link key={i} href={`/patients/${d.patientId}`}>
                      <Card className="transition-colors hover:border-sakura-200">
                        <CardContent className="p-4">
                          <p className="font-medium text-slate-900">{d.condition}</p>
                          <p className="text-sm text-slate-500">{d.patientName}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </Section>
              )}

              {total === 0 && (
                <EmptyState
                  icon={Search}
                  title="No results found"
                  description={`No matches for "${query}". Try a patient name, MRN, or medication.`}
                />
              )}
            </div>
          )}
        </>
      )}

      {!query && (
        <div className="py-16 text-center">
          <Search className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-slate-500">Start typing to search across the platform</p>
          <p className="mt-2 text-xs text-slate-400">
            Tip: Press{" "}
            <kbd className="rounded border border-border px-1.5 py-0.5">Ctrl+K</kbd> for quick
            search
          </p>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Icon className="h-4 w-4 text-sakura-500" /> {title} ({count})
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
