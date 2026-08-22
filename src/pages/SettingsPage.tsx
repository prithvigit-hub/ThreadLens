import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import {
  Settings as SettingsIcon, Bell, Shield, Database, Monitor, User,
  Server, CheckCircle, XCircle, Loader2, ChevronRight, Eye, EyeOff,
  KeyRound, AlertCircle, CheckCircle2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface SystemStatus {
  backend: "ok" | "error" | "loading";
  db: "ok" | "error" | "loading";
  ai: "ok" | "error" | "loading";
}

const SETTINGS_GROUPS = [
  {
    icon: Bell,
    title: "Notifications",
    description: "Configure alert thresholds and notification channels",
    items: [
      { key: "email_alerts", label: "Email alerts for high-risk threats" },
      { key: "slack_integration", label: "Slack integration" },
      { key: "sms_notifications", label: "SMS notifications" },
    ],
  },
  {
    icon: Shield,
    title: "Security Rules",
    description: "Manage detection rules and policies",
    items: [
      { key: "brute_force_detection", label: "Brute force detection sensitivity" },
      { key: "port_scan_threshold", label: "Port scan threshold" },
      { key: "ip_blocklist", label: "IP blocklist management" },
    ],
  },
  {
    icon: Database,
    title: "Data Sources",
    description: "Manage connected log sources and endpoints",
    items: [
      { key: "syslog_endpoints", label: "Syslog UDP/TCP endpoints" },
      { key: "cloud_integrations", label: "Cloud provider integrations" },
      { key: "file_watchers", label: "File watchers" },
    ],
  },
  {
    icon: Monitor,
    title: "Display",
    description: "Customize dashboard appearance",
    items: [
      { key: "log_refresh", label: "Log refresh interval" },
      { key: "max_entries", label: "Max visible entries" },
      { key: "color_scheme", label: "Color scheme" },
    ],
  },
];

const DEFAULT_TOGGLES: Record<string, boolean> = {
  email_alerts: true,
  slack_integration: false,
  sms_notifications: false,
  brute_force_detection: true,
  port_scan_threshold: true,
  ip_blocklist: true,
  syslog_endpoints: true,
  cloud_integrations: true,
  file_watchers: true,
  log_refresh: true,
  max_entries: true,
  color_scheme: false,
};

function loadToggles(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem("tl_settings_toggles");
    if (stored) return { ...DEFAULT_TOGGLES, ...JSON.parse(stored) };
  } catch {
    // Use defaults when saved settings are malformed.
  }
  return { ...DEFAULT_TOGGLES };
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${
        on ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`block w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform duration-200 ${
          on ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function StatusDot({ status }: { status: "ok" | "error" | "loading" }) {
  if (status === "loading") return <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />;
  if (status === "ok") return <CheckCircle className="w-3.5 h-3.5 text-safe" />;
  return <XCircle className="w-3.5 h-3.5 text-destructive" />;
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = (() => {
    if (!next) return 0;
    let s = 0;
    if (next.length >= 8) s++;
    if (/[A-Z]/.test(next)) s++;
    if (/[0-9]/.test(next)) s++;
    if (/[^A-Za-z0-9]/.test(next)) s++;
    return s;
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "text-red-400", "text-yellow-400", "text-blue-400", "text-green-400"][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!current) { setError("Current password is required."); return; }
    if (next.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (next !== confirm) { setError("New passwords do not match."); return; }
    if (next === current) { setError("New password must be different from the current one."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Failed to change password.");
        return;
      }
      toast({ title: "Password Updated", description: "Your password has been changed successfully." });
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-panel rounded-2xl p-7 w-full max-w-md space-y-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <KeyRound className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Change Password</h3>
            <p className="text-xs text-muted-foreground">Choose a strong new password</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="••••••••"
                className="cyber-input w-full pr-10"
                data-testid="input-current-password"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowCurrent(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">New Password</label>
            <div className="relative">
              <input
                type={showNext ? "text" : "password"}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="Min. 8 characters"
                className="cyber-input w-full pr-10"
                data-testid="input-new-password"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowNext(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {next && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-1 flex-1">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= strength
                        ? strength === 1 ? "bg-red-400" : strength === 2 ? "bg-yellow-400" : strength === 3 ? "bg-blue-400" : "bg-green-400"
                        : "bg-muted"
                    }`} />
                  ))}
                </div>
                <span className={`text-xs font-medium ${strengthColor}`}>{strengthLabel}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="cyber-input w-full pr-10"
                data-testid="input-confirm-new-password"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirm(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirm && next === confirm && (
              <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> Passwords match
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="cyber-btn-outline flex-1 text-sm !py-2.5"
              data-testid="button-cancel-password"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="cyber-btn flex-1 text-sm !py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
              data-testid="button-save-password"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              {loading ? "Saving..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const SettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<SystemStatus>({ backend: "loading", db: "loading", ai: "loading" });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [toggles, setToggles] = useState<Record<string, boolean>>(loadToggles);

  useEffect(() => {
    api.health()
      .then((data) => {
        setStatus({ backend: "ok", db: data.db_connected ? "ok" : "error", ai: data.ai_configured ? "ok" : "error" });
      })
      .catch(() => {
        setStatus({ backend: "error", db: "error", ai: "error" });
      });
  }, []);

  const handleToggle = (key: string) => {
    setToggles((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("tl_settings_toggles", JSON.stringify(updated));
      } catch {
        // Settings remain active for the current session if storage is unavailable.
      }
      const label = SETTINGS_GROUPS.flatMap((g) => g.items).find((i) => i.key === key)?.label ?? key;
      toast({
        title: updated[key] ? "Setting enabled" : "Setting disabled",
        description: label,
      });
      return updated;
    });
  };

  return (
    <Layout>
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}

      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Settings</h2>
            <p className="text-sm text-muted-foreground">Configure your forensic investigator</p>
          </div>
        </div>

        <button
          onClick={() => navigate("/profile")}
          data-testid="settings-link-profile"
          className="glass-panel rounded-xl p-5 w-full flex items-center gap-4 hover:border-primary/40 transition-all duration-200 group"
        >
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary">
              {(user?.name ?? "A").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
            </span>
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-semibold text-foreground">{user?.name ?? "Analyst"}</p>
            <p className="text-xs text-muted-foreground">{user?.email ?? "—"} · Security Analyst</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
            View Profile <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>

        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Security</h3>
              <p className="text-xs text-muted-foreground">Manage your account security settings</p>
            </div>
          </div>
          <div className="pl-8">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Password</p>
                  <p className="text-xs text-muted-foreground">Last changed: unknown</p>
                </div>
              </div>
              <button
                onClick={() => setShowChangePassword(true)}
                data-testid="button-change-password"
                className="cyber-btn-outline text-xs !py-1.5 !px-4"
              >
                Change
              </button>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">System Status</h3>
              <p className="text-xs text-muted-foreground">API and database connectivity</p>
            </div>
          </div>
          <div className="pl-8 space-y-3">
            {[
              { label: "Backend API", key: "backend" as const },
              { label: "MongoDB Database", key: "db" as const },
              { label: "AI Service (Groq)", key: "ai" as const },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center justify-between text-sm py-2 border-b border-border/30 last:border-0">
                <span className="text-muted-foreground">{label}</span>
                <div className="flex items-center gap-2">
                  <StatusDot status={status[key]} />
                  <span className={`text-xs font-medium ${status[key] === "ok" ? "text-safe" : status[key] === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                    {status[key] === "loading" ? "Checking..." : status[key] === "ok" ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {SETTINGS_GROUPS.map((group) => (
            <div key={group.title} className="glass-panel rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <group.icon className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
                  <p className="text-xs text-muted-foreground">{group.description}</p>
                </div>
              </div>
              <div className="space-y-2 pl-8">
                {group.items.map((item) => (
                  <div key={item.key} className="flex items-center justify-between text-sm py-2 border-b border-border/30 last:border-0">
                    <span className="text-muted-foreground">{item.label}</span>
                    <Toggle
                      on={toggles[item.key] ?? false}
                      onToggle={() => handleToggle(item.key)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
