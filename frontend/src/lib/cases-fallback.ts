import casesData from "@/data/cases_inbox.json";
import type { InboxCase, InboxCaseDetail } from "@/lib/types";

const CASES = casesData as InboxCaseDetail[];

export function casesInboxFallback(): InboxCase[] {
  return CASES;
}

export function casesInboxCaseFallback(caseId: string): InboxCaseDetail {
  const found = CASES.find((c) => c.id === caseId);
  if (!found) throw new Error("Case not found");
  return found;
}
