import type { ChatMessage } from "@/lib/types";

export type SocChatMode = "auto" | "search" | "analyze" | "hunt" | "brief";
export type SocChatScope = "all" | "cases" | "alerts" | "rules" | "detection";

export const SOC_CHAT_STORAGE_KEY = "phantomx-soc-chat-v2";

export const SOC_MODES: { id: SocChatMode; label: string; hint: string }[] = [
  { id: "auto", label: "Auto", hint: "Best fit for your question" },
  { id: "search", label: "Search", hint: "Find cases, alerts, rules" },
  { id: "analyze", label: "Analyze", hint: "Patterns and recommendations" },
  { id: "hunt", label: "Hunt", hint: "Investigation plan & pivots" },
  { id: "brief", label: "Brief", hint: "Short answers only" },
];

export const SOC_SCOPES: { id: SocChatScope; label: string }[] = [
  { id: "all", label: "All data" },
  { id: "cases", label: "Cases" },
  { id: "alerts", label: "Alerts" },
  { id: "rules", label: "Rules" },
  { id: "detection", label: "Detection" },
];

const PAGE_SUGGESTIONS: Record<string, string[]> = {
  "/overview": ["/status", "Summarize open incidents", "What was auto-closed today?"],
  "/detection": ["/detection", "Top alert categories", "Which source has the most alerts?"],
  "/cases": ["/cases critical", "Show unassigned cases", "Cases from last 2 weeks"],
  "/ai-court": ["/alerts ransomware", "True positive summary", "Highest confidence verdicts"],
  "/rules": ["/rules pending", "Rules linked to open cases", "Critical severity rules"],
  "/pentest": ["/hunt exposed endpoints", "MITRE techniques we should test"],
  "/cramm": ["/analyze risk posture", "Highest CRAMM scores"],
};

const DEFAULT_SUGGESTIONS = [
  "/status",
  "/help",
  "Tell me about the ransomware attack on the finance workstation",
  "What happened on HR-DC01 with PowerShell?",
];

export function suggestionsForPath(pathname: string): string[] {
  const base = pathname.split("?")[0];
  for (const [prefix, items] of Object.entries(PAGE_SUGGESTIONS)) {
    if (base === prefix || base.startsWith(prefix + "/")) return items;
  }
  return DEFAULT_SUGGESTIONS;
}

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "I'm your SOC copilot. Ask in plain language or use **slash commands**: `/status`, `/cases`, `/alerts`, `/hunt`, `/help`. " +
    "Switch **mode** and **scope** below for more control.",
  source: "local",
};

export function loadSocChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(SOC_CHAT_STORAGE_KEY);
    if (!raw) return [WELCOME];
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [WELCOME];
    return parsed;
  } catch {
    return [WELCOME];
  }
}

export function saveSocChatHistory(messages: ChatMessage[]) {
  try {
    const trimmed = messages.slice(-40);
    localStorage.setItem(SOC_CHAT_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
}

export function clearSocChatHistory(): ChatMessage[] {
  localStorage.removeItem(SOC_CHAT_STORAGE_KEY);
  return [WELCOME];
}
