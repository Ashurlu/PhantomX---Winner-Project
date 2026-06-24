import type { Overview } from "@/lib/types";
import type { InvestigationPipelineConfig } from "@/lib/types";
import type { SankeyLink, SankeyNode } from "@/data/investigation-sankey";
import {
  INVESTIGATION_SANKEY_LINKS,
  INVESTIGATION_SANKEY_NODES,
} from "@/data/investigation-sankey";

export interface OverviewPipelineMetrics {
  periodLabel: string;
  alerts: number;
  falsePositivesClosed: number;
  reviewedAlerts: number;
  incidents: number;
  incidentsOpen: number;
  incidentsResolved: number;
  escalated: number;
  notEscalated: number;
  automatedPct: number;
  manualPct: number;
  timeSaved: string;
  truePositives: number;
  sources: { name: string; value: number; pct: number; color: string }[];
  determinations: { name: string; value: number; pct: number; color: string }[];
  sankeyNodes: SankeyNode[];
  sankeyLinks: SankeyLink[];
}

const DET_COLORS = ["#6B5CE7", "#4A7FD4", "#2E8B6A", "#FF7043", "#E53935"];

function scaleNodes(nodes: SankeyNode[], factor: number): SankeyNode[] {
  return nodes.map((n) => ({
    ...n,
    value: Math.max(1, Math.round(n.value * factor)),
  }));
}

function scaleLinks(links: SankeyLink[], factor: number): SankeyLink[] {
  return links.map((l) => ({
    ...l,
    value: Math.max(1, Math.round(l.value * factor)),
  }));
}

/** Single source of truth — all overview sections derive from the same Overview payload. */
export function buildOverviewPipeline(
  data: Overview,
  periodLabel: string,
  pipelineConfig?: InvestigationPipelineConfig | null
): OverviewPipelineMetrics {
  const alerts = data.alerts;
  const fp = data.falsePositivesAutoClosed;
  const reviewed = Math.max(0, alerts - fp);
  const incidents = data.incidents;
  const escalated = incidents;
  const notEscalated = Math.max(0, reviewed - incidents);
  const openSev = data.openBySeverity;
  const truePositives = openSev.critical + openSev.high + openSev.medium + openSev.low;

  const savedMinutes = Math.round(fp * 0.48);
  const timeSaved = `${Math.floor(savedMinutes / 60)}h ${savedMinutes % 60}m`;

  const logTotal = data.sources.reduce((s, x) => s + x.logCount, 0);
  const topSources = [...data.sources]
    .sort((a, b) => b.logCount - a.logCount)
    .slice(0, 2)
    .map((s, i) => ({
      name: s.name.split(" /")[0].split(" ")[0],
      value: s.logCount,
      pct: logTotal > 0 ? Math.round((s.logCount / logTotal) * 100) : 0,
      color: DET_COLORS[i] ?? "#6B5CE7",
    }));

  const detTotal = Math.max(
    1,
    openSev.critical + openSev.high + openSev.medium + openSev.low + data.incidentsResolved
  );
  const determinations = [
    {
      name: "Malicious",
      value: openSev.critical + openSev.high,
      pct: Math.round(((openSev.critical + openSev.high) / detTotal) * 100),
      color: "#E53935",
    },
    {
      name: "Suspicious",
      value: openSev.medium,
      pct: Math.round((openSev.medium / detTotal) * 100),
      color: "#FF7043",
    },
    {
      name: "Benign (auto-closed)",
      value: fp,
      pct: Math.round((fp / Math.max(1, alerts)) * 100),
      color: "#2E8B6A",
    },
    {
      name: "Resolved",
      value: data.incidentsResolved,
      pct: Math.round((data.incidentsResolved / detTotal) * 100),
      color: "#4A7FD4",
    },
  ].filter((d) => d.value > 0);

  const baseNodes: SankeyNode[] = pipelineConfig?.nodes?.length
    ? pipelineConfig.nodes
    : INVESTIGATION_SANKEY_NODES;
  const baseLinks: SankeyLink[] = pipelineConfig?.links?.length
    ? pipelineConfig.links
    : INVESTIGATION_SANKEY_LINKS;
  const baseTotal = pipelineConfig?.metrics?.totalAlerts ?? 90;
  const sankeyFactor = incidents / Math.max(1, baseTotal);
  const metrics = pipelineConfig?.metrics;

  return {
    periodLabel,
    alerts,
    falsePositivesClosed: fp,
    reviewedAlerts: reviewed,
    incidents,
    incidentsOpen: data.incidentsOpen,
    incidentsResolved: data.incidentsResolved,
    escalated: metrics?.escalated ?? escalated,
    notEscalated: metrics?.notEscalated ?? notEscalated,
    automatedPct: data.handling.automated,
    manualPct: data.handling.manual,
    timeSaved: metrics?.timeSaved ?? timeSaved,
    truePositives,
    sources: metrics?.sources?.length ? metrics.sources : topSources,
    determinations: metrics?.determinations?.length ? metrics.determinations : determinations,
    sankeyNodes: scaleNodes(baseNodes, sankeyFactor),
    sankeyLinks: scaleLinks(baseLinks, sankeyFactor),
  };
}
