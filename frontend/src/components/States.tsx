import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ label = "Loading telemetry…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <AlertTriangle className="h-8 w-8 text-severity-high" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium text-primary hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ label = "Nothing here yet." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
      <Inbox className="h-8 w-8 opacity-60" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function CardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  );
}
