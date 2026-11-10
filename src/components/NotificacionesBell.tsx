"use client";

import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@/lib/server-fn/client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useNavigate } from "@/lib/navigation";
import { Bell, CheckCheck, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ContadorLatido } from "@/components/anim/ContadorLatido";
import { useStagger } from "@/components/anim/useStagger";
import { cn } from "@/lib/utils";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/auth";
import {
  listMisNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas,
} from "@/lib/api-client/notificaciones.functions";

export function NotificacionesBell() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.userId);
  const [open, setOpen] = useState(false);
  const fetchList = useServerFn(listMisNotificaciones);
  const markOneFn = useServerFn(marcarNotificacionLeida);
  const markAllFn = useServerFn(marcarTodasLeidas);

  const q = useQuery({
    queryKey: ["notificaciones"],
    queryFn: () => fetchList({ data: { limit: 30 } }),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notificaciones-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificaciones",
          filter: `user_id=eq.${userId}`,
        },
        ({ new: notification }) => {
          qc.invalidateQueries({ queryKey: ["notificaciones"] });
          toast(notification.titulo, { description: notification.mensaje });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc, userId]);

  const items = (q.data as any)?.items ?? [];
  const noLeidas = (q.data as any)?.noLeidas ?? 0;

  /** Los avisos son decisiones, no una tabla: entran escalonados. */
  const listaAvisos = useRef<HTMLUListElement>(null);
  // `open` es la señal de montaje: al abrir el popover con datos ya cacheados
  // el conteo no cambia y sin él la animación nunca correría.
  useStagger(listaAvisos, "[data-aviso]", [items.length, open]);

  const markOne = useMutation({
    mutationFn: (id: string) => markOneFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificaciones"] }),
  });
  const markAll = useMutation({
    mutationFn: () => markAllFn(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificaciones"] }),
  });

  const handleOpen = (n: any) => {
    if (!n.leida_at) markOne.mutate(n.id);
    if (!n.link) return;
    const url = new URL(n.link, window.location.origin);
    const search = Object.fromEntries(url.searchParams.entries());
    setOpen(false);
    navigate({ to: url.pathname as any, search: search as any });
  };

  const goToAll = () => {
    setOpen(false);
    navigate({ to: "/app/notificaciones" });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-11 md:size-9"
          aria-label={
            noLeidas > 0
              ? `Notificaciones, ${noLeidas} sin leer`
              : "Notificaciones, ninguna sin leer"
          }
        >
          <Bell className="size-5" aria-hidden />
          {noLeidas > 0 && (
            <ContadorLatido
              valor={noLeidas}
              className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[11px] font-semibold tabular-nums text-white"
            >
              {noLeidas > 9 ? "9+" : noLeidas}
            </ContadorLatido>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">Notificaciones</p>
          {noLeidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
            >
              <CheckCheck className="size-3" aria-hidden />
              Marcar todas
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {q.isPending ? (
            <div className="space-y-3 p-3" aria-hidden>
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="h-4 w-2/3 rounded-sm bg-muted motion-safe:animate-pulse" />
                  <div className="h-3 w-full rounded-sm bg-muted/70 motion-safe:animate-pulse" />
                </div>
              ))}
            </div>
          ) : q.isError ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">No se pudieron cargar los avisos.</p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => void q.refetch()}>
                <RotateCw aria-hidden />
                Reintentar
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium text-foreground">Sin notificaciones</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Aquí llegan las autorizaciones y avisos de tus obras.
              </p>
            </div>
          ) : (
            <ul ref={listaAvisos} className="divide-y divide-border">
              {items.map((n: any) => (
                <li key={n.id} data-aviso>
                  <button
                    type="button"
                    onClick={() => handleOpen(n)}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        n.leida_at ? "bg-transparent" : "bg-primary",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-sm text-foreground",
                          !n.leida_at && "font-semibold",
                        )}
                        title={n.titulo}
                      >
                        {!n.leida_at && <span className="sr-only">Sin leer: </span>}
                        {n.titulo}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                        {n.mensaje}
                      </span>
                      <span
                        className="mt-1 block text-xs text-muted-foreground"
                        title={formatDateTime(n.created_at)}
                      >
                        {formatRelativeTime(n.created_at)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t px-3 py-2">
          <button
            type="button"
            className="w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
            onClick={goToAll}
          >
            Ver todas las notificaciones
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
