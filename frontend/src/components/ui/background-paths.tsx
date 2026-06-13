import { motion } from "framer-motion";
import { prefersReducedMotion } from "@/lib/utils";

/** Ambient animated SVG paths behind hero sections / empty states. */
function Paths({ position }: { position: number }) {
  const paths = Array.from({ length: 24 }, (_, i) => {
    const offset = i * 6 * position;
    return {
      id: i,
      d: `M-${380 - offset} -${189 + i * 7}C-${380 - offset} -${189 + i * 7} -${
        312 - offset
      } ${216 - i * 7} ${152 - offset} ${343 - i * 7}C${616 - offset} ${
        470 - i * 7
      } ${684 - offset} ${875 - i * 7} ${684 - offset} ${875 - i * 7}`,
      opacity: 0.08 + i * 0.02,
      width: 0.5 + i * 0.05,
    };
  });

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full text-primary"
      viewBox="0 0 696 690"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
    >
      {paths.map((path) => (
        <motion.path
          key={path.id}
          d={path.d}
          stroke="currentColor"
          strokeWidth={path.width}
          strokeOpacity={path.opacity}
          initial={{ pathLength: 0.3, opacity: 0.4 }}
          animate={
            prefersReducedMotion()
              ? { pathLength: 1, opacity: path.opacity }
              : {
                  pathLength: 1,
                  opacity: [0.2, 0.5, 0.2],
                  pathOffset: [0, 1, 0],
                }
          }
          transition={{
            duration: 18 + Math.random() * 12,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </svg>
  );
}

export function BackgroundPaths({ className }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}>
      <Paths position={1} />
      <Paths position={-1} />
    </div>
  );
}

export default BackgroundPaths;
