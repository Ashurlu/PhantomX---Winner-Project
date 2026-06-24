import type { DetectionWeeklyBar } from "@/lib/types";

/** Realistic daily alert volume — weekends lower, occasional spikes, shifting source mix. */
export function buildRealisticWeeklySeries(days = 30): DetectionWeeklyBar[] {
  const profile: [number, number, number, number][] = [
    [98, 34, 28, 36],
    [112, 41, 30, 41],
    [89, 30, 26, 33],
    [105, 37, 29, 39],
    [121, 48, 32, 41],
    [74, 26, 22, 26],
    [68, 23, 19, 26],
    [128, 46, 38, 44],
    [101, 34, 30, 37],
    [94, 32, 27, 35],
    [109, 38, 31, 40],
    [162, 52, 58, 52],
    [82, 28, 24, 30],
    [71, 24, 20, 27],
    [103, 36, 29, 38],
    [116, 42, 34, 40],
    [98, 33, 28, 37],
    [108, 37, 30, 41],
    [148, 68, 35, 45],
    [79, 27, 23, 29],
    [65, 22, 18, 25],
    [99, 33, 29, 37],
    [107, 38, 32, 37],
    [131, 44, 48, 39],
    [96, 32, 28, 36],
    [58, 19, 17, 22],
    [72, 25, 21, 26],
    [69, 23, 19, 27],
    [100, 34, 29, 37],
    [106, 37, 31, 38],
  ];

  return profile.slice(0, days).map(([total, a, b, c], i) => ({
    day: i + 1,
    a,
    b,
    c: c ?? total - a - b,
  }));
}

export function weeklyAverageFromSeries(rows: DetectionWeeklyBar[]): number {
  if (rows.length === 0) return 0;
  const sum = rows.reduce((s, r) => s + r.a + r.b + r.c, 0);
  return Math.round(sum / rows.length);
}

/** Pick bar count for the selected analytics window. */
export function sliceWeeklyForPeriod(
  weekly: DetectionWeeklyBar[],
  period: string
): DetectionWeeklyBar[] {
  const n = period === "7d" ? 7 : period === "30d" || period === "90d" ? weekly.length : 14;
  return weekly.slice(-Math.min(n, weekly.length));
}
