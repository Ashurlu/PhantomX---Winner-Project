<div align="center">

# PhantomX

### Adversary Emulation & Automated Detection Engineering (AEADE)

**AI-Powered Detection Validation • Adversary Emulation • Automated Security Assessment**

![Status](https://img.shields.io/badge/Status-Prototype-blue)
![Category](https://img.shields.io/badge/Category-Cybersecurity-darkgreen)
![Architecture](https://img.shields.io/badge/Architecture-Multi--Agent%20AI-black)
![Hackathon](https://img.shields.io/badge/Hackathon-2026-success)

---

### Continuous Security Validation Through Multi-Agent Intelligence

*Bridging the gap between adversary emulation, detection engineering, and explainable artificial intelligence.*

🌐 **Live demo:** (https://phantomx-security.vercel.app) — sign in with `admin` / `admin123`

</div>

---

## Executive Summary

PhantomX is an AI-driven cybersecurity platform developed as part of the **Adversary Emulation & Automated Detection Engineering (AEADE)** project.

The platform combines **multi-agent AI reasoning**, **automated adversary emulation**, and **continuous security validation** to help organizations improve detection quality, reduce false positives, identify defensive weaknesses, and assess security posture through real-world attack simulation.

Unlike traditional security tools that rely on a single analysis engine, PhantomX introduces a structured decision-making model where multiple AI agents independently evaluate security events before a final verdict is produced.

At the same time, the platform continuously validates defensive capabilities through Atomic Red Team-based attack simulation and automated reporting.

---

## The Problem

Modern organizations face an increasingly complex threat landscape while security teams are expected to investigate and respond to a growing number of alerts.

Several challenges continue to impact security operations:

| Challenge              | Impact                                                    |
| ---------------------- | --------------------------------------------------------- |
| Alert Fatigue          | Analysts spend excessive time reviewing alerts            |
| False Positives        | Reduced operational efficiency and wasted resources       |
| Detection Gaps         | Security controls may fail to detect adversary activity   |
| Manual Validation      | Security assessments require significant effort           |
| Limited Visibility     | Organizations struggle to measure defensive effectiveness |
| Growing Attack Surface | Increasing complexity of enterprise environments          |

As a result, many organizations lack confidence in both their detection capabilities and their ability to continuously validate security controls.

---

## Our Solution

PhantomX addresses these challenges through two tightly integrated components:

<table>
<tr>
<td width="50%">

### Detection Validation Engine

AI-powered multi-agent reasoning system for alert adjudication.

**Capabilities**

* Alert validation
* False positive reduction
* Threat assessment
* Explainable reasoning
* Confidence scoring

</td>

<td width="50%">

### Adversary Emulation Engine

Automated execution of real-world attack techniques.

**Capabilities**

* Atomic Red Team integration
* Detection validation
* Security control testing
* Coverage assessment
* Automated reporting

</td>
</tr>
</table>

---

## Platform Modules

PhantomX ships as a complete, multi-page SOC console. Every module is live data-driven, theme-aware (**light and night mode**), and role-gated.

| Module | What it does |
|---|---|
| **Operations Overview** | Live command center with a **3D telemetry core** (sources stream in → core → resolved/open branches), KPI cards, incident-handling split, severity breakdown, and a live "False Positives Auto-Closed" counter. |
| **Case Management (Inbox)** | Full **Kanban incident board** (Open / In Progress / Done) with AI case summaries, case history, notes & tasks, priority filters, move-between-columns, and an **Add Case** workflow. |
| **Detection — Alert Intelligence** | Category & severity **donut charts**, daily alert-volume bars, an **Investigation Coverage treemap**, alert-source breakdown, and an interactive **Threat Hunt** panel. |
| **Investigation Pipeline** | End-to-end **flow visualization** (Ingestion → Categorization → Enrichment → Agent Triage → Determination → Status). |
| **AI Court** | The multi-agent tribunal — verdicts on **true positives only**, with a 3D Prosecutor / Defender / Judge visualization, case feed, and remediation recommendations. |
| **Recommended Rules** | **Sigma** detection rules proposed from real incidents; approve / edit / reject-with-reason (admin) + ATT&CK Navigator layer export. |
| **AGI / Web Pentest** | Atomic Red Team TTP execution + an embedded **web vulnerability agent** (security headers, exposed files, robots/sitemap, cookie flags, Swagger/OpenAPI). |
| **ProtonRed** | **Active Directory** adversary emulation & pentest integration. |
| **CRAMM** | Risk & compliance assessment module with audit trail. |
| **SOC Assistant (Copilot)** | An embedded **AI chatbot** grounded in live SOC context for triage and investigation support. |
| **Admin Console** | API keys, user management (RBAC), data-source switching, audit log, system status, and maintenance. |

---

## Multi-Agent Detection Validation Engine

The Detection Validation Engine introduces a courtroom-inspired decision-making architecture.

Instead of relying on a single AI model, PhantomX uses specialized agents that independently evaluate the same security event.

### True Positive Agent

The True Positive Agent is responsible for arguing why a security event should be considered malicious.

Responsibilities:

* IOC correlation
* Threat analysis
* MITRE ATT&CK mapping
* Risk assessment
* Evidence collection

---

### False Positive Agent

The False Positive Agent evaluates the same event and attempts to determine whether it may represent legitimate activity.

Responsibilities:

* Context analysis
* Baseline comparison
* Environmental assessment
* Exception identification
* Benign activity validation

---

### Judge Agent

The Judge Agent reviews both arguments and produces the final decision.

Possible outcomes:

* True Positive
* False Positive
* Requires Further Investigation

Additional outputs include:

* Confidence score
* Supporting rationale
* Investigation recommendations
* Decision explanation

---

## Multi-Agent Decision Workflow

```text
                     Security Event
                            │
                            ▼

        ┌───────────────────────────────┐
        │     Multi-Agent Analysis      │
        └───────────────────────────────┘

                 │               │

                 ▼               ▼

      True Positive Agent   False Positive Agent

                 │               │

                 └───────┬───────┘
                         ▼

                   Judge Agent

                         ▼

              Final Verdict + Score
```

---

## Adversary Emulation Engine

The Adversary Emulation Engine enables organizations to continuously assess defensive readiness by executing controlled attack simulations.

Users can select assessment scopes such as:

* Standard User
* Administrator
* Domain User
* Domain Administrator
* Custom Profiles

The platform then automatically executes relevant attack techniques and evaluates defensive effectiveness.

---

## Atomic Red Team Integration

PhantomX leverages Atomic Red Team to emulate real-world adversary behavior.

Example ATT&CK categories include:

| Tactic               |
| -------------------- |
| Initial Access       |
| Execution            |
| Persistence          |
| Privilege Escalation |
| Defense Evasion      |
| Credential Access    |
| Discovery            |
| Lateral Movement     |
| Collection           |
| Exfiltration         |

This enables organizations to validate whether their existing controls and detections can successfully identify attacker activity.

---

## Adversary Emulation Workflow

```text
        Selected Assessment Scope
                     │
                     ▼

         Atomic Red Team Execution
                     │
                     ▼

           Telemetry Collection
                     │
                     ▼

              JSON Processing
                     │
                     ▼

                AI Analysis
                     │
                     ▼

         HTML Security Assessment
```

---

## AI-Powered Report Generation

Following adversary emulation, PhantomX automatically generates comprehensive HTML security reports.

### Report Contents

| Section            | Description                          |
| ------------------ | ------------------------------------ |
| Executive Summary  | High-level security posture overview |
| Technical Findings | Executed techniques and observations |
| Detection Analysis | Detection successes and failures     |
| Risk Assessment    | Security impact evaluation           |
| Recommendations    | Remediation guidance                 |
| Coverage Review    | Detection engineering insights       |

The reporting engine is designed to reduce manual reporting effort while providing actionable information for security teams.

---

## Flexible AI Architecture

PhantomX is AI-provider agnostic and supports multiple deployment models.

### Cloud AI Providers

* OpenAI
* Google Gemini
* Anthropic Claude
* Azure OpenAI

### Local AI Providers

* Ollama
* Qwen
* Llama
* Mistral
* Custom Models

This flexibility allows organizations to deploy PhantomX within cloud, hybrid, or air-gapped environments.

---

## Technology Stack

| Layer               | Technologies                         |
| ------------------- | ------------------------------------ |
| Frontend            | React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion · GSAP · Recharts · React Three Fiber (three.js) · Zustand · TanStack Query · React Router |
| Backend             | FastAPI · Uvicorn (Python 3) · Pydantic · JWT (python-jose) · bcrypt · SQLite · httpx · WebSockets · PyYAML |
| AI Layer            | OpenAI · Gemini · Anthropic Claude · Azure OpenAI · OpenRouter · Ollama / local models |
| Security Validation | Atomic Red Team · MITRE ATT&CK · Sigma · Wazuh/SIEM · Web & Active-Directory pentest agents |
| Data Processing     | JSON Pipelines · normalization & enrichment |
| Reporting           | HTML Report Generation               |
| APIs                | REST (`/api/v1`) + WebSocket streaming |
| Deployment          | Docker · Docker Compose · Nginx · Caddy (auto-HTTPS) · DigitalOcean |

---

## Getting Started

### Run with Docker (recommended)

```bash
docker compose up --build
# Frontend → http://localhost:3000   ·   Backend → http://localhost:8000/docs
```

### Run locally (dev)

```bash
# Backend
cd backend && python -m venv .venv
.venv\Scripts\activate          # *nix: source .venv/bin/activate
pip install -r requirements.txt && cp .env.example .env
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev   # http://localhost:5173
```

### Deploy to production (DigitalOcean)

A one-command production stack (Nginx + FastAPI + auto-HTTPS) is included — see **[DEPLOY-DIGITALOCEAN.md](DEPLOY-DIGITALOCEAN.md)**, or on a fresh Ubuntu droplet:

```bash
curl -fsSL https://raw.githubusercontent.com/Ashurlu/PhantomX/main/deploy/remote-install.sh | bash
```

**Default accounts:** `admin` / `admin123` (full access) · `analyst` / `analyst123` (view-only). Change the admin password after going live.

---

## Key Benefits

| Benefit                 | Description                                   |
| ----------------------- | --------------------------------------------- |
| Explainable AI          | Transparent reasoning behind every decision   |
| Reduced False Positives | Improved alert quality                        |
| Faster Investigations   | Automated analysis and context gathering      |
| Continuous Validation   | Ongoing assessment of defensive effectiveness |
| Automated Reporting     | Reduced manual effort                         |
| Flexible Deployment     | Cloud and on-premise support                  |

---

## Use Cases

### Security Operations Centers (SOC)

* Alert triage
* Threat validation
* Investigation support

### Detection Engineering Teams

* Rule validation
* Detection coverage assessment
* Detection optimization

### Red Teams

* Adversary emulation
* Security control testing

### Blue Teams

* Defensive readiness validation
* Threat simulation analysis

### Security Consultants

* Automated assessments
* Security reporting

---

## Market Opportunity

| Market Segment                      | Estimated Market Size |
| ----------------------------------- | --------------------- |
| TAM (Total Addressable Market)      | $40B+                 |
| SAM (Serviceable Available Market)  | $3B–$5B               |
| SOM (Serviceable Obtainable Market) | $1.5M–$5M             |

### Supporting Market Data

| Market               | Estimated Size    |
| -------------------- | ----------------- |
| AI in Cybersecurity  | $44.24B           |
| Security Analytics   | $18.86B – $22.86B |
| Global Cybersecurity | $248.28B          |

---

## Future Roadmap

### Phase 1

* Multi-agent AI implementation
* Alert validation engine

### Phase 2

* Atomic Red Team integration
* Security validation workflows

### Phase 3

* Enhanced reporting capabilities
* Detection engineering analytics

### Phase 4

* SIEM integrations
* EDR integrations
* Threat intelligence enrichment

### Phase 5

* Continuous attack simulation
* SOC analyst copilot
* Automated remediation recommendations

---

## Team

| Members                 |
| ---------------------- |
| Zaur Mammadbayli       |
| Nargiz Heydarli        |
|Cavidan Ashurlu         |
| Mahammadali Huseynzade |
|  Ali Karimov           |
| Elvin Mammadzada       |

---

## Vision

PhantomX aims to redefine how organizations evaluate security detections and validate defensive readiness.

By combining explainable multi-agent artificial intelligence with automated adversary emulation, the platform provides a practical approach to continuous security validation, helping organizations understand not only whether attacks can occur, but whether they can be detected and effectively investigated.

---

<div align="center">

### PhantomX

Adversary Emulation & Automated Detection Engineering

</div>
