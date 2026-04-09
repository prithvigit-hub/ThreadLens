import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Settings as SettingsIcon, Bell, Shield, Database, Monitor, User, Server, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

interface SystemStatus {
  backend: "ok" | "error" | "loading";
  db: "ok" | "error" | "loading";
  ai: "ok" | "error" | "loading";
}

const settingsGroups = [
  {
    icon: Bell,
    title: "Notifications",
    description: "Configure alert thresholds and notification channels",
    items: ["Email alerts for high-risk threats", "Slack integration", "SMS notifications"],
  },
  {
    icon: Shield,
    title: "Security Rules",
    description: "Manage detection rules and policies",
    items: ["Brute force detection sensitivity", "Port scan threshold", "IP blocklist management"],
  },
  {
    icon: Database,
    title: "Data Sources",
    description: "Manage connected log sources and endpoints",
    items: ["Syslog UDP/TCP endpoints", "Cloud provider integrations", "File watchers"],
  },
  {
    icon: Monitor,
    title: "Display",
    description: "Customize dashboard appearance",
    items: ["Log refresh interval", "Max visible entries", "Color scheme"],
  },
];

function StatusDot({ status }: { status: "ok" | "error" | "loading" }) {
  if (status === "loading") return <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />;
  if (status === "ok") return <CheckCircle className="w-3.5 h-3.5 text-safe" />;
  return <XCircle className="w-3.5 h-3.5 text-destructive" />;
}

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const [status, setStatus] = useState<SystemStatus>({ backend: "loading", db: "loading", ai: "loading" });

  useEffect(() => {
    api.health()
      .then((data) => {
        setStatus({
          backend: "ok",
          db: data.db_connected ? "ok" : "error",
          ai: "ok",
        });
      })
      .catch(() => {
        setStatus({ backend: "error", db: "error", ai: "error" });
      });
  }, []);

  return (
    <Layout>
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

        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">User Profile</h3>
              <p className="text-xs text-muted-foreground">Your account information</p>
            </div>
          </div>
          <div className="pl-8 space-y-3">
            <div className="flex items-center justify-between text-sm py-2 border-b border-border/30">
              <span className="text-muted-foreground">Name</span>
              <span className="text-foreground font-medium">{user?.name ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-b border-border/30">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground font-medium">{user?.email ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2">
              <span className="text-muted-foreground">Role</span>
              <span className="text-primary font-medium">Security Analyst</span>
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
          {settingsGroups.map((group) => (
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
                  <div key={item} className="flex items-center justify-between text-sm py-2 border-b border-border/30 last:border-0">
                    <span className="text-muted-foreground">{item}</span>
                    <div className="w-9 h-5 rounded-full bg-muted relative cursor-pointer">
                      <div className="w-4 h-4 rounded-full bg-primary absolute top-0.5 right-0.5" />
                    </div>
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
