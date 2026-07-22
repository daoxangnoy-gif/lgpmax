import { useState } from "react";
import { Plus, MapPin, Users } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import EnvBanner from "@/components/EnvBanner";
import MatchFormDialog from "@/components/MatchFormDialog";
import MatchDetailSheet from "@/components/MatchDetailSheet";
import { useMatches } from "@/hooks/useMatches";
import { useAuth } from "@/hooks/useAuth";
import { usePlayers } from "@/hooks/usePlayers";
import { useRegistrations } from "@/hooks/useRegistrations";
import { formatMatchWhen, scoreText, venueText } from "@/lib/format";
import type { Match } from "@/types";

/** รายชื่อคนที่ยืนยันมาแล้ว แสดงในการ์ดนัด */
function MatchCardAttendees({ matchId }: { matchId: string }) {
  const { data: players = [] } = usePlayers();
  const { data: regs = [] } = useRegistrations(matchId);
  const goingIds = new Set(regs.filter((r) => r.status === "going").map((r) => r.player_id));
  const going = players.filter((p) => goingIds.has(p.id));
  if (going.length === 0) return null;
  return (
    <div className="mt-2 flex items-center gap-1.5 text-xs">
      <span className="flex h-5 items-center rounded-full bg-emerald-500/20 px-2 font-bold text-emerald-400">
        มา {going.length}
      </span>
      <span className="truncate text-[hsl(var(--text-muted))]">
        {going.map((p) => p.name).join(", ")}
      </span>
    </div>
  );
}

export default function MatchesPage() {
  const { data: matches = [], isLoading, error } = useMatches();
  const { can } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Match | null>(null);
  const [detail, setDetail] = useState<Match | null>(null);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(m: Match) {
    setDetail(null);
    setEditing(m);
    setFormOpen(true);
  }

  return (
    <div>
      <AppHeader
        title="นัดแข่ง"
        subtitle={`ทั้งหมด ${matches.length} นัด`}
        right={
          can("matches", "create") ? (
            <button className="btn-brand" onClick={openNew}>
              <Plus size={18} /> สร้างนัด
            </button>
          ) : undefined
        }
      />
      <EnvBanner />

      <div className="mx-auto max-w-lg space-y-3 px-4 py-3">
        {isLoading && <p className="py-10 text-center text-[hsl(var(--text-muted))]">กำลังโหลด...</p>}
        {error && <p className="py-10 text-center text-red-400">โหลดข้อมูลไม่ได้</p>}
        {!isLoading && matches.length === 0 && (
          <p className="py-10 text-center text-[hsl(var(--text-muted))]">
            ยังไม่มีนัด — กด “สร้างนัด”
          </p>
        )}

        {matches.map((m) => {
          const score = scoreText(m);
          return (
            <button
              key={m.id}
              onClick={() => setDetail(m)}
              className="card w-full p-4 text-left transition active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-[hsl(var(--text-muted))]">{formatMatchWhen(m)}</div>
                  <div className="mt-0.5 truncate text-base font-semibold">
                    พบ {m.opponent || "— ยังไม่ระบุคู่แข่ง"}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-[hsl(var(--text-muted))]">
                    <MapPin size={13} /> {venueText(m)}
                  </div>
                  <MatchCardAttendees matchId={m.id} />
                </div>
                {score ? (
                  <div className="rounded-xl bg-brand/20 px-3 py-1.5 text-center">
                    <div className="text-lg font-bold leading-none text-brand">{score}</div>
                    <div className="mt-0.5 text-[10px] text-[hsl(var(--text-muted))]">เรา-คู่แข่ง</div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 rounded-lg bg-[hsl(var(--surface-2))] px-2.5 py-1.5 text-xs text-[hsl(var(--text-muted))]">
                    <Users size={13} /> ลงชื่อ
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <MatchFormDialog open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />
      <MatchDetailSheet match={detail} onClose={() => setDetail(null)} onEdit={openEdit} />
    </div>
  );
}
