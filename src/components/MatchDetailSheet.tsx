import { useMemo } from "react";
import { Check, X, Pencil } from "lucide-react";
import Modal from "./Modal";
import { PlayerAvatar } from "./PlayerCard";
import { usePlayers } from "@/hooks/usePlayers";
import { useClearRegistration, useRegistrations, useSetRegistration } from "@/hooks/useRegistrations";
import { formatMatchWhen, venueText } from "@/lib/format";
import type { Match } from "@/types";

export default function MatchDetailSheet({
  match,
  onClose,
  onEdit,
}: {
  match: Match | null;
  onClose: () => void;
  onEdit: (m: Match) => void;
}) {
  const { data: players = [] } = usePlayers();
  const { data: regs = [] } = useRegistrations(match?.id ?? null);
  const setReg = useSetRegistration(match?.id ?? "");
  const clearReg = useClearRegistration(match?.id ?? "");

  const regMap = useMemo(() => {
    const m: Record<string, "going" | "not_going"> = {};
    regs.forEach((r) => (m[r.player_id] = r.status));
    return m;
  }, [regs]);

  const goingCount = regs.filter((r) => r.status === "going").length;

  return (
    <Modal
      open={!!match}
      onClose={onClose}
      title="รายละเอียดนัด"
      footer={
        match && (
          <button className="btn-ghost" onClick={() => onEdit(match)}>
            <Pencil size={16} /> แก้ไขนัด
          </button>
        )
      }
    >
      {match && (
        <div className="space-y-4">
          <div className="card p-3">
            <div className="text-sm text-[hsl(var(--text-muted))]">{formatMatchWhen(match)}</div>
            <div className="mt-1 font-semibold">
              พบ {match.opponent || "— (ยังไม่ระบุคู่แข่ง)"}
            </div>
            <div className="text-sm text-[hsl(var(--text-muted))]">{venueText(match)}</div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-semibold">ลงทะเบียนมาแข่ง</h3>
            <span className="rounded-full bg-brand/20 px-3 py-1 text-sm font-bold text-brand">
              มา {goingCount} คน
            </span>
          </div>

          <div className="space-y-2">
            {players.length === 0 && (
              <p className="text-center text-sm text-[hsl(var(--text-muted))]">
                ยังไม่มีผู้เล่น — ไปเพิ่มที่เมนูผู้เล่นก่อน
              </p>
            )}
            {players.map((p) => {
              const st = regMap[p.id];
              return (
                <div key={p.id} className="card flex items-center gap-3 p-2.5">
                  <PlayerAvatar player={p} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {p.jersey_number != null && (
                        <span className="text-brand">#{p.jersey_number} </span>
                      )}
                      {p.name}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() =>
                        st === "going"
                          ? clearReg.mutate(p.id)
                          : setReg.mutate({ playerId: p.id, status: "going" })
                      }
                      className={`btn px-3 py-1.5 ${
                        st === "going" ? "bg-emerald-500 text-white" : "bg-[hsl(var(--surface-2))]"
                      }`}
                      aria-label="มา"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() =>
                        st === "not_going"
                          ? clearReg.mutate(p.id)
                          : setReg.mutate({ playerId: p.id, status: "not_going" })
                      }
                      className={`btn px-3 py-1.5 ${
                        st === "not_going" ? "bg-red-500 text-white" : "bg-[hsl(var(--surface-2))]"
                      }`}
                      aria-label="ไม่มา"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}
