import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, Gavel, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge } from "@/components/SeverityBadge";
import { ModuleHero, ModuleCoreBadge } from "@/components/module";
import { Tribunal } from "@/three/Tribunal";
import { ErrorState, LoadingState } from "@/components/States";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiCourtCases, useAiCourtStats, useCasesInbox } from "@/lib/api";
import { CaseAssigneeBadge } from "./CaseAssigneeBadge";
import { resolveAssignee } from "./ai-court-helpers";
import { formatTimeRangeShort } from "@/lib/time-range";
import { formatNumber } from "@/lib/utils";
import { useUi } from "@/store/ui";
import { CaseDetailDialog } from "./CaseDetailDialog";
import type { CaseAssignee, CaseSummary } from "@/lib/types";

export function AiCourtPage() {
  const stats = useAiCourtStats();
  const cases = useAiCourtCases();
  const inbox = useCasesInbox();
  const { timeFrom, timeTo } = useUi();
  const periodLabel = formatTimeRangeShort(timeFrom, timeTo);
  const [selected, setSelected] = useState<string | null>(null);
  const [params] = useSearchParams();

  useEffect(() => {
    const c = params.get("case");
    if (c) setSelected(c);
  }, [params]);

  return (
    <div className="flex flex-col gap-6">
      <ModuleHero
        accent="violet"
        section="AI Court"
        title="Autonomous Adjudication Tribunal"
        description="Prosecutor, defender, and judge agents debate evidence over true-positive alerts — rendering verdicts without flooding your inbox with noise."
        badge={<ModuleCoreBadge>AI Core</ModuleCoreBadge>}
        stats={[
          {
            label: "True positives",
            value: stats.data ? String(stats.data.truePositivesShown) : "—",
            accent: "#8B5CF6",
          },
          {
            label: "FP auto-closed",
            value: stats.data ? formatNumber(stats.data.falsePositivesAutoClosed) : "—",
            accent: "#22D3EE",
          },
          { label: "Period", value: periodLabel, accent: "#F59E0B" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="module-panel accent-top relative col-span-3 h-[440px] overflow-hidden border-0 p-0 shadow-none">
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
        <Card className="module-panel accent-top col-span-2 flex h-[440px] flex-col border-0 p-0 shadow-none">
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
                <CaseRow
                  key={c.alertId}
                  c={c}
                  assignee={resolveAssignee(inbox.data, c)}
                  index={i}
                  onOpen={() => setSelected(c.alertId)}
                />
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
  assignee,
  index,
  onOpen,
}: {
  c: CaseSummary;
  assignee: CaseAssignee | null;
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
        <span className="text-mono-id text-xs">{c.alertId}</span>
        <SeverityBadge severity={c.severity} />
      </div>
      <span className="text-sm font-medium leading-snug">{c.title}</span>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs text-muted-foreground">
          {c.recommendationSummary}
        </span>
        <span className="font-mono text-xs font-semibold text-primary">
          {Math.round(c.confidence * 100)}%
        </span>
      </div>
      <div className="flex items-center justify-end">
        <CaseAssigneeBadge assignee={assignee} showLabel />
      </div>
    </motion.button>
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
