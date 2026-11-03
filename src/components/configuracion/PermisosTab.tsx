"use client";

import { Fragment, useMemo, useState } from "react";
import { useServerFn } from "@/lib/server-fn/client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronDown, Info, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { CATALOGO_ACCIONES, MODULOS_ORDEN, type PermRole } from "@/lib/permisos/catalogo";
import { listRolePermissions, setRolePermission } from "@/lib/api-client/permisos.functions";

const ROLES: PermRole[] = ["residente", "auxiliar", "administrativo", "supervisor"];
const ROLE_LABEL: Record<PermRole, string> = {
  residente: "Residente",
  auxiliar: "Auxiliar",
  administrativo: "Administrativo",
  supervisor: "Supervisor",
};

export function PermisosTab() {
  const [busqueda, setBusqueda] = useState("");
  const [modulosAbiertos, setModulosAbiertos] = useState<Set<string>>(
    () => new Set(MODULOS_ORDEN),
  );
  const qc = useQueryClient();
  const listFn = useServerFn(listRolePermissions);
  const setFn = useServerFn(setRolePermission);

  const q = useQuery({
    queryKey: ["role_permissions"],
    queryFn: () => listFn(),
  });

  const overrides = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const row of ((q.data as any)?.items ?? []) as Array<{
      role: string;
      action_key: string;
      allowed: boolean;
    }>) {
      map.set(`${row.role}::${row.action_key}`, row.allowed);
    }
    return map;
  }, [q.data]);

  const mut = useMutation({
    mutationFn: (input: { role: PermRole; action_key: string; allowed: boolean }) =>
      setFn({ data: input }),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["role_permissions"] });
      const prev = qc.getQueryData<any>(["role_permissions"]);
      const items = [...(prev?.items ?? [])];
      const idx = items.findIndex(
        (r) => r.role === input.role && r.action_key === input.action_key,
      );
      if (idx >= 0) items[idx] = { ...items[idx], allowed: input.allowed };
      else items.push(input);
      qc.setQueryData(["role_permissions"], { items });
      return { prev };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev) qc.setQueryData(["role_permissions"], ctx.prev);
      toast.error("No se pudo guardar el permiso");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["role_permissions"] });
      qc.invalidateQueries({ queryKey: ["permisos-overrides"] });
    },
  });

  const isChecked = (role: PermRole, action_key: string, def: boolean) => {
    const v = overrides.get(`${role}::${action_key}`);
    return v ?? def;
  };

  const filtro = busqueda.trim().toLocaleLowerCase();
  const accionesPorModulo = (modulo: string) =>
    CATALOGO_ACCIONES.filter(
      (accion) =>
        accion.modulo === modulo &&
        (!filtro ||
          `${accion.label} ${accion.descripcion ?? ""} ${accion.key} ${modulo}`
            .toLocaleLowerCase()
            .includes(filtro)),
    );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar módulo o acción…"
          aria-label="Buscar permisos"
          className="pl-9"
        />
      </div>

      <Alert>
        <Info className="size-4" />
        <AlertDescription>
          Los cambios se aplican de inmediato al sistema. El Director siempre conserva acceso total.
        </AlertDescription>
      </Alert>

      <div className="max-h-[70vh] rounded-md border overflow-auto [&>div]:overflow-visible">
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-background">
            <TableRow>
              <TableHead className="min-w-[280px]">Acción</TableHead>
              <TableHead className="text-center whitespace-nowrap">Director</TableHead>
              {ROLES.map((r) => (
                <TableHead key={r} className="text-center whitespace-nowrap">
                  {ROLE_LABEL[r]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {MODULOS_ORDEN.map((modulo) => {
              const acciones = accionesPorModulo(modulo);
              if (!acciones.length) return null;
              const abierto = modulosAbiertos.has(modulo);

              return (
                <Fragment key={modulo}>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableCell
                      colSpan={2 + ROLES.length}
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
                    acciones.map((a) => (
                      <TableRow key={a.key}>
                        <TableCell>
                          <div className="text-sm">{a.label}</div>
                          {a.descripcion && (
                            <div className="text-xs text-muted-foreground">{a.descripcion}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox checked disabled aria-label="Director (siempre)" />
                        </TableCell>
                        {ROLES.map((r) => {
                          const checked = isChecked(r, a.key, a.defaults[r]);
                          return (
                            <TableCell key={r} className="text-center">
                              <Checkbox
                                checked={checked}
                                disabled={mut.isPending}
                                onCheckedChange={(v) =>
                                  mut.mutate({ role: r, action_key: a.key, allowed: v === true })
                                }
                                aria-label={`${ROLE_LABEL[r]} — ${a.label}`}
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
