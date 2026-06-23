import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Lock, ShieldCheck, User, UserPlus } from "lucide-react";
import { AnimatedShaderHero } from "@/components/ui/animated-shader-hero";
import { AnimatedHero } from "@/components/ui/animated-hero";
import { PhantomXLogo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signup as signupRequest, ApiError } from "@/lib/api";
import { resolveAvatarUrl } from "@/lib/avatars";
import { useAuth } from "@/store/auth";
import { toast } from "@/components/ui/sonner";
import { APP_NAME } from "@/lib/utils";

export function Signup() {
  const navigate = useNavigate();
  const setAuth = useAuth((s) => s.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <AnimatedShaderHero />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 grid w-full max-w-5xl gap-10 px-6 lg:grid-cols-2 lg:items-center"
      >
        <div className="hidden flex-col gap-6 lg:flex">
          <PhantomXLogo markSize={30} className="text-2xl" />
          <AnimatedHero prefix={APP_NAME} />
          <p className="max-w-md text-muted-foreground">
            Create your operator account. New accounts join as read-only
            analysts; an administrator can promote you to full access.
          </p>
        </div>

        <Card className="w-full p-8">
          <div className="mb-6 flex flex-col gap-1">
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
              <UserPlus className="h-5 w-5 text-primary" />
              Create account
            </h2>
            <p className="text-sm text-muted-foreground">
              Join the command center
            </p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Username (min 3 chars)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-9"
                autoComplete="username"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="pl-9"
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" size="lg" disabled={loading} className="mt-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <div className="mt-6 border-t border-border/40 pt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
