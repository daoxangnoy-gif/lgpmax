import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { PlayerAvatar } from "./PlayerCard";
import { useMatchStats, useUpsertMatchStat } from "@/hooks/useMatchStats";
import type { MatchStat, Player } from "@/types";

const FIELDS = [
  { key: "goals", label: "⚽", title: "ประตู" },
  { key: "assists", label: "🅰️", title: "assist" },
  { key: "yellow", label: "🟨", title: "ใบเหลือง" },
  { key: "red", label: "🟥", title: "ใบแดง" },
] as const;

type StatVals = { goals: number; assists: number; yellow: number; red: number };

export default function MatchStatsEditor({ matchId, players }: { matchId: string; players: Player[] }) {
  const { data: stats = [] } = useMatchStats(matchId);
  const byPlayer: Record<string, MatchStat> = Object.fromEntries(stats.map((s) => [s.player_id, s]));

  if (players.length === 0) {
    return <p className="text-sm text-[hsl(var(--text-muted))]">ยังไม่มีคนยืนยันมาแข่ง</p>;
  }
  return (
    <div className="space-y-2">
      {players.map((p) => (
        <StatRow key={p.id} matchId={matchId} player={p} current={byPlayer[p.id]} />
      ))}
    </div>
  );
}

function StatRow({ matchId, player, current }: { matchId: string; player: Player; current?: MatchStat }) {
  const upsert = useUpsertMatchStat(matchId);
  const [v, setV] = useState<StatVals>({
    goals: current?.goals ?? 0,
    assists: current?.assists ?? 0,
    yellow: current?.yellow ?? 0,
    red: current?.red ?? 0,
  });

  useEffect(() => {
    setV({
      goals: current?.goals ?? 0,
      assists: current?.assists ?? 0,
      yellow: current?.yellow ?? 0,
      red: current?.red ?? 0,
    });
  }, [current?.goals, current?.assists, current?.yellow, current?.red]);

  function change(field: keyof StatVals, delta: number) {
    const next = { ...v, [field]: Math.max(0, v[field] + delta) };
    setV(next);
    upsert.mutate({ player_id: player.id, ...next });
  }

  return (
    <div className="card p-2.5">
      <div className="mb-2 flex items-center gap-2.5">
        <PlayerAvatar player={player} size={32} />
        <span className="truncate text-sm font-medium">
          {player.jersey_number != null && <span className="text-brand">#{player.jersey_number} </span>}
          {player.name}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {FIELDS.map((f) => (
          <div key={f.key} className="rounded-lg bg-[hsl(var(--surface-2))] p-1 text-center" title={f.title}>
            <div className="text-xs">{f.label}</div>
            <div className="my-0.5 text-sm font-bold">{v[f.key]}</div>
            <div className="flex items-center justify-center gap-1">
              <button
                className="flex h-5 w-5 items-center justify-center rounded bg-[hsl(var(--surface))] active:scale-90"
                onClick={() => change(f.key, -1)}
                aria-label={`ลด ${f.title}`}
              >
                <Minus size={12} />
              </button>
              <button
                className="flex h-5 w-5 items-center justify-center rounded bg-brand text-brand-fg active:scale-90"
                onClick={() => change(f.key, 1)}
                aria-label={`เพิ่ม ${f.title}`}
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
