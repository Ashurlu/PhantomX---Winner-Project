import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Gavel, Scale, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Tribunal } from "@/three/Tribunal";
import { ErrorState, LoadingState } from "@/components/States";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiCourtCases, useAiCourtStats } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { CaseDetailDialog } from "./CaseDetailDialog";
import type { CaseSummary } from "@/lib/types";

export function AiCourtPage() {
  const stats = useAiCourtStats();
  const cases = useAiCourtCases();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Gavel}
          label="True Positives Shown"
          value={stats.data ? String(stats.data.truePositivesShown) : "—"}
          accent="#8B5CF6"
          loading={stats.isLoading}
        />
        <StatCard
          icon={Bot}
          label="False Positives Auto-Closed"
          value={stats.data ? formatNumber(stats.data.falsePositivesAutoClosed) : "—"}
          accent="#22D3EE"
          loading={stats.isLoading}
          sub="never listed — only counted"
        />
        <StatCard
          icon={Scale}
          label="Period"
          value={stats.data?.period ?? "—"}
          accent="#F59E0B"
          loading={stats.isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* 3D Tribunal */}
        <Card className="relative col-span-3 h-[440px] overflow-hidden p-0">
          <div className="absolute inset-0">
            <Tribunal />
          </div>
          <div className="pointer-events-none absolute left-6 top-5">
            <p className="font-display text-sm uppercase tracking-[0.2em] text-primary">
              The Tribunal
            </p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Prosecutor argues malicious, Defender argues benign, the Judge
              renders n8n's verdict over the centered evidence.
            </p>
          </div>
          <div className="pointer-events-none absolute bottom-5 left-6 flex gap-4 text-xs">
            <Legend color="#EF4444" label="Prosecutor" />
            <Legend color="#3B82F6" label="Defender" />
            <Legend color="#8B5CF6" label="Judge" />
            <Legend color="#F59E0B" label="Evidence" />
          </div>
        </Card>

        {/* Case feed */}
        <Card className="col-span-2 flex h-[440px] flex-col p-0">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              True-Positive Cases
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {cases.data?.length ?? 0} cases
            </span>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-2 overflow-y-auto">
            {cases.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))
            ) : cases.isError ? (
              <ErrorState message="Failed to load cases." onRetry={() => cases.refetch()} />
            ) : (
              cases.data?.map((c, i) => (
                <CaseRow key={c.alertId} c={c} index={i} onOpen={() => setSelected(c.alertId)} />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <CaseDetailDialog
        alertId={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function CaseRow({
  c,
  index,
  onOpen,
}: {
  c: CaseSummary;
  index: number;
  onOpen: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onOpen}
      className="group flex w-full flex-col gap-1.5 rounded-lg border border-border/40 bg-background/40 p-3 text-left transition-all hover:border-primary/50 hover:bg-primary/5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-secondary">{c.alertId}</span>
        <SeverityBadge severity={c.severity} />
      </div>
      <span className="text-sm font-medium leading-snug">{c.title}</span>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {c.recommendationSummary}
        </span>
        <span className="font-mono text-xs font-semibold text-primary">
          {Math.round(c.confidence * 100)}%
        </span>
      </div>
    </motion.button>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  sub,
  loading,
}: {
  icon: typeof Bot;
  label: string;
  value: string;
  accent: string;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          {loading ? (
            <Skeleton className="h-9 w-20" />
          ) : (
            <span className="font-display text-3xl font-bold" style={{ color: accent }}>
              {value}
            </span>
          )}
          {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)` }}
        >
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
      </div>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
