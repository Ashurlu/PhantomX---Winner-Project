"""Persist user-created and modified cases on top of mock inbox data."""
from __future__ import annotations

import copy
import json
from typing import Any

from .. import db
from .mock_provider import _load

CASES_OVERLAY_KEY = "cases_inbox_overlay"


def _empty_overlay() -> dict[str, Any]:
    return {
        "created": [],
        "deleted": [],
        "patches": {},
        "extraHistory": {},
        "notes": {},
    }


def _load_overlay() -> dict[str, Any]:
    conn = db._conn()
    try:
        row = conn.execute(
            "SELECT value FROM settings WHERE key = ?", (CASES_OVERLAY_KEY,)
        ).fetchone()
        if row is None or not row["value"]:
            return _empty_overlay()
        data = json.loads(row["value"])
        base = _empty_overlay()
        base.update(data)
        return base
    except (json.JSONDecodeError, TypeError):
        return _empty_overlay()
    finally:
        conn.close()


def _save_overlay(data: dict[str, Any]) -> None:
    conn = db._conn()
    try:
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?) "
            "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (CASES_OVERLAY_KEY, json.dumps(data)),
        )
        conn.commit()
    finally:
        conn.close()


def _base_cases() -> list[dict[str, Any]]:
    return copy.deepcopy(_load("cases_inbox.json"))


def _apply_overlay(case: dict[str, Any], overlay: dict[str, Any]) -> dict[str, Any]:
    cid = case["id"]
    patch = overlay.get("patches", {}).get(cid, {})
    merged = {**case, **patch}
    extra = overlay.get("extraHistory", {}).get(cid, [])
    base_hist = merged.get("history") or []
    if extra:
        seen = {e.get("id") for e in extra}
        merged["history"] = extra + [h for h in base_hist if h.get("id") not in seen]
    return merged


def list_inbox() -> list[dict[str, Any]]:
    overlay = _load_overlay()
    deleted = set(overlay.get("deleted", []))
    by_id: dict[str, dict[str, Any]] = {}

    for c in _base_cases():
        if c["id"] not in deleted:
            by_id[c["id"]] = _apply_overlay(c, overlay)

    for c in overlay.get("created", []):
        by_id[c["id"]] = copy.deepcopy(c)

    summaries = []
    for c in by_id.values():
        row = {k: v for k, v in c.items() if k != "history"}
        summaries.append(row)
    return summaries


def get_case(case_id: str) -> dict[str, Any] | None:
    overlay = _load_overlay()
    deleted = set(overlay.get("deleted", []))
    if case_id in deleted:
        return None

    for c in overlay.get("created", []):
        if c["id"] == case_id:
            return copy.deepcopy(c)

    for c in _base_cases():
        if c["id"] == case_id:
            return _apply_overlay(c, overlay)
    return None


def inbox_stats() -> dict[str, int]:
    cases = list_inbox()
    open_n = sum(1 for c in cases if c["status"] == "open")
    prog = sum(1 for c in cases if c["status"] == "in_progress")
    done = sum(1 for c in cases if c["status"] == "done")
    return {
        "open": open_n,
        "inProgress": prog,
        "done": done,
        "total": len(cases),
    }


def create_case(payload: dict[str, Any], history_event: dict[str, Any] | None = None) -> dict[str, Any]:
    overlay = _load_overlay()
    event = history_event or {
        "id": f"h-{payload['id']}-created",
        "type": "created",
        "actor": "User",
        "detail": "Case created manually",
        "timestamp": payload.get("createdAt", ""),
    }
    case = {**payload, "history": [event]}
    overlay["created"] = [case] + overlay.get("created", [])
    _save_overlay(overlay)
    return copy.deepcopy(case)


def patch_case(
    case_id: str,
    patch: dict[str, Any],
    *,
    history_event: dict[str, Any] | None = None,
    note: str | None = None,
) -> dict[str, Any]:
    overlay = _load_overlay()
    if case_id in set(overlay.get("deleted", [])):
        raise KeyError(case_id)

    created = overlay.get("created", [])
    idx = next((i for i, c in enumerate(created) if c["id"] == case_id), None)

    if idx is not None:
        created[idx] = {**created[idx], **patch}
    else:
        if get_case(case_id) is None:
            raise KeyError(case_id)
        patches = overlay.setdefault("patches", {})
        patches[case_id] = {**patches.get(case_id, {}), **patch}

    if history_event:
        if idx is not None:
            hist = created[idx].setdefault("history", [])
            created[idx]["history"] = [history_event] + hist
        else:
            eh = overlay.setdefault("extraHistory", {})
            eh.setdefault(case_id, []).insert(0, history_event)

    if note:
        notes = overlay.setdefault("notes", {})
        notes.setdefault(case_id, []).insert(0, note)

    overlay["created"] = created
    _save_overlay(overlay)
    result = get_case(case_id)
    if result is None:
        raise KeyError(case_id)
    return result


def delete_case(case_id: str) -> None:
    overlay = _load_overlay()
    before = len(overlay.get("created", []))
    overlay["created"] = [c for c in overlay.get("created", []) if c["id"] != case_id]
    if len(overlay["created"]) == before:
        deleted = set(overlay.get("deleted", []))
        deleted.add(case_id)
        overlay["deleted"] = list(deleted)

    overlay.get("patches", {}).pop(case_id, None)
    overlay.get("extraHistory", {}).pop(case_id, None)
    overlay.get("notes", {}).pop(case_id, None)
    _save_overlay(overlay)
