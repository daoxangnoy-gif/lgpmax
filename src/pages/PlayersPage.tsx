import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import EnvBanner from "@/components/EnvBanner";
import PlayerCard, { PlayerAvatar } from "@/components/PlayerCard";
import PlayerFormDialog from "@/components/PlayerFormDialog";
import { usePlayers } from "@/hooks/usePlayers";
import { useAuth } from "@/hooks/useAuth";
import { useSeasonStats } from "@/hooks/useMatchStats";
import { PLAYER_STATUS_LABEL, POSITIONS, type Player, type PlayerStatus } from "@/types";

const STATUSES = Object.keys(PLAYER_STATUS_LABEL) as PlayerStatus[];

export default function PlayersPage() {
  const { data: players = [], isLoading, error } = usePlayers();
  const { can, isAdmin, myPlayerId } = useAuth();
  const canEditPlayer = (p: Player) => isAdmin || (can("players", "edit") && p.id === myPlayerId);
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PlayerStatus | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);
  const [view, setView] = useState<"cards" | "stats">("cards");

  const filtered = useMemo(() => {
    return players.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (posFilter && p.position !== posFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      return true;
    });
  }, [players, search, posFilter, statusFilter]);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(p: Player) {
    setEditing(p);
    setDialogOpen(true);
  }

  return (
    <div>
      <AppHeader
        title="ผู้เล่น"
        subtitle={`ทั้งหมด ${players.length} คน`}
        right={
          can("players", "create") ? (
            <button className="btn-brand" onClick={openNew}>
              <Plus size={18} /> เพิ่ม
            </button>
          ) : undefined
        }
      />
      <EnvBanner />

      <div className="mx-auto max-w-lg space-y-3 px-4 py-3">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-[hsl(var(--surface-2))] p-1">
          <button
            className={`btn py-1.5 ${view === "cards" ? "bg-brand text-brand-fg" : "text-[hsl(var(--text-muted))]"}`}
            onClick={() => setView("cards")}
          >
            การ์ด
          </button>
          <button
            className={`btn py-1.5 ${view === "stats" ? "bg-brand text-brand-fg" : "text-[hsl(var(--text-muted))]"}`}
            onClick={() => setView("stats")}
          >
            สถิติซีซั่น
          </button>
        </div>

        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))]"
          />
          <input
            className="input pl-10"
            placeholder="ค้นหาชื่อผู้เล่น"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {view === "stats" ? (
          <PlayerStatsTable players={filtered} />
        ) : (
        <>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <button
            className={`chip ${!posFilter && !statusFilter ? "chip-active" : ""}`}
            onClick={() => {
              setPosFilter(null);
              setStatusFilter(null);
            }}
          >
            ทั้งหมด
          </button>
          {POSITIONS.map((p) => (
            <button
              key={p}
              className={`chip ${posFilter === p ? "chip-active" : ""}`}
              onClick={() => setPosFilter(posFilter === p ? null : p)}
            >
              {p}
            </button>
          ))}
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`chip ${statusFilter === s ? "chip-active" : ""}`}
              onClick={() => setStatusFilter(statusFilter === s ? null : s)}
            >
              {PLAYER_STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        {isLoading && <p className="py-10 text-center text-[hsl(var(--text-muted))]">กำลังโหลด...</p>}
        {error && (
          <p className="py-10 text-center text-red-400">
            โหลดข้อมูลไม่ได้ — ตรวจการเชื่อม Supabase
          </p>
        )}
        {!isLoading && !error && filtered.length === 0 && (
          <p className="py-10 text-center text-[hsl(var(--text-muted))]">
            {players.length === 0 ? "ยังไม่มีผู้เล่น — กด “เพิ่ม”" : "ไม่พบผู้เล่นตามเงื่อนไข"}
          </p>
        )}

        <div className="space-y-2">
          {filtered.map((p) => (
            <PlayerCard key={p.id} player={p} onEdit={openEdit} canEdit={canEditPlayer(p)} />
          ))}
        </div>
        </>
        )}
      </div>

      <PlayerFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editing={editing} />
    </div>
  );
}

function PlayerStatsTable({ players }: { players: Player[] }) {
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
