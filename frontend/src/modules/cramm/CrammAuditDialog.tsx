import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCrammAudit } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { CrammAuditItem } from "@/lib/types";

const STATUS_META = {
  pass: {
    icon: CheckCircle2,
    label: "Pass",
    className: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  },
  warning: {
    icon: AlertCircle,
    label: "Warning",
    className: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  },
  fail: {
    icon: XCircle,
    label: "Fail",
    className: "text-rose-400 border-rose-500/40 bg-rose-500/10",
  },
} as const;

function AuditRow({ item }: { item: CrammAuditItem }) {
  const meta = STATUS_META[item.status];
  const Icon = meta.icon;
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground">{item.id}</span>
            <span className="rounded border border-border/50 px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
              {item.category}
            </span>
          </div>
          <p className="font-semibold text-foreground">{item.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          <p className="mt-2 text-sm text-foreground/80">{item.finding}</p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold",
            meta.className
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {meta.label}
        </span>
      </div>
      <div className="mt-3">
        <Link
          to={`/cramm/${item.techniqueId}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-violet-400 hover:underline"
        >
          View CRAMM analysis {item.techniqueId}
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

export function CrammAuditDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const audit = useCrammAudit(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{audit.data?.title ?? "Full Environment Audit"}</DialogTitle>
          <DialogDescription>
            {audit.data?.scope ??
              "Identity, Kerberos, and credential-access exposure across the estate."}
          </DialogDescription>
        </DialogHeader>

        {audit.isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )}

        {audit.isError && (
          <p className="text-sm text-destructive">Could not load audit data. Is the backend running?</p>
        )}

        {audit.data && (
          <div className="space-y-4">
            <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-muted-foreground">
              {audit.data.summary}
            </p>

            <div className="flex flex-wrap gap-2">
              {audit.data.linkedRisks.map((id) => (
                <Link
                  key={id}
                  to={`/cramm/${id}`}
                  onClick={() => onOpenChange(false)}
                  className="rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-0.5 font-mono text-xs text-violet-300 hover:bg-violet-500/20"
                >
                  {id}
                </Link>
              ))}
            </div>

            <div className="space-y-3">
              {audit.data.items.map((item) => (
                <AuditRow key={item.id} item={item} />
              ))}
            </div>

            <div className="flex justify-end border-t border-border/50 pt-4">
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
