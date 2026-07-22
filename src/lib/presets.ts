// แผนการเล่นสำเร็จรูป — พิกัด normalized (x,y = 0..1)
// สนามแนวตั้ง: y=0 ฝั่งประตูคู่แข่ง (บน), y=1 ฝั่งประตูเรา (ล่าง)
// GK (ผู้รักษาประตู/รับ) อยู่ล่างสุด, กองหน้าอยู่บนสุด

type Slot = { x: number; y: number };

export interface Preset {
  key: string;
  label: string;
  lines: number[]; // จำนวนผู้เล่นแต่ละแนว จากรับ → หน้า (ไม่รวม GK)
}

function line(count: number, y: number): Slot[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, i) => ({
    x: (i + 1) / (count + 1),
    y,
  }));
}

/** สร้างตำแหน่งจากแนวผู้เล่น เช่น [2,3,1] → GK + รับ2/กลาง3/หน้า1 */
export function buildPreset(lines: number[]): Slot[] {
  const gk: Slot = { x: 0.5, y: 0.93 };
  const yStops = [0.72, 0.52, 0.32, 0.16]; // แนวรับ → หน้า
  const rows: Slot[] = [];
  lines.forEach((count, idx) => {
    rows.push(...line(count, yStops[idx] ?? 0.16));
  });
  return [gk, ...rows];
}

// ทีมเล่นแบบ 7 คน / 8 คน (มี GK + ตัวสนาม)
export const PRESETS: Preset[] = [
  { key: "6+รับ", label: "แบบ 1 · 6+รับ", lines: [2, 3, 1] }, // 7 คน (GK + 6)
  { key: "7+รับ", label: "แบบ 2 · 7+รับ", lines: [3, 3, 1] }, // 8 คน (GK + 7)
];
