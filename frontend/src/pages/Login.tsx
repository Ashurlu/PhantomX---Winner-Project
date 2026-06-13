import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Lock, User } from "lucide-react";
import { AnimatedShaderHero } from "@/components/ui/animated-shader-hero";
import { PhantomXLogo } from "@/components/Logo";
import { AnimatedHero } from "@/components/ui/animated-hero";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { login as loginRequest, ApiError } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { toast } from "@/components/ui/sonner";
import { APP_NAME } from "@/lib/utils";

export function Login() {
  const navigate = useNavigate();
  const setAuth = useAuth((s) => s.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginRequest(username.trim(), password);
      setAuth(res.token, res.role, res.username);
      toast.success(`Welcome back, ${res.username}`, {
        description: `Signed in as ${res.role}`,
      });
      navigate("/overview", { replace: true });
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Login failed. Try again.";
      toast.error("Authentication failed", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
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
            Next-generation security command platform. AI-adjudicated alerts,
            autonomous false-positive triage, and offensive validation — in one
            cinematic command center.
          </p>
        </div>

        <Card className="w-full p-8">
          <div className="mb-6 flex flex-col gap-1">
            <h2 className="font-display text-2xl font-bold">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Access your command center
            </p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Username"
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
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" size="lg" disabled={loading} className="mt-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Authenticating…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 border-t border-border/40 pt-4">
            <p className="mb-2 text-xs text-muted-foreground">Demo accounts</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => quickFill("admin", "admin123")}
              >
                admin
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => quickFill("analyst", "analyst123")}
              >
                analyst
              </Button>
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
