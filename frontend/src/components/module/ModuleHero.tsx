import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/utils";

export type ModuleAccent = "violet" | "cyan" | "amber" | "rose" | "emerald";

export interface ModuleHeroStat {
  label: string;
  value: string | number;
  accent?: string;
}

const statVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: 0.08 + i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  }),
};

export function ModuleHero({
  section,
  title,
  description,
  accent = "violet",
  badge,
  badges,
  stats,
  actions,
  className,
  children,
}: {
  section: string;
  title: string;
  description?: string;
  accent?: ModuleAccent;
  badge?: ReactNode;
  badges?: ReactNode;
  stats?: ModuleHeroStat[];
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  const reduced = prefersReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn("module-hero seven-hero", `module-hero-${accent}`, className)}
    >
      <div className="seven-hero-shimmer" aria-hidden />
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <motion.div
            initial={reduced ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05, duration: 0.4 }}
            className="seven-hero-crumb"
          >
            <span className="font-medium text-white/90">PhantomX</span>
            <span className="text-white/35">/</span>
            <span className="text-white/55">{section}</span>
          </motion.div>
          {(badge || badges) && (
            <motion.div
              className="mt-3 flex flex-wrap items-center gap-2"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12 }}
            >
              {badge}
              {badges}
            </motion.div>
          )}
          <motion.h1
            className="seven-hero-title"
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
          >
            {title}
          </motion.h1>
          {description && (
            <motion.p
              className="seven-hero-desc"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.22, duration: 0.4 }}
            >
              {description}
            </motion.p>
          )}
          {actions && (
            <motion.div
              className="mt-4 flex flex-wrap gap-2"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
            >
              {actions}
            </motion.div>
          )}
        </div>
        {stats && stats.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                custom={i}
                variants={reduced ? undefined : statVariants}
                initial={reduced ? false : "hidden"}
                animate="show"
                whileHover={reduced ? undefined : { scale: 1.04, y: -3 }}
                className="seven-stat-chip"
              >
                <p className="seven-stat-label">{s.label}</p>
                <p className="seven-stat-value tabular-nums" style={{ color: s.accent ?? "#fff" }}>
                  {s.value}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      {children}
    </motion.div>
  );
}

export function ModuleLiveBadge({ live, label }: { live?: boolean; label?: string }) {
  return (
    <Badge className="gap-1.5 border-white/20 bg-white/10 font-mono text-[10px] text-white/90 hover:bg-white/15">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          live ? "bg-emerald-400 module-pulse" : "bg-amber-400"
        )}
      />
      {label ?? (live ? "Live" : "Mock")}
    </Badge>
  );
}

export function ModuleCoreBadge({ children = "Core module" }: { children?: ReactNode }) {
  return (
    <Badge className="border-[#6B5CE7]/50 bg-[#6B5CE7]/25 text-white">{children}</Badge>
  );
}
