"""Build searchable SOC context from mock data for the chat assistant."""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

MOCK_DIR = Path(__file__).resolve().parent.parent / "mock"

ChatScope = Literal["all", "cases", "alerts", "rules", "detection", "pentest", "cramm", "pipeline"]
ChatMode = Literal["auto", "search", "analyze", "hunt", "brief"]

STOPWORDS = {
    "the", "and", "for", "that", "this", "with", "from", "about", "tell", "what",
    "when", "where", "how", "did", "was", "were", "are", "has", "have", "been",
    "week", "weeks", "ago", "last", "something", "like", "please", "give", "me",
}

SYNONYMS: dict[str, list[str]] = {
    "hr": ["hr-dc01", "hr dc01", "human resources", "hr device", "hr-dc"],
    "ransomware": ["encrypt", "file rename", "vssadmin", "shadow copy"],
    "powershell": ["encoded", "ps1", "a-1042"],
    "phishing": ["bec", "wire", "ceo", "oauth"],
    "lateral": ["pass-the-hash", "pth", "lsass"],
    "critical": ["sev1", "p1", "urgent"],
    "open": ["in progress", "new", "unresolved"],
}


def parse_slash_command(message: str) -> tuple[str, ChatScope, ChatMode]:
    """Parse /cases, /alerts, /hunt, /status, /brief etc."""
    m = message.strip()
    if not m.startswith("/"):
        return message, "all", "auto"

    parts = m.split(maxsplit=1)
    cmd = parts[0].lower()
    rest = parts[1].strip() if len(parts) > 1 else ""

    mapping: dict[str, tuple[ChatScope, ChatMode, str]] = {
        "/cases": ("cases", "search", rest or "open cases"),
        "/alerts": ("alerts", "search", rest or "recent alerts"),
        "/rules": ("rules", "search", rest or "pending rules"),
        "/detection": ("detection", "analyze", rest or "alert breakdown"),
        "/hunt": ("all", "hunt", rest or "suspicious activity"),
        "/analyze": ("all", "analyze", rest or "incident trends"),
        "/brief": ("all", "brief", rest or "SOC status"),
        "/status": ("all", "brief", "platform status"),
        "/help": ("all", "brief", "help"),
        "/pentest": ("pentest", "analyze", rest or "AD assessment techniques"),
        "/cramm": ("cramm", "analyze", rest or "critical risks"),
        "/pipeline": ("pipeline", "analyze", rest or "investigation pipeline funnel"),
        "/web": ("all", "analyze", rest or "web security assessment"),
    }
    if cmd in mapping:
        scope, mode, default_q = mapping[cmd]
        return rest or default_q, scope, mode
    return message, "all", "auto"


def format_status_reply(time_range: str | None = None) -> str:
    overview = _load("overview.json")
    court = _load("ai_court_stats.json")
    detection = _load("detection.json")
    cramm = _load("cramm.json")
    cases = _cases_list()
    open_cases = sum(1 for c in cases if c["status"] in ("open", "in_progress"))
    pipeline = _pipeline_summary()
    window = time_range or "24h"
    return (
        f"**SOC status** ({window})\n\n"
        f"- **{overview['alerts']:,}** alerts · **{detection['totalAlerts']:,}** in detection view\n"
        f"- **{overview['incidents']}** incidents (**{overview['incidentsOpen']}** open, "
        f"**{overview['incidentsResolved']}** resolved)\n"
        f"- **{overview['falsePositivesAutoClosed']:,}** false positives auto-closed\n"
        f"- **{court['truePositivesShown']}** AI Court true positives · **{open_cases}** cases in inbox\n"
        f"- CRAMM: **{cramm['stats']['criticalCount']}** critical / **{cramm['stats']['totalRisks']}** risks tracked\n"
        f"- Automation: **{overview['handling']['automated']}%** automated handling\n"
        f"- Modules: Overview, Detection, Cases, AI Court, Rules, CRAMM, Pentest (ProtonRed), Web Assessment, Threat Hunt\n"
        f"{pipeline}\n\n"
        "Try `/cases critical`, `/pentest AD`, `/cramm`, `/pipeline`, or ask in plain language."
    )


def format_help_reply() -> str:
    return (
        "**PhantomX SOC Assistant**\n\n"
        "Connected modules: Overview, Detection, Cases, AI Court, Rules, CRAMM risk matrix, "
        "AGI Pentest (ProtonRed / AD assessment), Web Security Assessment, Threat Hunt, Investigation Pipeline.\n\n"
        "Slash commands:\n"
        "- `/status` — platform snapshot\n"
        "- `/cases [query]` — case inbox search\n"
        "- `/alerts [query]` — AI Court alerts\n"
        "- `/rules [query]` — detection rules\n"
        "- `/detection` — alert intelligence\n"
        "- `/hunt [IOC]` — threat hunt plan\n"
        "- `/pentest [topic]` — MITRE / AD emulation guidance\n"
        "- `/cramm [technique]` — risk & CRAMM scores\n"
        "- `/pipeline` — investigation Sankey funnel\n"
        "- `/analyze` · `/brief` · `/help`\n\n"
        "Use **scope chips** to narrow data. Drag the panel corner or pick **S/M/L/XL** to resize."
    )


def _load(name: str):
    with open(MOCK_DIR / name, encoding="utf-8") as f:
        return json.load(f)


def _cases_list() -> list[dict]:
    try:
        from .cases_store import list_inbox

        return list_inbox()
    except Exception:
        return _load("cases_inbox.json")


def _pipeline_summary() -> str:
    try:
        from .investigation_pipeline import get_pipeline_config

        cfg = get_pipeline_config()
        nodes = ", ".join(f"{n.label}={n.value}" for n in cfg.nodes[:6])
        m = cfg.metrics
        extra = f" · {m.totalAlerts} alerts in funnel" if m and m.totalAlerts else ""
        return f"- Pipeline: {nodes}{extra}"
    except Exception:
        return ""


def _pentest_engine_line() -> str:
    try:
        from .. import db

        url = (db.get_settings().get("pentest_base_url") or "").strip()
        return f"Pentest engine: {'configured at ' + url if url else 'not configured (Admin → API Keys)'}"
    except Exception:
        return "Pentest engine: unknown"


def _parse_ts(iso: str) -> datetime:
    return datetime.fromisoformat(iso.replace("Z", "+00:00"))


def _tokenize(query: str) -> list[str]:
    raw = re.findall(r"[a-z0-9]+", query.lower())
    tokens: list[str] = []
    for t in raw:
        if t in STOPWORDS or len(t) < 2:
            continue
        tokens.append(t)
        tokens.extend(SYNONYMS.get(t, []))
    return tokens


def _expand_text(*parts: str) -> str:
    return " ".join(p for p in parts if p).lower()


def _alert_titles_by_id() -> dict[str, str]:
    return {a["alertId"]: a["title"] for a in _load("ai_court_cases.json")}


def _collect_documents() -> list[dict]:
    docs: list[dict] = []
    alert_titles = _alert_titles_by_id()

    for c in _cases_list():
        alert_id = c.get("sourceAlertId", "")
        alert_title = alert_titles.get(alert_id, "")
        docs.append(
            {
                "kind": "case",
                "id": c["id"],
                "title": c["title"],
                "path": f"/cases?case={c['id']}",
                "severity": c["severity"],
                "status": c["status"],
                "createdAt": c.get("createdAt", ""),
                "text": _expand_text(
                    c["id"],
                    c["title"],
                    alert_title,
                    c.get("aiSummary", ""),
                    " ".join(c.get("tags", [])),
                    alert_id,
                    c.get("linkedRuleId", ""),
                    (c.get("assignee") or {}).get("name", ""),
                ),
                "summary": c.get("aiSummary", c["title"]),
            }
        )

    for a in _load("ai_court_cases.json"):
        docs.append(
            {
                "kind": "alert",
                "id": a["alertId"],
                "title": a["title"],
                "path": f"/ai-court?case={a['alertId']}",
                "severity": a["severity"],
                "status": a.get("verdict", "TRUE_POSITIVE"),
                "createdAt": "",
                "text": _expand_text(
                    a["alertId"],
                    a["title"],
                    a.get("recommendationSummary", ""),
                    a.get("linkedCaseId", ""),
                    str(a.get("confidence", "")),
                ),
                "summary": a.get("recommendationSummary", a["title"]),
            }
        )

    for r in _load("rules.json"):
        docs.append(
            {
                "kind": "rule",
                "id": r["id"],
                "title": r["title"],
                "path": f"/rules?rule={r['id']}",
                "severity": r["severity"],
                "status": r["status"],
                "createdAt": r.get("proposedAt", ""),
                "text": _expand_text(
                    r["id"],
                    r["title"],
                    r.get("description", ""),
                    r.get("sourceAlertId", ""),
                    r.get("linkedCaseId", ""),
                ),
                "summary": r.get("description", r["title"])[:240],
            }
        )

    det = _load("detection.json")
    for cat in det.get("categories", []):
        docs.append(
            {
                "kind": "detection",
                "id": cat["name"],
                "title": f"{cat['name']} alerts",
                "path": "/detection",
                "severity": "",
                "status": "category",
                "createdAt": "",
                "text": _expand_text(cat["name"], "category", "detection", str(cat.get("value", ""))),
                "summary": f"{cat.get('value', 0):,} alerts in {cat['name']} category",
            }
        )
    for src in det.get("sources", []):
        docs.append(
            {
                "kind": "detection",
                "id": src["name"],
                "title": src["name"],
                "path": "/detection",
                "severity": "",
                "status": "source",
                "createdAt": "",
                "text": _expand_text(src["name"], src.get("tags", ""), "source", "detection"),
                "summary": f"{src.get('value', 0):,} alerts ({src.get('pct', 0)}%) from {src['name']}",
            }
        )

    cramm = _load("cramm.json")
    for item in cramm.get("critical", []) + cramm.get("high", []):
        docs.append(
            {
                "kind": "cramm",
                "id": item["techniqueId"],
                "title": item["title"],
                "path": f"/cramm/{item['techniqueId']}",
                "severity": item.get("severity", ""),
                "status": f"score {item.get('riskScore', '')}",
                "createdAt": "",
                "text": _expand_text(
                    item["techniqueId"],
                    item["title"],
                    item.get("description", ""),
                    " ".join(item.get("tags", [])),
                    "cramm",
                    "risk",
                ),
                "summary": item.get("description", item["title"])[:240],
            }
        )

    for t in _load("pentest_techniques.json"):
        docs.append(
            {
                "kind": "pentest",
                "id": t["id"],
                "title": t["name"],
                "path": "/pentest",
                "severity": "",
                "status": t.get("status", "available"),
                "createdAt": "",
                "text": _expand_text(
                    t["id"],
                    t["name"],
                    t.get("tactic", ""),
                    "pentest",
                    "atomic",
                    "ad" if t.get("adBadge") else "",
                    "emulation",
                ),
                "summary": f"{t['name']} ({t['tactic']}) — {t.get('testCount', 0)} tests",
            }
        )

    try:
        from .investigation_pipeline import get_pipeline_config

        cfg = get_pipeline_config()
        for node in cfg.nodes:
            docs.append(
                {
                    "kind": "pipeline",
                    "id": node.id,
                    "title": node.label,
                    "path": "/overview",
                    "severity": "",
                    "status": "node",
                    "createdAt": "",
                    "text": _expand_text(node.id, node.label, "pipeline", "sankey", "investigation"),
                    "summary": f"{node.label}: {node.value} items in investigation funnel",
                }
            )
    except Exception:
        pass

    return docs


def _weeks_ago_hint(query: str) -> int | None:
    q = query.lower()
    m = re.search(r"(\d+)\s*weeks?\s*ago", q)
    if m:
        return int(m.group(1))
    if "last week" in q or "a week ago" in q:
        return 1
    if "two weeks ago" in q or "2 weeks ago" in q:
        return 2
    return None


def search_soc(
    query: str,
    limit: int = 5,
    scope: ChatScope = "all",
) -> list[dict]:
    tokens = _tokenize(query)
    weeks = _weeks_ago_hint(query)
    now = datetime.now(timezone.utc)
    docs = _collect_documents()

    if scope == "cases":
        docs = [d for d in docs if d["kind"] == "case"]
    elif scope == "alerts":
        docs = [d for d in docs if d["kind"] == "alert"]
    elif scope == "rules":
        docs = [d for d in docs if d["kind"] == "rule"]
    elif scope == "detection":
        docs = [d for d in docs if d["kind"] == "detection"]
    elif scope == "pentest":
        docs = [d for d in docs if d["kind"] == "pentest"]
    elif scope == "cramm":
        docs = [d for d in docs if d["kind"] == "cramm"]
    elif scope == "pipeline":
        docs = [d for d in docs if d["kind"] == "pipeline"]

    q_lower = query.lower()
    if "critical" in q_lower:
        docs = [d for d in docs if str(d.get("severity", "")).lower() == "critical"] or docs
    if "open" in q_lower and scope in ("all", "cases"):
        docs = [d for d in docs if d.get("status") in ("open", "in_progress", "new")] or docs

    scored: list[tuple[int, dict]] = []

    for doc in docs:
        score = 0
        text = doc["text"]
        for t in tokens:
            if t in text:
                score += 3 if len(t) > 4 else 2
        # Phrase bonuses
        if "ransomware" in query.lower() and "ransomware" in text:
            score += 8
            if doc["kind"] == "case":
                score += 12
        if "hr" in query.lower() and ("hr-dc" in text or "hr dc" in text):
            score += 10

        if doc["kind"] == "rule":
            score -= 3

        if weeks and doc.get("createdAt"):
            try:
                created = _parse_ts(doc["createdAt"])
                age_days = (now - created).days
                target_days = weeks * 7
                if abs(age_days - target_days) <= 4:
                    score += 6
            except ValueError:
                pass

        if score > 0:
            scored.append((score, doc))

    scored.sort(
        key=lambda x: (
            -x[0],
            {"case": 0, "alert": 1, "rule": 2, "cramm": 3, "pentest": 4, "pipeline": 5, "detection": 6}.get(
                x[1]["kind"], 9
            ),
            x[1]["id"],
        )
    )
    return [d for _, d in scored[:limit]]


def citation_kind(doc: dict) -> str:
    k = doc["kind"]
    if k in ("detection", "pipeline"):
        return "page"
    if k in ("pentest", "cramm"):
        return "page"
    return k


def build_actions(hits: list[dict], context_path: str | None) -> list[dict]:
    actions: list[dict] = []
    seen: set[str] = set()
    for h in hits[:4]:
        path = h["path"]
        if path in seen:
            continue
        seen.add(path)
        actions.append(
            {
                "label": f"Open {h['kind']}: {h['id']}",
                "path": path,
                "kind": "navigate",
            }
        )
    if context_path and context_path not in seen:
        page_hints = {
            "/detection": ("Alert Intelligence", "/detection"),
            "/cases": ("Case Inbox", "/cases"),
            "/ai-court": ("AI Court", "/ai-court"),
            "/rules": ("Rules", "/rules"),
            "/overview": ("Overview", "/overview"),
            "/pentest": ("AGI Pentest", "/pentest"),
            "/cramm": ("CRAMM Matrix", "/cramm"),
            "/admin": ("Admin", "/admin"),
        }
        for prefix, (label, path) in page_hints.items():
            if context_path.startswith(prefix):
                actions.append({"label": f"Current page: {label}", "path": path, "kind": "navigate"})
                break
    return actions[:6]


def build_context_block(max_chars: int = 16000) -> str:
    """Compact overview for LLM system prompt — all platform modules."""
    overview = _load("overview.json")
    cases = _cases_list()
    detection = _load("detection.json")
    rules = _load("rules.json")
    cramm = _load("cramm.json")
    court_stats = _load("ai_court_stats.json")

    lines = [
        "PLATFORM MODULES: Overview KPIs, Detection analytics, Case Inbox, AI Court verdicts, "
        "Detection Rules, CRAMM risk matrix, AGI Pentest (ProtonRed AD assessment), "
        "Autonomous Web Security Assessment, Threat Hunt panel, Investigation Pipeline Sankey.",
        "",
        f"SOC snapshot: {overview['alerts']} alerts/24h, {overview['incidents']} incidents, "
        f"{overview['incidentsOpen']} open, {overview['incidentsResolved']} resolved, "
        f"{overview['falsePositivesAutoClosed']} FP auto-closed.",
        f"AI Court: {court_stats['truePositivesShown']} true positives shown.",
        f"Detection: {detection['totalAlerts']} total alerts across "
        f"{len(detection.get('categories', []))} categories.",
        f"Rules: {len(rules)} rules ({sum(1 for r in rules if r.get('status') == 'pending')} pending).",
        f"CRAMM: {cramm['stats']['totalRisks']} risks, {cramm['stats']['criticalCount']} critical, "
        f"avg health {cramm['stats']['avgHealthScore']}. Insight: {cramm['insight']['message'][:200]}",
        _pentest_engine_line(),
        _pipeline_summary(),
        "",
        "Top CRAMM critical:",
    ]
    for item in cramm.get("critical", [])[:5]:
        lines.append(
            f"- {item['techniqueId']}: {item['title']} score {item.get('riskScore')} — "
            f"{item.get('description', '')[:120]}"
        )

    lines.append("")
    lines.append("AD / Pentest techniques (sample):")
    for t in _load("pentest_techniques.json"):
        if t.get("adBadge"):
            lines.append(f"- {t['id']}: {t['name']} ({t['tactic']})")

    lines.append("")
    lines.append("Cases:")
    for c in cases:
        assignee = (c.get("assignee") or {}).get("name") or "Unassigned"
        lines.append(
            f"- {c['id']}: {c['title']} [{c['severity']}/{c['status']}] "
            f"alert {c.get('sourceAlertId')} rule {c.get('linkedRuleId')} assignee {assignee}. "
            f"{c.get('aiSummary', '')[:160]}"
        )

    lines.append("")
    lines.append("Detection categories:")
    for cat in detection.get("categories", [])[:6]:
        lines.append(f"- {cat['name']}: {cat.get('value', 0):,} alerts")

    text = "\n".join(lines)
    return text[:max_chars]


def format_local_reply(query: str, hits: list[dict]) -> str:
    if not hits:
        return (
            "I couldn't find a matching incident in the current demo dataset. "
            "Try keywords like ransomware, HR device, PowerShell, DCSync, MFA fatigue, or a case ID (e.g. PX-C034463). "
            "Connect an AI provider key in Admin → API Keys for richer answers."
        )

    lead = hits[0]
    parts = [
        f"Here's what I found for **{query.strip()[:80]}**:",
        "",
        f"**{lead['title']}** ({lead['kind'].upper()} `{lead['id']}`)",
        f"- Severity: {lead.get('severity', '—')} · Status: {lead.get('status', '—')}",
        f"- {lead.get('summary', '')}",
        f"- Open in app: {lead['path']}",
    ]

    if len(hits) > 1:
        parts.append("")
        parts.append("Related:")
        for h in hits[1:4]:
            parts.append(f"- {h['title']} (`{h['id']}`) -> {h['path']}")

    parts.append("")
    parts.append(
        "_Commands: `/status` · `/cases` · `/alerts` · `/pentest` · `/cramm` · `/pipeline` · `/hunt` · `/help` — "
        "or add an OpenRouter key in **Admin → API Keys**._"
    )
    return "\n".join(parts)
