// ระบบสิทธิ์ LGP MAX — ค่าคงที่ + helper

/** โดเมนปลอมสำหรับ Supabase Auth (ผู้ใช้กรอกแค่ username) */
const EMAIL_DOMAIN = "lgpmax.local";
export const toEmail = (username: string) =>
  `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`;

export type MenuKey = "players" | "matches" | "story" | "formation";
export type ActionKey = "view" | "create" | "edit" | "delete";

export const MENUS: { key: MenuKey; label: string }[] = [
  { key: "players", label: "ผู้เล่น" },
  { key: "matches", label: "นัดแข่ง" },
  { key: "story", label: "สตอรี่" },
  { key: "formation", label: "แผนการเล่น" },
];

export const ACTIONS: { key: ActionKey; label: string }[] = [
  { key: "view", label: "ดู" },
  { key: "create", label: "เพิ่ม" },
  { key: "edit", label: "แก้ไข" },
  { key: "delete", label: "ลบ" },
];

export type Perms = Record<MenuKey, Record<ActionKey, boolean>>;

export const EMPTY_PERMS: Perms = {
  players: { view: false, create: false, edit: false, delete: false },
  matches: { view: false, create: false, edit: false, delete: false },
  story: { view: false, create: false, edit: false, delete: false },
  formation: { view: false, create: false, edit: false, delete: false },
};

export const DEFAULT_MEMBER_PERMS: Perms = {
  players: { view: true, create: true, edit: true, delete: false },
  matches: { view: true, create: true, edit: true, delete: false },
  story: { view: true, create: true, edit: true, delete: false },
  formation: { view: true, create: true, edit: true, delete: false },
};

export interface Profile {
  user_id: string;
  username: string;
  display_name: string | null;
  role: "admin" | "member";
  status: "pending" | "approved" | "rejected";
  player_id: string | null;
  perms: Partial<Perms>;
  created_at: string;
}
