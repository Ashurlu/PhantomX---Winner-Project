import { useNavigate } from "react-router-dom";
import { ChevronDown, Clock, LogOut, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/store/auth";
import { useUi, type TimeRange } from "@/store/ui";
import { PhantomXLogo } from "@/components/Logo";

const RANGES: TimeRange[] = ["Last 24H", "Last 7D", "Last 30D"];

export function TopBar({ title }: { title: string }) {
  const { username, role, logout } = useAuth();
  const { timeRange, setTimeRange } = useUi();
  const navigate = useNavigate();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/40 bg-card/30 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <PhantomXLogo markSize={20} className="text-base" />
      </div>

      <h1 className="absolute left-1/2 hidden -translate-x-1/2 font-display text-base font-semibold tracking-wide md:block">
        {title}
      </h1>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Clock className="h-3.5 w-3.5 text-secondary" />
              {timeRange}
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {RANGES.map((r) => (
              <DropdownMenuItem key={r} onClick={() => setTimeRange(r)}>
                {r}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20">
                <User className="h-3.5 w-3.5 text-primary" />
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-semibold leading-tight">
                  {username}
                </span>
                <span className="block text-[10px] uppercase leading-tight text-muted-foreground">
                  {role}
                </span>
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[200px]">
            <DropdownMenuLabel>Signed in as {username}</DropdownMenuLabel>
            <DropdownMenuItem disabled className="opacity-100">
              <ShieldCheck className="h-4 w-4 text-secondary" />
              Role: <span className="font-semibold capitalize">{role}</span>
            </DropdownMenuItem>
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
    </header>
  );
}
