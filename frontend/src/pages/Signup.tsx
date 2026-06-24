import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Fingerprint, Loader2, Lock, ShieldCheck, User, UserPlus } from "lucide-react";
import { AuthCinematicShell, AuthTiltCard } from "@/components/auth/AuthCinematicShell";
import { AnimatedHero } from "@/components/ui/animated-hero";
import { PhantomXLogo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signup as signupRequest, ApiError } from "@/lib/api";
import { resolveAvatarUrl } from "@/lib/avatars";
import { useAuth } from "@/store/auth";
import { toast } from "@/components/ui/sonner";
import { APP_NAME, cn, prefersReducedMotion } from "@/lib/utils";

export function Signup() {
  const navigate = useNavigate();
  const setAuth = useAuth((s) => s.login);
  const reduced = prefersReducedMotion();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 3) {
      toast.error("Username too short", { description: "At least 3 characters." });
      return;
    }
    if (!/^[a-zA-Z0-9_-]{3,32}$/.test(username.trim())) {
      toast.error("Invalid username", {
        description: "Use letters, numbers, hyphen, or underscore only.",
      });
      return;
    }
    if (password.length < 6) {
      toast.error("Password too short", { description: "At least 6 characters." });
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const res = await signupRequest(username.trim(), password);
      setAuth(res.token, res.role, res.username, resolveAvatarUrl(res.avatarUrl));
      navigate("/overview", { replace: true });
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Sign-up failed. Try again.";
      toast.error("Could not create account", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (id: string) =>
    cn(
      "rounded-lg transition-all duration-300",
      focused === id && "shadow-[0_0_30px_hsl(186_100%_50%/0.2)] ring-1 ring-cyan-400/40"
    );

  return (
    <AuthCinematicShell>
      <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-10 px-5 py-10 md:px-8 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={reduced ? {} : { opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden flex-col gap-6 lg:flex"
        >
          <PhantomXLogo markSize={36} className="text-3xl text-white" />
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-violet-400/80">
            ◈ New operator onboarding
          </p>
          <AnimatedHero prefix={APP_NAME} words={["onboards", "recruits", "activates"]} />
          <p className="max-w-md text-white/55">
            Create your operator account. New accounts join as read-only analysts;
            an administrator can promote you to full access.
          </p>
        </motion.div>

        <AuthTiltCard className="mx-auto w-full max-w-md">
          <div className="p-8 md:p-10">
            <div className="mb-8">
              <h2 className="flex items-center gap-2 font-display text-3xl font-bold text-white">
                <UserPlus className="h-7 w-7 text-cyan-400" />
                Enlist
              </h2>
              <p className="mt-1 text-sm text-white/45">Join the command center</p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {(
                [
                  { id: "user", icon: User, label: "Operator ID", type: "text", val: username, set: setUsername, ac: "username", ph: "username" },
                  { id: "pass", icon: Lock, label: "Access key", type: "password", val: password, set: setPassword, ac: "new-password", ph: "min 6 chars" },
                  { id: "confirm", icon: ShieldCheck, label: "Confirm key", type: "password", val: confirm, set: setConfirm, ac: "new-password", ph: "repeat password" },
                ] as const
              ).map((f) => (
                <div key={f.id} className="space-y-2">
                  <label
                    htmlFor={f.id}
                    className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40"
                  >
                    {f.label}
                  </label>
                  <div className={cn("relative", fieldClass(f.id))}>
                    <f.icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <Input
                      id={f.id}
                      type={f.type}
                      placeholder={f.ph}
                      value={f.val}
                      onChange={(e) => f.set(e.target.value)}
                      onFocus={() => setFocused(f.id)}
                      onBlur={() => setFocused(null)}
                      className="h-12 border-white/10 bg-black/60 pl-10 font-mono text-white"
                      autoComplete={f.ac}
                      required
                    />
                  </div>
                </div>
              ))}

              <Button
                type="submit"
                disabled={loading}
                className="group mt-2 h-14 w-full bg-gradient-to-r from-cyan-600 to-violet-600 text-base font-bold uppercase tracking-wider"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Fingerprint className="mr-2 h-5 w-5" />
                    Create operator
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-white/40">
              Already cleared?{" "}
              <Link to="/login" className="font-semibold text-cyan-400 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </AuthTiltCard>
      </div>
    </AuthCinematicShell>
  );
}
