import { useState } from "react";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { LOGO_URL } from "@/lib/assets";

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!username.trim() || !password) return toast.error("กรอก username และรหัสผ่าน");
    if (mode === "register" && !displayName.trim()) return toast.error("กรอกชื่อที่จะแสดง");
    if (mode === "register" && password.length < 6)
      return toast.error("รหัสผ่านอย่างน้อย 6 ตัว");
    setBusy(true);
    try {
      if (mode === "login") {
        await signIn(username, password);
      } else {
        await signUp(username, password, displayName);
        toast.success("สมัครสำเร็จ! รอแอดมินอนุมัติ");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 pt-safe pb-safe">
      <img src={LOGO_URL} alt="LGP MAX" className="mb-4 h-24 w-24 rounded-full" draggable={false} />
      <h1 className="text-2xl font-extrabold tracking-wide">LGP MAX</h1>
      <p className="mb-6 text-xs text-[hsl(var(--text-muted))]">LLGP Football Club</p>

      {!isSupabaseConfigured && (
        <p className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-200">
          ยังไม่ได้เชื่อม Supabase (.env)
        </p>
      )}

      <div className="w-full max-w-sm space-y-4">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-[hsl(var(--surface-2))] p-1">
          <button
            className={`btn py-2 ${mode === "login" ? "bg-brand text-brand-fg" : "text-[hsl(var(--text-muted))]"}`}
            onClick={() => setMode("login")}
          >
            เข้าสู่ระบบ
          </button>
          <button
            className={`btn py-2 ${mode === "register" ? "bg-brand text-brand-fg" : "text-[hsl(var(--text-muted))]"}`}
            onClick={() => setMode("register")}
          >
            สมัครสมาชิก
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label">Username</label>
            <input
              className="input"
              value={username}
              autoCapitalize="none"
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ชื่อผู้ใช้ (ภาษาอังกฤษ)"
            />
          </div>
          {mode === "register" && (
            <div>
              <label className="label">ชื่อที่จะแสดง</label>
              <input
                className="input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="เช่น ชื่อเล่น"
              />
            </div>
          )}
          <div>
            <label className="label">รหัสผ่าน</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่าน"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
        </div>

        <button className="btn-brand w-full" onClick={submit} disabled={busy}>
          {busy ? (
            <Loader2 size={18} className="animate-spin" />
          ) : mode === "login" ? (
            <LogIn size={18} />
          ) : (
            <UserPlus size={18} />
          )}
          {mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
        </button>

        {mode === "register" && (
          <p className="text-center text-xs text-[hsl(var(--text-muted))]">
            สมัครแล้วต้องรอแอดมินอนุมัติก่อนใช้งาน
          </p>
        )}
      </div>
    </div>
  );
}
