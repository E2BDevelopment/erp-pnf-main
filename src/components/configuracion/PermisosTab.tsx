"use client";

import { Fragment, useMemo, useState } from "react";
import { useServerFn } from "@/lib/server-fn/client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronDown, Info, Plus, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffectiveIsDirector } from "@/stores/auth";
import { Input } from "@/components/ui/input";
import {
  CATALOGO_ACCIONES,
  MODULOS_ORDEN,
  isObraAction,
  type PermRole,
} from "@/lib/permisos/catalogo";
import {
  listRolePermissions,
  setRolePermission,
  listCompanyRoles,
  createCompanyRole,
} from "@/lib/api-client/permisos.functions";

const ROLES: PermRole[] = ["residente", "auxiliar", "administrativo", "supervisor"];
const ROLE_LABEL: Record<PermRole, string> = {
  residente: "Residente",
  auxiliar: "Auxiliar",
  administrativo: "Administrativo",
  supervisor: "Supervisor",
};

export function PermisosTab({ obraId }: { obraId?: string }) {
  const director = useEffectiveIsDirector();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [baseRole, setBaseRole] = useState<PermRole>("residente");
  const [mobileRole, setMobileRole] = useState("residente");
  const listRolesFn = useServerFn(listCompanyRoles);
  const createRoleFn = useServerFn(createCompanyRole);
  const rolesQuery = useQuery({ queryKey: ["company-roles"], queryFn: () => listRolesFn() });
  const roles = [
    ...ROLES.map((role) => ({ id: role as string, name: ROLE_LABEL[role], base_role: role })),
    ...(rolesQuery.data ?? []),
  ];
  const [busqueda, setBusqueda] = useState("");
  const [modulosAbiertos, setModulosAbiertos] = useState<Set<string>>(() => new Set(MODULOS_ORDEN));
  const qc = useQueryClient();
  const listFn = useServerFn(listRolePermissions);
  const setFn = useServerFn(setRolePermission);

  const q = useQuery({
    queryKey: ["role_permissions", "matriz", obraId ?? "empresa"],
    queryFn: () => listFn({ data: { obraId } }),
  });

  const createRole = useMutation({
    mutationFn: () => createRoleFn({ data: { name, base_role: baseRole } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-roles"] });
      qc.invalidateQueries({ queryKey: ["role_permissions"] });
      setCreating(false);
      setName("");
      toast.success("Rol creado. Ya puedes ajustar sus permisos y asignarlo al equipo.");
    },
    onError: (error: Error) => toast.error(error.message),
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
    mutationFn: (input: { role: string; action_key: string; allowed: boolean | null }) =>
      setFn({ data: { ...input, obraId } }),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["role_permissions"] });
      await qc.invalidateQueries({ queryKey: ["permisos-overrides"] });
    },
  });

  const isChecked = (role: string, action_key: string, def: boolean) => {
    const v = overrides.get(`${role}::${action_key}`);
    return v ?? def;
  };

  const filtro = busqueda.trim().toLocaleLowerCase();
  const accionesPorModulo = (modulo: string) =>
    CATALOGO_ACCIONES.filter(
      (accion) =>
        accion.modulo === modulo &&
        (!obraId || isObraAction(accion.key)) &&
        (!filtro ||
          `${accion.label} ${accion.descripcion ?? ""} ${accion.key} ${modulo}`
            .toLocaleLowerCase()
            .includes(filtro)),
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar módulo o acción…"
            aria-label="Buscar permisos"
            className="pl-9"
          />
        </div>

        {director && !obraId && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Añadir rol
          </Button>
        )}
      </div>

      {(q.isError || rolesQuery.isError) && (
        <p role="alert" className="text-sm text-destructive">
          No se pudieron cargar los permisos.{" "}
          <Button
            variant="link"
            onClick={() => {
              q.refetch();
              rolesQuery.refetch();
            }}
          >
            Reintentar
          </Button>
        </p>
      )}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              createRole.mutate();
            }}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>Añadir rol</DialogTitle>
              <DialogDescription>
                El perfil base determina los flujos de trabajo y el acceso a los módulos. Se
                copiarán sus permisos actuales; después puedes ajustarlos en la tabla.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="role-name">Nombre del rol</Label>
              <Input
                id="role-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={60}
                required
                autoFocus
                placeholder="Ej. Compras"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-base">Perfil base</Label>
              <Select value={baseRole} onValueChange={(value) => setBaseRole(value as PermRole)}>
                <SelectTrigger id="role-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABEL[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createRole.isPending || !name.trim()}>
                {createRole.isPending ? "Creando…" : "Crear rol"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Alert>
        <Info className="size-4" />
        <AlertDescription>
          {obraId
            ? "Esta obra hereda los permisos de la empresa. Cambia solo las excepciones; selecciona Heredar para restablecer la regla de empresa. Los permisos no sustituyen la asignación a la obra ni los vistos buenos del proceso."
            : "Los cambios se aplican de inmediato. Las obras heredan estos permisos salvo sus excepciones. El Director siempre conserva acceso total."}
        </AlertDescription>
      </Alert>

      {obraId && (
        <div className="space-y-2 md:hidden">
          <Label htmlFor="obra-permission-role">Rol a configurar</Label>
          <Select value={mobileRole} onValueChange={setMobileRole}>
            <SelectTrigger id="obra-permission-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="max-h-[70vh] rounded-md border overflow-auto [&>div]:overflow-visible">
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-background">
            <TableRow>
              <TableHead className={obraId ? "min-w-32 md:min-w-[280px]" : "min-w-[280px]"}>
                Acción
              </TableHead>
              <TableHead
                className={`text-center whitespace-nowrap ${obraId ? "hidden md:table-cell" : ""}`}
              >
                Director
              </TableHead>
              {roles.map((r) => (
                <TableHead
                  key={r.id}
                  className={`text-center whitespace-nowrap ${obraId && r.id !== mobileRole ? "hidden md:table-cell" : ""}`}
                >
                  {r.name}
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
                      colSpan={2 + roles.length}
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
                        <TableCell
                          className={`text-center ${obraId ? "hidden md:table-cell" : ""}`}
                        >
                          <Checkbox checked disabled aria-label="Director (siempre)" />
                        </TableCell>
                        {roles.map((r) => {
                          const checked = isChecked(
                            r.id,
                            a.key,
                            ROLES.includes(r.id as PermRole) ? a.defaults[r.id as PermRole] : false,
                          );
                          const exception = q.data?.obra_items.find(
                            (item) => item.role === r.id && item.action_key === a.key,
                          );
                          return (
                            <TableCell
                              key={r.id}
                              className={`text-center ${obraId && r.id !== mobileRole ? "hidden md:table-cell" : ""}`}
                            >
                              {obraId ? (
                                <div className="min-w-44 space-y-1">
                                  <Select
                                    value={exception ? String(exception.allowed) : "heredar"}
                                    disabled={
                                      !director ||
                                      q.isPending ||
                                      q.isError ||
                                      rolesQuery.isError ||
                                      mut.isPending
                                    }
                                    onValueChange={(value) =>
                                      mut.mutate({
                                        role: r.id,
                                        action_key: a.key,
                                        allowed: value === "heredar" ? null : value === "true",
                                      })
                                    }
                                  >
                                    <SelectTrigger aria-label={`${r.name} — ${a.label}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="heredar">
                                        Heredar ({checked ? "permitido" : "denegado"})
                                      </SelectItem>
                                      <SelectItem value="true">Permitir</SelectItem>
                                      <SelectItem value="false">Denegar</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <p className="text-xs text-muted-foreground">
                                    {(exception?.allowed ?? checked) ? "Permitido" : "Denegado"}{" "}
                                    {exception ? "en esta obra" : "por empresa"}
                                  </p>
                                </div>
                              ) : (
                                <Checkbox
                                  checked={checked}
                                  disabled={!director || q.isPending || q.isError || mut.isPending}
                                  onCheckedChange={(v) =>
                                    mut.mutate({
                                      role: r.id,
                                      action_key: a.key,
                                      allowed: v === true,
                                    })
                                  }
                                  aria-label={`${r.name} — ${a.label}`}
                                />
                              )}
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
