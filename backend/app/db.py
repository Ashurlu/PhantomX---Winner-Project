"""SQLite-backed user accounts + admin settings (API keys, data source).

Passwords are bcrypt-hashed. Admin/analyst demo accounts are seeded on first run.
Settings default from .env but are editable at runtime via the admin page.
"""
from __future__ import annotations

import os
import shutil
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

import bcrypt

from .config import settings as cfg

_LEGACY_DB = Path(__file__).resolve().parent / "data" / "phantomx.db"


def _resolve_db_path() -> Path:
    override = os.environ.get("PHANTOMX_DB_PATH")
    if override:
        return Path(override)
    # SQLite + OneDrive sync causes "unable to open database file" on writes.
    if os.name == "nt" and "OneDrive" in str(_LEGACY_DB):
        return Path(os.environ.get("LOCALAPPDATA", Path.home())) / "PhantomX" / "phantomx.db"
    return _LEGACY_DB


DB_PATH = _resolve_db_path()
AVATAR_DIR = DB_PATH.parent / "avatars"
ALLOWED_AVATAR_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/pjpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_AVATAR_BYTES = 2 * 1024 * 1024

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
    # Use str() for Windows paths with non-ASCII chars; timeout helps sync-folder locks.
    conn = sqlite3.connect(str(DB_PATH), timeout=30.0)
    conn.row_factory = sqlite3.Row
    # DELETE journal avoids -wal/-shm sidecars that break on synced folders (OneDrive).
    conn.execute("PRAGMA journal_mode=DELETE")
    return conn


def _migrate_legacy_db() -> None:
    """Copy existing project DB into local app data when we moved off OneDrive."""
    if DB_PATH.resolve() == _LEGACY_DB.resolve():
        return
    if DB_PATH.exists() or not _LEGACY_DB.exists():
        return
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(_LEGACY_DB, DB_PATH)


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
    _migrate_legacy_db()
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
        if "avatar_path" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN avatar_path TEXT")
        if "email" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN email TEXT")
        AVATAR_DIR.mkdir(parents=True, exist_ok=True)

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
        "SELECT password_hash FROM users WHERE username = ?", (username,)
    ).fetchone()
    if row is None:
        conn.execute(
            "INSERT INTO users (username, password_hash, role, active, created_at) "
            "VALUES (?, ?, ?, 1, ?)",
            (username, hash_password(password), role, _now()),
        )
        return
    # Keep demo accounts usable if passwords were changed or hashes corrupted.
    if username in ("admin", "analyst") and not verify_password(password, row["password_hash"]):
        conn.execute(
            "UPDATE users SET password_hash = ?, role = ?, active = 1 WHERE username = ?",
            (hash_password(password), role, username),
        )


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- Users ----------
def create_user(username: str, password: str, role: str = "analyst") -> dict | None:
    username = _normalize_username(username)
    if not _valid_username(username):
        raise ValueError(
            "Username must be at least 3 characters (letters, numbers, - or _)."
        )
    if len(password) < 6:
        raise ValueError("Password must be at least 6 characters.")
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
    except sqlite3.Error as exc:
        raise RuntimeError(f"Database error: {exc}") from exc
    finally:
        conn.close()
    user = get_user(username)
    if user is None:
        raise RuntimeError("User was created but could not be loaded.")
    return user


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
            "SELECT username, role, active, created_at, last_login, avatar_path, email "
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
            "SELECT username, role, active, created_at, last_login, avatar_path, email "
            "FROM users ORDER BY created_at"
        ).fetchall()
        return [_user_dict(r) for r in rows]
    finally:
        conn.close()


def touch_login(username: str) -> None:
    """Record a user's most recent successful login (best-effort)."""
    try:
        conn = _conn()
        try:
            conn.execute(
                "UPDATE users SET last_login = ? WHERE username = ?", (_now(), username)
            )
            conn.commit()
        finally:
            conn.close()
    except Exception:
        pass


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
    avatar_path = row["avatar_path"] if "avatar_path" in keys else None
    email = row["email"] if "email" in keys else None
    return {
        "username": row["username"],
        "role": row["role"],
        "active": bool(row["active"]),
        "createdAt": row["created_at"],
        "lastLogin": row["last_login"] if "last_login" in keys else None,
        "avatarUrl": avatar_public_path(avatar_path),
        "email": email,
    }


def _normalize_username(username: str) -> str:
    return username.strip()


def _valid_username(username: str) -> bool:
    u = _normalize_username(username)
    return len(u) >= 3 and all(c.isalnum() or c in "-_" for c in u)


def update_email(username: str, email: str | None) -> dict | None:
    conn = _conn()
    try:
        cur = conn.execute(
            "UPDATE users SET email = ? WHERE username = ?",
            (email.strip() if email else None, username),
        )
        conn.commit()
        if cur.rowcount == 0:
            return None
        return get_user(username)
    finally:
        conn.close()


def rename_user(old_username: str, new_username: str) -> dict | None:
    new_username = _normalize_username(new_username)
    if not _valid_username(new_username):
        raise ValueError("Username must be at least 3 characters (letters, numbers, - or _).")
    if new_username == old_username:
        return get_user(old_username)

    conn = _conn()
    try:
        taken = conn.execute(
            "SELECT 1 FROM users WHERE username = ?", (new_username,)
        ).fetchone()
        if taken:
            raise ValueError("Username already taken")

        row = conn.execute(
            "SELECT avatar_path FROM users WHERE username = ?", (old_username,)
        ).fetchone()
        if row is None:
            return None

        cur = conn.execute(
            "UPDATE users SET username = ? WHERE username = ?",
            (new_username, old_username),
        )
        conn.commit()
        if cur.rowcount == 0:
            return None

        # Rename avatar file if present.
        stored = row["avatar_path"]
        if stored:
            old_path = AVATAR_DIR / Path(stored).name
            if old_path.is_file():
                safe_user = "".join(
                    c if c.isalnum() or c in "-_" else "_" for c in new_username
                )
                ext = old_path.suffix
                new_path = AVATAR_DIR / f"{safe_user}{ext}"
                if new_path != old_path:
                    old_path.rename(new_path)
                    conn.execute(
                        "UPDATE users SET avatar_path = ? WHERE username = ?",
                        (new_path.name, new_username),
                    )
                    conn.commit()

        return get_user(new_username)
    finally:
        conn.close()


def change_password(username: str, current_password: str, new_password: str) -> bool:
    role = authenticate(username, current_password)
    if role is None:
        return False
    if len(new_password) < 6:
        raise ValueError("New password must be at least 6 characters.")
    return set_password(username, new_password) is not None


def sniff_image_content_type(content: bytes, content_type: str | None) -> str | None:
    if content_type and content_type.lower() in ALLOWED_AVATAR_TYPES:
        return content_type.lower()
    if content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if content.startswith(b"GIF87a") or content.startswith(b"GIF89a"):
        return "image/gif"
    if len(content) >= 12 and content[0:4] == b"RIFF" and content[8:12] == b"WEBP":
        return "image/webp"
    return None


def avatar_public_path(stored: str | None) -> str | None:
    """Relative URL served by StaticFiles under /api/v1/avatars/."""
    if not stored:
        return None
    name = Path(stored).name
    if not (AVATAR_DIR / name).is_file():
        return None
    return f"/api/v1/avatars/{name}"


def save_avatar(username: str, content: bytes, content_type: str | None) -> str:
    """Validate, store avatar file, return public path."""
    resolved = sniff_image_content_type(content, content_type)
    if resolved is None:
        raise ValueError("Unsupported image type. Use JPEG, PNG, WebP, or GIF.")
    if len(content) > MAX_AVATAR_BYTES:
        raise ValueError("Image must be 2 MB or smaller.")

    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    ext = ALLOWED_AVATAR_TYPES[resolved]
    safe_user = "".join(c if c.isalnum() or c in "-_" else "_" for c in username)
    filename = f"{safe_user}{ext}"

    # Remove previous avatars for this user (any extension).
    for old in AVATAR_DIR.glob(f"{safe_user}.*"):
        old.unlink(missing_ok=True)

    (AVATAR_DIR / filename).write_bytes(content)

    conn = _conn()
    try:
        conn.execute(
            "UPDATE users SET avatar_path = ? WHERE username = ?",
            (filename, username),
        )
        conn.commit()
    finally:
        conn.close()

    return avatar_public_path(filename) or ""


def delete_avatar(username: str) -> None:
    conn = _conn()
    try:
        row = conn.execute(
            "SELECT avatar_path FROM users WHERE username = ?", (username,)
        ).fetchone()
        if row is None:
            return
        stored = row["avatar_path"]
        conn.execute(
            "UPDATE users SET avatar_path = NULL WHERE username = ?", (username,)
        )
        conn.commit()
    finally:
        conn.close()
    if stored:
        (AVATAR_DIR / Path(stored).name).unlink(missing_ok=True)


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
