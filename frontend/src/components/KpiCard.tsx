import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { cn, prefersReducedMotion } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  icon: Icon,
  trendPct,
  spark,
  accent = "hsl(var(--primary))",
  sub,
  index = 0,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trendPct?: number;
  spark?: number[];
  accent?: string;
  sub?: string;
  index?: number;
}) {
  const up = (trendPct ?? 0) >= 0;
  const data = (spark ?? []).map((v, i) => ({ i, v }));
  const gid = `g-${label.replace(/\s/g, "")}`;
  const reduced = prefersReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      whileHover={reduced ? undefined : { y: -4, transition: { duration: 0.22 } }}
    >
      <Card className="glass-hover group relative overflow-hidden p-5">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: `radial-gradient(circle, color-mix(in srgb, ${accent} 18%, transparent), transparent 70%)` }}
          aria-hidden
        />
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <motion.span
              className="font-sans text-4xl font-light tracking-tight text-foreground md:text-5xl"
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.07, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              {value}
            </motion.span>
            {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
          </div>
          {Icon && (
            <motion.div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)` }}
              whileHover={reduced ? undefined : { rotate: [0, -8, 8, 0], scale: 1.08 }}
              transition={{ duration: 0.45 }}
            >
              <Icon className="h-4 w-4" style={{ color: accent }} />
            </motion.div>
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
                  isAnimationActive={!reduced}
                  animationDuration={1200}
                  animationBegin={index * 80}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
