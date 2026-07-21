import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import PageTransition from "./components/PageTransition";
import PlayersPage from "./pages/PlayersPage";
import MatchesPage from "./pages/MatchesPage";
import StoryPage from "./pages/StoryPage";
import FormationPage from "./pages/FormationPage";

export default function App() {
  const location = useLocation();
  return (
    <div className="min-h-full pb-20">
      {/* key ต่อ path เพื่อเล่น enter-animation ซ้ำทุกครั้งที่เปลี่ยนแท็บ
          (ไม่ใช้ AnimatePresence mode="wait" เพราะ deadlock กับ StrictMode) */}
      <PageTransition key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Navigate to="/players" replace />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/story" element={<StoryPage />} />
          <Route path="/formation" element={<FormationPage />} />
          <Route path="*" element={<Navigate to="/players" replace />} />
        </Routes>
      </PageTransition>
      <BottomNav />
    </div>
  );
}
