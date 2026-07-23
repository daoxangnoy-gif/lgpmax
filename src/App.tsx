import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import BottomNav from "./components/BottomNav";
import PageTransition from "./components/PageTransition";
import SplashScreen from "./components/SplashScreen";
import PlayersPage from "./pages/PlayersPage";
import MatchesPage from "./pages/MatchesPage";
import StoryPage from "./pages/StoryPage";
import FormationPage from "./pages/FormationPage";
import LoginPage from "./pages/LoginPage";
import PendingPage from "./pages/PendingPage";
import UserAdminPage from "./pages/UserAdminPage";
import RegisterPage from "./pages/RegisterPage";
import SummaryPage from "./pages/SummaryPage";
import { useAuth } from "./hooks/useAuth";
import { MENUS, type MenuKey } from "./lib/auth";

export default function App() {
  const { loading, session, isApproved } = useAuth();

  if (loading) return <SplashScreen />;
  if (!session) return <LoginPage />;
  if (!isApproved) return <PendingPage />;
  return <AppShell />;
}

function AppShell() {
  const location = useLocation();
  const { isAdmin, can } = useAuth();

  const firstMenu = MENUS.find((m) => can(m.key, "view"))?.key;
  const home = firstMenu ? `/${firstMenu}` : "/no-access";

  return (
    <div className="min-h-full pb-20">
      <SplashScreen />
      <PageTransition key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Navigate to={home} replace />} />
          <Route path="/players" element={<Guard menu="players" home={home}><PlayersPage /></Guard>} />
          <Route path="/matches" element={<Guard menu="matches" home={home}><MatchesPage /></Guard>} />
          <Route path="/story" element={<Guard menu="story" home={home}><StoryPage /></Guard>} />
          <Route path="/formation" element={<Guard menu="formation" home={home}><FormationPage /></Guard>} />
          {isAdmin && <Route path="/admin" element={<UserAdminPage />} />}
          {/* ยืนยันลงทะเบียน — เข้าได้ทุกคนที่อนุมัติแล้ว (เป้าหมาย share link) */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/no-access" element={<NoAccess />} />
          <Route path="*" element={<Navigate to={home} replace />} />
        </Routes>
      </PageTransition>
      <BottomNav />
    </div>
  );
}

function Guard({ menu, home, children }: { menu: MenuKey; home: string; children: ReactNode }) {
  const { can } = useAuth();
  if (!can(menu, "view")) return <Navigate to={home} replace />;
  return <>{children}</>;
}

function NoAccess() {
  const { signOut, profile } = useAuth();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <img src="/logo.png" alt="" className="h-16 w-16 rounded-full opacity-70" />
      <div>
        <h1 className="text-lg font-bold">ยังไม่มีสิทธิ์เข้าเมนูใด</h1>
        <p className="mt-1 text-sm text-[hsl(var(--text-muted))]">
          {profile?.display_name || profile?.username} — ให้แอดมินตั้งสิทธิ์ให้ก่อน
        </p>
      </div>
      <button className="btn-ghost" onClick={signOut}>
        ออกจากระบบ
      </button>
    </div>
  );
}
