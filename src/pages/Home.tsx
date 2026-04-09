import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Upload, Activity, Bot, Send, Zap, ChevronRight } from "lucide-react";

const SUGGESTIONS = [
  "What are the most common attack patterns in my logs?",
  "Explain brute force attacks and how to detect them",
  "How do I identify port scanning activity?",
  "What does a DNS tunneling attack look like?",
];

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleAsk = () => {
    const q = query.trim();
    if (!q) return;
    navigate("/ask-ai", { state: { initialMessage: q } });
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-background dark flex flex-col">
      <header className="h-14 border-b border-border bg-card/40 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">LLM Forensic Investigator</span>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          data-testid="button-go-dashboard"
          className="cyber-btn-outline text-xs !px-3 !py-1.5 flex items-center gap-1.5"
        >
          Open Dashboard
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </header>

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
                placeholder="Ask anything about your logs or security threats..."
                rows={3}
                data-testid="input-home-query"
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/60 resize-none outline-none text-sm leading-relaxed"
              />
              <button
                onClick={handleAsk}
                data-testid="button-home-ask"
                disabled={!query.trim()}
                className="cyber-btn !px-3 self-end disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
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
