import type { DetectionIntel } from "@/lib/types";
import type { RangeCode } from "@/store/ui";
import {
  buildRealisticWeeklySeries,
  weeklyAverageFromSeries,
} from "@/lib/detection-weekly-data";

const WEEKLY = buildRealisticWeeklySeries(30);

const BASE: DetectionIntel = {
  totalAlerts: 2847,
  weeklyAverage: weeklyAverageFromSeries(WEEKLY),
  period: "24h",
  categories: [
    { name: "Endpoint", value: 982, color: "#6B5CE7" },
    { name: "Email", value: 712, color: "#4A7FD4" },
    { name: "Identity", value: 468, color: "#B8B0E8" },
    { name: "Cloud", value: 385, color: "#2E8B6A" },
    { name: "Threat Intel", value: 198, color: "#9DC4E0" },
    { name: "Insider Threat", value: 102, color: "#90A4AE" },
  ],
  severities: [
    { name: "Critical", value: 142, color: "#E53935" },
    { name: "High", value: 512, color: "#FF7043" },
    { name: "Medium", value: 1288, color: "#FFC107" },
    { name: "Low", value: 905, color: "#4A7FD4" },
  ],
  sources: [
    { name: "Microsoft Defender", value: 912, pct: 32, tags: "Email, Threat Intel" },
    { name: "SentinelOne", value: 598, pct: 21, tags: "Endpoint" },
    { name: "CrowdStrike", value: 512, pct: 18, tags: "Endpoint, Identity" },
    { name: "Microsoft Sentinel", value: 370, pct: 13, tags: "Cloud, Identity" },
    { name: "Splunk", value: 313, pct: 11, tags: "Various" },
    { name: "AWS GuardDuty", value: 142, pct: 5, tags: "Cloud" },
  ],
  weekly: WEEKLY,
  weeklyLegend: ["CrowdStrike", "Splunk", "Microsoft Defender"],
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
