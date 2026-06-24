import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowDownAZ,
  Check,
  ChevronRight,
  Clock,
  Flag,
  Layers,
  Plus,
  Search,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingState } from "@/components/States";
import { useCasesInbox, useCreateCase, useDeleteCase, usePatchCase } from "@/lib/api";
import { SEVERITY_COLORS, type Severity } from "@/lib/theme";
import type { CaseAssignee, CaseHistoryEvent, CaseStatus, InboxCase } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/auth";
import { ModuleHero } from "@/components/module";
import { CasePreviewPanel } from "./CasePreviewPanel";
import {
  COLUMNS,
  countByStatus,
  initialsFromUsername,
  isSlaBreached,
  newHistoryEvent,
  SEVERITIES,
  sortCases,
  type SortOption,
} from "./cases-helpers";


export function CasesInboxPage() {
  const { data, isLoading } = useCasesInbox();
  const createCaseMut = useCreateCase();
  const patchCaseMut = usePatchCase();
  const deleteCaseMut = useDeleteCase();
  const { username } = useAuth();
  const [searchParams] = useSearchParams();
  const deepLinkCase = searchParams.get("case");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [myCasesOnly, setMyCasesOnly] = useState(false);
  const [compact, setCompact] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("priority");
  const [priorityFilter, setPriorityFilter] = useState<Set<Severity>>(new Set());
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string[]>>({});
  const [taskChecks, setTaskChecks] = useState<Record<string, boolean[]>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [dragOverCol, setDragOverCol] = useState<CaseStatus | null>(null);

  const myInitials = initialsFromUsername(username ?? "");

  const allCases = useMemo(() => data ?? [], [data]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allCases.forEach((c) => c.tags.forEach((t) => tags.add(t)));
    return [...tags].sort();
  }, [allCases]);

  useEffect(() => {
    if (deepLinkCase && allCases.some((c) => c.id === deepLinkCase)) {
      setSelectedId(deepLinkCase);
      return;
    }
    if (allCases.length && !selectedId) {
      const firstOpen = allCases.find((c) => c.status === "open");
      if (firstOpen) setSelectedId(firstOpen.id);
    }
  }, [allCases, selectedId, deepLinkCase]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = allCases.filter((c) => {
      if (myCasesOnly && c.assignee?.initials !== myInitials) return false;
      if (priorityFilter.size > 0 && !priorityFilter.has(c.severity)) return false;
      if (tagFilter.size > 0 && !c.tags.some((t) => tagFilter.has(t))) return false;
      if (!q) return true;
      return (
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
    return sortCases(list, sortBy);
  }, [allCases, search, myCasesOnly, myInitials, priorityFilter, tagFilter, sortBy]);

  const counts = useMemo(() => countByStatus(allCases), [allCases]);
  const selected = allCases.find((c) => c.id === selectedId) ?? null;

  const persistPatch = async (
    id: string,
    patch: {
      status?: CaseStatus;
      severity?: Severity;
      assignee?: CaseAssignee | null;
      unassign?: boolean;
      flags?: number;
      tasksDone?: number;
      historyEvent?: CaseHistoryEvent;
      note?: string;
    },
    successMsg: string
  ) => {
    try {
      await patchCaseMut.mutateAsync({ caseId: id, ...patch });
      toast.success(successMsg);
    } catch {
      toast.error("Could not save case changes");
    }
  };

  const moveCase = (id: string, status: CaseStatus) => {
    const label = COLUMNS.find((c) => c.status === status)?.label ?? status;
    void persistPatch(
      id,
      {
        status,
        historyEvent: newHistoryEvent("status_change", username ?? "You", `Status changed to ${label}`),
      },
      `Case moved to ${label}`
    );
  };

  const addCase = async (c: InboxCase) => {
    try {
      await createCaseMut.mutateAsync({
        ...c,
        historyEvent: newHistoryEvent("created", username ?? "You", "Case created manually"),
      });
      setSelectedId(c.id);
      toast.success("Case created");
    } catch {
      toast.error("Could not create case — is the backend running?");
    }
  };

  const togglePriority = (s: Severity) =>
    setPriorityFilter((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });

  const toggleTag = (t: string) =>
    setTagFilter((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });

  const handleAssign = (id: string, assignee: CaseAssignee | null) => {
    void persistPatch(
      id,
      assignee
        ? {
            assignee,
            historyEvent: newHistoryEvent("assigned", username ?? "You", `Assigned to ${assignee.name}`),
          }
        : {
            unassign: true,
            historyEvent: newHistoryEvent("assigned", username ?? "You", "Case unassigned"),
          },
      assignee ? `Assigned to ${assignee.name}` : "Case unassigned"
    );
  };

  const handleSeverity = (id: string, severity: Severity) => {
    void persistPatch(
      id,
      {
        severity,
        historyEvent: newHistoryEvent("note", username ?? "You", `Priority changed to ${severity}`),
      },
      `Priority set to ${severity}`
    );
  };

  const handleFlag = (id: string) => {
    const c = allCases.find((x) => x.id === id);
    const flags = (c?.flags ?? 0) + 1;
    void persistPatch(
      id,
      {
        flags,
        historyEvent: newHistoryEvent("note", username ?? "You", "Case flagged"),
      },
      "Case flagged"
    );
  };

  const handleDelete = (id: string) => {
    void (async () => {
      try {
        await deleteCaseMut.mutateAsync(id);
        if (selectedId === id) setSelectedId(null);
        toast.success("Case removed");
      } catch {
        toast.error("Could not delete case");
      }
    })();
  };

  const handleAddNote = (id: string, text: string) => {
    setNotes((prev) => ({ ...prev, [id]: [text, ...(prev[id] ?? [])] }));
    void persistPatch(
      id,
      {
        note: text,
        historyEvent: newHistoryEvent(
          "note",
          username ?? "You",
          `Note added: ${text.slice(0, 60)}${text.length > 60 ? "…" : ""}`
        ),
      },
      "Note saved"
    );
  };

  const handleToggleTask = (id: string, index: number) => {
    const c = allCases.find((x) => x.id === id);
    if (!c) return;
    const prev = taskChecks[id] ?? Array(c.tasksTotal).fill(false);
    const next = [...prev];
    next[index] = !next[index];
    setTaskChecks((s) => ({ ...s, [id]: next }));
    void persistPatch(id, { tasksDone: next.filter(Boolean).length }, "Task updated");
  };

  const activeFilters = priorityFilter.size + tagFilter.size;

  if (isLoading) return <LoadingState label="Loading case inbox…" />;

  return (
    <div className="-mx-6 -my-6 flex h-[calc(100vh-4rem)] flex-col md:-mx-8 md:-my-8">
      <ModuleHero
        accent="cyan"
        section="Case Management"
        title="Case Inbox"
        className="shrink-0 rounded-none border-x-0 border-t-0"
        stats={[
          { label: "Open", value: counts.open, accent: "#FF7043" },
          { label: "In progress", value: counts.inProgress, accent: "#FFC107" },
          { label: "Done", value: counts.done, accent: "#2E8B6A" },
          { label: "Total", value: counts.total, accent: "#6B5CE7" },
        ]}
      />

      <div className="module-panel flex shrink-0 flex-wrap items-center gap-3 border-x-0 rounded-none border-t-0 px-6 py-3 md:px-8">
          <div className="relative max-w-md min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search cases…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 bg-background pl-9"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={activeFilters > 0 ? "secondary" : "outline"} size="sm" className="h-9 gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilters > 0 && (
                  <span className="rounded bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
                    {activeFilters}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-80 w-52 overflow-y-auto">
              <DropdownMenuLabel>Priority</DropdownMenuLabel>
              {SEVERITIES.map((s) => (
                <FilterRow key={s} active={priorityFilter.has(s)} onClick={() => togglePriority(s)}>
                  <span className="flex items-center gap-2 capitalize">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: SEVERITY_COLORS[s] }} />
                    {s}
                  </span>
                </FilterRow>
              ))}
              {allTags.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Tags</DropdownMenuLabel>
                  {allTags.map((t) => (
                    <FilterRow key={t} active={tagFilter.has(t)} onClick={() => toggleTag(t)}>
                      {t}
                    </FilterRow>
                  ))}
                </>
              )}
              {activeFilters > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <button
                    onClick={() => {
                      setPriorityFilter(new Set());
                      setTagFilter(new Set());
                    }}
                    className="w-full rounded-sm px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted"
                  >
                    Clear all filters
                  </button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <ArrowDownAZ className="h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {(
                [
                  ["priority", "Priority (critical first)"],
                  ["due", "Due date"],
                  ["newest", "Newest first"],
                  ["oldest", "Oldest first"],
                ] as const
              ).map(([key, label]) => (
                <FilterRow key={key} active={sortBy === key} onClick={() => setSortBy(key)}>
                  {label}
                </FilterRow>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              variant={myCasesOnly ? "secondary" : "outline"}
              size="sm"
              className="h-9 gap-2"
              onClick={() => setMyCasesOnly((v) => !v)}
            >
              <User className="h-4 w-4" />
              My Cases
            </Button>
            <Button
              variant={compact ? "secondary" : "outline"}
              size="sm"
              className="h-9 gap-2"
              onClick={() => setCompact((v) => !v)}
            >
              <Layers className="h-4 w-4" />
              {compact ? "Expand cards" : "Reduce all card"}
            </Button>
            <Button
              size="sm"
              className="h-9 gap-2 bg-foreground text-background hover:bg-foreground/90"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Case
            </Button>
          </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden bg-muted/20">
        {selected && (
          <CasePreviewPanel
            key={selected.id}
            caseId={selected.id}
            caseData={selected}
            notes={notes[selected.id] ?? []}
            taskChecks={taskChecks[selected.id] ?? Array(selected.tasksTotal).fill(false)}
            extraHistory={[]}
            onStatusChange={moveCase}
            onSeverityChange={handleSeverity}
            onAssign={handleAssign}
            onFlag={handleFlag}
            onDelete={handleDelete}
            onAddNote={handleAddNote}
            onToggleTask={handleToggleTask}
            username={username ?? "You"}
            myInitials={myInitials}
          />
        )}

        <div className="flex min-w-0 flex-1 gap-4 overflow-x-auto p-4 md:p-5">
          {COLUMNS.map((col) => {
            const items = filtered.filter((c) => c.status === col.status);
            return (
              <KanbanColumn
                key={col.status}
                label={col.label}
                count={items.length}
                isDragOver={dragOverCol === col.status}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverCol(col.status);
                }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(caseId) => {
                  moveCase(caseId, col.status);
                  setDragOverCol(null);
                }}
              >
                {items.map((c) => (
                  <KanbanCard
                    key={c.id}
                    c={c}
                    compact={compact}
                    selected={selectedId === c.id}
                    onSelect={() => setSelectedId(c.id)}
                  />
                ))}
                {items.length === 0 && (
                  <p className="rounded-lg border border-dashed border-border/60 py-8 text-center text-xs text-muted-foreground">
                    Drop cases here
                  </p>
                )}
              </KanbanColumn>
            );
          })}
        </div>
      </div>

      <AddCaseDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        myInitials={myInitials}
        username={username ?? "You"}
        onCreate={addCase}
      />
    </div>
  );
}

function FilterRow({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
    >
      {children}
      {active && <Check className="h-4 w-4 text-accent" />}
    </button>
  );
}

function AddCaseDialog({
  open,
  onOpenChange,
  myInitials,
  username,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  myInitials: string;
  username: string;
  onCreate: (c: InboxCase) => void | Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [status, setStatus] = useState<CaseStatus>("open");
  const [tags, setTags] = useState("");
  const [assignSelf, setAssignSelf] = useState(true);

  const reset = () => {
    setTitle("");
    setSeverity("medium");
    setStatus("open");
    setTags("");
    setAssignSelf(true);
  };

  const submit = () => {
    if (!title.trim()) return;
    const now = new Date();
    const due = new Date(now.getTime() + 8 * 3600_000);
    void onCreate({
      id: `PX-C${Math.floor(100000 + Math.random() * 899999)}`,
      title: title.trim(),
      severity,
      status,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      assignee: assignSelf ? { initials: myInitials || "ME", name: username } : null,
      createdAt: now.toISOString(),
      dueAt: due.toISOString(),
      slaHours: 8,
      elapsedHours: 0,
      tasksDone: 0,
      tasksTotal: 5,
      flags: 0,
      attachments: 0,
      aiSummary: "Manually created case. PhantomX will enrich this on the first triage pass.",
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Case</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title</label>
            <Input
              autoFocus
              placeholder="e.g. Suspicious login from new geo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Priority</label>
              <div className="flex flex-wrap gap-1.5">
                {SEVERITIES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    className={cn(
                      "rounded-md px-2 py-1 text-xs font-semibold capitalize transition-colors",
                      severity === s ? "text-white" : "text-muted-foreground hover:bg-muted"
                    )}
                    style={severity === s ? { background: SEVERITY_COLORS[s] } : undefined}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Column</label>
              <div className="flex flex-wrap gap-1.5">
                {COLUMNS.map((col) => (
                  <button
                    key={col.status}
                    type="button"
                    onClick={() => setStatus(col.status)}
                    className={cn(
                      "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                      status === col.status ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tags (comma-separated)</label>
            <Input placeholder="ransomware, endpoint" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={assignSelf}
              onChange={(e) => setAssignSelf(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            Assign to me
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!title.trim()} onClick={submit} className="bg-foreground text-background hover:bg-foreground/90">
            Create case
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KanbanColumn({
  label,
  count,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  children,
}: {
  label: string;
  count: number;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (caseId: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-w-[300px] flex-1 basis-0 flex-col rounded-xl transition-colors",
        isDragOver && "bg-accent/5 ring-2 ring-accent/30"
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("caseId");
        if (id) onDrop(id);
      }}
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <h2 className="text-sm font-semibold text-foreground">{label}</h2>
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{count}</span>
      </div>
      <div className="flex flex-col gap-2.5 overflow-y-auto pb-4">{children}</div>
    </div>
  );
}

function KanbanCard({
  c,
  compact,
  selected,
  onSelect,
}: {
  c: InboxCase;
  compact: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const breached = isSlaBreached(c);
  const [wasDragged, setWasDragged] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        setWasDragged(false);
        e.dataTransfer.setData("caseId", c.id);
      }}
      onDrag={(e) => {
        if (e.clientX !== 0 || e.clientY !== 0) setWasDragged(true);
      }}
      onDragEnd={() => setTimeout(() => setWasDragged(false), 0)}
      onClick={() => {
        if (!wasDragged) onSelect();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className={cn(
        "group w-full cursor-grab rounded-xl border bg-card p-3 text-left shadow-sm transition-all hover:shadow-md active:cursor-grabbing",
        selected ? "border-accent ring-2 ring-accent/30" : "border-border/60 hover:border-border",
        breached && "border-destructive/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <PriorityPill severity={c.severity} />
        <span className="text-mono-id text-[11px] text-muted-foreground">{c.id}</span>
        {c.assignee ? (
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent"
            title={c.assignee.name}
          >
            {c.assignee.initials}
          </span>
        ) : (
          <span className="h-6 w-6 shrink-0 rounded-full border border-dashed border-border" />
        )}
      </div>
      {!compact && (
        <>
          <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-foreground">{c.title}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {c.tags.map((t) => (
              <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        </>
      )}
      <div className="mt-2.5 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className={cn("inline-flex items-center gap-1", breached && "font-semibold text-destructive")}>
          <Clock className="h-3 w-3" />
          {c.elapsedHours}h | {c.slaHours}h
        </span>
        {c.flags > 0 && (
          <span className="inline-flex items-center gap-1 text-amber-600">
            <Flag className="h-3 w-3" />
            {c.flags}
          </span>
        )}
        <span className="ml-auto font-medium">
          {c.tasksDone}/{c.tasksTotal}
        </span>
      </div>
    </div>
  );
}

function PriorityPill({ severity }: { severity: Severity }) {
  const color = SEVERITY_COLORS[severity];
  const labels = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
      style={{ color, background: `color-mix(in srgb, ${color} 18%, transparent)` }}
    >
      {labels[severity]}
    </span>
  );
}
