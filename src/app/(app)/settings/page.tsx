"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Palette,
  Bell,
  Shield,
  Users,
  Key,
  Plug,
  FileText,
  Save,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader, LoadingScreen } from "@/components/ui/common";
import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";
import { formatDateTime } from "@/lib/utils";
import type {
  ApiKeyDTO,
  AuditLogDTO,
  OrganizationDTO,
  RoleDTO,
} from "@/lib/settings";

const settingsSections = [
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "theme", label: "Theme", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "roles", label: "Roles & Permissions", icon: Users },
  { id: "api", label: "API Keys", icon: Key },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "audit", label: "Audit Logs", icon: FileText },
];

const defaultNotifPrefs = [
  {
    id: "critical",
    label: "Critical clinical alerts",
    desc: "Immediate notification for critical alerts",
    enabled: true,
  },
  {
    id: "meds",
    label: "Medication safety warnings",
    desc: "Drug interaction and dosage alerts",
    enabled: true,
  },
  {
    id: "claims",
    label: "Insurance claim updates",
    desc: "Status changes on submitted claims",
    enabled: true,
  },
  {
    id: "docs",
    label: "Document processing",
    desc: "OCR and analysis completion",
    enabled: false,
  },
  {
    id: "ai",
    label: "AI insight summaries",
    desc: "Daily AI-generated clinical insights",
    enabled: true,
  },
  {
    id: "maint",
    label: "System maintenance",
    desc: "Scheduled downtime notifications",
    enabled: false,
  },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("organization");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean | null>(
    null
  );
  const [notifPrefs, setNotifPrefs] = useState(defaultNotifPrefs);
  const [themeName, setThemeName] = useState("Sakura Blue");
  const [density, setDensity] = useState("Spacious");
  const [sessionTimeout, setSessionTimeout] = useState("30 minutes");
  const [loading, setLoading] = useState(true);
  const [savingOrg, setSavingOrg] = useState(false);

  const [org, setOrg] = useState<OrganizationDTO | null>(null);
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [keys, setKeys] = useState<ApiKeyDTO[]>([]);
  const [logs, setLogs] = useState<AuditLogDTO[]>([]);
  const [roleModal, setRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRolePerms, setNewRolePerms] = useState("Custom role");
  const [keyModal, setKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [plaintextKey, setPlaintextKey] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    const [orgRes, rolesRes, keysRes, auditRes] = await Promise.all([
      fetch("/api/settings/organization"),
      fetch("/api/settings/roles"),
      fetch("/api/settings/api-keys"),
      fetch("/api/settings/audit"),
    ]);
    const orgData = await orgRes.json();
    const rolesData = await rolesRes.json();
    const keysData = await keysRes.json();
    const auditData = await auditRes.json();
    if (orgRes.ok) setOrg(orgData.organization);
    if (rolesRes.ok) setRoles(rolesData.roles || []);
    if (keysRes.ok) setKeys(keysData.keys || []);
    if (auditRes.ok) setLogs(auditData.logs || []);
  }, []);

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (data?.user) {
        setTwoFactorEnabled(
          Boolean(
            (data.user as { twoFactorEnabled?: boolean }).twoFactorEnabled
          )
        );
      }
    });
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await loadSettings();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSettings]);

  const saveOrganization = async () => {
    if (!org) return;
    setSavingOrg(true);
    try {
      const res = await fetch("/api/settings/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(org),
      });
      const data = await res.json();
      if (!res.ok) {
        toast("error", "Save failed", data.error || "Unknown error");
        return;
      }
      setOrg(data.organization);
      toast("success", "Organization saved");
      await loadSettings();
    } finally {
      setSavingOrg(false);
    }
  };

  const addRole = async () => {
    const res = await fetch("/api/settings/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newRoleName,
        permissions: newRolePerms,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast("error", "Could not add role", data.error || "Unknown error");
      return;
    }
    toast("success", "Role created");
    setRoleModal(false);
    setNewRoleName("");
    await loadSettings();
  };

  const generateKey = async () => {
    const res = await fetch("/api/settings/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName || "Integration key" }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast("error", "Could not generate key", data.error || "Unknown error");
      return;
    }
    setPlaintextKey(data.plaintext);
    setNewKeyName("");
    toast("success", "API key created — copy it now");
    await loadSettings();
  };

  const revokeKey = async (id: string) => {
    const res = await fetch(`/api/settings/api-keys/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast("error", "Revoke failed");
      return;
    }
    toast("success", "API key revoked");
    await loadSettings();
  };

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Organization, roles, and API keys persist to Postgres"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="h-fit lg:col-span-1">
          <CardContent className="p-2">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? "bg-sakura-50 text-sakura-700"
                    : "text-slate-600 hover:bg-surface-subtle"
                }`}
              >
                <section.icon className="h-4 w-4" />
                {section.label}
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          {activeSection === "organization" && org && (
            <Card>
              <CardHeader>
                <CardTitle>Hospital Profile</CardTitle>
                <CardDescription>
                  Organization details saved to the database
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Hospital Name
                    </label>
                    <Input
                      value={org.hospitalName}
                      onChange={(e) =>
                        setOrg({ ...org, hospitalName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Department
                    </label>
                    <Input
                      value={org.department}
                      onChange={(e) =>
                        setOrg({ ...org, department: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Address
                  </label>
                  <Input
                    value={org.address}
                    onChange={(e) =>
                      setOrg({ ...org, address: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Phone
                    </label>
                    <Input
                      value={org.phone}
                      onChange={(e) =>
                        setOrg({ ...org, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      NPI Number
                    </label>
                    <Input
                      value={org.npiNumber}
                      onChange={(e) =>
                        setOrg({ ...org, npiNumber: e.target.value })
                      }
                    />
                  </div>
                </div>
                <Button disabled={savingOrg} onClick={() => void saveOrganization()}>
                  {savingOrg ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          )}

          {activeSection === "theme" && (
            <Card>
              <CardHeader>
                <CardTitle>Theme Preferences</CardTitle>
                <CardDescription>
                  Customize the appearance of Sakura (session only)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="mb-3 block text-sm font-medium text-slate-700">
                    Color Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: "Sakura Blue", color: "bg-sakura-500" },
                      { name: "Clinical Teal", color: "bg-teal-500" },
                      { name: "Midnight", color: "bg-slate-800" },
                    ].map((t) => (
                      <button
                        key={t.name}
                        onClick={() => {
                          setThemeName(t.name);
                          toast("info", "Theme preview", `${t.name} applied for this session`);
                        }}
                        className={`rounded-xl border p-3 text-left ${
                          themeName === t.name
                            ? "border-sakura-300 bg-sakura-50"
                            : "border-border"
                        }`}
                      >
                        <div
                          className={`mb-2 h-8 w-full rounded-lg ${t.color}`}
                        />
                        <p className="text-xs font-medium">{t.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Density
                  </label>
                  <select
                    className="h-10 w-full rounded-xl border border-border px-3 text-sm"
                    value={density}
                    onChange={(e) => setDensity(e.target.value)}
                  >
                    <option>Spacious</option>
                    <option>Compact</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Channel preferences (inbox itself is persisted separately)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {notifPrefs.map((pref) => (
                  <div
                    key={pref.id}
                    className="flex items-center justify-between rounded-xl border border-border p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {pref.label}
                      </p>
                      <p className="text-xs text-slate-500">{pref.desc}</p>
                    </div>
                    <button
                      onClick={() =>
                        setNotifPrefs((prev) =>
                          prev.map((p) =>
                            p.id === pref.id
                              ? { ...p, enabled: !p.enabled }
                              : p
                          )
                        )
                      }
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        pref.enabled ? "bg-sakura-500" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          pref.enabled ? "left-5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() =>
                    toast(
                      "info",
                      "Preference toggles are local for now",
                      "Inbox read/archive state is saved to the database."
                    )
                  }
                >
                  <Save className="h-4 w-4" /> Save Preferences
                </Button>
              </CardContent>
            </Card>
          )}

          {activeSection === "security" && (
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Authentication and session controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-border p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Two-Factor Authentication
                    </p>
                    <p className="text-xs text-slate-500">
                      Manage authenticator app setup on your profile
                    </p>
                  </div>
                  <Badge
                    variant={
                      twoFactorEnabled === null
                        ? "outline"
                        : twoFactorEnabled
                          ? "success"
                          : "warning"
                    }
                  >
                    {twoFactorEnabled === null
                      ? "…"
                      : twoFactorEnabled
                        ? "Enabled"
                        : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Session Timeout
                    </p>
                    <p className="text-xs text-slate-500">
                      Idle guard signs out after 30 minutes (live)
                    </p>
                  </div>
                  <select
                    className="rounded-lg border border-border px-3 py-1.5 text-sm"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                  >
                    <option>15 minutes</option>
                    <option>30 minutes</option>
                    <option>1 hour</option>
                  </select>
                </div>
                <Link href="/profile">
                  <Button variant="outline">Change Password / 2FA</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {activeSection === "roles" && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>Roles & Permissions</CardTitle>
                  <CardDescription>
                    Roles stored in DB; counts mirror assigned users
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setRoleModal(true)}>
                  Add Role
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {roles.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-xl border border-border p-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {r.name}
                        </p>
                        <p className="text-xs text-slate-500">{r.permissions}</p>
                      </div>
                      <Badge variant="outline">{r.userCount} users</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "api" && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Keys are hashed at rest; plaintext shown once on create
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setPlaintextKey(null);
                    setKeyModal(true);
                  }}
                >
                  Generate Key
                </Button>
              </CardHeader>
              <CardContent>
                {plaintextKey && (
                  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="mb-2 font-medium">
                      Copy your new key now — it won&apos;t be shown again.
                    </p>
                    <code className="block break-all rounded bg-white px-2 py-1 text-xs">
                      {plaintextKey}
                    </code>
                    <Button
                      className="mt-2"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void navigator.clipboard.writeText(plaintextKey);
                        toast("success", "Key copied");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                )}
                <div className="space-y-3">
                  {keys.length === 0 ? (
                    <p className="text-sm text-slate-500">No API keys yet.</p>
                  ) : (
                    keys.map((api) => (
                      <div
                        key={api.id}
                        className="rounded-xl border border-border p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-900">
                            {api.name}
                            {api.revokedAt && (
                              <Badge variant="critical" className="ml-2">
                                Revoked
                              </Badge>
                            )}
                          </p>
                          {!api.revokedAt && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => void revokeKey(api.id)}
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                        <code className="rounded bg-surface-muted px-2 py-1 text-xs text-slate-500">
                          {api.maskedKey}
                        </code>
                        <p className="mt-2 text-xs text-slate-400">
                          Created {formatDateTime(api.createdAt)}
                          {api.lastUsedAt
                            ? ` · Last used ${formatDateTime(api.lastUsedAt)}`
                            : ""}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "integrations" && (
            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>
                  Connected systems (catalog preview)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { name: "Epic EHR", status: "connected", desc: "Patient records sync" },
                    { name: "Cerner Lab", status: "connected", desc: "Lab results integration" },
                    { name: "Surescripts", status: "connected", desc: "Medication database" },
                    { name: "Availity", status: "pending", desc: "Insurance verification" },
                    { name: "Doximity", status: "disconnected", desc: "Physician network" },
                    { name: "UpToDate", status: "connected", desc: "Clinical guidelines" },
                  ].map((integration) => (
                    <div
                      key={integration.name}
                      className="rounded-xl border border-border p-4"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900">
                          {integration.name}
                        </p>
                        <Badge
                          variant={
                            integration.status === "connected"
                              ? "success"
                              : integration.status === "pending"
                                ? "warning"
                                : "default"
                          }
                        >
                          {integration.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {integration.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "audit" && (
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>
                  Settings changes and security events from Sakura
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {logs.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No audit events yet. Saving org settings or managing API
                      keys will appear here.
                    </p>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between rounded-xl border border-border p-3 text-sm"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            {log.action}
                          </p>
                          <p className="text-xs text-slate-500">
                            {log.userName} · {log.type}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={roleModal}
        onClose={() => setRoleModal(false)}
        title="Add Role"
        size="sm"
      >
        <div className="space-y-3">
          <Input
            placeholder="Role name"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
          />
          <Input
            placeholder="Permissions description"
            value={newRolePerms}
            onChange={(e) => setNewRolePerms(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRoleModal(false)}>
              Cancel
            </Button>
            <Button disabled={!newRoleName.trim()} onClick={() => void addRole()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={keyModal}
        onClose={() => setKeyModal(false)}
        title="Generate API Key"
        size="sm"
      >
        <div className="space-y-3">
          <Input
            placeholder="Key name (e.g. EHR Integration)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setKeyModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                void generateKey();
                setKeyModal(false);
              }}
            >
              Generate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
