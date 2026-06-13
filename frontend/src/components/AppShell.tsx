import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { SideRail } from "./SideRail";
import { TopBar } from "./TopBar";
import { prefersReducedMotion } from "@/lib/utils";

const TITLES: Record<string, string> = {
  "/overview": "Overview",
  "/ai-court": "AI Court",
  "/rules": "Recommended Rules",
  "/pentest": "AGI Pentest",
  "/admin": "Admin Console",
};

export function AppShell() {
  const location = useLocation();
  const outlet = useOutlet();
  const reduced = prefersReducedMotion();

  const base = "/" + location.pathname.split("/")[1];
  const title = TITLES[base] ?? "SENTRIX";

  return (
    <div className="flex h-screen w-screen overflow-hidden grid-bg">
      <SideRail />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <TopBar title={title} />
        <main className="relative flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={
                reduced
                  ? { opacity: 0 }
                  : { opacity: 0, y: 16, rotateX: 4, transformPerspective: 1200 }
              }
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-[1500px] px-6 py-6"
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
