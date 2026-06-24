import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  FolderKanban,
  Gavel,
  Radar,
  ShieldHalf,
  Swords,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DisplayCards } from "@/components/ui/display-cards";
import { InvestigationPipelineCard } from "@/components/charts/InvestigationPipelineCard";
import { ModuleHero, ModuleLiveBadge } from "@/components/module";
import { CardSkeletonGrid, ErrorState } from "@/components/States";
import { useOverview, useInvestigationPipeline, useSystemStatus, useAiCourtStats } from "@/lib/api";
import { buildOverviewPipeline } from "@/lib/overview-metrics";
import { SEVERITY_COLORS } from "@/lib/theme";
import { formatNumber } from "@/lib/utils";
import { formatTimeRangeShort } from "@/lib/time-range";
import { useUi } from "@/store/ui";

export function OverviewPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useOverview();
  const pipelineConfig = useInvestigationPipeline();
  const aiCourtStats = useAiCourtStats();
  const status = useSystemStatus();
  const timeFrom = useUi((s) => s.timeFrom);
  const timeTo = useUi((s) => s.timeTo);
  const rl = formatTimeRangeShort(timeFrom, timeTo);

  const pipeline = useMemo(
    () => (data ? buildOverviewPipeline(data, rl, pipelineConfig.data) : null),
    [data, rl, pipelineConfig.data]
  );

  if (isError) return <ErrorState message="Failed to load overview." onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-5">
      <ModuleHero
        accent="violet"
        section="Command Center"
        title="Operations Overview"
        description={`${rl} — one story from ingestion through auto-triage to open incidents.`}
        badges={<ModuleLiveBadge live={status.data?.dataSource === "live"} />}
        stats={
          pipeline
            ? [
                { label: "Alerts", value: formatNumber(pipeline.alerts), accent: "#6B5CE7" },
                { label: "Auto-closed FP", value: formatNumber(pipeline.falsePositivesClosed), accent: "#2E8B6A" },
                { label: "Incidents", value: pipeline.incidents, accent: "#FF7043" },
                { label: "Open", value: pipeline.incidentsOpen, accent: "#FFC107" },
              ]
            : undefined
        }
      />

      {isLoading || !data || !pipeline ? (
        <CardSkeletonGrid count={2} />
      ) : (
        <>
          {/* Single narrative strip — same numbers everywhere below */}
          <Card className="module-panel border-0 shadow-none">
            <CardContent className="px-5 py-4">
              <p className="mb-3 text-xs font-medium text-muted-foreground">
                Alert lifecycle · {rl}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <FlowStep label="Ingested" value={pipeline.alerts} />
                <FlowArrow />
                <FlowStep label="FP auto-closed" value={pipeline.falsePositivesClosed} muted />
                <FlowArrow />
                <FlowStep label="Reviewed" value={pipeline.reviewedAlerts} />
                <FlowArrow />
                <FlowStep label="Incidents" value={pipeline.incidents} highlight />
                <FlowArrow />
                <FlowStep label="Open now" value={pipeline.incidentsOpen} accent="#FF7043" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {pipeline.automatedPct}% handled by automation · {formatNumber(pipeline.falsePositivesClosed)}{" "}
                false positives never reached analysts · {pipeline.truePositives} open findings across severity
                tiers
              </p>
            </CardContent>
          </Card>

          <InvestigationPipelineCard metrics={pipeline} />

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="module-panel border-0 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Open incidents</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {(["critical", "high", "medium", "low"] as const).map((k) => (
                  <div
                    key={k}
                    className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2.5"
                  >
                    <span className="flex items-center gap-2 text-sm capitalize text-muted-foreground">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: SEVERITY_COLORS[k] }}
                      />
                      {k}
                    </span>
                    <span className="text-xl font-light tabular-nums">{data.openBySeverity[k]}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="module-panel border-0 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Top log sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.sources.slice(0, 5).map((s) => {
                  const max = data.sources[0]?.logCount ?? 1;
                  const w = Math.round((s.logCount / max) * 100);
                  return (
                    <div key={s.name}>
                      <div className="flex justify-between text-sm">
                        <span className="truncate text-foreground">{s.name}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {formatNumber(s.logCount)}
                        </span>
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className="h-full rounded-full bg-foreground/70"
                          initial={{ width: 0 }}
                          animate={{ width: `${w}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Modules
            </h2>
            <DisplayCards
              cards={[
                {
                  icon: Radar,
                  title: "Detection",
                  description: "Alert intelligence & timeline",
                  meta: formatNumber(pipeline.alerts),
                  accent: "#6B5CE7",
                  onClick: () => navigate("/detection"),
                },
                {
                  icon: FolderKanban,
                  title: "Cases",
                  description: "Incident inbox & Kanban board",
                  meta: `${pipeline.incidentsOpen} open`,
                  accent: "#4A7FD4",
                  onClick: () => navigate("/cases"),
                },
                {
                  icon: Gavel,
                  title: "AI Court",
                  description: "n8n verdicts on true positives",
                  meta: `${aiCourtStats.data?.truePositivesShown ?? pipeline.truePositives} findings`,
                  accent: "#6B5CE7",
                  onClick: () => navigate("/ai-court"),
                },
                {
                  icon: ShieldHalf,
                  title: "Recommended Rules",
                  description: "KQL rules to approve / reject",
                  accent: "#2E8B6A",
                  onClick: () => navigate("/rules"),
                },
                {
                  icon: Swords,
                  title: "AGI Pentest",
                  description: "MITRE ATT&CK validation",
                  accent: "#FF7043",
                  onClick: () => navigate("/pentest"),
                },
                {
                  icon: Zap,
                  title: "Auto-Triage",
                  description: "False positives closed autonomously",
                  meta: `${formatNumber(pipeline.falsePositivesClosed)} FPs`,
                  accent: "#2E8B6A",
                  onClick: () => navigate("/ai-court"),
                },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}

function FlowStep({
  label,
  value,
  muted,
  highlight,
  accent,
}: {
  label: string;
  value: number;
  muted?: boolean;
  highlight?: boolean;
  accent?: string;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-lg bg-foreground px-3 py-2 text-background"
          : muted
            ? "rounded-lg bg-muted/50 px-3 py-2"
            : "rounded-lg border border-border px-3 py-2"
      }
    >
      <p className="text-[10px] uppercase tracking-wide opacity-70">{label}</p>
      <p
        className="text-lg font-light tabular-nums"
        style={accent ? { color: accent } : undefined}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function FlowArrow() {
  return <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />;
}
