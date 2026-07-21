import { Pencil } from "lucide-react";
import type { Player } from "@/types";
import { PLAYER_STATUS_COLOR, PLAYER_STATUS_LABEL, type PlayerStatus } from "@/types";

export function PlayerAvatar({ player, size = 56 }: { player: Player; size?: number }) {
  const initials = player.name.trim().slice(0, 2).toUpperCase();
  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[hsl(var(--surface-2))] font-bold text-[hsl(var(--text-muted))]"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {player.photo_url ? (
        <img src={player.photo_url} alt={player.name} className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

export default function PlayerCard({
  player,
  onEdit,
}: {
  player: Player;
  onEdit: (p: Player) => void;
}) {
  return (
    <div className="card flex items-center gap-3 p-3">
      <PlayerAvatar player={player} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {player.jersey_number != null && (
            <span className="rounded-md bg-brand/20 px-1.5 text-sm font-bold text-brand">
              #{player.jersey_number}
            </span>
          )}
          <span className="truncate font-semibold">{player.name}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          {player.position && (
            <span className="rounded-md border border-[hsl(var(--border))] px-1.5 py-0.5 text-[11px] text-[hsl(var(--text-muted))]">
              {player.position}
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] text-[hsl(var(--text-muted))]">
            <span className={`h-2 w-2 rounded-full ${PLAYER_STATUS_COLOR[player.status as PlayerStatus]}`} />
            {PLAYER_STATUS_LABEL[player.status as PlayerStatus] ?? player.status}
          </span>
        </div>
      </div>
      <button
        onClick={() => onEdit(player)}
        className="rounded-lg p-2 text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--surface-2))]"
        aria-label="แก้ไข"
      >
        <Pencil size={18} />
      </button>
    </div>
  );
}
