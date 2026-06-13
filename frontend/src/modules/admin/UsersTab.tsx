import {
  ArrowDownCircle,
  ArrowUpCircle,
  Ban,
  CheckCircle2,
  Trash2,
  UserCog,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/States";
import { toast } from "@/components/ui/sonner";
import {
  useDeleteUser,
  useSetUserActive,
  useSetUserRole,
  useUsers,
} from "@/lib/api";
import { useAuth } from "@/store/auth";
import type { UserOut } from "@/lib/types";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { CreateUserDialog } from "./CreateUserDialog";

function formatLastLogin(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.floor((Date.now() - then) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} h ago`;
  if (diffSec < 7 * 86400) return `${Math.floor(diffSec / 86400)} d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UsersTab() {
  const { data, isLoading, isError, refetch } = useUsers();
  const me = useAuth((s) => s.username);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-4 w-4 text-primary" /> User Management
        </CardTitle>
        <CreateUserDialog />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message="Failed to load users." onRetry={() => refetch()} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((u) => (
                <UserRow key={u.username} u={u} isSelf={u.username === me} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function UserRow({ u, isSelf }: { u: UserOut; isSelf: boolean }) {
  const setRole = useSetUserRole();
  const setActive = useSetUserActive();
  const del = useDeleteUser();
  const busy = setRole.isPending || setActive.isPending || del.isPending;

  const promote = async () => {
    const role = u.role === "admin" ? "analyst" : "admin";
    try {
      await setRole.mutateAsync({ username: u.username, role });
      toast.success(`${u.username} is now ${role}`);
    } catch (e) {
      toast.error("Role change failed", { description: String((e as Error).message) });
    }
  };

  const toggleActive = async () => {
    try {
      await setActive.mutateAsync({ username: u.username, active: !u.active });
      toast.success(`${u.username} ${!u.active ? "activated" : "deactivated"}`);
    } catch (e) {
      toast.error("Status change failed", { description: String((e as Error).message) });
    }
  };

  const remove = async () => {
    try {
      await del.mutateAsync(u.username);
      toast.success(`${u.username} deleted`);
    } catch (e) {
      toast.error("Delete failed", { description: String((e as Error).message) });
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        {u.username}
        {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
      </TableCell>
      <TableCell>
        <Badge variant={u.role === "admin" ? "default" : "secondary"} className="capitalize">
          {u.role}
        </Badge>
      </TableCell>
      <TableCell>
        {u.active ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-severity-resolved">
            <CheckCircle2 className="h-3.5 w-3.5" /> Active
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Ban className="h-3.5 w-3.5" /> Disabled
          </span>
        )}
      </TableCell>
      <TableCell className="text-xs">
        {u.lastLogin ? (
          <span className="text-foreground/90" title={new Date(u.lastLogin).toLocaleString()}>
            {formatLastLogin(u.lastLogin)}
          </span>
        ) : (
          <span className="text-muted-foreground">Never</span>
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {new Date(u.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={promote}
            disabled={busy}
            title={u.role === "admin" ? "Demote to analyst" : "Promote to admin"}
          >
            {u.role === "admin" ? (
              <ArrowDownCircle className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpCircle className="h-3.5 w-3.5" />
            )}
            {u.role === "admin" ? "Demote" : "Promote"}
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleActive} disabled={busy || isSelf}>
            {u.active ? "Disable" : "Enable"}
          </Button>
          <ChangePasswordDialog username={u.username} disabled={busy} />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={remove}
            disabled={busy || isSelf}
            title="Delete user"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
