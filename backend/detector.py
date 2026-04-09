from collections import defaultdict
from datetime import datetime
from typing import List


def _hour(ts: str) -> int:
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(ts[:19], fmt).hour
        except ValueError:
            pass
    return -1


def detect_threats(logs: list[dict]) -> list[dict]:
    alerts = []
    failed_logins: dict = defaultdict(list)
    access_by_ip: dict = defaultdict(list)
    sequence_by_ip: dict = defaultdict(list)

    for log in logs:
        ip = log.get("ip", "unknown")
        ts = log.get("timestamp", "")
        status = log.get("status", "")
        event = log.get("event", "")
        raw = log.get("raw", "")

        if event == "login" and status == "failed":
            failed_logins[ip].append(ts)

        access_by_ip[ip].append(log)
        sequence_by_ip[ip].append(status)

    # Rule 1: Brute Force – more than 5 failed logins from same IP
    for ip, timestamps in failed_logins.items():
        if len(timestamps) > 5:
            alerts.append({
                "type": "Brute Force Attack",
                "ip": ip,
                "risk": "high",
                "timestamp": timestamps[-1],
                "description": f"{len(timestamps)} failed login attempts detected from {ip}",
                "resolved": False,
                "title": "Brute Force Attack Detected",
            })

    # Rule 2: Suspicious Access – /admin or sensitive paths
    for ip, ip_logs in access_by_ip.items():
        for log in ip_logs:
            raw = log.get("raw", "")
            if any(p in raw.lower() for p in ["/admin", "/etc/passwd", "/etc/shadow", "id_rsa", ".env"]):
                alerts.append({
                    "type": "Suspicious Access",
                    "ip": ip,
                    "risk": "high",
                    "timestamp": log.get("timestamp"),
                    "description": f"Access to sensitive path detected from {ip}: {raw[:80]}",
                    "resolved": False,
                    "title": "Suspicious Path Access",
                })

    # Rule 3: Unusual Activity – logins at odd hours (0:00–5:00)
    for log in logs:
        h = _hour(log.get("timestamp", ""))
        if 0 <= h < 5 and log.get("event") == "login":
            alerts.append({
                "type": "Unusual Activity",
                "ip": log.get("ip"),
                "risk": "medium",
                "timestamp": log.get("timestamp"),
                "description": f"Login attempt at unusual hour ({h:02d}:xx) from {log.get('ip')}",
                "resolved": False,
                "title": "Unusual Hour Login",
            })

    # Rule 4: Sequence Detection – fail → fail → success (possible compromise)
    for ip, seq in sequence_by_ip.items():
        for i in range(len(seq) - 2):
            if seq[i] == "failed" and seq[i + 1] == "failed" and seq[i + 2] == "success":
                ts = access_by_ip[ip][i + 2].get("timestamp") if i + 2 < len(access_by_ip[ip]) else ""
                alerts.append({
                    "type": "Possible Compromise",
                    "ip": ip,
                    "risk": "high",
                    "timestamp": ts,
                    "description": f"Failed-Failed-Success login sequence from {ip} — possible credential compromise",
                    "resolved": False,
                    "title": "Possible Credential Compromise",
                })
                break

    # Deduplicate by ip+type
    seen = set()
    unique = []
    for a in alerts:
        key = (a["ip"], a["type"])
        if key not in seen:
            seen.add(key)
            unique.append(a)
    return unique
