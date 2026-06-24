"""SOC chatbot — local search fallback + OpenRouter / OpenAI / Anthropic."""
from __future__ import annotations

import json

import httpx

from .. import db
from ..config import settings as app_settings
from .soc_context import (
    build_actions,
    build_context_block,
    citation_kind,
    format_help_reply,
    format_local_reply,
    format_status_reply,
    parse_slash_command,
    search_soc,
)

DEFAULT_MODEL = "openai/gpt-4o-mini"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

MODE_PROMPTS = {
    "auto": "Adapt to the question — search, explain, or summarize as needed.",
    "search": "Focus on finding and listing matching cases, alerts, or rules. Be factual and cite IDs.",
    "analyze": "Provide analysis: patterns, risk, blast radius, and recommended next steps for analysts.",
    "hunt": (
        "Act as a threat hunter. Propose an investigation plan: hypotheses, data sources to query, "
        "entities to pivot on, and what would confirm or refute malicious activity."
    ),
    "brief": "Answer in 2–4 sentences maximum. No preamble.",
}


def _to_citations(hits: list[dict]) -> list[dict]:
    return [
        {
            "kind": citation_kind(h),
            "id": h["id"],
            "title": h["title"],
            "path": h["path"],
        }
        for h in hits
    ]


def _is_openrouter(key: str, model: str) -> bool:
    if key.startswith("sk-or-"):
        return True
    return "/" in model


def _is_anthropic(key: str, model: str) -> bool:
    if _is_openrouter(key, model):
        return False
    if key.startswith("sk-ant-"):
        return True
    return model.lower().startswith("claude")


def _normalize_openrouter_model(model: str) -> str:
    if "/" in model:
        return model
    lower = model.lower()
    if lower.startswith("claude"):
        return f"anthropic/{model}"
    if lower.startswith("gpt"):
        return f"openai/{model}"
    return model


async def _call_openrouter(
    key: str,
    model: str,
    system: str,
    messages: list[dict],
    max_tokens: int = 1400,
) -> str:
    payload = {
        "model": _normalize_openrouter_model(model),
        "messages": [{"role": "system", "content": system}, *messages],
        "max_tokens": max_tokens,
        "temperature": 0.25,
    }
    async with httpx.AsyncClient(timeout=90.0) as client:
        r = await client.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "HTTP-Referer": app_settings.CORS_ORIGINS.split(",")[0].strip(),
                "X-Title": app_settings.APP_NAME,
            },
            json=payload,
        )
        r.raise_for_status()
        data = r.json()
        return data["choices"][0]["message"]["content"].strip()


async def _call_openai(
    key: str,
    model: str,
    system: str,
    messages: list[dict],
    max_tokens: int = 1400,
) -> str:
    payload = {
        "model": model,
        "messages": [{"role": "system", "content": system}, *messages],
        "max_tokens": max_tokens,
        "temperature": 0.25,
    }
    async with httpx.AsyncClient(timeout=90.0) as client:
        r = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json=payload,
        )
        r.raise_for_status()
        data = r.json()
        return data["choices"][0]["message"]["content"].strip()


async def _call_anthropic(
    key: str,
    model: str,
    system: str,
    messages: list[dict],
    max_tokens: int = 1400,
) -> str:
    async with httpx.AsyncClient(timeout=90.0) as client:
        r = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "max_tokens": max_tokens,
                "system": system,
                "messages": messages,
            },
        )
        r.raise_for_status()
        data = r.json()
        parts = data.get("content") or []
        return "".join(p.get("text", "") for p in parts if p.get("type") == "text").strip()


async def chat(
    message: str,
    history: list[dict],
    *,
    mode: str = "auto",
    scope: str = "all",
    context_path: str | None = None,
    time_range: str | None = None,
) -> dict:
    """Return {reply, source, citations, actions, mode}."""
    parsed_msg, slash_scope, slash_mode = parse_slash_command(message)
    effective_scope = slash_scope if slash_scope != "all" else scope
    effective_mode = slash_mode if slash_mode != "auto" else mode

    if parsed_msg.lower().strip() in ("help", "") and message.strip().lower() == "/help":
        return {
            "reply": format_help_reply(),
            "source": "local",
            "citations": [],
            "actions": [
                {"label": "Open Detection", "path": "/detection", "kind": "navigate"},
                {"label": "Open Cases", "path": "/cases", "kind": "navigate"},
            ],
            "mode": "brief",
        }

    if message.strip().lower() == "/status" or (
        effective_mode == "brief" and parsed_msg.lower() in ("platform status", "soc status", "status")
    ):
        return {
            "reply": format_status_reply(time_range),
            "source": "local",
            "citations": [{"kind": "page", "id": "overview", "title": "Overview", "path": "/overview"}],
            "actions": [
                {"label": "Overview", "path": "/overview", "kind": "navigate"},
                {"label": "Detection", "path": "/detection", "kind": "navigate"},
                {"label": "Cases", "path": "/cases", "kind": "navigate"},
            ],
            "mode": effective_mode,
        }

    hits = search_soc(parsed_msg, limit=8, scope=effective_scope)  # type: ignore[arg-type]
    actions = build_actions(hits, context_path)
    settings = db.get_settings()
    key = (settings.get("ai_provider_key") or "").strip()
    model = (settings.get("ai_model") or DEFAULT_MODEL).strip() or DEFAULT_MODEL

    if not key:
        return {
            "reply": format_local_reply(parsed_msg, hits),
            "source": "local",
            "citations": _to_citations(hits),
            "actions": actions,
            "mode": effective_mode,
        }

    context = build_context_block()
    hit_block = json.dumps(
        [
            {
                "kind": h["kind"],
                "id": h["id"],
                "title": h["title"],
                "severity": h.get("severity"),
                "status": h.get("status"),
                "summary": h.get("summary"),
                "path": h.get("path"),
            }
            for h in hits
        ],
        indent=2,
    )
    mode_line = MODE_PROMPTS.get(effective_mode, MODE_PROMPTS["auto"])
    page_line = f"The analyst is currently viewing: {context_path}" if context_path else ""
    range_line = f"Selected time window: {time_range}" if time_range else ""

    system = (
        "You are PhantomX, an expert SOC analyst assistant for the SENTRIX platform. "
        f"Response mode: {effective_mode}. {mode_line}\n"
        "Answer using ONLY the SOC context and retrieved items below. "
        "Mention case/alert/rule IDs, severity, and status when relevant. "
        "If data is missing, say so — do not invent incidents.\n"
        f"{page_line}\n{range_line}\n\n"
        f"=== SOC CONTEXT ===\n{context}\n\n"
        f"=== RETRIEVED FOR THIS QUESTION (scope={effective_scope}) ===\n{hit_block}"
    )

    max_tokens = 512 if effective_mode == "brief" else 1400
    messages = [{"role": m["role"], "content": m["content"]} for m in history[-12:]]
    messages.append({"role": "user", "content": parsed_msg})

    try:
        if _is_openrouter(key, model):
            reply = await _call_openrouter(key, model, system, messages, max_tokens)
            source = "openrouter"
        elif _is_anthropic(key, model):
            reply = await _call_anthropic(key, model, system, messages, max_tokens)
            source = "anthropic"
        else:
            reply = await _call_openai(key, model, system, messages, max_tokens)
            source = "openai"
    except httpx.HTTPError as exc:
        fallback = format_local_reply(parsed_msg, hits)
        return {
            "reply": (
                f"{fallback}\n\n"
                f"_AI provider error ({type(exc).__name__}) — showing local search. "
                "Check API key in Admin → API Keys._"
            ),
            "source": "local",
            "citations": _to_citations(hits),
            "actions": actions,
            "mode": effective_mode,
        }

    return {
        "reply": reply,
        "source": source,
        "citations": _to_citations(hits),
        "actions": actions,
        "mode": effective_mode,
    }
