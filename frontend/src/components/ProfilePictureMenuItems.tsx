import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/sonner";
import { useDeleteAvatar, useUploadAvatar } from "@/lib/api";
import { resolveAvatarUrl } from "@/lib/avatars";
import { useAuth } from "@/store/auth";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function ProfilePictureMenuItems() {
  const inputRef = useRef<HTMLInputElement>(null);
  const avatarUrl = useAuth((s) => s.avatarUrl);
  const setAvatarUrl = useAuth((s) => s.setAvatarUrl);
  const upload = useUploadAvatar();
  const remove = useDeleteAvatar();
  const [busy, setBusy] = useState(false);

  const onPick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be 2 MB or smaller.");
      return;
    }
    setBusy(true);
    try {
      const profile = await upload.mutateAsync(file);
      setAvatarUrl(resolveAvatarUrl(profile.avatarUrl, Date.now()));
      toast.success("Profile picture updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async () => {
    if (!avatarUrl) return;
    setBusy(true);
    try {
      await remove.mutateAsync();
      setAvatarUrl(null);
      toast.success("Profile picture removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove photo");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={onFile}
      />
      <DropdownMenuItem disabled={busy} onClick={onPick}>
        <Camera className="h-4 w-4" />
        {avatarUrl ? "Change profile photo" : "Add profile photo"}
      </DropdownMenuItem>
      {avatarUrl && (
        <DropdownMenuItem
          disabled={busy}
          onClick={onRemove}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Remove profile photo
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
    </>
  );
}
