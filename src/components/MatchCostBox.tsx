import { useEffect, useState } from "react";
import { Save, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PlayerAvatar } from "./PlayerCard";
import { usePlayers } from "@/hooks/usePlayers";
import { useUpsertMatch } from "@/hooks/useMatches";
import { useRegistrations } from "@/hooks/useRegistrations";
import type { Match } from "@/types";

const money = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: 0 });

export default function MatchCostBox({ match, canEdit }: { match: Match; canEdit: boolean }) {
  const { data: players = [] } = usePlayers();
  const { data: regs = [] } = useRegistrations(match.id);
  const upsertMatch = useUpsertMatch();

  const goingIds = new Set(regs.filter((r) => r.status === "going").map((r) => r.player_id));
  const going = players.filter((p) => goingIds.has(p.id));

  const [cost, setCost] = useState(String(match.cost ?? 0));
  useEffect(() => setCost(String(match.cost ?? 0)), [match.cost]);

  const total = Number(cost) || 0;
  const perPerson = going.length ? Math.ceil(total / going.length) : 0;

  async function save() {
    try {
      await upsertMatch.mutateAsync({ id: match.id, cost: total });
      toast.success("บันทึกค่าใช้จ่ายแล้ว");
    } catch (e) {
      toast.error("บันทึกไม่สำเร็จ", { description: String((e as Error).message) });
    }
  }

  if (!canEdit && total === 0) return null; // ไม่มีค่าใช้จ่าย + แก้ไม่ได้ → ซ่อน

  return (
    <div className="card p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Wallet size={16} className="text-brand" /> หารค่าใช้จ่าย
      </div>

      {canEdit ? (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="label">ค่าใช้จ่ายทั้งหมด (บาท)</label>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="เช่น 500"
            />
          </div>
          <button className="btn-brand" onClick={save} disabled={upsertMatch.isPending}>
            <Save size={16} /> บันทึก
          </button>
        </div>
      ) : (
        <div className="text-sm">รวม {money(total)} บาท</div>
      )}

      <div className="mt-3 flex items-center justify-between rounded-xl bg-[hsl(var(--surface-2))] px-3 py-2">
        <span className="text-sm text-[hsl(var(--text-muted))]">
          หาร {going.length} คน (คนที่มา)
        </span>
        <span className="text-lg font-bold text-brand">{money(perPerson)} บาท/คน</span>
      </div>

      {going.length > 0 && total > 0 && (
        <div className="mt-2 space-y-1.5">
          {going.map((p) => (
            <div key={p.id} className="flex items-center gap-2.5 text-sm">
              <PlayerAvatar player={p} size={28} />
              <span className="flex-1 truncate">{p.name}</span>
              <span className="font-medium">{money(perPerson)} ฿</span>
            </div>
          ))}
        </div>
      )}
      {total > 0 && going.length > 0 && (
        <p className="mt-1.5 text-[11px] text-[hsl(var(--text-muted))]">
          * ปัดขึ้นต่อคน ({money(perPerson * going.length)} รวม)
        </p>
      )}
    </div>
  );
}
