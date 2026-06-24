import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  FileSearch,
  Gavel,
  ListOrdered,
  Scale,
  ShieldX,
  Sword,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiCourtCase, useAiCourtCases, useCasesInbox, useRules } from "@/lib/api";
import { CaseAssigneeBadge } from "./CaseAssigneeBadge";
import { resolveAssignee } from "./ai-court-helpers";
import type { CaseDetail } from "@/lib/types";

export function CaseDetailDialog({
  alertId,
  open,
  onClose,
}: {
  alertId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useAiCourtCase(open ? alertId : null);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        {isLoading || !data ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <CaseBody data={data} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function confidenceMeta(confidence: number) {
  const pct = Math.round(confidence * 100);
  if (pct >= 85) return { color: "#10B981", label: "High confidence — strong true positive" };
  if (pct >= 65) return { color: "#8B5CF6", label: "Moderate confidence — corroborated by evidence" };
  if (pct >= 45) return { color: "#F59E0B", label: "Low confidence — review recommended" };
  return { color: "#EF4444", label: "Uncertain — manual validation required" };
}

function CaseBody({ data, onClose }: { data: CaseDetail; onClose?: () => void }) {
  const rules = useRules();
  const courtCases = useAiCourtCases();
  const inbox = useCasesInbox();
  const linkedRule = rules.data?.find((r) => r.sourceAlertId === data.alertId);
  const courtSummary = courtCases.data?.find((c) => c.alertId === data.alertId);
  const linkedCaseId = courtSummary?.linkedCaseId;
  const assignee = courtSummary ? resolveAssignee(inbox.data, courtSummary) : null;
  const conf = confidenceMeta(data.tribunal.confidence);
  const pct = Math.round(data.tribunal.confidence * 100);

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <span className="text-mono-id text-sm">{data.alertId}</span>
          <SeverityBadge severity={data.severity} />
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-severity-resolved/15 px-3 py-1 text-xs font-bold text-severity-resolved">
            <CheckCircle2 className="h-3.5 w-3.5" />
            TRUE POSITIVE
          </span>
        </div>
        <DialogTitle className="mt-1 text-xl">{data.title}</DialogTitle>
      </DialogHeader>

      {linkedRule && (
        <Link
          to={`/rules?rule=${encodeURIComponent(linkedRule.id)}`}
          onClick={onClose}
          className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-sm transition-colors hover:bg-accent/10"
        >
          <span className="text-muted-foreground">
            n8n proposed rule{" "}
            <span className="font-mono font-semibold text-foreground">{linkedRule.id}</span>
          </span>
          <span className="text-xs font-medium text-accent">View rule →</span>
        </Link>
      )}

      {linkedCaseId && (
        <Link
          to={`/cases?case=${encodeURIComponent(linkedCaseId)}`}
          onClick={onClose}
          className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm transition-colors hover:bg-primary/10"
        >
          <span className="text-muted-foreground">
            Incident case{" "}
            <span className="font-mono font-semibold text-foreground">{linkedCaseId}</span>
          </span>
          <div className="flex items-center gap-3">
            <CaseAssigneeBadge assignee={assignee} showLabel />
            <span className="text-xs font-medium text-primary">Open in Cases →</span>
          </div>
        </Link>
      )}

      {!linkedCaseId && (
        <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Incident case assignment</span>
          <CaseAssigneeBadge assignee={assignee} showLabel />
        </div>
      )}

      {/* Confidence */}
      <div className="rounded-lg border border-border/50 bg-muted/25 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Scale className="h-4 w-4 text-muted-foreground" />
            Verdict confidence
          </span>
          <span
            className="font-display text-2xl font-bold tabular-nums"
            style={{ color: conf.color }}
          >
            {pct}%
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-border/50">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: conf.color,
              boxShadow: `0 0 10px color-mix(in srgb, ${conf.color} 45%, transparent)`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{conf.label}</p>
      </div>

      {/* Evidence */}
      <Section icon={FileSearch} title="Evidence">
        <div className="flex flex-col gap-2">
          {data.evidence.map((e, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-lg border border-border/40 bg-background/40 p-2.5"
            >
              <span className="shrink-0 rounded bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-accent">
                {e.type}
              </span>
              <span className="font-mono text-xs text-foreground/90">{e.detail}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Prosecutor vs Defender */}
      <div className="grid gap-3 sm:grid-cols-2">
        <ArgColumn
          icon={Sword}
          title="Prosecutor"
          color="#EF4444"
          points={data.tribunal.prosecutor}
        />
        <ArgColumn
          icon={ShieldX}
          title="Defender"
          color="#3B82F6"
          points={data.tribunal.defender}
        />
      </div>

      {/* Recommendation */}
      <Section icon={ListOrdered} title="Recommended Remediation">
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <SeverityBadge severity={data.recommendation.severity} />
            <span className="ml-auto flex items-center gap-1.5 text-mono-id text-xs">
              <Gavel className="h-3.5 w-3.5" />
              {data.recommendation.playbook}
            </span>
          </div>
          <ol className="flex flex-col gap-2">
            {data.recommendation.actionItems.map((a, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 font-mono text-xs font-bold text-primary">
                  {i + 1}
                </span>
                {a}
              </li>
            ))}
          </ol>
        </div>
      </Section>
    </>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof FileSearch;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Icon className="h-4 w-4" /> {title}
      </h3>
      {children}
    </div>
  );
}

function ArgColumn({
  icon: Icon,
  title,
  color,
  points,
}: {
  icon: typeof Sword;
  title: string;
  color: string;
  points: { point: string; weight: number }[];
}) {
  return (
    <div
      className="flex flex-col gap-2 rounded-lg border p-3"
      style={{ borderColor: `color-mix(in srgb, ${color} 35%, transparent)` }}
    >
      <span
        className="flex items-center gap-2 text-sm font-semibold"
        style={{ color }}
      >
        <Icon className="h-4 w-4" /> {title}
      </span>
      {points.map((p, i) => (
        <div key={i} className="flex flex-col gap-1">
          <span className="text-xs text-foreground/90">{p.point}</span>
          <div className="h-1.5 overflow-hidden rounded-full bg-background/60">
            <div
              className="h-full rounded-full"
              style={{ width: `${p.weight * 100}%`, background: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
