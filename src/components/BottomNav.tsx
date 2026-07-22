import { NavLink } from "react-router-dom";
import { Users, CalendarDays, Images, LayoutGrid, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { MenuKey } from "@/lib/auth";

const items: { to: string; label: string; Icon: typeof Users; menu: MenuKey }[] = [
  { to: "/players", label: "ผู้เล่น", Icon: Users, menu: "players" },
  { to: "/matches", label: "นัดแข่ง", Icon: CalendarDays, menu: "matches" },
  { to: "/story", label: "สตอรี่", Icon: Images, menu: "story" },
  { to: "/formation", label: "แผนเล่น", Icon: LayoutGrid, menu: "formation" },
];

export default function BottomNav() {
  const { can, isAdmin } = useAuth();
  const visible = items.filter((i) => can(i.menu, "view"));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[hsl(var(--border))] bg-[hsl(var(--surface))]/95 backdrop-blur pb-safe">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {visible.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                isActive ? "text-brand" : "text-[hsl(var(--text-muted))]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.6 : 2} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                isActive ? "text-brand" : "text-[hsl(var(--text-muted))]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <ShieldCheck size={22} strokeWidth={isActive ? 2.6 : 2} />
                <span>ผู้ใช้</span>
              </>
            )}
          </NavLink>
        )}
      </div>
    </nav>
  );
}
