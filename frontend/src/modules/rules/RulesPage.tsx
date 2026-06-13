import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Network,
  ShieldAlert,
  ShieldHalf,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/States";
import { useRules } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { RuleDetailDialog } from "./RuleDetailDialog";
import { NewRuleDialog } from "./NewRuleDialog";
import type { RuleCategory, RuleStatus, RuleSummary } from "@/lib/types";

const STATUS_META: Record<
  RuleStatus,
  { label: string; icon: typeof Clock; cls: string }
> = {
  pending: { label: "Pending", icon: Clock, cls: "text-accent" },
  approved: { label: "Approved", icon: CheckCircle2, cls: "text-severity-resolved" },
  rejected: { label: "Rejected", icon: XCircle, cls: "text-destructive" },
};

const CATEGORY_META: Record<
  RuleCategory,
  { label: string; icon: typeof ShieldAlert; node: string }
> = {
  "incident-response": {
    label: "Incident Response",
    icon: ShieldAlert,
    node: "IR AI node",
  },
  ad: { label: "Active Directory", icon: Network, node: "AD AI node" },
};

export function RulesPage() {
  const { data, isLoading, isError, refetch } = useRules();
  const isAdmin = useAuth((s) => s.role === "admin");
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<RuleCategory>("incident-response");

  const irRules = data?.filter((r) => r.category === "incident-response") ?? [];
  const adRules = data?.filter((r) => r.category === "ad") ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold">
            <ShieldHalf className="h-5 w-5 text-primary" />
            Recommended Sigma Rules
          </h2>
          <p className="text-sm text-muted-foreground">
            Proposed by the n8n AI nodes from true-positive alerts · approved by hand
          </p>
        </div>
        {isAdmin ? (
          <NewRuleDialog defaultCategory={tab} />
        ) : (
          <Badge variant="outline" className="text-xs">
            Read-only (analyst)
          </Badge>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as RuleCategory)}>
        <TabsList>
          <TabsTrigger value="incident-response" className="gap-2">
            <ShieldAlert className="h-4 w-4" /> Incident Response
            <CountChip n={irRules.length} />
          </TabsTrigger>
          <TabsTrigger value="ad" className="gap-2">
            <Network className="h-4 w-4" /> Active Directory
            <CountChip n={adRules.length} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incident-response">
          <CategoryPanel
            category="incident-response"
            rules={irRules}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            onOpen={setSelected}
          />
        </TabsContent>
        <TabsContent value="ad">
          <CategoryPanel
            category="ad"
            rules={adRules}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            onOpen={setSelected}
          />
        </TabsContent>
      </Tabs>

      <RuleDetailDialog
        ruleId={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function CategoryPanel({
  category,
  rules,
  isLoading,
  isError,
  onRetry,
  onOpen,
}: {
  category: RuleCategory;
  rules: RuleSummary[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onOpen: (id: string) => void;
}) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  const counts = {
    pending: rules.filter((r) => r.status === "pending").length,
    approved: rules.filter((r) => r.status === "approved").length,
    rejected: rules.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Pending" value={counts.pending} status="pending" />
        <SummaryCard label="Approved" value={counts.approved} status="approved" />
        <SummaryCard label="Rejected" value={counts.rejected} status="rejected" />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="h-4 w-4 text-primary" />
            {meta.label} Rules
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            source: {meta.node}
          </Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState message="Failed to load rules." onRetry={onRetry} />
          ) : !rules.length ? (
            <EmptyState label={`No ${meta.label} rules yet.`} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Source Alert</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Proposed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r) => (
                  <RuleRow key={r.id} r={r} onOpen={() => onOpen(r.id)} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CountChip({ n }: { n: number }) {
  return (
    <span className="ml-1 rounded-full bg-primary/20 px-1.5 text-[10px] font-bold text-primary">
      {n}
    </span>
  );
}

function RuleRow({ r, onOpen }: { r: RuleSummary; onOpen: () => void }) {
  const meta = STATUS_META[r.status];
  const Icon = meta.icon;
  return (
    <TableRow className="cursor-pointer" onClick={onOpen}>
      <TableCell className="font-mono text-xs text-secondary">{r.id}</TableCell>
      <TableCell className="font-medium">{r.title}</TableCell>
      <TableCell>
        <SeverityBadge severity={r.severity} />
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {r.sourceAlertId}
      </TableCell>
      <TableCell>
        <span className={`flex items-center gap-1.5 text-xs font-semibold ${meta.cls}`}>
          <Icon className="h-3.5 w-3.5" />
          {meta.label}
        </span>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {new Date(r.proposedAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </TableCell>
    </TableRow>
  );
}

function SummaryCard({
  label,
  value,
  status,
}: {
  label: string;
  value: number;
  status: RuleStatus;
}) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span className="font-display text-3xl font-bold">{value}</span>
        </div>
        <Icon className={`h-7 w-7 ${meta.cls}`} />
      </div>
    </Card>
  );
}
