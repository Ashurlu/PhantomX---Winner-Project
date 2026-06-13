"""Pydantic models == the data contract (Section 11). DO NOT change shapes."""
from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel


# ---------- Auth (11.1) ----------
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    role: Literal["admin", "analyst"]
    username: str


class SignupRequest(BaseModel):
    username: str
    password: str


# ---------- Admin: users ----------
class UserOut(BaseModel):
    username: str
    role: Literal["admin", "analyst"]
    active: bool
    createdAt: str
    lastLogin: Optional[str] = None


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


# ---------- Recommended Rules (11.4) ----------
RuleStatus = Literal["pending", "approved", "rejected"]
# Which n8n AI node proposed the rule: incident-response or Active Directory.
RuleCategory = Literal["incident-response", "ad"]


class RuleSummary(BaseModel):
    id: str
    title: str
    severity: Severity
    sourceAlertId: str
    status: RuleStatus
    category: RuleCategory
    proposedAt: str


class RuleDetail(BaseModel):
    id: str
    title: str
    description: str
    severity: Severity
    sourceAlertId: str
    status: RuleStatus
    category: RuleCategory
    sigma: str  # Sigma detection rule (YAML)
    kql: str  # secondary translated query
    rejectReason: Optional[str] = None
    proposedAt: str


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
