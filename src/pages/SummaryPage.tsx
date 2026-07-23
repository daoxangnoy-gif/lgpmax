import { useMemo } from "react";
import AppHeader from "@/components/AppHeader";
import PlayerStatsTable from "@/components/PlayerStatsTable";
import { useMatches } from "@/hooks/useMatches";
import { usePlayers } from "@/hooks/usePlayers";

export default function SummaryPage() {
  const { data: matches = [] } = useMatches();
  const { data: players = [] } = usePlayers();

  const rec = useMemo(() => {
    let win = 0, draw = 0, loss = 0, gf = 0, ga = 0, played = 0;
    for (const m of matches) {
      if (m.score_us == null && m.score_opponent == null) continue;
      const a = m.score_us ?? 0;
      const b = m.score_opponent ?? 0;
      played++;
      gf += a;
      ga += b;
      if (a > b) win++;
      else if (a < b) loss++;
      else draw++;
    }
    const winRate = played ? Math.round((win / played) * 100) : 0;
    return { win, draw, loss, gf, ga, played, winRate };
  }, [matches]);

  return (
    <div>
      <AppHeader title="สรุปผล" subtitle={`เล่นไปแล้ว ${rec.played} นัด`} />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-3">
        {/* สถิติทีม ชนะ/เสมอ/แพ้ */}
        <div className="grid grid-cols-3 gap-2">
          <RecordCard label="ชนะ" value={rec.win} cls="text-emerald-400" />
          <RecordCard label="เสมอ" value={rec.draw} cls="text-amber-400" />
          <RecordCard label="แพ้" value={rec.loss} cls="text-red-400" />
        </div>

        <div className="card grid grid-cols-3 divide-x divide-[hsl(var(--border))] p-3 text-center">
          <div>
            <div className="text-xs text-[hsl(var(--text-muted))]">ชนะ %</div>
            <div className="text-lg font-bold text-brand">{rec.winRate}%</div>
          </div>
          <div>
            <div className="text-xs text-[hsl(var(--text-muted))]">ได้ประตู</div>
            <div className="text-lg font-bold">{rec.gf}</div>
          </div>
          <div>
            <div className="text-xs text-[hsl(var(--text-muted))]">เสียประตู</div>
            <div className="text-lg font-bold">{rec.ga}</div>
          </div>
        </div>

        {rec.played === 0 && (
          <p className="text-center text-sm text-[hsl(var(--text-muted))]">
            ยังไม่มีนัดที่กรอกผล — ใส่สกอร์ในเมนูนัดแข่ง/สตอรี่ก่อน
          </p>
        )}

        {/* สถิติผู้เล่น */}
        <div>
          <h3 className="mb-2 font-semibold">สถิติผู้เล่น (ทั้งซีซั่น)</h3>
          <PlayerStatsTable players={players} />
        </div>
      </div>
    </div>
  );
}

function RecordCard({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className="card p-3 text-center">
      <div className={`text-3xl font-extrabold ${cls}`}>{value}</div>
      <div className="text-xs text-[hsl(var(--text-muted))]">{label}</div>
    </div>
  );
}
