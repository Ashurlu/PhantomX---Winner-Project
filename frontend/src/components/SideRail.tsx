import { NavLink } from "react-router-dom";
import {
  Gavel,
  LayoutDashboard,
  Settings2,
  ShieldHalf,
  Swords,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PhantomXMark } from "@/components/Logo";
import { useAuth } from "@/store/auth";

interface RailItem {
  to: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const ITEMS: RailItem[] = [
  { to: "/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/ai-court", label: "AI Court", icon: Gavel },
  { to: "/rules", label: "Recommended Rules", icon: ShieldHalf },
  { to: "/pentest", label: "AGI Pentest", icon: Swords },
  { to: "/admin", label: "Admin Console", icon: Settings2, adminOnly: true },
];

export function SideRail() {
  const isAdmin = useAuth((s) => s.role === "admin");
  const items = ITEMS.filter((i) => !i.adminOnly || isAdmin);
  return (
    <nav className="relative z-50 flex w-[72px] shrink-0 flex-col items-center gap-2 border-r border-border/40 bg-card/40 py-5 backdrop-blur-xl">
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-background/60 text-white shadow-[0_0_24px_-6px_hsl(var(--primary)/0.9)]"
        title="PhantomX"
      >
        <PhantomXMark size={26} />
      </div>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          title={item.label}
          className={({ isActive }) =>
            cn(
              "group relative flex h-12 w-12 items-center justify-center rounded-xl transition-all",
              isActive
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute -left-[14px] h-7 w-1 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
              )}
              <item.icon className="h-5 w-5" />
              <span className="pointer-events-none absolute left-14 z-50 whitespace-nowrap rounded-md border border-border/50 bg-popover px-2.5 py-1 text-xs opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
