import { useEffect, useState, useRef } from "react";
import { generateLogEntry, type LogEntry } from "@/data/mockData";
import { generateInitialLogs } from "@/data/mockData";

export function LiveLogsPanel() {
  const [logs, setLogs] = useState<LogEntry[]>(() => generateInitialLogs(30));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs((prev) => {
        const newLog = generateLogEntry(0);
        return [newLog, ...prev.slice(0, 99)];
      });
    }, 2000);
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
