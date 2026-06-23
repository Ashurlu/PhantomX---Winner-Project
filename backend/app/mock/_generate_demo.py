"""One-shot generator for cohesive medium demo dataset. Run from backend/app/mock/."""
from __future__ import annotations

import json
from pathlib import Path

MOCK = Path(__file__).parent
ROOT = MOCK.parent.parent.parent

# ── AI Court true positives (14) ─────────────────────────────────────────────
AI_COURT = [
    {"alertId": "A-1310", "title": "Mass file rename consistent with ransomware", "severity": "critical", "confidence": 0.95, "rec": "Isolate segment, trigger IR playbook", "case": "PX-C034463"},
    {"alertId": "A-1042", "title": "Encoded PowerShell on HR-DC01", "severity": "high", "confidence": 0.92, "rec": "Isolate host, reset creds", "case": "PX-D034461"},
    {"alertId": "A-1190", "title": "LSASS memory access by non-standard process", "severity": "critical", "confidence": 0.97, "rec": "Isolate, dump triage, rotate creds", "case": "PX-D034482"},
    {"alertId": "A-1455", "title": "DCSync replication request from non-DC host", "severity": "critical", "confidence": 0.94, "rec": "Disable account, reset krbtgt", "case": "PX-D034471"},
    {"alertId": "A-1420", "title": "CEO impersonation wire-transfer request", "severity": "high", "confidence": 0.89, "rec": "Block transfer, notify legal", "case": "PX-D034470"},
    {"alertId": "A-1502", "title": "SQL injection attempts on customer portal", "severity": "high", "confidence": 0.86, "rec": "WAF block, patch input validation", "case": "PX-D034473"},
    {"alertId": "A-1377", "title": "Outbound beacon to known C2 range", "severity": "high", "confidence": 0.90, "rec": "Block egress, isolate host", "case": "INC-0034454"},
    {"alertId": "A-1205", "title": "Impossible travel for finance admin", "severity": "high", "confidence": 0.88, "rec": "Force re-auth, lock session", "case": "PX-D034458"},
    {"alertId": "A-1088", "title": "Suspicious OAuth grant to unknown app", "severity": "medium", "confidence": 0.81, "rec": "Revoke token, review consent", "case": "PX-D034459"},
    {"alertId": "A-1488", "title": "MFA push fatigue — 12 denied attempts", "severity": "medium", "confidence": 0.83, "rec": "Lock account, force password reset", "case": "PX-D034472"},
    {"alertId": "A-1233", "title": "Scheduled task persistence on WKS-204", "severity": "medium", "confidence": 0.79, "rec": "Remove task, hunt siblings", "case": "PX-D034455"},
    {"alertId": "A-1510", "title": "Sensitive data copied to USB device", "severity": "medium", "confidence": 0.77, "rec": "Collect device, DLP review", "case": "PX-D034474"},
    {"alertId": "A-1402", "title": "Kerberoasting-style ticket requests", "severity": "medium", "confidence": 0.76, "rec": "Rotate service account, monitor", "case": "PX-D034456"},
    {"alertId": "A-1388", "title": "Mailbox rule forwarding to external domain", "severity": "high", "confidence": 0.91, "rec": "Remove rule, revoke session", "case": "PX-D034465"},
]

RULES_META = [
    ("R-26", "Mass file rename / ransomware canary", "A-1310", "PX-C034463", "critical", "incident-response", "approved", "admin", "Detects high-velocity file renames + shadow copy deletion (A-1310)."),
    ("R-21", "Encoded PowerShell from Office parent", "A-1042", "PX-D034461", "high", "incident-response", "pending", None, "PowerShell -enc from Office parent (A-1042, T1059.001)."),
    ("R-23", "LSASS credential access via comsvcs.dll", "A-1190", "PX-D034482", "critical", "ad", "approved", "admin", "comsvcs.dll MiniDump of lsass (A-1190, T1003.001)."),
    ("R-30", "DCSync from non-domain-controller", "A-1455", "PX-D034471", "critical", "ad", "pending", None, "Replication GetChanges from workstation (A-1455, T1003.006)."),
    ("R-29", "Executive impersonation financial request", "A-1420", "PX-D034470", "high", "incident-response", "pending", None, "Urgent wire transfer language in email (A-1420)."),
    ("R-32", "SQL injection on web tier", "A-1502", "PX-D034473", "high", "incident-response", "pending", None, "UNION SELECT / xp_cmdshell patterns (A-1502)."),
    ("R-27", "Periodic C2 beacon detection", "A-1377", "INC-0034454", "high", "incident-response", "approved", "admin", "Regular outbound to TI-listed ranges (A-1377)."),
    ("R-24", "Impossible travel for privileged accounts", "A-1205", "PX-D034458", "high", "ad", "pending", None, "Geo-impossible sign-in for finance admin (A-1205)."),
    ("R-22", "Suspicious OAuth consent to unverified app", "A-1088", "PX-D034459", "medium", "ad", "pending", None, "High-privilege scopes to unverified app (A-1088)."),
    ("R-31", "MFA push fatigue threshold", "A-1488", "PX-D034472", "medium", "ad", "pending", None, ">8 denied MFA pushes in 10m (A-1488)."),
    ("R-25", "Scheduled task persistence from TEMP", "A-1233", "PX-D034455", "medium", "incident-response", "rejected", "admin", "schtasks from temp path (A-1233) — rejected as noisy."),
    ("R-33", "USB exfiltration of sensitive labels", "A-1510", "PX-D034474", "medium", "incident-response", "pending", None, "DLP + USB copy of Confidential files (A-1510)."),
    ("R-28", "Kerberoasting bulk RC4 TGS requests", "A-1402", "PX-D034456", "medium", "ad", "pending", None, "Many RC4 TGS requests (A-1402, T1558.003)."),
    ("R-34", "External mailbox auto-forward rule", "A-1388", "PX-D034465", "high", "ad", "approved", "analyst", "Hidden forward to consumer domain (A-1388)."),
    ("R-35", "RDP brute force from TOR exit", "A-1395", "PX-D034466", "medium", "incident-response", "approved", "admin", ">20 RDP failures from TOR (A-1395)."),
    ("R-36", "Insider staging to personal cloud", "A-1412", "PX-D034467", "high", "incident-response", "rejected", "analyst", "Large upload to personal OneDrive (A-1412)."),
]

CASES = [
    {"id": "PX-C034463", "title": "Ransomware Behavior Detected on Finance Workstation", "severity": "critical", "status": "open", "tags": ["ransomware", "endpoint"], "assignee": {"initials": "BM", "name": "Ben Miller"}, "alert": "A-1310", "rule": "R-26", "created": "2026-06-20T02:14:00Z", "elapsed": 4, "tasks": [0, 5], "flags": 1},
    {"id": "PX-D034461", "title": "Suspicious PowerShell Execution Detected", "severity": "high", "status": "open", "tags": ["credential-access", "powershell"], "assignee": None, "alert": "A-1042", "rule": "R-21", "created": "2026-06-20T01:42:00Z", "elapsed": 5, "tasks": [1, 4], "flags": 0},
    {"id": "PX-D034470", "title": "CEO Wire Transfer Phishing Attempt", "severity": "high", "status": "open", "tags": ["phishing", "bec"], "assignee": None, "alert": "A-1420", "rule": "R-29", "created": "2026-06-20T00:30:00Z", "elapsed": 6, "tasks": [0, 4], "flags": 1},
    {"id": "PX-D034458", "title": "Anomalous Login from New Geographic Location", "severity": "low", "status": "open", "tags": ["identity"], "assignee": {"initials": "JD", "name": "John Doe"}, "alert": "A-1205", "rule": "R-24", "created": "2026-06-19T22:30:00Z", "elapsed": 8, "tasks": [2, 3], "flags": 0},
    {"id": "PX-D034472", "title": "MFA Fatigue Attack on VPN Admin", "severity": "medium", "status": "open", "tags": ["identity", "mfa"], "assignee": None, "alert": "A-1488", "rule": "R-31", "created": "2026-06-19T20:15:00Z", "elapsed": 10, "tasks": [1, 3], "flags": 0},
    {"id": "PX-D034474", "title": "Confidential Files Copied to USB", "severity": "medium", "status": "open", "tags": ["insider-threat", "dlp"], "assignee": {"initials": "AL", "name": "Alex Lee"}, "alert": "A-1510", "rule": "R-33", "created": "2026-06-19T18:00:00Z", "elapsed": 12, "tasks": [0, 4], "flags": 0},
    {"id": "PX-D034482", "title": "Lateral Movement via Pass-the-Hash Attack", "severity": "critical", "status": "in_progress", "tags": ["lateral-movement", "credential-access"], "assignee": {"initials": "SK", "name": "Sarah Kim"}, "alert": "A-1190", "rule": "R-23", "created": "2026-06-19T16:00:00Z", "elapsed": 14, "tasks": [3, 7], "flags": 2},
    {"id": "PX-D034471", "title": "DCSync Attack from Compromised Workstation", "severity": "critical", "status": "in_progress", "tags": ["active-directory", "credential-access"], "assignee": {"initials": "SK", "name": "Sarah Kim"}, "alert": "A-1455", "rule": "R-30", "created": "2026-06-19T14:30:00Z", "elapsed": 16, "tasks": [2, 6], "flags": 1},
    {"id": "PX-D034473", "title": "SQL Injection on Customer Portal", "severity": "high", "status": "in_progress", "tags": ["web", "application"], "assignee": {"initials": "MC", "name": "Maria Chen"}, "alert": "A-1502", "rule": "R-32", "created": "2026-06-19T12:00:00Z", "elapsed": 18, "tasks": [3, 5], "flags": 0},
    {"id": "PX-D034455", "title": "Excessive Failed Login Attempts on VPN", "severity": "low", "status": "in_progress", "tags": ["endpoint", "brute-force"], "assignee": {"initials": "AL", "name": "Alex Lee"}, "alert": "A-1233", "rule": "R-25", "created": "2026-06-19T10:20:00Z", "elapsed": 20, "tasks": [4, 5], "flags": 0},
    {"id": "PX-D034459", "title": "Publicly Exposed Azure Storage Container", "severity": "medium", "status": "in_progress", "tags": ["cloud", "misconfiguration"], "assignee": {"initials": "MC", "name": "Maria Chen"}, "alert": "A-1088", "rule": "R-22", "created": "2026-06-19T08:00:00Z", "elapsed": 22, "tasks": [2, 6], "flags": 1},
    {"id": "INC-0034454", "title": "Privilege Escalation via IAM Role Assumption", "severity": "critical", "status": "done", "tags": ["privilege-escalation", "cloud"], "assignee": {"initials": "SK", "name": "Sarah Kim"}, "alert": "A-1377", "rule": "R-27", "created": "2026-06-15T09:00:00Z", "elapsed": 6, "tasks": [9, 9], "flags": 0},
    {"id": "PX-D034465", "title": "Business Email Compromise — Finance Inbox", "severity": "high", "status": "done", "tags": ["email", "bec"], "assignee": {"initials": "BM", "name": "Ben Miller"}, "alert": "A-1388", "rule": "R-34", "created": "2026-06-14T11:00:00Z", "elapsed": 5, "tasks": [6, 6], "flags": 0},
    {"id": "PX-D034451", "title": "Suspicious Outbound Traffic to Tor Exit Node", "severity": "high", "status": "done", "tags": ["network", "command-and-control"], "assignee": {"initials": "BM", "name": "Ben Miller"}, "alert": "A-1377", "rule": "R-27", "created": "2026-06-13T20:00:00Z", "elapsed": 7, "tasks": [5, 5], "flags": 0},
    {"id": "PX-D034466", "title": "RDP Brute Force from TOR Exit", "severity": "medium", "status": "done", "tags": ["network", "brute-force"], "assignee": {"initials": "JD", "name": "John Doe"}, "alert": "A-1395", "rule": "R-35", "created": "2026-06-12T15:00:00Z", "elapsed": 4, "tasks": [4, 4], "flags": 0},
    {"id": "PX-D034456", "title": "Cryptomining on Cloud Instance", "severity": "critical", "status": "done", "tags": ["cloud", "cryptojacking"], "assignee": {"initials": "MC", "name": "Maria Chen"}, "alert": "A-1402", "rule": "R-28", "created": "2026-06-11T12:00:00Z", "elapsed": 5, "tasks": [6, 6], "flags": 0},
    {"id": "PX-D034448", "title": "Unauthorized Software Installation", "severity": "low", "status": "done", "tags": ["endpoint", "policy-violation"], "assignee": {"initials": "AL", "name": "Alex Lee"}, "alert": "A-1233", "rule": "R-25", "created": "2026-06-10T16:00:00Z", "elapsed": 4, "tasks": [3, 3], "flags": 0},
    {"id": "PX-D034467", "title": "Insider Data Staging to Personal Cloud", "severity": "high", "status": "done", "tags": ["insider-threat", "dlp"], "assignee": {"initials": "JD", "name": "John Doe"}, "alert": "A-1412", "rule": "R-36", "created": "2026-06-09T09:30:00Z", "elapsed": 6, "tasks": [5, 5], "flags": 0},
]

SIGMA_STUB = "title: Demo Rule\nstatus: experimental\nlogsource:\n  product: windows\ndetection:\n  selection:\n    EventID: 1\n  condition: selection\nlevel: medium"
KQL_STUB = "DeviceProcessEvents\n| where Timestamp > ago(24h)\n| take 10"


def case_row(c: dict) -> dict:
    from datetime import datetime, timedelta
    created = c["created"]
    dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
    due = (dt + timedelta(hours=8)).strftime("%Y-%m-%dT%H:%M:%SZ")
    td, tt = c["tasks"]
    alert = c["alert"]
    rule = c["rule"]
    return {
        "id": c["id"],
        "title": c["title"],
        "severity": c["severity"],
        "status": c["status"],
        "tags": c["tags"],
        "assignee": c["assignee"],
        "sourceAlertId": alert,
        "linkedRuleId": rule,
        "createdAt": created,
        "dueAt": due,
        "slaHours": 8,
        "elapsedHours": c["elapsed"],
        "tasksDone": td,
        "tasksTotal": tt,
        "flags": c["flags"],
        "attachments": min(tt, 5),
        "aiSummary": f"Correlated with AI Court alert {alert} — n8n rule {rule}. Auto-triage confidence high; see tribunal evidence.",
        "history": [
            {"id": "h1", "type": "created", "actor": "PhantomX Auto-triage", "detail": f"Case escalated from alert {alert}", "timestamp": created},
        ],
    }


def rule_row(meta: tuple) -> dict:
    rid, title, alert, case, sev, cat, status, reviewer, desc = meta
    row = {
        "id": rid,
        "title": title,
        "description": desc,
        "severity": sev,
        "sourceAlertId": alert,
        "linkedCaseId": case,
        "status": status,
        "category": cat,
        "proposedAt": "2026-06-12T10:00:00Z",
        "sigma": SIGMA_STUB.replace("Demo Rule", title),
        "kql": KQL_STUB,
        "rejectReason": "Too noisy for production without tighter scoping." if status == "rejected" else None,
    }
    if reviewer and status in ("approved", "rejected"):
        row["reviewedBy"] = reviewer
        row["reviewedAt"] = "2026-06-13T14:00:00Z"
    return row


def court_summary(a: dict) -> dict:
    return {
        "alertId": a["alertId"],
        "title": a["title"],
        "severity": a["severity"],
        "verdict": "TRUE_POSITIVE",
        "confidence": a["confidence"],
        "recommendationSummary": a["rec"],
        "linkedCaseId": a["case"],
    }


def court_detail(a: dict) -> dict:
    return {
        "alertId": a["alertId"],
        "title": a["title"],
        "severity": a["severity"],
        "evidence": [
            {"type": "telemetry", "detail": f"Primary signal for {a['alertId']} on Northwind Manufacturing estate"},
            {"type": "correlation", "detail": f"Linked incident case {a['case']}"},
        ],
        "tribunal": {
            "prosecutor": [{"point": "Behavior matches ATT&CK technique with high fidelity", "weight": 0.85}],
            "defender": [{"point": "Could be admin automation during change window", "weight": 0.2}],
            "verdict": "TRUE_POSITIVE",
            "confidence": a["confidence"],
        },
        "recommendation": {
            "severity": a["severity"],
            "actionItems": [a["rec"], "Document in case timeline", "Validate detection coverage"],
            "playbook": "PB-Auto-Triage",
        },
    }


def main() -> None:
    cases = [case_row(c) for c in CASES]
    open_c = [x for x in cases if x["status"] == "open"]
    prog_c = [x for x in cases if x["status"] == "in_progress"]
    done_c = [x for x in cases if x["status"] == "done"]

    def sev_count(items, sev):
        return sum(1 for x in items if x["severity"] == sev)

    open_by = {
        "critical": sev_count(open_c, "critical"),
        "high": sev_count(open_c, "high"),
        "medium": sev_count(open_c, "medium"),
        "low": sev_count(open_c, "low"),
    }

    overview = {
        "sources": [
            {"name": "Wazuh / SIEM", "logCount": 62480, "trendPct": 11},
            {"name": "Sysmon", "logCount": 51220, "trendPct": 8},
            {"name": "Endpoints", "logCount": 44890, "trendPct": 5},
            {"name": "Active Directory", "logCount": 36120, "trendPct": 9},
            {"name": "Office365", "logCount": 30450, "trendPct": -3},
            {"name": "Azure", "logCount": 17840, "trendPct": 4},
            {"name": "AWS", "logCount": 10220, "trendPct": 2},
            {"name": "Okta", "logCount": 7120, "trendPct": 14},
            {"name": "+62 others", "logCount": 21460, "trendPct": 3},
        ],
        "alerts": 2847,
        "incidents": len(cases),
        "handling": {"automated": 82, "manual": 18},
        "incidentsResolved": len(done_c),
        "incidentsOpen": len(open_c) + len(prog_c),
        "openBySeverity": open_by,
        "falsePositivesAutoClosed": 1562,
        "kpis": {
            "dataIngestionTb24h": 72,
            "dataIngestionTrendPct": 6,
            "eventsIngestion24h": 22800000000,
            "eventsTrendPct": -12,
            "preventedEvents": 1684,
            "currentlyOpenIncidents": len(open_c) + len(prog_c),
            "oldestOpenDays": 3,
            "ingestionSpark": [44, 46, 48, 50, 52, 54, 53, 56, 58, 60, 59, 62, 64, 63, 66, 68, 67, 70, 69, 72, 71, 73, 72, 72],
            "eventsSpark": [310, 295, 288, 275, 268, 260, 255, 248, 242, 235, 228, 222, 218, 212, 208, 205, 200, 198, 202, 210, 215, 220, 225, 228],
        },
    }

    detection = {
        "totalAlerts": 2847,
        "weeklyAverage": 118,
        "categories": [
            {"name": "Endpoint", "value": 982, "color": "#ec4899"},
            {"name": "Email", "value": 712, "color": "#3b82f6"},
            {"name": "Identity", "value": 468, "color": "#6366f1"},
            {"name": "Cloud", "value": 385, "color": "#06b6d4"},
            {"name": "Threat Intel", "value": 198, "color": "#14b8a6"},
            {"name": "Insider Threat", "value": 102, "color": "#94a3b8"},
        ],
        "severities": [
            {"name": "Critical", "value": 142, "color": "#dc2626"},
            {"name": "High", "value": 512, "color": "#f97316"},
            {"name": "Medium", "value": 1288, "color": "#f59e0b"},
            {"name": "Low", "value": 905, "color": "#3B82F6"},
        ],
        "sources": [
            {"name": "Microsoft Defender", "value": 912, "pct": 32, "tags": "Email, Threat Intel"},
            {"name": "SentinelOne", "value": 598, "pct": 21, "tags": "Endpoint"},
            {"name": "CrowdStrike", "value": 512, "pct": 18, "tags": "Endpoint, Identity"},
            {"name": "Microsoft Sentinel", "value": 370, "pct": 13, "tags": "Cloud, Identity"},
            {"name": "Splunk", "value": 313, "pct": 11, "tags": "Various"},
            {"name": "AWS GuardDuty", "value": 142, "pct": 5, "tags": "Cloud"},
        ],
        "weekly": [{"day": d, "a": 45 + (d % 7) * 3, "b": 38 + (d % 5) * 2, "c": 28 + (d % 4)} for d in range(1, 31)],
        "weeklyLegend": ["CrowdStrike", "Splunk", "Microsoft Defender", "Sumo Logic", "Other"],
    }

    ai_stats = {"falsePositivesAutoClosed": 1562, "truePositivesShown": len(AI_COURT), "period": "24h"}
    ai_cases = [court_summary(a) for a in AI_COURT]
    ai_details = {a["alertId"]: court_detail(a) for a in AI_COURT}
    rules = [rule_row(m) for m in RULES_META]

    files = {
        "cases_inbox.json": cases,
        "overview.json": overview,
        "detection.json": detection,
        "ai_court_stats.json": ai_stats,
        "ai_court_cases.json": ai_cases,
        "ai_court_case_details.json": ai_details,
        "rules.json": rules,
    }

    for name, data in files.items():
        path = MOCK / name
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"wrote {path.name}")

    # Sync frontend copies
    fe_paths = [
        ROOT / "frontend" / "src" / "data" / "cases_inbox.json",
        ROOT / "frontend" / "public" / "mock" / "cases_inbox.json",
    ]
    for p in fe_paths:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(cases, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"synced {p}")


if __name__ == "__main__":
    main()
