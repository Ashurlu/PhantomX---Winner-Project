import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CaseAssignee } from "@/lib/types";

export function CaseAssigneeBadge({
  assignee,
  showLabel = false,
  className,
}: {
  assignee: CaseAssignee | null;
  showLabel?: boolean;
  className?: string;
}) {
  if (assignee) {
    return (
      <span
        className={cn("inline-flex items-center gap-1.5", className)}
        title={assignee.name}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">
          {assignee.initials}
        </span>
        {showLabel && (
          <span className="text-xs text-muted-foreground">
            Assigned: <span className="font-medium text-foreground">{assignee.initials}</span>
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-dashed border-border">
        <UserRound className="h-2.5 w-2.5 opacity-50" />
      </span>
      {showLabel && <span>Unassigned</span>}
    </span>
  );
}
