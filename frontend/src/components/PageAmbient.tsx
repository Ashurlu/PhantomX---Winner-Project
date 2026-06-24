import { motion } from "framer-motion";
import { prefersReducedMotion } from "@/lib/utils";

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: `${(i * 17 + 7) % 96}%`,
  top: `${(i * 23 + 13) % 94}%`,
  size: 2 + (i % 4),
  delay: i * 0.22,
  duration: 14 + (i % 10),
}));

/** Animated mesh behind app content — 7AI light canvas with expressive motion */
export function PageAmbient() {
  if (prefersReducedMotion()) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <motion.div
        className="ambient-aurora"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="ambient-orb ambient-orb-a"
        animate={{
          x: [0, 60, -35, 20, 0],
          y: [0, -45, 30, -15, 0],
          scale: [1, 1.12, 0.9, 1.05, 1],
        }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="ambient-orb ambient-orb-b"
        animate={{
          x: [0, -70, 45, -20, 0],
          y: [0, 55, -40, 25, 0],
          scale: [1, 0.88, 1.1, 0.95, 1],
        }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="ambient-orb ambient-orb-c"
        animate={{
          x: [0, 40, -55, 30, 0],
          y: [0, 65, -30, 40, 0],
          opacity: [0.35, 0.55, 0.4, 0.5, 0.35],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="ambient-orb ambient-orb-d"
        animate={{
          x: [0, -30, 50, 0],
          y: [0, -20, 35, 0],
          scale: [0.8, 1.2, 0.9, 0.8],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      {PARTICLES.map((p) => (
        <motion.span
          key={p.id}
          className="ambient-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -18, 8, -12, 0],
            x: [0, 6, -8, 4, 0],
            opacity: [0.15, 0.55, 0.25, 0.45, 0.15],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        />
      ))}
      <div className="ambient-grid" />
    </div>
  );
}
