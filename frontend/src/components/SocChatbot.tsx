import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bot,
  ChevronDown,
  Eraser,
  GripHorizontal,
  Loader2,
  Send,
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
  clampChatSize,
  clearSocChatHistory,
  loadChatLayout,
  loadSocChatHistory,
  saveChatLayout,
  saveSocChatHistory,
  SOC_CHAT_SIZE_PRESETS,
  SOC_MODES,
  SOC_SCOPES,
  suggestionsForPath,
  type SocChatLayout,
  type SocChatMode,
  type SocChatScope,
  type SocChatSizePreset,
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
    <span className="rounded border border-border/50 bg-muted/30 px-1.5 py-px text-[10px] uppercase tracking-wide text-muted-foreground">
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
  const [layout, setLayout] = useState<SocChatLayout>(() => loadChatLayout());
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<SocChatMode>("auto");
  const [scope, setScope] = useState<SocChatScope>("all");
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadSocChatHistory());
  const [resizing, setResizing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const chat = useSocChat();

  const suggestions = useMemo(
    () => suggestionsForPath(location.pathname).slice(0, 4),
    [location.pathname]
  );

  useEffect(() => {
    saveSocChatHistory(messages);
  }, [messages]);

  useEffect(() => {
    saveChatLayout(layout);
  }, [layout]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, chat.isPending]);

  const applyPreset = (preset: SocChatSizePreset) => {
    const p = SOC_CHAT_SIZE_PRESETS[preset];
    setLayout({ width: p.width, height: p.height, preset });
  };

  const startResize = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = layout.width;
      const startH = layout.height;

      setResizing(true);

      const onMove = (ev: PointerEvent) => {
        const next = clampChatSize(
          startW + (startX - ev.clientX),
          startH + (startY - ev.clientY)
        );
        setLayout({ ...next, preset: "custom" });
      };

      const onUp = () => {
        setResizing(false);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [layout.width, layout.height]
  );

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
            content: "Couldn't reach the chat service. Is the backend running?",
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

  const modeLabel = SOC_MODES.find((m) => m.id === mode)?.label ?? "Auto";

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50">
      <div
        ref={panelRef}
        style={
          open
            ? { width: layout.width, height: layout.height }
            : undefined
        }
        className={cn(
          "pointer-events-auto relative flex flex-col overflow-hidden rounded-xl border border-border/70 bg-background/95 shadow-xl shadow-black/30 backdrop-blur-xl",
          !open && "h-10 w-auto",
          resizing && "select-none"
        )}
      >
        {open && (
          <button
            type="button"
            aria-label="Resize chat panel"
            title="Drag to resize"
            onPointerDown={startResize}
            className="absolute left-0 top-0 z-10 flex h-5 w-5 cursor-nwse-resize items-center justify-center rounded-br-md border-b border-r border-border/50 bg-muted/40 text-muted-foreground hover:bg-muted/70"
          >
            <GripHorizontal className="h-3 w-3 -rotate-45" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex shrink-0 items-center gap-2 text-left transition-colors hover:bg-muted/30",
            open ? "h-10 border-b border-border/50 px-3 pl-6" : "h-10 rounded-xl px-3"
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Bot className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-none">SOC Assistant</p>
            {open && (
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {modeLabel} · {scope} · {timeRange} · {layout.width}×{layout.height}
              </p>
            )}
          </div>
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Ask
            </span>
          )}
        </button>

        {open && (
          <>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border/40 px-2 py-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                    {modeLabel}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="text-xs">
                  {SOC_MODES.map((m) => (
                    <DropdownMenuItem key={m.id} onClick={() => setMode(m.id)} className="text-xs">
                      <span className="font-medium">{m.label}</span>
                      <span className="ml-1.5 text-muted-foreground">— {m.hint}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto">
                {SOC_SCOPES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScope(s.id)}
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium transition",
                      scope === s.id
                        ? "bg-foreground text-background"
                        : "bg-muted/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="flex shrink-0 gap-0.5">
                {(Object.keys(SOC_CHAT_SIZE_PRESETS) as SocChatSizePreset[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    title={`Size ${SOC_CHAT_SIZE_PRESETS[key].label}`}
                    onClick={() => applyPreset(key)}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-semibold transition",
                      layout.preset === key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {SOC_CHAT_SIZE_PRESETS[key].label}
                  </button>
                ))}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                title="Clear"
                onClick={handleClear}
              >
                <Eraser className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={cn("flex flex-col gap-1.5", m.role === "user" ? "items-end" : "items-start")}
                >
                  <div
                    className={cn(
                      "max-w-[92%] rounded-xl px-3 py-2",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border/50 bg-muted/20"
                    )}
                  >
                    {m.role === "assistant" ? (
                      <MessageBody content={m.content} />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                  {m.role === "assistant" && (m.citations?.length || m.actions?.length || m.source) && (
                    <div className="flex max-w-[92%] flex-wrap items-center gap-1 px-0.5">
                      <SourceBadge source={m.source} mode={m.mode} />
                      {m.citations?.map((c) => (
                        <Link
                          key={`${c.kind}-${c.id}`}
                          to={c.path}
                          className="rounded border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary hover:bg-primary/20"
                          onClick={() => setOpen(false)}
                        >
                          {c.kind}: {c.id}
                        </Link>
                      ))}
                      {m.actions?.map((a) => (
                        <Link
                          key={a.path + a.label}
                          to={a.path}
                          className="rounded border border-border/60 bg-muted/30 px-1.5 py-0.5 text-[10px] hover:bg-muted/50"
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Querying platform data…
                </div>
              )}
            </div>

            {messages.length <= 2 && (
              <div className="flex shrink-0 gap-1.5 overflow-x-auto border-t border-border/40 px-3 py-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="shrink-0 rounded-full border border-border/50 bg-muted/20 px-2.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted/40"
                    onClick={() => send(s)}
                    disabled={chat.isPending}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              className="flex shrink-0 items-end gap-2 border-t border-border/50 p-2.5"
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
                placeholder="/status · /cases · /pentest · /cramm · /pipeline · /help"
                className="min-h-9 max-h-28 flex-1 resize-none border-border/50 bg-background/60 px-2.5 py-2 text-sm"
                rows={1}
                disabled={chat.isPending}
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 shrink-0"
                disabled={!input.trim() || chat.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-muted-foreground"
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
