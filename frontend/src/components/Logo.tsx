import { cn } from "@/lib/utils";

/**
 * PhantomX logo mark — a molecular "X": four node-dumbbells radiating from an
 * amber core. Nodes inherit `currentColor` (white by default); the core is the
 * brand amber. Scales cleanly at any size.
 */
export function PhantomXMark({
  size = 28,
  className,
  core = "#F59E0B",
}: {
  size?: number;
  className?: string;
  core?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* connecting bars */}
      <g stroke="currentColor" strokeWidth="9" strokeLinecap="round">
        <line x1="62.7" y1="37.3" x2="78.3" y2="21.7" />
        <line x1="37.3" y1="37.3" x2="21.7" y2="21.7" />
        <line x1="62.7" y1="62.7" x2="78.3" y2="78.3" />
        <line x1="37.3" y1="62.7" x2="21.7" y2="78.3" />
      </g>
      {/* inner + outer nodes */}
      <g fill="currentColor">
        <circle cx="62.7" cy="37.3" r="8.6" />
        <circle cx="37.3" cy="37.3" r="8.6" />
        <circle cx="62.7" cy="62.7" r="8.6" />
        <circle cx="37.3" cy="62.7" r="8.6" />
        <circle cx="78.3" cy="21.7" r="7" />
        <circle cx="21.7" cy="21.7" r="7" />
        <circle cx="78.3" cy="78.3" r="7" />
        <circle cx="21.7" cy="78.3" r="7" />
      </g>
      {/* amber core */}
      <circle cx="50" cy="50" r="8.2" fill={core} />
    </svg>
  );
}

/**
 * Full PhantomX wordmark: "PHANTOM" + the X mark (mark substitutes the X), to
 * match the brand logo. The mark inherits the surrounding text color.
 */
export function PhantomXLogo({
  markSize = 24,
  className,
}: {
  markSize?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-display font-bold tracking-[0.16em] text-foreground",
        className
      )}
    >
      <span>PHANTOM</span>
      <PhantomXMark size={markSize} className="ml-1" />
    </span>
  );
}
