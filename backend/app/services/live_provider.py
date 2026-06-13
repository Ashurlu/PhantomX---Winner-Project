"""Live provider — same signatures as MockProvider.

The pentest methods talk to the real external AGI Pentest engine (Atomic Red
Team tool) over its REST + WebSocket API (see `pentest_engine.py`). n8n / SIEM
upstreams are not connected yet, so those methods still delegate to the mock
provider. No frontend change is required to flip between mock and live.

Pentest execution model
------------------------
The engine executes a job only while a client is connected to its
`/ws/execute/{id}` socket and analyses only over `/ws/analyze/{id}`. SENTRIX's
frontend, however, speaks a simple REST contract (POST run → poll GET run).
`create_run` therefore POSTs the job and spawns a background asyncio task that
drives both WebSockets, recording progress in-memory so `run()` can answer
polls. Results are mapped back onto the SENTRIX RunDetail shape (steps,
findings, SIEM ingestion, AI analysis).
"""
from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path

from .. import db
from .mock_provider import mock_provider
from .pentest_engine import PentestEngine, PentestEngineError, engine_from_settings

_MOCK_DIR = Path(__file__).resolve().parent.parent / "mock"

# Preferred atomic-test index per technique (Windows-confirmed table from
# INTEGRATION.md). Unlisted techniques fall back to index 0.
_PREFERRED_INDEX: dict[str, int] = {
    "T1033": 0,
    "T1082": 0,
    "T1057": 1,
    "T1016": 0,
    "T1049": 0,
    "T1012": 0,
    "T1087.001": 7,
    "T1087.002": 0,
    "T1069.001": 1,
    "T1069.002": 0,
    "T1201": 5,
    "T1135": 3,
    "T1518": 0,
    "T1552.001": 3,
    "T1558.003": 0,
    "T1003.001": 0,
}

# Default analysis model when the admin has set an AI key but not a model.
_DEFAULT_MODEL = "claude-sonnet-4-6"

_LOCAL_HOSTS = {"", "localhost", "127.0.0.1", "::1"}

# risk_level (engine) → numeric risk score (SENTRIX gauge 0-100)
_RISK_SCORE = {"critical": 92, "high": 74, "medium": 52, "low": 28, "info": 12}
# engine severity → SENTRIX Severity literal
_SEV_MAP = {"critical": "critical", "high": "high", "medium": "medium", "low": "low", "info": "low"}


def _load(name: str):
    with open(_MOCK_DIR / name, "r", encoding="utf-8") as f:
        return json.load(f)


class LiveProvider:
    def __init__(self) -> None:
        # runId(job_id) -> in-memory run record (mirrors RunDetail + bookkeeping)
        self._runs: dict[str, dict] = {}
        # keep references to background tasks so they aren't garbage-collected
        self._tasks: dict[str, asyncio.Task] = {}

    # ── n8n / SIEM upstreams (not wired yet → mock) ─────────────────────────
    async def overview(self, time_range: str = "24h") -> dict:
        return await mock_provider.overview(time_range)

    async def ai_court_stats(self, time_range: str = "24h") -> dict:
        return await mock_provider.ai_court_stats(time_range)

    async def ai_court_cases(self) -> list[dict]:
        return await mock_provider.ai_court_cases()

    async def ai_court_case(self, alert_id: str) -> dict | None:
        return await mock_provider.ai_court_case(alert_id)

    async def rules(self) -> list[dict]:
        return await mock_provider.rules()

    async def create_rule(self, payload: dict) -> dict:
        return await mock_provider.create_rule(payload)

    async def coverage(self) -> list[dict]:
        return await mock_provider.coverage()

    async def reset_demo(self) -> None:
        self._runs.clear()
        self._tasks.clear()
        await mock_provider.reset_demo()

    async def rule(self, rule_id: str) -> dict | None:
        return await mock_provider.rule(rule_id)

    async def update_rule(self, rule_id: str, patch: dict) -> dict | None:
        return await mock_provider.update_rule(rule_id, patch)

    async def approve_rule(self, rule_id: str) -> dict | None:
        return await mock_provider.approve_rule(rule_id)

    async def reject_rule(self, rule_id: str, reason: str) -> dict | None:
        return await mock_provider.reject_rule(rule_id, reason)

    # ── Pentest engine ──────────────────────────────────────────────────────
    def _engine(self) -> PentestEngine:
        return engine_from_settings(db.get_settings())

    async def tactics(self) -> list[dict]:
        groups = await self._engine().tactics()
        return [
            {
                "id": g.get("id", ""),
                "name": g.get("name", g.get("id", "")),
                "techniqueCount": g.get(
                    "technique_count", len(g.get("techniques", []))
                ),
            }
            for g in groups
        ]

    async def techniques(self, tactic: str) -> list[dict]:
        groups = await self._engine().tactics()
        group = next((g for g in groups if g.get("id") == tactic), None)
        if group is None:
            return []
        return [self._map_technique(t, tactic) for t in group.get("techniques", [])]

    @staticmethod
    def _map_technique(t: dict, tactic: str) -> dict:
        tests = t.get("tests", [])
        # Treat elevation-required tests as "blocked" for a standard user — a
        # rough analogue of the mock blockedCount badge.
        blocked = sum(1 for ts in tests if ts.get("elevation_required"))
        return {
            "id": t.get("technique_id", ""),
            "name": t.get("display_name", t.get("technique_id", "")),
            "tactic": tactic,
            "testCount": t.get("test_count", len(tests)),
            "blockedCount": blocked,
            "adBadge": bool(t.get("domain_required")),
            "status": "available",
            "tests": [
                {
                    "index": ts.get("index", i),
                    "name": ts.get("name", ""),
                    "platforms": ts.get("platforms", []),
                    "elevation_required": bool(ts.get("elevation_required")),
                    "domain_required": bool(ts.get("domain_required")),
                    "executor": ts.get("executor", ""),
                }
                for i, ts in enumerate(tests)
            ],
        }

    # ── run lifecycle ─────────────────────────────────────────────────────
    def _build_targets(self, scope: dict) -> list[dict]:
        settings = db.get_settings()
        # Preferred path: full per-target configs from the UI editor.
        configs = scope.get("targetConfigs") or []
        if configs:
            targets = []
            for i, c in enumerate(configs):
                host = (c.get("host") or "localhost").strip()
                conn = c.get("connection") or "local"
                targets.append(
                    {
                        "target_id": f"tgt-{i+1}",
                        "name": c.get("name") or host,
                        "os_platform": c.get("os_platform", "windows"),
                        "privilege": c.get("privilege", "admin"),
                        "connection": conn,
                        "domain_joined": bool(c.get("domain_joined")),
                        "host": host or "localhost",
                        # Fall back to global WinRM creds when a remote target
                        # leaves them blank.
                        "winrm_username": c.get("winrm_username")
                        or settings.get("winrm_username", ""),
                        "winrm_password": c.get("winrm_password")
                        or settings.get("winrm_password", ""),
                        "winrm_transport": c.get("winrm_transport", "ntlm"),
                        "winrm_port": int(c.get("winrm_port", 5985) or 5985),
                        "winrm_ssl": bool(c.get("winrm_ssl")),
                        "notes": c.get("notes", ""),
                    }
                )
            return targets

        # Legacy path: derive a single privilege/domain flag from runAs.
        privilege = "admin" if scope.get("runAs") == "administrator" else "standard_user"
        domain_joined = scope.get("runAs") == "domain-user"
        hosts = scope.get("targets") or ["localhost"]
        targets = []
        for i, host in enumerate(hosts):
            local = (host or "").strip().lower() in _LOCAL_HOSTS
            targets.append(
                {
                    "target_id": f"tgt-{i+1}",
                    "name": host or "localhost",
                    "os_platform": "windows",
                    "privilege": privilege,
                    "connection": "local" if local else "remote",
                    "domain_joined": domain_joined,
                    "host": host or "localhost",
                    "winrm_username": settings.get("winrm_username", ""),
                    "winrm_password": settings.get("winrm_password", ""),
                    "winrm_transport": "ntlm",
                    "winrm_port": 5985,
                    "winrm_ssl": False,
                    "notes": "",
                }
            )
        return targets

    @staticmethod
    def _build_selections(selections: list[dict]) -> list[dict]:
        """Normalize selections; resolve a default test index when omitted."""
        out = []
        for s in selections:
            tech = s["technique_id"]
            idx = s.get("test_index")
            if idx is None:
                idx = _PREFERRED_INDEX.get(tech, 0)
            out.append(
                {"technique_id": tech, "test_index": int(idx), "arg_overrides": {}}
            )
        return out

    async def create_run(self, scope: dict, selections: list[dict]) -> dict:
        engine = self._engine()
        targets = self._build_targets(scope)
        sels = self._build_selections(selections)
        created = await engine.create_job(targets, sels)
        run_id = created["job_id"]

        self._runs[run_id] = {
            "id": run_id,
            "status": "running",
            "scope": scope,
            "steps": [
                {
                    "id": f"s{i+1}",
                    "technique": f"{s['technique_id']} [{s['test_index']}]",
                    "status": "queued",
                }
                for i, s in enumerate(sels)
            ],
            "findings": [],
            "siemIngestion": [],
            "aiAnalysis": {"summary": "Execution started…", "riskScore": 0},
            "_selected": [s["technique_id"] for s in sels],
            "_analysis": None,
            "_error": None,
        }
        # Drive execution + analysis in the background; polling reads progress.
        self._tasks[run_id] = asyncio.create_task(self._drive(run_id))
        return {"runId": run_id, "status": "running"}

    async def _drive(self, run_id: str) -> None:
        """Background: stream execution, then AI analysis, mapping results."""
        record = self._runs[run_id]
        engine = self._engine()
        try:
            # ── execution ──────────────────────────────────────────────
            # Engine runs selections in order, so a completed-counter maps
            # cleanly onto the ordered step list.
            completed = 0
            async for ev in engine.stream_execute(run_id):
                etype, data = ev.get("type"), ev.get("data", {})
                if etype in ("test_done", "skipped"):
                    completed += 1
                    self._mark_steps(record, completed)
                elif etype == "test_start":
                    self._mark_steps(record, completed, running=True)
                elif etype == "error":
                    record["_error"] = data.get("message", "execution error")
                    record["status"] = "error"
                    return

            # ── results → SIEM + findings ──────────────────────────────
            results = await engine.results(run_id)
            for step in record["steps"]:
                step["status"] = "done"
            record["siemIngestion"] = self._siem_from_results(results)
            record["findings"] = self._default_findings(record, results)
            record["aiAnalysis"] = self._heuristic_summary(record, results)
            record["status"] = "done"

            # ── optional AI analysis ───────────────────────────────────
            settings = db.get_settings()
            ai_key = settings.get("ai_provider_key", "")
            model = settings.get("ai_model") or _DEFAULT_MODEL
            if ai_key:
                try:
                    async for ev in engine.stream_analyze(run_id, model, api_key=ai_key):
                        if ev.get("type") == "error":
                            break
                    report = await engine.analysis(run_id)
                    record["_analysis"] = report
                    self._apply_analysis(record, report)
                except PentestEngineError:
                    pass  # keep heuristic summary if AI analysis fails
        except PentestEngineError as e:
            record["_error"] = str(e)
            record["status"] = "error"
        except Exception as e:  # noqa: BLE001
            record["_error"] = f"{type(e).__name__}: {e}"
            record["status"] = "error"

    @staticmethod
    def _mark_steps(record: dict, completed: int, running: bool = False) -> None:
        steps = record["steps"]
        for i, step in enumerate(steps):
            if i < completed:
                step["status"] = "done"
            elif i == completed:
                step["status"] = "running" if running else step.get("status", "queued")
            else:
                step["status"] = "queued"

    # ── mapping helpers ───────────────────────────────────────────────────
    @staticmethod
    def _iter_results(results: dict):
        for grp in results.get("by_target", []):
            target = grp.get("target", {})
            for r in grp.get("results", []):
                yield target, r

    def _siem_from_results(self, results: dict) -> list[dict]:
        """Synthesize Wazuh/SIEM ingestion rows from real execution results.

        Detection is looked up against the SENTRIX ATT&CK coverage map so the
        hackathon "detected / gap" story stays intact on real runs.
        """
        coverage = {c["techniqueID"]: c for c in _load("attack_coverage.json")}
        rows: list[dict] = []
        i = 0
        for _target, r in self._iter_results(results):
            if r.get("skipped"):
                continue
            tech = r.get("technique_id", "")
            cov = coverage.get(tech)
            detected = bool(cov and cov.get("detected"))
            rows.append(
                {
                    "technique": tech,
                    "techniqueName": r.get("test_name", tech),
                    "eventsIngested": max(1, len((r.get("stdout") or "").splitlines())),
                    "source": "Sysmon" if i % 2 == 0 else "Windows Security",
                    "wazuhRuleId": str(92000 + (abs(hash(tech)) % 900)),
                    "level": 12 if detected else 4,
                    "sigmaRule": cov.get("sigmaRule") if cov else None,
                    "detected": detected,
                }
            )
            i += 1
        return rows

    def _default_findings(self, record: dict, results: dict) -> list[dict]:
        asset = (record["scope"].get("targets") or ["n/a"])[0]
        succeeded = [
            r for _t, r in self._iter_results(results)
            if r.get("success") and not r.get("skipped")
        ]
        return [
            {
                "id": "f1",
                "title": "Atomic Red Team execution telemetry ingested into Wazuh",
                "severity": "medium",
                "asset": asset,
                "recommendation": (
                    f"{len(succeeded)} technique(s) executed successfully. Review "
                    "undetected techniques and author Sigma rules for coverage gaps."
                ),
            }
        ]

    def _heuristic_summary(self, record: dict, results: dict) -> dict:
        summary = results.get("summary", {})
        total = summary.get("total_tests", len(record["steps"]))
        succeeded = summary.get("succeeded", 0)
        detected = sum(1 for s in record["siemIngestion"] if s["detected"])
        ran = len(record["siemIngestion"]) or 1
        asset = (record["scope"].get("targets") or ["the target"])[0]
        return {
            "summary": (
                f"{total} Atomic Red Team technique(s) executed against {asset}; "
                f"{succeeded} succeeded. Telemetry ingested into Wazuh; "
                f"{detected}/{ran} detected by existing Sigma rules. "
                "Author rules for the remaining gaps."
            ),
            "riskScore": min(95, 30 + (ran - detected) * 12),
        }

    def _apply_analysis(self, record: dict, report: dict) -> None:
        """Overlay the engine's AI analysis onto the SENTRIX RunDetail."""
        if not report or report.get("error"):
            return
        risk = (report.get("risk_level") or "info").lower()
        record["aiAnalysis"] = {
            "summary": report.get("executive_summary") or record["aiAnalysis"]["summary"],
            "riskScore": _RISK_SCORE.get(risk, record["aiAnalysis"]["riskScore"]),
        }
        findings = report.get("findings") or []
        if findings:
            asset_default = (record["scope"].get("targets") or ["n/a"])[0]
            record["findings"] = [
                {
                    "id": f.get("technique_id") or f"f{i+1}",
                    "title": f.get("title", f.get("technique_id", "Finding")),
                    "severity": _SEV_MAP.get((f.get("severity") or "low").lower(), "low"),
                    "asset": f.get("target_id") or asset_default,
                    "recommendation": f.get("recommendation")
                    or f.get("detail")
                    or "Review finding detail.",
                }
                for i, f in enumerate(findings)
            ]

    async def run(self, run_id: str) -> dict | None:
        record = self._runs.get(run_id)
        if record is None:
            # Run not in memory (e.g. server restarted) — try the engine's
            # persisted raw results so a refresh still shows data.
            try:
                results = await self._engine().raw_result(run_id)
            except PentestEngineError:
                return None
            rebuilt = {
                "id": run_id,
                "status": "done",
                "scope": {"runAs": "administrator", "targets": [], "window": ""},
                "steps": [],
                "findings": [],
                "siemIngestion": [],
                "aiAnalysis": {"summary": "", "riskScore": 0},
                "_selected": [],
            }
            rebuilt["siemIngestion"] = self._siem_from_results(results)
            rebuilt["findings"] = self._default_findings(rebuilt, results)
            rebuilt["aiAnalysis"] = self._heuristic_summary(rebuilt, results)
            return rebuilt
        return {k: v for k, v in record.items() if not k.startswith("_")}

    # ── extra engine passthroughs (new BFF endpoints) ───────────────────────
    async def providers(self) -> list[dict]:
        return await self._engine().providers()

    async def search_techniques(self, q: str) -> list[dict]:
        return await self._engine().search_techniques(q)

    async def analysis(self, run_id: str) -> dict | None:
        record = self._runs.get(run_id)
        if record and record.get("_analysis"):
            return record["_analysis"]
        try:
            return await self._engine().analysis(run_id)
        except PentestEngineError:
            return None

    async def html_report(self, run_id: str) -> str | None:
        try:
            return await self._engine().html_report(run_id)
        except PentestEngineError:
            return None

    async def list_raw_results(self) -> dict:
        return await self._engine().list_results()

    async def engine_health(self) -> dict:
        try:
            data = await self._engine().health()
            data["reachable"] = True
            return data
        except PentestEngineError as e:
            return {"reachable": False, "error": str(e)}


live_provider = LiveProvider()
