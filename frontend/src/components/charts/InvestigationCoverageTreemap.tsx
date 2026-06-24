import { useState } from "react";
import { motion } from "framer-motion";
import {
  COVERAGE_COLORS,
  COVERAGE_LABELS,
  DETECTION_COVERAGE,
} from "@/data/detection-coverage";
import type { DetectionCoverageSource } from "@/lib/types";
import { cn, prefersReducedMotion } from "@/lib/utils";

function SourceColumn({
  source,
  index,
}: {
  source: DetectionCoverageSource;
  index: number;
}) {
  const reduced = prefersReducedMotion();
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div
      className="flex min-w-[120px] flex-1 flex-col gap-1"
      style={{ flexGrow: source.total }}
    >
      <div className="mb-1 truncate px-1 text-[11px] font-semibold text-foreground">
        {source.name}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        {source.alerts.map((alert, i) => {
          const active = hover === alert.title;
          return (
            <motion.div
              key={alert.title}
              initial={reduced ? false : { opacity: 0, scaleY: 0.6 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: index * 0.06 + i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              whileHover={reduced ? undefined : { scale: 1.02, zIndex: 10 }}
              onMouseEnter={() => setHover(alert.title)}
              onMouseLeave={() => setHover(null)}
              className={cn(
                "relative flex min-h-[52px] flex-col justify-between overflow-hidden rounded-md p-2 transition-shadow",
                active && "shadow-seven-pop ring-1 ring-foreground/10"
              )}
              style={{
                flexGrow: alert.count,
                background: COVERAGE_COLORS[alert.coverage] ?? "#9DC4E0",
                color: alert.coverage === "none" || alert.coverage === "partial" ? "#fff" : "#111",
              }}
            >
              <p className="line-clamp-2 text-[10px] font-medium leading-tight">{alert.title}</p>
              <span className="text-lg font-light tabular-nums">{alert.count}</span>
              {active && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute right-1.5 top-1.5 rounded bg-black/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase"
                >
                  {COVERAGE_LABELS[alert.coverage]}
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function InvestigationCoverageTreemap({
  sources = DETECTION_COVERAGE,
  className,
}: {
  sources?: DetectionCoverageSource[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        {Object.entries(COVERAGE_LABELS).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: COVERAGE_COLORS[key] }}
            />
            {label}
          </span>
        ))}
      </div>
      <div className="flex h-[min(420px,55vh)] gap-1 overflow-x-auto pb-1">
        {sources.map((s, i) => (
          <SourceColumn key={s.name} source={s} index={i} />
        ))}
      </div>
    </div>
  );
}
