import { Skeleton } from "@/components/ui/skeleton";
import { useAdminQueryEnabled } from "@/store/auth";

/** Avoid infinite skeleton when admin queries are disabled before auth hydrates. */
export function AdminTabLoader({ children }: { children: React.ReactNode }) {
  const adminReady = useAdminQueryEnabled();
  if (!adminReady) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  return <>{children}</>;
}
