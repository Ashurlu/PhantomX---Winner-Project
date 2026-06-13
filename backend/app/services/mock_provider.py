"""Loads mock/*.json and returns plain dicts (validated by the routers).

In-memory mutations (rule approve/reject/edit, pentest runs) live here so the demo
feels stateful within a process lifetime. Swapping to live = implement live_provider.
"""
from __future__ import annotations

import asyncio
import json
import random
from datetime import datetime, timezone
from pathlib import Path

MOCK_DIR = Path(__file__).resolve().parent.parent / "mock"

# Scaling factors so the time-range selector visibly changes the telemetry.
_RANGE_FACTORS = {"24h": 1.0, "7d": 6.6, "30d": 27.0}


def _load(name: str):
    with open(MOCK_DIR / name, "r", encoding="utf-8") as f:
        return json.load(f)


async def _jitter():
    """Add 100-400ms latency so frontend loading states feel real."""
    await asyncio.sleep(random.uniform(0.1, 0.4))


class MockProvider:
    def __init__(self) -> None:
        # Mutable copies so the demo can change state in-process.
        self._rules: list[dict] = _load("rules.json")
        self._runs: dict[str, dict] = {}
        self._run_seq = 6
        # Highest existing rule id, so manual rules get fresh ids.
        self._rule_seq = max(
            (int(r["id"].split("-")[1]) for r in self._rules if r["id"].startswith("R-")),
            default=20,
        )

    # ---- Overview ----
    async def overview(self, time_range: str = "24h") -> dict:
        await _jitter()
        data = _load("overview.json")
        f = _RANGE_FACTORS.get(time_range, 1.0)
        if f == 1.0:
            return data

        def s(x: float) -> int:
            return int(round(x * f))

        for src in data["sources"]:
            src["logCount"] = s(src["logCount"])
        data["alerts"] = s(data["alerts"])
        data["incidents"] = s(data["incidents"])
        data["handling"]["automated"] = s(data["handling"]["automated"])
        data["handling"]["manual"] = s(data["handling"]["manual"])
        data["incidentsResolved"] = s(data["incidentsResolved"])
        data["incidentsOpen"] = s(data["incidentsOpen"])
        for k in data["openBySeverity"]:
            data["openBySeverity"][k] = s(data["openBySeverity"][k])
        data["falsePositivesAutoClosed"] = s(data["falsePositivesAutoClosed"])
        kpi = data["kpis"]
        kpi["dataIngestionTb24h"] = s(kpi["dataIngestionTb24h"])
        kpi["eventsIngestion24h"] = s(kpi["eventsIngestion24h"])
        kpi["preventedEvents"] = s(kpi["preventedEvents"])
        kpi["currentlyOpenIncidents"] = s(kpi["currentlyOpenIncidents"])
        kpi["oldestOpenDays"] = 8 if time_range == "24h" else (12 if time_range == "7d" else 26)
        kpi["ingestionSpark"] = [round(v * f, 1) for v in kpi["ingestionSpark"]]
        kpi["eventsSpark"] = [round(v * f, 1) for v in kpi["eventsSpark"]]
        return data

    # ---- AI Court ----
    async def ai_court_stats(self, time_range: str = "24h") -> dict:
        await _jitter()
        data = _load("ai_court_stats.json")
        f = _RANGE_FACTORS.get(time_range, 1.0)
        data["falsePositivesAutoClosed"] = int(round(data["falsePositivesAutoClosed"] * f))
        data["truePositivesShown"] = int(round(data["truePositivesShown"] * f))
        data["period"] = time_range
        return data

    async def ai_court_cases(self) -> list[dict]:
        await _jitter()
        return _load("ai_court_cases.json")

    async def ai_court_case(self, alert_id: str) -> dict | None:
        await _jitter()
        details = _load("ai_court_case_details.json")
        return details.get(alert_id)

    # ---- Rules ----
    async def rules(self) -> list[dict]:
        await _jitter()
        return [
            {
                k: r[k]
                for k in (
                    "id",
                    "title",
                    "severity",
                    "sourceAlertId",
                    "status",
                    "category",
                    "proposedAt",
                )
            }
            for r in self._rules
        ]

    async def create_rule(self, payload: dict) -> dict:
        # Manually authored Sigma rule (hackathon requirement #3).
        self._rule_seq += 1
        rule = {
            "id": f"R-{self._rule_seq}",
            "title": payload["title"],
            "description": payload.get("description", ""),
            "severity": payload.get("severity", "medium"),
            "sourceAlertId": payload.get("sourceAlertId", "manual"),
            "status": "pending",
            "category": payload.get("category", "incident-response"),
            "sigma": payload["sigma"],
            "kql": payload.get("kql", ""),
            "proposedAt": datetime.now(timezone.utc).isoformat(),
            "rejectReason": None,
        }
        self._rules.append(rule)
        return rule

    async def rule(self, rule_id: str) -> dict | None:
        await _jitter()
        return next((r for r in self._rules if r["id"] == rule_id), None)

    async def update_rule(self, rule_id: str, patch: dict) -> dict | None:
        rule = next((r for r in self._rules if r["id"] == rule_id), None)
        if rule is None:
            return None
        for key, value in patch.items():
            if value is not None:
                rule[key] = value
        return rule

    async def approve_rule(self, rule_id: str) -> dict | None:
        rule = next((r for r in self._rules if r["id"] == rule_id), None)
        if rule is None:
            return None
        rule["status"] = "approved"
        rule["rejectReason"] = None
        return rule

    async def reject_rule(self, rule_id: str, reason: str) -> dict | None:
        rule = next((r for r in self._rules if r["id"] == rule_id), None)
        if rule is None:
            return None
        rule["status"] = "rejected"
        rule["rejectReason"] = reason
        return rule

    # ---- Pentest ----
    async def tactics(self) -> list[dict]:
        await _jitter()
        return _load("pentest_tactics.json")

    async def techniques(self, tactic: str) -> list[dict]:
        await _jitter()
        data = _load("pentest_techniques.json")
        out = []
        for t in data:
            if t["tactic"] != tactic:
                continue
            t = dict(t)
            # Synthesize a couple of atomic tests so the test-level UI works
            # in mock mode (live mode returns real tests from the engine).
            t["tests"] = [
                {
                    "index": 0,
                    "name": t["name"],
                    "platforms": ["windows"],
                    "elevation_required": t.get("blockedCount", 0) > 0,
                    "domain_required": bool(t.get("adBadge")),
                    "executor": "command_prompt",
                },
                {
                    "index": 1,
                    "name": f"{t['name']} (PowerShell)",
                    "platforms": ["windows"],
                    "elevation_required": False,
                    "domain_required": bool(t.get("adBadge")),
                    "executor": "powershell",
                },
            ]
            out.append(t)
        return out

    async def create_run(self, scope: dict, selections: list[dict]) -> dict:
        self._run_seq += 1
        run_id = f"PEN-{self._run_seq}"
        selected = [s["technique_id"] for s in selections]
        steps = [
            {
                "id": f"s{i+1}",
                "technique": f"{s['technique_id']} [{s.get('test_index', 0)}]",
                "status": "queued",
            }
            for i, s in enumerate(selections)
        ]
        self._runs[run_id] = {
            "id": run_id,
            "status": "queued",
            "scope": scope,
            "steps": steps,
            "findings": [],
            "siemIngestion": [],
            "aiAnalysis": {"summary": "Run queued — no findings yet", "riskScore": 0},
            "_selected": selected,
            "_created": datetime.now(timezone.utc),
        }
        return {"runId": run_id, "status": "queued"}

    async def run(self, run_id: str) -> dict | None:
        await _jitter()
        run = self._runs.get(run_id)
        if run is None:
            # Allow GET on a seeded sample run for first-load demos.
            sample = _load("pentest_sample_run.json")
            if sample["id"] == run_id:
                return sample
            return None
        # Simulate progress over time so EXECUTE tab animates.
        elapsed = (datetime.now(timezone.utc) - run["_created"]).total_seconds()
        total = len(run["steps"]) or 1
        done = min(total, int(elapsed // 2))
        for i, step in enumerate(run["steps"]):
            if i < done:
                step["status"] = "done"
            elif i == done:
                step["status"] = "running"
            else:
                step["status"] = "queued"
        if done >= total:
            run["status"] = "done"
            asset = run["scope"]["targets"][0] if run["scope"]["targets"] else "n/a"
            run["siemIngestion"] = self._siem_for(run.get("_selected", []))
            detected = sum(1 for s in run["siemIngestion"] if s["detected"])
            run["findings"] = [
                {
                    "id": "f1",
                    "title": "Atomic Red Team execution telemetry ingested into Wazuh",
                    "severity": "medium",
                    "asset": asset,
                    "recommendation": "Review undetected techniques and author Sigma rules for coverage gaps",
                }
            ]
            run["aiAnalysis"] = {
                "summary": (
                    f"{total} Atomic Red Team technique(s) executed against {asset}. "
                    f"Telemetry ingested into Wazuh; {detected}/{total} detected by existing "
                    f"Sigma rules. Author rules for the remaining gaps."
                ),
                "riskScore": min(95, 30 + (total - detected) * 12),
            }
        elif done > 0:
            run["status"] = "running"
        result = {k: v for k, v in run.items() if not k.startswith("_")}
        return result

    def _siem_for(self, selected: list[str]) -> list[dict]:
        """Synthesize Wazuh/SIEM ingestion rows for the executed techniques."""
        coverage = {c["techniqueID"]: c for c in _load("attack_coverage.json")}
        techs = {t["id"]: t for t in _load("pentest_techniques.json")}
        rows = []
        for i, tech in enumerate(selected):
            cov = coverage.get(tech)
            name = (cov or techs.get(tech, {})).get("name", tech)
            detected = bool(cov and cov["detected"])
            rows.append(
                {
                    "technique": tech,
                    "techniqueName": name,
                    "eventsIngested": 12 + (i * 37) % 140,
                    "source": "Sysmon" if i % 2 == 0 else "Windows Security",
                    "wazuhRuleId": str(92000 + (hash(tech) % 900)),
                    "level": 12 if detected else 4,
                    "sigmaRule": cov.get("sigmaRule") if cov else None,
                    "detected": detected,
                }
            )
        return rows

    # ---- Pentest engine passthroughs (mock equivalents) ----
    async def providers(self) -> list[dict]:
        await _jitter()
        return [
            {"model_id": "claude-sonnet-4-6", "provider": "anthropic"},
            {"model_id": "claude-opus-4-8", "provider": "anthropic"},
            {"model_id": "claude-haiku-4-5", "provider": "anthropic"},
            {"model_id": "gpt-4o", "provider": "openai"},
            {"model_id": "gpt-4o-mini", "provider": "openai"},
            {"model_id": "gemini-2.0-flash", "provider": "google"},
            {"model_id": "ollama-llama3", "provider": "ollama"},
        ]

    async def search_techniques(self, q: str) -> list[dict]:
        await _jitter()
        data = _load("pentest_techniques.json")
        ql = q.lower()
        return [
            {"technique_id": t["id"], "display_name": t["name"], "test_count": t["testCount"]}
            for t in data
            if ql in t["id"].lower() or ql in t["name"].lower()
        ]

    async def analysis(self, run_id: str) -> dict | None:
        """Synthesize a parsed AI analysis report for a completed mock run."""
        run = await self.run(run_id)
        if run is None:
            return None
        findings = [
            {
                "severity": f["severity"],
                "technique_id": s["technique"],
                "tactic": "discovery",
                "target_id": f["asset"],
                "title": f["title"],
                "detail": s["techniqueName"],
                "evidence": f"Wazuh rule {s['wazuhRuleId']} at level {s['level']}",
                "recommendation": f["recommendation"],
            }
            for f, s in zip(run["findings"], run["siemIngestion"] or [{}])
            if s
        ]
        detected = [s["technique"] for s in run["siemIngestion"] if s["detected"]]
        gaps = [s["technique"] for s in run["siemIngestion"] if not s["detected"]]
        score = run["aiAnalysis"]["riskScore"]
        level = "high" if score >= 70 else "medium" if score >= 40 else "low"
        return {
            "executive_summary": run["aiAnalysis"]["summary"],
            "risk_level": level,
            "findings": findings,
            "succeeded_techniques": detected,
            "failed_techniques": gaps,
            "key_observations": [
                f"{len(detected)} technique(s) detected by existing Sigma rules.",
                f"{len(gaps)} coverage gap(s) require new detections.",
            ],
            "attack_path": " → ".join(s["technique"] for s in run["siemIngestion"]) or "n/a",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "error": None,
        }

    async def html_report(self, run_id: str) -> str | None:
        run = await self.run(run_id)
        if run is None:
            return None
        rows = "".join(
            f"<tr><td>{s['technique']}</td><td>{s['techniqueName']}</td>"
            f"<td>{'Detected' if s['detected'] else 'Gap'}</td>"
            f"<td>{s['wazuhRuleId']}</td></tr>"
            for s in run["siemIngestion"]
        )
        return (
            f"<html><head><title>Pentest Report {run_id}</title></head><body>"
            f"<h1>AGI Pentest Report — {run_id}</h1>"
            f"<p>{run['aiAnalysis']['summary']}</p>"
            f"<p><b>Risk score:</b> {run['aiAnalysis']['riskScore']}</p>"
            f"<table border='1' cellpadding='6'><tr><th>Technique</th><th>Name</th>"
            f"<th>SIEM</th><th>Wazuh rule</th></tr>{rows}</table>"
            f"</body></html>"
        )

    async def list_raw_results(self) -> dict:
        await _jitter()
        files = [
            {
                "job_id": rid,
                "filename": f"{rid}.json",
                "size_bytes": 0,
                "path": "(in-memory mock run)",
                "url": f"/api/v1/pentest/runs/{rid}",
                "analysis_url": f"/api/v1/pentest/runs/{rid}/analysis",
            }
            for rid in self._runs
        ]
        return {"results_dir": "(mock)", "count": len(files), "files": files}

    async def engine_health(self) -> dict:
        return {
            "reachable": True,
            "status": "ok",
            "mode": "mock",
            "techniques_loaded": len(_load("pentest_techniques.json")),
            "jobs": len(self._runs),
        }

    # ---- ATT&CK Navigator coverage ----
    async def coverage(self) -> list[dict]:
        await _jitter()
        return _load("attack_coverage.json")

    # ---- Maintenance ----
    async def reset_demo(self) -> None:
        self._rules = _load("rules.json")
        self._runs = {}
        self._rule_seq = max(
            (int(r["id"].split("-")[1]) for r in self._rules if r["id"].startswith("R-")),
            default=20,
        )


mock_provider = MockProvider()
