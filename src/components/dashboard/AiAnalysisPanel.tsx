import { useState } from "react";
import { Send, Bot, User } from "lucide-react";
import { mockChatMessages, type ChatMessage } from "@/data/mockData";

export function AiAnalysisPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "ai",
        content: "I'm analyzing your query against the current log data. Based on the patterns I've identified, the suspicious activity appears to originate from a coordinated attack. I recommend reviewing the firewall rules and implementing rate limiting on the affected endpoints.",
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 1500);
  };

  return (
    <div className="glass-panel rounded-xl flex flex-col h-[400px] animate-fade-in">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Bot className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">AI Analysis</h3>
      </div>

      <div className="flex-1 overflow-auto scrollbar-cyber p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                msg.role === "ai" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
              }`}
            >
              {msg.role === "ai" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div
              className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                msg.role === "ai"
                  ? "bg-muted/50 text-foreground"
                  : "bg-primary/20 text-foreground"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{msg.timestamp}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask AI about logs..."
            className="cyber-input flex-1 text-sm"
          />
          <button onClick={handleSend} className="cyber-btn !px-3">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
