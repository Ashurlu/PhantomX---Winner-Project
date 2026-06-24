import { useState } from "react";
import {
  Activity,
  GitBranch,
  KeyRound,
  ScrollText,
  Settings2,
  Shield,
  Users as UsersIcon,
  Wrench,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuditLog, useSystemStatus, useUsers } from "@/lib/api";
import { ModuleHero, ModuleLiveBadge, ModulePanel } from "@/components/module";
import { ApiKeysTab } from "./ApiKeysTab";
import { UsersTab } from "./UsersTab";
import { DataSourceTab } from "./DataSourceTab";
import { StatusTab } from "./StatusTab";
import { AuditLogTab } from "./AuditLogTab";
import { MaintenanceTab } from "./MaintenanceTab";
import { InvestigationPipelineTab } from "./InvestigationPipelineTab";

type AdminTab = "keys" | "users" | "data" | "pipeline" | "audit" | "status" | "maintenance";

const TABS: {
  id: AdminTab;
  label: string;
  description: string;
  icon: typeof KeyRound;
}[] = [
  {
    id: "keys",
    label: "API Keys",
    description: "n8n, pentest engine, AI, and WinRM credentials",
    icon: KeyRound,
  },
  {
    id: "users",
    label: "Users",
    description: "Accounts, roles, and access control",
    icon: UsersIcon,
  },
  {
    id: "data",
    label: "Data Source",
    description: "Mock vs live upstream mode",
    icon: Settings2,
  },
  {
    id: "pipeline",
    label: "Investigation Pipeline",
    description: "Sankey chart nodes, links, and summary metrics",
    icon: GitBranch,
  },
  {
    id: "audit",
    label: "Audit Log",
    description: "Security-relevant actions across the platform",
    icon: ScrollText,
  },
  {
    id: "status",
    label: "System Status",
    description: "Connectivity and integration health",
    icon: Activity,
  },
  {
    id: "maintenance",
    label: "Maintenance",
    description: "Export config and reset demo data",
    icon: Wrench,
  },
];

export function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("keys");
  const status = useSystemStatus();
  const users = useUsers();
  const audit = useAuditLog();

  const activeMeta = TABS.find((t) => t.id === tab)!;
  const live = status.data?.dataSource === "live";
  const userCount = users.data?.length ?? 0;
  const auditCount = audit.data?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <ModuleHero
        accent="emerald"
        section="Administration"
        title="Admin Console"
        description="Integration keys, user lifecycle, data source mode, and operational health — in one place."
        badges={
          <>
            <ModuleLiveBadge live={live} label={live ? "Live data" : "Mock data"} />
            <Badge variant="secondary">{userCount} users</Badge>
            <Badge variant="secondary">{auditCount} audit events</Badge>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Sidebar nav */}
        <nav className="flex flex-col gap-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                  active
                    ? "border-accent/40 bg-accent/10 text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon
                  className={cn("mt-0.5 h-4 w-4 shrink-0", active ? "text-accent" : "")}
                />
                <span>
                  <span className="block text-sm font-semibold">{t.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug opacity-80">
                    {t.description}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="min-w-0">
          <Card className="mb-4 border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-sm font-medium text-foreground">{activeMeta.label}</p>
            <p className="text-xs text-muted-foreground">{activeMeta.description}</p>
          </Card>

          {tab === "keys" && <ApiKeysTab />}
          {tab === "users" && <UsersTab />}
          {tab === "data" && <DataSourceTab />}
          {tab === "pipeline" && <InvestigationPipelineTab />}
          {tab === "audit" && <AuditLogTab />}
          {tab === "status" && <StatusTab />}
          {tab === "maintenance" && <MaintenanceTab />}
        </div>
      </div>
    </div>
  );
}
