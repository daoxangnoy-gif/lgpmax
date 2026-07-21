import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** true เมื่อยังไม่ได้ตั้งค่า .env — ใช้แสดง banner เตือนแทนที่จะพังทั้งจอ */
export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  // ไม่ throw เพื่อให้ UI ยังเปิดได้ (CRUD จะ error จนกว่าจะใส่ค่าใน .env)
  console.warn(
    "[FootyTeam] ยังไม่ได้ตั้งค่า VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — คัดลอก .env.example เป็น .env แล้วใส่ค่าจริง"
  );
}

export const supabase = createClient(
  url ?? "https://placeholder.supabase.co",
  anonKey ?? "placeholder-anon-key"
);
