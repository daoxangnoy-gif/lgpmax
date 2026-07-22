import type { ReactNode } from "react";

export default function AppHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[hsl(var(--border))] bg-[hsl(var(--bg))]/90 backdrop-blur pt-safe">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <img
            src="/logo.png"
            alt="LGP MAX"
            className="h-9 w-9 shrink-0 rounded-full"
            draggable={false}
          />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-[hsl(var(--text))]">{title}</h1>
            {subtitle && (
              <p className="truncate text-xs text-[hsl(var(--text-muted))]">{subtitle}</p>
            )}
          </div>
        </div>
        {right}
      </div>
    </header>
  );
}
