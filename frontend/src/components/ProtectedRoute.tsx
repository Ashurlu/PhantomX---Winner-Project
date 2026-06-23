import { Navigate, useLocation } from "react-router-dom";
import { LoadingState } from "@/components/States";
import { useAuth, useAuthHydrated, type Role } from "@/store/auth";

export function ProtectedRoute({
  children,
  requireRole,
}: {
  children: React.ReactNode;
  requireRole?: Role;
}) {
  const { token, role } = useAuth();
  const hasHydrated = useAuthHydrated();
  const location = useLocation();

  if (!hasHydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingState label="Restoring session…" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (requireRole && role !== requireRole) {
    return <Navigate to="/overview" replace />;
  }
  return <>{children}</>;
}
