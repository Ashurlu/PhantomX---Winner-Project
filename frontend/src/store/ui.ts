import { create } from "zustand";

export type TimeRange = "Last 24H" | "Last 7D" | "Last 30D";
export type RangeCode = "24h" | "7d" | "30d";

/** Map the human label to the backend range code. */
export function rangeCode(t: TimeRange): RangeCode {
  return t === "Last 7D" ? "7d" : t === "Last 30D" ? "30d" : "24h";
}

interface UiState {
  timeRange: TimeRange;
  setTimeRange: (t: TimeRange) => void;
}

export const useUi = create<UiState>((set) => ({
  timeRange: "Last 24H",
  setTimeRange: (timeRange) => set({ timeRange }),
}));
