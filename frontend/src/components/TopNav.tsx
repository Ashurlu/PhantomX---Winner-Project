import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronDown,
  Clock,
  LogOut,
  Menu,
  Moon,
  Settings,
  ShieldCheck,
  Sun,
  UserCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/store/auth";
import { useUi } from "@/store/ui";
import { useSystemStatus } from "@/lib/api";
import { formatTimeRangeShort, TIME_PRESETS } from "@/lib/time-range";
import { ProfilePictureMenuItems } from "@/components/ProfilePictureMenuItems";
import { UserAvatar } from "@/components/UserAvatar";
import { PhantomXMark } from "@/components/Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/overview", label: "Overview" },
  { to: "/cases", label: "Cases" },
  { to: "/detection", label: "Detection" },
  { to: "/ai-court", label: "AI Court" },
  { to: "/rules", label: "Recommended Rules" },
  { to: "/cramm", label: "CRAMM Table" },
  { to: "/pentest", label: "AGI Pentest" },
];
const ADMIN_ITEM = { to: "/admin", label: "Admin Console" };

export function TopNav() {
  const { username, role, logout, avatarUrl } = useAuth();
  const isAdmin = role === "admin";
  const { timeFrom, timeTo, applyPreset } = useUi();
  const status = useSystemStatus();
  const navigate = useNavigate();
  const items = role === "admin" ? [...NAV, ADMIN_ITEM] : NAV;

  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("phantomx-app-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <header
      className="seven-nav sticky top-0 z-50 h-[52px] w-full shrink-0"
      style={{ background: "#0D0D0D", color: "#fff" }}
    >
      <div className="mx-auto flex h-full max-w-[1680px] items-center justify-between gap-6 px-5">
        <div className="flex items-center gap-6">
          <NavLink to="/overview" className="flex items-center">
            <span className="flex items-center text-[17px] font-bold tracking-[-0.02em] text-white">
              PHANTOM
              <PhantomXMark size={18} className="ml-1" core="#6B5CE7" />
            </span>
          </NavLink>
          <nav className="hidden h-full items-stretch gap-0.5 lg:flex">
            {items.map((i) => (
              <NavLink
                key={i.to}
                to={i.to}
                className={({ isActive }) =>
                  cn(
                    "seven-nav-item relative flex h-full items-center px-3 text-[13px] font-medium transition-colors duration-150",
                    isActive ? "font-semibold text-white" : "text-white/55 hover:text-white/90"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {i.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-white"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {items.map((i) => (
                <DropdownMenuItem key={i.to} onClick={() => navigate(i.to)}>
                  {i.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* right: theme toggle + time range + user */}
        <div className="flex items-center gap-2">
          {status.data && (
            <span
              className={cn(
                "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide sm:inline-flex",
                status.data.dataSource === "live"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-white/10 text-white/60"
              )}
              title={`Data source: ${status.data.dataSource}`}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  status.data.dataSource === "live" ? "bg-emerald-400" : "bg-white/40"
                )}
              />
              {status.data.dataSource}
            </span>
          )}
          <button
            onClick={() => setDark((d) => !d)}
            aria-label={dark ? "Switch to light mode" : "Switch to night mode"}
            title={dark ? "Light mode" : "Night mode"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/90 transition-colors hover:bg-white/10">
                <Clock className="h-3.5 w-3.5 text-accent" />
                {formatTimeRangeShort(timeFrom, timeTo)}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[320px] overflow-y-auto">
              <DropdownMenuLabel>Quick ranges</DropdownMenuLabel>
              {TIME_PRESETS.map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => applyPreset(p.id)}>
                  {p.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/90 transition-colors hover:bg-white/10">
                <UserAvatar username={username} avatarUrl={avatarUrl} size={32} />
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-semibold leading-tight">{username}</span>
                  <span className="block text-[10px] uppercase leading-tight text-white/50">{role}</span>
                </span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[220px]">
              <DropdownMenuLabel>Signed in as {username}</DropdownMenuLabel>
              <DropdownMenuItem disabled className="opacity-100">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Role: <span className="font-semibold capitalize">{role}</span>
              </DropdownMenuItem>
              <ProfilePictureMenuItems />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <UserCircle className="h-4 w-4" />
                My Profile
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate("/admin")}>
                  <Settings className="h-4 w-4" />
                  Admin Console
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
