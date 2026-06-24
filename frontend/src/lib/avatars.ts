const API_BASE = (import.meta.env.VITE_API_BASE ?? "http://localhost:8000").replace(/\/$/, "");

/** Turn a BFF-relative avatar path into a full URL for <img src>. */
export function resolveAvatarUrl(path: string | null | undefined, cacheBust?: number): string | null {
  if (!path) return null;
  const base = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  if (cacheBust) {
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}v=${cacheBust}`;
  }
  return base;
}

export function userInitials(username: string | null | undefined): string {
  return (username ?? "U").slice(0, 2).toUpperCase();
}
