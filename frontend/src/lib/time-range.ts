import type { RangeCode } from "@/store/ui";

export const MS = {
  M15: 15 * 60 * 1000,
  H1: 60 * 60 * 1000,
  H24: 24 * 60 * 60 * 1000,
  D7: 7 * 24 * 60 * 60 * 1000,
  D30: 30 * 24 * 60 * 60 * 1000,
  D90: 90 * 24 * 60 * 60 * 1000,
} as const;

export type TimePresetId = "15m" | "1h" | "24h" | "7d" | "30d" | "90d";

export const TIME_PRESETS: { id: TimePresetId; label: string; ms: number }[] = [
  { id: "15m", label: "Last 15 minutes", ms: MS.M15 },
  { id: "1h", label: "Last 1 hour", ms: MS.H1 },
  { id: "24h", label: "Last 24 hours", ms: MS.H24 },
  { id: "7d", label: "Last 7 days", ms: MS.D7 },
  { id: "30d", label: "Last 30 days", ms: MS.D30 },
  { id: "90d", label: "Last 90 days", ms: MS.D90 },
];

export type AlertBucket = {
  index: number;
  t0: number;
  t1: number;
  label: string;
  alerts: number;
};

/** Stable pseudo-random alert counts for the timeline histogram. */
export function generateAlertBuckets(from: number, to: number, count = 72): AlertBucket[] {
  const span = Math.max(to - from, MS.M15);
  const step = span / count;
  return Array.from({ length: count }, (_, i) => {
    const t0 = from + i * step;
    const t1 = from + (i + 1) * step;
    const seed = Math.abs(Math.sin(i * 2.17 + from / 8.64e7) * 43758.5453) % 1;
    const wave = Math.sin(i * 0.42) * 0.35 + 0.65;
    const alerts = Math.round(12 + seed * 160 * wave);
    const showDate = span > MS.D7;
    const label = showDate
      ? new Date(t0).toLocaleDateString([], { month: "short", day: "numeric" })
      : new Date(t0).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return { index: i, t0, t1, label, alerts };
  });
}

/** Match the selected window to the closest time preset (same logic as formatTimeRangeShort). */
export function presetIdFromWindow(from: number, to: number): TimePresetId {
  const diff = to - from;
  const tol = 1.08;
  for (const p of TIME_PRESETS) {
    if (diff <= p.ms * tol) return p.id;
  }
  return "90d";
}

export function rangeCodeFromWindow(from: number, to: number): RangeCode {
  return presetIdFromWindow(from, to);
}

export function formatDateTimeLocal(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function parseDateTimeLocal(value: string): number | null {
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function formatTimeRangeLabel(from: number, to: number): string {
  const sameDay = new Date(from).toDateString() === new Date(to).toDateString();
  const opts: Intl.DateTimeFormatOptions = sameDay
    ? { hour: "2-digit", minute: "2-digit" }
    : { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
  const fmt = (ms: number) => new Date(ms).toLocaleString([], opts);
  return `${fmt(from)} → ${fmt(to)}`;
}

export function formatTimeRangeShort(from: number, to: number): string {
  const diff = to - from;
  const tol = 1.08;
  for (const p of TIME_PRESETS) {
    if (diff <= p.ms * tol) {
      const short: Record<TimePresetId, string> = {
        "15m": "Last 15M",
        "1h": "Last 1H",
        "24h": "Last 24H",
        "7d": "Last 7D",
        "30d": "Last 30D",
        "90d": "Last 90D",
      };
      return short[p.id];
    }
  }
  return formatTimeRangeLabel(from, to);
}

export function bucketIndicesForWindow(
  buckets: AlertBucket[],
  from: number,
  to: number
): { start: number; end: number } {
  if (!buckets.length) return { start: 0, end: 0 };
  let start = 0;
  let end = buckets.length - 1;
  for (let i = 0; i < buckets.length; i++) {
    if (buckets[i].t1 > from) {
      start = i;
      break;
    }
  }
  for (let i = buckets.length - 1; i >= 0; i--) {
    if (buckets[i].t0 < to) {
      end = i;
      break;
    }
  }
  return { start: Math.min(start, end), end: Math.max(start, end) };
}

export function windowFromBucketIndices(
  buckets: AlertBucket[],
  start: number,
  end: number
): { from: number; to: number } {
  const s = buckets[Math.max(0, Math.min(start, buckets.length - 1))];
  const e = buckets[Math.max(0, Math.min(end, buckets.length - 1))];
  return { from: s.t0, to: e.t1 };
}
