import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import EnvBanner from "@/components/EnvBanner";
import PlayerCard from "@/components/PlayerCard";
import PlayerFormDialog from "@/components/PlayerFormDialog";
import { usePlayers } from "@/hooks/usePlayers";
import { useAuth } from "@/hooks/useAuth";
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
      </div>

      <PlayerFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editing={editing} />
    </div>
  );
}
