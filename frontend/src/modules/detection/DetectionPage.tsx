import { useState } from "react";
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
import { CardSkeletonGrid, ErrorState } from "@/components/States";
import { ModuleHero, ModuleLiveBadge, ModulePanel } from "@/components/module";
import { useDetection } from "@/lib/api";
import { formatTimeRangeShort } from "@/lib/time-range";
import { SEVERITY_COLORS } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useUi } from "@/store/ui";

import type { DetectionWeeklyBar } from "@/lib/types";

const WEEKLY_COLORS = ["#1f3d34", "#4d6b5f", "#9fb5ad", "#cbd5e1", "#e2e8f0"];
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

function pct(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function normalizeSeverityColors(data: { name: string; value: number; color: string }[]) {
  return data.map((d) => ({
    ...d,
    color: SEV_NAME_COLORS[d.name.toLowerCase()] ?? d.color,
  }));
}

/** Map internal a/b/c keys to human-readable source names from the legend. */
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
            <span className="font-display text-2xl font-bold tabular-nums text-foreground">
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
  weeklyAverage,
}: {
  weekly: DetectionWeeklyBar[];
  weeklyLegend: string[];
  weeklyAverage: number;
}) {
  const sources = weeklySourceNames(weeklyLegend);
  const chartData = buildWeeklyChartData(weekly, weeklyLegend);

  return (
    <Card className="module-panel p-6 shadow-none">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Weekly Average</p>
        <span className="text-sm font-bold text-foreground">{weeklyAverage} Alerts</span>
      </div>
      <div className="mt-6 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap={2}>
            <XAxis dataKey="day" hide />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))" }}
              contentStyle={CHART_TOOLTIP_STYLE}
              labelStyle={{ color: "hsl(var(--popover-foreground))" }}
              itemStyle={{ color: "hsl(var(--popover-foreground))" }}
              labelFormatter={(day) => `Day ${day}`}
              formatter={(value: number, name: string) => [
                value.toLocaleString(),
                name,
              ]}
            />
            {sources.map((name, i) => (
              <Bar
                key={name}
                dataKey={name}
                name={name}
                stackId="s"
                fill={WEEKLY_COLORS[i] ?? "#94a3b8"}
                radius={i === sources.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {sources.map((s, i) => (
          <span key={s} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
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
  const { timeFrom, timeTo } = useUi();
  const periodLabel = formatTimeRangeShort(timeFrom, timeTo);

  const total = data?.totalAlerts ?? 0;

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
        description="Category and severity breakdowns, source coverage, and a Wazuh-style timeline brush — all scoped to your selected window."
        stats={[
          { label: "Period", value: periodLabel, accent: "#F59E0B" },
          { label: "Total alerts", value: total > 0 ? total.toLocaleString() : "—", accent: "#22D3EE" },
        ]}
        badges={<ModuleLiveBadge live />}
      />

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
              weeklyAverage={data.weeklyAverage}
            />
          </div>

          <Card className="module-panel p-6 shadow-none">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Investigation Coverage</p>
              <span className="text-sm text-muted-foreground">
                {total.toLocaleString()} alerts · {periodLabel} window
              </span>
            </div>
            <div className="mt-5 space-y-4">
              {data.sources.map((s) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">
                      {s.name}{" "}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        {s.tags}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        {s.value.toLocaleString()} alerts
                      </span>
                      <span className="w-10 text-right font-semibold text-foreground">
                        {s.pct}%
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : null}

      {isFetching && data && (
        <p className="text-center text-xs text-muted-foreground">Refreshing detection data…</p>
      )}
    </motion.div>
  );
}
