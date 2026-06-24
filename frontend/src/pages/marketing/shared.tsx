import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export const ease = [0.4, 0, 0.2, 1] as const;

/* Scroll-reveal: fade + slight slide, matching the 7AI 0.4s/0.6s ease-in-out spec */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ opacity: { duration: 0.6, ease }, y: { duration: 0.5, ease }, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`rf-eyebrow ${className}`}>{children}</p>;
}

/* Square button with right-arrow that nudges on hover */
export function ArrowButton({
  to,
  children,
  variant = "light",
  className = "",
}: {
  to: string;
  children: React.ReactNode;
  variant?: "light" | "dark" | "outline";
  className?: string;
}) {
  return (
    <Link to={to} className={`rf-btn rf-btn-${variant} ${className}`}>
      {children}
      <ArrowRight size={17} strokeWidth={2.5} />
    </Link>
  );
}

/* Gold-underlined inline text link */
export function GoldLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="rf-ul rf-mono" style={{ color: "inherit" }}>
      {children}
    </Link>
  );
}

/* ---------- Data ---------- */
export const STATS = [
  { label: "ATT&CK techniques emulated", value: "335", caption: "Atomic Red Team, mapped live" },
  { label: "False positives auto-closed", value: "1.3K", caption: "per day, with zero analyst touch" },
  { label: "Alerts triaged before an analyst", value: "100%", caption: "only true positives surface" },
];

/** Rolling business impact — values animate when scrolled into view. */
export const IMPACT_METRICS = [
  {
    label: "Alerts Processed",
    value: 12_847_392,
    prefix: "",
    suffix: "+",
    caption: "Ingested, normalized, and adjudicated across customer estates",
    format: (n: number) => n.toLocaleString("en-US"),
  },
  {
    label: "Analyst Hours Saved",
    value: 48_200,
    prefix: "",
    suffix: " hrs",
    caption: "False-positive investigation time returned to threat hunting",
    format: (n: number) => n.toLocaleString("en-US"),
  },
  {
    label: "SOC Productivity Reclaimed",
    value: 4_200_000,
    prefix: "$",
    suffix: "",
    caption: "Operational spend redirected to strategic security work",
    format: (n: number) => n.toLocaleString("en-US"),
  },
];

/** Business Process as a Service — managed SOC automation tiers. */
export const SERVICE_PLANS = [
  {
    id: "triage",
    name: "Triage",
    price: 2_499,
    period: "month",
    tagline: "Autonomous alert closure for lean teams",
    description: "Managed ingestion and auto-triage — false positives never reach your inbox.",
    features: [
      "Multi-source SIEM ingestion",
      "Autonomous false-positive closure",
      "Up to 5,000 alerts / day",
      "Slack & email routing",
      "90-day decision audit trail",
    ],
    cta: "Start with Triage",
    featured: false,
  },
  {
    id: "adjudicate",
    name: "Adjudicate",
    price: 6_999,
    period: "month",
    tagline: "AI Court + rule synthesis included",
    description: "Full tribunal workflow with human-in-the-loop verdict review and Sigma rule proposals.",
    features: [
      "Everything in Triage",
      "AI Court prosecutor / defender / judge",
      "Recommended Sigma rules queue",
      "Up to 25,000 alerts / day",
      "Dedicated success engineer",
      "MITRE ATT&CK coverage map",
    ],
    cta: "Request Adjudicate",
    featured: true,
  },
  {
    id: "command",
    name: "Command",
    price: null as number | null,
    period: "custom",
    tagline: "Enterprise SOC command platform",
    description: "Full PhantomX stack with adversary emulation, unlimited scale, and on-prem options.",
    features: [
      "Everything in Adjudicate",
      "AGI Pentest & atomic emulation",
      "Unlimited alert volume",
      "SSO, RBAC & air-gapped deploy",
      "24/7 managed BPaaS operators",
      "Board-ready ROI reporting",
    ],
    cta: "Talk to sales",
    featured: false,
  },
];

export const INTRO_CARDS = [
  { key: "Autonomous triage", rest: ", at machine speed.", desc: "n8n agents close false positives before anyone wakes up.", to: "/how-it-works" },
  { key: "Human-in-the-loop", rest: " verdicts.", desc: "Every true positive is argued and ruled on, then surfaced for review.", to: "/modules" },
  { key: "MITRE-native", rest: " validation.", desc: "Adversary emulation proves your detections actually hold.", to: "/stack" },
];

export const CAPABILITIES = [
  {
    id: "detection",
    title: "Detection",
    subtitle: "Intelligent alert processing",
    desc: "Telemetry from your SIEM streams into the alert core, where every signal is normalized, deduplicated, and enriched.",
    bullets: ["Multi-source alert ingestion", "AI-powered triage & enrichment", "Up to 95–99% false-positive elimination", "Context-aware conclusions"],
  },
  {
    id: "auto-triage",
    title: "Auto-Triage",
    subtitle: "Autonomous false-positive closure",
    desc: "False positives are closed autonomously by n8n before an analyst ever sees them — only what is real moves forward.",
    bullets: ["Deterministic closure rules", "Full audit trail per decision", "Surfaces true positives only", "No analyst touch required"],
  },
  {
    id: "ai-court",
    title: "AI Court",
    subtitle: "The adjudication tribunal",
    desc: "Each true positive is argued in an n8n tribunal — a Prosecutor argues malicious, a Defender argues benign, the Judge rules.",
    bullets: ["Prosecutor / Defender / Judge", "Evidence-backed verdicts", "Conclusion with full narrative", "Reviewable before action"],
  },
  {
    id: "rules",
    title: "Recommended Rules",
    subtitle: "Sigma rule synthesis",
    desc: "Detection rules are proposed automatically from real incidents and queued for a human to approve or reject.",
    bullets: ["Vendor-agnostic Sigma output", "Proposed from real incidents", "One-click approve / reject", "Coverage written back to ATT&CK"],
  },
  {
    id: "pentest",
    title: "AGI Pentest",
    subtitle: "Adversary emulation",
    desc: "Atomic Red Team adversary emulation across 335 techniques, scoped to your environment and mapped live to MITRE ATT&CK.",
    bullets: ["335 atomic techniques", "Scoped, authorized engagements", "Live ATT&CK coverage map", "Validates detections end-to-end"],
  },
  {
    id: "insights",
    title: "Enterprise Insights",
    subtitle: "Real-time dashboards",
    desc: "Board-ready reporting and live KPI dashboards turn raw operations into a clear picture of posture and trend.",
    bullets: ["Real-time KPI dashboards", "Board-ready reporting", "Trend analysis & forecasting", "Custom metric tracking"],
  },
];

export const MODULES = CAPABILITIES.slice(2);
export const MARQUEE = ["MITRE ATT&CK", "Atomic Red Team", "Sigma", "Wazuh", "n8n", "WebSocket Streaming"];

export const STACK = [
  { name: "MITRE ATT&CK", desc: "Every technique mapped to the global adversary knowledge base." },
  { name: "Atomic Red Team", desc: "Deterministic adversary emulation across 335 atomic tests." },
  { name: "Sigma", desc: "Vendor-agnostic detection rules, synthesized from real incidents." },
  { name: "Wazuh", desc: "SIEM telemetry ingestion and normalization at the alert core." },
  { name: "n8n", desc: "Agentic triage, adjudication, and autonomous false-positive closure." },
  { name: "WebSocket Streaming", desc: "Live execution and AI-analysis streams into the console." },
];

export const STEPS = [
  { n: "01", title: "Ingest", desc: "Telemetry streams from your SIEM into the alert core, normalized and deduplicated." },
  { n: "02", title: "Adjudicate", desc: "n8n agents triage, argue, and close false positives — surfacing only true positives." },
  { n: "03", title: "Validate", desc: "Adversary emulation proves your detections hold, with coverage written back to ATT&CK." },
];

/* ---------- Flat product mock (square, browser-chrome frame) ---------- */
export function ConsoleMock() {
  return (
    <div className="rf-frame">
      <div className="flex items-center gap-2 px-4 py-3" style={{ background: "#ecebe6", borderBottom: "1px solid rgba(30,30,30,0.1)" }}>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#bcbcbc" }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#bcbcbc" }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#bcbcbc" }} />
        <span className="rf-mono ml-3 text-[11px]" style={{ color: "#808080" }}>phantomx · command center</span>
      </div>
      <div className="grid grid-cols-3 gap-px p-px" style={{ background: "rgba(30,30,30,0.08)" }}>
        {[
          { v: "2.4K", l: "Alerts" },
          { v: "1.3K", l: "Auto-closed" },
          { v: "335", l: "Techniques" },
        ].map((k) => (
          <div key={k.l} className="bg-[#f6f5f1] p-5">
            <div className="rf-display text-4xl" style={{ color: "#1e1e1e" }}>{k.v}</div>
            <div className="rf-eyebrow mt-1">{k.l}</div>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-1.5 bg-[#f6f5f1] p-5" style={{ borderTop: "1px solid rgba(30,30,30,0.08)" }}>
        {[38, 62, 45, 80, 56, 92, 70, 48, 66, 88, 74, 60, 96, 52, 78].map((h, i) => (
          <div key={i} className="flex-1" style={{ height: `${h}px`, background: i % 3 === 0 ? "#9fb5ad" : "#1e1e1e" }} />
        ))}
      </div>
    </div>
  );
}
