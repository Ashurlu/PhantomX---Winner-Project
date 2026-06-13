import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Login } from "@/pages/Login";
import { Signup } from "@/pages/Signup";
import { OverviewPage } from "@/modules/overview/OverviewPage";
import { AiCourtPage } from "@/modules/ai-court/AiCourtPage";
import { RulesPage } from "@/modules/rules/RulesPage";
import { PentestPage } from "@/modules/pentest/PentestPage";
import { AdminPage } from "@/modules/admin/AdminPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/ai-court" element={<AiCourtPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/pentest" element={<PentestPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireRole="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="/" element={<Navigate to="/overview" replace />} />
      <Route path="*" element={<Navigate to="/overview" replace />} />
    </Routes>
  );
}
