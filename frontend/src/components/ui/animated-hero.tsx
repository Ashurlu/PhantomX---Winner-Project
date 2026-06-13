import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/** Rotating-word hero, e.g. "SENTRIX detects / hunts / responds". */
export function AnimatedHero({
  prefix = "SENTRIX",
  words = ["detects", "hunts", "adjudicates", "responds"],
}: {
  prefix?: string;
  words?: string[];
}) {
  const [index, setIndex] = useState(0);
  const list = useMemo(() => words, [words]);

  useEffect(() => {
    const t = setInterval(
      () => setIndex((i) => (i + 1) % list.length),
      2200
    );
    return () => clearInterval(t);
  }, [list.length]);

  return (
    <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
      <span className="text-foreground">{prefix} </span>
      <span className="relative inline-flex h-[1.2em] overflow-hidden align-bottom">
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            initial={{ y: "100%", opacity: 0, rotateX: -40 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            exit={{ y: "-100%", opacity: 0, rotateX: 40 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
          >
            {list[index]}
          </motion.span>
        </AnimatePresence>
      </span>
    </h1>
  );
}

export default AnimatedHero;
