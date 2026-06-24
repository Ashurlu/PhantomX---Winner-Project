import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DisplayCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  meta?: string;
  accent?: string; // hsl/hex
  onClick?: () => void;
  className?: string;
}

/** Skewed stacked card — module shortcuts / AI Court case cards. */
export function DisplayCard({
  icon: Icon,
  title,
  description,
  meta,
  accent = "hsl(var(--primary))",
  onClick,
  className,
}: DisplayCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex w-full flex-col gap-2 overflow-hidden rounded-xl border border-border/60 bg-card p-5 text-left shadow-sm transition-all duration-300",
        "hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_18px_50px_-12px_hsl(var(--primary)/0.45)]",
        className
      )}
    >
      <div
        className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ background: accent }}
      />
      <div
        className="flex h-11 w-11 items-center justify-center rounded-lg"
        style={{ background: `color-mix(in srgb, ${accent} 18%, transparent)` }}
      >
        <Icon className="h-5 w-5" style={{ color: accent }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-display text-base font-semibold">{title}</span>
        {meta && (
          <span className="font-mono text-xs text-muted-foreground">{meta}</span>
        )}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </button>
  );
}

export function DisplayCards({
  cards,
  className,
}: {
  cards: DisplayCardProps[];
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {cards.map((c, i) => (
        <DisplayCard key={i} {...c} />
      ))}
    </div>
  );
}

export default DisplayCards;
