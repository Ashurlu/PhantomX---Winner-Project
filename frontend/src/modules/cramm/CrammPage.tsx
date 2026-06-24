import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  FileText,
  Filter,
  Grid3X3,
  Search,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState, LoadingState } from "@/components/States";
import { ModuleHero, ModuleStatTile } from "@/components/module";
import { CrammAuditDialog } from "./CrammAuditDialog";
import { CrammExportDialog } from "./CrammExportDialog";
import { useCrammMatrix } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { CrammRiskSummary } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

function StatTile({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  accent?: string;
}) {
  const color =
    accent === "text-rose-500"
      ? "#EF4444"
      : accent === "text-orange-500"
        ? "#F97316"
        : accent?.startsWith("#")
          ? accent
          : "#8B5CF6";
  return (
    <ModuleStatTile
      label={label}
      value={`${value}${suffix ?? ""}`}
      accent={color}
    />
  );
}

function RiskCard({
  risk,
  large = false,
}: {
  risk: CrammRiskSummary;
  large?: boolean;
}) {
  const scoreColor =
    risk.riskScore >= 9
      ? "text-rose-500 border-rose-500/40 bg-rose-500/10"
      : risk.riskScore >= 7.5
        ? "text-orange-500 border-orange-500/40 bg-orange-500/10"
        : "text-amber-500 border-amber-500/40 bg-amber-500/10";

  return (
    <Link to={`/cramm/${risk.techniqueId}`} className="block h-full">
      <Card
        className={cn(
          "group h-full border-zinc-800/80 bg-[#16171d] p-5 text-zinc-100 shadow-none transition-all hover:border-violet-500/40 hover:shadow-[0_0_24px_hsl(243_80%_50%/0.12)]",
          large && "min-h-[200px] p-6"
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <span className="font-mono text-xs text-zinc-500">{risk.techniqueId}</span>
          <span
            className={cn(
              "rounded-md border px-2 py-0.5 font-mono text-sm font-bold",
              scoreColor
            )}
          >
            {risk.riskScore.toFixed(1)}
          </span>
        </div>
        <h3
          className={cn(
            "font-display font-bold text-zinc-50 group-hover:text-violet-300",
            large ? "text-xl" : "text-base"
          )}
        >
          {risk.title}
        </h3>
        <p
          className={cn(
            "mt-2 line-clamp-3 text-zinc-400",
            large ? "text-sm leading-relaxed" : "text-xs"
          )}
        >
          {risk.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {risk.tags.map((t) => (
            <span
              key={t}
              className="rounded border border-zinc-700/80 bg-zinc-900/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-zinc-400"
            >
              {t}
            </span>
          ))}
        </div>
      </Card>
    </Link>
  );
}

export function CrammPage() {
  const { data, isLoading, isError, refetch } = useCrammMatrix();
  const [q, setQ] = useState("");
  const [auditOpen, setAuditOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!data) return { critical: [], high: [] };
    const term = q.trim().toLowerCase();
    if (!term) return { critical: data.critical, high: data.high };
    const match = (r: CrammRiskSummary) =>
      r.title.toLowerCase().includes(term) ||
      r.techniqueId.toLowerCase().includes(term) ||
      r.description.toLowerCase().includes(term) ||
      r.tags.some((t) => t.toLowerCase().includes(term));
    return {
      critical: data.critical.filter(match),
      high: data.high.filter(match),
    };
  }, [data, q]);

  if (isLoading) return <LoadingState label="Loading CRAMM matrix…" />;
  if (isError || !data) {
    return <ErrorState message="Failed to load CRAMM matrix." onRetry={() => refetch()} />;
  }

  return (
    <>
      <CrammAuditDialog open={auditOpen} onOpenChange={setAuditOpen} />
      <CrammExportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        onViewAudit={() => setAuditOpen(true)}
      />

      <div className="flex flex-col gap-8">
        <ModuleHero
          accent="rose"
          section="Risk Management"
          title="CRAMM Risk Matrix"
          description="Comprehensive Risk Analysis and Management Matrix mapped to MITRE ATT&CK techniques across your environment."
          stats={[
            { label: "Risks", value: `${data.stats.totalRisks}+`, accent: "#8B5CF6" },
            { label: "Critical", value: data.stats.criticalCount, accent: "#EF4444" },
            { label: "High", value: data.stats.highSeverityCount, accent: "#F97316" },
          ]}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                className="border-border bg-card/80"
                onClick={() => {
                  document.getElementById("cramm-search")?.focus();
                  toast.info("Use the search bar to filter techniques.");
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button
                size="sm"
                className="bg-violet-600 text-white hover:bg-violet-500"
                onClick={() => setReportOpen(true)}
              >
                <FileText className="mr-2 h-4 w-4" />
                View Report
              </Button>
            </>
          }
        />

        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="cramm-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search techniques, risk IDs, or mitigations…"
            className="h-11 border-border/60 bg-card/60 pl-10"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Total Risks Identified" value={`${data.stats.totalRisks}+`} />
          <StatTile
            label="Critical (9.0+)"
            value={String(data.stats.criticalCount).padStart(2, "0")}
            suffix="+"
            accent="text-rose-500"
          />
          <StatTile
            label="High Severity"
            value={data.stats.highSeverityCount}
            suffix="+"
            accent="text-orange-500"
          />
          <StatTile
            label="Avg. Health Score"
            value={`${data.stats.avgHealthScore}%`}
            accent="text-emerald-500"
          />
        </div>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-500" />
            <h2 className="font-display text-lg font-bold text-foreground">Critical Severity Threats</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {filtered.critical.map((r) => (
              <RiskCard key={r.id} risk={r} large />
            ))}
            {filtered.critical.length === 0 && (
              <p className="text-sm text-muted-foreground">No critical threats match your search.</p>
            )}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h2 className="font-display text-lg font-bold text-foreground">High Severity Threats</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.high.map((r) => (
              <RiskCard key={r.id} risk={r} />
            ))}
          </div>
        </section>

        <Card className="flex flex-col gap-4 border-emerald-500/25 bg-emerald-50/80 p-6 dark:border-emerald-500/30 dark:bg-emerald-500/5 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400/80">
                Environment Health Insight
              </p>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {data.insight.message}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 border-emerald-600/40 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/50 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-200"
            onClick={() => setAuditOpen(true)}
          >
            {data.insight.ctaLabel}
          </Button>
        </Card>
      </div>
    </>
  );
}
