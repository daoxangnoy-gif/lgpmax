import { PlayerAvatar } from "./PlayerCard";
import { useSeasonStats } from "@/hooks/useMatchStats";
import type { Player } from "@/types";

/** ตารางสถิติผู้เล่นสะสมทั้งซีซั่น (เรียงตามประตู) */
export default function PlayerStatsTable({ players }: { players: Player[] }) {
  const { data: statsMap = {}, isLoading } = useSeasonStats();
  const rows = players
    .map((p) => ({
      player: p,
      s: statsMap[p.id] ?? { attended: 0, goals: 0, assists: 0, yellow: 0, red: 0 },
    }))
    .sort((a, b) => b.s.goals - a.s.goals || b.s.assists - a.s.assists || b.s.attended - a.s.attended);

  if (isLoading) return <p className="py-10 text-center text-[hsl(var(--text-muted))]">กำลังโหลด...</p>;
  if (players.length === 0)
    return <p className="py-10 text-center text-[hsl(var(--text-muted))]">ยังไม่มีผู้เล่น</p>;

  return (
    <div className="card overflow-x-auto p-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] text-[hsl(var(--text-muted))]">
            <th className="p-2 text-left font-normal">ผู้เล่น</th>
            <th className="p-1 text-center font-normal" title="นัดที่มา">นัด</th>
            <th className="p-1 text-center font-normal" title="ประตู">⚽</th>
            <th className="p-1 text-center font-normal" title="assist">🅰️</th>
            <th className="p-1 text-center font-normal" title="ใบเหลือง">🟨</th>
            <th className="p-1 text-center font-normal" title="ใบแดง">🟥</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ player, s }) => (
            <tr key={player.id} className="border-t border-[hsl(var(--border))]">
              <td className="p-2">
                <div className="flex items-center gap-2">
                  <PlayerAvatar player={player} size={28} />
                  <span className="truncate">
                    {player.jersey_number != null && <span className="text-brand">#{player.jersey_number} </span>}
                    {player.name}
                  </span>
                </div>
              </td>
              <td className="p-1 text-center">{s.attended}</td>
              <td className="p-1 text-center font-bold text-brand">{s.goals}</td>
              <td className="p-1 text-center">{s.assists}</td>
              <td className="p-1 text-center">{s.yellow}</td>
              <td className="p-1 text-center">{s.red}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
