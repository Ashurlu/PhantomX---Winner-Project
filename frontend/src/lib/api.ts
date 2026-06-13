import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/store/auth";
import { rangeCode, useUi } from "@/store/ui";
import type {
  AdminSettings,
  AiCourtStats,
  AnalysisReport,
  AuditEntry,
  CaseDetail,
  CaseSummary,
  ConnectionTestResult,
  ConnTarget,
  CoverageEntry,
  CreateUserReq,
  LoginResponse,
  Overview,
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

// ---------- Overview ----------
export function useOverview() {
  const code = rangeCode(useUi((s) => s.timeRange));
  return useQuery({
    queryKey: ["overview", code],
    queryFn: () => request<Overview>(`/overview?range=${code}`),
    refetchInterval: 15000,
  });
}

// ---------- AI Court ----------
export function useAiCourtStats() {
  const code = rangeCode(useUi((s) => s.timeRange));
  return useQuery({
    queryKey: ["ai-court", "stats", code],
    queryFn: () => request<AiCourtStats>(`/ai-court/stats?range=${code}`),
  });
}

export function useAiCourtCases() {
  return useQuery({
    queryKey: ["ai-court", "cases"],
    queryFn: () => request<CaseSummary[]>("/ai-court/cases"),
  });
}

export function useAiCourtCase(alertId: string | null) {
  return useQuery({
    queryKey: ["ai-court", "case", alertId],
    queryFn: () => request<CaseDetail>(`/ai-court/cases/${alertId}`),
    enabled: !!alertId,
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
    queryFn: () => request<Tactic[]>("/pentest/tactics"),
  });
}

export function useTechniques(tactic: string | null) {
  return useQuery({
    queryKey: ["pentest", "techniques", tactic],
    queryFn: () => request<Technique[]>(`/pentest/techniques?tactic=${tactic}`),
    enabled: !!tactic,
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
    queryFn: () =>
      request<TechniqueSearchResult[]>(
        `/pentest/techniques/search?q=${encodeURIComponent(query)}`
      ),
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
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => request<AdminSettings>("/admin/settings"),
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
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => request<UserOut[]>("/admin/users"),
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
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (body: CreateUserReq) =>
      request<UserOut>("/admin/users", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: invalidate,
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
  return useQuery({
    queryKey: ["admin", "status"],
    queryFn: () => request<SystemStatus>("/admin/status"),
  });
}

export function useAuditLog() {
  return useQuery({
    queryKey: ["admin", "audit"],
    queryFn: () => request<AuditEntry[]>("/admin/audit"),
    refetchInterval: 10000,
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
