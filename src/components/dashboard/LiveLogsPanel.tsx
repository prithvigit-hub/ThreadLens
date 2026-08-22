import { useEffect, useState, useRef } from "react";
import { api, type LogEntry } from "@/lib/api";
import { generateLogEntry } from "@/data/mockData";
import { Activity } from "lucide-react";

function toApiLog(l: ReturnType<typeof generateLogEntry>): LogEntry {
  return { ...l, status: "unknown", risk: "low", raw: "" };
}

interface Props {
  isActive?: boolean;
}

export function LiveLogsPanel({ isActive = true }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) {
      setLogs([]);
      return;
    }

    const poll = async () => {
      try {
        const data = await api.getLiveLogs(15);
        if (data.logs?.length) {
          setLogs((prev) => {
            const ids = new Set(prev.map((l) => l.id));
            const fresh = data.logs.filter((l) => !ids.has(l.id));
            if (!fresh.length) return prev;
            return [...fresh, ...prev].slice(0, 100);
          });
          return;
        }
      } catch {
        // Fall back to the local demo stream when the API is unavailable.
      }
      const newLog = toApiLog(generateLogEntry(Date.now() + Math.floor(Math.random() * 10000)));
      setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="glass-panel rounded-xl flex flex-col h-[400px] animate-fade-in">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isActive ? "bg-safe animate-pulse" : "bg-muted-foreground/40"}`} />
          <h3 className="text-sm font-semibold text-foreground">Live Log Stream</h3>
        </div>
        <span className="text-xs text-muted-foreground">{isActive ? `${logs.length} entries` : "Disconnected"}</span>
      </div>

      {!isActive ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-6">
          <Activity className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground/60">No live data</p>
          <p className="text-xs text-muted-foreground/40">Start monitoring to connect to the log stream</p>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-auto scrollbar-cyber p-1">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-muted-foreground animate-pulse">Waiting for log events…</p>
            </div>
          ) : (
            logs.map((log, i) => (
              <div
                key={log.id}
                className={`log-entry ${log.suspicious ? "log-entry-suspicious" : ""} ${i === 0 ? "animate-log-appear" : ""}`}
              >
                <span className="text-muted-foreground">{log.timestamp}</span>
                <span className="mx-2 text-accent">{log.ip}</span>
                <span className={log.suspicious ? "text-destructive font-medium" : "text-foreground"}>
                  {log.event}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
