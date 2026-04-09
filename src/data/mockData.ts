export interface LogEntry {
  id: string;
  timestamp: string;
  ip: string;
  event: string;
  level: "info" | "warning" | "error" | "critical";
  suspicious: boolean;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  risk: "low" | "medium" | "high";
  timestamp: string;
  source: string;
  resolved: boolean;
}

export interface Session {
  id: string;
  date: string;
  logsAnalyzed: number;
  threatsDetected: number;
  duration: string;
  status: "completed" | "in-progress";
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

const events = [
  "SSH login attempt",
  "Failed authentication",
  "Port scan detected",
  "Firewall rule triggered",
  "Suspicious outbound connection",
  "Privilege escalation attempt",
  "Brute force detected",
  "Malware signature match",
  "DNS tunneling suspected",
  "Unauthorized file access",
  "Normal HTTP request",
  "Database query executed",
  "User session created",
  "Config file modified",
  "Service restarted",
  "Backup completed",
  "Certificate renewed",
  "API rate limit warning",
];

const ips = [
  "192.168.1.105", "10.0.0.42", "172.16.0.88", "45.33.32.156",
  "203.0.113.50", "198.51.100.23", "192.0.2.1", "185.220.101.34",
  "91.219.236.222", "178.128.0.12",
];

const suspiciousEvents = new Set([
  "Port scan detected", "Suspicious outbound connection",
  "Privilege escalation attempt", "Brute force detected",
  "Malware signature match", "DNS tunneling suspected",
  "Failed authentication",
]);

export function generateLogEntry(index: number): LogEntry {
  const event = events[Math.floor(Math.random() * events.length)];
  const isSuspicious = suspiciousEvents.has(event);
  const now = new Date();
  now.setSeconds(now.getSeconds() - index * Math.floor(Math.random() * 5 + 1));

  return {
    id: `log-${Date.now()}-${index}`,
    timestamp: now.toISOString().replace("T", " ").substring(0, 19),
    ip: ips[Math.floor(Math.random() * ips.length)],
    event,
    level: isSuspicious
      ? Math.random() > 0.5 ? "critical" : "error"
      : Math.random() > 0.7 ? "warning" : "info",
    suspicious: isSuspicious,
  };
}

export function generateInitialLogs(count: number): LogEntry[] {
  return Array.from({ length: count }, (_, i) => generateLogEntry(i));
}

export const mockAlerts: Alert[] = [
  { id: "a1", title: "Brute Force Attack Detected", description: "Multiple failed SSH login attempts from IP 185.220.101.34. Over 200 attempts in the last 5 minutes.", risk: "high", timestamp: "2026-04-09 14:23:01", source: "185.220.101.34", resolved: false },
  { id: "a2", title: "Suspicious DNS Queries", description: "Unusual DNS query patterns detected suggesting possible data exfiltration through DNS tunneling.", risk: "high", timestamp: "2026-04-09 14:18:44", source: "10.0.0.42", resolved: false },
  { id: "a3", title: "Port Scan Activity", description: "Sequential port scanning detected from external IP. Ports 1-1024 being probed.", risk: "medium", timestamp: "2026-04-09 14:10:22", source: "45.33.32.156", resolved: false },
  { id: "a4", title: "Unauthorized Config Change", description: "Firewall configuration modified outside of maintenance window.", risk: "medium", timestamp: "2026-04-09 13:55:11", source: "192.168.1.105", resolved: true },
  { id: "a5", title: "API Rate Limit Exceeded", description: "API endpoint /api/v2/users exceeded rate limit threshold by 300%.", risk: "low", timestamp: "2026-04-09 13:40:08", source: "203.0.113.50", resolved: true },
];

export const mockSessions: Session[] = [
  { id: "s1", date: "2026-04-09", logsAnalyzed: 15420, threatsDetected: 8, duration: "2h 15m", status: "in-progress" },
  { id: "s2", date: "2026-04-08", logsAnalyzed: 42100, threatsDetected: 3, duration: "6h 30m", status: "completed" },
  { id: "s3", date: "2026-04-07", logsAnalyzed: 38750, threatsDetected: 12, duration: "8h 00m", status: "completed" },
  { id: "s4", date: "2026-04-06", logsAnalyzed: 29800, threatsDetected: 1, duration: "5h 45m", status: "completed" },
  { id: "s5", date: "2026-04-05", logsAnalyzed: 51200, threatsDetected: 7, duration: "10h 20m", status: "completed" },
  { id: "s6", date: "2026-04-04", logsAnalyzed: 33600, threatsDetected: 5, duration: "7h 10m", status: "completed" },
];

export const mockChatMessages: ChatMessage[] = [
  { id: "c1", role: "ai", content: "I've detected a brute force attack pattern from IP 185.220.101.34. The attacker has attempted over 200 SSH login attempts in the past 5 minutes using common username/password combinations.", timestamp: "14:23" },
  { id: "c2", role: "ai", content: "**Recommended Actions:**\n1. Block IP 185.220.101.34 at firewall level\n2. Enable fail2ban if not already active\n3. Review SSH key-only authentication policy\n4. Check if any credentials were compromised", timestamp: "14:23" },
];
