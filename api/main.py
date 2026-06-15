"""
FastAPI — REST + WebSocket endpoints.
Two flows:
  1. Execute job (deterministic, no AI)  → POST /api/jobs  +  WS /ws/execute
  2. Analyze results (AI)                → POST /api/analyze  +  WS /ws/analyze
"""
import asyncio
import json
import uuid
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from api.models import (
    StartJobRequest, AnalyzeRequest, JobStatusResponse,
)
from config import settings
from core.atomic_engine import AtomicEngine
from core.executor import DeterministicExecutor, ExecutionJob, Target, TestSelection, ExecutorEvent, serialize_job_results
from core.analyzer import analyze_results, stream_analysis, parse_analysis_response, AnalysisReport
from core.tactic_map import TACTIC_GROUPS, SCOPE_PROFILES, DOMAIN_REQUIRED_TECHNIQUES, DOMAIN_SCOPES
from providers import PROVIDER_CATALOG, get_provider
from providers.base import ProviderConfig

app = FastAPI(title="AGI Pentest Tool", version="2.0.0")

_DOWNLOAD_PATTERNS = (
    "new-object net.webclient", "invoke-webrequest", "start-bitstransfer",
    "iwr http", "iwr https", "(new-object system.net.webclient)",
    "downloadfile(", "downloadstring(", "invoke-expression (new-object",
    "iex (new-object", "iex(new-object",
)

def _command_needs_download(command: str) -> bool:
    low = (command or "").lower()
    return any(p in low for p in _DOWNLOAD_PATTERNS)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Ensure results directory exists on startup
_results_dir = Path(settings.RESULTS_DIR)
_results_dir.mkdir(parents=True, exist_ok=True)

# In-memory stores
_jobs: dict[str, ExecutionJob] = {}
_analysis: dict[str, AnalysisReport] = {}

_atomic_engine: Optional[AtomicEngine] = None


def get_engine(atomics_path: Optional[str] = None) -> AtomicEngine:
    global _atomic_engine
    path = atomics_path or settings.ART_ATOMICS_PATH
    if _atomic_engine is None:
        _atomic_engine = AtomicEngine(atomics_path=path)
        count = _atomic_engine.load_all()
        print(f"[Engine] Loaded {count} techniques from {path}")
    return _atomic_engine


@app.on_event("startup")
async def startup():
    get_engine()


# ── UI ────────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    ui_path = Path(__file__).parent.parent / "ui" / "index.html"
    if ui_path.exists():
        return HTMLResponse(content=ui_path.read_text(encoding="utf-8"))
    return JSONResponse({"message": "AGI Pentest API", "docs": "/docs"})


# ── Meta endpoints ─────────────────────────────────────────────────────────────

@app.get("/api/providers")
async def list_providers():
    return {"providers": [{"model_id": k, "provider": v["provider"]} for k, v in PROVIDER_CATALOG.items()]}


@app.get("/api/tactics")
async def list_tactics():
    """Return tactic groups with available technique counts."""
    engine = get_engine()
    result = []
    for tg in TACTIC_GROUPS:
        available = []
        for tid in tg["techniques"]:
            t = engine.get_technique(tid)
            if t:
                available.append({
                    "technique_id": t.technique_id,
                    "display_name": t.display_name,
                    "test_count": len(t.atomic_tests),
                    "domain_required": t.technique_id in DOMAIN_REQUIRED_TECHNIQUES,
                    "tests": [
                        {
                            "index": i,
                            "name": test.name,
                            "platforms": test.supported_platforms,
                            "elevation_required": test.executor.elevation_required,
                            "domain_required": t.technique_id in DOMAIN_REQUIRED_TECHNIQUES,
                            "executor": test.executor.name,
                            "needs_download": _command_needs_download(test.executor.command),
                        }
                        for i, test in enumerate(t.atomic_tests)
                    ],
                })
        result.append({
            "id": tg["id"],
            "name": tg["name"],
            "icon": tg["icon"],
            "technique_count": len(available),
            "techniques": available,
        })
    return {"tactics": result}


@app.get("/api/scope-profiles")
async def list_scope_profiles():
    return {"profiles": [
        {"id": k, **v} for k, v in SCOPE_PROFILES.items()
    ]}


@app.get("/api/techniques")
async def list_techniques(platform: str = "windows"):
    engine = get_engine()
    return {"techniques": engine.list_techniques(platform_filter=platform)}


@app.get("/api/techniques/search")
async def search_techniques(q: str):
    engine = get_engine()
    return {"results": engine.search_techniques(q)}


@app.get("/api/techniques/{technique_id}")
async def get_technique(technique_id: str):
    engine = get_engine()
    t = engine.get_technique(technique_id)
    if not t:
        raise HTTPException(404, f"Technique {technique_id} not found")
    return {
        "technique_id": t.technique_id,
        "display_name": t.display_name,
        "tests": [
            {
                "index": i,
                "name": test.name,
                "platforms": test.supported_platforms,
                "executor": test.executor.name,
                "elevation_required": test.executor.elevation_required,
                "description": test.description,
                "input_arguments": {
                    k: {"default": v.default, "type": v.type, "description": v.description}
                    for k, v in test.input_arguments.items()
                },
            }
            for i, test in enumerate(t.atomic_tests)
        ],
    }


# ── Job execution ─────────────────────────────────────────────────────────────

def _build_targets(req: StartJobRequest) -> list[Target]:
    """Build the target list, supporting both the new `targets` array and the
    legacy single `scope` payload."""
    targets: list[Target] = []

    if req.targets:
        for i, t in enumerate(req.targets):
            targets.append(Target(
                target_id=t.target_id or f"tgt-{i+1}",
                name=t.name or (t.host if t.connection == "remote" else "localhost"),
                os_platform=t.os_platform,
                privilege=t.privilege,
                connection=t.connection,
                domain_joined=t.domain_joined,
                host=t.host,
                winrm_username=t.winrm_username,
                winrm_password=t.winrm_password,
                winrm_transport=t.winrm_transport,
                winrm_port=t.winrm_port,
                winrm_ssl=t.winrm_ssl,
                notes=t.notes,
            ))
    elif req.scope:
        # Legacy: map old scope → one local target.
        targets.append(Target(
            target_id="tgt-1",
            name=req.scope.target or "localhost",
            os_platform=req.scope.os_platform,
            privilege="admin" if req.scope.user_context == "admin" else "standard_user",
            connection="local",
            domain_joined=req.scope.user_context in DOMAIN_SCOPES,
            host=req.scope.target or "localhost",
            notes=req.scope.notes,
        ))

    return targets


@app.post("/api/jobs")
async def create_job(req: StartJobRequest):
    """Create and return job_id. Actual execution via WS /ws/execute/{job_id}."""
    targets = _build_targets(req)
    if not targets:
        raise HTTPException(400, "No targets provided (supply `targets` or legacy `scope`)")

    selections = [
        TestSelection(technique_id=s.technique_id, test_index=s.test_index, arg_overrides=s.arg_overrides)
        for s in req.selections
    ]
    job = ExecutionJob(
        job_id=str(uuid.uuid4()),
        targets=targets,
        selections=selections,
        total=len(targets) * len(selections),
    )
    _jobs[job.job_id] = job
    return {"job_id": job.job_id, "total": job.total, "target_count": len(targets)}


@app.get("/api/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return JobStatusResponse(
        job_id=job.job_id,
        status=job.status,
        total=job.total,
        completed=job.completed,
        succeeded=sum(1 for r in job.results if r.success),
        failed=sum(1 for r in job.results if not r.success and not r.skipped),
        skipped=sum(1 for r in job.results if r.skipped),
        start_time=job.start_time,
        end_time=job.end_time,
        error=job.error,
    )


@app.get("/api/jobs/{job_id}/results")
async def get_job_results(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return serialize_job_results(job)


@app.get("/api/jobs/{job_id}/analysis")
async def get_analysis(job_id: str):
    report = _analysis.get(job_id)
    if report:
        return {
            "executive_summary": report.executive_summary,
            "risk_level": report.risk_level,
            "findings": [
                {
                    "severity": f.severity,
                    "technique_id": f.technique_id,
                    "tactic": f.tactic,
                    "target_id": f.target_id,
                    "title": f.title,
                    "detail": f.detail,
                    "evidence": f.evidence,
                    "recommendation": f.recommendation,
                }
                for f in report.findings
            ],
            "succeeded_techniques": report.succeeded_techniques,
            "failed_techniques": report.failed_techniques,
            "key_observations": report.key_observations,
            "attack_path": report.attack_path,
            "timestamp": report.timestamp,
            "error": report.error,
        }
    # Fallback: load from disk (survives server restart)
    analysis_path = _results_dir / f"{job_id}.analysis.json"
    if analysis_path.exists():
        return JSONResponse(content=json.loads(analysis_path.read_text(encoding="utf-8")))
    raise HTTPException(404, "Analysis not found — run /ws/analyze first")


@app.get("/api/jobs/{job_id}/report/html")
async def get_report_html(job_id: str):
    job = _jobs.get(job_id)
    report = _analysis.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return HTMLResponse(content=_build_html_report(job, report))


# ── WebSocket: Execute ────────────────────────────────────────────────────────

@app.websocket("/ws/execute/{job_id}")
async def ws_execute(websocket: WebSocket, job_id: str):
    await websocket.accept()

    job = _jobs.get(job_id)
    if not job:
        await websocket.send_json({"type": "error", "data": {"message": f"Job {job_id} not found"}})
        await websocket.close()
        return

    # Guard against duplicate execution (retry after disconnect).
    if job.status in ("running", "done"):
        await websocket.send_json({"type": "error", "data": {"message": f"Job {job_id} already {job.status}"}})
        await websocket.close()
        return

    engine = get_engine()

    async def on_event(event: ExecutorEvent):
        try:
            await websocket.send_json({"type": event.type, "data": event.data, "timestamp": event.timestamp})
        except Exception:
            pass

    executor = DeterministicExecutor(engine=engine, on_event=lambda e: asyncio.ensure_future(on_event(e)))

    try:
        await executor.run(job)

        # Persist raw execution JSON to results/ for downstream consumers.
        result_file: Optional[str] = None
        try:
            result_data = serialize_job_results(job)
            out_path = _results_dir / f"{job.job_id}.json"
            out_path.write_text(json.dumps(result_data, indent=2, ensure_ascii=False), encoding="utf-8")
            result_file = str(out_path)
        except Exception as save_err:
            print(f"[warn] Could not save results to disk: {save_err}")

        await websocket.send_json({
            "type": "execution_complete",
            "data": {
                "job_id": job.job_id,
                "total": job.total,
                "succeeded": sum(1 for r in job.results if r.success),
                "failed": sum(1 for r in job.results if not r.success and not r.skipped),
                "skipped": sum(1 for r in job.results if r.skipped),
                "result_file": result_file,
            }
        })
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({"type": "error", "data": {"message": str(e)}})
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


# ── WebSocket: Analyze ────────────────────────────────────────────────────────

@app.websocket("/ws/analyze/{job_id}")
async def ws_analyze(websocket: WebSocket, job_id: str):
    await websocket.accept()

    job = _jobs.get(job_id)

    # Load execution data: prefer in-memory job, fall back to saved results file.
    if job:
        execution_json = serialize_job_results(job)
    else:
        result_path = _results_dir / f"{job_id}.json"
        if result_path.exists():
            execution_json = json.loads(result_path.read_text(encoding="utf-8"))
        else:
            await websocket.send_json({"type": "error", "data": {"message": f"Job {job_id} not found in memory or on disk"}})
            await websocket.close()
            return

    try:
        raw = await websocket.receive_text()
        req = AnalyzeRequest(**json.loads(raw))
    except Exception as e:
        await websocket.send_json({"type": "error", "data": {"message": f"Invalid request: {e}"}})
        await websocket.close()
        return

    try:
        provider_cfg = ProviderConfig(
            api_key=req.provider.api_key,
            base_url=req.provider.base_url,
            extra={
                "azure_api_base": req.provider.azure_api_base,
                "azure_api_version": req.provider.azure_api_version,
            },
        )
        provider = get_provider(req.provider.model_id, provider_cfg)
    except Exception as e:
        await websocket.send_json({"type": "error", "data": {"message": f"Provider init failed: {e}"}})
        await websocket.close()
        return

    await websocket.send_json({"type": "analysis_start", "data": {"model": provider.model_id}})

    # Stream tokens live, parse report from same response — single API call
    full_response = ""
    try:
        async for token in stream_analysis(provider, execution_json):
            full_response += token
            await websocket.send_json({"type": "token", "data": {"token": token}})
    except Exception as e:
        await websocket.send_json({"type": "error", "data": {"message": str(e)}})
        await websocket.close()
        return

    report = parse_analysis_response(full_response)
    _analysis[job_id] = report

    # Persist analysis to disk alongside execution results.
    try:
        analysis_data = {
            "executive_summary": report.executive_summary,
            "risk_level": report.risk_level,
            "findings": [
                {
                    "severity": f.severity, "technique_id": f.technique_id,
                    "tactic": f.tactic, "target_id": f.target_id,
                    "title": f.title, "detail": f.detail,
                    "evidence": f.evidence, "recommendation": f.recommendation,
                }
                for f in report.findings
            ],
            "succeeded_techniques": report.succeeded_techniques,
            "failed_techniques": report.failed_techniques,
            "key_observations": report.key_observations,
            "attack_path": report.attack_path,
            "timestamp": report.timestamp,
            "error": report.error,
        }
        analysis_path = _results_dir / f"{job_id}.analysis.json"
        analysis_path.write_text(json.dumps(analysis_data, indent=2, ensure_ascii=False), encoding="utf-8")
    except Exception as ae:
        print(f"[warn] Could not save analysis to disk: {ae}")

    await websocket.send_json({
        "type": "analysis_complete",
        "data": {
            "job_id": job_id,
            "risk_level": report.risk_level,
            "findings_count": len(report.findings),
            "report_url": f"/api/jobs/{job_id}/report/html",
            "error": report.error,
        }
    })

    try:
        await websocket.close()
    except Exception:
        pass


# ── Results file endpoints ────────────────────────────────────────────────────

@app.get("/api/results")
async def list_results():
    """List all saved raw execution JSON files in results/."""
    # Exclude analysis sidecar files (job_id.analysis.json)
    files = sorted(
        [p for p in _results_dir.glob("*.json") if not p.name.endswith(".analysis.json")],
        key=lambda p: p.stat().st_mtime, reverse=True,
    )
    return {
        "results_dir": str(_results_dir),
        "count": len(files),
        "files": [
            {
                "job_id": p.stem,
                "filename": p.name,
                "size_bytes": p.stat().st_size,
                "path": str(p),
                "url": f"/api/results/{p.stem}",
                "analysis_url": f"/api/jobs/{p.stem}/analysis",
            }
            for p in files
        ],
    }


@app.get("/api/results/{job_id}")
async def get_result_file(job_id: str):
    """Return raw execution JSON for a completed job."""
    path = _results_dir / f"{job_id}.json"
    if not path.exists():
        raise HTTPException(404, f"Result file for job {job_id} not found")
    return JSONResponse(content=json.loads(path.read_text(encoding="utf-8")))


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    engine = get_engine()
    result_files = len(list(_results_dir.glob("*.json")))
    return {
        "status": "ok",
        "techniques_loaded": len(engine._cache),
        "atomics_available": engine.is_available(),
        "jobs": len(_jobs),
        "analyses": len(_analysis),
        "saved_results": result_files,
        "results_dir": str(_results_dir),
    }


# ── HTML report builder ───────────────────────────────────────────────────────

def _build_html_report(job: ExecutionJob, report: Optional[AnalysisReport]) -> str:
    from html import escape as he
    sc = {"critical":"#ff0000","high":"#ff4444","medium":"#ff8800","low":"#ffcc00","info":"#00aaff"}
    sev_order = ["critical","high","medium","low","info"]

    # ── Findings ──────────────────────────────────────────────────────────────
    findings_html = ""
    if report and report.findings:
        sorted_findings = sorted(report.findings, key=lambda x: sev_order.index(x.severity) if x.severity in sev_order else 99)
        for f in sorted_findings:
            c = sc.get(f.severity, "#888")
            evidence_block = f'<pre class="evidence">{he(f.evidence[:800])}</pre>' if f.evidence else ""
            tgt_badge = f'<span class="tgt-badge">{he(f.target_id)}</span>' if f.target_id else ""
            findings_html += f"""
<div class="finding" style="border-left-color:{c}">
  <div class="f-head">
    <span class="badge" style="background:{c};color:#000">{f.severity.upper()}</span>
    <span class="tid">{he(f.technique_id)}</span>
    <span class="tac">{he(f.tactic)}</span>
    {tgt_badge}
    <strong class="f-title">{he(f.title)}</strong>
  </div>
  <p class="f-detail">{he(f.detail)}</p>
  {evidence_block}
  <div class="f-rec">&#128161; {he(f.recommendation)}</div>
</div>"""

    # ── Execution results table ────────────────────────────────────────────────
    results_rows = ""
    for r in job.results:
        if r.skipped:
            icon, cls = "⏭ SKIP", "skip"
        elif r.success:
            icon, cls = "✓ OK", "ok"
        else:
            icon, cls = "✗ FAIL", "fail"

        stdout_cell = ""
        if r.stdout and r.stdout.strip():
            short = he(r.stdout.strip()[:300])
            stdout_cell = f'<details><summary style="cursor:pointer;color:#6e7681;font-size:10px">stdout ▶</summary><pre class="stdout-mini">{short}</pre></details>'

        results_rows += f"""<tr class="res-row-{cls}">
  <td class="tc">{he(r.target_name or '—')}</td>
  <td class="tc">{he(r.technique_id)}</td>
  <td>{he(r.test_name[:50])}</td>
  <td class="tac-td">{he(r.tactic)}</td>
  <td class="res-{cls}">{icon}</td>
  <td>{r.exit_code}</td>
  <td class="dur">{r.duration_ms}ms</td>
  <td>{stdout_cell}</td>
</tr>"""

    # ── Summary section ────────────────────────────────────────────────────────
    summary_html = ""
    if report:
        rc = sc.get(report.risk_level, "#888")
        counts = {s: sum(1 for f in report.findings if f.severity == s) for s in sev_order}
        badges = "".join(f'<span class="cnt-badge" style="background:{sc[s]};color:#000">{counts[s]} {s.upper()}</span>' for s in sev_order if counts[s] > 0)
        obs = "".join(f"<li>{he(o)}</li>" for o in (report.key_observations or []))
        summary_html = f"""
<div class="risk-box" style="border-color:{rc}">
  <div class="risk-label" style="color:{rc}">RISK LEVEL: {report.risk_level.upper()}</div>
  <p class="exec-sum">{he(report.executive_summary)}</p>
</div>
<div class="cnt-badges">{badges}</div>
{"<h2>Key Observations</h2><ul class='obs-ul'>"+obs+"</ul>" if obs else ""}
{"<h2>Attack Path</h2><div class='attack-path'>"+he(report.attack_path)+"</div>" if report.attack_path else ""}"""

    gen_time = __import__("datetime").datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    succ = sum(1 for r in job.results if r.success)
    fail = sum(1 for r in job.results if not r.success and not r.skipped)
    skip = sum(1 for r in job.results if r.skipped)

    targets = job.targets
    target_label = targets[0].name if len(targets) == 1 else f"{len(targets)} targets"

    # Targets table
    targets_rows = ""
    for t in targets:
        conn = f"remote · {he(t.host)}:{t.winrm_port}" if t.is_remote else "local"
        targets_rows += f"""<tr>
  <td class="tc">{he(t.name)}</td>
  <td>{he(t.os_platform)}</td>
  <td>{he(t.privilege)}</td>
  <td>{conn}</td>
  <td>{"yes" if t.domain_joined else "no"}</td>
</tr>"""
    targets_html = f"""<table>
  <thead><tr><th>Target</th><th>OS</th><th>Privilege</th><th>Connection</th><th>Domain-joined</th></tr></thead>
  <tbody>{targets_rows}</tbody>
</table>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Pentest Report — {he(target_label)} — {job.job_id[:8]}</title>
<style>
  @page {{ margin: 18mm 15mm; }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: 'Courier New', Consolas, monospace; background: #080b0f; color: #c9d1d9; padding: 28px; font-size: 13px; line-height: 1.5; }}
  h1 {{ color: #00ff88; font-size: 22px; border-bottom: 2px solid #21262d; padding-bottom: 10px; margin-bottom: 16px; }}
  h2 {{ color: #00d4ff; font-size: 15px; margin: 28px 0 10px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #21262d; padding-bottom: 6px; }}
  .meta-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }}
  .meta-box {{ background: #0d1117; border: 1px solid #21262d; padding: 10px; border-radius: 4px; }}
  .meta-lbl {{ color: #6e7681; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; }}
  .meta-val {{ color: #00ff88; font-size: 13px; margin-top: 3px; font-weight: bold; }}
  .risk-box {{ border: 2px solid; border-radius: 6px; padding: 16px; margin: 16px 0; }}
  .risk-label {{ font-size: 14px; font-weight: bold; margin-bottom: 8px; }}
  .exec-sum {{ color: #c9d1d9; font-size: 13px; }}
  .cnt-badges {{ display: flex; gap: 8px; flex-wrap: wrap; margin: 10px 0 20px; }}
  .cnt-badge {{ padding: 3px 12px; border-radius: 10px; font-size: 11px; font-weight: bold; }}
  .attack-path {{ background: #0d1117; border: 1px solid #21262d; border-radius: 4px; padding: 12px; color: #aaa; font-style: italic; margin-bottom: 16px; }}
  .obs-ul {{ list-style: none; }}
  .obs-ul li {{ padding: 4px 0; color: #aaa; border-bottom: 1px solid #161b22; }}
  .obs-ul li::before {{ content: "→ "; color: #00d4ff; }}
  .finding {{ background: #0d1117; border: 1px solid #21262d; border-left: 4px solid; padding: 14px; margin: 10px 0; border-radius: 4px; page-break-inside: avoid; }}
  .f-head {{ display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }}
  .badge {{ padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: bold; }}
  .tid {{ color: #00aaff; font-size: 11px; }}
  .tgt-badge {{ background: #1a2233; border: 1px solid #21262d; color: #7a8a9a; font-size: 10px; padding: 1px 6px; border-radius: 3px; }}
  .tac {{ color: #6e7681; font-size: 10px; }}
  .f-title {{ font-size: 13px; }}
  .f-detail {{ color: #aaa; font-size: 12px; margin: 6px 0; }}
  .evidence {{ background: #040608; border: 1px solid #161b22; padding: 8px; border-radius: 3px; font-size: 10px; color: #00ff88; white-space: pre-wrap; overflow-x: auto; margin: 6px 0; max-height: 200px; overflow-y: auto; }}
  .f-rec {{ color: #58a6ff; font-size: 11px; margin-top: 6px; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }}
  th {{ background: #161b22; color: #6e7681; text-transform: uppercase; font-size: 9px; letter-spacing: 1px; padding: 7px 8px; text-align: left; border-bottom: 1px solid #21262d; }}
  td {{ padding: 7px 8px; border-bottom: 1px solid #161b22; vertical-align: top; }}
  .tc {{ color: #00aaff; }}
  .tac-td {{ color: #6e7681; font-size: 10px; }}
  .dur {{ color: #6e7681; font-size: 10px; }}
  .res-ok {{ color: #00ff88; font-weight: bold; }}
  .res-fail {{ color: #ff4444; font-weight: bold; }}
  .res-skip {{ color: #6e7681; }}
  .res-row-ok {{ }}
  .res-row-fail {{ background: rgba(255,68,68,.03); }}
  .res-row-skip {{ opacity: .6; }}
  .stdout-mini {{ background: #040608; padding: 6px; border-radius: 2px; font-size: 10px; color: #00ff88; white-space: pre-wrap; margin-top: 4px; max-height: 120px; overflow-y: auto; }}
  footer {{ margin-top: 40px; color: #333; font-size: 10px; border-top: 1px solid #21262d; padding-top: 12px; text-align: center; }}
  .print-btn {{ position: fixed; top: 16px; right: 16px; background: #00ff88; color: #000; border: none; padding: 8px 16px; border-radius: 4px; font-family: monospace; font-size: 12px; font-weight: bold; cursor: pointer; z-index: 999; }}
  @media print {{
    body {{ background: #fff !important; color: #111 !important; padding: 0; }}
    .print-btn {{ display: none !important; }}
    h1 {{ color: #000 !important; }}
    h2 {{ color: #333 !important; }}
    .meta-box {{ background: #f5f5f5 !important; border-color: #ddd !important; }}
    .meta-lbl {{ color: #666 !important; }}
    .meta-val {{ color: #000 !important; }}
    .risk-box {{ background: #f9f9f9 !important; }}
    .finding {{ background: #f9f9f9 !important; border-color: #ddd !important; page-break-inside: avoid; }}
    .f-detail {{ color: #333 !important; }}
    .evidence {{ background: #f0f0f0 !important; color: #000 !important; border-color: #ccc !important; }}
    .f-rec {{ color: #003366 !important; }}
    table {{ font-size: 10px; }}
    th {{ background: #eee !important; color: #444 !important; }}
    td {{ border-color: #ddd !important; }}
    .tc {{ color: #003366 !important; }}
    .tac-td {{ color: #666 !important; }}
    .attack-path {{ background: #f5f5f5 !important; color: #333 !important; border-color: #ddd !important; }}
    .obs-ul li {{ color: #333 !important; border-color: #ddd !important; }}
    .obs-ul li::before {{ color: #003366 !important; }}
    .res-ok {{ color: #006600 !important; }}
    .res-fail {{ color: #cc0000 !important; }}
    .exec-sum {{ color: #111 !important; }}
    footer {{ color: #666 !important; border-color: #ccc !important; }}
  }}
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">&#128438; Save as PDF</button>

<h1>Penetration Test Report</h1>

<div class="meta-grid">
  <div class="meta-box"><div class="meta-lbl">Scope</div><div class="meta-val">{he(target_label)}</div></div>
  <div class="meta-box"><div class="meta-lbl">Techniques</div><div class="meta-val">{len(job.selections)} × {len(targets)} tgt</div></div>
  <div class="meta-box"><div class="meta-lbl">Job ID</div><div class="meta-val" style="font-size:10px">{job.job_id}</div></div>
  <div class="meta-box"><div class="meta-lbl">Generated</div><div class="meta-val" style="font-size:10px">{gen_time}</div></div>
  <div class="meta-box" style="grid-column:span 4"><div class="meta-lbl">Results</div><div class="meta-val">✓{succ} succeeded · ✗{fail} failed · ⏭{skip} skipped (of {job.total})</div></div>
</div>

<h2>Targets ({len(targets)})</h2>
{targets_html}

{"<h2>Executive Summary</h2>" + summary_html if summary_html else ""}

<h2>Findings ({len(report.findings) if report else 0})</h2>
{findings_html or '<p style="color:#555;padding:16px 0">No AI findings — run analysis first or no successful tests produced findings.</p>'}

<h2>All Execution Results ({job.total})</h2>
<table>
  <thead><tr><th>Target</th><th>Technique</th><th>Test Name</th><th>Tactic</th><th>Result</th><th>Exit</th><th>Time</th><th>Output</th></tr></thead>
  <tbody>{results_rows}</tbody>
</table>

<footer>AGI Pentest Tool &bull; {gen_time} &bull; Job {job.job_id[:8]}</footer>
</body>
</html>"""
