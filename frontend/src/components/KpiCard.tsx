import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  icon: Icon,
  trendPct,
  spark,
  accent = "hsl(var(--primary))",
  sub,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trendPct?: number;
  spark?: number[];
  accent?: string;
  sub?: string;
}) {
  const up = (trendPct ?? 0) >= 0;
  const data = (spark ?? []).map((v, i) => ({ i, v }));
  const gid = `g-${label.replace(/\s/g, "")}`;

  return (
    <Card className="glass-hover relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span className="font-display text-3xl font-bold tracking-tight">
            {value}
          </span>
          {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </div>
        {Icon && (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)` }}
          >
            <Icon className="h-4 w-4" style={{ color: accent }} />
          </div>
        )}
      </div>

      {trendPct !== undefined && (
        <div
          className={cn(
            "mt-3 inline-flex items-center gap-1 text-xs font-semibold",
            up ? "text-severity-resolved" : "text-severity-high"
          )}
        >
          {up ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {up ? "+" : ""}
          {trendPct}% <span className="text-muted-foreground">vs prev</span>
        </div>
      )}

      {data.length > 0 && (
        <div className="mt-2 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={accent}
                strokeWidth={1.5}
                fill={`url(#${gid})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
