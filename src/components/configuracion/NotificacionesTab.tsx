"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@/lib/server-fn/client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronDown, Info } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  CATALOGO_NOTIFICACIONES,
  MODULOS_NOTIF_ORDEN,
  type NotifRole,
} from "@/lib/notificaciones/catalogo";
import {
  listNotificacionPreferencias,
  setNotificacionPreferencia,
} from "@/lib/api-client/notificaciones-prefs.functions";

const ROLES: NotifRole[] = ["director", "residente", "auxiliar", "administrativo", "supervisor"];
const ROLE_LABEL: Record<NotifRole, string> = {
  director: "Director",
  residente: "Residente",
  auxiliar: "Auxiliar",
  administrativo: "Administrativo",
  supervisor: "Supervisor",
};

export function NotificacionesTab() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | "unsupported">("default");
  const [modulosAbiertos, setModulosAbiertos] = useState<Set<string>>(
    () => new Set(MODULOS_NOTIF_ORDEN),
  );
  const qc = useQueryClient();
  const listFn = useServerFn(listNotificacionPreferencias);
  const setFn = useServerFn(setNotificacionPreferencia);

  useEffect(() => {
    setSoundEnabled(localStorage.getItem("pnf-notification-sound") !== "off");
    setBrowserPermission("Notification" in window ? Notification.permission : "unsupported");
  }, []);

  const enableBrowserNotifications = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setBrowserPermission(permission);
    if (permission === "granted") toast.success("Notificaciones del navegador activadas");
    else toast.info("No se concedió permiso para mostrar notificaciones");
  };

  const q = useQuery({
    queryKey: ["notificacion_preferencias"],
    queryFn: () => listFn(),
  });

  const overrides = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const row of ((q.data as any)?.items ?? []) as Array<{
      role: string;
      tipo: string;
      habilitado: boolean;
    }>) {
      map.set(`${row.role}::${row.tipo}`, row.habilitado);
    }
    return map;
  }, [q.data]);

  const mut = useMutation({
    mutationFn: (input: { role: NotifRole; tipo: string; habilitado: boolean }) =>
      setFn({ data: input }),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["notificacion_preferencias"] });
      const prev = qc.getQueryData<any>(["notificacion_preferencias"]);
      const items = [...(prev?.items ?? [])];
      const idx = items.findIndex((r) => r.role === input.role && r.tipo === input.tipo);
      if (idx >= 0) items[idx] = { ...items[idx], habilitado: input.habilitado };
      else items.push(input);
      qc.setQueryData(["notificacion_preferencias"], { items });
      return { prev };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev) qc.setQueryData(["notificacion_preferencias"], ctx.prev);
      toast.error("No se pudo guardar la preferencia");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificacion_preferencias"] }),
  });

  const isChecked = (role: NotifRole, tipo: string, def: boolean) => {
    const v = overrides.get(`${role}::${tipo}`);
    return v ?? def;
  };

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-md border p-4">
        <h3 className="font-semibold">Avisos en este dispositivo</h3>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={soundEnabled}
            onCheckedChange={(checked) => {
              const enabled = checked === true;
              setSoundEnabled(enabled);
              localStorage.setItem("pnf-notification-sound", enabled ? "on" : "off");
            }}
          />
          Reproducir sonido al recibir una notificación
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={() => void enableBrowserNotifications()} disabled={browserPermission === "unsupported" || browserPermission === "granted"}>
            {browserPermission === "granted" ? "Notificaciones del navegador activadas" : "Activar notificaciones del navegador"}
          </Button>
          {browserPermission === "denied" && <span className="text-xs text-muted-foreground">El permiso está bloqueado; cámbialo desde la configuración del navegador.</span>}
        </div>
      </section>

      <Alert>
        <Info className="size-4" />
        <AlertDescription>
          Las preferencias se guardan pero aún no aplican a todas las notificaciones existentes; se
          irán conectando progresivamente.
        </AlertDescription>
      </Alert>

      <div className="max-h-[70vh] rounded-md border overflow-auto [&>div]:overflow-visible">
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-background">
            <TableRow>
              <TableHead className="min-w-[280px]">Notificación</TableHead>
              {ROLES.map((r) => (
                <TableHead key={r} className="text-center whitespace-nowrap">
                  {ROLE_LABEL[r]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {MODULOS_NOTIF_ORDEN.map((modulo) => {
              const abierto = modulosAbiertos.has(modulo);
              return (
                <Fragment key={modulo}>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableCell
                      colSpan={1 + ROLES.length}
                      className="p-0 font-semibold text-xs uppercase tracking-wide text-muted-foreground"
                    >
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-2 py-3 text-left hover:text-foreground"
                        aria-expanded={abierto}
                        onClick={() =>
                          setModulosAbiertos((prev) => {
                            const next = new Set(prev);
                            if (next.has(modulo)) next.delete(modulo);
                            else next.add(modulo);
                            return next;
                          })
                        }
                      >
                        <ChevronDown
                          className={`size-4 transition-transform ${abierto ? "" : "-rotate-90"}`}
                        />
                        {modulo}
                      </button>
                    </TableCell>
                  </TableRow>
                  {abierto &&
                    CATALOGO_NOTIFICACIONES.filter((n) => n.modulo === modulo).map((n) => (
                      <TableRow key={n.key}>
                        <TableCell>
                          <div className="text-sm">{n.label}</div>
                          {n.descripcion && (
                            <div className="text-xs text-muted-foreground">{n.descripcion}</div>
                          )}
                        </TableCell>
                        {ROLES.map((r) => {
                          const checked = isChecked(r, n.key, n.defaults[r]);
                          return (
                            <TableCell key={r} className="text-center">
                              <Checkbox
                                checked={checked}
                                disabled={mut.isPending}
                                onCheckedChange={(v) =>
                                  mut.mutate({ role: r, tipo: n.key, habilitado: v === true })
                                }
                                aria-label={`${ROLE_LABEL[r]} — ${n.label}`}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
