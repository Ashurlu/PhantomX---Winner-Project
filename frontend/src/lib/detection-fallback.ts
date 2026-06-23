import type { DetectionIntel } from "@/lib/types";
import type { RangeCode } from "@/store/ui";

const BASE: DetectionIntel = {
  totalAlerts: 2847,
  weeklyAverage: 118,
  period: "24h",
  categories: [
    { name: "Endpoint", value: 982, color: "#ec4899" },
    { name: "Email", value: 712, color: "#3b82f6" },
    { name: "Identity", value: 468, color: "#6366f1" },
    { name: "Cloud", value: 385, color: "#06b6d4" },
    { name: "Threat Intel", value: 198, color: "#14b8a6" },
    { name: "Insider Threat", value: 102, color: "#94a3b8" },
  ],
  severities: [
    { name: "Critical", value: 142, color: "#dc2626" },
    { name: "High", value: 512, color: "#f97316" },
    { name: "Medium", value: 1288, color: "#f59e0b" },
    { name: "Low", value: 905, color: "#3B82F6" },
  ],
  sources: [
    { name: "Microsoft Defender", value: 912, pct: 32, tags: "Email, Threat Intel" },
    { name: "SentinelOne", value: 598, pct: 21, tags: "Endpoint" },
    { name: "CrowdStrike", value: 512, pct: 18, tags: "Endpoint, Identity" },
    { name: "Microsoft Sentinel", value: 370, pct: 13, tags: "Cloud, Identity" },
    { name: "Splunk", value: 313, pct: 11, tags: "Various" },
    { name: "AWS GuardDuty", value: 142, pct: 5, tags: "Cloud" },
  ],
  weekly: Array.from({ length: 30 }, (_, i) => {
    const d = i + 1;
    return { day: d, a: 45 + (d % 7) * 3, b: 38 + (d % 5) * 2, c: 28 + (d % 4) };
  }),
  weeklyLegend: ["CrowdStrike", "Splunk", "Microsoft Defender", "Sumo Logic", "Other"],
};

const RANGE_FACTORS: Record<RangeCode, number> = {
  "15m": 15 / (24 * 60),
  "1h": 1 / 24,
  "24h": 1,
  "7d": 6.6,
  "30d": 27,
  "90d": 81,
};

/** Client-side fallback when the BFF detection route is unavailable (e.g. stale backend). */
export function detectionFallback(range: RangeCode): DetectionIntel {
  const f = RANGE_FACTORS[range] ?? 1;
  const s = (n: number) => Math.round(n * f);
  return {
    ...BASE,
    period: range,
    totalAlerts: s(BASE.totalAlerts),
    weeklyAverage: s(BASE.weeklyAverage),
    categories: BASE.categories.map((c) => ({ ...c, value: s(c.value) })),
    severities: BASE.severities.map((c) => ({ ...c, value: s(c.value) })),
    sources: BASE.sources.map((c) => ({ ...c, value: s(c.value) })),
    weekly: BASE.weekly.map((w) => ({ ...w, a: s(w.a), b: s(w.b), c: s(w.c) })),
  };
}
