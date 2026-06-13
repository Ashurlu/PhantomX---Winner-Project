export type Severity = "critical" | "high" | "medium" | "low";

export const SEVERITY_COLORS: Record<Severity | "resolved", string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#EAB308",
  low: "#3B82F6",
  resolved: "#10B981",
};

export const BRAND = {
  background: "#0A0A0F",
  primary: "#8B5CF6", // electric violet
  secondary: "#22D3EE", // cyan
  accent: "#F59E0B", // amber
};
