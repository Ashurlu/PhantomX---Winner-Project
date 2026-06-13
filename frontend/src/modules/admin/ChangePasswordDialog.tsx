import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { useSetUserPassword } from "@/lib/api";

export function ChangePasswordDialog({
  username,
  disabled,
}: {
  username: string;
  disabled?: boolean;
}) {
  const setPassword = useSetUserPassword();
  const [open, setOpen] = useState(false);
  const [password, setPassword2] = useState("");
  const [confirm, setConfirm] = useState("");

  const submit = async () => {
    if (password.length < 6) {
      toast.error("Password too short", { description: "At least 6 characters." });
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    try {
      await setPassword.mutateAsync({ username, password });
      toast.success(`Password reset for ${username}`);
      setPassword2("");
      setConfirm("");
      setOpen(false);
    } catch (e) {
      toast.error("Reset failed", { description: String((e as Error).message) });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setPassword2("");
          setConfirm("");
        }
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={disabled}
        title="Reset password"
        onClick={() => setOpen(true)}
      >
        <KeyRound className="h-4 w-4" />
      </Button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Reset password — {username}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              New password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="Min 6 characters"
              autoComplete="new-password"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Confirm password
            </label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              autoComplete="new-password"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border/40 pt-3">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={setPassword.isPending}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={setPassword.isPending}>
              {setPassword.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              Set password
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
