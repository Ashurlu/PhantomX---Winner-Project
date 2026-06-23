import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, ChevronUp, Loader2, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSocChat } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

const SUGGESTIONS = [
  "Tell me about the ransomware attack on the finance workstation",
  "What happened on HR-DC01 with PowerShell?",
  "Show critical open incidents from the last 2 weeks",
];

function SourceBadge({ source }: { source?: ChatMessage["source"] }) {
  if (!source) return null;
  const label =
    source === "local"
      ? "Local search"
      : source === "openrouter"
        ? "OpenRouter"
        : source === "openai"
          ? "OpenAI"
          : "Anthropic";
  return (
    <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
      {label}
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
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Ask me about incidents, alerts, or rules in plain language — e.g. “ransomware on HR device two weeks ago”.",
      source: "local",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chat = useSocChat();

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

        const res = await chat.mutateAsync({ message: trimmed, history });
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: res.reply,
            source: res.source,
            citations: res.citations,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry — I couldn't reach the chat service. Is the backend running on port 8000?",
            source: "local",
          },
        ]);
      }
    },
    [chat, messages]
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 md:px-6">
      <div
        className={cn(
          "pointer-events-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border/70 bg-background/90 shadow-2xl shadow-black/40 backdrop-blur-xl transition-all duration-300",
          open ? "max-h-[min(520px,70vh)]" : "max-h-14"
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
              Natural-language queries over cases, alerts & rules
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
            <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col gap-2",
                    m.role === "user" ? "items-end" : "items-start"
                  )}
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
                      <p className="text-sm">{m.content}</p>
                    )}
                  </div>
                  {m.role === "assistant" && (
                    <div className="flex flex-wrap items-center gap-2 px-1">
                      <SourceBadge source={m.source} />
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
                    </div>
                  )}
                </div>
              ))}
              {chat.isPending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching SOC data…
                </div>
              )}
            </div>

            {!chat.isPending && messages.length <= 2 && (
              <div className="flex flex-wrap gap-2 border-t border-border/40 px-4 py-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs text-muted-foreground hover:bg-muted/60"
                    onClick={() => send(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              className="flex shrink-0 items-center gap-2 border-t border-border/50 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about an incident, alert, or rule…"
                className="h-11 flex-1 border-border/60 bg-background/60"
                disabled={chat.isPending}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || chat.isPending}>
                <Send className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground"
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
