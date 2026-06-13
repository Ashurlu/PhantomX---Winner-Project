import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Code2,
  Pencil,
  Save,
  X,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import {
  useApproveRule,
  useRejectRule,
  useRule,
  useUpdateRule,
} from "@/lib/api";
import { useAuth } from "@/store/auth";
import type { RuleDetail, Severity } from "@/lib/types";

export function RuleDetailDialog({
  ruleId,
  open,
  onClose,
}: {
  ruleId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useRule(open ? ruleId : null);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        {isLoading || !data ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <RuleBody key={data.id} data={data} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];

function RuleBody({ data, onClose }: { data: RuleDetail; onClose: () => void }) {
  const isAdmin = useAuth((s) => s.role === "admin");
  const update = useUpdateRule();
  const approve = useApproveRule();
  const reject = useRejectRule();

  const [editing, setEditing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [queryTab, setQueryTab] = useState<"sigma" | "kql">("sigma");

  const [form, setForm] = useState({
    title: data.title,
    description: data.description,
    severity: data.severity,
    sigma: data.sigma,
    kql: data.kql,
  });

  useEffect(() => {
    setForm({
      title: data.title,
      description: data.description,
      severity: data.severity,
      sigma: data.sigma,
      kql: data.kql,
    });
  }, [data]);

  const busy =
    update.isPending || approve.isPending || reject.isPending;

  const saveEdit = async () => {
    try {
      await update.mutateAsync({ id: data.id, patch: form });
      toast.success("Rule updated", { description: `${data.id} saved.` });
      setEditing(false);
    } catch (e) {
      toast.error("Update failed", { description: String((e as Error).message) });
    }
  };

  const doApprove = async () => {
    try {
      await approve.mutateAsync(data.id);
      toast.success("Rule approved", {
        description: `${data.id} stored with status approved.`,
      });
      onClose();
    } catch (e) {
      toast.error("Approve failed", { description: String((e as Error).message) });
    }
  };

  const doReject = async () => {
    if (!reason.trim()) {
      toast.error("Reason required", {
        description: "A rejection reason is mandatory.",
      });
      return;
    }
    try {
      await reject.mutateAsync({ id: data.id, reason: reason.trim() });
      toast.success("Rule rejected", { description: `${data.id} rejected.` });
      onClose();
    } catch (e) {
      toast.error("Reject failed", { description: String((e as Error).message) });
    }
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-secondary">{data.id}</span>
          <SeverityBadge severity={editing ? form.severity : data.severity} />
          <StatusPill status={data.status} />
          <Badge variant="secondary" className="text-[10px]">
            {data.category === "ad" ? "Active Directory" : "Incident Response"}
          </Badge>
          <span className="ml-auto font-mono text-xs text-muted-foreground">
            from {data.sourceAlertId}
          </span>
        </div>
        {editing ? (
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-1 text-lg"
          />
        ) : (
          <DialogTitle className="mt-1 text-xl">{data.title}</DialogTitle>
        )}
      </DialogHeader>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase text-muted-foreground">
          Description
        </label>
        {editing ? (
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        ) : (
          <p className="text-sm text-foreground/90">{data.description}</p>
        )}
      </div>

      {/* Severity (edit) */}
      {editing && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase text-muted-foreground">
            Severity
          </label>
          <div className="flex gap-2">
            {SEVERITIES.map((s) => (
              <button
                key={s}
                onClick={() => setForm({ ...form, severity: s })}
                className={`rounded-md border px-3 py-1 text-xs capitalize transition-colors ${
                  form.severity === s
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Detection content: Sigma (primary) + KQL (translated) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
            <Code2 className="h-3.5 w-3.5" /> Detection
          </label>
          <div className="ml-auto flex gap-1 rounded-md border border-border/40 bg-card/50 p-0.5">
            <button
              onClick={() => setQueryTab("sigma")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                queryTab === "sigma" ? "bg-primary/20 text-primary" : "text-muted-foreground"
              }`}
            >
              Sigma (YAML)
            </button>
            <button
              onClick={() => setQueryTab("kql")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                queryTab === "kql" ? "bg-primary/20 text-primary" : "text-muted-foreground"
              }`}
            >
              KQL
            </button>
          </div>
        </div>
        {queryTab === "sigma" ? (
          editing ? (
            <Textarea
              value={form.sigma}
              onChange={(e) => setForm({ ...form, sigma: e.target.value })}
              className="min-h-[220px] font-mono text-xs"
              spellCheck={false}
            />
          ) : (
            <pre className="overflow-x-auto rounded-lg border border-border/40 bg-[#0c0c14] p-4 font-mono text-xs leading-relaxed text-secondary">
              {data.sigma}
            </pre>
          )
        ) : editing ? (
          <Textarea
            value={form.kql}
            onChange={(e) => setForm({ ...form, kql: e.target.value })}
            className="min-h-[160px] font-mono text-xs"
            spellCheck={false}
          />
        ) : (
          <pre className="overflow-x-auto rounded-lg border border-border/40 bg-[#0c0c14] p-4 font-mono text-xs leading-relaxed text-secondary">
            {data.kql || "— no KQL translation —"}
          </pre>
        )}
      </div>

      {/* Reject reason display */}
      {data.status === "rejected" && data.rejectReason && !rejecting && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-xs font-semibold uppercase text-destructive">
            Rejection reason
          </p>
          <p className="mt-1 text-sm text-foreground/90">{data.rejectReason}</p>
        </div>
      )}

      {/* Reject form */}
      {rejecting && (
        <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <label className="text-xs font-semibold uppercase text-destructive">
            Rejection reason (required)
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this rule is being rejected…"
            autoFocus
          />
        </div>
      )}

      {/* Actions */}
      {isAdmin ? (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/40 pt-4">
          {editing ? (
            <>
              <Button variant="ghost" onClick={() => setEditing(false)} disabled={busy}>
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button onClick={saveEdit} disabled={busy}>
                <Save className="h-4 w-4" /> Save
              </Button>
            </>
          ) : rejecting ? (
            <>
              <Button variant="ghost" onClick={() => setRejecting(false)} disabled={busy}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={doReject} disabled={busy}>
                <XCircle className="h-4 w-4" /> Confirm reject
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditing(true)} disabled={busy}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => setRejecting(true)}
                disabled={busy || data.status === "rejected"}
              >
                <XCircle className="h-4 w-4" /> Reject
              </Button>
              <Button
                onClick={doApprove}
                disabled={busy || data.status === "approved"}
              >
                <CheckCircle2 className="h-4 w-4" /> Approve
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="border-t border-border/40 pt-4">
          <Badge variant="outline" className="text-xs">
            Analysts have read-only access to rules.
          </Badge>
        </div>
      )}
    </>
  );
}

function StatusPill({ status }: { status: RuleDetail["status"] }) {
  const map = {
    pending: { cls: "bg-accent/15 text-accent", label: "Pending" },
    approved: { cls: "bg-severity-resolved/15 text-severity-resolved", label: "Approved" },
    rejected: { cls: "bg-destructive/15 text-destructive", label: "Rejected" },
  } as const;
  const m = map[status];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.cls}`}>
      {m.label}
    </span>
  );
}
