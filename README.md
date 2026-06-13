# AGI Adversary Emulation Engine

### Part of PhantomX — Powered by Atomic Red Team

> Windows-native penetration testing engine with AI-powered analysis. Deterministic execution, multi-target fan-out, streaming results via REST and WebSocket.

---

## Overview

This is the **AGI Pentest Engine** — the adversary emulation backend of the PhantomX platform.

It loads all 335 Atomic Red Team techniques from local YAML files, executes selected tests against one or more targets (local or remote via WinRM), collects structured results, and streams them to an AI model for analysis. The AI receives raw execution JSON and produces a structured findings report with risk level, recommendations, and attack path narrative.

**AI does not select or run tests. AI only analyzes results after execution.**

---

## Architecture

```text
                    ┌──────────────────────────┐
                    │   PhantomX Parent        │
                    │   Platform (BFF)         │
                    │   calls REST + WS API    │
                    └────────────┬─────────────┘
                                 │  HTTP / WebSocket
                                 ▼
                    ┌──────────────────────────┐
                    │   AGI Pentest Engine     │
                    │   FastAPI  :8000         │
                    └──────────────────────────┘
                         │              │
                         ▼              ▼
               ┌──────────────┐  ┌────────────────┐
               │ Atomic Red   │  │  AI Analysis   │
               │ Team Engine  │  │  (LiteLLM)     │
               │ 335 TTPs     │  │  19+ providers │
               └──────────────┘  └────────────────┘
                         │
                         ▼
               ┌──────────────────┐
               │  Local / Remote  │
               │  Targets (WinRM) │
               └──────────────────┘
```

```
agi-pentest/
├── api/
│   ├── main.py          # FastAPI app — REST + WebSocket endpoints
│   └── models.py        # Pydantic request/response models
├── core/
│   ├── atomic_engine.py # Parses ART YAML, resolves arguments
│   ├── executor.py      # DeterministicExecutor — multi-target fan-out
│   ├── analyzer.py      # AIAnalyzer — streaming + parse_analysis_response()
│   ├── tactic_map.py    # Tactic groups, scope profiles, AD-required techniques
│   └── winrm_runner.py  # Remote execution via pypsrp (NTLM)
├── providers/
│   ├── __init__.py      # PROVIDER_CATALOG (19+ models), get_provider()
│   ├── base.py          # AIProvider ABC, ProviderConfig
│   └── litellm_provider.py  # Unified LiteLLM wrapper
├── config/
│   └── settings.py      # Reads .env / environment variables
├── client/
│   ├── pentest_client.py    # Python async SDK
│   ├── pentest_client.js    # JavaScript SDK (browser + Node.js)
│   ├── INTEGRATION.md       # Full API reference
│   └── ad_pentest_show.py   # Live AD demo script
├── ui/
│   └── index.html       # Standalone test UI (temporary — see UI section)
├── atomics/             # Atomic Red Team YAML files (git-cloned separately)
├── .env.example         # Environment variable template
├── start.ps1            # Self-bootstrapping Windows launcher
└── requirements.txt
```

---

## Quick Start

```powershell
# Windows — self-bootstrapping launcher
# Downloads portable Python 3.11.9 on first run, installs deps, starts server
.\start.ps1

# Server starts at http://0.0.0.0:8000
# Firewall rule for port 8000 added automatically
```

Manual start after setup:

```powershell
.\.runtime\python\python.exe -m uvicorn api.main:app --host 0.0.0.0 --port 8000
```

---

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in your API keys:

```powershell
Copy-Item .env.example .env
notepad .env
```

```env
# At minimum, one AI provider key for analysis
ANTHROPIC_API_KEY=sk-ant-...
# or
OPENAI_API_KEY=sk-...
# or GEMINI, GROQ, MISTRAL, OLLAMA, etc. — see .env.example
```

### 2. Atomic Red Team Data

```powershell
# Option A — automatic (start.ps1 clones on first run if git is available)
.\start.ps1

# Option B — manual
git clone --depth 1 https://github.com/redcanaryco/atomic-red-team atomics-repo
Move-Item atomics-repo\atomics .\atomics
Remove-Item -Recurse atomics-repo
```

### 3. WinRM on Remote Targets

```powershell
# Run on each remote target
Enable-PSRemoting -Force
# Ensure port 5985 is open in Windows Firewall
```

---

## UI

### Standalone Test UI

The engine ships with a single-file standalone UI at `ui/index.html`, served at `http://localhost:8000`.

This UI is **temporary** — intended for direct testing and demonstration of the engine without the parent platform. It provides:

* Target configuration (local or remote WinRM)
* TTP selection by tactic / technique / test index
* Live execution log with progress bar
* AI analysis with streaming tokens
* PDF report export (browser print)
* Session persistence across page refresh (targets + selections survive refresh)
* Reset / Cancel button for stuck executions

### Integration with PhantomX Platform

In production, the PhantomX parent platform **does not use this UI**. Instead, it communicates with this engine directly over the REST and WebSocket API:

```
PhantomX BFF  ──POST /api/jobs──────────────►  Engine creates job
              ──WS  /ws/execute/{id}──────────►  Engine streams execution events
              ──GET /api/jobs/{id}/results─────►  Engine returns raw JSON
              ──WS  /ws/analyze/{id}───────────►  Engine streams AI tokens
              ──GET /api/jobs/{id}/analysis────►  Engine returns parsed report
              ──GET /api/jobs/{id}/report/html─►  Engine returns printable HTML
```

The parent platform's `pentest_engine.py` client (`services/pentest_engine.py`) implements this contract in full. See `client/INTEGRATION.md` for the complete API reference.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Status + technique count |
| GET | `/api/tactics` | All tactic groups + techniques |
| GET | `/api/techniques/{id}` | Full technique detail with tests |
| POST | `/api/jobs` | Create execution job → `job_id` |
| GET | `/api/jobs/{id}` | Job status |
| GET | `/api/jobs/{id}/results` | Full execution JSON |
| GET | `/api/jobs/{id}/analysis` | AI analysis report |
| GET | `/api/jobs/{id}/report/html` | Printable HTML report |
| GET | `/api/results` | List saved result files |
| GET | `/api/results/{id}` | Raw result JSON by job ID |
| WS | `/ws/execute/{job_id}` | Stream execution events |
| WS | `/ws/analyze/{job_id}` | Stream AI analysis tokens |

Full protocol documentation: `client/INTEGRATION.md`

---

## Execution Model

### Targets

Each job accepts an array of `Target` objects. Tests fan out across all targets:

```
total_tests = len(targets) × len(selections)
```

```json
{
  "target_id": "dc01",
  "name": "DC01",
  "os_platform": "windows",
  "privilege": "admin",
  "connection": "remote",
  "domain_joined": true,
  "host": "192.168.1.10",
  "winrm_username": "Administrator",
  "winrm_password": "...",
  "winrm_transport": "ntlm",
  "winrm_port": 5985,
  "winrm_ssl": false
}
```

### Filtering Rules

Tests are automatically skipped when:

* Platform does not match target OS
* `elevation_required = true` and target privilege is `standard_user`
* Technique requires domain join and target `domain_joined = false`

### Executor Types

| ART executor | Maps to |
|---|---|
| `command_prompt` | `%SystemRoot%\System32\cmd.exe /c` |
| `powershell` | `powershell.exe -NonInteractive -NoProfile -ExecutionPolicy Bypass -Command` |
| `sh` / `bash` | Skipped on Windows (no WSL assumed) |
| `manual` | Always skipped |

---

## AI Analysis

### Providers

19+ models via LiteLLM — pass catalog key in the analyze WebSocket message:

| Provider | Example model_id |
|---|---|
| Anthropic | `claude-sonnet-4-6` |
| OpenAI | `gpt-4o` |
| Google | `gemini-2.0-flash` |
| Groq | `groq-llama3-70b` |
| Ollama | `ollama-llama3` |
| OpenRouter | `openrouter/...` |

### WebSocket Protocol

```
1. Connect   ws://.../ws/analyze/{job_id}
2. Send      {"job_id":"...","provider":{"model_id":"claude-sonnet-4-6","api_key":"sk-..."}}
3. Receive   analysis_start → token (stream) → analysis_complete
4. Fetch     GET /api/jobs/{id}/analysis  →  parsed AnalysisReport
```

Analysis and execution results persist to disk (`results/`) — survive server restarts.

---

## Tactic Coverage

| Tactic | Notes |
|---|---|
| Discovery | Core recon TTPs |
| Credential Access | LSASS, Kerberoasting — AV-blocked on patched systems (expected finding) |
| Persistence | Registry, scheduled tasks, services |
| Privilege Escalation | UAC bypass, token impersonation |
| Defense Evasion | AMSI bypass, log clearing, process injection |
| Execution | Script hosts, LOLBins |
| Collection | File search, clipboard |
| Exfiltration | DNS, HTTP staging |
| Impact | Service disruption |
| Command & Control | DNS, HTTP channels |

Active Directory techniques (`T1087.002`, `T1069.002`, `T1558.*`, etc.) require `domain_joined = true` on target.

---

## SDK

### Python

```python
from client.pentest_client import PentestClient, makeTarget, makeSelection

client = PentestClient("http://localhost:8000")
job_id = await client.createJob(
    [makeTarget({"target_id": "local", "privilege": "admin"})],
    [makeSelection("T1082", 0)]
)
async for ev in client.streamExecute(job_id):
    print(ev)
report = await client.getAnalysis(job_id)
```

### JavaScript

```javascript
const client = new PentestClient("http://localhost:8000");
const jobId  = await client.createJob([makeTarget({})], [makeSelection("T1082")]);
for await (const ev of client.streamExecute(jobId)) { console.log(ev); }
const report = await client.getAnalysis(jobId);
```

---

## Technology Stack

* Python 3.11
* FastAPI + Uvicorn
* Atomic Red Team (335 techniques)
* pypsrp (WinRM / NTLM)
* LiteLLM (19+ AI providers)
* WebSocket streaming

---

**PhantomX — AEADE 2026 Hackathon Project**
