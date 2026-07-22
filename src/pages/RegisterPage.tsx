import { useSearchParams } from "react-router-dom";
import { MapPin } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MatchAttendance from "@/components/MatchAttendance";
import { useMatches } from "@/hooks/useMatches";
import { formatMatchWhen, venueText } from "@/lib/format";

/** หน้ายืนยันลงทะเบียน (เป้าหมายของ share link #/register?m=<id>) */
export default function RegisterPage() {
  const [sp] = useSearchParams();
  const id = sp.get("m");
  const { data: matches = [], isLoading } = useMatches();
  const match = matches.find((m) => m.id === id) ?? null;

  return (
    <div>
      <AppHeader title="ลงทะเบียนมาแข่ง" subtitle="ยืนยันการมาของคุณ" />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-3">
        {isLoading ? (
          <p className="py-10 text-center text-[hsl(var(--text-muted))]">กำลังโหลด...</p>
        ) : !match ? (
          <p className="py-10 text-center text-[hsl(var(--text-muted))]">
            ไม่พบนัดนี้ (อาจถูกลบ หรือคุณไม่มีสิทธิ์ดูนัดแข่ง)
          </p>
        ) : (
          <>
            <div className="card p-4">
              <div className="text-xs text-[hsl(var(--text-muted))]">{formatMatchWhen(match)}</div>
              <div className="mt-0.5 text-lg font-semibold">พบ {match.opponent || "คู่แข่ง"}</div>
              <div className="mt-1 flex items-center gap-1 text-xs text-[hsl(var(--text-muted))]">
                <MapPin size={13} /> {venueText(match)}
              </div>
            </div>
            <MatchAttendance match={match} />
          </>
        )}
      </div>
    </div>
  );
}
