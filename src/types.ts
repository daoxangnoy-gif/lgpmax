// ---------- Domain types ----------

export type PlayerStatus = "starter" | "sub";

export const PLAYER_STATUS_LABEL: Record<PlayerStatus, string> = {
  starter: "ตัวจริง",
  sub: "สำรอง",
};

export const PLAYER_STATUS_COLOR: Record<PlayerStatus, string> = {
  starter: "bg-emerald-500",
  sub: "bg-slate-400",
};

/** ตำแหน่งมาตรฐาน (พิมพ์เองได้ด้วย) */
export const POSITIONS = ["GK", "DF", "MF", "FW"] as const;

/** ตำแหน่งมาตรฐาน + ชื่อเต็มภาษาไทย (เก็บ DB เป็นรหัสสั้น) */
export const POSITIONS_FULL: { code: string; label: string }[] = [
  { code: "GK", label: "ผู้รักษาประตู" },
  { code: "DF", label: "กองหลัง" },
  { code: "MF", label: "กองกลาง" },
  { code: "FW", label: "กองหน้า" },
];

export interface Player {
  id: string;
  name: string;
  jersey_number: number | null;
  position: string | null;
  status: PlayerStatus;
  photo_url: string | null;
  created_at: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  match_date: string; // YYYY-MM-DD
  match_time: string | null; // HH:MM(:SS)
  venue_id: string | null;
  venue_name: string | null;
  opponent: string | null;
  score_us: number | null;
  score_opponent: number | null;
  cost: number;
  story_caption: string | null;
  created_at: string;
}

export interface MatchStat {
  id: string;
  match_id: string;
  player_id: string;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
  created_at: string;
}

export type RegistrationStatus = "going" | "not_going";

export interface MatchRegistration {
  id: string;
  match_id: string;
  player_id: string;
  status: RegistrationStatus;
  created_at: string;
}

export interface StoryPhoto {
  id: string;
  match_id: string;
  photo_url: string;
  caption: string | null;
  created_at: string;
}

/** ตำแหน่งผู้เล่นบนสนาม เก็บแบบ normalized 0..1 */
export interface FormationPosition {
  player_id: string;
  x: number; // 0..1 (ซ้าย→ขวา)
  y: number; // 0..1 (ประตูเรา→ประตูคู่แข่ง)
}

/** ช่องกำหนดตำแหน่ง (วงไกด์ไลน์) — player_id = null คือยังว่าง */
export interface FormationSlot {
  x: number;
  y: number;
  player_id: string | null;
  sub?: boolean; // true = ช่องตัวสำรอง (พื้นเหลือง)
}

export interface FormationData {
  positions: FormationPosition[]; // เก็บเฉพาะช่องที่มีคน (backward-compat)
  slots?: FormationSlot[]; // แม่แบบ + การวางตัว (source ใหม่)
}

export interface Formation {
  id: string;
  name: string;
  match_id: string | null;
  data: FormationData;
  created_at: string;
}

// ---------- Social (สตอรี่) ----------
export type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry";

export const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "like", emoji: "👍", label: "ถูกใจ" },
  { type: "love", emoji: "❤️", label: "รัก" },
  { type: "haha", emoji: "😆", label: "ฮา" },
  { type: "wow", emoji: "😮", label: "ว้าว" },
  { type: "sad", emoji: "😢", label: "เศร้า" },
  { type: "angry", emoji: "😡", label: "โกรธ" },
];

export const REACTION_EMOJI: Record<ReactionType, string> = Object.fromEntries(
  REACTIONS.map((r) => [r.type, r.emoji])
) as Record<ReactionType, string>;

export interface Reaction {
  id: string;
  match_id: string;
  device_id: string;
  type: ReactionType;
  created_at: string;
}

export interface Comment {
  id: string;
  match_id: string;
  parent_id: string | null;
  device_id: string | null;
  author_name: string;
  body: string;
  created_at: string;
}
