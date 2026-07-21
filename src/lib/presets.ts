// แผนการเล่นสำเร็จรูป — พิกัด normalized (x,y = 0..1)
// สนามแนวตั้ง: y=0 ฝั่งประตูคู่แข่ง (บน), y=1 ฝั่งประตูเรา (ล่าง)
// GK อยู่ล่างสุด, กองหน้าอยู่บนสุด

type Slot = { x: number; y: number };

function line(count: number, y: number): Slot[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, i) => ({
    x: (i + 1) / (count + 1),
    y,
  }));
}

/** สร้างตำแหน่งจากชื่อแผน เช่น "4-4-2" → GK + แนวรับ/กลาง/หน้า */
export function buildPreset(key: string): Slot[] {
  const gk: Slot = { x: 0.5, y: 0.93 };
  const parts = key.split("-").map((n) => parseInt(n, 10)).filter((n) => !isNaN(n));
  // parts = [DF, MF, FW] (อาจมี 3 หรือ 4 ช่วง)
  const rows: Slot[] = [];
  const yStops = [0.72, 0.52, 0.32, 0.16]; // แนวรับ → หน้า
  parts.forEach((count, idx) => {
    rows.push(...line(count, yStops[idx] ?? 0.16));
  });
  return [gk, ...rows];
}

export const PRESETS = [
  { key: "4-4-2" },
  { key: "4-3-3" },
  { key: "3-5-2" },
  { key: "4-2-3-1" },
  { key: "5-3-2" },
];
