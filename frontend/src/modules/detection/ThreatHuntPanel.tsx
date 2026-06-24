import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Check,
  ChevronDown,
  Circle,
  FileWarning,
  History,
  Loader2,
  Monitor,
  Network,
  Send,
  Sparkles,
  TableProperties,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModulePanel } from "@/components/module";
import { useThreatHunt } from "@/lib/api";
import { cn } from "@/lib/utils";
import { rangeCodeFromTimestamps, useUi } from "@/store/ui";
import type { HuntHistoryEntry, HuntResponse } from "@/lib/types";

const SUGGESTIONS = [
  "Is add_task_startup.exe malicious? How prevalent is it in our environment?",
  "What happened on HR-DC01 with PowerShell?",
  "Investigate ransomware on the finance workstation",
  "Show critical open incidents from the last 2 weeks",
];

type RightTab = "findings" | "history" | "raw";
type DiscTab = "hosts" | "files" | "network" | "other";

function statusClass(status: string) {
  if (status === "Malicious") return "bg-red-500 text-white";
  if (status === "Suspicious") return "bg-amber-500 text-white";
  if (status === "Benign") return "bg-emerald-600 text-white";
  return "bg-muted text-muted-foreground";
}

function renderMarkdownish(text: string) {
  return text.split("\n").map((line, j) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={j} className="h-1" />;
    const inline = trimmed.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^_|_$/g, "");
    if (trimmed.startsWith("_") && trimmed.endsWith("_")) {
      return (
        <p key={j} className="text-xs italic text-muted-foreground">
          {inline}
        </p>
      );
    }
    if (trimmed.startsWith("- ")) {
      return (
        <p key={j} className="text-muted-foreground">
          {inline}
        </p>
      );
    }
    if (/^\*\*.+\*\*$/.test(trimmed)) {
      return (
        <p key={j} className="font-medium text-foreground">
          {inline}
        </p>
      );
    }
    return (
      <p key={j} className="text-foreground/90">
        {inline}
      </p>
    );
  });
}

function FindingCard({
  finding,
  accent,
}: {
  finding: HuntResponse["confirmed"][0];
  accent?: boolean;
}) {
  const inner = (
    <ModulePanel
      className={cn("p-4 transition hover:shadow-seven-pop", accent && "border-red-200/60")}
    >
      <div className="flex items-start gap-3">
        <FileWarning className={cn("mt-0.5 h-5 w-5 shrink-0", accent ? "text-red-500" : "text-muted-foreground")} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">{finding.name}</span>
            {finding.status === "Malicious" && (
              <span className="seven-pulse-dot inline-block h-2 w-2 rounded-full bg-red-500" />
            )}
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", statusClass(finding.status))}>
              {finding.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{finding.summary}</p>
        </div>
      </div>
    </ModulePanel>
  );

  if (finding.path) {
    return <Link to={finding.path}>{inner}</Link>;
  }
  return inner;
}

export function ThreatHuntPanel() {
  const hunt = useThreatHunt();
  const timeFrom = useUi((s) => s.timeFrom);
  const timeTo = useUi((s) => s.timeTo);
  const timeRange = rangeCodeFromTimestamps(timeFrom, timeTo);

  const [input, setInput] = useState("");
  const [chat, setChat] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [result, setResult] = useState<HuntResponse | null>(null);
  const [huntHistory, setHuntHistory] = useState<HuntHistoryEntry[]>([]);
  const [phase, setPhase] = useState<"idle" | "thinking" | "done">("idle");
  const [thoughtSeconds, setThoughtSeconds] = useState(0);
  const [planOpen, setPlanOpen] = useState(true);
  const [rightTab, setRightTab] = useState<RightTab>("findings");
  const [discTab, setDiscTab] = useState<DiscTab>("hosts");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat, phase, result]);

  const runHunt = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || hunt.isPending) return;

      const userMsg = { role: "user" as const, content: trimmed };
      const nextChat = [...chat, userMsg];
      setChat(nextChat);
      setInput("");
      setPhase("thinking");
      setRightTab("findings");

      try {
        const res = await hunt.mutateAsync({
          message: trimmed,
          history: nextChat,
          time_range: timeRange,
          context_path: "/detection",
        });
        setResult(res);
        setThoughtSeconds(res.thought_seconds);
        setChat((c) => [...c, { role: "assistant", content: res.reply }]);
        setHuntHistory((h) => [
          {
            query: res.query,
            ran_at: res.ran_at,
            confirmed: res.confirmed.length,
            leads: res.leads.length,
            summary: res.reply.split("\n")[0]?.replace(/\*\*/g, "") ?? res.query,
          },
          ...h,
        ].slice(0, 20));
        setPhase("done");
      } catch {
        setChat((c) => [
          ...c,
          {
            role: "assistant",
            content:
              "Could not reach the hunt service. Ensure the backend is running and includes the /api/v1/hunt endpoint.",
          },
        ]);
        setPhase("done");
      }
    },
    [chat, hunt, timeRange]
  );

  const discoveries = result?.discoveries;
  const discTotal =
    (discoveries?.hosts.length ?? 0) +
    (discoveries?.files.length ?? 0) +
    (discoveries?.network.length ?? 0) +
    (discoveries?.other.length ?? 0);

  const discItems =
    discTab === "hosts"
      ? discoveries?.hosts ?? []
      : discTab === "files"
        ? discoveries?.files ?? []
        : discTab === "network"
          ? discoveries?.network ?? []
          : discoveries?.other ?? [];

  return (
    <div className="grid min-h-[620px] gap-0 overflow-hidden rounded-xl border border-border lg:grid-cols-[360px_1fr]">
      {/* Action Items */}
      <div className="flex flex-col border-b border-border bg-[#F6F6F8] dark:bg-muted/20 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Action Items
          </p>
          <span className="text-[11px] text-muted-foreground">{timeRange} window</span>
        </div>

        <div ref={scrollRef} className="min-h-[280px] flex-1 space-y-3 overflow-y-auto p-4">
          {chat.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <Sparkles className="h-8 w-8 text-[#6B5CE7]" />
              <p className="text-sm text-muted-foreground">
                Ask about a file, host, or IOC. Results populate on the right with an investigation plan.
              </p>
            </div>
          ) : (
            chat.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm leading-relaxed",
                  m.role === "user"
                    ? "ml-4 bg-white shadow-sm ring-1 ring-border/40 dark:bg-card"
                    : "mr-2 bg-white/90 dark:bg-card/80"
                )}
              >
                {renderMarkdownish(m.content)}
              </motion.div>
            ))
          )}

          {phase === "thinking" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Investigating across cases, alerts, and rules…
            </div>
          )}

          {phase === "done" && result && result.plan.length > 0 && (
            <div className="rounded-lg border border-border/60 bg-white/90 p-3 dark:bg-card/80">
              <button
                type="button"
                onClick={() => setPlanOpen((o) => !o)}
                className="flex w-full items-center gap-1 text-xs font-semibold text-foreground"
              >
                <ChevronDown className={cn("h-3.5 w-3.5 transition", planOpen && "rotate-180")} />
                Investigation plan
              </button>
              {planOpen && (
                <ul className="mt-2 space-y-2">
                  {result.plan.map((step, i) => (
                    <li key={i} className="flex gap-2 text-xs">
                      {step.done ? (
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      ) : (
                        <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{step.label}</p>
                        <p className="text-muted-foreground">{step.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {thoughtSeconds > 0 && (
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Completed in ~{thoughtSeconds}s · {result.source}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 border-t border-border/60 px-3 py-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={hunt.isPending}
              className="rounded-full border border-border/60 bg-white/80 px-2.5 py-0.5 text-[10px] text-muted-foreground hover:bg-white dark:bg-card"
              onClick={() => runHunt(s)}
            >
              {s.length > 42 ? `${s.slice(0, 42)}…` : s}
            </button>
          ))}
        </div>

        <form
          className="flex gap-2 border-t border-border p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void runHunt(input);
          }}
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void runHunt(input);
              }
            }}
            placeholder="Ask about a file, host, IOC…"
            className="min-h-[36px] max-h-24 flex-1 resize-none bg-white text-sm dark:bg-card"
            rows={1}
            disabled={hunt.isPending}
          />
          <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!input.trim() || hunt.isPending}>
            {hunt.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>

      {/* Results */}
      <div className="flex flex-col bg-background">
        <div className="border-b border-border px-5 py-3">
          <p className="text-sm font-semibold text-foreground">Leads &amp; Findings</p>
          <div className="mt-2 flex gap-4 text-xs">
            {(
              [
                ["findings", "Leads & Findings"],
                ["history", "Hunt History"],
                ["raw", "Raw Results"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setRightTab(id)}
                className={cn(
                  "transition",
                  rightTab === id ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!result && rightTab === "findings" && (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <Bot className="h-10 w-10 opacity-40" />
              <p>Run a hunt query to populate confirmed findings, leads, and discoveries.</p>
            </div>
          )}

          {rightTab === "findings" && result && (
            <div className="space-y-5">
              <section>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Confirmed Findings ({result.confirmed.length})
                </p>
                {result.confirmed.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No confirmed findings for this query.</p>
                ) : (
                  <div className="space-y-2">
                    {result.confirmed.map((f, i) => (
                      <motion.div
                        key={f.id}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        <FindingCard finding={f} accent />
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Potential Leads ({result.leads.length})
                </p>
                {result.leads.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No additional leads.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {result.leads.map((l, i) => (
                      <motion.div
                        key={l.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.06 }}
                      >
                        <FindingCard finding={l} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>

              {discTotal > 0 && (
                <section>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    All Discoveries ({discTotal})
                  </p>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {(
                      [
                        ["hosts", Monitor, discoveries?.hosts.length ?? 0],
                        ["files", FileWarning, discoveries?.files.length ?? 0],
                        ["network", Network, discoveries?.network.length ?? 0],
                        ["other", TableProperties, discoveries?.other.length ?? 0],
                      ] as const
                    ).map(([key, Icon, count]) =>
                      count > 0 ? (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setDiscTab(key)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium capitalize transition",
                            discTab === key
                              ? "bg-foreground text-background"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {key} ({count})
                        </button>
                      ) : null
                    )}
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={discTab}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-1"
                    >
                      {discItems.map((item, i) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm"
                        >
                          <span className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                              {discTab === "hosts" ? `h${i + 1}` : discTab === "files" ? "f" : discTab === "network" ? "n" : "o"}
                            </span>
                            {item.label}
                          </span>
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px]", statusClass(item.status))}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </section>
              )}

              {result.actions.length > 0 && (
                <section className="flex flex-wrap gap-2 border-t border-border pt-4">
                  {result.actions.map((a) => (
                    <Link
                      key={a.path + a.label}
                      to={a.path}
                      className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs hover:bg-muted"
                    >
                      → {a.label}
                    </Link>
                  ))}
                </section>
              )}
            </div>
          )}

          {rightTab === "history" && (
            <div className="space-y-2">
              {huntHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">Past hunts appear here after you run a query.</p>
              ) : (
                huntHistory.map((h, i) => (
                  <button
                    key={`${h.ran_at}-${i}`}
                    type="button"
                    className="flex w-full flex-col rounded-lg border border-border/60 px-4 py-3 text-left hover:bg-muted/30"
                    onClick={() => runHunt(h.query)}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <History className="h-3.5 w-3.5 text-muted-foreground" />
                      {h.query}
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      {h.confirmed} confirmed · {h.leads} leads · {new Date(h.ran_at).toLocaleString()}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {rightTab === "raw" && (
            <div>
              {!result || result.raw.length === 0 ? (
                <p className="text-sm text-muted-foreground">Raw SOC matches JSON appears after a hunt.</p>
              ) : (
                <pre className="code-panel max-h-[480px] overflow-auto text-[11px]">
                  {JSON.stringify(result.raw, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
