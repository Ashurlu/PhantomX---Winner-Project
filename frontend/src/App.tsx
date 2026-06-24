import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MarketingLayout } from "@/pages/marketing/MarketingLayout";
import { Home } from "@/pages/marketing/Home";
import { ModulesPage } from "@/pages/marketing/ModulesPage";
import { HowItWorksPage } from "@/pages/marketing/HowItWorksPage";
import { StackPage } from "@/pages/marketing/StackPage";
import { Login } from "@/pages/Login";
import { Signup } from "@/pages/Signup";
import { OverviewPage } from "@/modules/overview/OverviewPage";
import { DetectionPage } from "@/modules/detection/DetectionPage";
import { AiCourtPage } from "@/modules/ai-court/AiCourtPage";
import { CasesInboxPage } from "@/modules/cases/CasesInboxPage";
import { RulesPage } from "@/modules/rules/RulesPage";
import { PentestPage } from "@/modules/pentest/PentestPage";
import { CrammPage } from "@/modules/cramm/CrammPage";
import { CrammDetailPage } from "@/modules/cramm/CrammDetailPage";
import { AdminPage } from "@/modules/admin/AdminPage";
import { ProfilePage } from "@/pages/ProfilePage";

export default function App() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/modules" element={<ModulesPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/stack" element={<StackPage />} />
      </Route>
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
        <Route path="/cases" element={<CasesInboxPage />} />
        <Route path="/detection" element={<DetectionPage />} />
        <Route path="/ai-court" element={<AiCourtPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/cramm" element={<CrammPage />} />
        <Route path="/cramm/:techniqueId" element={<CrammDetailPage />} />
        <Route path="/pentest" element={<PentestPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireRole="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
