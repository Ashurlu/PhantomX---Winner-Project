import { Database, Loader2, Radio, Server } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { useAdminSettings, useUpdateSettings } from "@/lib/api";
import { AdminTabLoader } from "./AdminTabLoader";

export function DataSourceTab() {
  const { data, isLoading, isFetching } = useAdminSettings();
  const update = useUpdateSettings();

  const set = async (dataSource: "mock" | "live") => {
    try {
      await update.mutateAsync({ dataSource });
      toast.success(`Data source → ${dataSource}`, {
        description:
          dataSource === "live"
            ? "Endpoints now route through live_provider (delegates to mock until upstreams are wired)."
            : "Serving realistic mock JSON.",
      });
    } catch (e) {
      toast.error("Toggle failed", { description: String((e as Error).message) });
    }
  };

  return (
    <AdminTabLoader>
      {isLoading || (isFetching && !data) || !data ? (
        <Skeleton className="h-48 w-full" />
      ) : (
    <div className="grid gap-5 lg:grid-cols-2">
      <Option
        active={data.dataSource === "mock"}
        busy={update.isPending}
        icon={Database}
        title="Mock"
        badge="Default"
        desc="Serve realistic local JSON with latency jitter. Perfect for demos and offline work."
        onClick={() => set("mock")}
        accent="#22D3EE"
      />
      <Option
        active={data.dataSource === "live"}
        busy={update.isPending}
        icon={Radio}
        title="Live"
        badge="Real upstreams"
        desc="Route the same endpoints to n8n and the pentest tool using the keys in the API Keys tab. Frontend is unchanged."
        onClick={() => set("live")}
        accent="#8B5CF6"
      />

      <Card className="lg:col-span-2 border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="h-4 w-4 text-muted-foreground" /> How it works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The backend selects <span className="font-mono text-foreground">mock_provider</span> or{" "}
          <span className="font-mono text-foreground">live_provider</span> by this setting — the
          data contract is identical, so the UI never changes. Live currently
          delegates to mock; replace each method in{" "}
          <span className="font-mono text-foreground">live_provider.py</span> with a real HTTP
          call (using the saved keys) to go fully live.
        </CardContent>
      </Card>
    </div>
      )}
    </AdminTabLoader>
  );
}

function Option({
  active,
  busy,
  icon: Icon,
  title,
  badge,
  desc,
  onClick,
  accent,
}: {
  active: boolean;
  busy: boolean;
  icon: typeof Database;
  title: string;
  badge: string;
  desc: string;
  onClick: () => void;
  accent: string;
}) {
  return (
    <button
      disabled={busy}
      onClick={onClick}
      className={`flex flex-col gap-3 rounded-xl border p-6 text-left transition-all disabled:opacity-60 ${
        active
          ? "border-primary/60 bg-primary/10 shadow-[0_0_30px_-10px_hsl(var(--primary))]"
          : "border-border/40 bg-card/40 hover:border-border hover:bg-card/70"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-lg"
          style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)` }}
        >
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
        {active && (
          <span className="flex items-center gap-1.5 rounded-full bg-severity-resolved/15 px-3 py-1 text-xs font-bold text-severity-resolved">
            {busy && <Loader2 className="h-3 w-3 animate-spin" />}
            Active
          </span>
        )}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-bold">{title}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
            {badge}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
    </button>
  );
}
