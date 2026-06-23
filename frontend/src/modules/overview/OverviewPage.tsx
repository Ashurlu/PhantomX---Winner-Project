import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  Database,
  FolderKanban,
  Gavel,
  Hand,
  Radar,
  ShieldCheck,
  ShieldHalf,
  Swords,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/KpiCard";
import { DisplayCards } from "@/components/ui/display-cards";
import { OverviewCore } from "@/three/OverviewCore";
import { CardSkeletonGrid, ErrorState, LoadingState } from "@/components/States";
import { useOverview, useSystemStatus } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { SEVERITY_COLORS } from "@/lib/theme";
import { formatTimeRangeShort } from "@/lib/time-range";
import { useUi } from "@/store/ui";

export function OverviewPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useOverview();
  const status = useSystemStatus();
  const timeFrom = useUi((s) => s.timeFrom);
  const timeTo = useUi((s) => s.timeTo);
  const rl = formatTimeRangeShort(timeFrom, timeTo);

  if (isError) return <ErrorState message="Failed to load overview." onRetry={() => refetch()} />;

  const sev = data?.openBySeverity;
  const total = data ? data.handling.automated + data.handling.manual : 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Command-center header — clean light product header (7AI style) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-end justify-between gap-5"
      >
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Command Center</span>
            <span className="opacity-50">/</span>
            <span>Overview</span>
          </div>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Operations Overview
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            Autonomous triage, adjudication, and MITRE ATT&amp;CK adversary
            validation — running live across your environment.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-70 ${
                  status.data?.dataSource === "live" ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  status.data?.dataSource === "live" ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
            </span>
            <span className="text-xs font-medium text-foreground">
              {status.data?.dataSource === "live" ? "Live" : "Mock"}
            </span>
          </span>
          <div className="hidden text-right sm:block">
            <div className="font-mono text-xl font-bold tabular-nums text-foreground">
              <LiveClock />
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              Local time · {rl}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hero: 3D core + FP auto-closed */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="telemetry-hero accent-top relative col-span-2 h-[340px] overflow-hidden p-0">
          <div className="absolute inset-0">
            <OverviewCore />
          </div>
          <div className="pointer-events-none absolute left-6 top-5">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              Live Telemetry Core
            </p>
            <p className="telemetry-hero-muted mt-1 max-w-xs text-xs">
              Sources stream into the alert core; incident orbs branch to
              resolved (green) and open (orange).
            </p>
          </div>
          {data && (
            <div className="pointer-events-none absolute bottom-5 left-6 flex gap-6">
              <CoreStat label="Alerts" value={formatNumber(data.alerts)} color="#8B5CF6" />
              <CoreStat label="Incidents" value={String(data.incidents)} color="#22D3EE" />
              <CoreStat label="Resolved" value={String(data.incidentsResolved)} color="#10B981" />
              <CoreStat label="Open" value={String(data.incidentsOpen)} color="#F97316" />
            </div>
          )}
        </Card>

        {/* FP auto-closed by n8n */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="accent-top flex h-[340px] flex-col justify-between overflow-hidden p-6">
            <div className="flex items-center gap-2 text-accent">
              <Bot className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">
                False Positives Auto-Closed
              </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 py-2">
              <span className="font-display text-6xl font-bold text-accent">
                {data ? formatNumber(data.falsePositivesAutoClosed) : "—"}
              </span>
              <span className="text-sm text-muted-foreground">
                auto-closed by n8n ({rl})
              </span>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Analysts never see these — they are triaged and closed
              autonomously, surfacing only true positives in AI Court.
            </p>
          </Card>
        </motion.div>
      </div>

      {/* KPI row */}
      {isLoading ? (
        <CardSkeletonGrid count={4} />
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label={`Data Ingestion (${rl})`}
              value={`${data.kpis.dataIngestionTb24h} TB`}
              icon={Database}
              trendPct={data.kpis.dataIngestionTrendPct}
              spark={data.kpis.ingestionSpark}
              accent="#8B5CF6"
            />
            <KpiCard
              label={`Events Ingested (${rl})`}
              value={formatNumber(data.kpis.eventsIngestion24h)}
              icon={Activity}
              trendPct={data.kpis.eventsTrendPct}
              spark={data.kpis.eventsSpark}
              accent="#22D3EE"
            />
            <KpiCard
              label="Prevented Events"
              value={formatNumber(data.kpis.preventedEvents)}
              icon={ShieldCheck}
              accent="#10B981"
              sub="blocked pre-execution"
            />
            <KpiCard
              label="Open Incidents"
              value={data.kpis.currentlyOpenIncidents}
              icon={AlertTriangle}
              accent="#F97316"
              sub={`oldest open ${data.kpis.oldestOpenDays}d`}
            />
          </div>

          {/* Handling split + Open by severity + Sources */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="accent-top glass-hover">
              <CardHeader>
                <CardTitle>Incident Handling</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <HandlingBar
                  icon={Bot}
                  label="Automated"
                  value={data.handling.automated}
                  pct={Math.round((data.handling.automated / total) * 100)}
                  color="#22D3EE"
                />
                <HandlingBar
                  icon={Hand}
                  label="Manual"
                  value={data.handling.manual}
                  pct={Math.round((data.handling.manual / total) * 100)}
                  color="#F59E0B"
                />
              </CardContent>
            </Card>

            <Card className="accent-top glass-hover">
              <CardHeader>
                <CardTitle>Open by Severity</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {sev &&
                  (["critical", "high", "medium", "low"] as const).map((k) => (
                    <div
                      key={k}
                      className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2.5"
                    >
                      <span className="flex items-center gap-2 text-sm capitalize">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            background: SEVERITY_COLORS[k],
                            boxShadow: `0 0 8px ${SEVERITY_COLORS[k]}`,
                          }}
                        />
                        {k}
                      </span>
                      <span className="font-display text-xl font-bold">
                        {sev[k]}
                      </span>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card className="accent-top glass-hover">
              <CardHeader>
                <CardTitle>Data Sources</CardTitle>
              </CardHeader>
              <CardContent className="flex max-h-[260px] flex-col gap-1 overflow-y-auto pr-1">
                {data.sources.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-secondary/80"
                  >
                    <span className="text-sm">{s.name}</span>
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatNumber(s.logCount)}
                      </span>
                      <span
                        className={`flex items-center gap-0.5 text-xs font-semibold ${
                          s.trendPct >= 0
                            ? "text-severity-resolved"
                            : "text-severity-high"
                        }`}
                      >
                        {s.trendPct >= 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {Math.abs(s.trendPct)}%
                      </span>
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <LoadingState />
      )}

      {/* Module shortcuts */}
      <div>
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Modules
        </h2>
        <DisplayCards
          cards={[
            {
              icon: Radar,
              title: "Detection",
              description: "Alert intelligence & timeline",
              meta: `${data?.alerts ? formatNumber(data.alerts) : ""}`,
              accent: "#ec4899",
              onClick: () => navigate("/detection"),
            },
            {
              icon: FolderKanban,
              title: "Cases",
              description: "Incident inbox & Kanban board",
              meta: `${data?.incidentsOpen ?? 0} open`,
              accent: "#6366F1",
              onClick: () => navigate("/cases"),
            },
            {
              icon: Gavel,
              title: "AI Court",
              description: "n8n verdicts on true positives",
              meta: "14 TP",
              accent: "#8B5CF6",
              onClick: () => navigate("/ai-court"),
            },
            {
              icon: ShieldHalf,
              title: "Recommended Rules",
              description: "KQL rules to approve / reject",
              accent: "#22D3EE",
              onClick: () => navigate("/rules"),
            },
            {
              icon: Swords,
              title: "AGI Pentest",
              description: "MITRE ATT&CK validation",
              accent: "#F59E0B",
              onClick: () => navigate("/pentest"),
            },
            {
              icon: Zap,
              title: "Auto-Triage",
              description: `${formatNumber(data?.falsePositivesAutoClosed ?? 0)} FPs closed`,
              accent: "#10B981",
              onClick: () => navigate("/ai-court"),
            },
          ]}
        />
      </div>
    </div>
  );
}

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span>
      {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
    </span>
  );
}

function CoreStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-display text-2xl font-bold" style={{ color }}>
        {value}
      </span>
      <span className="telemetry-hero-muted text-[10px] uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function HandlingBar({
  icon: Icon,
  label,
  value,
  pct,
  color,
}: {
  icon: typeof Bot;
  label: string;
  value: number;
  pct: number;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color }} />
          {label}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {value} · {pct}%
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 12px ${color}` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
