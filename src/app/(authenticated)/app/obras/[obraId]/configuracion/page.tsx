"use client";

import { useNavigate, useParams } from "@/lib/navigation";
import { useEffect, useState } from "react";
import { useServerFn } from "@/lib/server-fn/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getObraConfiguracion,
  actualizarObra,
  actualizarObraTeam,
  actualizarObraComisiones,
  listCompanyUsers,
} from "@/lib/api-client/obras.functions";
import { listClientes } from "@/lib/api-client/clientes.functions";
import { listUnidadesNegocio } from "@/lib/api-client/unidades-negocio.functions";
import { usePermisos } from "@/hooks/usePermisos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Trash2, Plus } from "lucide-react";
import { formatMXN } from "@/lib/format";
import { siguienteRolEquipo, validarComisionesEquipo, validarEquipoObra } from "@/lib/obra-utils";
import { PresupuestoModule } from "@/components/presupuesto/PresupuestoModule";
import { PermisosTab } from "@/components/configuracion/PermisosTab";
import { useEffectiveIsDirector } from "@/stores/auth";

type RolObra = "director" | "residente" | "auxiliar" | "administrativo" | "supervisor";
type TeamRow = { user_id: string; role: RolObra };
type ComisionRow = {
  user_id: string;
  porcentaje: number;
  base_calculo: "monto_contratado" | "monto_cobrado" | "utilidad";
};
type ComisionDraft = Omit<ComisionRow, "porcentaje"> & { porcentaje: string };

const ROLES_OBRA: { value: RolObra; label: string }[] = [
  { value: "residente", label: "Residente" },
  { value: "auxiliar", label: "Auxiliar" },
  { value: "administrativo", label: "Administrativo" },
  { value: "supervisor", label: "Supervisor" },
];

function ConfiguracionObra() {
  const { obraId } = useParams();
  const navigate = useNavigate();
  const { can, isLoading: permisosLoading } = usePermisos();
  const director = useEffectiveIsDirector();

  const puedeEditar = can("obras.editar");
  const puedeAsignarTeam = can("obras.asignar_team");
  const puedeVerAlgo = puedeEditar || puedeAsignarTeam;

  useEffect(() => {
    if (!permisosLoading && !puedeVerAlgo) {
      navigate({ to: "/app/obras/$obraId", params: { obraId } });
    }
  }, [permisosLoading, puedeVerAlgo, navigate, obraId]);

  const fetchCfg = useServerFn(getObraConfiguracion);
  const cfg = useQuery({
    queryKey: ["obra-configuracion", obraId],
    queryFn: () => fetchCfg({ data: { obraId } }),
    enabled: puedeVerAlgo,
  });

  const defaultTab = puedeEditar ? "datos" : "equipo";

  if (permisosLoading) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  if (!puedeVerAlgo) return null;
  if (cfg.isLoading) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  if (cfg.error || !cfg.data)
    return <p className="text-sm text-destructive">No se pudo cargar la configuración.</p>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración de la obra</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edita los datos generales, presupuesto, equipo, comisiones y permisos de esta obra.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="h-auto flex-wrap">
          {puedeEditar && <TabsTrigger value="datos">Datos generales</TabsTrigger>}
          {puedeEditar && <TabsTrigger value="presupuesto">Presupuesto</TabsTrigger>}
          {puedeAsignarTeam && <TabsTrigger value="equipo">Equipo</TabsTrigger>}
          {puedeAsignarTeam && <TabsTrigger value="comisiones">Comisiones</TabsTrigger>}
          {director && <TabsTrigger value="permisos">Permisos</TabsTrigger>}
        </TabsList>

        {director && (
          <TabsContent value="permisos">
            <PermisosTab obraId={obraId} />
          </TabsContent>
        )}

        {puedeEditar && (
          <TabsContent value="datos">
            <DatosTab obraId={obraId} initial={cfg.data.obra} />
          </TabsContent>
        )}
        {puedeEditar && (
          <TabsContent value="presupuesto">
            <PresupuestoModule obraId={obraId} />
          </TabsContent>
        )}
        {puedeAsignarTeam && (
          <TabsContent value="equipo">
            <EquipoTab obraId={obraId} initial={cfg.data.team as TeamRow[]} />
          </TabsContent>
        )}
        {puedeAsignarTeam && (
          <TabsContent value="comisiones">
            <ComisionesTab
              obraId={obraId}
              initial={cfg.data.comisiones as ComisionRow[]}
              team={cfg.data.team as TeamRow[]}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// ============================================================
// Datos generales
// ============================================================

type ObraData = {
  id: string;
  nombre: string;
  unidad_negocio_id: string | null;
  cliente_id: string | null;
  numero_contrato: string | null;
  ubicacion: string | null;
  fecha_inicio: string | null;
  fecha_terminacion: string | null;
  presupuesto_url: string | null;
  monto_contratado: number | null;
};

function DatosTab({ obraId, initial }: { obraId: string; initial: ObraData }) {
  const qc = useQueryClient();
  const update = useServerFn(actualizarObra);
  const fetchClientes = useServerFn(listClientes);
  const fetchUnidades = useServerFn(listUnidadesNegocio);

  const clientesQ = useQuery({
    queryKey: ["clientes"],
    queryFn: () => fetchClientes({ data: {} }),
  });
  const unidadesQ = useQuery({ queryKey: ["unidades-negocio"], queryFn: () => fetchUnidades() });

  const [nombre, setNombre] = useState(initial.nombre);
  const [unidadNegocioId, setUnidadNegocioId] = useState(initial.unidad_negocio_id ?? "");
  const [clienteId, setClienteId] = useState(initial.cliente_id ?? "");
  const [numeroContrato, setNumeroContrato] = useState(initial.numero_contrato ?? "");
  const [ubicacion, setUbicacion] = useState(initial.ubicacion ?? "");
  const [fechaInicio, setFechaInicio] = useState(initial.fecha_inicio ?? "");
  const [fechaTerm, setFechaTerm] = useState(initial.fecha_terminacion ?? "");

  const m = useMutation({
    mutationFn: update,
    onSuccess: () => {
      toast.success("Datos actualizados");
      qc.invalidateQueries({ queryKey: ["obra-configuracion", obraId] });
      qc.invalidateQueries({ queryKey: ["obra-dashboard", obraId] });
      qc.invalidateQueries({ queryKey: ["obras"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSave = () => {
    if (!nombre.trim()) return toast.error("Nombre requerido");
    if (!unidadNegocioId) return toast.error("Selecciona unidad de negocio");
    m.mutate({
      data: {
        obraId,
        nombre: nombre.trim(),
        unidad_negocio_id: unidadNegocioId,
        cliente_id: clienteId || null,
        numero_contrato: numeroContrato.trim() || null,
        ubicacion: ubicacion.trim() || null,
        fecha_inicio: fechaInicio || null,
        fecha_terminacion: fechaTerm || null,
      },
    });
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <Label htmlFor="nombre">Nombre de la obra *</Label>
        <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="datos-tab-unidad-de-negocio">Unidad de negocio *</Label>
        <Select value={unidadNegocioId} onValueChange={setUnidadNegocioId}>
          <SelectTrigger id="datos-tab-unidad-de-negocio">
            <SelectValue placeholder="Selecciona unidad" />
          </SelectTrigger>
          <SelectContent>
            {(unidadesQ.data ?? []).map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="datos-tab-cliente">Cliente</Label>
        <Select value={clienteId} onValueChange={setClienteId}>
          <SelectTrigger id="datos-tab-cliente">
            <SelectValue placeholder="Selecciona cliente" />
          </SelectTrigger>
          <SelectContent>
            {(clientesQ.data ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.razon_social} <span className="text-muted-foreground">· {c.rfc}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contrato">Número de contrato</Label>
          <Input
            id="contrato"
            value={numeroContrato}
            onChange={(e) => setNumeroContrato(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="ubic">Ubicación de la obra</Label>
          <Input
            id="ubic"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            placeholder="Dirección o link de Google Maps"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Puedes pegar un enlace de Google Maps; aparecerá clickeable en las órdenes de compra a
            proveedores.
          </p>
        </div>
        <div>
          <Label htmlFor="fi">Fecha de inicio</Label>
          <Input
            id="fi"
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="ft">Fecha de terminación</Label>
          <Input
            id="ft"
            type="date"
            value={fechaTerm}
            onChange={(e) => setFechaTerm(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Monto contratado (MXN)</Label>
          <div className="mt-1.5 px-3 py-2 rounded-md border border-input bg-muted/40 text-sm">
            {formatMXN(initial.monto_contratado)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Se calcula automáticamente a partir del presupuesto autorizado y sus órdenes de cambio.
            No es editable.
          </p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={m.isPending}>
          {m.isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </Card>
  );
}

// ============================================================
// Equipo
// ============================================================

function EquipoTab({ obraId, initial }: { obraId: string; initial: TeamRow[] }) {
  const qc = useQueryClient();
  const update = useServerFn(actualizarObraTeam);
  const fetchUsers = useServerFn(listCompanyUsers);
  const usersQ = useQuery({ queryKey: ["company-users"], queryFn: () => fetchUsers() });

  const [team, setTeam] = useState<TeamRow[]>(initial);

  const m = useMutation({
    mutationFn: update,
    onSuccess: () => {
      toast.success("Equipo actualizado");
      qc.invalidateQueries({ queryKey: ["obra-configuracion", obraId] });
      qc.invalidateQueries({ queryKey: ["obra-dashboard", obraId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSave = () => {
    const limpio = team.filter((t) => !!t.user_id);
    if (limpio.length !== team.length) return toast.error("Selecciona usuario en cada fila");
    const errorEquipo = validarEquipoObra(limpio);
    if (errorEquipo) return toast.error(errorEquipo);
    m.mutate({ data: { obraId, team: limpio } });
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Equipo asignado</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Mínimo un Residente y un Administrativo (máximo uno de cada uno).
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTeam([...team, { user_id: "", role: siguienteRolEquipo(team) }])}
        >
          <Plus className="size-3.5 mr-1" /> Agregar
        </Button>
      </div>

      <div className="space-y-2">
        {team.map((row, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <Select
              value={row.user_id}
              onValueChange={(v) => {
                const next = [...team];
                next[idx] = { ...next[idx], user_id: v };
                setTeam(next);
              }}
            >
              <SelectTrigger aria-label={`Usuario del equipo ${idx + 1}`} className="flex-1">
                <SelectValue placeholder="Usuario" />
              </SelectTrigger>
              <SelectContent>
                {(usersQ.data ?? []).map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nombre_completo || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={row.role}
              onValueChange={(v) => {
                const next = [...team];
                next[idx] = { ...next[idx], role: v as RolObra };
                setTeam(next);
              }}
            >
              <SelectTrigger aria-label={`Rol del equipo ${idx + 1}`} className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES_OBRA.map((r) => {
                  const rolUnico = r.value === "residente" || r.value === "administrativo";
                  const yaAsignado = team.some((t, i) => i !== idx && t.role === r.value);
                  return (
                    <SelectItem key={r.value} value={r.value} disabled={rolUnico && yaAsignado}>
                      {r.label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Quitar integrante del equipo"
              onClick={() => setTeam(team.filter((_, i) => i !== idx))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={m.isPending}>
          {m.isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </Card>
  );
}

// ============================================================
// Comisiones
// ============================================================

function ComisionesTab({
  obraId,
  initial,
  team,
}: {
  obraId: string;
  initial: ComisionRow[];
  team: TeamRow[];
}) {
  const qc = useQueryClient();
  const update = useServerFn(actualizarObraComisiones);
  const fetchUsers = useServerFn(listCompanyUsers);
  const usersQ = useQuery({ queryKey: ["company-users"], queryFn: () => fetchUsers() });
  const teamIds = new Set(team.map((member) => member.user_id));
  const usuariosEquipo = (usersQ.data ?? []).filter((user) => teamIds.has(user.id));

  const [comisiones, setComisiones] = useState<ComisionDraft[]>(() =>
    initial.map((comision) => ({ ...comision, porcentaje: String(comision.porcentaje) })),
  );
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const updateRow = (idx: number, changes: Partial<ComisionDraft>) => {
    setComisiones((prev) => prev.map((row, i) => (i === idx ? { ...row, ...changes } : row)));
    setSaveMessage(null);
  };

  const m = useMutation({
    mutationFn: update,
    onSuccess: () => {
      setSaveMessage({ type: "success", text: "Comisiones guardadas" });
      qc.invalidateQueries({ queryKey: ["obra-configuracion", obraId] });
    },
    onError: (e: Error) => setSaveMessage({ type: "error", text: e.message }),
  });

  const handleSave = () => {
    const limpio = comisiones.filter((c) => !!c.user_id);
    if (limpio.length !== comisiones.length) {
      return setSaveMessage({ type: "error", text: "Selecciona una persona en cada fila." });
    }
    if (limpio.some((comision) => comision.porcentaje === "")) {
      return setSaveMessage({ type: "error", text: "Escribe un porcentaje en cada fila." });
    }
    const error = validarComisionesEquipo(team, limpio);
    if (error) {
      return setSaveMessage({ type: "error", text: error });
    }
    setSaveMessage(null);
    m.mutate({
      data: {
        obraId,
        comisiones: limpio.map((comision) => ({
          ...comision,
          porcentaje: Number(comision.porcentaje),
        })),
      },
    });
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Label>Comisiones</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSaveMessage(null);
            setComisiones([
              ...comisiones,
              { user_id: "", porcentaje: "0", base_calculo: "utilidad" },
            ]);
          }}
        >
          <Plus className="size-3.5 mr-1" /> Agregar
        </Button>
      </div>

      <div className="space-y-2">
        {comisiones.map((row, idx) => (
          <div key={idx} className="flex gap-2 items-center flex-wrap">
            <Select value={row.user_id} onValueChange={(v) => updateRow(idx, { user_id: v })}>
              <SelectTrigger
                aria-label={`Usuario de comisión ${idx + 1}`}
                className="flex-1 min-w-[160px]"
              >
                <SelectValue placeholder="Usuario" />
              </SelectTrigger>
              <SelectContent>
                {usuariosEquipo
                  .filter(
                    (u) =>
                      u.id === row.user_id ||
                      !comisiones.some((comision, i) => i !== idx && comision.user_id === u.id),
                  )
                  .map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nombre_completo || u.email}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Input
              aria-label={`Porcentaje de comisión ${idx + 1}`}
              type="number"
              min={0}
              max={100}
              step={0.01}
              className="w-24"
              value={row.porcentaje}
              onChange={(e) => updateRow(idx, { porcentaje: e.target.value })}
            />
            <span className="text-xs text-muted-foreground">%</span>
            <Select
              value={row.base_calculo}
              onValueChange={(v) =>
                updateRow(idx, { base_calculo: v as ComisionRow["base_calculo"] })
              }
            >
              <SelectTrigger aria-label={`Base de cálculo de comisión ${idx + 1}`} className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utilidad">Utilidad</SelectItem>
                <SelectItem value="monto_contratado">Monto contratado</SelectItem>
                <SelectItem value="monto_cobrado">Monto cobrado</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Quitar comisión"
              onClick={() => {
                setSaveMessage(null);
                setComisiones(comisiones.filter((_, i) => i !== idx));
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          aria-live={saveMessage?.type === "error" ? "assertive" : "polite"}
          className={
            saveMessage
              ? saveMessage.type === "success"
                ? "inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800"
                : "inline-flex items-center rounded-md bg-rose-100 px-3 py-2 text-sm font-medium text-rose-800"
              : "min-h-5"
          }
          role={saveMessage?.type === "error" ? "alert" : "status"}
        >
          {saveMessage?.type === "success" && (
            <Check className="mr-1.5 inline size-4" aria-hidden="true" />
          )}
          {saveMessage?.text}
        </div>
        <Button onClick={handleSave} disabled={m.isPending}>
          {m.isPending
            ? "Guardando…"
            : saveMessage?.type === "success"
              ? "Guardado"
              : "Guardar cambios"}
        </Button>
      </div>
    </Card>
  );
}

export default ConfiguracionObra;
