"""SQLite-backed user accounts + admin settings (API keys, data source).

Passwords are bcrypt-hashed. Admin/analyst demo accounts are seeded on first run.
Settings default from .env but are editable at runtime via the admin page.
"""
from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path

import bcrypt

from .config import settings as cfg

DB_PATH = Path(__file__).resolve().parent / "data" / "phantomx.db"

# Settings stored in the DB (admin-editable). Defaults seeded from .env.
SETTING_KEYS = [
    "data_source",
    "n8n_ir_base_url",
    "n8n_ir_api_key",
    "n8n_ad_base_url",
    "n8n_ad_api_key",
    "pentest_base_url",
    "pentest_api_key",
    "ai_provider_key",
    "ai_model",
    "winrm_username",
    "winrm_password",
]


def _conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def hash_password(password: str) -> str:
    # bcrypt 4.x rejects secrets > 72 bytes; truncate defensively.
    pw = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(
            password.encode("utf-8")[:72], password_hash.encode("utf-8")
        )
    except Exception:
        return False


def init_db() -> None:
    conn = _conn()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                username      TEXT PRIMARY KEY,
                password_hash TEXT NOT NULL,
                role          TEXT NOT NULL DEFAULT 'analyst',
                active        INTEGER NOT NULL DEFAULT 1,
                created_at    TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS settings (
                key   TEXT PRIMARY KEY,
                value TEXT NOT NULL DEFAULT ''
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS audit (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                actor     TEXT NOT NULL,
                action    TEXT NOT NULL,
                detail    TEXT NOT NULL DEFAULT ''
            )
            """
        )
        # Migration: add last_login to existing user tables.
        cols = [r[1] for r in conn.execute("PRAGMA table_info(users)").fetchall()]
        if "last_login" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN last_login TEXT")
        conn.commit()

        # Seed demo accounts once.
        _seed_user(conn, "admin", "admin123", "admin")
        _seed_user(conn, "analyst", "analyst123", "analyst")

        # Seed settings defaults from env.
        defaults = {
            "data_source": cfg.DATA_SOURCE,
            "n8n_base_url": cfg.N8N_BASE_URL,
            "n8n_api_key": cfg.N8N_API_KEY,
            "pentest_base_url": cfg.PENTEST_BASE_URL,
            "pentest_api_key": cfg.PENTEST_API_KEY,
            "ai_provider_key": "",
            "ai_model": "",
            "winrm_username": "",
            "winrm_password": "",
        }
        for key in SETTING_KEYS:
            row = conn.execute(
                "SELECT 1 FROM settings WHERE key = ?", (key,)
            ).fetchone()
            if row is None:
                conn.execute(
                    "INSERT INTO settings (key, value) VALUES (?, ?)",
                    (key, defaults.get(key, "")),
                )
        conn.commit()
    finally:
        conn.close()


def _seed_user(conn: sqlite3.Connection, username: str, password: str, role: str) -> None:
    row = conn.execute(
        "SELECT 1 FROM users WHERE username = ?", (username,)
    ).fetchone()
    if row is None:
        conn.execute(
            "INSERT INTO users (username, password_hash, role, active, created_at) "
            "VALUES (?, ?, ?, 1, ?)",
            (username, hash_password(password), role, _now()),
        )


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- Users ----------
def create_user(username: str, password: str, role: str = "analyst") -> dict | None:
    conn = _conn()
    try:
        exists = conn.execute(
            "SELECT 1 FROM users WHERE username = ?", (username,)
        ).fetchone()
        if exists:
            return None  # already taken
        conn.execute(
            "INSERT INTO users (username, password_hash, role, active, created_at) "
            "VALUES (?, ?, ?, 1, ?)",
            (username, hash_password(password), role, _now()),
        )
        conn.commit()
        return {"username": username, "role": role, "active": True, "createdAt": _now()}
    finally:
        conn.close()


def authenticate(username: str, password: str) -> str | None:
    conn = _conn()
    try:
        row = conn.execute(
            "SELECT password_hash, role, active FROM users WHERE username = ?",
            (username,),
        ).fetchone()
        if row is None or not row["active"]:
            return None
        if not verify_password(password, row["password_hash"]):
            return None
        return row["role"]
    finally:
        conn.close()


def get_user(username: str) -> dict | None:
    conn = _conn()
    try:
        row = conn.execute(
            "SELECT username, role, active, created_at, last_login "
            "FROM users WHERE username = ?",
            (username,),
        ).fetchone()
        return _user_dict(row) if row else None
    finally:
        conn.close()


def list_users() -> list[dict]:
    conn = _conn()
    try:
        rows = conn.execute(
            "SELECT username, role, active, created_at, last_login "
            "FROM users ORDER BY created_at"
        ).fetchall()
        return [_user_dict(r) for r in rows]
    finally:
        conn.close()


def touch_login(username: str) -> None:
    """Record a user's most recent successful login (real data)."""
    conn = _conn()
    try:
        conn.execute(
            "UPDATE users SET last_login = ? WHERE username = ?", (_now(), username)
        )
        conn.commit()
    finally:
        conn.close()


def set_role(username: str, role: str) -> dict | None:
    conn = _conn()
    try:
        cur = conn.execute(
            "UPDATE users SET role = ? WHERE username = ?", (role, username)
        )
        conn.commit()
        if cur.rowcount == 0:
            return None
        return get_user(username)
    finally:
        conn.close()


def set_active(username: str, active: bool) -> dict | None:
    conn = _conn()
    try:
        cur = conn.execute(
            "UPDATE users SET active = ? WHERE username = ?",
            (1 if active else 0, username),
        )
        conn.commit()
        if cur.rowcount == 0:
            return None
        return get_user(username)
    finally:
        conn.close()


def set_password(username: str, new_password: str) -> dict | None:
    conn = _conn()
    try:
        cur = conn.execute(
            "UPDATE users SET password_hash = ? WHERE username = ?",
            (hash_password(new_password), username),
        )
        conn.commit()
        if cur.rowcount == 0:
            return None
        return get_user(username)
    finally:
        conn.close()


def delete_user(username: str) -> bool:
    conn = _conn()
    try:
        cur = conn.execute("DELETE FROM users WHERE username = ?", (username,))
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def count_admins() -> int:
    conn = _conn()
    try:
        row = conn.execute(
            "SELECT COUNT(*) AS c FROM users WHERE role = 'admin' AND active = 1"
        ).fetchone()
        return row["c"]
    finally:
        conn.close()


def _user_dict(row: sqlite3.Row) -> dict:
    keys = row.keys()
    return {
        "username": row["username"],
        "role": row["role"],
        "active": bool(row["active"]),
        "createdAt": row["created_at"],
        "lastLogin": row["last_login"] if "last_login" in keys else None,
    }


# ---------- Settings ----------
def get_settings() -> dict:
    conn = _conn()
    try:
        rows = conn.execute("SELECT key, value FROM settings").fetchall()
        data = {r["key"]: r["value"] for r in rows}
        return {k: data.get(k, "") for k in SETTING_KEYS}
    finally:
        conn.close()


def update_settings(patch: dict) -> dict:
    conn = _conn()
    try:
        for key, value in patch.items():
            if key in SETTING_KEYS and value is not None:
                conn.execute(
                    "INSERT INTO settings (key, value) VALUES (?, ?) "
                    "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                    (key, str(value)),
                )
        conn.commit()
        return get_settings()
    finally:
        conn.close()


# ---------- Audit log ----------
def add_audit(actor: str, action: str, detail: str = "") -> None:
    """Best-effort audit logging — never raises into the request path."""
    try:
        conn = _conn()
        try:
            conn.execute(
                "INSERT INTO audit (timestamp, actor, action, detail) VALUES (?, ?, ?, ?)",
                (_now(), actor, action, detail),
            )
            conn.commit()
        finally:
            conn.close()
    except Exception:
        pass


def list_audit(limit: int = 150) -> list[dict]:
    conn = _conn()
    try:
        rows = conn.execute(
            "SELECT id, timestamp, actor, action, detail FROM audit "
            "ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [
            {
                "id": r["id"],
                "timestamp": r["timestamp"],
                "actor": r["actor"],
                "action": r["action"],
                "detail": r["detail"],
            }
            for r in rows
        ]
    finally:
        conn.close()


def get_data_source() -> str:
    conn = _conn()
    try:
        row = conn.execute(
            "SELECT value FROM settings WHERE key = 'data_source'"
        ).fetchone()
        return (row["value"] if row else cfg.DATA_SOURCE) or "mock"
    finally:
        conn.close()
