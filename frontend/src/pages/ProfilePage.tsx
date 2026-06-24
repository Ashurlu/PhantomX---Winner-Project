import { useEffect, useRef, useState } from "react";
import { Camera, KeyRound, Loader2, Mail, Save, Trash2, User } from "lucide-react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/UserAvatar";
import { ErrorState, LoadingState } from "@/components/States";
import { ModuleHero, ModulePanel } from "@/components/module";
import { toast } from "@/components/ui/sonner";
import {
  useChangeOwnPassword,
  useDeleteAvatar,
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
} from "@/lib/api";
import { resolveAvatarUrl } from "@/lib/avatars";
import { useAuth } from "@/store/auth";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function ProfilePage() {
  const profile = useProfile();
  const username = useAuth((s) => s.username);
  const role = useAuth((s) => s.role);
  const avatarUrl = useAuth((s) => s.avatarUrl);
  const setAvatarUrl = useAuth((s) => s.setAvatarUrl);
  const setUsername = useAuth((s) => s.setUsername);
  const setToken = useAuth((s) => s.setToken);

  const upload = useUploadAvatar();
  const remove = useDeleteAvatar();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangeOwnPassword();

  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    if (profile.data) {
      setDisplayName(profile.data.username);
      setEmail(profile.data.email ?? "");
    } else if (username) {
      setDisplayName(username);
    }
  }, [profile.data, username]);

  if (profile.isError) {
    return <ErrorState message="Could not load your profile." onRetry={() => profile.refetch()} />;
  }

  if (profile.isLoading || !profile.data) {
    return <LoadingState label="Loading profile…" />;
  }

  const onPickPhoto = () => fileRef.current?.click();

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|gif|webp)$/i.test(file.name)) {
      toast.error("Please choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be 2 MB or smaller.");
      return;
    }
    setPhotoBusy(true);
    try {
      const p = await upload.mutateAsync(file);
      setAvatarUrl(resolveAvatarUrl(p.avatarUrl, Date.now()));
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setPhotoBusy(false);
    }
  };

  const onRemovePhoto = async () => {
    setPhotoBusy(true);
    try {
      await remove.mutateAsync();
      setAvatarUrl(null);
      toast.success("Profile photo removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove photo");
    } finally {
      setPhotoBusy(false);
    }
  };

  const saveAccount = async () => {
    const nextUser = displayName.trim();
    const nextEmail = email.trim() || null;
    if (nextUser.length < 3) {
      toast.error("Username must be at least 3 characters.");
      return;
    }
    try {
      const payload: { username?: string; email?: string | null } = {};
      if (nextUser !== profile.data.username) payload.username = nextUser;
      if (nextEmail !== (profile.data.email ?? null)) payload.email = nextEmail;
      if (!Object.keys(payload).length) {
        toast.message("No changes to save");
        return;
      }
      const res = await updateProfile.mutateAsync(payload);
      if (res.token) setToken(res.token);
      if (res.profile.username !== username) setUsername(res.profile.username);
      if (res.profile.avatarUrl !== undefined) {
        setAvatarUrl(resolveAvatarUrl(res.profile.avatarUrl));
      }
      toast.success("Account updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const savePassword = async () => {
    if (newPw.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword: currentPw, newPassword: newPw });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      toast.success("Password changed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Password change failed");
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <ModuleHero
        accent="violet"
        section="Account"
        title="My Profile"
        description="Manage your photo, username, email, and password."
        stats={[
          { label: "Role", value: role ?? "—", accent: "#8B5CF6" },
          { label: "Username", value: displayName || username || "—", accent: "#22D3EE" },
        ]}
      />

      <ModulePanel className="p-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="h-4 w-4 text-accent" />
            Profile photo
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-6">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={onPhoto}
          />
          <UserAvatar username={displayName} avatarUrl={avatarUrl} size={88} className="ring-4 ring-accent/20" />
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              JPEG, PNG, WebP, or GIF · max 2 MB
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={onPickPhoto} disabled={photoBusy}>
                {photoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {avatarUrl ? "Change photo" : "Upload photo"}
              </Button>
              {avatarUrl && (
                <Button size="sm" variant="outline" onClick={onRemovePhoto} disabled={photoBusy}>
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </ModulePanel>

      <ModulePanel className="p-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-accent" />
            Account details
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Role</span>
            <Badge variant="secondary" className="capitalize">
              {role}
            </Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Username
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="pl-9"
                  autoComplete="email"
                />
              </div>
            </div>
          </div>
          {profile.data.lastLogin && (
            <p className="text-xs text-muted-foreground">
              Last sign-in: {new Date(profile.data.lastLogin).toLocaleString()}
            </p>
          )}
          <div className="flex justify-end border-t border-border/40 pt-4">
            <Button onClick={saveAccount} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save account
            </Button>
          </div>
        </CardContent>
      </ModulePanel>

      <ModulePanel className="p-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-accent" />
            Change password
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Current password
            </label>
            <Input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                New password
              </label>
              <Input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Confirm new password
              </label>
              <Input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="flex justify-end border-t border-border/40 pt-4">
            <Button
              onClick={savePassword}
              disabled={changePassword.isPending || !currentPw || !newPw}
            >
              {changePassword.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              Update password
            </Button>
          </div>
        </CardContent>
      </ModulePanel>
    </div>
  );
}
