import type { HuntResponse } from "@/lib/types";

function scenarioKey(query: string): string | null {
  const q = query.toLowerCase();
  if (q.includes("add_task") || q.includes("task_startup") || q.includes("scheduled task")) {
    return "add_task_startup";
  }
  if (q.includes("hr-dc01") || q.includes("hr dc01") || (q.includes("powershell") && q.includes("hr"))) {
    return "hr-dc01";
  }
  if (q.includes("ransomware") || q.includes("finance workstation")) {
    return "ransomware";
  }
  return null;
}

const SCENARIOS: Record<string, Omit<HuntResponse, "reply" | "source" | "thought_seconds" | "query" | "ran_at">> = {
  add_task_startup: {
    plan: [
      { label: "Scope prevalence", detail: "Search EDR for add_task_startup.exe hash across all endpoints", done: true },
      { label: "Vendor consensus", detail: "Pull VT / internal TI — 31/47 vendors malicious", done: true },
      { label: "Parent process chain", detail: "Identify encoded PowerShell spawns (18 hosts)", done: false },
      { label: "Persistence", detail: "Review scheduled tasks on WKS-204 and finance segment", done: false },
      { label: "Containment", detail: "Isolate FIN-WORK-* hosts with active executions", done: false },
    ],
    confirmed: [
      {
        id: "f-add-task",
        name: "add_task_startup.exe",
        summary: "31/47 vendors mark hash malicious · Encoded PowerShell · 12 devices",
        status: "Malicious",
        severity: "high",
        path: "/cases?case=PX-D034455",
        kind: "case",
      },
    ],
    leads: [
      {
        id: "l-ps",
        name: "Encoded PowerShell commands",
        summary: "Spawned from add_task_startup.exe on 18 hosts",
        status: "Unknown",
        path: "/cases?case=PX-D034461",
        kind: "case",
      },
      {
        id: "l-wks",
        name: "WKS-204",
        summary: "Scheduled task persistence — first seen host",
        status: "Unknown",
        path: "/ai-court?case=A-1233",
        kind: "alert",
      },
    ],
    discoveries: {
      hosts: [
        "FIN-WORK-1", "FIN-WORK-3", "FIN-WORK-5", "FIN-WORK-7", "FIN-WORK-9", "FIN-WORK-11", "WKS-204",
      ].map((h) => ({ id: h, label: h, status: "Unknown" })),
      files: ["add_task_startup.exe", "payload.ps1"].map((f) => ({ id: f, label: f, status: "Unknown" })),
      network: ["185.220.101.42", "45.33.32.156"].map((n) => ({ id: n, label: n, status: "Unknown" })),
      other: [],
    },
    raw: [
      { kind: "case", id: "PX-D034455", title: "Scheduled task persistence on WKS-204", severity: "high", path: "/cases?case=PX-D034455" },
      { kind: "alert", id: "A-1233", title: "Scheduled task persistence on WKS-204", severity: "medium", path: "/ai-court?case=A-1233" },
    ],
    citations: [],
    actions: [
      { label: "Open case PX-D034455", path: "/cases?case=PX-D034455", kind: "navigate" },
      { label: "View alert A-1233", path: "/ai-court?case=A-1233", kind: "navigate" },
    ],
  },
  "hr-dc01": {
    plan: [
      { label: "Decode payload", detail: "Extract and de-obfuscate PowerShell from alert A-1042", done: true },
      { label: "Host timeline", detail: "Build HR-DC01 process tree for last 72h", done: false },
      { label: "Credential review", detail: "Check for lateral movement from HR-DC01", done: false },
      { label: "Case linkage", detail: "Assign PX-D034461 and escalate if confirmed", done: false },
    ],
    confirmed: [
      {
        id: "f-hr-ps",
        name: "Encoded PowerShell on HR-DC01",
        summary: "Alert A-1042 · confidence 92% · isolate host recommended",
        status: "Malicious",
        severity: "high",
        path: "/ai-court?case=A-1042",
        kind: "alert",
      },
    ],
    leads: [
      {
        id: "l-hr-case",
        name: "PX-D034461",
        summary: "Suspicious PowerShell execution case — unassigned",
        status: "Suspicious",
        path: "/cases?case=PX-D034461",
        kind: "case",
      },
    ],
    discoveries: {
      hosts: [{ id: "HR-DC01", label: "HR-DC01", status: "Unknown" }],
      files: [{ id: "invoke-obfuscation.ps1", label: "invoke-obfuscation.ps1", status: "Unknown" }],
      network: [{ id: "198.51.100.8", label: "198.51.100.8", status: "Unknown" }],
      other: [],
    },
    raw: [
      { kind: "alert", id: "A-1042", title: "Encoded PowerShell on HR-DC01", severity: "high", path: "/ai-court?case=A-1042" },
    ],
    citations: [],
    actions: [
      { label: "View alert A-1042", path: "/ai-court?case=A-1042", kind: "navigate" },
    ],
  },
  ransomware: {
    plan: [
      { label: "Isolate segment", detail: "Network isolate finance workstation VLAN", done: false },
      { label: "Scope encryption", detail: "Identify affected shares and backup status", done: true },
      { label: "IR playbook", detail: "Trigger PX-C034463 critical incident workflow", done: false },
    ],
    confirmed: [
      {
        id: "f-ransom",
        name: "Ransomware on Finance Workstation",
        summary: "PX-C034463 · critical · mass file rename pattern",
        status: "Malicious",
        severity: "critical",
        path: "/cases?case=PX-C034463",
        kind: "case",
      },
    ],
    leads: [
      {
        id: "l-r-a1310",
        name: "A-1310",
        summary: "Mass file rename — linked case PX-C034463",
        status: "Malicious",
        path: "/ai-court?case=A-1310",
        kind: "alert",
      },
    ],
    discoveries: {
      hosts: ["FIN-WORK-2", "FIN-WORK-4"].map((h) => ({ id: h, label: h, status: "Unknown" })),
      files: [{ id: "encryptor.exe", label: "encryptor.exe", status: "Unknown" }],
      network: [{ id: "203.0.113.12", label: "203.0.113.12", status: "Unknown" }],
      other: [],
    },
    raw: [
      { kind: "case", id: "PX-C034463", title: "Ransomware on Finance Workstation", severity: "critical", path: "/cases?case=PX-C034463" },
    ],
    citations: [],
    actions: [
      { label: "Open case PX-C034463", path: "/cases?case=PX-C034463", kind: "navigate" },
    ],
  },
};

function narrative(query: string, confirmed: HuntResponse["confirmed"], leads: HuntResponse["leads"]): string {
  const lines = [`**Hunt results** for: ${query.slice(0, 120)}`, ""];
  if (confirmed.length) {
    lines.push(`**${confirmed.length} confirmed finding(s)** — review Malicious/Suspicious items on the right.`);
    for (const c of confirmed.slice(0, 2)) {
      lines.push(`- **${c.name}** (${c.status})`);
    }
  } else {
    lines.push("No confirmed malicious findings yet — see potential leads below.");
  }
  if (leads.length) {
    lines.push("", `**${leads.length} potential lead(s)** need analyst validation.`);
  }
  lines.push("", "_Expand **Investigation plan** in the chat panel for next steps._");
  return lines.join("\n");
}

/** Client-side fallback when /hunt is unavailable (e.g. stale backend). */
export function huntFallback(
  message: string,
  _timeRange?: string
): HuntResponse {
  const query = message.trim();
  const key = scenarioKey(query);
  const base = key ? SCENARIOS[key] : {
    plan: [
      { label: "Parse query", detail: `Interpret hunt question: ${query.slice(0, 100)}`, done: true },
      { label: "Correlate SOC data", detail: "Search cases, alerts, and rules (offline mode)", done: true },
      { label: "Validate leads", detail: "Review potential leads and assign owners", done: false },
    ],
    confirmed: [] as HuntResponse["confirmed"],
    leads: [] as HuntResponse["leads"],
    discoveries: { hosts: [], files: [], network: [], other: [] },
    raw: [] as Record<string, unknown>[],
    citations: [],
    actions: [],
  };

  return {
    ...base,
    reply: narrative(query, base.confirmed, base.leads),
    source: "local",
    thought_seconds: key ? 5 : 3,
    query,
    ran_at: new Date().toISOString(),
  };
}
