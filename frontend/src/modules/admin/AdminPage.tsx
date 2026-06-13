import { useState } from "react";
import {
  Activity,
  KeyRound,
  ScrollText,
  Settings2,
  Users as UsersIcon,
  Wrench,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiKeysTab } from "./ApiKeysTab";
import { UsersTab } from "./UsersTab";
import { DataSourceTab } from "./DataSourceTab";
import { StatusTab } from "./StatusTab";
import { AuditLogTab } from "./AuditLogTab";
import { MaintenanceTab } from "./MaintenanceTab";

type AdminTab = "keys" | "users" | "data" | "audit" | "status" | "maintenance";

export function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("keys");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold">
          <Settings2 className="h-5 w-5 text-primary" />
          Admin Console
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage integration keys, users, data source, and system health.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as AdminTab)}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="w-max justify-start">
            <TabsTrigger value="keys" className="gap-2">
              <KeyRound className="h-4 w-4" /> API Keys
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <UsersIcon className="h-4 w-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Settings2 className="h-4 w-4" /> Data Source
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <ScrollText className="h-4 w-4" /> Audit Log
            </TabsTrigger>
            <TabsTrigger value="status" className="gap-2">
              <Activity className="h-4 w-4" /> System Status
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="gap-2">
              <Wrench className="h-4 w-4" /> Maintenance
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="keys">
          <ApiKeysTab />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="data">
          <DataSourceTab />
        </TabsContent>
        <TabsContent value="audit">
          <AuditLogTab />
        </TabsContent>
        <TabsContent value="status">
          <StatusTab />
        </TabsContent>
        <TabsContent value="maintenance">
          <MaintenanceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
