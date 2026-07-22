// แผนการเล่นสำเร็จรูป — พิกัด normalized (x,y = 0..1)
// สนามแนวตั้ง: y=0 ฝั่งประตูคู่แข่ง (บน), y=1 ฝั่งประตูเรา (ล่าง)
// GK (ผู้รักษาประตู/รับ) อยู่ล่างสุด, กองหน้าอยู่บนสุด

export type Slot = { x: number; y: number };

export type FormationTag = "รุก" | "รับ";

export interface FormationTemplate {
  key: string; // เช่น "2-2-2"
  tag: FormationTag; // เน้นรุก/รับ
  lines: number[]; // จำนวนผู้เล่นแต่ละแนว จากรับ → หน้า (ไม่รวม GK)
}

export interface SizePreset {
  key: string;
  label: string;
  templates: FormationTemplate[];
}

function line(count: number, y: number): Slot[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, i) => ({
    x: (i + 1) / (count + 1),
    y,
  }));
}

/** สร้างพิกัดช่อง (รวม GK) จากแนวผู้เล่น เช่น [2,3,1] → GK + รับ2/กลาง3/หน้า1 */
export function slotsFromLines(lines: number[]): Slot[] {
  const gk: Slot = { x: 0.5, y: 0.92 };
  const yStops = [0.74, 0.56, 0.38, 0.2]; // แนวรับ → หน้า
  const rows: Slot[] = [];
  lines.forEach((count, idx) => {
    rows.push(...line(count, yStops[idx] ?? 0.2));
  });
  return [gk, ...rows];
}

// ทีมเล่นแบบ 7 คน / 8 คน (มี GK + ตัวสนาม) — แต่ละขนาดมี 6 แม่แบบ (รุก 3 / รับ 3)
export const SIZE_PRESETS: SizePreset[] = [
  {
    key: "6+รับ",
    label: "แบบ 1 · 6+รับ",
    templates: [
      { key: "1-3-2", tag: "รุก", lines: [1, 3, 2] },
      { key: "2-2-2", tag: "รุก", lines: [2, 2, 2] },
      { key: "2-1-3", tag: "รุก", lines: [2, 1, 3] },
      { key: "3-2-1", tag: "รับ", lines: [3, 2, 1] },
      { key: "4-1-1", tag: "รับ", lines: [4, 1, 1] },
      { key: "4-2", tag: "รับ", lines: [4, 2] },
    ],
  },
  {
    key: "7+รับ",
    label: "แบบ 2 · 7+รับ",
    templates: [
      { key: "2-3-2", tag: "รุก", lines: [2, 3, 2] },
      { key: "3-1-3", tag: "รุก", lines: [3, 1, 3] },
      { key: "2-2-3", tag: "รุก", lines: [2, 2, 3] },
      { key: "3-3-1", tag: "รับ", lines: [3, 3, 1] },
      { key: "4-2-1", tag: "รับ", lines: [4, 2, 1] },
      { key: "4-3", tag: "รับ", lines: [4, 3] },
    ],
  },
];
