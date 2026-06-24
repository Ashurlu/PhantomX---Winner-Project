import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Database,
  FileText,
  Info,
  Shield,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/States";
import { ModuleHero } from "@/components/module";
import { CrammRawDataDialog, CrammTechniqueReportDialog } from "./CrammDetailDialogs";
import { buildCrammTechniqueReport } from "./cramm-helpers";
import { useCrammDetail } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { CrammVector } from "@/lib/types";

function VectorBar({ v }: { v: CrammVector }) {
  const tone =
    v.tone === "rose"
      ? "bg-rose-500"
      : v.tone === "amber"
        ? "bg-amber-500"
        : v.tone === "violet"
          ? "bg-violet-500"
          : "bg-cyan-500";
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{v.label}</span>
        <span className="font-mono font-semibold">{v.pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/40">
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${v.pct}%` }} />
      </div>
    </div>
  );
}

function CriticalityRing({ pct }: { pct: number }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg className="-rotate-90" width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" opacity="0.3" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="hsl(243 80% 65%)"
          strokeWidth="8"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-display text-3xl font-bold">{pct}%</p>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Criticality
        </p>
      </div>
    </div>
  );
}

export function CrammDetailPage() {
  const { techniqueId } = useParams<{ techniqueId: string }>();
  const { data, isLoading, isError, refetch } = useCrammDetail(techniqueId);
  const [rawOpen, setRawOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const techniqueReport = useMemo(
    () => (data ? buildCrammTechniqueReport(data) : null),
    [data]
  );

  if (isLoading) return <LoadingState label="Loading CRAMM analysis…" />;
  if (isError || !data) {
    return (
      <ErrorState
        message="CRAMM analysis not found."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <>
      {data && (
        <CrammRawDataDialog open={rawOpen} onOpenChange={setRawOpen} detail={data} />
      )}
      {techniqueReport && (
        <CrammTechniqueReportDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          report={techniqueReport}
        />
      )}

      <div className="flex flex-col gap-6 pb-8">
      <ModuleHero
        accent="rose"
        section="CRAMM Analysis"
        title={data.title}
        description={data.description}
        stats={[
          { label: "Risk score", value: data.riskScore, accent: "#F97316" },
          { label: "MITRE", value: data.mitreId, accent: "#8B5CF6" },
          { label: "ALE", value: data.annualLossLabel, accent: "#22D3EE" },
        ]}
        actions={
          <Link
            to="/cramm"
            className="inline-flex items-center gap-1 text-sm text-violet-400 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to matrix
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        {/* Asset context */}
        <Card className="border-zinc-800/80 bg-[#16171d] p-6 text-zinc-100 shadow-none">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-300">
              1
            </span>
            <h2 className="font-display font-bold text-zinc-50">Asset Context</h2>
            <Info className="ml-auto h-4 w-4 text-zinc-500" />
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">Principal</p>
              <p className="mt-1 font-mono font-semibold text-violet-300">{data.asset.name}</p>
            </div>
            <Row label="Asset Value" value={String(data.asset.assetValue)} />
            <Row label="Principal Name" value={data.asset.principalName} mono />
            <Row label="Domain Path" value={data.asset.domainPath} mono />
            <Row label="Privilege Level" value={data.asset.privilegeLevel} highlight />
            <p className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-xs text-zinc-400">
              {data.asset.note}
            </p>
          </div>
          {(data.linkedCaseId || data.linkedAlertId) && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border/50 pt-4">
              {data.linkedCaseId && (
                <Link
                  to={`/cases?case=${data.linkedCaseId}`}
                  className="text-xs font-medium text-violet-400 hover:underline"
                >
                  Case {data.linkedCaseId}
                </Link>
              )}
              {data.linkedAlertId && (
                <Link
                  to={`/ai-court?case=${data.linkedAlertId}`}
                  className="text-xs font-medium text-cyan-400 hover:underline"
                >
                  Alert {data.linkedAlertId}
                </Link>
              )}
            </div>
          )}
        </Card>

        {/* Risk assessment */}
        <Card className="border-zinc-800/80 bg-[#16171d] p-6 text-zinc-100 shadow-none">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-300">
              2
            </span>
            <h2 className="font-display font-bold text-zinc-50">Risk &amp; Loss Assessment</h2>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              Model: {data.assessment.model} · Std: {data.assessment.standard}
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricBox
                  label="Asset Value"
                  value={data.assessment.assetValue}
                  sub={data.assessment.assetValueNote}
                />
                <MetricBox
                  label="Threat Degree"
                  value={data.assessment.threatDegree}
                  sub={data.assessment.threatDegreeNote}
                />
                <MetricBox
                  label="Exposure Factor"
                  value={data.assessment.exposureFactor}
                  sub={data.assessment.exposureFactorNote}
                />
                <Card className="flex flex-col justify-center border-amber-500/30 bg-amber-500/5 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Resolution Window
                  </p>
                  <p className="mt-1 flex items-center gap-2 font-mono text-xl font-bold text-amber-400">
                    <Clock className="h-4 w-4" />
                    {data.resolutionWindow}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Time remaining</p>
                </Card>
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Risk Vector Breakdown
                </p>
                <div className="space-y-3">
                  {data.assessment.vectors.map((v) => (
                    <VectorBar key={v.label} v={v} />
                  ))}
                </div>
              </div>

              <div className="flex items-end justify-between border-t border-zinc-800 pt-4">
                <p className="text-xs uppercase tracking-wider text-zinc-500">
                  Enterprise ALE Projection
                </p>
                <p className="font-display text-3xl font-bold text-zinc-50">
                  ${data.assessment.enterpriseAle.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <CriticalityRing pct={data.assessment.criticalityPct} />
            </div>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <Card className="border-zinc-800/80 bg-[#16171d] p-6 text-zinc-100 shadow-none">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-300">
            3
          </span>
          <h2 className="font-display font-bold text-zinc-50">Recommended Controls</h2>
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-400">
            Priority
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.controls.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                <p className="font-semibold text-zinc-100">{c.title}</p>
              </div>
              <p className="text-sm text-zinc-400">{c.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Footer */}
      <div className="flex flex-col gap-4 border-t border-border/50 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            System status: Online
          </span>
          <span className="font-mono">ID: {data.systemId}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/cramm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to matrix
            </Link>
          </Button>
          <Button
            variant="outline"
            className="border-cyan-500/40 bg-cyan-950/20 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200"
            onClick={() => setRawOpen(true)}
          >
            <Database className="mr-2 h-4 w-4" />
            View Raw Data
          </Button>
          <Button
            className="bg-violet-600 text-white hover:bg-violet-500"
            onClick={() => setReportOpen(true)}
          >
            <FileText className="mr-2 h-4 w-4" />
            View CRAMM Risk Report
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: "rose" | "violet" | "cyan";
}) {
  const cls =
    tone === "rose"
      ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
      : tone === "cyan"
        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
        : "border-violet-500/40 bg-violet-500/10 text-violet-400";
  return (
    <span className={cn("rounded border px-2 py-0.5 font-mono text-[10px] uppercase", cls)}>
      {label}
    </span>
  );
}

function Row({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-sm text-zinc-200",
          mono && "font-mono",
          highlight && "font-medium text-amber-400"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function MetricBox({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <Card className="border-border/50 bg-muted/10 p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </Card>
  );
}
