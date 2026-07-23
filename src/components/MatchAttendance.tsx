import { Check, Loader2, Share2, X } from "lucide-react";
import { shareLink } from "@/lib/share";
import { PlayerAvatar } from "./PlayerCard";
import { usePlayers } from "@/hooks/usePlayers";
import { useAuth } from "@/hooks/useAuth";
import { useClearRegistration, useRegistrations, useSetRegistration } from "@/hooks/useRegistrations";
import { formatMatchWhen } from "@/lib/format";
import type { Match } from "@/types";

/** ยืนยันการมาแข่งของตัวเอง + รายชื่อคนที่ยืนยันมาแล้ว + ปุ่มแชร์ */
export default function MatchAttendance({ match }: { match: Match }) {
  const { myPlayerId } = useAuth();
  const { data: players = [] } = usePlayers();
  const { data: regs = [] } = useRegistrations(match.id);
  const setReg = useSetRegistration(match.id);
  const clearReg = useClearRegistration(match.id);

  const myPlayer = players.find((p) => p.id === myPlayerId) ?? null;
  const myStatus = regs.find((r) => r.player_id === myPlayerId)?.status ?? null;

  const goingIds = new Set(regs.filter((r) => r.status === "going").map((r) => r.player_id));
  const goingPlayers = players.filter((p) => goingIds.has(p.id));

  async function share() {
    const url = `${location.origin}${location.pathname}#/register?m=${match.id}`;
    const text = `⚽ ยืนยันมาแข่ง — Lgp Max ພົບກັບ ${match.opponent || "คู่แข่ง"} · ${formatMatchWhen(match)}`;
    await shareLink({ title: "LGP MAX — ลงทะเบียนมาแข่ง", text, url });
  }

  const busy = setReg.isPending || clearReg.isPending;

  return (
    <div className="space-y-4">
      {/* ยืนยันของตัวเอง — เห็นแค่ชื่อตัวเอง */}
      <div className="card p-3">
        <div className="mb-2 text-sm font-semibold">ยืนยันการมาแข่งของคุณ</div>
        {myPlayer ? (
          <div className="flex items-center gap-3">
            <PlayerAvatar player={myPlayer} size={44} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">
                {myPlayer.jersey_number != null && <span className="text-brand">#{myPlayer.jersey_number} </span>}
                {myPlayer.name}
              </div>
              <div className="text-xs text-[hsl(var(--text-muted))]">
                {myStatus === "going" ? "คุณยืนยันมาแล้ว" : myStatus === "not_going" ? "คุณแจ้งไม่มา" : "ยังไม่ยืนยัน"}
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                disabled={busy}
                onClick={() => setReg.mutate({ playerId: myPlayer.id, status: "going" })}
                className={`btn px-3 py-2 ${myStatus === "going" ? "bg-emerald-500 text-white" : "bg-[hsl(var(--surface-2))]"}`}
              >
                <Check size={16} /> มา
              </button>
              <button
                disabled={busy}
                onClick={() => setReg.mutate({ playerId: myPlayer.id, status: "not_going" })}
                className={`btn px-3 py-2 ${myStatus === "not_going" ? "bg-red-500 text-white" : "bg-[hsl(var(--surface-2))]"}`}
              >
                <X size={16} /> ไม่มา
              </button>
              {busy && <Loader2 size={16} className="mt-2 animate-spin" />}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[hsl(var(--text-muted))]">
            บัญชีของคุณยังไม่ได้ผูกกับนักเตะ — ให้แอดมินผูกให้ก่อนถึงจะยืนยันได้
          </p>
        )}
      </div>

      {/* ปุ่มแชร์ */}
      <button className="btn-ghost w-full" onClick={share}>
        <Share2 size={16} /> แชร์ลิงก์ให้เพื่อนกดยืนยัน
      </button>

      {/* รายชื่อคนที่มา */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">มาแล้ว</h3>
          <span className="rounded-full bg-brand/20 px-3 py-1 text-sm font-bold text-brand">
            {goingPlayers.length} คน
          </span>
        </div>
        {goingPlayers.length === 0 ? (
          <p className="text-sm text-[hsl(var(--text-muted))]">ยังไม่มีใครยืนยัน</p>
        ) : (
          <div className="space-y-2">
            {goingPlayers.map((p) => (
              <div key={p.id} className="flex items-center gap-2.5">
                <PlayerAvatar player={p} size={32} />
                <span className="text-sm">
                  {p.jersey_number != null && <span className="text-brand">#{p.jersey_number} </span>}
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
