import { NavLink } from "react-router-dom";
import {
  FolderKanban,
  Gavel,
  Grid3X3,
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
  { to: "/cases", label: "Cases", icon: FolderKanban },
  { to: "/ai-court", label: "AI Court", icon: Gavel },
  { to: "/rules", label: "Recommended Rules", icon: ShieldHalf },
  { to: "/cramm", label: "CRAMM Table", icon: Grid3X3 },
  { to: "/pentest", label: "AGI Pentest", icon: Swords },
  { to: "/admin", label: "Admin Console", icon: Settings2, adminOnly: true },
];

export function SideRail() {
  const isAdmin = useAuth((s) => s.role === "admin");
  const items = ITEMS.filter((i) => !i.adminOnly || isAdmin);
  return (
    <nav className="relative z-50 flex w-[76px] shrink-0 flex-col items-center gap-2 border-r border-border bg-card py-5">
      <div
        className="mb-4 flex h-11 w-11 items-center justify-center text-black"
        style={{ background: "#9FB5AD" }}
        title="PhantomX"
      >
        <PhantomXMark size={26} core="#1e1e1e" />
      </div>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          title={item.label}
          className={({ isActive }) =>
            cn(
              "group relative flex h-12 w-12 items-center justify-center transition-colors duration-200",
              isActive
                ? "text-black"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <>
                  <span className="absolute inset-0" style={{ background: "#9FB5AD" }} />
                  <span className="absolute -left-[15px] h-7 w-1.5" style={{ background: "#9FB5AD" }} />
                </>
              )}
              <item.icon className="relative h-5 w-5" />
              <span className="pointer-events-none absolute left-16 z-50 whitespace-nowrap rounded-none border border-border bg-popover px-2.5 py-1 text-xs uppercase tracking-wider opacity-0 transition-opacity group-hover:opacity-100">
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
