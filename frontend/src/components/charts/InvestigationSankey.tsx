import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  SANKEY_COLUMNS,
  type SankeyLink,
  type SankeyNode,
} from "@/data/investigation-sankey";
import { cn, prefersReducedMotion } from "@/lib/utils";

const W = 960;
const H = 380;
const COL_W = W / (SANKEY_COLUMNS.length + 0.5);
const PAD = 14;
const PILL_H = 28;
const COUNT_GAP = 10;

function pillWidth(label: string) {
  return Math.min(124, Math.max(78, label.length * 5.6 + 18));
}

function pillLabelColor(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return "#1a1a1a";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? "#1a1a1a" : "#ffffff";
}

function nodePos(n: SankeyNode, maxRow: number) {
  const x = n.column * COL_W + 6;
  const rowH = (H - PAD * 2) / (maxRow + 1);
  const w = pillWidth(n.label);
  const y = PAD + n.row * rowH + 6;
  const flowH = Math.max(14, Math.min(42, n.value * 0.5));
  return { x, y, w, h: PILL_H, flowH, cx: x + w / 2, countY: y + PILL_H + COUNT_GAP };
}

function linkPath(
  sx: number,
  sy: number,
  sh: number,
  tx: number,
  ty: number,
  th: number
) {
  const x1 = sx;
  const x2 = tx;
  const cpx = (x1 + x2) / 2;
  return `M ${x1} ${sy} C ${cpx} ${sy}, ${cpx} ${ty}, ${x2} ${ty} L ${x2} ${ty + th} C ${cpx} ${ty + th}, ${cpx} ${sy + sh}, ${x1} ${sy + sh} Z`;
}

export function InvestigationSankey({
  className,
  nodes,
  links,
}: {
  className?: string;
  nodes: SankeyNode[];
  links: SankeyLink[];
}) {
  const reduced = prefersReducedMotion();
  const [hover, setHover] = useState<string | null>(null);
  const nodeMap = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);
  const maxRow = useMemo(() => Math.max(...nodes.map((n) => n.row), 0), [nodes]);
  const maxLinkValue = useMemo(() => Math.max(...links.map((l) => l.value), 1), [links]);

  const connected = useMemo(() => {
    if (!hover) return null;
    const ids = new Set<string>([hover]);
    links.forEach((l) => {
      if (l.source === hover) ids.add(l.target);
      if (l.target === hover) ids.add(l.source);
    });
    return ids;
  }, [hover, links]);

  return (
    <div className={cn("relative w-full overflow-x-auto", className)}>
      <div className="mb-3 flex min-w-[760px] justify-between px-2">
        {SANKEY_COLUMNS.map((col, i) => (
          <span
            key={col}
            className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            style={{ width: COL_W, textAlign: i === 0 ? "left" : "center" }}
          >
            {col}
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="min-w-[760px] w-full"
        role="img"
        aria-label="Investigation pipeline flow"
      >
        <defs>
          {links.map((l, i) => (
            <linearGradient key={i} id={`sg-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={l.color ?? "#9DC4E0"} stopOpacity={0.55} />
              <stop offset="100%" stopColor={l.color ?? "#9DC4E0"} stopOpacity={0.35} />
            </linearGradient>
          ))}
        </defs>

        {links.map((l, i) => {
          const s = nodeMap[l.source];
          const t = nodeMap[l.target];
          if (!s || !t) return null;
          const sp = nodePos(s, maxRow);
          const tp = nodePos(t, maxRow);
          const bandH = Math.max(5, (l.value / maxLinkValue) * 30);
          const sy = sp.y + sp.h / 2 - bandH / 2;
          const ty = tp.y + tp.h / 2 - bandH / 2;
          const dimmed = connected && !connected.has(l.source) && !connected.has(l.target);
          return (
            <motion.path
              key={`${l.source}-${l.target}-${i}`}
              d={linkPath(sp.x + sp.w, sy, bandH, tp.x, ty, bandH)}
              fill={`url(#sg-${i})`}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: dimmed ? 0.08 : 1 }}
              transition={{ delay: 0.15 + i * 0.02, duration: 0.5 }}
              className="transition-opacity duration-200"
            />
          );
        })}

        {nodes.map((n, i) => {
          const p = nodePos(n, maxRow);
          const dimmed = connected && !connected.has(n.id);
          const active = hover === n.id;
          const fill = n.color ?? "#9DC4E0";
          const labelColor = pillLabelColor(fill);

          return (
            <g
              key={n.id}
              onMouseEnter={() => setHover(n.id)}
              onMouseLeave={() => setHover(null)}
              className="cursor-pointer"
            >
              <motion.rect
                x={p.x}
                y={p.y}
                width={p.w}
                height={p.h}
                rx={7}
                fill={fill}
                initial={reduced ? false : { scaleX: 0.6, opacity: 0 }}
                animate={{
                  scaleX: 1,
                  opacity: dimmed ? 0.3 : 1,
                }}
                style={{ transformOrigin: `${p.x}px ${p.y + p.h / 2}px` }}
                transition={{ delay: 0.1 + i * 0.03, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                stroke={active ? "#111827" : "rgba(255,255,255,0.35)"}
                strokeWidth={active ? 2 : 1}
              />
              <text
                x={p.cx}
                y={p.y + p.h / 2 + 4}
                textAnchor="middle"
                fill={labelColor}
                fontSize={10}
                fontWeight={600}
                opacity={dimmed ? 0.4 : 1}
              >
                {n.label}
              </text>
              <text
                x={p.cx}
                y={p.countY + 12}
                textAnchor="middle"
                className="fill-foreground"
                fontSize={14}
                fontWeight={700}
                opacity={dimmed ? 0.35 : 1}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {n.value.toLocaleString()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
