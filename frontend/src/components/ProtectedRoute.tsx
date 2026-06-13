import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type Role } from "@/store/auth";

export function ProtectedRoute({
  children,
  requireRole,
}: {
  children: React.ReactNode;
  requireRole?: Role;
}) {
  const { token, role } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (requireRole && role !== requireRole) {
    return <Navigate to="/overview" replace />;
  }
  return <>{children}</>;
}
