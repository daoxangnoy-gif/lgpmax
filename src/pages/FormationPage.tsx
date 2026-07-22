import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Save, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import EnvBanner from "@/components/EnvBanner";
import FootballPitch, { type PitchSlot } from "@/components/FootballPitch";
import { usePlayers } from "@/hooks/usePlayers";
import { useMatches } from "@/hooks/useMatches";
import { useDeleteFormation, useFormations, useUpsertFormation } from "@/hooks/useFormations";
import { formatThaiDate } from "@/lib/format";
import { SIZE_PRESETS, slotsFromLines, type FormationTemplate } from "@/lib/presets";
import type { Formation, Player } from "@/types";

interface Drag {
  playerId: string;
  fromSlotId: string | null;
  x: number;
  y: number;
}

export default function FormationPage() {
  const { data: players = [] } = usePlayers();
  const { data: matches = [] } = useMatches();
  const { data: formations = [] } = useFormations();
  const upsert = useUpsertFormation();
  const del = useDeleteFormation();

  const pitchRef = useRef<HTMLDivElement>(null);

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState("แผนใหม่");
  const [matchId, setMatchId] = useState<string | null>(null);
  const [slots, setSlots] = useState<PitchSlot[]>([]);
  const [assign, setAssign] = useState<Record<string, string>>({});

  const [activeSize, setActiveSize] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  const [drag, setDrag] = useState<Drag | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const playersById = useMemo(
    () => Object.fromEntries(players.map((p) => [p.id, p])) as Record<string, Player>,
    [players]
  );

  const assignedIds = new Set(Object.values(assign));
  const bench = players.filter((p) => !assignedIds.has(p.id));

  // ---------- โหลด/สร้างใหม่ ----------
  function loadFormation(f: Formation) {
    setCurrentId(f.id);
    setName(f.name);
    setMatchId(f.match_id);
    setActiveSize(null);
    setActiveTemplate(null);
    const data = f.data ?? { positions: [] };
    if (data.slots?.length) {
      const s: PitchSlot[] = data.slots.map((sl, i) => ({ id: `s${i}`, x: sl.x, y: sl.y }));
      const a: Record<string, string> = {};
      data.slots.forEach((sl, i) => {
        if (sl.player_id) a[`s${i}`] = sl.player_id;
      });
      setSlots(s);
      setAssign(a);
    } else {
      // เก่า: มีแต่ positions ที่มีคน
      const s: PitchSlot[] = data.positions.map((p, i) => ({ id: `s${i}`, x: p.x, y: p.y }));
      const a: Record<string, string> = {};
      data.positions.forEach((p, i) => (a[`s${i}`] = p.player_id));
      setSlots(s);
      setAssign(a);
    }
  }

  function newFormation() {
    setCurrentId(null);
    setName("แผนใหม่");
    setMatchId(null);
    setSlots([]);
    setAssign({});
    setActiveSize(null);
    setActiveTemplate(null);
  }

  // ---------- เลือกแม่แบบ → วางวงไกด์ไลน์ ----------
  function applyTemplate(sizeKey: string, tpl: FormationTemplate) {
    const s: PitchSlot[] = slotsFromLines(tpl.lines).map((sl, i) => ({ id: `s${i}`, x: sl.x, y: sl.y }));
    setSlots(s);
    setAssign({});
    setActiveTemplate(tpl.key);
    setName((n) => (n === "แผนใหม่" ? `${sizeKey} · ${tpl.key}` : n));
  }

  // ---------- Drag & Drop (pointer, รองรับ touch) ----------
  function startDrag(playerId: string, fromSlotId: string | null, e: React.PointerEvent) {
    e.preventDefault();
    setDrag({ playerId, fromSlotId, x: e.clientX, y: e.clientY });
  }

  useEffect(() => {
    if (!drag) return;
    function nearest(cx: number, cy: number): string | null {
      const rect = pitchRef.current?.getBoundingClientRect();
      if (!rect) return null;
      let best: string | null = null;
      let bestD = Infinity;
      for (const s of slots) {
        const sx = rect.left + s.x * rect.width;
        const sy = rect.top + s.y * rect.height;
        const d = Math.hypot(cx - sx, cy - sy);
        if (d < bestD) {
          bestD = d;
          best = s.id;
        }
      }
      return bestD < rect.width * 0.16 ? best : null;
    }
    function onMove(e: PointerEvent) {
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
      setDropTargetId(nearest(e.clientX, e.clientY));
    }
    function onUp(e: PointerEvent) {
      const target = nearest(e.clientX, e.clientY);
      setDrag((d) => {
        if (!d) return null;
        if (target) {
          setAssign((prev) => {
            const next = { ...prev };
            for (const k in next) if (next[k] === d.playerId) delete next[k];
            next[target] = d.playerId; // แทนที่คนเดิมในช่อง (ถ้ามี → เด้งลงม้านั่ง)
            return next;
          });
        } else if (d.fromSlotId) {
          // ลากออกนอกช่อง → เอาลงม้านั่ง
          setAssign((prev) => {
            const next = { ...prev };
            delete next[d.fromSlotId!];
            return next;
          });
        }
        return null;
      });
      setDropTargetId(null);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, slots]);

  // ---------- บันทึก/ลบ ----------
  async function save() {
    if (!name.trim()) return toast.error("ตั้งชื่อแผนก่อน");
    const dataSlots = slots.map((s) => ({ x: s.x, y: s.y, player_id: assign[s.id] ?? null }));
    const positions = dataSlots
      .filter((s) => s.player_id)
      .map((s) => ({ player_id: s.player_id!, x: s.x, y: s.y }));
    try {
      await upsert.mutateAsync({
        id: currentId ?? undefined,
        name: name.trim(),
        match_id: matchId,
        data: { positions, slots: dataSlots },
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

  const dragPlayer = drag ? playersById[drag.playerId] : null;

  return (
    <div>
      <AppHeader
        title="แผนการเล่น"
        subtitle="เลือกแม่แบบ แล้วลากชื่อวางในสนาม"
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

        {/* จัดชุด: เลือกขนาดทีม */}
        <div>
          <div className="mb-1.5 flex items-center gap-1 text-xs text-[hsl(var(--text-muted))]">
            <Wand2 size={14} /> จัดชุด:
          </div>
          <div className="flex flex-wrap gap-2">
            {SIZE_PRESETS.map((sp) => (
              <button
                key={sp.key}
                className={`chip ${activeSize === sp.key ? "chip-active" : ""}`}
                onClick={() => setActiveSize(activeSize === sp.key ? null : sp.key)}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>

        {/* แม่แบบ 6 แบบ (รุก 3 / รับ 3) */}
        {activeSize && (
          <div className="card space-y-3 p-3">
            {([
              { tag: "รุก", head: "🔴 เน้นรุก" },
              { tag: "สมดุล", head: "⚪ สมดุล" },
              { tag: "รับ", head: "🔵 เน้นรับ" },
            ] as const).map(({ tag, head }) => {
              const sp = SIZE_PRESETS.find((s) => s.key === activeSize)!;
              const tpls = sp.templates.filter((t) => t.tag === tag);
              if (tpls.length === 0) return null;
              return (
                <div key={tag}>
                  <div className="mb-1.5 text-xs font-medium text-[hsl(var(--text-muted))]">{head}</div>
                  <div className="flex flex-wrap gap-2">
                    {tpls.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => applyTemplate(sp.key, t)}
                        className={`chip ${activeTemplate === t.key ? "chip-active" : ""}`}
                      >
                        {t.key}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <FootballPitch
          pitchRef={pitchRef}
          slots={slots}
          assign={assign}
          playersById={playersById}
          onTokenPointerDown={startDrag}
          dropTargetId={dropTargetId}
          draggingPlayerId={drag?.playerId ?? null}
        />

        {/* ม้านั่งสำรอง — ลากชื่อไปวางในวง */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold">
              ผู้เล่น ({bench.length}) <span className="text-xs font-normal text-[hsl(var(--text-muted))]">— ลากไปวางในวง</span>
            </h3>
            {Object.keys(assign).length > 0 && (
              <button className="text-xs text-red-400" onClick={() => setAssign({})}>
                <Trash2 size={13} className="mr-1 inline" /> เอาออกหมด
              </button>
            )}
          </div>
          {slots.length === 0 ? (
            <p className="text-sm text-[hsl(var(--text-muted))]">เลือกแม่แบบด้านบนก่อน</p>
          ) : bench.length === 0 ? (
            <p className="text-sm text-[hsl(var(--text-muted))]">
              {players.length === 0 ? "ยังไม่มีผู้เล่น" : "ทุกคนอยู่ในสนามแล้ว"}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {bench.map((p) => (
                <button
                  key={p.id}
                  onPointerDown={(e) => startDrag(p.id, null, e)}
                  className={`chip flex touch-none items-center gap-1.5 ${
                    drag?.playerId === p.id ? "opacity-30" : ""
                  }`}
                >
                  {p.jersey_number != null && (
                    <span className="font-bold text-brand">#{p.jersey_number}</span>
                  )}
                  {p.name}
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

      {/* ghost ตอนลาก */}
      {drag && dragPlayer && (
        <div
          className="pointer-events-none fixed z-[80] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand px-3 py-2 text-xs font-bold text-white shadow-xl"
          style={{ left: drag.x, top: drag.y }}
        >
          {dragPlayer.jersey_number != null ? `#${dragPlayer.jersey_number} ` : ""}
          {dragPlayer.name}
        </div>
      )}
    </div>
  );
}
