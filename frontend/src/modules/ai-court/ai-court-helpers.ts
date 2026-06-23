import type { CaseAssignee, CaseSummary, InboxCase } from "@/lib/types";

export function inboxByLinkedCase(
  inbox: InboxCase[] | undefined,
  linkedCaseId?: string | null,
  alertId?: string
): InboxCase | undefined {
  if (!inbox?.length) return undefined;
  if (linkedCaseId) {
    const byId = inbox.find((c) => c.id === linkedCaseId);
    if (byId) return byId;
  }
  if (alertId) {
    return inbox.find((c) => c.sourceAlertId === alertId);
  }
  return undefined;
}

export function resolveAssignee(
  inbox: InboxCase[] | undefined,
  courtCase: Pick<CaseSummary, "alertId" | "linkedCaseId">
): CaseAssignee | null {
  return inboxByLinkedCase(inbox, courtCase.linkedCaseId, courtCase.alertId)?.assignee ?? null;
}
