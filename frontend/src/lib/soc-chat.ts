import type { ChatMessage } from "@/lib/types";

export type SocChatMode = "auto" | "search" | "analyze" | "hunt" | "brief";
export type SocChatScope =
  | "all"
  | "cases"
  | "alerts"
  | "rules"
  | "detection"
  | "pentest"
  | "cramm"
  | "pipeline";

export const SOC_CHAT_STORAGE_KEY = "phantomx-soc-chat-v2";
export const SOC_CHAT_LAYOUT_KEY = "phantomx-soc-chat-layout-v1";

export const SOC_MODES: { id: SocChatMode; label: string; hint: string }[] = [
  { id: "auto", label: "Auto", hint: "Best fit for your question" },
  { id: "search", label: "Search", hint: "Find cases, alerts, rules" },
  { id: "analyze", label: "Analyze", hint: "Patterns and recommendations" },
  { id: "hunt", label: "Hunt", hint: "Investigation plan & pivots" },
  { id: "brief", label: "Brief", hint: "Short answers only" },
];

export const SOC_SCOPES: { id: SocChatScope; label: string }[] = [
  { id: "all", label: "All" },
  { id: "cases", label: "Cases" },
  { id: "alerts", label: "Alerts" },
  { id: "rules", label: "Rules" },
  { id: "detection", label: "Detection" },
  { id: "pentest", label: "Pentest" },
  { id: "cramm", label: "CRAMM" },
  { id: "pipeline", label: "Pipeline" },
];

export type SocChatSizePreset = "sm" | "md" | "lg" | "xl";

export const SOC_CHAT_SIZE_PRESETS: Record<
  SocChatSizePreset,
  { label: string; width: number; height: number }
> = {
  sm: { label: "S", width: 360, height: 420 },
  md: { label: "M", width: 440, height: 540 },
  lg: { label: "L", width: 560, height: 660 },
  xl: { label: "XL", width: 720, height: 820 },
};

export const SOC_CHAT_SIZE_LIMITS = {
  minWidth: 300,
  maxWidth: 920,
  minHeight: 320,
  maxHeight: 900,
};

export interface SocChatLayout {
  width: number;
  height: number;
  preset: SocChatSizePreset | "custom";
}

export function defaultChatLayout(): SocChatLayout {
  const md = SOC_CHAT_SIZE_PRESETS.md;
  return { width: md.width, height: md.height, preset: "md" };
}

export function loadChatLayout(): SocChatLayout {
  try {
    const raw = localStorage.getItem(SOC_CHAT_LAYOUT_KEY);
    if (!raw) return defaultChatLayout();
    const parsed = JSON.parse(raw) as SocChatLayout;
    const { minWidth, maxWidth, minHeight, maxHeight } = SOC_CHAT_SIZE_LIMITS;
    return {
      width: Math.min(maxWidth, Math.max(minWidth, parsed.width ?? defaultChatLayout().width)),
      height: Math.min(maxHeight, Math.max(minHeight, parsed.height ?? defaultChatLayout().height)),
      preset: parsed.preset ?? "custom",
    };
  } catch {
    return defaultChatLayout();
  }
}

export function saveChatLayout(layout: SocChatLayout) {
  try {
    localStorage.setItem(SOC_CHAT_LAYOUT_KEY, JSON.stringify(layout));
  } catch {
    /* ignore */
  }
}

export function clampChatSize(width: number, height: number) {
  const { minWidth, maxWidth, minHeight, maxHeight } = SOC_CHAT_SIZE_LIMITS;
  return {
    width: Math.min(maxWidth, Math.max(minWidth, Math.round(width))),
    height: Math.min(maxHeight, Math.max(minHeight, Math.round(height))),
  };
}

const PAGE_SUGGESTIONS: Record<string, string[]> = {
  "/overview": ["/status", "/pipeline", "Summarize open incidents"],
  "/detection": ["/detection", "/hunt lateral movement", "Top alert categories"],
  "/cases": ["/cases critical", "Show unassigned cases", "/analyze case trends"],
  "/ai-court": ["/alerts ransomware", "True positive summary", "Highest confidence verdicts"],
  "/rules": ["/rules pending", "Rules linked to open cases", "/detection"],
  "/pentest": ["/pentest AD", "/hunt kerberoasting", "Which TTPs to run first?"],
  "/cramm": ["/cramm critical", "/analyze risk posture", "Golden ticket mitigation"],
  "/admin": ["/status", "Platform modules overview", "/pipeline"],
};

const DEFAULT_SUGGESTIONS = [
  "/status",
  "/help",
  "Ransomware on finance workstation",
  "HR-DC01 PowerShell activity",
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
    "**PhantomX SOC copilot** — connected to cases, alerts, rules, detection, CRAMM, pentest, and investigation pipeline.\n\n" +
    "Slash: `/status` `/cases` `/alerts` `/rules` `/detection` `/hunt` `/pentest` `/cramm` `/pipeline` `/help`\n" +
    "Drag the **top-left corner** to resize · use **S/M/L/XL** presets in the header.",
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
