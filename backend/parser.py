import re
from datetime import datetime
from typing import Optional

IP_RE = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
TS_PATTERNS = [
    re.compile(r"\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}"),
    re.compile(r"\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}"),
    re.compile(r"\d{2}/\w{3}/\d{4}:\d{2}:\d{2}:\d{2}"),
    re.compile(r"\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}:\d{2}"),
]

LOGIN_RE = re.compile(r"(login|ssh|auth|sshd|logon)", re.I)
ACCESS_RE = re.compile(r"(access|GET|POST|PUT|DELETE|request|http)", re.I)
ERROR_RE = re.compile(r"(error|fail|denied|reject|invalid|bad|wrong|timeout)", re.I)
FAILED_RE = re.compile(r"(fail|denied|reject|invalid|error|wrong|bad password|unauthorized)", re.I)
SUCCESS_RE = re.compile(r"(success|accept|ok|opened|granted|logged in|authenticated)", re.I)
SUSPICIOUS_KEYWORDS = [
    "brute force", "port scan", "malware", "exploit", "injection", "dns tunnel",
    "privilege escalation", "suspicious", "unauthorized", "backdoor", "rootkit",
]
ADMIN_RE = re.compile(r"(/admin|/root|/etc/passwd|/etc/shadow|\.env|id_rsa|\.htaccess)", re.I)


def extract_ip(line: str) -> Optional[str]:
    m = IP_RE.search(line)
    return m.group() if m else None


def extract_timestamp(line: str) -> str:
    for pat in TS_PATTERNS:
        m = pat.search(line)
        if m:
            return m.group()
    return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")


def extract_event_type(line: str) -> str:
    if LOGIN_RE.search(line):
        return "login"
    if ACCESS_RE.search(line):
        return "access"
    if ERROR_RE.search(line):
        return "error"
    return "unknown"


def extract_status(line: str) -> str:
    if FAILED_RE.search(line):
        return "failed"
    if SUCCESS_RE.search(line):
        return "success"
    return "unknown"


def assess_initial_risk(line: str, status: str, event: str) -> str:
    lower = line.lower()
    if any(kw in lower for kw in SUSPICIOUS_KEYWORDS):
        return "high"
    if ADMIN_RE.search(line):
        return "high"
    if status == "failed" and event == "login":
        return "medium"
    if status == "failed":
        return "medium"
    return "low"


def parse_line(line: str) -> Optional[dict]:
    line = line.strip()
    if not line:
        return None
    ip = extract_ip(line)
    timestamp = extract_timestamp(line)
    event = extract_event_type(line)
    status = extract_status(line)
    risk = assess_initial_risk(line, status, event)
    return {
        "timestamp": timestamp,
        "ip": ip or "unknown",
        "event": event,
        "status": status,
        "risk": risk,
        "raw": line,
        "suspicious": risk in ("high", "medium"),
        "level": "critical" if risk == "high" else ("error" if status == "failed" else "info"),
    }


def parse_logs(content: str) -> list[dict]:
    lines = content.splitlines()
    results = []
    for line in lines:
        parsed = parse_line(line)
        if parsed:
            results.append(parsed)
    return results
