import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import EnvBanner from "@/components/EnvBanner";
import FootballPitch from "@/components/FootballPitch";
import { usePlayers } from "@/hooks/usePlayers";
import { useMatches } from "@/hooks/useMatches";
import { useDeleteFormation, useFormations, useUpsertFormation } from "@/hooks/useFormations";
import { formatThaiDate } from "@/lib/format";
import { buildPreset, PRESETS } from "@/lib/presets";
import type { Formation, FormationPosition, Player } from "@/types";

export default function FormationPage() {
  const { data: players = [] } = usePlayers();
  const { data: matches = [] } = useMatches();
  const { data: formations = [] } = useFormations();
  const upsert = useUpsertFormation();
  const del = useDeleteFormation();

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState("แผนใหม่");
  const [matchId, setMatchId] = useState<string | null>(null);
  const [positions, setPositions] = useState<FormationPosition[]>([]);

  const playersById = useMemo(
    () => Object.fromEntries(players.map((p) => [p.id, p])) as Record<string, Player>,
    [players]
  );

  function loadFormation(f: Formation) {
    setCurrentId(f.id);
    setName(f.name);
    setMatchId(f.match_id);
    setPositions(f.data?.positions ?? []);
  }

  function newFormation() {
    setCurrentId(null);
    setName("แผนใหม่");
    setMatchId(null);
    setPositions([]);
  }

  const placedIds = new Set(positions.map((p) => p.player_id));
  const bench = players.filter((p) => !placedIds.has(p.id));

  function addToPitch(playerId: string) {
    setPositions((prev) => [...prev, { player_id: playerId, x: 0.5, y: 0.5 }]);
  }
  function removeFromPitch(playerId: string) {
    setPositions((prev) => prev.filter((p) => p.player_id !== playerId));
  }

  function applyPreset(key: string) {
    const slots = buildPreset(key);
    // จัดตัวจริงลงสนามก่อน แล้วตามด้วยสำรอง
    const available = [
      ...players.filter((p) => p.status === "starter"),
      ...players.filter((p) => p.status !== "starter"),
    ];
    const next: FormationPosition[] = slots.slice(0, available.length).map((slot, i) => ({
      player_id: available[i].id,
      x: slot.x,
      y: slot.y,
    }));
    setPositions(next);
    setName((n) => (n === "แผนใหม่" ? key : n));
  }

  async function save() {
    if (!name.trim()) return toast.error("ตั้งชื่อแผนก่อน");
    try {
      await upsert.mutateAsync({
        id: currentId ?? undefined,
        name: name.trim(),
        match_id: matchId,
        data: { positions },
      });
      toast.success("บันทึกแผนแล้ว");
    } catch (e) {
      toast.error("บันทึกไม่สำเร็จ", { description: String((e as Error).message) });
    }
  }

  async function removeFormation() {
    if (!currentId) return;
    if (!confirm(`ลบแผน "${name}" ?`)) return;
    await del.mutateAsync(currentId);
    newFormation();
    toast.success("ลบแผนแล้ว");
  }

  return (
    <div>
      <AppHeader
        title="แผนการเล่น"
        subtitle="ลากผู้เล่นวางในสนาม แล้วบันทึก"
        right={
          <button className="btn-brand" onClick={save} disabled={upsert.isPending}>
            <Save size={18} /> บันทึก
          </button>
        }
      />
      <EnvBanner />

      <div className="mx-auto max-w-lg space-y-4 px-4 py-3">
        {/* แผนที่บันทึกไว้ */}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <button className="chip" onClick={newFormation}>
            <Plus size={14} className="mr-1 inline" /> ใหม่
          </button>
          {formations.map((f) => (
            <button
              key={f.id}
              onClick={() => loadFormation(f)}
              className={`chip ${currentId === f.id ? "chip-active" : ""}`}
            >
              {f.name}
            </button>
          ))}
        </div>

        {/* ชื่อ + ผูกนัด */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">ชื่อแผน</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">ผูกกับนัด</label>
            <select
              className="input"
              value={matchId ?? ""}
              onChange={(e) => setMatchId(e.target.value || null)}
            >
              <option value="">— ไม่ผูก —</option>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {formatThaiDate(m.match_date)} · {m.opponent || "คู่แข่ง?"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* presets */}
        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4">
          <span className="flex items-center gap-1 text-xs text-[hsl(var(--text-muted))]">
            <Wand2 size={14} /> จัดชุด:
          </span>
          {PRESETS.map((p) => (
            <button key={p.key} className="chip" onClick={() => applyPreset(p.key)}>
              {p.key}
            </button>
          ))}
        </div>

        <FootballPitch
          positions={positions}
          playersById={playersById}
          onChange={setPositions}
          onRemove={removeFromPitch}
        />

        {/* ม้านั่งสำรอง */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">ตัวสำรอง ({bench.length})</h3>
            {positions.length > 0 && (
              <button
                className="text-xs text-red-400"
                onClick={() => setPositions([])}
              >
                <Trash2 size={13} className="mr-1 inline" /> ล้างสนาม
              </button>
            )}
          </div>
          {bench.length === 0 ? (
            <p className="text-sm text-[hsl(var(--text-muted))]">
              {players.length === 0 ? "ยังไม่มีผู้เล่น" : "ผู้เล่นทุกคนอยู่ในสนามแล้ว"}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {bench.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToPitch(p.id)}
                  className="chip flex items-center gap-1.5"
                >
                  {p.jersey_number != null && (
                    <span className="font-bold text-brand">#{p.jersey_number}</span>
                  )}
                  {p.name}
                  <Plus size={13} />
                </button>
              ))}
            </div>
          )}
        </div>

        {currentId && (
          <button className="btn-danger w-full" onClick={removeFormation}>
            <Trash2 size={16} /> ลบแผนนี้
          </button>
        )}
      </div>
    </div>
  );
}
