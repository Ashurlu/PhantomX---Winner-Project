import { type ReactNode, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AnimatedShaderHero } from "@/components/ui/animated-shader-hero";
import { prefersReducedMotion } from "@/lib/utils";

function RadarHud() {
  const reduced = prefersReducedMotion();
  if (reduced) return null;
  return (
    <svg
      className="pointer-events-none absolute right-[8%] top-[18%] h-48 w-48 opacity-30 md:h-64 md:w-64 lg:right-[12%]"
      viewBox="0 0 200 200"
      aria-hidden
    >
      <circle cx="100" cy="100" r="88" fill="none" stroke="hsl(243 80% 70% / 0.25)" strokeWidth="0.5" />
      <circle cx="100" cy="100" r="66" fill="none" stroke="hsl(243 80% 70% / 0.18)" strokeWidth="0.5" />
      <circle cx="100" cy="100" r="44" fill="none" stroke="hsl(243 80% 70% / 0.12)" strokeWidth="0.5" />
      <line x1="100" y1="12" x2="100" y2="188" stroke="hsl(243 80% 70% / 0.15)" strokeWidth="0.5" />
      <line x1="12" y1="100" x2="188" y2="100" stroke="hsl(243 80% 70% / 0.15)" strokeWidth="0.5" />
      <g style={{ transformOrigin: "100px 100px", animation: "auth-radar-sweep 6s linear infinite" }}>
        <path d="M100 100 L100 14 A86 86 0 0 1 172 58 Z" fill="url(#radarGrad)" opacity="0.5" />
      </g>
      <circle cx="100" cy="100" r="3" fill="hsl(186 100% 50%)" />
      <defs>
        <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(186 100% 50% / 0.5)" />
          <stop offset="100%" stopColor="hsl(186 100% 50% / 0)" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function BinaryRain() {
  const reduced = prefersReducedMotion();
  if (reduced) return null;
  const cols = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    delay: i * 0.4,
    chars: Array.from({ length: 24 }, () => (Math.random() > 0.5 ? "1" : "0")).join(""),
  }));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40" aria-hidden>
      <div className="flex h-full justify-around px-4">
        {cols.map((c) => (
          <span
            key={c.id}
            className="auth-binary-col"
            style={{ animationDelay: `${c.delay}s` }}
          >
            {c.chars}
          </span>
        ))}
      </div>
    </div>
  );
}

function EqBars() {
  const reduced = prefersReducedMotion();
  if (reduced) return null;
  return (
    <div className="flex h-8 items-end gap-0.5" aria-hidden>
      {[0.1, 0.3, 0.15, 0.5, 0.25, 0.7, 0.4, 0.55, 0.2, 0.65, 0.35, 0.8].map((d, i) => (
        <div
          key={i}
          className="auth-eq-bar w-1 rounded-sm bg-violet-400/70"
          style={{ height: `${20 + d * 80}%`, animationDelay: `${i * 0.08}s` }}
        />
      ))}
    </div>
  );
}

const TICKER = [
  "AI COURT ONLINE",
  "SOC ASSISTANT READY",
  "2,847 ALERTS / 24H",
  "18 INCIDENTS TRACKED",
  "MITRE ATT&CK LAYER SYNCED",
  "N8N TRIAGE PIPELINE ACTIVE",
  "ZERO TRUST GATE ENABLED",
];

export function AuthCinematicShell({ children }: { children: ReactNode }) {
  const reduced = prefersReducedMotion();
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      setTime(new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC");
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="auth-scanlines relative min-h-screen w-full overflow-hidden bg-[#050508] text-white">
      <div className="absolute inset-0">
        <AnimatedShaderHero />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_20%_0%,hsl(243_80%_50%/0.22),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_90%_100%,hsl(186_100%_45%/0.12),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#050508]/60 to-[#050508]" />

      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-[45vh] opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(hsl(243 80% 70% / 0.35) 1px, transparent 1px), linear-gradient(90deg, hsl(243 80% 70% / 0.35) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          transform: "perspective(500px) rotateX(68deg)",
          transformOrigin: "center bottom",
          maskImage: "linear-gradient(to top, black, transparent)",
        }}
        aria-hidden
      />

      <BinaryRain />
      <RadarHud />
      {!reduced && <div className="auth-scan-beam" />}

      <div className="relative z-20 border-b border-white/5 bg-black/30 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-white/45 md:px-8 md:text-xs">
          <span className="flex items-center gap-2 text-emerald-400/90">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Secure uplink
          </span>
          <span className="hidden font-mono text-cyan-400/70 sm:inline">{time}</span>
          <EqBars />
        </div>
        <div className="overflow-hidden border-t border-white/5 py-1.5">
          <div className="auth-marquee-track gap-12 px-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-violet-400/50">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={`${t}-${i}`} className="whitespace-nowrap">
                ◆ {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function AuthTiltCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = prefersReducedMotion();
  const [transform, setTransform] = useState("perspective(1200px) rotateX(0deg) rotateY(0deg)");

  const onMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTransform(
      `perspective(1200px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) scale3d(1.02,1.02,1.02)`
    );
  };

  const onLeave = () => {
    setTransform("perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)");
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={{ transform, transition: "transform 0.15s ease-out" }}
      className={`relative ${className}`}
    >
      <div className="auth-spin-border rounded-2xl" />
      <div className="auth-hud-bracket relative z-10 overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-[0_0_80px_hsl(243_80%_50%/0.15),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />
        <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -bottom-16 -right-16 h-36 w-36 rounded-full bg-cyan-500/15 blur-3xl" />
        {children}
      </div>
    </motion.div>
  );
}
