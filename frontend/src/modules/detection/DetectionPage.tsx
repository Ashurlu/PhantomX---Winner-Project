import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { AlertTimeTimeline } from "@/components/AlertTimeTimeline";
import { AlertSourceBreakdown } from "@/components/charts/AlertSourceBreakdown";
import { InvestigationCoverageTreemap } from "@/components/charts/InvestigationCoverageTreemap";
import { CardSkeletonGrid, ErrorState } from "@/components/States";
import { ModuleHero, ModuleLiveBadge, ModulePanel } from "@/components/module";
import { useDetection, useOverview, useInvestigationPipeline } from "@/lib/api";
import { sliceWeeklyForPeriod, weeklyAverageFromSeries } from "@/lib/detection-weekly-data";
import { buildOverviewPipeline } from "@/lib/overview-metrics";
import { formatTimeRangeShort } from "@/lib/time-range";
import { SEVERITY_COLORS } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useUi, rangeCodeFromTimestamps } from "@/store/ui";
import { ThreatHuntPanel } from "./ThreatHuntPanel";

import type { DetectionWeeklyBar } from "@/lib/types";

const WEEKLY_COLORS = ["#6B5CE7", "#4A7FD4", "#2E8B6A"];
const WEEKLY_STACK_KEYS = ["a", "b", "c"] as const;

const SEV_NAME_COLORS: Record<string, string> = {
  critical: SEVERITY_COLORS.critical,
  high: SEVERITY_COLORS.high,
  medium: SEVERITY_COLORS.medium,
  low: SEVERITY_COLORS.low,
};

const CHART_TOOLTIP_STYLE = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--popover-foreground))",
  fontSize: 12,
  boxShadow: "0 4px 12px hsl(0 0% 0% / 0.15)",
};

type PageTab = "intelligence" | "hunt";

function pct(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function normalizeSeverityColors(data: { name: string; value: number; color: string }[]) {
  return data.map((d) => ({
    ...d,
    color: SEV_NAME_COLORS[d.name.toLowerCase()] ?? d.color,
  }));
}

function weeklySourceNames(legend: string[]) {
  return WEEKLY_STACK_KEYS.map((_, i) => legend[i] ?? `Source ${i + 1}`);
}

function buildWeeklyChartData(weekly: DetectionWeeklyBar[], legend: string[]) {
  const sources = weeklySourceNames(legend);
  return weekly.map((row) => {
    const point: Record<string, number> = { day: row.day };
    WEEKLY_STACK_KEYS.forEach((key, i) => {
      point[sources[i]] = row[key];
    });
    return point;
  });
}

function Donut({
  title,
  data,
  centerLabel,
  total,
}: {
  title: string;
  data: { name: string; value: number; color: string }[];
  centerLabel: string;
  total: number;
}) {
  const [active, setActive] = useState<number | undefined>(undefined);

  return (
    <Card className="module-panel p-6 shadow-none">
      <p className="text-center text-sm font-semibold text-foreground">{title}</p>
      <div className="mt-4 flex items-center gap-6">
        <div className="relative h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={58}
                outerRadius={84}
                paddingAngle={2}
                stroke="none"
                activeIndex={active}
                onMouseEnter={(_, i) => setActive(i)}
                onMouseLeave={() => setActive(undefined)}
                isAnimationActive
                animationDuration={900}
              >
                {data.map((d, i) => (
                  <Cell
                    key={d.name}
                    fill={d.color}
                    opacity={active === undefined || active === i ? 1 : 0.4}
                    stroke={active === i ? d.color : "transparent"}
                    strokeWidth={active === i ? 2 : 0}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {centerLabel}
            </span>
            <span className="font-sans text-2xl font-light tabular-nums text-foreground">
              {active !== undefined ? data[active]?.value.toLocaleString() : total.toLocaleString()}
            </span>
            {active !== undefined && (
              <span
                className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: data[active]?.color }}
              >
                {data[active]?.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-1">
          {data.map((d, i) => (
            <div
              key={d.name}
              role="button"
              tabIndex={0}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(undefined)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(undefined)}
              className={cn(
                "flex cursor-default items-center justify-between rounded-md px-2 py-2 text-sm transition-colors",
                active === i ? "bg-muted/60" : "hover:bg-muted/40"
              )}
            >
              <span className="flex items-center gap-2 text-foreground">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: d.color, boxShadow: active === i ? `0 0 8px ${d.color}` : undefined }}
                />
                {d.name}
              </span>
              <span className="flex items-center gap-3">
                <span className="font-semibold tabular-nums text-foreground">
                  {d.value.toLocaleString()}
                </span>
                <span className="w-9 text-right text-xs text-muted-foreground">
                  {pct(d.value, total)}%
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function WeeklyAverageChart({
  weekly,
  weeklyLegend,
  period,
}: {
  weekly: DetectionWeeklyBar[];
  weeklyLegend: string[];
  period: string;
}) {
  const visible = sliceWeeklyForPeriod(weekly, period);
  const avg = weeklyAverageFromSeries(visible);
  const sources = weeklySourceNames(weeklyLegend).slice(0, 3);
  const chartData = buildWeeklyChartData(visible, weeklyLegend).map((row) => ({
    ...row,
    label: `Day ${row.day}`,
  }));

  return (
    <Card className="module-panel p-6 shadow-none">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Daily alert volume</p>
          <p className="text-[11px] text-muted-foreground">
            Last {visible.length} days · stacked by source
          </p>
        </div>
        <span className="text-sm font-light tabular-nums text-foreground">
          ~{avg}/day
        </span>
      </div>
      <div className="mt-5 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="18%">
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              interval={visible.length > 14 ? 2 : 0}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
              contentStyle={CHART_TOOLTIP_STYLE}
              labelStyle={{ color: "hsl(var(--popover-foreground))" }}
              itemStyle={{ color: "hsl(var(--popover-foreground))" }}
              labelFormatter={(_, payload) => {
                const d = payload?.[0]?.payload?.day;
                return d ? `Day ${d}` : "";
              }}
              formatter={(value: number, name: string) => [value.toLocaleString(), name]}
            />
            {sources.map((name, i) => (
              <Bar
                key={name}
                dataKey={name}
                name={name}
                stackId="s"
                fill={WEEKLY_COLORS[i] ?? "#94a3b8"}
                radius={i === sources.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                isAnimationActive
                animationDuration={700}
                animationBegin={i * 60}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {sources.map((s, i) => (
          <span key={s} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: WEEKLY_COLORS[i] ?? "#94a3b8" }}
            />
            {s}
          </span>
        ))}
      </div>
    </Card>
  );
}

export function DetectionPage() {
  const { data, isLoading, isError, refetch, isFetching } = useDetection();
  const overview = useOverview();
  const pipelineConfig = useInvestigationPipeline();
  const { timeFrom, timeTo } = useUi();
  const periodLabel = formatTimeRangeShort(timeFrom, timeTo);
  const pipeline = useMemo(
    () =>
      overview.data
        ? buildOverviewPipeline(overview.data, periodLabel, pipelineConfig.data)
        : null,
    [overview.data, periodLabel, pipelineConfig.data]
  );
  const [tab, setTab] = useState<PageTab>("intelligence");
  const [coverageTab, setCoverageTab] = useState<"coverage" | "escalation">("coverage");

  const total = data?.totalAlerts ?? 0;
  const chartPeriod = data?.period ?? rangeCodeFromTimestamps(timeFrom, timeTo);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6"
    >
      <ModuleHero
        accent="cyan"
        section="Detection"
        title="Alert Intelligence"
        description="Category and severity breakdowns, investigation coverage treemap, and AI-driven threat hunt — scoped to your selected window."
        stats={[
          { label: "Period", value: periodLabel, accent: "#FFC107" },
          { label: "Total alerts", value: total > 0 ? total.toLocaleString() : "—", accent: "#6B5CE7" },
        ]}
        badges={<ModuleLiveBadge live />}
      />

      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
        {(
          [
            ["intelligence", "Alert Intelligence"],
            ["hunt", "Threat Hunt"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "seven-tab-enter flex-1 rounded-md px-4 py-2 text-sm font-medium transition",
              tab === id
                ? "bg-card text-foreground shadow-seven-card"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "hunt" ? (
        <ThreatHuntPanel />
      ) : (
        <>
          <ModulePanel className="overflow-hidden p-0">
            <AlertTimeTimeline />
          </ModulePanel>

          {isError && (
            <ErrorState message="Failed to load detection intelligence." onRetry={() => refetch()} />
          )}

          {!isError && (isLoading || !data) ? (
            <CardSkeletonGrid count={3} />
          ) : !isError && data ? (
            <>
              <div className="grid gap-6 lg:grid-cols-3">
                <Donut
                  title="Categories"
                  data={data.categories}
                  centerLabel="Total Alerts"
                  total={total}
                />
                <Donut
                  title="Severities"
                  data={normalizeSeverityColors(data.severities)}
                  centerLabel="Total Alerts"
                  total={total}
                />
                <WeeklyAverageChart
                  weekly={data.weekly}
                  weeklyLegend={data.weeklyLegend}
                  period={chartPeriod}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="module-panel col-span-2 p-5 shadow-none">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-4">
                      {(["coverage", "escalation"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setCoverageTab(t)}
                          className={cn(
                            "text-sm font-semibold capitalize transition",
                            coverageTab === t
                              ? "text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {t === "coverage" ? "Investigation Coverage" : "Escalation"}
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {total.toLocaleString()} alerts · {periodLabel}
                    </span>
                  </div>
                  {coverageTab === "coverage" ? (
                    <InvestigationCoverageTreemap />
                  ) : pipeline ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-red-200/60 bg-red-50/50 p-5 dark:bg-red-950/20">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-red-600">
                          Escalated to incidents
                        </p>
                        <p className="mt-2 font-sans text-5xl font-light text-red-600">
                          {pipeline.escalated}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          of {pipeline.reviewedAlerts.toLocaleString()} reviewed alerts
                        </p>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/30 p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Auto-handled
                        </p>
                        <p className="mt-2 font-sans text-5xl font-light text-foreground">
                          {pipeline.notEscalated.toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {pipeline.falsePositivesClosed.toLocaleString()} FP closed before review
                        </p>
                      </div>
                    </div>
                  ) : null}
                </Card>

                <Card className="module-panel flex min-h-[420px] flex-col p-5 shadow-none">
                  <AlertSourceBreakdown sources={data.sources} total={total} />
                </Card>
              </div>
            </>
          ) : null}
        </>
      )}

      {isFetching && data && tab === "intelligence" && (
        <p className="text-center text-xs text-muted-foreground">Refreshing detection data…</p>
      )}
    </motion.div>
  );
}
