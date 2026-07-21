import { NavLink } from "react-router-dom";
import { Users, CalendarDays, Images, LayoutGrid } from "lucide-react";

const items = [
  { to: "/players", label: "ผู้เล่น", Icon: Users },
  { to: "/matches", label: "นัดแข่ง", Icon: CalendarDays },
  { to: "/story", label: "สตอรี่", Icon: Images },
  { to: "/formation", label: "แผนเล่น", Icon: LayoutGrid },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[hsl(var(--border))] bg-[hsl(var(--surface))]/95 backdrop-blur pb-safe">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map(({ to, label, Icon }) => (
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
      </div>
    </nav>
  );
}
