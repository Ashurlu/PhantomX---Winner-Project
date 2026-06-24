import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvestigationSankey } from "@/components/charts/InvestigationSankey";
import type { OverviewPipelineMetrics } from "@/lib/overview-metrics";
import { cn } from "@/lib/utils";

export function InvestigationPipelineCard({
  metrics,
  className,
}: {
  metrics: OverviewPipelineMetrics;
  className?: string;
}) {
  const [activeSource, setActiveSource] = useState<number | undefined>(undefined);
  const [activeDet, setActiveDet] = useState<number | undefined>(undefined);

  return (
    <Card className={cn("module-panel overflow-hidden border-0 shadow-none", className)}>
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold">Investigation pipeline</CardTitle>
          <span className="text-xs text-muted-foreground">{metrics.periodLabel}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <InvestigationSankey nodes={metrics.sankeyNodes} links={metrics.sankeyLinks} />

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label="Escalated" value={metrics.escalated} accent="#E53935" />
          <StatTile label="Auto-handled" value={metrics.notEscalated} />
          <StatTile label="Time saved" value={metrics.timeSaved} accent="#2E8B6A" small />
          <MiniDonut
            title="Log sources"
            center={`${metrics.alerts.toLocaleString()} alerts`}
            data={metrics.sources}
            active={activeSource}
            onActive={setActiveSource}
          />
          <MiniDonut
            title="Outcomes"
            center={`${metrics.incidents} incidents`}
            data={metrics.determinations}
            active={activeDet}
            onActive={setActiveDet}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function StatTile({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string | number;
  accent?: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-muted/20 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn("mt-1 font-light tabular-nums", small ? "text-2xl" : "text-3xl")}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function MiniDonut({
  title,
  center,
  data,
  active,
  onActive,
}: {
  title: string;
  center: string;
  data: { name: string; value: number; pct: number; color: string }[];
  active?: number;
  onActive: (i: number | undefined) => void;
}) {
  if (data.length === 0) return null;

  return (
    <div className="rounded-lg border border-border/80 bg-card px-3 py-3 sm:col-span-1 lg:col-span-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <div className="relative h-16 w-16 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={20}
                outerRadius={30}
                paddingAngle={2}
                stroke="none"
                activeIndex={active}
                onMouseEnter={(_, i) => onActive(i)}
                onMouseLeave={() => onActive(undefined)}
                isAnimationActive
                animationDuration={600}
              >
                {data.map((d, i) => (
                  <Cell
                    key={d.name}
                    fill={d.color}
                    opacity={active === undefined || active === i ? 1 : 0.35}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-[9px] leading-tight text-muted-foreground">{center}</p>
          {data.slice(0, 3).map((d, i) => (
            <div key={d.name} className="flex justify-between text-[10px]">
              <span className="truncate text-muted-foreground">{d.name}</span>
              <span className="tabular-nums">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
