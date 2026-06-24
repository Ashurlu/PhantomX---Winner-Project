import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { ApiError, useCreateUser } from "@/lib/api";

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,32}$/;

export function CreateUserDialog() {
  const create = useCreateUser();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "analyst">("analyst");

  const reset = () => {
    setUsername("");
    setPassword("");
    setRole("analyst");
  };

  const submit = async () => {
    const name = username.trim();
    if (!USERNAME_RE.test(name)) {
      toast.error("Invalid username", {
        description: "Use 3–32 characters: letters, numbers, - or _ only.",
      });
      return;
    }
    if (password.length < 6) {
      toast.error("Password too short", { description: "At least 6 characters." });
      return;
    }
    try {
      const u = await create.mutateAsync({ username: name, password, role });
      toast.success(`User ${u.username} created`, { description: `Role: ${u.role}` });
      reset();
      setOpen(false);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Unknown error";
      toast.error("Could not create user", {
        description:
          msg.includes("404") || msg.includes("Failed to fetch")
            ? `${msg} — is the backend running on port 8000?`
            : msg,
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4" /> Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" /> Create User
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. jsmith"
              autoFocus
              autoComplete="off"
            />
            <p className="text-[11px] text-muted-foreground">Letters, numbers, hyphen, underscore only.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Role</label>
            <div className="flex gap-2">
              {(["analyst", "admin"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm capitalize transition-colors ${
                    role === r
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border/40 pt-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={create.isPending}>
              Cancel
            </Button>
            <Button type="button" onClick={submit} disabled={create.isPending}>
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Create user
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
