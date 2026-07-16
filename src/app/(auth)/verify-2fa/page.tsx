"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export default function Verify2FAPage() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useBackup, setUseBackup] = useState(false);
  const [backupCode, setBackupCode] = useState("");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const setCodeFromString = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6).split("");
    setCode(Array.from({ length: 6 }, (_, i) => digits[i] || ""));
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      setCodeFromString(value);
      return;
    }
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    setCodeFromString(e.clipboardData.getData("text"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (useBackup) {
      const { error: verifyError } = await authClient.twoFactor.verifyBackupCode({
        code: backupCode.trim(),
      });
      setLoading(false);
      if (verifyError) {
        setError(verifyError.message || "Invalid backup code");
        return;
      }
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const { error: verifyError } = await authClient.twoFactor.verifyTotp({
      code: code.join(""),
    });
    setLoading(false);
    if (verifyError) {
      setError(verifyError.message || "Invalid authenticator code");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <Card className="border-0 shadow-elevated">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sakura-50">
          <Shield className="h-7 w-7 text-sakura-600" />
        </div>
        <CardTitle className="text-2xl">Two-factor authentication</CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 rounded-xl border border-sakura-200 bg-sakura-50 p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 shrink-0 text-sakura-600" />
            <div className="text-sm text-sakura-900">
              <p className="font-medium">Authenticator app only</p>
              <p className="mt-1 text-sakura-800/80">
                No SMS or email codes are sent. Use Google Authenticator, Authy, or 1Password.
                If you haven&apos;t enabled 2FA yet,{" "}
                <Link href="/login" className="underline font-medium">
                  sign in
                </Link>{" "}
                and enable it from Profile → Security.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!useBackup ? (
            <div className="flex justify-center gap-3" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-white text-center text-lg font-semibold focus:border-sakura-500 focus:outline-none focus:ring-2 focus:ring-sakura-500/20"
                />
              ))}
            </div>
          ) : (
            <input
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value)}
              placeholder="Enter backup code"
              className="flex h-11 w-full rounded-xl border border-border bg-white px-3 text-sm"
              autoFocus
            />
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || (!useBackup && code.some((d) => !d)) || (useBackup && !backupCode)}
          >
            {loading ? "Verifying..." : "Verify"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setUseBackup(!useBackup);
              setError(null);
            }}
            className="w-full text-center text-sm text-sakura-600 hover:text-sakura-700 font-medium"
          >
            {useBackup ? "Use authenticator code instead" : "Use a backup code"}
          </button>

          <Link
            href="/login"
            className="block w-full text-center text-sm text-slate-400 hover:text-slate-600"
          >
            Back to sign in
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
