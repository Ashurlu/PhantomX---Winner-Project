import { useState } from "react";
import { cn } from "@/lib/utils";
import { resolveAvatarUrl, userInitials } from "@/lib/avatars";

export function UserAvatar({
  username,
  avatarUrl,
  size = 32,
  className,
}: {
  username?: string | null;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const src = resolveAvatarUrl(avatarUrl);
  const initials = userInitials(username);

  if (src && !broken) {
    return (
      <img
        src={src}
        alt={username ? `${username} avatar` : "User avatar"}
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full object-cover ring-2 ring-white/10", className)}
        style={{ width: size, height: size }}
        onError={() => setBroken(true)}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white ring-2 ring-white/10",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden={!username}
    >
      {initials}
    </span>
  );
}
