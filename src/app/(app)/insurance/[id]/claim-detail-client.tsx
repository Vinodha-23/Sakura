"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Bot,
  FileText,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { ClaimDTO } from "@/lib/insurance";
import { useState } from "react";

export function ClaimDetailClient({ claim: initial }: { claim: ClaimDTO }) {
  const [claim, setClaim] = useState(initial);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const setStatus = async (status: string) => {
    setLoading(true);
    const res = await fetch(`/api/insurance/${claim.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast("error", "Update failed", data.error);
      return;
    }
    setClaim(data.claim);
    toast("success", `Claim marked ${status}`);
    router.refresh();
  };

  return (
    <div>
      <Link
        href="/insurance"
        className="mb-6 inline-flex items-center gap-2 text-sm text-sakura-600 hover:text-sakura-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to insurance
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    claim.status === "approved"
                      ? "success"
                      : claim.status === "rejected"
                        ? "critical"
                        : "warning"
                  }
                >
                  {claim.status === "pending"
                    ? "Pending (awaiting payer)"
                    : claim.status === "review"
                      ? "In review"
                      : claim.status === "approved"
                        ? "Approved"
                        : "Rejected"}
                </Badge>
                <Badge variant="outline">{claim.provider}</Badge>
              </div>
              {claim.status === "rejected" && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                  <p className="font-semibold">Why this claim was rejected</p>
                  {claim.missingDocuments.length > 0 ? (
                    <p className="mt-1">
                      Missing: {claim.missingDocuments.join("; ")}
                    </p>
                  ) : (
                    <p className="mt-1">No missing-document list on file.</p>
                  )}
                  {claim.suggestedCorrections.length > 0 && (
                    <p className="mt-1">
                      Fix: {claim.suggestedCorrections.join("; ")}
                    </p>
                  )}
                </div>
              )}
              <h1 className="text-2xl font-semibold text-slate-900">{claim.claimNumber}</h1>
              <p className="mt-1 text-slate-500">{claim.patientName}</p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Amount</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    ${claim.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Approval Probability</p>
                  <p className="text-2xl font-semibold text-sakura-600">
                    {claim.approvalProbability}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Claim Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-slate-500">Diagnosis</dt>
                  <dd className="mt-0.5 font-medium">{claim.diagnosis || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Procedure</dt>
                  <dd className="mt-0.5 font-medium">{claim.procedure || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Submitted</dt>
                  <dd className="mt-0.5 font-medium">{formatDate(claim.submittedAt)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Provider</dt>
                  <dd className="mt-0.5 font-medium">{claim.provider}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {claim.missingDocuments.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-5 w-5" /> Missing Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {claim.missingDocuments.map((doc) => (
                    <div
                      key={doc}
                      className="flex items-center gap-3 rounded-xl bg-amber-50 p-3"
                    >
                      <FileText className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-800">{doc}</span>
                      <Link
                        href={`/documents?patientId=${claim.patientId}`}
                        className="ml-auto"
                      >
                        <Button variant="outline" size="sm">
                          Upload
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {claim.suggestedCorrections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-sakura-600" /> Suggested Corrections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {claim.suggestedCorrections.map((correction) => (
                    <div
                      key={correction}
                      className="flex items-start gap-3 rounded-xl border border-sakura-100 bg-sakura-50/30 p-3"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-sakura-600" />
                      <p className="text-sm text-slate-700">{correction}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" /> Claim History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="mt-2 h-2 w-2 rounded-full bg-sakura-500" />
                  <div>
                    <p className="text-sm font-medium">Claim submitted</p>
                    <p className="text-xs text-slate-500">{formatDate(claim.submittedAt)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div
                    className={`mt-2 h-2 w-2 rounded-full ${
                      claim.status === "approved"
                        ? "bg-emerald-500"
                        : claim.status === "rejected"
                          ? "bg-red-500"
                          : "bg-amber-500"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium">Current status: {claim.status}</p>
                    <p className="text-xs text-slate-500">Updated from Sakura insurance workspace</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/patients/${claim.patientId}`}
                className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-sakura-200"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sakura-50 text-sm font-medium text-sakura-700">
                  {claim.patientName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{claim.patientName}</p>
                  <p className="text-xs text-slate-500">View patient record</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="mx-auto mb-3 h-10 w-10 text-sakura-600" />
              <p className="text-3xl font-semibold text-slate-900">
                {claim.approvalProbability}%
              </p>
              <p className="text-sm text-slate-500">Approval Probability</p>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {claim.status === "rejected" && (
              <Button className="w-full" disabled={loading} onClick={() => setStatus("review")}>
                Resubmit for Review
              </Button>
            )}
            {(claim.status === "pending" || claim.status === "review") && (
              <>
                <Button className="w-full" disabled={loading} onClick={() => setStatus("approved")}>
                  Mark Approved
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                  onClick={() => setStatus("rejected")}
                >
                  Mark Rejected
                </Button>
              </>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const blob = new Blob([JSON.stringify(claim, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${claim.claimNumber}.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast("success", "Claim exported");
              }}
            >
              Download Claim
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
