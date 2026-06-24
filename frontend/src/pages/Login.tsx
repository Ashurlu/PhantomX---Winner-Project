import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Fingerprint,
  Gavel,
  Loader2,
  Lock,
  Radar,
  Shield,
  User,
  UserCog,
  Zap,
} from "lucide-react";
import { AuthCinematicShell, AuthTiltCard } from "@/components/auth/AuthCinematicShell";
import { PhantomXLogo } from "@/components/Logo";
import { AnimatedHero } from "@/components/ui/animated-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login as loginRequest, ApiError } from "@/lib/api";
import { resolveAvatarUrl } from "@/lib/avatars";
import { useAuth } from "@/store/auth";
import { toast } from "@/components/ui/sonner";
import { APP_NAME, cn, prefersReducedMotion } from "@/lib/utils";

const STATS = [
  { label: "Alerts / 24h", value: "2,847", color: "text-cyan-400" },
  { label: "Incidents", value: "18", color: "text-violet-400" },
  { label: "Auto-closed FP", value: "1,562", color: "text-emerald-400" },
] as const;

const MODULES = [
  { icon: Gavel, title: "AI Court", tag: "ADJUDICATION" },
  { icon: Bot, title: "SOC AI", tag: "NATURAL LANG" },
  { icon: Radar, title: "Pentest", tag: "ATT&CK" },
] as const;

const DEMO = [
  { user: "admin", pass: "admin123", role: "ADMIN", icon: UserCog, hue: "from-violet-500/20 to-cyan-500/10" },
  { user: "analyst", pass: "analyst123", role: "ANALYST", icon: User, hue: "from-cyan-500/20 to-violet-500/10" },
] as const;

export function Login() {
  const navigate = useNavigate();
  const setAuth = useAuth((s) => s.login);
  const reduced = prefersReducedMotion();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<"user" | "pass" | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginRequest(username.trim(), password);
      setAuth(res.token, res.role, res.username, resolveAvatarUrl(res.avatarUrl));
      navigate("/overview", { replace: true });
    } catch (err) {
      let msg = "Could not reach the server. Is the backend running on port 8000?";
      if (err instanceof ApiError) {
        msg =
          err.status === 401
            ? "Invalid username or password."
            : err.message || `Request failed (${err.status})`;
      }
      toast.error("Authentication failed", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCinematicShell>
      <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-10 px-5 py-10 md:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-14">
        {/* Left — command branding */}
        <motion.div
          initial={reduced ? {} : { opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-8"
        >
          <div className="flex flex-col gap-6">
            <PhantomXLogo markSize={36} className="text-3xl text-white md:text-4xl" />
            <p className="auth-glitch-text mb-2 font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-400/80">
              ◈ Classified // Operator Gate
            </p>
            <AnimatedHero
              prefix="Command"
              words={["the breach", "the threat", "the noise", "the adversary"]}
            />
            <p className="max-w-xl text-base leading-relaxed text-white/55 md:text-lg">
              {APP_NAME} — cinematic XDR command center. AI verdicts, autonomous FP
              triage, live SOC intelligence, and offensive validation in one
              hypersurface.
            </p>
          </div>

          {/* Live stats HUD */}
          <div className="grid grid-cols-3 gap-3">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={reduced ? {} : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  {s.label}
                </p>
                <p className={cn("font-display text-2xl font-bold md:text-3xl", s.color)}>
                  {s.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Module chips */}
          <div className="hidden flex-wrap gap-3 lg:flex">
            {MODULES.map((m, i) => (
              <motion.div
                key={m.title}
                initial={reduced ? {} : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                whileHover={reduced ? {} : { scale: 1.04, borderColor: "rgba(139,92,246,0.5)" }}
                className="flex items-center gap-3 rounded-full border border-white/10 bg-black/40 px-5 py-2.5 backdrop-blur-md"
              >
                <m.icon className="h-4 w-4 text-violet-400" />
                <div>
                  <p className="text-sm font-semibold text-white">{m.title}</p>
                  <p className="font-mono text-[9px] tracking-widest text-cyan-400/70">{m.tag}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right — access terminal */}
        <AuthTiltCard className="mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative p-8 md:p-10">
            {loading && (
              <motion.div
                className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            )}

            <div className="mb-8 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                  <Shield className="h-3 w-3" />
                  Auth channel open
                </span>
                <span className="font-mono text-[10px] text-white/30">v1.0.0</span>
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-white">
                Initialize session
              </h2>
              <p className="text-sm text-white/45">
                Biometric-grade operator login · JWT-secured uplink
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400/80"
                >
                  <User className="h-3 w-3" />
                  Operator ID
                </label>
                <div
                  className={cn(
                    "relative rounded-lg transition-all duration-300",
                    focused === "user" &&
                      "shadow-[0_0_30px_hsl(186_100%_50%/0.25)] ring-1 ring-cyan-400/50"
                  )}
                >
                  <Input
                    id="username"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocused("user")}
                    onBlur={() => setFocused(null)}
                    className="h-12 border-white/10 bg-black/60 font-mono text-base text-white placeholder:text-white/25"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/80"
                >
                  <Lock className="h-3 w-3" />
                  Access key
                </label>
                <div
                  className={cn(
                    "relative rounded-lg transition-all duration-300",
                    focused === "pass" &&
                      "shadow-[0_0_30px_hsl(243_80%_70%/0.25)] ring-1 ring-violet-400/50"
                  )}
                >
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused("pass")}
                    onBlur={() => setFocused(null)}
                    className="h-12 border-white/10 bg-black/60 font-mono text-base text-white placeholder:text-white/25"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="group relative h-14 w-full overflow-hidden border-0 bg-gradient-to-r from-violet-600 via-violet-500 to-cyan-500 text-base font-bold uppercase tracking-wider text-white shadow-[0_0_40px_hsl(243_80%_50%/0.4)] hover:from-violet-500 hover:to-cyan-400"
              >
                <span className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {loading ? (
                  <span className="relative flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Scanning credentials…
                  </span>
                ) : (
                  <span className="relative flex items-center gap-2">
                    <Fingerprint className="h-5 w-5" />
                    Authenticate
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                <Zap className="h-3 w-3 text-amber-400" />
                Quick deploy — demo operators
              </p>
              <div className="grid grid-cols-2 gap-3">
                {DEMO.map(({ user, pass, role, icon: Icon, hue }) => (
                  <button
                    key={user}
                    type="button"
                    onClick={() => {
                      setUsername(user);
                      setPassword(pass);
                    }}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border border-white/10 p-4 text-left transition-all hover:border-violet-400/40 hover:shadow-[0_0_24px_hsl(243_80%_50%/0.2)]",
                      `bg-gradient-to-br ${hue}`
                    )}
                  >
                    <Icon className="mb-2 h-4 w-4 text-violet-300" />
                    <p className="font-mono text-[9px] tracking-widest text-cyan-400/70">{role}</p>
                    <p className="font-semibold text-white">{user}</p>
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-white/40">
              No clearance yet?{" "}
              <Link
                to="/signup"
                className="font-semibold text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline"
              >
                Request operator account
              </Link>
            </p>
          </div>
        </AuthTiltCard>
      </div>
    </AuthCinematicShell>
  );
}
