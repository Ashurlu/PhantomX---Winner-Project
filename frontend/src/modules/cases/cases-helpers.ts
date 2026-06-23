import type { CaseAssignee, CaseHistoryEvent, CaseStatus, InboxCase } from "@/lib/types";
import type { Severity } from "@/lib/theme";

export const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];

export const COLUMNS: { status: CaseStatus; label: string }[] = [
  { status: "open", label: "Open" },
  { status: "in_progress", label: "In progress" },
  { status: "done", label: "Done" },
];

export const PRIORITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const TEAM: CaseAssignee[] = [
  { initials: "BM", name: "Ben Miller" },
  { initials: "SK", name: "Sarah Kim" },
  { initials: "JD", name: "John Doe" },
  { initials: "AL", name: "Alex Lee" },
  { initials: "MC", name: "Maria Chen" },
];

export function buildAssigneeOptions(
  platform: CaseAssignee[] | undefined,
  username: string | null,
  myInitials: string
): CaseAssignee[] {
  if (platform?.length) return platform;
  const self: CaseAssignee[] = username
    ? [{ initials: myInitials || "ME", name: `${username} (you)` }]
    : [];
  const seen = new Set(self.map((a) => a.name.toLowerCase()));
  const extras = TEAM.filter((m) => !seen.has(m.name.toLowerCase()));
  return [...self, ...extras];
}

export const TASK_LABELS = [
  "Review alert & evidence",
  "Validate affected assets",
  "Determine scope & impact",
  "Execute containment steps",
  "Document findings",
  "Notify stakeholders",
  "Collect forensic artifacts",
  "Update detection rules",
  "Close or escalate",
];

export type SortOption = "priority" | "due" | "newest" | "oldest";

const SEV_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function sortCases(cases: InboxCase[], sortBy: SortOption): InboxCase[] {
  return [...cases].sort((a, b) => {
    switch (sortBy) {
      case "priority":
        return SEV_ORDER[a.severity] - SEV_ORDER[b.severity];
      case "due":
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
  });
}

export function isSlaBreached(c: InboxCase): boolean {
  return c.status !== "done" && c.elapsedHours >= c.slaHours;
}

export function formatCaseDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatHistoryTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function initialsFromUsername(name: string) {
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function newHistoryEvent(
  type: CaseHistoryEvent["type"],
  actor: string,
  detail: string
): CaseHistoryEvent {
  return {
    id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    actor,
    detail,
    timestamp: new Date().toISOString(),
  };
}

export function countByStatus(cases: InboxCase[]) {
  return {
    open: cases.filter((c) => c.status === "open").length,
    inProgress: cases.filter((c) => c.status === "in_progress").length,
    done: cases.filter((c) => c.status === "done").length,
    total: cases.length,
  };
}
