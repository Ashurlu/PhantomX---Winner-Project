# Adversary Emulation & Automated Detection Engineering (AEADE)

### Powered by PhantomX

> AI-Powered Detection Validation, Adversary Emulation, and Automated Security Assessment

---

## Overview

**PhantomX** is an AI-driven cybersecurity platform developed as part of the **Adversary Emulation & Automated Detection Engineering (AEADE)** project.

The platform combines multi-agent AI reasoning with automated adversary emulation to help organizations validate detections, reduce false positives, assess defensive capabilities, and generate actionable security reports.

By leveraging multiple specialized AI agents and real-world attack simulations, PhantomX provides security teams with a transparent and explainable approach to threat detection and security validation.

---

## Problem Statement

Modern security teams face several challenges:

* Large volumes of security alerts
* High false-positive rates
* Alert fatigue among analysts
* Limited visibility into detection effectiveness
* Time-consuming penetration testing and validation processes

PhantomX addresses these challenges through automated analysis, adversarial AI reasoning, and continuous security validation.

---

# Core Features

## 🧠 Multi-Agent Detection Validation Engine

PhantomX introduces a courtroom-inspired AI architecture that evaluates security alerts using multiple independent agents.

### True Positive Agent

This agent analyzes incoming events and argues why the alert represents a genuine threat.

Responsibilities:

* Threat analysis
* IOC correlation
* MITRE ATT&CK mapping
* Risk assessment
* Supporting evidence collection

---

### False Positive Agent

This agent analyzes the same event and argues why the alert may not represent malicious activity.

Responsibilities:

* Environmental context analysis
* Baseline behavior comparison
* Exception identification
* False positive detection

---

### Judge Agent

The Judge Agent evaluates both perspectives and delivers a final verdict.

Possible outcomes:

* True Positive
* False Positive
* Requires Further Investigation

The judge also generates:

* Confidence score
* Supporting rationale
* Investigation recommendations

---

## ⚔️ AGI Adversary Emulation Engine

The second major component of PhantomX is its autonomous security validation framework.

Users can select testing scopes such as:

* Standard User
* Administrator
* Domain User
* Domain Administrator
* Custom Assessment Profiles

The platform then:

1. Selects appropriate attack techniques.
2. Executes Atomic Red Team tests.
3. Collects execution results.
4. Converts outputs into structured JSON.
5. Analyzes findings using AI.
6. Generates professional reports.

---

## 🔥 Atomic Red Team Integration

PhantomX leverages Atomic Red Team techniques to emulate real-world adversary behavior.

Examples include:

* Credential Access
* Discovery
* Privilege Escalation
* Persistence
* Lateral Movement
* Defense Evasion
* Collection
* Exfiltration

This enables organizations to continuously validate security controls against known attack patterns.

---

## 📊 AI-Powered Report Generation

After execution, PhantomX automatically generates professional HTML reports.

Generated content includes:

### Executive Summary

* Overall security posture
* High-level findings
* Risk overview

### Technical Findings

* Executed TTPs
* Detection results
* Security gaps

### Detection Analysis

* Successful detections
* Missed detections
* Detection coverage assessment

### Recommendations

* Remediation guidance
* Detection engineering improvements
* Security hardening recommendations

---

## 🔌 Configurable AI Providers

PhantomX is designed to be AI-provider agnostic.

Supported deployments include:

### Cloud Models

* OpenAI
* Anthropic Claude
* Google Gemini
* Azure OpenAI

### Local Models

* Ollama
* Llama
* Mistral
* Qwen
* Custom self-hosted models

Organizations can fully operate PhantomX in air-gapped environments using local LLMs.

---

# System Architecture

```text
                    ┌────────────────────┐
                    │ Incoming Security  │
                    │       Events       │
                    └──────────┬─────────┘
                               │
                               ▼

                ┌───────────────────────────┐
                │ Multi-Agent Analysis Layer│
                └───────────────────────────┘
                     │                │
                     ▼                ▼

        ┌─────────────────┐  ┌─────────────────┐
        │ True Positive   │  │ False Positive  │
        │     Agent       │  │      Agent      │
        └────────┬────────┘  └────────┬────────┘
                 │                    │
                 └────────┬───────────┘
                          ▼

                ┌───────────────────┐
                │    Judge Agent    │
                └─────────┬─────────┘
                          ▼

                ┌───────────────────┐
                │ Final Verdict &   │
                │ Confidence Score  │
                └───────────────────┘
```

---

## Adversary Emulation Workflow

```text
Selected Scope
      │
      ▼

Atomic Red Team Execution
      │
      ▼

Result Collection
      │
      ▼

JSON Conversion
      │
      ▼

AI Analysis
      │
      ▼

HTML Report Generation
```

---

# Use Cases

## Security Operations Centers (SOC)

* Alert validation
* Threat triage
* Investigation assistance

## Detection Engineering

* Detection validation
* Coverage assessment
* Rule tuning

## Red Teams

* Adversary emulation
* Security control testing

## Blue Teams

* Defensive readiness validation
* Incident response preparation

## Security Consultants

* Automated assessment support
* Report generation

---

# Key Benefits

### Explainable AI

Every decision includes supporting evidence and reasoning.

### Reduced False Positives

Dual-agent analysis improves alert quality.

### Faster Investigations

Automated context gathering and analysis.

### Continuous Validation

Regular adversary emulation against existing controls.

### Flexible Deployment

Supports both cloud-hosted and local AI models.

### Automated Reporting

Reduces manual reporting effort.

---

# Technology Stack

* Python
* Atomic Red Team
* JSON Processing
* HTML Reporting
* REST APIs
* Large Language Models (LLMs)

---

# Future Roadmap

* SIEM integrations
* EDR integrations
* Detection rule generation
* Continuous attack simulation
* Multi-stage attack chain emulation
* Automated remediation recommendations
* Threat intelligence integration
* SOC analyst copilot capabilities

---

# Team

| Member                 |
| ---------------------- |
| Zaur Mammadbayli       |
| Nargiz Heydarli        |
| Ali Karimov            |
| Mahammadali Huseynzade |
| Cavidan Ashurlu        |
| Elvin Mammadzada       |

---

# Vision

PhantomX aims to redefine how organizations validate detections and assess defensive readiness by combining explainable multi-agent AI with autonomous adversary emulation.

Instead of replacing analysts, PhantomX empowers them with transparent reasoning, automated validation, and actionable intelligence—allowing security teams to focus on what matters most: defending their environment.

---

**AEADE 2026 Hackathon Project**
