import { AlertTriangle } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function EnvBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="mx-auto mt-3 max-w-lg px-4">
      <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <div>
          ยังไม่ได้เชื่อม Supabase — คัดลอก <code>.env.example</code> เป็น{" "}
          <code>.env</code> แล้วใส่ <code>VITE_SUPABASE_URL</code> กับ{" "}
          <code>VITE_SUPABASE_ANON_KEY</code> จากนั้น restart <code>npm run dev</code>. หน้าจอ
          UI ดูได้ แต่การบันทึกข้อมูลจะยังไม่ทำงาน
        </div>
      </div>
    </div>
  );
}
