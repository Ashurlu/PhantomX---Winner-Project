import { Link } from "react-router-dom";
import { FileText, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCrammExport } from "@/lib/api";
import { formatReportDate } from "./cramm-helpers";
import { cn } from "@/lib/utils";
import type { CrammRiskSummary } from "@/lib/types";

function RiskRow({ risk, tone }: { risk: CrammRiskSummary; tone: "critical" | "high" }) {
  const scoreCls =
    tone === "critical"
      ? "text-rose-400 border-rose-500/40 bg-rose-500/10"
      : "text-orange-400 border-orange-500/40 bg-orange-500/10";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/50 bg-card/40 px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{risk.techniqueId}</span>
          <span
            className={cn(
              "rounded border px-1.5 py-0.5 font-mono text-xs font-bold",
              scoreCls
            )}
          >
            {risk.riskScore.toFixed(1)}
          </span>
        </div>
        <p className="mt-1 font-medium">{risk.title}</p>
      </div>
      <Link
        to={`/cramm/${risk.techniqueId}`}
        className="text-xs font-medium text-violet-400 hover:underline"
      >
        Open analysis
      </Link>
    </div>
  );
}

export function CrammExportDialog({
  open,
  onOpenChange,
  onViewAudit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewAudit?: () => void;
}) {
  const report = useCrammExport(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-violet-400" />
            CRAMM Environment Report
          </DialogTitle>
          <DialogDescription>
            {report.data
              ? `Generated ${formatReportDate(report.data.generatedAt)}`
              : "Full matrix and audit summary for your environment."}
          </DialogDescription>
        </DialogHeader>

        {report.isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {report.isError && (
          <p className="text-sm text-destructive">
            Could not load report. Is the backend running?
          </p>
        )}

        {report.data && (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total risks", value: `${report.data.matrix.stats.totalRisks}+` },
                { label: "Critical", value: report.data.matrix.stats.criticalCount },
                { label: "High severity", value: report.data.matrix.stats.highSeverityCount },
                {
                  label: "Health score",
                  value: `${report.data.matrix.stats.avgHealthScore}%`,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-border/50 bg-muted/20 p-3 text-center"
                >
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="mt-1 font-display text-xl font-bold">{s.value}</p>
                </div>
              ))}
            </div>

            <section>
              <div className="mb-3 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-500" />
                <h3 className="font-semibold">Critical threats</h3>
              </div>
              <div className="space-y-2">
                {report.data.matrix.critical.map((r) => (
                  <RiskRow key={r.id} risk={r} tone="critical" />
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-3 font-semibold">High severity threats</h3>
              <div className="space-y-2">
                {report.data.matrix.high.map((r) => (
                  <RiskRow key={r.id} risk={r} tone="high" />
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <h3 className="font-semibold text-emerald-400">Audit summary</h3>
              <p className="mt-2 text-sm text-muted-foreground">{report.data.audit.summary}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {report.data.audit.items.length} checklist items ·{" "}
                {report.data.audit.linkedRisks.length} linked risks
              </p>
            </section>

            <div className="flex flex-wrap justify-end gap-2 border-t border-border/50 pt-4">
              {onViewAudit && (
                <Button
                  variant="outline"
                  className="border-emerald-400/50 text-emerald-300"
                  onClick={() => {
                    onOpenChange(false);
                    onViewAudit();
                  }}
                >
                  View full audit
                </Button>
              )}
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
