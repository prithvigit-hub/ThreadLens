import { useEffect, useState, useRef } from "react";
import { api, type LogEntry } from "@/lib/api";
import { generateLogEntry, generateInitialLogs } from "@/data/mockData";

function toApiLog(l: ReturnType<typeof generateLogEntry>): LogEntry {
  return { ...l, status: "unknown", risk: "low", raw: "" };
}

export function LiveLogsPanel() {
  const [logs, setLogs] = useState<LogEntry[]>(() => generateInitialLogs(30).map(toApiLog));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
      } catch (_) {}
      const newLog = toApiLog(generateLogEntry(Date.now() + Math.floor(Math.random() * 10000)));
      setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel rounded-xl flex flex-col h-[400px] animate-fade-in">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
          <h3 className="text-sm font-semibold text-foreground">Live Log Stream</h3>
        </div>
        <span className="text-xs text-muted-foreground">{logs.length} entries</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-auto scrollbar-cyber p-1">
        {logs.map((log, i) => (
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
        ))}
      </div>
    </div>
  );
}
