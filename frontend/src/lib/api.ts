import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth, useAuthHydrated, useAdminQueryEnabled } from "@/store/auth";
import { rangeCodeFromTimestamps, useUi } from "@/store/ui";
import { detectionFallback } from "@/lib/detection-fallback";
import { casesInboxCaseFallback, casesInboxFallback } from "@/lib/cases-fallback";
import {
  searchTechniquesFallback,
  tacticsFallback,
  tacticsUsable,
  techniquesFallback,
} from "@/lib/pentest-fallback";
import type {
  AdminSettings,
  AiCourtStats,
  AnalysisReport,
  AuditEntry,
  CaseDetail,
  CaseSummary,
  InboxCase,
  InboxCaseDetail,
  InboxStats,
  CaseAssignee,
  ConnectionTestResult,
  ConnTarget,
  CoverageEntry,
  CreateUserReq,
  DetectionIntel,
  LoginResponse,
  Overview,
  ProfileUpdateResponse,
  ProviderInfo,
  RuleCreate,
  RuleDetail,
  RuleSummary,
  RuleUpdate,
  RunDetail,
  SystemStatus,
  Tactic,
  Technique,
  TechniqueSearchResult,
  TestSelection,
  UserOut,
  UserProfile,
  ChatResponse,
} from "./types";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";
const API = `${BASE}/api/v1`;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuth.getState().token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });

  if (res.status === 401) {
    useAuth.getState().logout();
    throw new ApiError(401, "Session expired. Please log in again.");
  }
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = typeof body.detail === "string" ? body.detail : detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------- Auth ----------
export async function login(username: string, password: string) {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function signup(username: string, password: string) {
  return request<LoginResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

// ---------- Profile ----------
export function useProfile() {
  const token = useAuth((s) => s.token);
  return useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => request<UserProfile>("/profile/me"),
    enabled: !!token,
    staleTime: 60_000,
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const token = useAuth.getState().token;
      const form = new FormData();
      form.append("file", file, file.name);
      const res = await fetch(`${API}/profile/avatar`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (res.status === 401) {
        useAuth.getState().logout();
        throw new ApiError(401, "Session expired. Please log in again.");
      }
      if (!res.ok) {
        let detail = `Upload failed (${res.status})`;
        try {
          const body = await res.json();
          if (body?.detail) detail = typeof body.detail === "string" ? body.detail : detail;
        } catch {
          /* ignore */
        }
        throw new ApiError(res.status, detail);
      }
      return res.json() as Promise<UserProfile>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useDeleteAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      request<UserProfile>("/profile/avatar", {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { username?: string; email?: string | null }) =>
      request<ProfileUpdateResponse>("/profile/me", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useChangeOwnPassword() {
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      request<void>("/profile/password", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });
}

// ---------- Overview ----------
export function useOverview() {
  const from = useUi((s) => s.timeFrom);
  const to = useUi((s) => s.timeTo);
  const code = rangeCodeFromTimestamps(from, to);
  return useQuery({
    queryKey: ["overview", code, from, to],
    queryFn: () => request<Overview>(`/overview?range=${code}`),
    refetchInterval: 15000,
  });
}

// ---------- Detection ----------
export function useDetection() {
  const from = useUi((s) => s.timeFrom);
  const to = useUi((s) => s.timeTo);
  const code = rangeCodeFromTimestamps(from, to);
  return useQuery({
    queryKey: ["detection", code, from, to],
    queryFn: async () => {
      try {
        return await request<DetectionIntel>(`/detection?range=${code}`);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          return detectionFallback(code);
        }
        throw e;
      }
    },
    refetchInterval: 20000,
  });
}

// ---------- AI Court ----------
export function useAiCourtStats() {
  const from = useUi((s) => s.timeFrom);
  const to = useUi((s) => s.timeTo);
  const code = rangeCodeFromTimestamps(from, to);
  return useQuery({
    queryKey: ["ai-court", "stats", code, from, to],
    queryFn: () => request<AiCourtStats>(`/ai-court/stats?range=${code}`),
  });
}

export function useAiCourtCases() {
  return useQuery({
    queryKey: ["ai-court", "cases"],
    queryFn: () => request<CaseSummary[]>("/ai-court/cases"),
    refetchInterval: 20000,
  });
}

export function useAiCourtCase(alertId: string | null) {
  return useQuery({
    queryKey: ["ai-court", "case", alertId],
    queryFn: () => request<CaseDetail>(`/ai-court/cases/${alertId}`),
    enabled: !!alertId,
  });
}

// ---------- Case Management Inbox ----------
export function useCasesInbox() {
  return useQuery({
    queryKey: ["cases", "inbox"],
    queryFn: async () => {
      try {
        return await request<InboxCase[]>("/cases/inbox");
      } catch {
        return casesInboxFallback();
      }
    },
    refetchInterval: 30000,
  });
}

export function useCasesInboxCase(caseId: string | null) {
  return useQuery({
    queryKey: ["cases", "inbox", caseId],
    queryFn: async () => {
      try {
        return await request<InboxCaseDetail>(`/cases/inbox/${caseId}`);
      } catch {
        return casesInboxCaseFallback(caseId!);
      }
    },
    enabled: !!caseId,
    // Never show the previous case's detail while switching selection
    placeholderData: undefined,
  });
}

export function useCasesInboxStats() {
  return useQuery({
    queryKey: ["cases", "inbox", "stats"],
    queryFn: () => request<InboxStats>("/cases/stats"),
  });
}

export function useCaseAssignees() {
  const token = useAuth((s) => s.token);
  const hasHydrated = useAuthHydrated();
  return useQuery({
    queryKey: ["cases", "assignees"],
    queryFn: () => request<CaseAssignee[]>("/cases/assignees"),
    enabled: hasHydrated && !!token,
    staleTime: 60_000,
  });
}

// ---------- Rules ----------
export function useRules() {
  return useQuery({
    queryKey: ["rules"],
    queryFn: () => request<RuleSummary[]>("/rules"),
  });
}

export function useRule(id: string | null) {
  return useQuery({
    queryKey: ["rules", id],
    queryFn: () => request<RuleDetail>(`/rules/${id}`),
    enabled: !!id,
  });
}

function useInvalidateRules() {
  const qc = useQueryClient();
  return (id?: string) => {
    qc.invalidateQueries({ queryKey: ["rules"] });
    if (id) qc.invalidateQueries({ queryKey: ["rules", id] });
  };
}

export function useCreateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RuleCreate) =>
      request<RuleDetail>("/rules", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rules"] }),
  });
}

export function useUpdateRule() {
  const invalidate = useInvalidateRules();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: RuleUpdate }) =>
      request<RuleDetail>(`/rules/${id}`, {
        method: "PUT",
        body: JSON.stringify(patch),
      }),
    onSuccess: (r) => invalidate(r.id),
  });
}

export function useApproveRule() {
  const invalidate = useInvalidateRules();
  return useMutation({
    mutationFn: (id: string) =>
      request<RuleDetail>(`/rules/${id}/approve`, { method: "POST" }),
    onSuccess: (r) => invalidate(r.id),
  });
}

export function useRejectRule() {
  const invalidate = useInvalidateRules();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      request<RuleDetail>(`/rules/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    onSuccess: (r) => invalidate(r.id),
  });
}

// ---------- Pentest ----------
export function useTactics() {
  return useQuery({
    queryKey: ["pentest", "tactics"],
    queryFn: async () => {
      try {
        const data = await request<Tactic[]>("/pentest/tactics");
        return tacticsUsable(data) ? data : tacticsFallback();
      } catch {
        return tacticsFallback();
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTechniques(tactic: string | null) {
  return useQuery({
    queryKey: ["pentest", "techniques", tactic],
    queryFn: async () => {
      if (!tactic) return [];
      try {
        const data = await request<Technique[]>(
          `/pentest/techniques?tactic=${encodeURIComponent(tactic)}`
        );
        return data.length ? data : techniquesFallback(tactic);
      } catch {
        return techniquesFallback(tactic);
      }
    },
    enabled: !!tactic,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateRun() {
  return useMutation({
    mutationFn: (body: {
      scope: RunDetail["scope"];
      selections: TestSelection[];
    }) =>
      request<{ runId: string; status: string }>("/pentest/runs", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });
}

export function useRun(runId: string | null) {
  return useQuery({
    queryKey: ["pentest", "run", runId],
    queryFn: () => request<RunDetail>(`/pentest/runs/${runId}`),
    enabled: !!runId,
    // Poll while the run is in progress; stop once it reports done.
    refetchInterval: (query) =>
      query.state.data?.status === "done" ? false : 1500,
  });
}

/** Full LLM model catalog exposed by the AGI Pentest engine. */
export function useProviders() {
  return useQuery({
    queryKey: ["pentest", "providers"],
    queryFn: () => request<ProviderInfo[]>("/pentest/providers"),
    staleTime: 5 * 60 * 1000,
  });
}

/** Free-text technique search against the engine's ATT&CK catalog. */
export function useTechniqueSearch(query: string) {
  return useQuery({
    queryKey: ["pentest", "search", query],
    queryFn: async () => {
      const q = query.trim();
      try {
        const data = await request<TechniqueSearchResult[]>(
          `/pentest/techniques/search?q=${encodeURIComponent(q)}`
        );
        return data.length ? data : searchTechniquesFallback(q);
      } catch {
        return searchTechniquesFallback(q);
      }
    },
    enabled: query.trim().length >= 2,
  });
}

/** Parsed AI analysis report for a completed run (findings, attack path…). */
export function useRunAnalysis(runId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["pentest", "analysis", runId],
    queryFn: () => request<AnalysisReport>(`/pentest/runs/${runId}/analysis`),
    enabled: !!runId && enabled,
    retry: false,
  });
}

/** Liveness + capabilities of the configured pentest engine. */
export function useEngineHealth() {
  return useQuery({
    queryKey: ["pentest", "engine-health"],
    queryFn: () => request<Record<string, unknown>>("/pentest/engine/health"),
    refetchInterval: 30000,
  });
}

/** Open the engine's printable HTML report in a new tab (auth-attached). */
export async function openRunReport(runId: string) {
  const token = useAuth.getState().token;
  const res = await fetch(`${API}/pentest/runs/${runId}/report`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError(res.status, "Report not available yet");
  const html = await res.text();
  const w = window.open("", "_blank");
  if (w) {
    w.document.open();
    w.document.write(html);
    w.document.close();
  }
}

// ---------- Admin ----------
export function useAdminSettings() {
  const enabled = useAdminQueryEnabled();
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => request<AdminSettings>("/admin/settings"),
    enabled,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<AdminSettings>) =>
      request<AdminSettings>("/admin/settings", {
        method: "PUT",
        body: JSON.stringify(patch),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useUsers() {
  const enabled = useAdminQueryEnabled();
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => request<UserOut[]>("/admin/users"),
    enabled,
  });
}

function useInvalidateAdmin() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["admin"] });
}

export function useSetUserRole() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ username, role }: { username: string; role: "admin" | "analyst" }) =>
      request<UserOut>(`/admin/users/${username}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      }),
    onSuccess: invalidate,
  });
}

export function useSetUserActive() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ username, active }: { username: string; active: boolean }) =>
      request<UserOut>(`/admin/users/${username}/active`, {
        method: "PUT",
        body: JSON.stringify({ active }),
      }),
    onSuccess: invalidate,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateUserReq) =>
      request<UserOut>("/admin/users", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin"] });
      await qc.invalidateQueries({ queryKey: ["cases", "assignees"] });
    },
  });
}

export function useSetUserPassword() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      request<UserOut>(`/admin/users/${username}/password`, {
        method: "PUT",
        body: JSON.stringify({ password }),
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (username: string) =>
      request<{ deleted: string }>(`/admin/users/${username}`, {
        method: "DELETE",
      }),
    onSuccess: invalidate,
  });
}

export function useSystemStatus() {
  const enabled = useAdminQueryEnabled();
  return useQuery({
    queryKey: ["admin", "status"],
    queryFn: () => request<SystemStatus>("/admin/status"),
    enabled,
  });
}

export function useAuditLog() {
  const enabled = useAdminQueryEnabled();
  return useQuery({
    queryKey: ["admin", "audit"],
    queryFn: () => request<AuditEntry[]>("/admin/audit"),
    refetchInterval: enabled ? 10000 : false,
    enabled,
  });
}

export function useTestConnection() {
  return useMutation({
    mutationFn: (target: ConnTarget) =>
      request<ConnectionTestResult>("/admin/test-connection", {
        method: "POST",
        body: JSON.stringify({ target }),
      }),
  });
}

export function useResetDemo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      request<{ status: string; detail: string }>("/admin/reset-demo", {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["detection"] });
      qc.invalidateQueries({ queryKey: ["ai-court"] });
      qc.invalidateQueries({ queryKey: ["attack"] });
      qc.invalidateQueries({ queryKey: ["rules"] });
      qc.invalidateQueries({ queryKey: ["pentest"] });
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

/** Download the current settings/config as a JSON backup (secrets masked). */
export async function downloadConfig() {
  const token = useAuth.getState().token;
  const res = await fetch(`${API}/admin/export-config`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError(res.status, "Failed to export config");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "phantomx_config.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------- ATT&CK Navigator coverage ----------
export function useCoverage() {
  return useQuery({
    queryKey: ["attack", "coverage"],
    queryFn: () => request<CoverageEntry[]>("/attack/coverage"),
  });
}

/** Download the official ATT&CK Navigator layer JSON (auth-attached). */
export async function downloadNavigatorLayer() {
  const token = useAuth.getState().token;
  const res = await fetch(`${API}/attack/navigator-layer`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError(res.status, "Failed to export layer");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "phantomx_attack_layer.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------- SOC Chat ----------
export function useSocChat() {
  return useMutation({
    mutationFn: (body: {
      message: string;
      history: { role: "user" | "assistant"; content: string }[];
    }) =>
      request<ChatResponse>("/chat", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });
}
