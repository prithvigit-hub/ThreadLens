import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Shield, Upload, Activity, Bot, Send, Zap, ChevronRight,
  Image as ImageIcon, Paperclip, X, FileText,
  LayoutDashboard, LogOut, User, History,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AttachedFile {
  name: string;
  type: "image" | "text";
  content: string;
  dataUrl?: string;
}

const SUGGESTIONS = [
  "What are the most common attack patterns in my logs?",
  "Explain brute force attacks and how to detect them",
  "How do I identify port scanning activity?",
  "What does a DNS tunneling attack look like?",
];

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAsk = () => {
    const q = query.trim();
    const hasAttachments = attachedFiles.length > 0;
    if (!q && !hasAttachments) return;

    const textFiles = attachedFiles.filter((f) => f.type === "text");
    const imageFiles = attachedFiles.filter((f) => f.type === "image");

    let fullMessage = q;
    if (textFiles.length > 0) {
      const fileContext = textFiles
        .map((f) => `\n\n--- Attached file: ${f.name} ---\n${f.content}`)
        .join("");
      fullMessage = q ? q + fileContext : `Analyze the following attached file(s):${fileContext}`;
    }
    if (imageFiles.length > 0 && !fullMessage) {
      fullMessage = imageFiles.map((f) => f.content).join(" ");
    }

    navigate("/ask-ai", {
      state: {
        initialMessage: fullMessage,
        initialAttachments: attachedFiles.map((f) => ({
          name: f.name,
          type: f.type,
          dataUrl: f.dataUrl,
        })),
      },
    });
  };

  const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setAttachedFiles((prev) => [
        ...prev,
        { name: file.name, type: "image", content: `[Image attached: ${file.name}]`, dataUrl },
      ]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [".csv", ".json", ".txt"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      toast({ title: "Unsupported file", description: "Only .csv, .json, and .txt files are supported.", variant: "destructive" });
      return;
    }
    if (file.size > 500 * 1024) {
      toast({ title: "File too large", description: "Please attach files smaller than 500 KB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setAttachedFiles((prev) => [
        ...prev,
        { name: file.name, type: "text", content },
      ]);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const canSend = query.trim().length > 0 || attachedFiles.length > 0;

  return (
    <div className="min-h-screen bg-background dark flex flex-col">

      {/* ── Brand bar ── */}
      <header className="h-14 border-b border-border bg-card/40 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-foreground tracking-tight">Thread Lens</span>
            <span className="text-[10px] font-medium text-primary/80 uppercase tracking-widest hidden sm:block">Security</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-medium text-foreground text-xs">{user?.name ?? "Analyst"}</span>
          </div>
          <button
            onClick={handleLogout}
            data-testid="button-home-logout"
            title="Sign out"
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── Navigation bar ── */}
      <nav className="h-11 border-b border-border bg-card/20 backdrop-blur-sm flex items-center px-6 gap-1 shrink-0">
        {/* Group: Monitor & Ingest */}
        <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mr-1 hidden sm:block">Monitor</span>
        <NavBtn icon={Upload} label="Upload Logs" onClick={() => navigate("/analyze")} testId="nav-upload-logs" />
        <NavBtn icon={Activity} label="Live Monitoring" onClick={() => navigate("/monitoring")} testId="nav-live-monitoring" dot />

        <div className="w-px h-5 bg-border mx-2 shrink-0" />

        {/* Group: Investigate */}
        <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mr-1 hidden sm:block">Investigate</span>
        <NavBtn icon={Bot} label="Ask AI" onClick={() => navigate("/ask-ai")} testId="nav-ask-ai" />
        <NavBtn icon={History} label="History" onClick={() => navigate("/history")} testId="nav-history" />

        <div className="w-px h-5 bg-border mx-2 shrink-0" />

        {/* Group: Overview */}
        <NavBtn
          icon={LayoutDashboard}
          label="Dashboard"
          onClick={() => navigate("/dashboard")}
          testId="nav-dashboard"
          primary
        />
      </nav>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-10">
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold text-foreground">
              {greeting}, {user?.name ?? "Analyst"}
            </h1>
            <p className="text-muted-foreground">What would you like to investigate today?</p>
          </div>

          <div className="glass-panel rounded-2xl p-4 space-y-3">
            <div className="flex gap-2">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
                placeholder={attachedFiles.length > 0 ? "Add a message or send as-is..." : "Ask anything about your logs or security threats..."}
                rows={3}
                data-testid="input-home-query"
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/60 resize-none outline-none text-sm leading-relaxed"
              />
              <div className="flex flex-col gap-1.5 self-end">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  data-testid="button-home-attach-image"
                  title="Attach image"
                  className="cyber-btn !px-2.5 !py-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-home-attach-file"
                  title="Attach CSV, JSON or TXT file"
                  className="cyber-btn !px-2.5 !py-1.5"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleAsk}
                  data-testid="button-home-ask"
                  disabled={!canSend}
                  className="cyber-btn !px-2.5 !py-1.5 disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 bg-muted/60 border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                    data-testid={`home-attachment-preview-${idx}`}
                  >
                    {file.type === "image" && file.dataUrl ? (
                      <img src={file.dataUrl} alt={file.name} className="h-5 w-5 rounded object-cover" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-primary" />
                    )}
                    <span className="max-w-[140px] truncate">{file.name}</span>
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors"
                      data-testid={`button-home-remove-attachment-${idx}`}
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={`flex flex-wrap gap-2 ${attachedFiles.length === 0 ? "border-t border-border pt-3" : ""}`}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageAttach} data-testid="input-home-image-upload" />
          <input ref={fileInputRef} type="file" accept=".csv,.json,.txt" className="hidden" onChange={handleFileAttach} data-testid="input-home-file-upload" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ActionCard
              icon={Upload}
              title="Upload Logs"
              description="Parse and analyze log files up to 10 GB with threat detection"
              color="primary"
              onClick={() => navigate("/analyze")}
              testId="card-upload-logs"
            />
            <ActionCard
              icon={Activity}
              title="Live Monitoring"
              description="Stream real-time logs and detect threats as they happen"
              color="safe"
              onClick={() => navigate("/monitoring")}
              testId="card-live-monitoring"
            />
            <ActionCard
              icon={Bot}
              title="Ask AI"
              description="Chat with your AI security analyst about any threat or log"
              color="accent"
              onClick={() => navigate("/ask-ai")}
              testId="card-ask-ai"
            />
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate("/dashboard")}
              data-testid="button-view-dashboard"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Zap className="w-4 h-4 text-primary" />
              View full security dashboard
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

interface NavBtnProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  testId: string;
  primary?: boolean;
  dot?: boolean;
}

function NavBtn({ icon: Icon, label, onClick, testId, primary, dot }: NavBtnProps) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 ${
        primary
          ? "bg-primary/15 text-primary hover:bg-primary/25"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="hidden sm:block">{label}</span>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-safe pulse-dot ml-0.5" />}
    </button>
  );
}

interface ActionCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: "primary" | "safe" | "accent";
  onClick: () => void;
  testId: string;
}

const colorMap = {
  primary: "bg-primary/10 text-primary group-hover:bg-primary/20",
  safe: "bg-safe/10 text-safe group-hover:bg-safe/20",
  accent: "bg-accent/10 text-accent group-hover:bg-accent/20",
};

function ActionCard({ icon: Icon, title, description, color, onClick, testId }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className="group glass-panel rounded-xl p-5 text-left hover:border-primary/40 transition-all duration-200 space-y-3 w-full"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
        Get started <ChevronRight className="w-3 h-3" />
      </div>
    </button>
  );
}

export default Home;
