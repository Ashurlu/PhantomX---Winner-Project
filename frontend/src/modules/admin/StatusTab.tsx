import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  Database,
  Loader2,
  Plug,
  Users,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/States";
import { useSystemStatus, useTestConnection } from "@/lib/api";
import type { ConnTarget } from "@/lib/types";

function targetForName(name: string): ConnTarget {
  if (/n8n/i.test(name)) return "n8n";
  if (/pentest/i.test(name)) return "pentest";
  return "ai";
}

export function StatusTab() {
  const { data, isLoading, isError, refetch } = useSystemStatus();

  if (isError) return <ErrorState message="Failed to load status." onRetry={() => refetch()} />;
  if (isLoading || !data) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat
          icon={Activity}
          label="Backend"
          value={data.status === "ok" ? "Healthy" : "Down"}
          accent={data.status === "ok" ? "#10B981" : "#EF4444"}
        />
        <Stat icon={Database} label="Data Source" value={data.dataSource} accent="#8B5CF6" capitalize />
        <Stat icon={Users} label="Users" value={String(data.userCount)} accent="#22D3EE" />
        <Stat icon={Users} label="Admins" value={String(data.adminCount)} accent="#F59E0B" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Integrations</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {data.integrations.map((i) => (
            <IntegrationRow key={i.name} name={i.name} detail={i.detail} configured={i.configured} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function IntegrationRow({
  name,
  detail,
  configured,
}: {
  name: string;
  detail: string;
  configured: boolean;
}) {
  const test = useTestConnection();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async () => {
    setResult(null);
    try {
      const r = await test.mutateAsync(targetForName(name));
      setResult({
        ok: r.reachable,
        text: r.reachable
          ? `${r.detail}${r.latencyMs ? ` · ${r.latencyMs}ms` : ""}`
          : r.detail,
      });
    } catch (e) {
      setResult({ ok: false, text: String((e as Error).message) });
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/40 p-3">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium">{name}</span>
        <span className="truncate font-mono text-xs text-muted-foreground">{detail}</span>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {result && (
          <span
            className={`flex items-center gap-1.5 text-xs font-semibold ${
              result.ok ? "text-severity-resolved" : "text-severity-high"
            }`}
          >
            {result.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {result.text}
          </span>
        )}
        {!result &&
          (configured ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-severity-resolved">
              <CheckCircle2 className="h-4 w-4" /> Configured
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <XCircle className="h-4 w-4" /> Not configured
            </span>
          ))}
        <Button variant="outline" size="sm" onClick={run} disabled={test.isPending}>
          {test.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plug className="h-3.5 w-3.5" />}
          Test
        </Button>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
  capitalize,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  accent: string;
  capitalize?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
          <span
            className={`font-display text-2xl font-bold ${capitalize ? "capitalize" : ""}`}
            style={{ color: accent }}
          >
            {value}
          </span>
        </div>
        <Icon className="h-6 w-6" style={{ color: accent }} />
      </div>
    </Card>
  );
}
