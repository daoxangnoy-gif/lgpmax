import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import type { Match } from "@/types";

/** วันที่แบบไทยอ่านง่าย เช่น "อา. 21 ก.ค. 2026" */
export function formatThaiDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "EEE d MMM yyyy", { locale: th });
  } catch {
    return dateStr;
  }
}

/** วันที่ + เวลา ของนัด */
export function formatMatchWhen(match: Match): string {
  const d = formatThaiDate(match.match_date);
  return match.match_time ? `${d} • ${match.match_time.slice(0, 5)} น.` : d;
}

/** ข้อความสนาม */
export function venueText(match: Match): string {
  return match.venue_name || "— ยังไม่ระบุสนาม";
}

/** ผลสกอร์ เช่น "3 - 1" หรือ null ถ้ายังไม่กรอก */
export function scoreText(match: Match): string | null {
  if (match.score_us == null && match.score_opponent == null) return null;
  return `${match.score_us ?? 0} - ${match.score_opponent ?? 0}`;
}
