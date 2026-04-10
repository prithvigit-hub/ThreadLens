import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Paperclip, Image as ImageIcon, X, FileText } from "lucide-react";
import { api, type ChatMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AttachedFile {
  name: string;
  type: "image" | "text";
  content: string;
  dataUrl?: string;
}

interface Props {
  sessionId?: string | null;
  onSessionCreated?: (id: string, title: string) => void;
  initialMessage?: string;
  initialAttachments?: { name: string; type: "image" | "text"; dataUrl?: string }[];
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: "ai",
    content: "Hello! I'm your AI security analyst. I have live access to your logs, alerts, and threat data — ask me anything. For example: \"Summarize the threats detected\", \"What are the top suspicious IPs?\", or \"What should I do about the brute force attacks?\"",
    timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
  },
];

export function AiAnalysisPanel({ sessionId, onSessionCreated, initialMessage, initialAttachments }: Props) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState(initialMessage ?? "");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId ?? null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevSessionId = useRef<string | null | undefined>(undefined);
  const didAutoSend = useRef(false);
  const internallyCreatedSession = useRef<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialMessage && !didAutoSend.current) {
      didAutoSend.current = true;
      const ts = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
      const userMsg: ChatMessage = {
        id: `u-auto`,
        role: "user",
        content: initialAttachments && initialAttachments.length > 0
          ? (initialMessage.startsWith("Analyze the following") || initialMessage.startsWith("[Image")
              ? initialAttachments[0].name
              : initialMessage.split("\n\n--- Attached file:")[0] || initialMessage)
          : initialMessage,
        timestamp: ts,
        attachments: initialAttachments,
      };
      setMessages((prev) => {
        const updated = [...prev, userMsg];
        sendToAI(initialMessage, updated, ts);
        return updated;
      });
      setInput("");
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (prevSessionId.current === sessionId) return;
    prevSessionId.current = sessionId;

    if (sessionId && sessionId === internallyCreatedSession.current) {
      internallyCreatedSession.current = null;
      return;
    }

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

  const handleSend = async () => {
    const text = input.trim();
    const hasAttachments = attachedFiles.length > 0;
    if ((!text && !hasAttachments) || loading) return;

    let fullMessage = text;

    const textFiles = attachedFiles.filter((f) => f.type === "text");
    const imageFiles = attachedFiles.filter((f) => f.type === "image");

    if (textFiles.length > 0) {
      const fileContext = textFiles
        .map((f) => `\n\n--- Attached file: ${f.name} ---\n${f.content}`)
        .join("");
      fullMessage = (text ? text + fileContext : `Analyze the following attached file(s):${fileContext}`);
    }

    if (imageFiles.length > 0) {
      const imageNote = imageFiles.map((f) => f.content).join(" ");
      fullMessage = fullMessage ? fullMessage + "\n" + imageNote : imageNote;
    }

    const ts = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    const displayContent = text || (imageFiles.length > 0 ? imageFiles[0].content : attachedFiles[0].name);
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: displayContent,
      timestamp: ts,
      attachments: attachedFiles.map((f) => ({ name: f.name, type: f.type, dataUrl: f.dataUrl })),
    };

    setAttachedFiles([]);
    setInput("");

    setMessages((prev) => {
      const updated = [...prev, userMsg];
      sendToAI(fullMessage, updated, ts);
      return updated;
    });
  };

  const sendToAI = async (text: string, currentMessages: ChatMessage[], ts: string) => {
    setLoading(true);
    try {
      let sid = currentSessionId;

      const history = currentMessages
        .slice(0, -1)
        .filter((m) => m.role === "user" || m.role === "ai")
        .map((m) => ({ role: m.role, content: m.content }));

      const data = await api.chat(text, history.length > 0 ? history : undefined, sid ?? undefined);

      if (data.off_topic) {
        setMessages((prev) => prev.filter((m) => m.id !== currentMessages[currentMessages.length - 1].id));
        toast({
          title: "Off-topic question",
          description: "I can only answer cybersecurity and log analysis questions. Please ask something related to security.",
          variant: "destructive",
        });
        return;
      }

      if (!sid) {
        const session = await api.createChatSession(text.slice(0, 60));
        sid = session.session_id;
        internallyCreatedSession.current = sid;
        setCurrentSessionId(sid);
        onSessionCreated?.(sid, session.title);
      }

      const aiMsg: ChatMessage = { id: `ai-${Date.now()}`, role: "ai", content: data.response, timestamp: data.timestamp };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      let userMessage = "Sorry, something went wrong. Please try again.";
      if (raw.includes("rate limit") || raw.includes("Rate limit") || raw.includes("429")) {
        const waitMatch = raw.match(/Please try again in ([^.]+)/);
        const waitInfo = waitMatch ? ` Please try again in ${waitMatch[1]}.` : " Please wait a moment before trying again.";
        userMessage = `⚠️ The AI is temporarily unavailable due to a usage rate limit.${waitInfo}`;
      } else if (raw.includes("GROQ_API_KEY") || raw.includes("not configured")) {
        userMessage = "The AI service is not configured. Please ensure the GROQ_API_KEY is set correctly.";
      } else if (raw && raw !== "Internal Server Error") {
        userMessage = `Sorry, the AI encountered an error: ${raw}`;
      }
      const errMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: "ai",
        content: userMessage,
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
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {msg.attachments.map((att, idx) =>
                      att.type === "image" && att.dataUrl ? (
                        <img
                          key={idx}
                          src={att.dataUrl}
                          alt={att.name}
                          className="max-h-40 max-w-full rounded-lg object-cover border border-border"
                          data-testid={`img-attachment-${idx}`}
                        />
                      ) : (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 bg-muted/60 rounded-lg px-2 py-1 text-xs text-muted-foreground"
                          data-testid={`file-attachment-${idx}`}
                        >
                          <FileText className="w-3 h-3" />
                          {att.name}
                        </div>
                      )
                    )}
                  </div>
                )}
                {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
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

      <div className="p-3 border-t border-border space-y-2">
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1">
            {attachedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 bg-muted/60 border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                data-testid={`attachment-preview-${idx}`}
              >
                {file.type === "image" && file.dataUrl ? (
                  <img src={file.dataUrl} alt={file.name} className="h-5 w-5 rounded object-cover" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-primary" />
                )}
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button
                  onClick={() => removeAttachment(idx)}
                  className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid={`button-remove-attachment-${idx}`}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageAttach}
            data-testid="input-image-upload"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,.txt"
            className="hidden"
            onChange={handleFileAttach}
            data-testid="input-file-upload"
          />

          <button
            onClick={() => imageInputRef.current?.click()}
            className="cyber-btn !px-2.5 shrink-0"
            title="Attach image"
            disabled={loading || loadingHistory}
            data-testid="button-attach-image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="cyber-btn !px-2.5 shrink-0"
            title="Attach CSV, JSON or TXT file"
            disabled={loading || loadingHistory}
            data-testid="button-attach-file"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={input}
            data-testid="input-chat-message"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={attachedFiles.length > 0 ? "Add a message or send as-is..." : "Ask AI about logs..."}
            className="cyber-input flex-1 text-sm"
            disabled={loading || loadingHistory}
          />
          <button
            onClick={handleSend}
            data-testid="button-send-message"
            className="cyber-btn !px-3"
            disabled={(loading || loadingHistory) || (!input.trim() && attachedFiles.length === 0)}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
