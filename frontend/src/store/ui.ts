import { create } from "zustand";
import { MS, TIME_PRESETS, presetIdFromWindow, type TimePresetId } from "@/lib/time-range";

export type TimeRange = "Last 24H" | "Last 7D" | "Last 30D";
export type RangeCode = TimePresetId;

const STORAGE_KEY = "phantomx-time-window";

const LEGACY_TO_PRESET: Record<TimeRange, TimePresetId> = {
  "Last 24H": "24h",
  "Last 7D": "7d",
  "Last 30D": "30d",
};

const PRESET_TO_LEGACY: Record<TimePresetId, TimeRange | null> = {
  "15m": null,
  "1h": null,
  "24h": "Last 24H",
  "7d": "Last 7D",
  "30d": "Last 30D",
  "90d": null,
};

function presetWindow(id: TimePresetId, to = Date.now()) {
  const preset = TIME_PRESETS.find((p) => p.id === id)!;
  return { from: to - preset.ms, to };
}

function loadPersistedWindow() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return presetWindow("24h");
    const p = JSON.parse(raw) as { from?: number; to?: number };
    if (typeof p.from === "number" && typeof p.to === "number" && p.to > p.from) {
      return { from: p.from, to: p.to };
    }
  } catch {
    /* ignore */
  }
  return presetWindow("24h");
}

function persistWindow(from: number, to: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ from, to }));
  } catch {
    /* ignore */
  }
}

function chartViewportForPreset(id: TimePresetId, from: number, to: number) {
  if (id === "15m" || id === "1h") return { chartFrom: to - MS.H24, chartTo: to };
  if (id === "24h") return { chartFrom: to - MS.D7, chartTo: to };
  return { chartFrom: from, chartTo: to };
}

/** Map the human label to the backend range code (legacy). */
export function rangeCode(t: TimeRange): RangeCode {
  return t === "Last 7D" ? "7d" : t === "Last 30D" ? "30d" : "24h";
}

export function rangeCodeFromTimestamps(from: number, to: number): RangeCode {
  return presetIdFromWindow(from, to);
}

interface UiState {
  timeFrom: number;
  timeTo: number;
  chartFrom: number;
  chartTo: number;
  timeRange: TimeRange;
  autoRefresh: boolean;
  setTimeWindow: (from: number, to: number) => void;
  setChartViewport: (from: number, to: number) => void;
  applyPreset: (id: TimePresetId) => void;
  setTimeRange: (t: TimeRange) => void;
  setAutoRefresh: (on: boolean) => void;
  slideWindowToNow: () => void;
}

const boot = loadPersistedWindow();

export const useUi = create<UiState>((set, get) => ({
  timeFrom: boot.from,
  timeTo: boot.to,
  chartFrom: boot.to - MS.D7,
  chartTo: boot.to,
  timeRange: inferLegacyRange(boot.from, boot.to),
  autoRefresh: true,
  setTimeWindow: (from, to) => {
    const safeTo = Math.max(to, from + MS.M15);
    persistWindow(from, safeTo);
    set({
      timeFrom: from,
      timeTo: safeTo,
      timeRange: inferLegacyRange(from, safeTo),
    });
  },
  setChartViewport: (from, to) =>
    set({ chartFrom: from, chartTo: Math.max(to, from + MS.M15) }),
  applyPreset: (id) => {
    const { from, to } = presetWindow(id);
    const vp = chartViewportForPreset(id, from, to);
    persistWindow(from, to);
    set({
      timeFrom: from,
      timeTo: to,
      ...vp,
      chartFrom: Math.min(vp.chartFrom, from),
      timeRange: PRESET_TO_LEGACY[id] ?? inferLegacyRange(from, to),
    });
  },
  setTimeRange: (timeRange) => {
    const id = LEGACY_TO_PRESET[timeRange];
    const { from, to } = presetWindow(id);
    const vp = chartViewportForPreset(id, from, to);
    persistWindow(from, to);
    set({ timeRange, timeFrom: from, timeTo: to, ...vp });
  },
  setAutoRefresh: (autoRefresh) => set({ autoRefresh }),
  slideWindowToNow: () => {
    const { timeFrom, timeTo } = get();
    const span = timeTo - timeFrom;
    const to = Date.now();
    const from = to - span;
    persistWindow(from, to);
    set({ timeFrom: from, timeTo: to, chartTo: to });
  },
}));

function inferLegacyRange(from: number, to: number): TimeRange {
  const code = rangeCodeFromTimestamps(from, to);
  return code === "7d" ? "Last 7D" : code === "30d" ? "Last 30D" : "Last 24H";
}
