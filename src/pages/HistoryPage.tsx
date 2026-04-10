import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { api, type Session } from "@/lib/api";
import { History as HistoryIcon, ChevronRight, AlertTriangle, FileText } from "lucide-react";

const HistoryPage = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSessions()
      .then((data) => { if (data.sessions?.length) setSessions(data.sessions); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <HistoryIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Session History</h2>
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading…" : `${sessions.length} previous session${sessions.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="glass-panel rounded-xl p-10 flex items-center justify-center">
            <p className="text-sm text-muted-foreground animate-pulse">Loading sessions…</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="glass-panel rounded-xl p-10 flex flex-col items-center justify-center gap-3 text-center">
            <HistoryIcon className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground/60">No sessions yet</p>
            <p className="text-xs text-muted-foreground/40">Your analysis history will appear here after you upload log files</p>
          </div>
        ) : (
        <div className="space-y-3">
          {sessions.map((session, i) => (
            <div
              key={session.id}
              className="glass-panel rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-all duration-200 cursor-pointer animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Session — {session.date}</p>
                <p className="text-xs text-muted-foreground">
                  {session.duration} · {session.logsAnalyzed.toLocaleString()} logs
                </p>
              </div>
              <div className="flex items-center gap-2">
                {session.threatsDetected > 0 && (
                  <div className="flex items-center gap-1 text-xs text-destructive">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {session.threatsDetected}
                  </div>
                )}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    session.status === "in-progress"
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {session.status === "in-progress" ? "Active" : "Completed"}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </div>
        )}
      </div>
    </Layout>
  );
};

export default HistoryPage;
