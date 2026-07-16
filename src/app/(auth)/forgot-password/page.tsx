"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("sarah.chen@memorial-hospital.org");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    temporaryPassword?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const res = await fetch("/api/demo/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Unable to reset password");
      return;
    }

    setResult({
      message: data.message,
      temporaryPassword: data.temporaryPassword,
    });
  };

  if (result) {
    return (
      <Card className="border-0 shadow-elevated">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
            <KeyRound className="h-7 w-7 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl">Password reset</CardTitle>
          <CardDescription>{result.message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.temporaryPassword ? (
            <div className="rounded-xl border border-sakura-200 bg-sakura-50 p-4 text-center">
              <p className="text-xs text-sakura-700 mb-1">Temporary password (shown once)</p>
              <p className="font-mono text-lg font-semibold text-sakura-900">
                {result.temporaryPassword}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                No email was sent. Copy this password and sign in, then change it in Profile.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-600 text-center">
              Outbound email is disabled in this free build. Contact an administrator if you need a reset.
            </p>
          )}
          <Link href="/login">
            <Button className="w-full">Back to sign in</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-elevated">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Forgot password?</CardTitle>
        <CardDescription>
          Demo mode generates a temporary password on screen — no SMS or email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                placeholder="you@hospital.org"
                required
              />
            </div>
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Generating..." : "Generate temporary password"}
          </Button>
        </form>
        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-2 text-sm text-sakura-600 hover:text-sakura-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </CardContent>
    </Card>
  );
}
