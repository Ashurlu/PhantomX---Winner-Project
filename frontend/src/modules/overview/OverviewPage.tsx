import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  Database,
  Gavel,
  Hand,
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
import { useOverview } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { SEVERITY_COLORS } from "@/lib/theme";
import { rangeCode, useUi } from "@/store/ui";

export function OverviewPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useOverview();
  const rl = rangeCode(useUi((s) => s.timeRange));

  if (isError) return <ErrorState message="Failed to load overview." onRetry={() => refetch()} />;

  const sev = data?.openBySeverity;
  const total = data ? data.handling.automated + data.handling.manual : 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Hero: 3D core + FP auto-closed */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="relative col-span-2 h-[340px] overflow-hidden p-0">
          <div className="absolute inset-0">
            <OverviewCore />
          </div>
          <div className="pointer-events-none absolute left-6 top-5">
            <p className="font-display text-sm uppercase tracking-[0.2em] text-secondary">
              Live Telemetry Core
            </p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
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
          <Card className="flex h-[340px] flex-col justify-between overflow-hidden border-secondary/30 p-6">
            <div className="flex items-center gap-2 text-secondary">
              <Bot className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">
                False Positives Auto-Closed
              </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 py-2">
              <span className="font-display text-6xl font-bold text-glow text-secondary">
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
            <Card>
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

            <Card>
              <CardHeader>
                <CardTitle>Open by Severity</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {sev &&
                  (["critical", "high", "medium", "low"] as const).map((k) => (
                    <div
                      key={k}
                      className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2.5"
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

            <Card>
              <CardHeader>
                <CardTitle>Data Sources</CardTitle>
              </CardHeader>
              <CardContent className="flex max-h-[260px] flex-col gap-1 overflow-y-auto pr-1">
                {data.sources.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-primary/5"
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
              icon: Gavel,
              title: "AI Court",
              description: "n8n verdicts on true positives",
              meta: `${data?.incidents ?? ""}`,
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

function CoreStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-display text-2xl font-bold" style={{ color }}>
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
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
      <div className="h-2.5 overflow-hidden rounded-full bg-background/60">
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
