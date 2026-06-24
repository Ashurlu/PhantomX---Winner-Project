import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bot,
  ChevronUp,
  Eraser,
  Loader2,
  Maximize2,
  Minimize2,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useSocChat } from "@/lib/api";
import {
  clearSocChatHistory,
  loadSocChatHistory,
  saveSocChatHistory,
  SOC_MODES,
  SOC_SCOPES,
  suggestionsForPath,
  type SocChatMode,
  type SocChatScope,
} from "@/lib/soc-chat";
import { rangeCodeFromTimestamps, useUi } from "@/store/ui";
import type { ChatMessage } from "@/lib/types";

function SourceBadge({ source, mode }: { source?: ChatMessage["source"]; mode?: SocChatMode }) {
  const parts: string[] = [];
  if (mode && mode !== "auto") parts.push(mode);
  if (source) {
    parts.push(
      source === "local"
        ? "local"
        : source === "openrouter"
          ? "OpenRouter"
          : source === "openai"
            ? "OpenAI"
            : "Anthropic"
    );
  }
  if (parts.length === 0) return null;
  return (
    <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
      {parts.join(" · ")}
    </span>
  );
}

function MessageBody({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;
        const bold = trimmed.match(/^\*\*(.+)\*\*$/);
        if (bold) {
          return (
            <p key={i} className="font-medium text-foreground">
              {bold[1]}
            </p>
          );
        }
        const inline = trimmed.replace(/\*\*(.+?)\*\*/g, "$1");
        if (trimmed.startsWith("- ")) {
          return (
            <p key={i} className="text-muted-foreground">
              {inline}
            </p>
          );
        }
        if (trimmed.startsWith("_") && trimmed.endsWith("_")) {
          return (
            <p key={i} className="text-xs italic text-muted-foreground">
              {trimmed.slice(1, -1)}
            </p>
          );
        }
        return (
          <p key={i} className="text-muted-foreground">
            {inline}
          </p>
        );
      })}
    </div>
  );
}

export function SocChatbot() {
  const location = useLocation();
  const timeFrom = useUi((s) => s.timeFrom);
  const timeTo = useUi((s) => s.timeTo);
  const timeRange = rangeCodeFromTimestamps(timeFrom, timeTo);

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<SocChatMode>("auto");
  const [scope, setScope] = useState<SocChatScope>("all");
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadSocChatHistory());

  const scrollRef = useRef<HTMLDivElement>(null);
  const chat = useSocChat();

  const suggestions = useMemo(
    () => suggestionsForPath(location.pathname),
    [location.pathname]
  );

  useEffect(() => {
    saveSocChatHistory(messages);
  }, [messages]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, chat.isPending]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || chat.isPending) return;

      const userMsg: ChatMessage = { role: "user", content: trimmed };
      const next = [...messages, userMsg];
      setMessages(next);
      setInput("");
      setOpen(true);

      try {
        const history = next
          .slice(0, -1)
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await chat.mutateAsync({
          message: trimmed,
          history,
          mode,
          scope,
          context_path: location.pathname,
          time_range: timeRange,
        });
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: res.reply,
            source: res.source,
            citations: res.citations,
            actions: res.actions,
            mode: res.mode ?? mode,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry — I couldn't reach the chat service. Is the backend running?",
            source: "local",
          },
        ]);
      }
    },
    [chat, messages, mode, scope, location.pathname, timeRange]
  );

  const handleClear = () => {
    setMessages(clearSocChatHistory());
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 md:px-6">
      <div
        className={cn(
          "pointer-events-auto flex w-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-background/95 shadow-2xl shadow-black/30 backdrop-blur-xl transition-all duration-300",
          !open && "max-h-14",
          open && !expanded && "max-h-[min(560px,72vh)]",
          open && expanded && "max-h-[min(720px,85vh)]",
          expanded ? "max-w-4xl" : "max-w-3xl"
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-14 shrink-0 items-center gap-3 border-b border-border/50 px-4 text-left"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Bot className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">SOC Assistant</p>
            <p className="truncate text-xs text-muted-foreground">
              {mode !== "auto" ? `${mode} mode` : "Auto"} · {scope === "all" ? "all data" : scope} ·{" "}
              {timeRange}
            </p>
          </div>
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {open && (
          <>
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/40 px-3 py-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    Mode: {SOC_MODES.find((m) => m.id === mode)?.label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {SOC_MODES.map((m) => (
                    <DropdownMenuItem key={m.id} onClick={() => setMode(m.id)}>
                      <span className="font-medium">{m.label}</span>
                      <span className="ml-2 text-muted-foreground">— {m.hint}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex flex-wrap gap-1">
                {SOC_SCOPES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScope(s.id)}
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition",
                      scope === s.id
                        ? "bg-foreground text-background"
                        : "bg-muted/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="ml-auto flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title={expanded ? "Compact" : "Expand"}
                  onClick={() => setExpanded((e) => !e)}
                >
                  {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Clear conversation"
                  onClick={handleClear}
                >
                  <Eraser className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={cn("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}
                >
                  <div
                    className={cn(
                      "max-w-[92%] rounded-2xl px-4 py-3",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "glass border border-border/50"
                    )}
                  >
                    {m.role === "assistant" ? (
                      <MessageBody content={m.content} />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                  {m.role === "assistant" && (
                    <div className="flex max-w-[92%] flex-wrap items-center gap-2 px-1">
                      <SourceBadge source={m.source} mode={m.mode} />
                      {m.citations?.map((c) => (
                        <Link
                          key={`${c.kind}-${c.id}`}
                          to={c.path}
                          className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-primary hover:bg-primary/20"
                          onClick={() => setOpen(false)}
                        >
                          {c.kind}: {c.id}
                        </Link>
                      ))}
                      {m.actions?.map((a) => (
                        <Link
                          key={a.path + a.label}
                          to={a.path}
                          className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] hover:bg-muted"
                          onClick={() => setOpen(false)}
                        >
                          → {a.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {chat.isPending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Querying SOC data…
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border/40 px-4 py-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs text-muted-foreground hover:bg-muted/60"
                  onClick={() => send(s)}
                  disabled={chat.isPending}
                >
                  {s}
                </button>
              ))}
            </div>

            <form
              className="flex shrink-0 items-end gap-2 border-t border-border/50 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                placeholder="Ask anything, or /status · /cases · /hunt · /help"
                className="min-h-[44px] max-h-32 flex-1 resize-none border-border/60 bg-background/60 text-sm"
                rows={1}
                disabled={chat.isPending}
              />
              <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={!input.trim() || chat.isPending}>
                <Send className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0 text-muted-foreground"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
