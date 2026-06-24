"""Pydantic models == the data contract (Section 11). DO NOT change shapes."""
from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel, Field


# ---------- Auth (11.1) ----------
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    role: Literal["admin", "analyst"]
    username: str
    avatarUrl: Optional[str] = None


class SignupRequest(BaseModel):
    username: str
    password: str


class UserProfile(BaseModel):
    username: str
    role: Literal["admin", "analyst"]
    email: Optional[str] = None
    avatarUrl: Optional[str] = None
    createdAt: Optional[str] = None
    lastLogin: Optional[str] = None


class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None


class ProfilePasswordChange(BaseModel):
    currentPassword: str
    newPassword: str


class ProfileUpdateResponse(BaseModel):
    profile: UserProfile
    token: Optional[str] = None


# ---------- Admin: users ----------
class UserOut(BaseModel):
    username: str
    role: Literal["admin", "analyst"]
    active: bool
    createdAt: str
    lastLogin: Optional[str] = None
    avatarUrl: Optional[str] = None
    email: Optional[str] = None


class RoleUpdate(BaseModel):
    role: Literal["admin", "analyst"]


class ActiveUpdate(BaseModel):
    active: bool


class PasswordUpdate(BaseModel):
    password: str


class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: Literal["admin", "analyst"] = "analyst"


class AuditEntry(BaseModel):
    id: int
    timestamp: str
    actor: str
    action: str
    detail: str


class ConnectionTestRequest(BaseModel):
    target: Literal["n8n", "pentest", "ai"]


class ConnectionTestResult(BaseModel):
    target: str
    reachable: bool
    detail: str
    latencyMs: int


# ---------- Admin: settings (API keys, data source) ----------
class AdminSettings(BaseModel):
    dataSource: Literal["mock", "live"]
    n8nBaseUrl: str = ""
    n8nApiKey: str = ""
    pentestBaseUrl: str = ""
    pentestApiKey: str = ""
    aiProviderKey: str = ""
    aiModel: str = ""
    winrmUsername: str = ""
    winrmPassword: str = ""


class AdminSettingsUpdate(BaseModel):
    dataSource: Optional[Literal["mock", "live"]] = None
    n8nBaseUrl: Optional[str] = None
    n8nApiKey: Optional[str] = None
    pentestBaseUrl: Optional[str] = None
    pentestApiKey: Optional[str] = None
    aiProviderKey: Optional[str] = None
    aiModel: Optional[str] = None
    winrmUsername: Optional[str] = None
    winrmPassword: Optional[str] = None


class IntegrationStatus(BaseModel):
    name: str
    configured: bool
    detail: str


class SystemStatus(BaseModel):
    status: str
    dataSource: str
    userCount: int
    adminCount: int
    integrations: list[IntegrationStatus]


# ---------- Investigation pipeline (Sankey + summary metrics) ----------
class SankeyNodeConfig(BaseModel):
    id: str
    label: str
    value: int
    column: int
    row: int
    color: Optional[str] = None


class SankeyLinkConfig(BaseModel):
    source: str
    target: str
    value: int
    color: Optional[str] = None


class PipelineMetricSlice(BaseModel):
    name: str
    value: int
    pct: int
    color: str


class PipelineSummaryMetrics(BaseModel):
    escalated: Optional[int] = None
    notEscalated: Optional[int] = None
    timeSaved: Optional[str] = None
    totalAlerts: Optional[int] = None
    sources: Optional[list[PipelineMetricSlice]] = None
    determinations: Optional[list[PipelineMetricSlice]] = None


class InvestigationPipelineConfig(BaseModel):
    configured: bool
    nodes: list[SankeyNodeConfig]
    links: list[SankeyLinkConfig]
    metrics: Optional[PipelineSummaryMetrics] = None


class InvestigationPipelineUpdate(BaseModel):
    nodes: list[SankeyNodeConfig]
    links: list[SankeyLinkConfig]
    metrics: Optional[PipelineSummaryMetrics] = None


# ---------- Overview (11.2) ----------
class Source(BaseModel):
    name: str
    logCount: int
    trendPct: int


class Handling(BaseModel):
    automated: int
    manual: int


class OpenBySeverity(BaseModel):
    critical: int
    high: int
    medium: int
    low: int


class OverviewKpis(BaseModel):
    dataIngestionTb24h: float
    dataIngestionTrendPct: int
    eventsIngestion24h: int
    eventsTrendPct: int
    preventedEvents: int
    currentlyOpenIncidents: int
    oldestOpenDays: int
    ingestionSpark: list[float]
    eventsSpark: list[float]


class Overview(BaseModel):
    sources: list[Source]
    alerts: int
    incidents: int
    handling: Handling
    incidentsResolved: int
    incidentsOpen: int
    openBySeverity: OpenBySeverity
    falsePositivesAutoClosed: int
    kpis: OverviewKpis


# ---------- Detection ----------
class DetectionSlice(BaseModel):
    name: str
    value: int
    color: str


class DetectionSource(BaseModel):
    name: str
    value: int
    pct: int
    tags: str


class DetectionWeeklyBar(BaseModel):
    day: int
    a: int
    b: int
    c: int


class DetectionIntel(BaseModel):
    totalAlerts: int
    weeklyAverage: int
    categories: list[DetectionSlice]
    severities: list[DetectionSlice]
    sources: list[DetectionSource]
    weekly: list[DetectionWeeklyBar]
    weeklyLegend: list[str]
    period: str


# ---------- AI Court (11.3) ----------
Severity = Literal["critical", "high", "medium", "low"]


class AiCourtStats(BaseModel):
    falsePositivesAutoClosed: int
    truePositivesShown: int
    period: str


class CaseSummary(BaseModel):
    alertId: str
    title: str
    severity: Severity
    verdict: Literal["TRUE_POSITIVE"]
    confidence: float
    recommendationSummary: str
    linkedCaseId: Optional[str] = None


class Evidence(BaseModel):
    type: str
    detail: str


class TribunalPoint(BaseModel):
    point: str
    weight: float


class Tribunal(BaseModel):
    prosecutor: list[TribunalPoint]
    defender: list[TribunalPoint]
    verdict: Literal["TRUE_POSITIVE"]
    confidence: float


class Recommendation(BaseModel):
    severity: Severity
    actionItems: list[str]
    playbook: str


class CaseDetail(BaseModel):
    alertId: str
    title: str
    severity: Severity
    evidence: list[Evidence]
    tribunal: Tribunal
    recommendation: Recommendation


# ---------- Case Management Inbox ----------
CaseStatus = Literal["open", "in_progress", "done"]


class CaseAssignee(BaseModel):
    initials: str
    name: str


class CaseHistoryEvent(BaseModel):
    id: str
    type: Literal["created", "assigned", "status_change", "note"]
    actor: str
    detail: str
    timestamp: str


class InboxCaseSummary(BaseModel):
    id: str
    title: str
    severity: Severity
    status: CaseStatus
    tags: list[str]
    assignee: Optional[CaseAssignee] = None
    createdAt: str
    dueAt: str
    slaHours: int
    elapsedHours: int
    tasksDone: int
    tasksTotal: int
    flags: int = 0
    attachments: int = 0
    aiSummary: str
    sourceAlertId: Optional[str] = None
    linkedRuleId: Optional[str] = None


class InboxCaseDetail(InboxCaseSummary):
    history: list[CaseHistoryEvent]


class InboxStats(BaseModel):
    open: int
    inProgress: int
    done: int
    total: int


class InboxCaseCreate(BaseModel):
    id: str = Field(..., min_length=3, max_length=32)
    title: str = Field(..., min_length=1, max_length=256)
    severity: Severity
    status: CaseStatus = "open"
    tags: list[str] = []
    assignee: Optional[CaseAssignee] = None
    createdAt: str
    dueAt: str
    slaHours: int = 8
    elapsedHours: int = 0
    tasksDone: int = 0
    tasksTotal: int = 5
    flags: int = 0
    attachments: int = 0
    aiSummary: str = ""
    sourceAlertId: Optional[str] = None
    linkedRuleId: Optional[str] = None
    historyEvent: Optional[CaseHistoryEvent] = None


class InboxCasePatch(BaseModel):
    title: Optional[str] = Field(None, max_length=256)
    severity: Optional[Severity] = None
    status: Optional[CaseStatus] = None
    tags: Optional[list[str]] = None
    assignee: Optional[CaseAssignee] = None
    unassign: bool = False
    flags: Optional[int] = None
    tasksDone: Optional[int] = None
    tasksTotal: Optional[int] = None
    historyEvent: Optional[CaseHistoryEvent] = None
    note: Optional[str] = Field(None, max_length=4000)


# ---------- Recommended Rules (11.4) ----------
RuleStatus = Literal["pending", "approved", "rejected"]
# Which n8n AI node proposed the rule: incident-response or Active Directory.
RuleCategory = Literal["incident-response", "ad"]


class RuleSummary(BaseModel):
    id: str
    title: str
    severity: Severity
    sourceAlertId: str
    linkedCaseId: Optional[str] = None
    status: RuleStatus
    category: RuleCategory
    proposedAt: str
    reviewedBy: Optional[str] = None
    reviewedAt: Optional[str] = None


class RuleDetail(BaseModel):
    id: str
    title: str
    description: str
    severity: Severity
    sourceAlertId: str
    linkedCaseId: Optional[str] = None
    status: RuleStatus
    category: RuleCategory
    sigma: str  # Sigma detection rule (YAML)
    kql: str  # secondary translated query
    rejectReason: Optional[str] = None
    proposedAt: str
    reviewedBy: Optional[str] = None
    reviewedAt: Optional[str] = None


class RuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[Severity] = None
    sigma: Optional[str] = None
    kql: Optional[str] = None


class RuleCreate(BaseModel):
    title: str
    description: str = ""
    severity: Severity = "medium"
    category: RuleCategory = "incident-response"
    sigma: str
    kql: str = ""
    sourceAlertId: str = "manual"


class RejectRequest(BaseModel):
    reason: str


# ---------- AGI Pentest (11.5) ----------
class Tactic(BaseModel):
    id: str
    name: str
    techniqueCount: int


class TechniqueTest(BaseModel):
    index: int
    name: str
    platforms: list[str] = []
    elevation_required: bool = False
    domain_required: bool = False
    executor: str = ""


class Technique(BaseModel):
    id: str
    name: str
    tactic: str
    testCount: int
    blockedCount: int
    adBadge: bool
    status: str
    tests: list[TechniqueTest] = []


class TestSelectionInput(BaseModel):
    technique_id: str
    test_index: int = 0


class PentestTarget(BaseModel):
    """Full per-target config, mirrors the engine Target model."""
    name: str = "localhost"
    os_platform: Literal["windows", "linux", "macos"] = "windows"
    privilege: Literal["admin", "standard_user"] = "admin"
    connection: Literal["local", "remote"] = "local"
    domain_joined: bool = False
    host: str = "localhost"
    winrm_username: str = ""
    winrm_password: str = ""
    winrm_transport: Literal["ntlm", "kerberos", "credssp", "negotiate", "basic"] = "ntlm"
    winrm_port: int = 5985
    winrm_ssl: bool = False
    notes: str = ""


class RunScope(BaseModel):
    runAs: Literal["administrator", "domain-user"]
    targets: list[str]
    window: str
    # Full per-target configs (WinRM, OS, privilege…). When present, these
    # drive the live engine run; `targets`/`runAs` stay for display + mock.
    targetConfigs: list[PentestTarget] = []


class CreateRunRequest(BaseModel):
    scope: RunScope
    # Preferred: explicit per-test selections (technique_id + test_index).
    selections: list[TestSelectionInput] = []
    # Legacy: technique ids only; provider resolves a default test index.
    selectedTechniques: list[str] = []


class CreateRunResponse(BaseModel):
    runId: str
    status: str


class RunStep(BaseModel):
    id: str
    technique: str
    status: Literal["queued", "running", "done"]


class Finding(BaseModel):
    id: str
    title: str
    severity: Severity
    asset: str
    recommendation: str


class AiAnalysis(BaseModel):
    summary: str
    riskScore: int


class SiemIngest(BaseModel):
    """Telemetry from an executed Atomic Red Team test, ingested into Wazuh/SIEM."""
    technique: str
    techniqueName: str
    eventsIngested: int
    source: str  # e.g. "Sysmon", "Windows Security"
    wazuhRuleId: str
    level: int  # Wazuh alert level
    sigmaRule: Optional[str] = None
    detected: bool


class RunDetail(BaseModel):
    id: str
    status: str
    scope: RunScope
    steps: list[RunStep]
    findings: list[Finding]
    siemIngestion: list[SiemIngest] = []
    aiAnalysis: AiAnalysis


# ---------- AGI Pentest engine passthroughs ----------
class ProviderInfo(BaseModel):
    model_id: str
    provider: str


class TechniqueSearchResult(BaseModel):
    technique_id: str
    display_name: str
    test_count: int


class EngineFinding(BaseModel):
    severity: str
    technique_id: str = ""
    tactic: str = ""
    target_id: str = ""
    title: str = ""
    detail: str = ""
    evidence: str = ""
    recommendation: str = ""


class AnalysisReport(BaseModel):
    executive_summary: str = ""
    risk_level: str = "info"
    findings: list[EngineFinding] = []
    succeeded_techniques: list[str] = []
    failed_techniques: list[str] = []
    key_observations: list[str] = []
    attack_path: str = ""
    timestamp: str = ""
    error: Optional[str] = None


class RawResultFile(BaseModel):
    job_id: str
    filename: str
    size_bytes: int = 0
    path: str = ""
    url: str = ""
    analysis_url: str = ""


class RawResultsList(BaseModel):
    results_dir: str = ""
    count: int = 0
    files: list[RawResultFile] = []


# ---------- ATT&CK Navigator coverage ----------
class CoverageEntry(BaseModel):
    techniqueID: str
    name: str
    tactic: str
    tested: bool
    detected: bool
    score: int
    sigmaRule: Optional[str] = None
    comment: str


# ---------- SOC Chat ----------
class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


ChatMode = Literal["auto", "search", "analyze", "hunt", "brief"]
ChatScope = Literal["all", "cases", "alerts", "rules", "detection"]


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    history: list[ChatHistoryMessage] = []
    mode: ChatMode = "auto"
    scope: ChatScope = "all"
    context_path: str | None = Field(None, max_length=256)
    time_range: str | None = Field(None, max_length=16)


class ChatCitation(BaseModel):
    kind: Literal["case", "alert", "rule", "page"]
    id: str
    title: str
    path: str


class ChatAction(BaseModel):
    label: str
    path: str
    kind: Literal["navigate", "filter"] = "navigate"


class ChatResponse(BaseModel):
    reply: str
    source: Literal["local", "openrouter", "openai", "anthropic"]
    citations: list[ChatCitation] = []
    actions: list[ChatAction] = []
    mode: ChatMode = "auto"


# ---------- Threat Hunt ----------
class HuntPlanStep(BaseModel):
    label: str
    detail: str
    done: bool = False


class HuntFinding(BaseModel):
    id: str
    name: str
    summary: str
    status: Literal["Malicious", "Suspicious", "Unknown", "Benign"]
    severity: str | None = None
    path: str | None = None
    kind: str | None = None


class HuntDiscoveryItem(BaseModel):
    id: str
    label: str
    status: str = "Unknown"
    meta: str | None = None


class HuntDiscoveries(BaseModel):
    hosts: list[HuntDiscoveryItem] = []
    files: list[HuntDiscoveryItem] = []
    network: list[HuntDiscoveryItem] = []
    other: list[HuntDiscoveryItem] = []


class HuntRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    history: list[ChatHistoryMessage] = []
    time_range: str | None = Field(None, max_length=16)
    context_path: str | None = Field(None, max_length=256)


class HuntResponse(BaseModel):
    reply: str
    source: Literal["local", "openrouter", "openai", "anthropic"]
    thought_seconds: int = 3
    plan: list[HuntPlanStep] = []
    confirmed: list[HuntFinding] = []
    leads: list[HuntFinding] = []
    discoveries: HuntDiscoveries
    raw: list[dict] = []
    citations: list[ChatCitation] = []
    actions: list[ChatAction] = []
    query: str
    ran_at: str


# ---------- CRAMM (Risk Matrix) ----------
class CrammStats(BaseModel):
    totalRisks: int
    criticalCount: int
    highSeverityCount: int
    avgHealthScore: int


class CrammInsight(BaseModel):
    message: str
    ctaLabel: str
    trendPct: int


class CrammRiskSummary(BaseModel):
    id: str
    techniqueId: str
    title: str
    description: str
    riskScore: float
    severity: Literal["critical", "high", "medium"]
    tags: list[str]
    crammLevel: int


class CrammMatrix(BaseModel):
    stats: CrammStats
    insight: CrammInsight
    critical: list[CrammRiskSummary]
    high: list[CrammRiskSummary]


class CrammAssetContext(BaseModel):
    name: str
    assetValue: int
    principalName: str
    domainPath: str
    privilegeLevel: str
    note: str


class CrammVector(BaseModel):
    label: str
    pct: int
    tone: Literal["cyan", "rose", "amber", "violet"] = "cyan"


class CrammAssessment(BaseModel):
    model: str
    standard: str
    assetValue: int
    assetValueNote: str
    threatDegree: int
    threatDegreeNote: str
    exposureFactor: int
    exposureFactorNote: str
    criticalityPct: int
    vectors: list[CrammVector]
    enterpriseAle: int


class CrammControl(BaseModel):
    id: str
    title: str
    description: str
    priority: Literal["high", "medium", "low"]


class CrammDetail(BaseModel):
    id: str
    techniqueId: str
    title: str
    subtitle: str
    description: str
    severity: str
    severityLabel: str
    mitreId: str
    crammLevel: int
    riskScore: int
    riskScoreLabel: str
    annualLoss: int
    annualLossLabel: str
    resolutionWindow: str
    systemId: str
    asset: CrammAssetContext
    assessment: CrammAssessment
    controls: list[CrammControl]
    linkedCaseId: Optional[str] = None
    linkedAlertId: Optional[str] = None


class CrammAuditItem(BaseModel):
    id: str
    category: str
    title: str
    description: str
    status: Literal["pass", "warning", "fail"]
    techniqueId: str
    finding: str


class CrammAudit(BaseModel):
    title: str
    scope: str
    trendPct: int
    summary: str
    items: list[CrammAuditItem]
    linkedRisks: list[str]


class CrammExportReport(BaseModel):
    generatedAt: str
    matrix: CrammMatrix
    audit: CrammAudit
