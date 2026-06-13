import {
  KeyRound,
  LogIn,
  ScrollText,
  Settings2,
  ShieldHalf,
  Swords,
  UserPlus,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { useAuditLog } from "@/lib/api";
import type { AuditEntry } from "@/lib/types";

const ACTION_META: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  "auth.login": { icon: LogIn, color: "#22D3EE", label: "Login" },
  "auth.signup": { icon: UserPlus, color: "#22D3EE", label: "Sign-up" },
  "user.create": { icon: UserPlus, color: "#8B5CF6", label: "User created" },
  "user.role": { icon: ShieldHalf, color: "#8B5CF6", label: "Role changed" },
  "user.active": { icon: Settings2, color: "#F59E0B", label: "User status" },
  "user.password": { icon: KeyRound, color: "#F59E0B", label: "Password reset" },
  "user.delete": { icon: Settings2, color: "#EF4444", label: "User deleted" },
  "settings.update": { icon: Settings2, color: "#8B5CF6", label: "Settings changed" },
  "rule.create": { icon: ShieldHalf, color: "#22D3EE", label: "Rule created" },
  "rule.approve": { icon: ShieldHalf, color: "#10B981", label: "Rule approved" },
  "rule.reject": { icon: ShieldHalf, color: "#EF4444", label: "Rule rejected" },
  "pentest.run": { icon: Swords, color: "#F59E0B", label: "Pentest run" },
  "integration.test": { icon: Settings2, color: "#22D3EE", label: "Connection test" },
  "maintenance.reset_demo": { icon: Wrench, color: "#F59E0B", label: "Demo reset" },
  "maintenance.export_config": { icon: Wrench, color: "#8B5CF6", label: "Config export" },
};

function meta(action: string) {
  return (
    ACTION_META[action] ?? { icon: ScrollText, color: "#8B8B99", label: action }
  );
}

export function AuditLogTab() {
  const { data, isLoading, isError, refetch } = useAuditLog();

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-primary" /> Audit Log
        </CardTitle>
        <span className="text-xs text-muted-foreground">
          {data?.length ?? 0} most recent events · live
        </span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message="Failed to load audit log." onRetry={() => refetch()} />
        ) : !data?.length ? (
          <EmptyState label="No activity recorded yet." />
        ) : (
          <div className="flex flex-col">
            {data.map((e, i) => (
              <Row key={e.id} e={e} last={i === data.length - 1} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ e, last }: { e: AuditEntry; last: boolean }) {
  const m = meta(e.action);
  const Icon = m.icon;
  return (
    <div
      className={`flex items-start gap-3 py-3 ${
        last ? "" : "border-b border-border/30"
      }`}
    >
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `color-mix(in srgb, ${m.color} 16%, transparent)` }}
      >
        <Icon className="h-4 w-4" style={{ color: m.color }} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{m.label}</span>
          <span className="font-mono text-xs text-secondary">{e.actor}</span>
        </div>
        {e.detail && (
          <span className="truncate text-xs text-muted-foreground">{e.detail}</span>
        )}
      </div>
      <span className="shrink-0 font-mono text-[11px] text-muted-foreground" title={e.timestamp}>
        {new Date(e.timestamp).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
}
