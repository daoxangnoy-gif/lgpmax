// แผนการเล่นสำเร็จรูป — พิกัด normalized (x,y = 0..1)
// สนามแนวตั้ง: y=0 ฝั่งประตูคู่แข่ง (บน), y=1 ฝั่งประตูเรา (ล่าง)
// GK (ผู้รักษาประตู/รับ) อยู่ล่างสุด, กองหน้าอยู่บนสุด

export type Slot = { x: number; y: number };

export type FormationTag = "รุก" | "สมดุล" | "รับ";

export interface FormationTemplate {
  key: string; // เช่น "2-2-2"
  tag: FormationTag;
  lines: number[]; // จำนวนผู้เล่นแต่ละแนว จากรับ → หน้า (ไม่รวม GK)
}

export interface SizePreset {
  key: string;
  label: string;
  templates: FormationTemplate[];
}

function line(count: number, y: number): Slot[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, i) => ({ x: (i + 1) / (count + 1), y }));
}

/** สร้างพิกัดช่อง (รวม GK) — กระจายแต่ละแนวให้เต็มความสูงสนาม */
export function slotsFromLines(lines: number[]): Slot[] {
  const gk: Slot = { x: 0.5, y: 0.92 };
  const rows: Slot[] = [];
  const n = lines.length;
  lines.forEach((count, idx) => {
    // แนวรับ y≈0.72 → กองหน้า y≈0.22 (กระจายเท่า ๆ กัน)
    const y = n === 1 ? 0.5 : 0.72 - (idx / (n - 1)) * (0.72 - 0.22);
    rows.push(...line(count, y));
  });
  return [gk, ...rows];
}

/** ทุกวิธีแบ่ง total เป็น 3 แนว (แต่ละแนว ≥ 1) — แนวรับ/กลาง/หน้า */
function compositions3(total: number): number[][] {
  const out: number[][] = [];
  for (let d = 1; d <= total - 2; d++) {
    for (let m = 1; m <= total - d - 1; m++) {
      const f = total - d - m;
      if (f >= 1) out.push([d, m, f]);
    }
  }
  return out;
}

function buildTemplates(outfield: number): FormationTemplate[] {
  return compositions3(outfield).map(([d, m, f]) => ({
    key: `${d}-${m}-${f}`,
    tag: f > d ? "รุก" : d > f ? "รับ" : "สมดุล",
    lines: [d, m, f],
  }));
}

// ทีมเล่นแบบ 7 คน / 8 คน (GK + ตัวสนาม) — สร้างทุกแม่แบบ X-Y-Z ที่เป็นไปได้
export const SIZE_PRESETS: SizePreset[] = [
  { key: "6+รับ", label: "แบบ 1 · 6+รับ", templates: buildTemplates(6) },
  { key: "7+รับ", label: "แบบ 2 · 7+รับ", templates: buildTemplates(7) },
];
