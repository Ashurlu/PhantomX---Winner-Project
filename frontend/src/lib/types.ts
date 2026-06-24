// Mirrors the backend data contract (Section 11). Keep in sync.
import type { Severity } from "./theme";
export type { Severity };

export interface LoginResponse {
  token: string;
  role: "admin" | "analyst";
  username: string;
  avatarUrl?: string | null;
}

// ---------- Admin ----------
export interface UserOut {
  username: string;
  role: "admin" | "analyst";
  active: boolean;
  createdAt: string;
  lastLogin: string | null;
  avatarUrl?: string | null;
  email?: string | null;
}

export interface UserProfile {
  username: string;
  role: "admin" | "analyst";
  email?: string | null;
  avatarUrl?: string | null;
  createdAt?: string | null;
  lastLogin?: string | null;
}

export interface ProfileUpdateResponse {
  profile: UserProfile;
  token?: string | null;
}

export interface AdminSettings {
  dataSource: "mock" | "live";
  n8nBaseUrl: string;
  n8nApiKey: string;
  pentestBaseUrl: string;
  pentestApiKey: string;
  aiProviderKey: string;
  aiModel: string;
  winrmUsername: string;
  winrmPassword: string;
}

export interface IntegrationStatus {
  name: string;
  configured: boolean;
  detail: string;
}

export interface SystemStatus {
  status: string;
  dataSource: string;
  userCount: number;
  adminCount: number;
  integrations: IntegrationStatus[];
}

export interface CreateUserReq {
  username: string;
  password: string;
  role: "admin" | "analyst";
}

export interface AuditEntry {
  id: number;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
}

export type ConnTarget = "n8n" | "pentest" | "ai";

export interface ConnectionTestResult {
  target: string;
  reachable: boolean;
  detail: string;
  latencyMs: number;
}

export interface Source {
  name: string;
  logCount: number;
  trendPct: number;
}

export interface Overview {
  sources: Source[];
  alerts: number;
  incidents: number;
  handling: { automated: number; manual: number };
  incidentsResolved: number;
  incidentsOpen: number;
  openBySeverity: { critical: number; high: number; medium: number; low: number };
  falsePositivesAutoClosed: number;
  kpis: {
    dataIngestionTb24h: number;
    dataIngestionTrendPct: number;
    eventsIngestion24h: number;
    eventsTrendPct: number;
    preventedEvents: number;
    currentlyOpenIncidents: number;
    oldestOpenDays: number;
    ingestionSpark: number[];
    eventsSpark: number[];
  };
}

export interface DetectionSlice {
  name: string;
  value: number;
  color: string;
}

export interface DetectionSource {
  name: string;
  value: number;
  pct: number;
  tags: string;
}

export interface DetectionWeeklyBar {
  day: number;
  a: number;
  b: number;
  c: number;
}

export interface DetectionIntel {
  totalAlerts: number;
  weeklyAverage: number;
  categories: DetectionSlice[];
  severities: DetectionSlice[];
  sources: DetectionSource[];
  weekly: DetectionWeeklyBar[];
  weeklyLegend: string[];
  period: string;
}

export interface AiCourtStats {
  falsePositivesAutoClosed: number;
  truePositivesShown: number;
  period: string;
}

export interface CaseSummary {
  alertId: string;
  title: string;
  severity: Severity;
  verdict: "TRUE_POSITIVE";
  confidence: number;
  recommendationSummary: string;
  linkedCaseId?: string | null;
}

export interface CaseDetail {
  alertId: string;
  title: string;
  severity: Severity;
  evidence: { type: string; detail: string }[];
  tribunal: {
    prosecutor: { point: string; weight: number }[];
    defender: { point: string; weight: number }[];
    verdict: "TRUE_POSITIVE";
    confidence: number;
  };
  recommendation: { severity: Severity; actionItems: string[]; playbook: string };
}

export type CaseStatus = "open" | "in_progress" | "done";

export interface CaseAssignee {
  initials: string;
  name: string;
}

export interface CaseHistoryEvent {
  id: string;
  type: "created" | "assigned" | "status_change" | "note";
  actor: string;
  detail: string;
  timestamp: string;
}

export interface InboxCase {
  id: string;
  title: string;
  severity: Severity;
  status: CaseStatus;
  tags: string[];
  assignee: CaseAssignee | null;
  createdAt: string;
  dueAt: string;
  slaHours: number;
  elapsedHours: number;
  tasksDone: number;
  tasksTotal: number;
  flags: number;
  attachments: number;
  aiSummary: string;
  sourceAlertId?: string | null;
  linkedRuleId?: string | null;
}

export interface InboxCaseDetail extends InboxCase {
  history: CaseHistoryEvent[];
}

export interface InboxStats {
  open: number;
  inProgress: number;
  done: number;
  total: number;
}

export type RuleStatus = "pending" | "approved" | "rejected";
export type RuleCategory = "incident-response" | "ad";

export interface RuleSummary {
  id: string;
  title: string;
  severity: Severity;
  sourceAlertId: string;
  linkedCaseId?: string | null;
  status: RuleStatus;
  category: RuleCategory;
  proposedAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
}

export interface RuleDetail extends RuleSummary {
  description: string;
  sigma: string;
  kql: string;
  rejectReason: string | null;
}

export interface RuleUpdate {
  title?: string;
  description?: string;
  severity?: Severity;
  sigma?: string;
  kql?: string;
}

export interface RuleCreate {
  title: string;
  description?: string;
  severity?: Severity;
  category?: RuleCategory;
  sigma: string;
  kql?: string;
  sourceAlertId?: string;
}

export interface Tactic {
  id: string;
  name: string;
  techniqueCount: number;
}

export interface TechniqueTest {
  index: number;
  name: string;
  platforms: string[];
  elevation_required: boolean;
  domain_required: boolean;
  executor: string;
}

export interface Technique {
  id: string;
  name: string;
  tactic: string;
  testCount: number;
  blockedCount: number;
  adBadge: boolean;
  status: string;
  tests: TechniqueTest[];
}

/** One selected atomic test (technique + 0-based test index). */
export interface TestSelection {
  technique_id: string;
  test_index: number;
}

export type WinrmTransport =
  | "ntlm"
  | "kerberos"
  | "credssp"
  | "negotiate"
  | "basic";

export interface PentestTarget {
  name: string;
  os_platform: "windows" | "linux" | "macos";
  privilege: "admin" | "standard_user";
  connection: "local" | "remote";
  domain_joined: boolean;
  host: string;
  winrm_username: string;
  winrm_password: string;
  winrm_transport: WinrmTransport;
  winrm_port: number;
  winrm_ssl: boolean;
  notes: string;
}

export interface RunScope {
  runAs: "administrator" | "domain-user";
  targets: string[];
  window: string;
  targetConfigs: PentestTarget[];
}

export interface RunStep {
  id: string;
  technique: string;
  status: "queued" | "running" | "done";
}

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  asset: string;
  recommendation: string;
}

export interface SiemIngest {
  technique: string;
  techniqueName: string;
  eventsIngested: number;
  source: string;
  wazuhRuleId: string;
  level: number;
  sigmaRule: string | null;
  detected: boolean;
}

export interface RunDetail {
  id: string;
  status: string;
  scope: RunScope;
  steps: RunStep[];
  findings: Finding[];
  siemIngestion: SiemIngest[];
  aiAnalysis: { summary: string; riskScore: number };
}

// ---------- AGI Pentest engine ----------
export interface ProviderInfo {
  model_id: string;
  provider: string;
}

export interface TechniqueSearchResult {
  technique_id: string;
  display_name: string;
  test_count: number;
}

export interface EngineFinding {
  severity: string;
  technique_id: string;
  tactic: string;
  target_id: string;
  title: string;
  detail: string;
  evidence: string;
  recommendation: string;
}

export interface AnalysisReport {
  executive_summary: string;
  risk_level: string;
  findings: EngineFinding[];
  succeeded_techniques: string[];
  failed_techniques: string[];
  key_observations: string[];
  attack_path: string;
  timestamp: string;
  error: string | null;
}

export interface CoverageEntry {
  techniqueID: string;
  name: string;
  tactic: string;
  tested: boolean;
  detected: boolean;
  score: number;
  sigmaRule: string | null;
  comment: string;
}

// ---------- SOC Chat ----------
export interface ChatCitation {
  kind: "case" | "alert" | "rule";
  id: string;
  title: string;
  path: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  source?: "local" | "openrouter" | "openai" | "anthropic";
  citations?: ChatCitation[];
}

export interface ChatResponse {
  reply: string;
  source: "local" | "openrouter" | "openai" | "anthropic";
  citations: ChatCitation[];
}

// ---------- CRAMM ----------
export interface CrammStats {
  totalRisks: number;
  criticalCount: number;
  highSeverityCount: number;
  avgHealthScore: number;
}

export interface CrammInsight {
  message: string;
  ctaLabel: string;
  trendPct: number;
}

export interface CrammRiskSummary {
  id: string;
  techniqueId: string;
  title: string;
  description: string;
  riskScore: number;
  severity: "critical" | "high" | "medium";
  tags: string[];
  crammLevel: number;
}

export interface CrammMatrix {
  stats: CrammStats;
  insight: CrammInsight;
  critical: CrammRiskSummary[];
  high: CrammRiskSummary[];
}

export interface CrammAssetContext {
  name: string;
  assetValue: number;
  principalName: string;
  domainPath: string;
  privilegeLevel: string;
  note: string;
}

export interface CrammVector {
  label: string;
  pct: number;
  tone: "cyan" | "rose" | "amber" | "violet";
}

export interface CrammAssessment {
  model: string;
  standard: string;
  assetValue: number;
  assetValueNote: string;
  threatDegree: number;
  threatDegreeNote: string;
  exposureFactor: number;
  exposureFactorNote: string;
  criticalityPct: number;
  vectors: CrammVector[];
  enterpriseAle: number;
}

export interface CrammControl {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface CrammDetail {
  id: string;
  techniqueId: string;
  title: string;
  subtitle: string;
  description: string;
  severity: string;
  severityLabel: string;
  mitreId: string;
  crammLevel: number;
  riskScore: number;
  riskScoreLabel: string;
  annualLoss: number;
  annualLossLabel: string;
  resolutionWindow: string;
  systemId: string;
  asset: CrammAssetContext;
  assessment: CrammAssessment;
  controls: CrammControl[];
  linkedCaseId?: string | null;
  linkedAlertId?: string | null;
}

export interface CrammAuditItem {
  id: string;
  category: string;
  title: string;
  description: string;
  status: "pass" | "warning" | "fail";
  techniqueId: string;
  finding: string;
}

export interface CrammAudit {
  title: string;
  scope: string;
  trendPct: number;
  summary: string;
  items: CrammAuditItem[];
  linkedRisks: string[];
}

export interface CrammExportReport {
  generatedAt: string;
  matrix: CrammMatrix;
  audit: CrammAudit;
}

export interface CrammTechniqueReport {
  generatedAt: string;
  reportType: "cramm_technique_risk";
  executiveSummary: {
    techniqueId: string;
    mitreId: string;
    title: string;
    riskScore: number;
    riskScoreLabel: string;
    severity: string;
    annualLoss: number;
    enterpriseAle: number;
    criticalityPct: number;
    resolutionWindow: string;
  };
  detail: CrammDetail;
  recommendedControls: CrammControl[];
}

// ---------- Web Pentest Agent ----------
export type WebPentestMode = "passive" | "standard" | "deep";
export type WebPentestScanType = "static" | "ai_planner" | "ai_agent";

export interface WebPentestFindingResponseContext {
  kind: "header" | "cookie" | "http_get";
  header?: string;
  observed_value?: string | null;
  cookie_name?: string;
  cookie_raw?: string;
  status_code?: number;
  content_length?: number;
  body_preview?: string;
}

export interface WebPentestTargetResponse {
  status_code: number;
  final_url: string;
  headers: Record<string, string>;
}

export interface WebPentestFinding {
  title: string;
  severity: string;
  url: string;
  evidence: string;
  remediation: string;
  skill_id: string;
  response_context?: WebPentestFindingResponseContext;
}

export interface WebPentestScanResult {
  success: boolean;
  target: string;
  mode: WebPentestMode;
  skills_used?: string[];
  finding_count?: number;
  findings: WebPentestFinding[];
  error?: string | null;
  ai_plan?: {
    selected_skills: string[];
    reasoning: string;
    scan_strategy: string;
  };
  provider_used?: string;
  model_used?: string;
  agent_steps?: Array<{
    step: number;
    phase: string;
    ai_reasoning: string;
    selected_skills: string[];
    findings_count: number;
  }>;
  validated_findings?: Array<{
    title: string;
    status: string;
    reasoning: string;
    adjusted_severity: string;
  }>;
  final_ai_summary?: string;
  target_response?: WebPentestTargetResponse;
}

export interface WebPentestSkill {
  id: string;
  name: string;
  description: string;
  min_mode: string;
  check_count: number;
}

export interface WebPentestSettings {
  success: boolean;
  provider: string;
  model: string;
  providers_configured: Record<string, boolean>;
  active_key_set: boolean;
}
