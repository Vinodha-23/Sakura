"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Shield, DollarSign, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader, Tabs, EmptyState } from "@/components/ui/common";
import { formatDate } from "@/lib/utils";
import type { ClaimDTO } from "@/lib/insurance";

export function InsuranceClient({ initialClaims }: { initialClaims: ClaimDTO[] }) {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const tabs = [
    { id: "all", label: "All Claims", count: initialClaims.length },
    {
      id: "pending",
      label: "Pending",
      count: initialClaims.filter((c) => c.status === "pending").length,
    },
    {
      id: "review",
      label: "In Review",
      count: initialClaims.filter((c) => c.status === "review").length,
    },
    {
      id: "approved",
      label: "Approved",
      count: initialClaims.filter((c) => c.status === "approved").length,
    },
    {
      id: "rejected",
      label: "Rejected",
      count: initialClaims.filter((c) => c.status === "rejected").length,
    },
  ];

  const filtered = useMemo(() => {
    return initialClaims.filter((c) => {
      if (activeTab !== "all" && c.status !== activeTab) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.patientName.toLowerCase().includes(q) ||
        c.claimNumber.toLowerCase().includes(q) ||
        c.provider.toLowerCase().includes(q)
      );
    });
  }, [initialClaims, activeTab, search]);

  const totalAmount = initialClaims.reduce((sum, c) => sum + c.amount, 0);
  const pendingCount = initialClaims.filter(
    (c) => c.status === "pending" || c.status === "review"
  ).length;
  const missingDocsCount = initialClaims.filter((c) => c.missingDocuments.length > 0).length;

  return (
    <div>
      <PageHeader
        title="Insurance"
        description="Claims validation and approval probability · live database"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Insurance" }]}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Claims", value: initialClaims.length, icon: Shield, color: "text-sakura-600 bg-sakura-50" },
          {
            label: "Total Amount",
            value: `$${totalAmount.toLocaleString()}`,
            icon: DollarSign,
            color: "text-emerald-600 bg-emerald-50",
          },
          { label: "Pending Review", value: pendingCount, icon: Clock, color: "text-amber-600 bg-amber-50" },
          {
            label: "Missing Documents",
            value: missingDocsCount,
            icon: AlertTriangle,
            color: "text-red-600 bg-red-50",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-xl p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-semibold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <p className="mb-2 font-medium text-slate-900">
          Claim statuses (insurance workflow — not document OCR)
        </p>
        <ul className="grid gap-1 sm:grid-cols-2">
          <li>
            <strong>Pending</strong> — submitted, waiting on the payer
          </li>
          <li>
            <strong>In review</strong> — needs attention / more documentation
          </li>
          <li>
            <strong>Approved</strong> — accepted / payable
          </li>
          <li>
            <strong>Rejected</strong> — denied; open the claim to see why
            (missing docs + corrections)
          </li>
        </ul>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mb-4 mt-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search claims..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No claims found"
            description={
              initialClaims.length === 0
                ? "No insurance claims in the database yet. Seed or add claims linked to patients."
                : "Try another tab or search query."
            }
          />
        ) : (
          filtered.map((claim) => (
            <Link key={claim.id} href={`/insurance/${claim.id}`}>
              <Card className="transition-all hover:border-sakura-200">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">{claim.claimNumber}</p>
                        <Badge
                          variant={
                            claim.status === "approved"
                              ? "success"
                              : claim.status === "rejected"
                                ? "critical"
                                : claim.status === "review"
                                  ? "info"
                                  : "warning"
                          }
                        >
                          {claim.status}
                        </Badge>
                        {claim.missingDocuments.length > 0 && (
                          <Badge variant="high">
                            {claim.missingDocuments.length} missing docs
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {claim.patientName} · {claim.provider}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {claim.diagnosis || "No diagnosis coded"} ·{" "}
                        {claim.procedure || "No procedure"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-semibold text-slate-900">
                        ${claim.amount.toLocaleString()}
                      </p>
                      <div className="mt-1 flex items-center gap-2 justify-end">
                        <div className="h-1.5 w-16 rounded-full bg-slate-100">
                          <div
                            className={`h-1.5 rounded-full ${
                              claim.approvalProbability >= 80
                                ? "bg-emerald-500"
                                : claim.approvalProbability >= 50
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${claim.approvalProbability}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600">
                          {claim.approvalProbability}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatDate(claim.submittedAt)}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
