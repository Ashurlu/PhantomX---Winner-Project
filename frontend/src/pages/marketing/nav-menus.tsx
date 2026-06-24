import { CAPABILITIES } from "./shared";

export type NavLinkItem = {
  label: string;
  /** Short line under the link title in the right column */
  desc: string;
  to: string;
  /** Rich preview shown in the left column when this item is hovered */
  detail: {
    eyebrow: string;
    title: string;
    desc: string;
    cta: { label: string; to: string };
  };
};

export type NavSection = {
  title: string;
  items: NavLinkItem[];
};

export type NavMenu = {
  label: string;
  to: string;
  align?: "left" | "right";
  /** Default left panel before any item is hovered */
  intro: NavLinkItem["detail"];
  sections?: NavSection[];
  grid?: NavLinkItem[];
};

export const NAV_MENUS: NavMenu[] = [
  {
    label: "Platform",
    to: "/modules",
    intro: {
      eyebrow: "Platform",
      title: "The PhantomX product",
      desc: "Hover a topic to preview it — each link opens a different part of the platform.",
      cta: { label: "Browse all modules", to: "/modules" },
    },
    sections: [
      {
        title: "Product",
        items: [
          {
            label: "Modules",
            desc: "Six operators — Detection through Pentest.",
            to: "/modules",
            detail: {
              eyebrow: "Product · Modules",
              title: "Six autonomous operators",
              desc: "Detection ingests alerts, Auto-Triage closes noise, AI Court adjudicates, Rules synthesize Sigma, Pentest validates with Atomic Red Team, and Insights reports posture.",
              cta: { label: "View module catalog", to: "/modules" },
            },
          },
          {
            label: "How it works",
            desc: "The ingest → adjudicate → validate pipeline.",
            to: "/how-it-works",
            detail: {
              eyebrow: "Product · Workflow",
              title: "Three stages, zero analyst noise",
              desc: "Stage 01 ingests and normalizes SIEM telemetry. Stage 02 runs agentic triage and tribunal verdicts. Stage 03 emulates adversaries and writes coverage back to ATT&CK.",
              cta: { label: "See the pipeline", to: "/how-it-works" },
            },
          },
        ],
      },
      {
        title: "Experience",
        items: [
          {
            label: "Live console",
            desc: "Open the command center — overview, court, pentest.",
            to: "/overview",
            detail: {
              eyebrow: "Product · Console",
              title: "Your SOC command center",
              desc: "Real-time dashboards, AI Court cases, detection intel, recommended rules, and AGI Pentest — the same surface your analysts use after sign-in.",
              cta: { label: "Launch console", to: "/overview" },
            },
          },
          {
            label: "Architecture",
            desc: "MITRE, Sigma, Atomic Red Team, Wazuh, n8n.",
            to: "/stack",
            detail: {
              eyebrow: "Product · Architecture",
              title: "Built on open security standards",
              desc: "PhantomX composes MITRE ATT&CK, Sigma rules, Atomic Red Team emulation, Wazuh ingestion, and n8n agent orchestration — no proprietary lock-in on detections.",
              cta: { label: "Explore the stack", to: "/stack" },
            },
          },
        ],
      },
    ],
  },
  {
    label: "Capabilities",
    to: "/modules",
    intro: {
      eyebrow: "Capabilities",
      title: "Pick an operator",
      desc: "Each capability owns one stage of alert handling — hover to read what it does.",
      cta: { label: "Full module list", to: "/modules" },
    },
    grid: CAPABILITIES.map((c) => ({
      label: c.title,
      desc: c.subtitle,
      to: `/modules#${c.id}`,
      detail: {
        eyebrow: `Capability · ${c.title}`,
        title: c.subtitle,
        desc: c.desc,
        cta: { label: `Open ${c.title}`, to: `/modules#${c.id}` },
      },
    })),
  },
  {
    label: "Company",
    to: "/",
    align: "right",
    intro: {
      eyebrow: "Company",
      title: "About PhantomX",
      desc: "Hover a link to see where it takes you.",
      cta: { label: "Back to home", to: "/" },
    },
    sections: [
      {
        title: "Access",
        items: [
          {
            label: "Overview",
            desc: "Product vision and autonomous SOC story.",
            to: "/",
            detail: {
              eyebrow: "Company · Story",
              title: "For those who dare to defend",
              desc: "PhantomX is an autonomous SOC platform — triage, adjudication, and adversary validation so analysts only ever see alerts that are real.",
              cta: { label: "Read the story", to: "/" },
            },
          },
          {
            label: "Sign in",
            desc: "Admin and analyst demo workspaces.",
            to: "/login",
            detail: {
              eyebrow: "Company · Access",
              title: "Sign in to your workspace",
              desc: "Use demo credentials or your team account to access Overview, Detection, AI Court, Rules, Pentest, and Admin Console.",
              cta: { label: "Go to sign in", to: "/login" },
            },
          },
        ],
      },
      {
        title: "Commercial",
        items: [
          {
            label: "BPaaS plans",
            desc: "Triage, Adjudicate, and Command tiers.",
            to: "/#pricing",
            detail: {
              eyebrow: "Company · Services",
              title: "Managed SOC automation",
              desc: "Business Process as a Service — choose Triage for auto-closure, Adjudicate for AI Court + rules, or Command for full enterprise scale with AGI Pentest.",
              cta: { label: "Compare plans", to: "/#pricing" },
            },
          },
          {
            label: "Request a demo",
            desc: "Talk to us about your alert volume.",
            to: "/overview",
            detail: {
              eyebrow: "Company · Sales",
              title: "See PhantomX on your data",
              desc: "Walk through the console with your alert profile — from ingestion volume to adjudication depth and pentest scope.",
              cta: { label: "Request a demo", to: "/overview" },
            },
          },
        ],
      },
    ],
  },
  {
    label: "Resources",
    to: "/stack",
    align: "right",
    intro: {
      eyebrow: "Resources",
      title: "Reference & guides",
      desc: "Documentation-style pages — each resource covers a different topic.",
      cta: { label: "Integration stack", to: "/stack" },
    },
    sections: [
      {
        title: "Reference",
        items: [
          {
            label: "Integration stack",
            desc: "Every standard and tool PhantomX connects to.",
            to: "/stack",
            detail: {
              eyebrow: "Resources · Stack",
              title: "Integration reference",
              desc: "Detailed breakdown of MITRE ATT&CK mapping, Atomic Red Team tests, Sigma rule output, Wazuh ingestion paths, n8n agent flows, and live WebSocket streaming.",
              cta: { label: "Open stack reference", to: "/stack" },
            },
          },
          {
            label: "Workflow playbook",
            desc: "Operational guide — ingest to validation.",
            to: "/how-it-works",
            detail: {
              eyebrow: "Resources · Playbook",
              title: "SOC workflow playbook",
              desc: "A step-by-step operational guide for security teams: how alerts enter, how agents close false positives, how AI Court rules, and how emulation proves detections.",
              cta: { label: "Read the playbook", to: "/how-it-works" },
            },
          },
        ],
      },
      {
        title: "Planning",
        items: [
          {
            label: "Service pricing",
            desc: "Monthly tiers and feature comparison.",
            to: "/#pricing",
            detail: {
              eyebrow: "Resources · Pricing",
              title: "Plan comparison sheet",
              desc: "Side-by-side view of Triage ($2,499/mo), Adjudicate ($6,999/mo), and Command (custom) — alert limits, AI Court, pentest, and support included in each tier.",
              cta: { label: "View pricing", to: "/#pricing" },
            },
          },
          {
            label: "Module index",
            desc: "Alphabetical guide to all six operators.",
            to: "/modules",
            detail: {
              eyebrow: "Resources · Index",
              title: "Module reference index",
              desc: "A catalog page listing every platform operator with capabilities, bullet features, and anchor links — useful when scoping a deployment or RFP.",
              cta: { label: "Open module index", to: "/modules" },
            },
          },
        ],
      },
    ],
  },
];
