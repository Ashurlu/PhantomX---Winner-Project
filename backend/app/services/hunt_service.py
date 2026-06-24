"""Threat hunt — structured investigation results from SOC mock data + optional LLM narrative."""
from __future__ import annotations

import re
import time
from datetime import datetime, timezone

from .. import db
from . import chat_service
from .soc_context import build_actions, parse_slash_command, search_soc

HOST_RE = re.compile(r"\b[A-Z]{2,}(?:-[A-Z0-9]+)+\b")
FILE_RE = re.compile(r"\b[\w.-]+\.(?:exe|dll|ps1|bat|vbs|js|scr)\b", re.I)
IP_RE = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")

# Curated hunt scenarios keyed by query tokens
IOC_SCENARIOS: dict[str, dict] = {
    "add_task_startup": {
        "confirmed": [
            {
                "id": "f-add-task",
                "name": "add_task_startup.exe",
                "summary": "31/47 vendors mark hash malicious · Encoded PowerShell · 12 devices",
                "status": "Malicious",
                "severity": "high",
                "path": "/cases?case=PX-D034455",
                "kind": "case",
            }
        ],
        "leads": [
            {
                "id": "l-ps",
                "name": "Encoded PowerShell commands",
                "summary": "Spawned from add_task_startup.exe on 18 hosts",
                "status": "Unknown",
                "path": "/cases?case=PX-D034461",
                "kind": "case",
            },
            {
                "id": "l-wks",
                "name": "WKS-204",
                "summary": "Scheduled task persistence — first seen host",
                "status": "Unknown",
                "path": "/ai-court?case=A-1233",
                "kind": "alert",
            },
        ],
        "hosts": ["FIN-WORK-1", "FIN-WORK-3", "FIN-WORK-5", "FIN-WORK-7", "FIN-WORK-9", "FIN-WORK-11", "WKS-204"],
        "files": ["add_task_startup.exe", "payload.ps1"],
        "network": ["185.220.101.42", "45.33.32.156"],
    },
    "hr-dc01": {
        "confirmed": [
            {
                "id": "f-hr-ps",
                "name": "Encoded PowerShell on HR-DC01",
                "summary": "Alert A-1042 · confidence 92% · isolate host recommended",
                "status": "Malicious",
                "severity": "high",
                "path": "/ai-court?case=A-1042",
                "kind": "alert",
            }
        ],
        "leads": [
            {
                "id": "l-hr-case",
                "name": "PX-D034461",
                "summary": "Suspicious PowerShell execution case — unassigned",
                "status": "Suspicious",
                "path": "/cases?case=PX-D034461",
                "kind": "case",
            }
        ],
        "hosts": ["HR-DC01"],
        "files": ["invoke-obfuscation.ps1"],
        "network": ["198.51.100.8"],
    },
    "ransomware": {
        "confirmed": [
            {
                "id": "f-ransom",
                "name": "Ransomware on Finance Workstation",
                "summary": "PX-C034463 · critical · mass file rename pattern",
                "status": "Malicious",
                "severity": "critical",
                "path": "/cases?case=PX-C034463",
                "kind": "case",
            }
        ],
        "leads": [
            {
                "id": "l-r-a1310",
                "name": "A-1310",
                "summary": "Mass file rename — linked case PX-C034463",
                "status": "Malicious",
                "path": "/ai-court?case=A-1310",
                "kind": "alert",
            }
        ],
        "hosts": ["FIN-WORK-2", "FIN-WORK-4"],
        "files": ["encryptor.exe"],
        "network": ["203.0.113.12"],
    },
}


def _scenario_key(query: str) -> str | None:
    q = query.lower()
    if "add_task" in q or "task_startup" in q or "scheduled task" in q:
        return "add_task_startup"
    if "hr-dc01" in q or "hr dc01" in q or ("powershell" in q and "hr" in q):
        return "hr-dc01"
    if "ransomware" in q or "finance workstation" in q:
        return "ransomware"
    return None


def _hit_to_finding(hit: dict, status: str) -> dict:
    sev = (hit.get("severity") or "").lower()
    if status == "auto":
        if sev in ("critical", "high"):
            status = "Malicious"
        elif sev == "medium":
            status = "Suspicious"
        else:
            status = "Unknown"
    return {
        "id": hit["id"],
        "name": hit["title"][:80],
        "summary": hit.get("summary", hit["title"])[:200],
        "status": status,
        "severity": hit.get("severity") or "",
        "path": hit.get("path"),
        "kind": hit.get("kind"),
    }


def _classify_hits(hits: list[dict]) -> tuple[list[dict], list[dict]]:
    confirmed: list[dict] = []
    leads: list[dict] = []
    seen: set[str] = set()

    for h in hits:
        if h["id"] in seen:
            continue
        seen.add(h["id"])
        sev = (h.get("severity") or "").lower()
        kind = h.get("kind")
        if sev in ("critical", "high") or kind == "alert":
            confirmed.append(_hit_to_finding(h, "Malicious" if sev in ("critical", "high") else "Suspicious"))
        else:
            leads.append(_hit_to_finding(h, "Unknown"))

    return confirmed[:5], leads[:6]


def _extract_entities(query: str, hits: list[dict]) -> dict[str, list[dict]]:
    hosts: dict[str, dict] = {}
    files: dict[str, dict] = {}
    network: dict[str, dict] = {}
    other: dict[str, dict] = {}

    blob = query + " " + " ".join(h.get("text", h.get("title", "")) for h in hits)

    for m in HOST_RE.findall(blob):
        if len(m) < 4:
            continue
        hosts[m] = {"id": m, "label": m, "status": "Unknown", "meta": "host"}

    for m in FILE_RE.findall(blob):
        files[m.lower()] = {"id": m.lower(), "label": m, "status": "Unknown", "meta": "file"}

    for m in IP_RE.findall(blob):
        if m.startswith(("10.", "192.168.", "127.")):
            continue
        network[m] = {"id": m, "label": m, "status": "Unknown", "meta": "ip"}

    for h in hits:
        if h["kind"] == "case":
            hosts[h["id"]] = {"id": h["id"], "label": h["id"], "status": h.get("severity", ""), "meta": "case"}
        elif h["kind"] == "alert":
            other[h["id"]] = {"id": h["id"], "label": h["title"][:60], "status": h.get("severity", ""), "meta": "alert"}

    return {
        "hosts": list(hosts.values())[:12],
        "files": list(files.values())[:8],
        "network": list(network.values())[:8],
        "other": list(other.values())[:8],
    }


def _merge_discoveries(base: dict, scenario: dict | None) -> dict:
    if not scenario:
        return base

    def merge_list(key: str, status: str = "Unknown") -> list[dict]:
        existing = {x["label"]: x for x in base.get(key, [])}
        for item in scenario.get(key, []):
            label = item if isinstance(item, str) else item.get("label", item)
            if label not in existing:
                existing[label] = {"id": label, "label": label, "status": status, "meta": key[:-1]}
        return list(existing.values())

    return {
        "hosts": merge_list("hosts"),
        "files": merge_list("files"),
        "network": merge_list("network"),
        "other": base.get("other", []),
    }


def _build_plan(query: str, hits: list[dict], scenario_key: str | None) -> list[dict]:
    q = query.lower()
    steps: list[dict] = []

    if scenario_key == "add_task_startup" or "task" in q:
        steps = [
            {"label": "Scope prevalence", "detail": "Search EDR for add_task_startup.exe hash across all endpoints", "done": True},
            {"label": "Vendor consensus", "detail": "Pull VT / internal TI — 31/47 vendors malicious", "done": True},
            {"label": "Parent process chain", "detail": "Identify encoded PowerShell spawns (18 hosts)", "done": False},
            {"label": "Persistence", "detail": "Review scheduled tasks on WKS-204 and finance segment", "done": False},
            {"label": "Containment", "detail": "Isolate FIN-WORK-* hosts with active executions", "done": False},
        ]
    elif scenario_key == "hr-dc01" or "powershell" in q:
        steps = [
            {"label": "Decode payload", "detail": "Extract and de-obfuscate PowerShell from alert A-1042", "done": True},
            {"label": "Host timeline", "detail": "Build HR-DC01 process tree for last 72h", "done": False},
            {"label": "Credential review", "detail": "Check for lateral movement from HR-DC01", "done": False},
            {"label": "Case linkage", "detail": "Assign PX-D034461 and escalate if confirmed", "done": False},
        ]
    elif scenario_key == "ransomware" or "ransomware" in q:
        steps = [
            {"label": "Isolate segment", "detail": "Network isolate finance workstation VLAN", "done": False},
            {"label": "Scope encryption", "detail": "Identify affected shares and backup status", "done": True},
            {"label": "IR playbook", "detail": "Trigger PX-C034463 critical incident workflow", "done": False},
        ]
    else:
        steps = [
            {"label": "Parse query", "detail": f"Interpret hunt question: {query[:100]}", "done": True},
            {"label": "Correlate SOC data", "detail": f"Matched {len(hits)} records in cases, alerts, and rules", "done": True},
            {"label": "Pivot entities", "detail": "Expand hosts, files, and network indicators from matches", "done": len(hits) > 0},
            {"label": "Validate leads", "detail": "Review potential leads and assign owners", "done": False},
        ]

    return steps


def _local_narrative(query: str, confirmed: list, leads: list, discoveries: dict) -> str:
    n_conf = len(confirmed)
    n_lead = len(leads)
    n_ent = sum(len(discoveries.get(k, [])) for k in ("hosts", "files", "network", "other"))
    lines = [f"**Hunt results** for: {query.strip()[:120]}", ""]

    if n_conf:
        lines.append(f"**{n_conf} confirmed finding(s)** — review Malicious/Suspicious items on the right.")
        for c in confirmed[:2]:
            lines.append(f"- **{c['name']}** ({c.get('status', '—')})")
    else:
        lines.append("No confirmed malicious findings yet — see potential leads below.")

    if n_lead:
        lines.append("")
        lines.append(f"**{n_lead} potential lead(s)** need analyst validation.")

    if n_ent:
        lines.append("")
        lines.append(
            f"**{n_ent} entities** discovered across "
            f"{len(discoveries.get('hosts', []))} hosts, "
            f"{len(discoveries.get('files', []))} files, "
            f"{len(discoveries.get('network', []))} network addresses."
        )

    lines.append("")
    lines.append("_Expand **Investigation plan** in the chat panel for next steps._")
    return "\n".join(lines)


async def run_hunt(
    message: str,
    history: list[dict],
    *,
    time_range: str | None = None,
    context_path: str | None = None,
) -> dict:
    t0 = time.monotonic()
    parsed, _scope, _mode = parse_slash_command(message)
    query = parsed.strip() or message.strip()
    scenario_key = _scenario_key(query)
    scenario = IOC_SCENARIOS.get(scenario_key) if scenario_key else None

    hits = search_soc(query, limit=12, scope="all")

    confirmed, leads = _classify_hits(hits)
    if scenario:
        seen_c = {c["id"] for c in confirmed}
        for c in scenario.get("confirmed", []):
            if c["id"] not in seen_c:
                confirmed.insert(0, c)
        seen_l = {l["id"] for l in leads}
        for l in scenario.get("leads", []):
            if l["id"] not in seen_l:
                leads.append(l)

    discoveries = _extract_entities(query, hits)
    discoveries = _merge_discoveries(discoveries, scenario)
    plan = _build_plan(query, hits, scenario_key)
    actions = build_actions(hits, context_path or "/detection")

    citations = [
        {
            "kind": "case" if h["kind"] == "case" else "alert" if h["kind"] == "alert" else "page",
            "id": h["id"],
            "title": h["title"],
            "path": h["path"],
        }
        for h in hits[:6]
    ]

    settings = db.get_settings()
    key = (settings.get("ai_provider_key") or "").strip()
    source = "local"
    reply = _local_narrative(query, confirmed, leads, discoveries)

    if key:
        try:
            chat_result = await chat_service.chat(
                query,
                history,
                mode="hunt",
                scope="all",
                context_path=context_path or "/detection",
                time_range=time_range,
            )
            reply = chat_result["reply"]
            source = chat_result["source"]
            if chat_result.get("citations"):
                citations = chat_result["citations"]
            if chat_result.get("actions"):
                actions = chat_result["actions"]
        except Exception:
            pass

    elapsed = max(1, int(time.monotonic() - t0))
    thought_seconds = min(elapsed + 2, 8) if key else min(3 + len(hits), 12)

    raw = [
        {
            "kind": h["kind"],
            "id": h["id"],
            "title": h["title"],
            "severity": h.get("severity"),
            "status": h.get("status"),
            "path": h.get("path"),
            "summary": h.get("summary"),
        }
        for h in hits
    ]

    return {
        "reply": reply,
        "source": source,
        "thought_seconds": thought_seconds,
        "plan": plan,
        "confirmed": confirmed,
        "leads": leads,
        "discoveries": discoveries,
        "raw": raw,
        "citations": citations,
        "actions": actions,
        "query": query,
        "ran_at": datetime.now(timezone.utc).isoformat(),
    }
