import type { RefObject } from "react";
import type { Player } from "@/types";

export interface PitchSlot {
  id: string;
  x: number;
  y: number;
}

/**
 * สนามจำลองแนวตั้ง — แสดง "ช่อง" (วงไกด์ไลน์) ตามแม่แบบที่เลือก
 * ช่องว่าง = วงประ + เครื่องหมาย +, ช่องมีคน = token ผู้เล่น (ลากออก/ย้ายได้)
 * การลากจัดการที่ FormationPage (owns drag state) — ที่นี่แค่ report pointerdown
 */
export default function FootballPitch({
  pitchRef,
  slots,
  assign,
  playersById,
  onTokenPointerDown,
  dropTargetId,
  draggingPlayerId,
  editable = true,
}: {
  pitchRef: RefObject<HTMLDivElement>;
  slots: PitchSlot[];
  assign: Record<string, string>;
  playersById: Record<string, Player>;
  onTokenPointerDown?: (slotId: string, playerId: string, e: React.PointerEvent) => void;
  dropTargetId?: string | null;
  draggingPlayerId?: string | null;
  editable?: boolean;
}) {
  return (
    <div
      ref={pitchRef}
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
      <div className="pointer-events-none absolute left-1/2 top-3 h-14 w-2/5 -translate-x-1/2 border-2 border-t-0 border-white/40" />
      <div className="pointer-events-none absolute bottom-3 left-1/2 h-14 w-2/5 -translate-x-1/2 border-2 border-b-0 border-white/40" />

      {slots.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white/70">
          เลือก “จัดชุด” ด้านบน แล้วเลือกแม่แบบ เพื่อวางวงไกด์ไลน์
        </div>
      )}

      {slots.map((slot) => {
        const pid = assign[slot.id];
        const player = pid ? playersById[pid] : null;
        const isTarget = dropTargetId === slot.id;
        return (
          <div
            key={slot.id}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${slot.x * 100}%`, top: `${slot.y * 100}%` }}
          >
            {player ? (
              <div
                onPointerDown={(e) => editable && onTokenPointerDown?.(slot.id, pid!, e)}
                className={`flex flex-col items-center ${editable ? "cursor-grab active:cursor-grabbing" : ""} ${
                  draggingPlayerId === pid ? "opacity-30" : ""
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-brand text-xs font-bold text-white shadow-lg">
                  {player.photo_url ? (
                    <img src={player.photo_url} alt="" className="h-full w-full object-cover" />
                  ) : player.jersey_number != null ? (
                    `#${player.jersey_number}`
                  ) : (
                    player.name.trim().slice(0, 2).toUpperCase()
                  )}
                </div>
                <span className="mt-0.5 max-w-16 truncate rounded bg-black/50 px-1 text-[10px] text-white">
                  {player.name}
                </span>
              </div>
            ) : (
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed text-lg transition ${
                  isTarget
                    ? "scale-125 border-white bg-white/30 text-white"
                    : "border-white/60 text-white/60"
                }`}
              >
                +
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
