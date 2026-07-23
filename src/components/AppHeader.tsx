import { useState, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LOGO_URL } from "@/lib/assets";

export default function AppHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  const { profile, isAdmin, signOut } = useAuth();
  const [menu, setMenu] = useState(false);
  const initial = (profile?.display_name || profile?.username || "?").slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-[hsl(var(--border))] bg-[hsl(var(--bg))]/90 backdrop-blur pt-safe">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <img src={LOGO_URL} alt="LGP MAX" className="h-9 w-9 shrink-0 rounded-full" draggable={false} />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-[hsl(var(--text))]">{title}</h1>
            {subtitle && <p className="truncate text-xs text-[hsl(var(--text-muted))]">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {right}
          <div className="relative">
            <button
              onClick={() => setMenu((m) => !m)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--surface-2))] text-sm font-bold"
              aria-label="โปรไฟล์"
            >
              {initial}
            </button>
            {menu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                <div className="absolute right-0 top-11 z-50 w-48 overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] shadow-card">
                  <div className="border-b border-[hsl(var(--border))] px-3 py-2">
                    <div className="truncate text-sm font-semibold">{profile?.display_name || profile?.username}</div>
                    <div className="truncate text-xs text-[hsl(var(--text-muted))]">
                      @{profile?.username} · {isAdmin ? "แอดมิน" : "สมาชิก"}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMenu(false);
                      signOut();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-[hsl(var(--surface-2))]"
                  >
                    <LogOut size={16} /> ออกจากระบบ
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
