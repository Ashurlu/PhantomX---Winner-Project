import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Bot,
  Flag,
  MoreHorizontal,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCasesInboxCase, useCaseAssignees } from "@/lib/api";
import { SEVERITY_COLORS, type Severity } from "@/lib/theme";
import type { CaseAssignee, CaseHistoryEvent, CaseStatus, InboxCase } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  COLUMNS,
  buildAssigneeOptions,
  formatCaseDate,
  formatHistoryTime,
  PRIORITY_LABEL,
  TASK_LABELS,
} from "./cases-helpers";

function PriorityPill({ severity }: { severity: Severity }) {
  const color = SEVERITY_COLORS[severity];
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
      style={{
        color,
        background: `color-mix(in srgb, ${color} 18%, transparent)`,
      }}
    >
      {PRIORITY_LABEL[severity]}
    </span>
  );
}

export function CasePreviewPanel({
  caseId,
  caseData,
  notes,
  taskChecks,
  extraHistory,
  onStatusChange,
  onSeverityChange,
  onAssign,
  onFlag,
  onDelete,
  onAddNote,
  onToggleTask,
  username,
  myInitials,
}: {
  /** Explicit id — always use this for mutations, not inferred from merged data */
  caseId: string;
  caseData: InboxCase;
  notes: string[];
  taskChecks: boolean[];
  extraHistory: CaseHistoryEvent[];
  onStatusChange: (id: string, status: CaseStatus) => void;
  onSeverityChange: (id: string, severity: Severity) => void;
  onAssign: (id: string, assignee: CaseAssignee | null) => void;
  onFlag: (id: string) => void;
  onDelete: (id: string) => void;
  onAddNote: (id: string, text: string) => void;
  onToggleTask: (id: string, index: number) => void;
  username: string;
  myInitials: string;
}) {
  const { data: fetchedDetail } = useCasesInboxCase(caseId);
  const { data: platformAssignees } = useCaseAssignees();
  const [noteDraft, setNoteDraft] = useState("");

  const assigneeOptions = useMemo(
    () => buildAssigneeOptions(platformAssignees, username, myInitials),
    [platformAssignees, username, myInitials]
  );

  // caseData from parent is the live source of truth (patches, assignee, status)
  const data = caseData;

  const history = useMemo(() => {
    const fromApi =
      fetchedDetail?.id === caseId ? (fetchedDetail.history ?? []) : [];
    return [...extraHistory, ...fromApi];
  }, [caseId, extraHistory, fetchedDetail]);

  const taskLabels = TASK_LABELS.slice(0, data.tasksTotal);

  const submitNote = () => {
    const text = noteDraft.trim();
    if (!text) return;
    onAddNote(caseId, text);
    setNoteDraft("");
  };

  const assignMe = { initials: myInitials || "ME", name: username };

  return (
    <aside className="flex w-[380px] shrink-0 flex-col border-r border-border/60 bg-card">
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="line-clamp-2 text-base font-semibold leading-snug">{data.title}</h2>
          <DropdownMenu key={`actions-${caseId}`}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted"
                aria-label="Case actions"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>More actions</DropdownMenuLabel>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  onAssign(caseId, assignMe);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Assign to me
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  onFlag(caseId);
                }}
              >
                <Flag className="mr-2 h-4 w-4" />
                Flag case
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Change priority</DropdownMenuLabel>
              {(["critical", "high", "medium", "low"] as Severity[]).map((s) => (
                <DropdownMenuItem
                  key={s}
                  onSelect={(e) => {
                    e.preventDefault();
                    onSeverityChange(caseId, s);
                  }}
                >
                  <span className="mr-2 h-2 w-2 rounded-full" style={{ background: SEVERITY_COLORS[s] }} />
                  {PRIORITY_LABEL[s]}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  onDelete(caseId);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete case
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
          {data.sourceAlertId ? (
            <Link
              to={`/ai-court?case=${encodeURIComponent(data.sourceAlertId)}`}
              className="font-medium text-accent hover:underline"
            >
              AI Court · {data.sourceAlertId}
            </Link>
          ) : (
            <Link to="/ai-court" className="font-medium text-accent hover:underline">
              Open AI Court
            </Link>
          )}
          {data.linkedRuleId && (
            <Link
              to={`/rules?rule=${encodeURIComponent(data.linkedRuleId)}`}
              className="font-medium text-accent hover:underline"
            >
              Rule {data.linkedRuleId}
            </Link>
          )}
          {data.flags > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-600">
              <Flag className="h-3 w-3" />
              Flagged
            </span>
          )}
        </div>

        {(data.sourceAlertId || data.linkedRuleId) && (
          <dl className="mt-3 space-y-2 rounded-lg border border-border/40 bg-muted/20 p-3 text-xs">
            {data.sourceAlertId && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Source alert</span>
                <span className="font-mono font-semibold">{data.sourceAlertId}</span>
              </div>
            )}
            {data.linkedRuleId && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Linked rule</span>
                <span className="font-mono font-semibold">{data.linkedRuleId}</span>
              </div>
            )}
          </dl>
        )}

        <dl className="mt-5 space-y-3 text-sm">
          <MetaRow label="Created time" value={formatCaseDate(data.createdAt)} />
          <MetaRow
            label="Status"
            value={
              <div className="inline-flex overflow-hidden rounded-md border border-border">
                {COLUMNS.map((col, i) => (
                  <button
                    key={col.status}
                    type="button"
                    onClick={() => onStatusChange(caseId, col.status)}
                    className={cn(
                      "px-2 py-1 text-[11px] font-medium transition-colors",
                      i > 0 && "border-l border-border",
                      data.status === col.status
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            }
          />
          <MetaRow label="Priority" value={<PriorityPill severity={data.severity} />} />
          <MetaRow label="Due date" value={formatCaseDate(data.dueAt)} />
          <MetaRow
            label="Tags"
            value={
              <div className="flex flex-wrap gap-1">
                {data.tags.map((t) => (
                  <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            }
          />
          <MetaRow
            label="Assignees"
            value={
              <DropdownMenu key={`assignee-${caseId}`}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="text-left hover:underline"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    {data.assignee ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                          {data.assignee.initials}
                        </span>
                        {data.assignee.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Unassigned — click to assign</span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {assigneeOptions.map((m) => (
                    <DropdownMenuItem
                      key={m.name}
                      onSelect={(e) => {
                        e.preventDefault();
                        onAssign(caseId, m);
                      }}
                    >
                      <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">
                        {m.initials}
                      </span>
                      {m.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      onAssign(caseId, null);
                    }}
                  >
                    Unassign
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          />
        </dl>

        {data.status !== "done" && data.elapsedHours >= data.slaHours && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            SLA breached — {data.elapsedHours}h elapsed / {data.slaHours}h limit
          </div>
        )}

        <div className="mt-5 rounded-lg border border-border/50 bg-muted/30 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Bot className="h-3.5 w-3.5 text-accent" />
            PhantomX Case Summary
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">{data.aiSummary}</p>
        </div>

        <Tabs defaultValue="tasks" className="mt-5">
          <TabsList className="h-9 w-full justify-start rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger
              value="tasks"
              className="rounded-none border-b-2 border-transparent px-3 pb-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent"
            >
              My tasks
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-none border-b-2 border-transparent px-3 pb-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent"
            >
              Case History
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="rounded-none border-b-2 border-transparent px-3 pb-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent"
            >
              Notes {notes.length > 0 && `(${notes.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-3 space-y-2">
            <p className="mb-2 text-xs text-muted-foreground">
              {data.tasksDone} of {data.tasksTotal} completed
            </p>
            {taskLabels.map((label, i) => (
              <label
                key={i}
                className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/40 p-2.5 hover:bg-muted/30"
              >
                <input
                  type="checkbox"
                  checked={taskChecks[i] ?? false}
                  onChange={() => onToggleTask(caseId, i)}
                  className="mt-0.5 h-4 w-4 accent-accent"
                />
                <span className={cn("text-sm", taskChecks[i] && "text-muted-foreground line-through")}>
                  {label}
                </span>
              </label>
            ))}
          </TabsContent>

          <TabsContent value="history" className="mt-3">
            <ul className="space-y-4">
              {history.length === 0 ? (
                <li className="text-xs italic text-muted-foreground">No history yet.</li>
              ) : (
                history.map((ev) => (
                  <li
                    key={ev.id}
                    className="relative pl-4 before:absolute before:left-0 before:top-1.5 before:h-2 before:w-2 before:rounded-full before:bg-border"
                  >
                    <p className="text-sm font-medium">{ev.detail}</p>
                    <p className="text-xs text-muted-foreground">
                      {ev.actor} · {formatHistoryTime(ev.timestamp)}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </TabsContent>

          <TabsContent value="notes" className="mt-3 space-y-3">
            <div className="flex flex-col gap-2">
              <Textarea
                placeholder="Add a note…"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={3}
              />
              <Button size="sm" disabled={!noteDraft.trim()} onClick={submitNote} className="self-end">
                Save note
              </Button>
            </div>
            {notes.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">No notes yet.</p>
            ) : (
              <ul className="space-y-2">
                {notes.map((n, i) => (
                  <li key={i} className="rounded-lg border border-border/40 bg-muted/20 p-2.5 text-sm">
                    {n}
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div className="shrink-0 border-t border-border/60 p-4">
        <Button asChild className="w-full bg-foreground text-background hover:bg-foreground/90">
          <Link
            to={
              data.sourceAlertId
                ? `/ai-court?case=${encodeURIComponent(data.sourceAlertId)}`
                : "/ai-court"
            }
          >
            View in AI Court
          </Link>
        </Button>
      </div>
    </aside>
  );
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-start gap-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-xs font-medium text-foreground">{value}</dd>
    </div>
  );
}
