import { cn } from "@/lib/utils";
import { SEVERITY_COLORS, type Severity } from "@/lib/theme";

export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity | "resolved";
  className?: string;
}) {
  const color = SEVERITY_COLORS[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        className
      )}
      style={{
        color,
        background: `color-mix(in srgb, ${color} 16%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      {severity}
    </span>
  );
}
