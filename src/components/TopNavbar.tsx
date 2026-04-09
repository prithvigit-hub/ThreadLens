import { useNavigate } from "react-router-dom";
import { Upload, Settings, ShieldCheck, ShieldAlert, Home } from "lucide-react";

interface TopNavbarProps {
  threatDetected?: boolean;
}

export function TopNavbar({ threatDetected = false }: TopNavbarProps) {
  const navigate = useNavigate();

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-semibold text-foreground hidden sm:block">LLM-Powered Log Forensic Investigator</h2>
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all ${
            threatDetected
              ? "bg-destructive/15 text-destructive glow-danger"
              : "bg-safe/15 text-safe"
          }`}
        >
          {threatDetected ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Threats Detected</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Safe</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title="Home"
        >
          <Home className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate("/analyze")}
          className="cyber-btn flex items-center gap-2 text-xs !px-3 !py-1.5"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Logs
        </button>
        <button
          onClick={() => navigate("/settings")}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
