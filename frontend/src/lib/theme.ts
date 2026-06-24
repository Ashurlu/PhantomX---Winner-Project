export type Severity = "critical" | "high" | "medium" | "low";

export const SEVERITY_COLORS: Record<Severity | "resolved", string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#EAB308",
  low: "#3B82F6",
  resolved: "#10B981",
};

export const BRAND = {
  background: "#F8F8FA",
  primary: "#111111",
  accent: "#6B5CE7",
  secondary: "#2E8B6A",
  chart: "#6B5CE7",
};
