import { useEffect } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { TopNav } from "./TopNav";
import { SocChatbot } from "./SocChatbot";
import { useProfile } from "@/lib/api";
import { resolveAvatarUrl } from "@/lib/avatars";
import { prefersReducedMotion } from "@/lib/utils";
import { useAuth } from "@/store/auth";

export function AppShell() {
  const location = useLocation();
  const outlet = useOutlet();
  const reduced = prefersReducedMotion();
  const profile = useProfile();
  const setAvatarUrl = useAuth((s) => s.setAvatarUrl);
  const setUsername = useAuth((s) => s.setUsername);

  useEffect(() => {
    if (profile.data) {
      setAvatarUrl(resolveAvatarUrl(profile.data.avatarUrl));
      setUsername(profile.data.username);
    }
  }, [profile.data, setAvatarUrl, setUsername]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <TopNav />
      <main className="relative flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-[1680px] px-6 py-6 pb-24 md:px-8 md:py-8 md:pb-28"
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>
      <SocChatbot />
    </div>
  );
}
