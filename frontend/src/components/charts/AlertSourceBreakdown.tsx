import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { DetectionSource } from "@/lib/types";
import { cn } from "@/lib/utils";

type SubAlert = { title: string; count: number; pct: number };

const SUB_ALERTS: Record<string, SubAlert[]> = {
  "Microsoft Defender": [
    { title: "Email reported by user as malware", count: 378, pct: 41 },
    { title: "Suspicious PowerShell execution", count: 142, pct: 16 },
    { title: "Malware - Roblox.exe", count: 72, pct: 8 },
    { title: "Phishing link clicked", count: 82, pct: 9 },
  ],
  SentinelOne: [
    { title: "Ransomware activity detected", count: 124, pct: 21 },
    { title: "Endpoint exploit attempt", count: 98, pct: 16 },
    { title: "Tampering with AV service", count: 52, pct: 9 },
  ],
  CrowdStrike: [
    { title: "Malicious file quarantined", count: 76, pct: 15 },
    { title: "C2 beacon detected", count: 48, pct: 9 },
    { title: "Identity anomaly", count: 88, pct: 17 },
  ],
};

export function AlertSourceBreakdown({
  sources,
  total,
}: {
  sources: DetectionSource[];
  total: number;
}) {
  const [open, setOpen] = useState<string | null>(sources[0]?.name ?? null);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border pb-3">
        <p className="text-sm font-semibold text-foreground">All Alert / All Sources</p>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{total.toLocaleString()} Alerts</span>
          <span className="font-semibold tabular-nums">100%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-foreground"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="mt-3 flex-1 space-y-1 overflow-y-auto pr-1">
        {sources.map((s) => {
          const expanded = open === s.name;
          const subs = SUB_ALERTS[s.name];
          return (
            <div key={s.name} className="rounded-lg border border-transparent hover:border-border/60">
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : s.name)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-muted/40"
              >
                {subs ? (
                  expanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )
                ) : (
                  <span className="w-4" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-foreground">{s.name}</span>
                  <span className="ml-1 text-xs text-muted-foreground">{s.tags}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {s.value.toLocaleString()}
                </span>
                <span className="w-10 shrink-0 text-right text-xs font-semibold">{s.pct}%</span>
              </button>
              <div className="mx-2 mb-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full rounded-full bg-foreground/80"
                  initial={{ width: 0 }}
                  animate={{ width: `${s.pct}%` }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                />
              </div>
              <AnimatePresence>
                {expanded && subs && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {subs.map((sub) => (
                      <div
                        key={sub.title}
                        className="flex items-center gap-2 border-t border-border/40 px-2 py-2 pl-8 text-xs"
                      >
                        <span className="min-w-0 flex-1 text-muted-foreground">{sub.title}</span>
                        <span className="tabular-nums text-foreground">{sub.count}</span>
                        <span className="w-8 text-right font-semibold">{sub.pct}%</span>
                        <div className="h-1 w-16 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-muted-foreground/60"
                            style={{ width: `${sub.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
