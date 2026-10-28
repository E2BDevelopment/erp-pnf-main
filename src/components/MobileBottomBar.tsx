"use client";

import { Link } from "@/lib/navigation";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PendientesBadge } from "@/components/PendientesBadge";

export type BottomBarItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Active if pathname equals `to` (exact) or starts with `to` */
  exact?: boolean;
  /** Pendientes count to show as a badge over the icon */
  pendientes?: number;
};

type Props = {
  items: BottomBarItem[];
  pathname: string;
  /**
   * `scroll` mantiene todos los módulos en una sola fila desplazable —la barra
   * de obra—; `fixed` reparte los destinos disponibles a lo ancho del teléfono.
   */
  variant?: "fixed" | "scroll";
  onMoreClick?: () => void;
  moreExpanded?: boolean;
  label?: string;
};

function isActive(item: BottomBarItem, pathname: string) {
  return item.exact
    ? pathname === item.to
    : pathname === item.to || pathname.startsWith(item.to + "/");
}

export function MobileBottomBar({
  items,
  pathname,
  variant = "fixed",
  onMoreClick,
  moreExpanded,
  label = "Navegación",
}: Props) {
  const scroll = variant === "scroll";

  return (
    <nav
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="flex h-16 items-stretch">
        <div
          className={cn(
            "flex flex-1 items-stretch",
            scroll && "overflow-x-auto overflow-y-hidden overscroll-x-contain",
          )}
        >
          {items.map((it) => {
            const Icon = it.icon;
            const active = isActive(it, pathname);
            return (
              <Link
                key={it.to}
                to={it.to}
                aria-current={active ? "page" : undefined}
                title={it.pendientes ? `${it.pendientes} pendientes por atender` : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 leading-none transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
                  scroll ? "w-[4.5rem] shrink-0 text-[10px]" : "flex-1 text-[11px]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="relative inline-flex p-1">
                  <Icon className="size-5 shrink-0" aria-hidden />
                  {it.pendientes ? (
                    <PendientesBadge
                      count={it.pendientes}
                      className="absolute -top-0.5 -right-1.5"
                    />
                  ) : null}
                </span>
                <span className="max-w-full truncate">{it.label}</span>
              </Link>
            );
          })}
        </div>

        {onMoreClick && (
          <button
            type="button"
            onClick={onMoreClick}
            aria-haspopup="dialog"
            aria-expanded={moreExpanded}
            aria-label="Más opciones"
            className="flex w-16 shrink-0 flex-col items-center justify-center gap-1 border-l border-border text-[11px] leading-none text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
          >
            <MoreHorizontal className="size-5" aria-hidden />
            <span>Más</span>
          </button>
        )}
      </div>
    </nav>
  );
}
