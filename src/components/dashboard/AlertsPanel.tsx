import { useState, useEffect } from "react";
import { api, type Alert } from "@/lib/api";
import { ChevronRight, AlertTriangle, ShieldCheck } from "lucide-react";

function RiskBadge({ risk }: { risk: Alert["risk"] }) {
  const styles = {
    high: "threat-badge-high",
    medium: "threat-badge-medium",
    low: "threat-badge-low",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[risk] ?? "threat-badge-low"}`}>
      {risk.toUpperCase()}
    </span>
  );
}

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  useEffect(() => {
    api.getAlerts()
      .then((data) => { if (data.alerts?.length) setAlerts(data.alerts); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unresolved = alerts.filter((a) => !a.resolved).length;

  return (
    <div className="glass-panel rounded-xl flex flex-col h-[400px] animate-fade-in">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-threat-medium" />
          Active Alerts
        </h3>
        <span className={`text-xs font-medium ${unresolved > 0 ? "text-destructive" : "text-muted-foreground"}`}>
          {loading ? "—" : `${unresolved} unresolved`}
        </span>
      </div>

      {selectedAlert ? (
        <div className="flex-1 overflow-auto p-4 scrollbar-cyber">
          <button
            onClick={() => setSelectedAlert(null)}
            className="text-xs text-primary hover:underline mb-3 flex items-center gap-1"
          >
            ← Back to alerts
          </button>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">{selectedAlert.title}</h4>
              <RiskBadge risk={selectedAlert.risk} />
            </div>
            <p className="text-sm text-muted-foreground">{selectedAlert.description}</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="glass-panel rounded-lg p-3">
                <p className="text-muted-foreground">Source IP</p>
                <p className="text-accent font-mono mt-1">{selectedAlert.source}</p>
              </div>
              <div className="glass-panel rounded-lg p-3">
                <p className="text-muted-foreground">Detected At</p>
                <p className="text-foreground font-mono mt-1">{selectedAlert.timestamp}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button className="cyber-btn text-xs !py-1.5">Block IP</button>
              <button className="cyber-btn-outline text-xs !py-1.5">Investigate</button>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground animate-pulse">Loading alerts…</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-6">
          <ShieldCheck className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground/60">No alerts yet</p>
          <p className="text-xs text-muted-foreground/40">Alerts will appear here once you upload logs or run a simulation</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto scrollbar-cyber">
          {alerts.map((alert) => (
            <button
              key={alert.id}
              onClick={() => setSelectedAlert(alert)}
              className={`w-full text-left px-4 py-3 border-b border-border/50 flex items-center gap-3 hover:bg-muted/30 transition-colors ${
                alert.resolved ? "opacity-50" : ""
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  alert.risk === "high"
                    ? "bg-destructive animate-pulse"
                    : alert.risk === "medium"
                    ? "bg-threat-medium"
                    : "bg-threat-low"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
                <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
              </div>
              <RiskBadge risk={alert.risk} />
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
