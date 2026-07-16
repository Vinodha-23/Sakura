"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/common";
import { getInitials } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { Mail, Building2, Shield, Edit, Copy } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function ProfilePage() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (!data?.user) return;
      setName(data.user.name);
      setEmail(data.user.email);
      setRole((data.user as { role?: string }).role || "Physician");
      setDepartment((data.user as { department?: string }).department || "");
      setTwoFactorEnabled(Boolean((data.user as { twoFactorEnabled?: boolean }).twoFactorEnabled));
    });
  }, []);

  const enable2FA = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    const { data, error: enableError } = await authClient.twoFactor.enable({
      password,
      issuer: "Sakura",
    });
    setLoading(false);
    if (enableError) {
      setError(enableError.message || "Could not enable 2FA");
      return;
    }
    if (data) {
      setTotpURI(data.totpURI);
      setBackupCodes(data.backupCodes || []);
      setMessage("Scan the URI in your authenticator app, then verify a code below.");
    }
  };

  const verify2FASetup = async () => {
    setLoading(true);
    setError(null);
    const { error: verifyError } = await authClient.twoFactor.verifyTotp({
      code: totpCode,
    });
    setLoading(false);
    if (verifyError) {
      setError(verifyError.message || "Invalid code");
      return;
    }
    setTwoFactorEnabled(true);
    setTotpURI(null);
    setMessage("Two-factor authentication is now enabled.");
    setPassword("");
    setTotpCode("");
  };

  const disable2FA = async () => {
    setLoading(true);
    setError(null);
    const { error: disableError } = await authClient.twoFactor.disable({
      password,
    });
    setLoading(false);
    if (disableError) {
      setError(disableError.message || "Could not disable 2FA");
      return;
    }
    setTwoFactorEnabled(false);
    setMessage("Two-factor authentication disabled.");
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast("error", "Passwords do not match");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/account/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast("error", "Password change failed", data.error);
      return;
    }
    toast("success", "Password updated");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Your account information and security settings"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Profile" }]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sakura-100 to-sakura-200 text-2xl font-semibold text-sakura-700">
              {getInitials(name || "User")}
            </div>
            <h2 className="text-xl font-semibold text-slate-900">{name}</h2>
            <p className="text-sm text-slate-500">{role}</p>
            {department && (
              <Badge variant="info" className="mt-2">
                {department}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              onClick={() => toast("info", "Photo upload", "Avatar storage comes in a later release.")}
            >
              <Edit className="h-4 w-4" /> Edit Photo
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <Input value={name} disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Role</label>
                  <Input value={role} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input value={email} className="pl-10" disabled />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Department</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input value={department} className="pl-10" disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="New password (8+ characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button
                disabled={loading || !currentPassword || newPassword.length < 8}
                onClick={changePassword}
              >
                Update password
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" /> Security — Authenticator 2FA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">Two-Factor Authentication</p>
                  <p className="text-xs text-slate-500">
                    TOTP via authenticator app only — no SMS or email
                  </p>
                </div>
                <Badge variant={twoFactorEnabled ? "success" : "warning"}>
                  {twoFactorEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Confirm password to change 2FA
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your account password"
                />
              </div>

              {!twoFactorEnabled ? (
                <Button onClick={enable2FA} disabled={loading || !password}>
                  Enable authenticator 2FA
                </Button>
              ) : (
                <Button variant="danger" onClick={disable2FA} disabled={loading || !password}>
                  Disable 2FA
                </Button>
              )}

              {totpURI && (
                <div className="space-y-3 rounded-xl border border-sakura-200 bg-sakura-50 p-4">
                  <p className="text-sm font-medium text-sakura-900">Add to authenticator</p>
                  <p className="break-all font-mono text-xs text-slate-600">{totpURI}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(totpURI);
                      setMessage("TOTP URI copied");
                    }}
                  >
                    <Copy className="h-4 w-4" /> Copy URI
                  </Button>
                  {backupCodes.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-slate-700">
                        Backup codes (save these)
                      </p>
                      <ul className="grid grid-cols-2 gap-1 font-mono text-xs text-slate-700">
                        {backupCodes.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      placeholder="6-digit code"
                      maxLength={6}
                    />
                    <Button onClick={verify2FASetup} disabled={loading || totpCode.length < 6}>
                      Verify & enable
                    </Button>
                  </div>
                </div>
              )}

              {message && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {message}
                </p>
              )}
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
