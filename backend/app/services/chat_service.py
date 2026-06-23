"""SOC chatbot — local search fallback + OpenRouter / OpenAI / Anthropic."""
from __future__ import annotations

import json

import httpx

from .. import db
from ..config import settings as app_settings
from .soc_context import build_context_block, format_local_reply, search_soc

DEFAULT_MODEL = "openai/gpt-4o-mini"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


def _to_citations(hits: list[dict]) -> list[dict]:
    return [
        {
            "kind": h["kind"],
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
) -> str:
    payload = {
        "model": _normalize_openrouter_model(model),
        "messages": [{"role": "system", "content": system}, *messages],
        "max_tokens": 1024,
        "temperature": 0.2,
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
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
) -> str:
    payload = {
        "model": model,
        "messages": [{"role": "system", "content": system}, *messages],
        "max_tokens": 1024,
        "temperature": 0.2,
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
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
) -> str:
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "max_tokens": 1024,
                "system": system,
                "messages": messages,
            },
        )
        r.raise_for_status()
        data = r.json()
        parts = data.get("content") or []
        return "".join(p.get("text", "") for p in parts if p.get("type") == "text").strip()


async def chat(message: str, history: list[dict]) -> dict:
    """Return {reply, source, citations}."""
    hits = search_soc(message, limit=6)
    settings = db.get_settings()
    key = (settings.get("ai_provider_key") or "").strip()
    model = (settings.get("ai_model") or DEFAULT_MODEL).strip() or DEFAULT_MODEL

    if not key:
        return {
            "reply": format_local_reply(message, hits),
            "source": "local",
            "citations": _to_citations(hits),
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
    system = (
        "You are PhantomX, an expert SOC analyst assistant for the SENTRIX platform. "
        "Answer the analyst's question using ONLY the SOC context and retrieved items below. "
        "Be concise (2–5 short paragraphs max). Mention case/alert IDs, severity, status, assignee, "
        "linked alerts and rules when relevant. If the data does not contain the answer, say so clearly. "
        "Do not invent incidents not listed in the context.\n\n"
        f"=== SOC CONTEXT ===\n{context}\n\n"
        f"=== RETRIEVED FOR THIS QUESTION ===\n{hit_block}"
    )

    messages = [{"role": m["role"], "content": m["content"]} for m in history[-8:]]
    messages.append({"role": "user", "content": message})

    try:
        if _is_openrouter(key, model):
            reply = await _call_openrouter(key, model, system, messages)
            source = "openrouter"
        elif _is_anthropic(key, model):
            reply = await _call_anthropic(key, model, system, messages)
            source = "anthropic"
        else:
            reply = await _call_openai(key, model, system, messages)
            source = "openai"
    except httpx.HTTPError as exc:
        fallback = format_local_reply(message, hits)
        return {
            "reply": (
                f"{fallback}\n\n"
                f"_AI provider error ({type(exc).__name__}) — showing local search results. "
                "Check your API key and model in Admin → API Keys._"
            ),
            "source": "local",
            "citations": _to_citations(hits),
        }

    return {
        "reply": reply,
        "source": source,
        "citations": _to_citations(hits),
    }
