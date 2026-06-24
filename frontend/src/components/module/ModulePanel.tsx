import type { ComponentProps } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/utils";

export function ModulePanel({ className, ...props }: ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        "seven-card module-panel border-0 shadow-none transition-shadow duration-300 hover:shadow-seven-pop",
        className
      )}
      {...props}
    />
  );
}

export function ModuleStatTile({
  label,
  value,
  sub,
  accent = "#111111",
  index = 0,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  index?: number;
}) {
  const reduced = prefersReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={reduced ? undefined : { y: -3, transition: { duration: 0.2 } }}
      className="seven-stat-card group"
    >
      <p className="seven-stat-card-label">{label}</p>
      <p className="seven-stat-card-value tabular-nums" style={{ color: accent }}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      <div className="seven-stat-card-glow" aria-hidden />
    </motion.div>
  );
}
