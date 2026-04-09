import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { api, type ChatMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Props {
  sessionId?: string | null;
  onSessionCreated?: (id: string, title: string) => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: "ai",
    content: "Hello! I'm your AI security analyst. Ask me anything about your logs, threats, or security events.",
    timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
  },
];

export function AiAnalysisPanel({ sessionId, onSessionCreated }: Props) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId ?? null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevSessionId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (prevSessionId.current === sessionId) return;
    prevSessionId.current = sessionId;

    if (!sessionId) {
      setMessages(INITIAL_MESSAGES);
      setCurrentSessionId(null);
      return;
    }

    setCurrentSessionId(sessionId);
    setLoadingHistory(true);
    api.getChatSession(sessionId)
      .then((data) => {
        if (data.messages && data.messages.length > 0) {
          setMessages(
            data.messages.map((m, i) => ({ ...m, id: `hist-${i}` }))
          );
        } else {
          setMessages(INITIAL_MESSAGES);
        }
      })
      .catch(() => setMessages(INITIAL_MESSAGES))
      .finally(() => setLoadingHistory(false));
  }, [sessionId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const ts = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text, timestamp: ts };

    setMessages((prev) => {
      const updated = [...prev, userMsg];
      sendToAI(text, updated, ts);
      return updated;
    });
    setInput("");
  };

  const sendToAI = async (text: string, currentMessages: ChatMessage[], ts: string) => {
    setLoading(true);
    try {
      let sid = currentSessionId;

      // Pass all prior messages (excluding the current user message) as history
      const history = currentMessages
        .slice(0, -1)
        .filter((m) => m.role === "user" || m.role === "ai")
        .map((m) => ({ role: m.role, content: m.content }));

      const data = await api.chat(text, history.length > 0 ? history : undefined, sid ?? undefined);

      // Off-topic: remove the user message and show warning
      if (data.off_topic) {
        setMessages((prev) => prev.filter((m) => m.id !== currentMessages[currentMessages.length - 1].id));
        toast({
          title: "Off-topic question",
          description: "I can only answer cybersecurity and log analysis questions. Please ask something related to security.",
          variant: "destructive",
        });
        return;
      }

      // Only create a session after a valid domain answer
      if (!sid) {
        const session = await api.createChatSession(text.slice(0, 60));
        sid = session.session_id;
        setCurrentSessionId(sid);
        onSessionCreated?.(sid, session.title);
      }

      const aiMsg: ChatMessage = { id: `ai-${Date.now()}`, role: "ai", content: data.response, timestamp: data.timestamp };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: "ai",
        content: "Sorry, the AI service is unavailable right now. Please ensure the GROQ_API_KEY is set correctly.",
        timestamp: ts,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-xl flex flex-col flex-1 h-full animate-fade-in">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Bot className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">AI Analysis</h3>
        {(loading || loadingHistory) && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin ml-auto" />}
      </div>

      <div className="flex-1 overflow-auto scrollbar-cyber p-4 space-y-4">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading chat history...</span>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={msg.id ?? i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === "ai" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
                }`}
              >
                {msg.role === "ai" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div
                className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                  msg.role === "ai" ? "bg-muted/50 text-foreground" : "bg-primary/20 text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{msg.timestamp}</p>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-primary/15 text-primary">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-muted/50 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Analyzing...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            data-testid="input-chat-message"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask AI about logs..."
            className="cyber-input flex-1 text-sm"
            disabled={loading || loadingHistory}
          />
          <button
            onClick={handleSend}
            data-testid="button-send-message"
            className="cyber-btn !px-3"
            disabled={loading || loadingHistory}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
