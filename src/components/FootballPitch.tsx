import { useRef } from "react";
import { X } from "lucide-react";
import type { FormationPosition, Player } from "@/types";

/**
 * สนามจำลองแนวตั้ง — วาง token ผู้เล่นด้วยพิกัด normalized (x,y = 0..1)
 * ลากด้วย pointer events (รองรับทั้งเมาส์และ touch) เพื่อวางอิสระ
 */
export default function FootballPitch({
  positions,
  playersById,
  onChange,
  onRemove,
  editable = true,
}: {
  positions: FormationPosition[];
  playersById: Record<string, Player>;
  onChange?: (positions: FormationPosition[]) => void;
  onRemove?: (playerId: string) => void;
  editable?: boolean;
}) {
  const pitchRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<string | null>(null);

  function clientToNorm(clientX: number, clientY: number) {
    const rect = pitchRef.current!.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    return { x, y };
  }

  function onPointerDown(e: React.PointerEvent, playerId: string) {
    if (!editable) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragging.current = playerId;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current || !onChange) return;
    const { x, y } = clientToNorm(e.clientX, e.clientY);
    onChange(
      positions.map((p) => (p.player_id === dragging.current ? { ...p, x, y } : p))
    );
  }

  function onPointerUp() {
    dragging.current = null;
  }

  return (
    <div
      ref={pitchRef}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="relative mx-auto aspect-[2/3] w-full max-w-md touch-none select-none overflow-hidden rounded-2xl border-2 border-white/30"
      style={{
        background:
          "repeating-linear-gradient(to bottom, #166534 0 8.33%, #15803d 8.33% 16.66%)",
      }}
    >
      {/* เส้นสนาม */}
      <div className="pointer-events-none absolute inset-3 rounded-lg border-2 border-white/40" />
      <div className="pointer-events-none absolute left-3 right-3 top-1/2 h-0.5 -translate-y-1/2 bg-white/40" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40" />
      {/* กรอบเขตโทษบน/ล่าง */}
      <div className="pointer-events-none absolute left-1/2 top-3 h-14 w-2/5 -translate-x-1/2 border-2 border-t-0 border-white/40" />
      <div className="pointer-events-none absolute bottom-3 left-1/2 h-14 w-2/5 -translate-x-1/2 border-2 border-b-0 border-white/40" />

      {positions.map((pos) => {
        const player = playersById[pos.player_id];
        if (!player) return null;
        const initials = player.name.trim().slice(0, 2).toUpperCase();
        return (
          <div
            key={pos.player_id}
            onPointerDown={(e) => onPointerDown(e, pos.player_id)}
            className={`group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center ${
              editable ? "cursor-grab active:cursor-grabbing" : ""
            }`}
            style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
          >
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-brand text-xs font-bold text-white shadow-lg">
              {player.photo_url ? (
                <img src={player.photo_url} alt="" className="h-full w-full object-cover" />
              ) : player.jersey_number != null ? (
                `#${player.jersey_number}`
              ) : (
                initials
              )}
              {editable && onRemove && (
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onRemove(pos.player_id)}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-red-600 p-0.5 text-white opacity-0 transition group-hover:opacity-100"
                  aria-label="เอาออก"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <span className="mt-0.5 max-w-16 truncate rounded bg-black/50 px-1 text-[10px] text-white">
              {player.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
