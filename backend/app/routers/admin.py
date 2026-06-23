"""Admin-only control: API keys & endpoints, user management, data source, status.

Every route requires the `admin` role. API keys live server-side and are only
ever returned to an authenticated admin — never to analysts or the bundle.
"""
import time
import urllib.error
import urllib.request

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

from .. import db
from ..auth import require_role
from ..models import (
    ActiveUpdate,
    AdminSettings,
    AdminSettingsUpdate,
    AuditEntry,
    ConnectionTestRequest,
    ConnectionTestResult,
    CreateUserRequest,
    IntegrationStatus,
    PasswordUpdate,
    RoleUpdate,
    SystemStatus,
    UserOut,
)
from ..services.provider import get_provider

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

admin_only = require_role("admin")


# ---------- Settings / API keys ----------
def _settings_to_model(s: dict) -> AdminSettings:
    return AdminSettings(
        dataSource=s.get("data_source", "mock") or "mock",
        n8nBaseUrl=s.get("n8n_base_url", ""),
        n8nApiKey=s.get("n8n_api_key", ""),
        pentestBaseUrl=s.get("pentest_base_url", ""),
        pentestApiKey=s.get("pentest_api_key", ""),
        aiProviderKey=s.get("ai_provider_key", ""),
        aiModel=s.get("ai_model", ""),
        winrmUsername=s.get("winrm_username", ""),
        winrmPassword=s.get("winrm_password", ""),
    )


@router.get("/settings", response_model=AdminSettings)
async def get_settings(_: dict = Depends(admin_only)):
    return _settings_to_model(db.get_settings())


@router.put("/settings", response_model=AdminSettings)
async def update_settings(body: AdminSettingsUpdate, admin: dict = Depends(admin_only)):
    patch = {
        "data_source": body.dataSource,
        "n8n_base_url": body.n8nBaseUrl,
        "n8n_api_key": body.n8nApiKey,
        "pentest_base_url": body.pentestBaseUrl,
        "pentest_api_key": body.pentestApiKey,
        "ai_provider_key": body.aiProviderKey,
        "ai_model": body.aiModel,
        "winrm_username": body.winrmUsername,
        "winrm_password": body.winrmPassword,
    }
    patch = {k: v for k, v in patch.items() if v is not None}
    # Audit without leaking secret values — just which keys changed.
    changed = ", ".join(sorted(patch.keys())) or "nothing"
    db.add_audit(admin["username"], "settings.update", f"changed: {changed}")
    return _settings_to_model(db.update_settings(patch))


# ---------- User management ----------
@router.get("/users", response_model=list[UserOut])
async def list_users(_: dict = Depends(admin_only)):
    return db.list_users()


@router.post("/users", response_model=UserOut, status_code=201)
async def create_user(body: CreateUserRequest, admin: dict = Depends(admin_only)):
    username = body.username.strip()
    if len(username) < 3:
        raise HTTPException(status_code=422, detail="Username must be at least 3 characters")
    if len(body.password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters")
    try:
        created = db.create_user(username, body.password, role=body.role)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    if created is None:
        raise HTTPException(status_code=409, detail="Username already taken")
    db.add_audit(admin["username"], "user.create", f"{username} ({body.role})")
    return created


@router.put("/users/{username}/role", response_model=UserOut)
async def set_role(username: str, body: RoleUpdate, admin: dict = Depends(admin_only)):
    target = db.get_user(username)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    # Don't allow removing the last active admin.
    if target["role"] == "admin" and body.role != "admin" and db.count_admins() <= 1:
        raise HTTPException(status_code=400, detail="Cannot demote the last admin")
    db.add_audit(admin["username"], "user.role", f"{username} -> {body.role}")
    return db.set_role(username, body.role)


@router.put("/users/{username}/active", response_model=UserOut)
async def set_active(username: str, body: ActiveUpdate, admin: dict = Depends(admin_only)):
    target = db.get_user(username)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    if username == admin["username"] and not body.active:
        raise HTTPException(status_code=400, detail="You cannot deactivate yourself")
    if target["role"] == "admin" and not body.active and db.count_admins() <= 1:
        raise HTTPException(status_code=400, detail="Cannot deactivate the last admin")
    db.add_audit(
        admin["username"],
        "user.active",
        f"{username} -> {'enabled' if body.active else 'disabled'}",
    )
    return db.set_active(username, body.active)


@router.put("/users/{username}/password", response_model=UserOut)
async def set_password(
    username: str, body: PasswordUpdate, admin: dict = Depends(admin_only)
):
    if len(body.password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters")
    if db.get_user(username) is None:
        raise HTTPException(status_code=404, detail="User not found")
    db.add_audit(admin["username"], "user.password", f"reset for {username}")
    return db.set_password(username, body.password)


@router.delete("/users/{username}")
async def delete_user(username: str, admin: dict = Depends(admin_only)):
    target = db.get_user(username)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    if username == admin["username"]:
        raise HTTPException(status_code=400, detail="You cannot delete yourself")
    if target["role"] == "admin" and db.count_admins() <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last admin")
    db.delete_user(username)
    db.add_audit(admin["username"], "user.delete", username)
    return {"deleted": username}


# ---------- Audit log ----------
@router.get("/audit", response_model=list[AuditEntry])
async def audit_log(_: dict = Depends(admin_only)):
    return db.list_audit()


# ---------- Integration connection tests ----------
def _ping(url: str, timeout: float = 3.0) -> tuple[bool, str, int]:
    start = time.perf_counter()
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            ms = int((time.perf_counter() - start) * 1000)
            return True, f"HTTP {resp.status}", ms
    except urllib.error.HTTPError as e:
        ms = int((time.perf_counter() - start) * 1000)
        # An HTTP error still means the host is reachable.
        return True, f"HTTP {e.code}", ms
    except Exception as e:  # noqa: BLE001
        ms = int((time.perf_counter() - start) * 1000)
        return False, type(e).__name__, ms


@router.post("/test-connection", response_model=ConnectionTestResult)
async def test_connection(body: ConnectionTestRequest, admin: dict = Depends(admin_only)):
    s = db.get_settings()
    if body.target == "n8n":
        url = s.get("n8n_base_url", "")
    elif body.target == "pentest":
        base = s.get("pentest_base_url", "")
        url = base.rstrip("/") + "/health" if base else ""
    else:  # ai
        configured = bool(s.get("ai_provider_key"))
        db.add_audit(admin["username"], "integration.test", "ai")
        return ConnectionTestResult(
            target="ai",
            reachable=configured,
            detail="API key present" if configured else "No API key configured",
            latencyMs=0,
        )

    if not url:
        return ConnectionTestResult(
            target=body.target, reachable=False, detail="No endpoint configured", latencyMs=0
        )
    reachable, detail, ms = _ping(url)
    db.add_audit(admin["username"], "integration.test", f"{body.target}: {detail}")
    return ConnectionTestResult(target=body.target, reachable=reachable, detail=detail, latencyMs=ms)


# ---------- Maintenance ----------
@router.post("/reset-demo")
async def reset_demo(admin: dict = Depends(admin_only)):
    await get_provider().reset_demo()
    db.add_audit(admin["username"], "maintenance.reset_demo", "rules re-seeded, runs cleared")
    return {"status": "ok", "detail": "Demo data re-seeded (rules reset, pentest runs cleared)."}


@router.get("/export-config")
async def export_config(admin: dict = Depends(admin_only)):
    s = db.get_settings()
    db.add_audit(admin["username"], "maintenance.export_config", "settings exported")
    config = {
        "exportedBy": admin["username"],
        "settings": {
            "dataSource": s.get("data_source", "mock"),
            "n8nBaseUrl": s.get("n8n_base_url", ""),
            "pentestBaseUrl": s.get("pentest_base_url", ""),
            # Secret values are masked in the export.
            "n8nApiKey": _mask(s.get("n8n_api_key", "")),
            "pentestApiKey": _mask(s.get("pentest_api_key", "")),
            "aiProviderKey": _mask(s.get("ai_provider_key", "")),
        },
        "users": [
            {"username": u["username"], "role": u["role"], "active": u["active"]}
            for u in db.list_users()
        ],
    }
    return JSONResponse(
        content=config,
        headers={"Content-Disposition": 'attachment; filename="phantomx_config.json"'},
    )


def _mask(value: str) -> str:
    if not value:
        return ""
    if len(value) <= 4:
        return "••••"
    return "••••" + value[-4:]


# ---------- System status ----------
@router.get("/status", response_model=SystemStatus)
async def system_status(_: dict = Depends(admin_only)):
    s = db.get_settings()
    users = db.list_users()
    integrations = [
        IntegrationStatus(
            name="n8n (AI Court / Rules)",
            configured=bool(s.get("n8n_base_url") and s.get("n8n_api_key")),
            detail=s.get("n8n_base_url") or "not configured",
        ),
        IntegrationStatus(
            name="Pentest tool",
            configured=bool(s.get("pentest_base_url") and s.get("pentest_api_key")),
            detail=s.get("pentest_base_url") or "not configured",
        ),
        IntegrationStatus(
            name="AI provider",
            configured=bool(s.get("ai_provider_key")),
            detail="key set" if s.get("ai_provider_key") else "not configured",
        ),
    ]
    return SystemStatus(
        status="ok",
        dataSource=s.get("data_source", "mock") or "mock",
        userCount=len(users),
        adminCount=sum(1 for u in users if u["role"] == "admin" and u["active"]),
        integrations=integrations,
    )
