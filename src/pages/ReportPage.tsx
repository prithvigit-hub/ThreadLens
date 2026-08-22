import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  CheckCircle, AlertTriangle, ShieldAlert, FileText, Brain,
  Loader2, ChevronRight, BarChart2, ArrowLeft,
} from "lucide-react";
import { api, type Alert } from "@/lib/api";

interface ReportState {
  logs_parsed: number;
  threats_detected: number;
  session_id: string;
  file_size_mb: number;
  truncated: boolean;
  filename?: string;
}

interface Investigation {
  attack_flow: string;
  root_cause: string;
  attacker_intent: string;
  affected_systems: string[];
  severity: string;
  remediation_steps: string[];
  summary: string;
}

const severityColor: Record<string, string> = {
  critical: "text-destructive",
  high: "text-destructive",
  medium: "text-yellow-400",
  low: "text-safe",
};

const ReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ReportState | null;

  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [investigating, setInvestigating] = useState(false);
  const [investigationError, setInvestigationError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    api.getAlerts().then((d) => setAlerts(d.alerts ?? [])).catch(() => {
      // The report remains usable when alert history is unavailable.
    });
  }, []);

  if (!state) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
          <FileText className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">No report data found.</p>
          <button onClick={() => navigate("/analyze")} className="cyber-btn text-sm">
            Upload Logs
          </button>
        </div>
      </Layout>
    );
  }

  const runInvestigation = async () => {
    setInvestigating(true);
    setInvestigationError(null);
    try {
      const logsData = await api.getLogs(50);
      const result = await api.investigate(logsData.logs);
      setInvestigation(result as Investigation);
    } catch {
      setInvestigationError("AI investigation failed. Please try again.");
    } finally {
      setInvestigating(false);
    }
  };

  const riskColor =
    state.threats_detected === 0 ? "text-safe" :
    state.threats_detected < 10 ? "text-yellow-400" : "text-destructive";

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/analyze")}
            className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-safe/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-safe" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Analysis Report</h2>
            <p className="text-sm text-muted-foreground">
              {state.filename ? `${state.filename} · ` : ""}{state.file_size_mb} MB processed
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Logs Parsed" value={state.logs_parsed.toLocaleString()} icon={FileText} color="primary" />
          <StatCard label="Threats Found" value={state.threats_detected.toString()} icon={AlertTriangle} color={state.threats_detected > 0 ? "danger" : "safe"} />
          <StatCard label="File Size" value={`${state.file_size_mb} MB`} icon={BarChart2} color="accent" />
          <StatCard label="Status" value={state.truncated ? "Truncated" : "Complete"} icon={CheckCircle} color={state.truncated ? "warning" : "safe"} />
        </div>

        {state.truncated && (
          <div className="glass-panel rounded-xl p-4 flex items-start gap-3 border-yellow-500/20">
            <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-400">
              File was very large — only the first 10,000,000 entries were stored. The rest were counted but not analyzed.
            </p>
          </div>
        )}

        {alerts.length > 0 && (
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              <h3 className="text-sm font-semibold text-foreground">Detected Threats ({alerts.length})</h3>
            </div>
            <div className="divide-y divide-border/50">
              {alerts.slice(0, 10).map((a) => (
                <div key={a.id} className="px-5 py-3 flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    a.risk === "high" ? "bg-destructive" :
                    a.risk === "medium" ? "bg-yellow-400" : "bg-safe"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.title || a.type || "Threat"}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.description}</p>
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${
                    a.risk === "high" ? "text-destructive" :
                    a.risk === "medium" ? "text-yellow-400" : "text-safe"
                  }`}>
                    {a.risk?.toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">{a.source}</span>
                </div>
              ))}
              {alerts.length > 10 && (
                <div className="px-5 py-2 text-xs text-muted-foreground">
                  +{alerts.length - 10} more threats
                </div>
              )}
            </div>
          </div>
        )}

        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">AI Forensic Investigation</h3>
            </div>
            {!investigation && (
              <button
                onClick={runInvestigation}
                disabled={investigating}
                data-testid="button-run-investigation"
                className="cyber-btn flex items-center gap-2 text-xs !px-4 !py-2"
              >
                {investigating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                {investigating ? "Investigating..." : "Run AI Investigation"}
              </button>
            )}
          </div>

          {investigating && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              AI is analyzing your logs for attack patterns and root causes...
            </div>
          )}

          {investigationError && (
            <p className="text-sm text-destructive">{investigationError}</p>
          )}

          {investigation && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Severity</span>
                <span className={`text-sm font-bold uppercase ${severityColor[investigation.severity] ?? "text-foreground"}`}>
                  {investigation.severity}
                </span>
              </div>

              <Section title="Executive Summary" content={investigation.summary} />
              <Section title="Attack Flow" content={investigation.attack_flow} />
              <Section title="Root Cause" content={investigation.root_cause} />
              <Section title="Attacker Intent" content={investigation.attacker_intent} />

              {investigation.affected_systems?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Affected Systems</p>
                  <div className="flex flex-wrap gap-2">
                    {investigation.affected_systems.map((s) => (
                      <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {investigation.remediation_steps?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Remediation Steps</p>
                  <ol className="space-y-2">
                    {investigation.remediation_steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                        <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {!investigation && !investigating && (
            <p className="text-sm text-muted-foreground">
              Click "Run AI Investigation" to get a detailed AI-powered analysis of attack patterns, root causes, and remediation recommendations.
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={() => navigate("/dashboard")} className="cyber-btn-outline flex items-center gap-2 text-sm">
            View Dashboard <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => navigate("/ask-ai")} className="cyber-btn flex items-center gap-2 text-sm">
            <Brain className="w-4 h-4" /> Ask AI About These Results
          </button>
        </div>
      </div>
    </Layout>
  );
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  const colorClasses: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    safe: "bg-safe/10 text-safe",
    danger: "bg-destructive/10 text-destructive",
    accent: "bg-accent/10 text-accent",
    warning: "bg-yellow-500/10 text-yellow-400",
  };
  return (
    <div className="glass-panel rounded-xl p-4 space-y-2">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[color] ?? colorClasses.primary}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      <p className="text-sm text-foreground leading-relaxed">{content}</p>
    </div>
  );
}

export default ReportPage;
