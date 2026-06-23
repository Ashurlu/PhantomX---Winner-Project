"""Build searchable SOC context from mock data for the chat assistant."""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

MOCK_DIR = Path(__file__).resolve().parent.parent / "mock"

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
}


def _load(name: str):
    with open(MOCK_DIR / name, encoding="utf-8") as f:
        return json.load(f)


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

    for c in _load("cases_inbox.json"):
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


def search_soc(query: str, limit: int = 5) -> list[dict]:
    tokens = _tokenize(query)
    weeks = _weeks_ago_hint(query)
    now = datetime.now(timezone.utc)
    docs = _collect_documents()
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

    scored.sort(key=lambda x: (-x[0], {"case": 0, "alert": 1, "rule": 2}.get(x[1]["kind"], 9), x[1]["id"]))
    return [d for _, d in scored[:limit]]


def build_context_block(max_chars: int = 12000) -> str:
    """Compact overview for LLM system prompt."""
    overview = _load("overview.json")
    cases = _load("cases_inbox.json")
    lines = [
        f"SOC snapshot: {overview['alerts']} alerts/24h, {overview['incidents']} incidents, "
        f"{overview['incidentsOpen']} open, {overview['incidentsResolved']} resolved.",
        f"AI Court true positives: {_load('ai_court_stats.json')['truePositivesShown']}.",
        "",
        "Cases:",
    ]
    for c in cases:
        assignee = (c.get("assignee") or {}).get("name") or "Unassigned"
        lines.append(
            f"- {c['id']}: {c['title']} [{c['severity']}/{c['status']}] "
            f"alert {c.get('sourceAlertId')} rule {c.get('linkedRuleId')} assignee {assignee}. "
            f"{c.get('aiSummary', '')[:180]}"
        )
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
        "_Tip: Add an **OpenRouter** key (`sk-or-v1-…`) and model (e.g. `openai/gpt-4o-mini`) in **Admin → API Keys**._"
    )
    return "\n".join(parts)
