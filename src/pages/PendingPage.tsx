import { Clock, LogOut, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LOGO_URL } from "@/lib/assets";

export default function PendingPage() {
  const { profile, signOut, refreshProfile } = useAuth();
  const rejected = profile?.status === "rejected";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 pt-safe pb-safe text-center">
      <img src={LOGO_URL} alt="LGP MAX" className="mb-4 h-20 w-20 rounded-full opacity-80" draggable={false} />
      <div
        className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
          rejected ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
        }`}
      >
        <Clock size={32} />
      </div>
      <h1 className="text-xl font-bold">
        {rejected ? "คำขอถูกปฏิเสธ" : "รอแอดมินอนุมัติ"}
      </h1>
      <p className="mt-2 max-w-xs text-sm text-[hsl(var(--text-muted))]">
        {rejected
          ? "บัญชีนี้ไม่ได้รับอนุมัติ ติดต่อแอดมินของทีม"
          : `สวัสดี ${profile?.display_name || profile?.username} — บัญชีของคุณกำลังรอแอดมินอนุมัติและผูกกับนักเตะ`}
      </p>

      <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
        {!rejected && (
          <button className="btn-brand" onClick={refreshProfile}>
            <RefreshCw size={16} /> เช็คสถานะอีกครั้ง
          </button>
        )}
        <button className="btn-ghost" onClick={signOut}>
          <LogOut size={16} /> ออกจากระบบ
        </button>
      </div>
    </div>
  );
}
