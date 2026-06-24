import { Database, FileText, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CrammDetail, CrammTechniqueReport } from "@/lib/types";
import { formatReportDate } from "./cramm-helpers";

function DataRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/40 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export function CrammRawDataDialog({
  open,
  onOpenChange,
  detail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: CrammDetail;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-cyan-400" />
            Raw Data — {detail.techniqueId}
          </DialogTitle>
          <DialogDescription>
            Full asset context, assessment metrics, and control metadata for this technique.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section className="rounded-xl border border-border/50 bg-card/40 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Asset context
            </h3>
            <DataRow label="Principal" value={detail.asset.name} />
            <DataRow label="Asset value" value={detail.asset.assetValue} />
            <DataRow label="Principal name" value={detail.asset.principalName} />
            <DataRow label="Domain path" value={detail.asset.domainPath} />
            <DataRow label="Privilege level" value={detail.asset.privilegeLevel} />
            <p className="mt-3 text-xs text-muted-foreground">{detail.asset.note}</p>
          </section>

          <section className="rounded-xl border border-border/50 bg-card/40 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Risk assessment
            </h3>
            <DataRow label="Model" value={detail.assessment.model} />
            <DataRow label="Standard" value={detail.assessment.standard} />
            <DataRow label="Asset value" value={detail.assessment.assetValue} />
            <DataRow label="Threat degree" value={detail.assessment.threatDegree} />
            <DataRow label="Exposure factor" value={detail.assessment.exposureFactor} />
            <DataRow label="Criticality" value={`${detail.assessment.criticalityPct}%`} />
            <DataRow
              label="Enterprise ALE"
              value={`$${detail.assessment.enterpriseAle.toLocaleString()}`}
            />
          </section>

          <section className="rounded-xl border border-border/50 bg-card/40 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Risk vectors
            </h3>
            {detail.assessment.vectors.map((v) => (
              <DataRow key={v.label} label={v.label} value={`${v.pct}%`} />
            ))}
          </section>

          <section className="rounded-xl border border-border/50 bg-card/40 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              System identifiers
            </h3>
            <DataRow label="System ID" value={detail.systemId} />
            <DataRow label="MITRE ID" value={detail.mitreId} />
            <DataRow label="CRAMM level" value={detail.crammLevel} />
            {detail.linkedCaseId && <DataRow label="Linked case" value={detail.linkedCaseId} />}
            {detail.linkedAlertId && <DataRow label="Linked alert" value={detail.linkedAlertId} />}
          </section>

          <div className="flex justify-end border-t border-border/50 pt-4">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CrammTechniqueReportDialog({
  open,
  onOpenChange,
  report,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: CrammTechniqueReport;
}) {
  const { executiveSummary: s } = report;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-violet-400" />
            CRAMM Risk Report
          </DialogTitle>
          <DialogDescription>
            {s.title} · Generated {formatReportDate(report.generatedAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Risk score", value: `${s.riskScore} (${s.riskScoreLabel})` },
              { label: "Severity", value: s.severity },
              { label: "Annual loss", value: `$${s.annualLoss.toLocaleString()}` },
              { label: "Enterprise ALE", value: `$${s.enterpriseAle.toLocaleString()}` },
              { label: "Criticality", value: `${s.criticalityPct}%` },
              { label: "Resolution window", value: s.resolutionWindow },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-border/50 bg-muted/20 p-3"
              >
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1 font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          <section>
            <h3 className="mb-2 font-semibold">Technique overview</h3>
            <p className="text-sm text-muted-foreground">{report.detail.description}</p>
          </section>

          <section>
            <h3 className="mb-3 font-semibold">Recommended controls</h3>
            <div className="space-y-3">
              {report.recommendedControls.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-border/50 bg-card/40 p-4"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    <p className="font-medium">{c.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.description}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-end border-t border-border/50 pt-4">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
