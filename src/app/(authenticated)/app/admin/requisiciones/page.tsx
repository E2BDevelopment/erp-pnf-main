"use client";

import { useMemo, useState } from "react";
import { useServerFn } from "@/lib/server-fn/client";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  listRequisicionesAsignadas,
  getRequisicion,
} from "@/lib/api-client/requisiciones.functions";
import { CotizacionSheet, type CotizacionTab } from "@/components/requisiciones/CotizacionSheet";
import { ESTATUS_META, type RequisicionEstatus } from "@/components/requisiciones/constants";
import { formatDate } from "@/lib/format";

import { useEffectiveRoles, useEffectiveIsDirector } from "@/stores/auth";

function AdminRequisicionesPage() {
  const roles = useEffectiveRoles();
  const director = useEffectiveIsDirector();
  const allowed = director || roles.includes("administrativo");

  const [tab, setTab] = useState<"activas" | "historial">("activas");
  const [obraFilter, setObraFilter] = useState<string>("todas");
  const [residenteFilter, setResidenteFilter] = useState("todos");
  const [solicitanteFilter, setSolicitanteFilter] = useState("todos");
  const abrirVisor = (id: string) => setCotizacion({ id, tab: "requisicion", readOnly: true });
  const [cotizacion, setCotizacion] = useState<{
    id: string;
    tab: CotizacionTab;
    readOnly?: boolean;
  } | null>(null);

  const fetchList = useServerFn(listRequisicionesAsignadas);
  const fetchOne = useServerFn(getRequisicion);
  const activasQ = useQuery({
    queryKey: ["requisiciones", "asignadas", "activas"],
    queryFn: () => fetchList({ data: { soloActivas: true } }),
    enabled: allowed,
  });
  const historialQ = useQuery({
    queryKey: ["requisiciones", "asignadas", "historial"],
    queryFn: () => fetchList({ data: { soloActivas: false } }),
    enabled: allowed && tab === "historial",
  });

  const rows = tab === "activas" ? (activasQ.data ?? []) : (historialQ.data ?? []);
  const loading = tab === "activas" ? activasQ.isLoading : historialQ.isLoading;

  const obras = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of rows as any[]) {
      if (r.obra?.id) seen.set(r.obra.id, r.obra.nombre);
    }
    return Array.from(seen.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [rows]);

  const residentes = useMemo(
    () => Array.from(new Set((rows as any[]).map((r) => r.residente).filter(Boolean))).sort(),
    [rows],
  );
  const solicitantes = useMemo(
    () => Array.from(new Set((rows as any[]).map((r) => r.solicitante).filter(Boolean))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    return [...(rows as any[])]
      .filter((r) => obraFilter === "todas" || r.obra?.id === obraFilter)
      .filter((r) => residenteFilter === "todos" || r.residente === residenteFilter)
      .filter((r) => solicitanteFilter === "todos" || r.solicitante === solicitanteFilter)
      .sort((a, b) => {
        const fechaA = a.fecha_requerida ? new Date(a.fecha_requerida).getTime() : Infinity;
        const fechaB = b.fecha_requerida ? new Date(b.fecha_requerida).getTime() : Infinity;
        return fechaA - fechaB;
      });
  }, [rows, obraFilter, residenteFilter, solicitanteFilter]);

  if (!allowed) {
    return (
      <p className="text-sm text-destructive">
        No tienes permisos para ver requisiciones administrativas con la vista actual.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Requisiciones</h1>
        <p className="text-sm text-muted-foreground">De tus obras asignadas</p>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "activas" | "historial")}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <TabsList className="grid grid-cols-2 w-full sm:w-auto">
            <TabsTrigger value="activas">Activas</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:w-[min(100%,720px)]">
            <Select value={obraFilter} onValueChange={setObraFilter}>
              <SelectTrigger aria-label="Filtrar por obra">
                <SelectValue placeholder="Obra" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las obras</SelectItem>
                {obras.map((o) => <SelectItem key={o.id} value={o.id}>{o.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={residenteFilter} onValueChange={setResidenteFilter}>
              <SelectTrigger aria-label="Filtrar por residente">
                <SelectValue placeholder="Residente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los residentes</SelectItem>
                {residentes.map((nombre) => <SelectItem key={nombre} value={nombre}>{nombre}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={solicitanteFilter} onValueChange={setSolicitanteFilter}>
              <SelectTrigger aria-label="Filtrar por solicitante">
                <SelectValue placeholder="Solicitante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los solicitantes</SelectItem>
                {solicitantes.map((nombre) => <SelectItem key={nombre} value={nombre}>{nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="activas" className="mt-4">
          <RequisicionesTable
            rows={filtered}
            loading={loading}
            emptyText="Sin requisiciones activas en tus obras."
            onRowClick={abrirVisor}
            onAction={(r, t) => setCotizacion({ id: r.id, tab: t })}
            fetchDetalle={fetchOne}
          />
        </TabsContent>

        <TabsContent value="historial" className="mt-4">
          <RequisicionesTable
            rows={filtered}
            loading={loading}
            emptyText="Sin historial de requisiciones."
            onRowClick={abrirVisor}
            onAction={(r, t) => setCotizacion({ id: r.id, tab: t })}
            fetchDetalle={fetchOne}
          />
        </TabsContent>
      </Tabs>

      {cotizacion && (
        <CotizacionSheet
          requisicionId={cotizacion.id}
          initialTab={cotizacion.tab}
          readOnly={cotizacion.readOnly}
          open={!!cotizacion}
          onOpenChange={(o) => !o && setCotizacion(null)}
        />
      )}
    </div>
  );
}

function FechaProximaCell({ rowId, fetchDetalle }: { rowId: string; fetchDetalle: any }) {
  const q = useQuery({
    queryKey: ["requisicion-fechas", rowId],
    queryFn: () => fetchDetalle({ data: { id: rowId } }),
    staleTime: 60_000,
  });
  const items = (q.data as any)?.items ?? [];
  const fechas = items
    .map((it: any) => it.fecha_requerida)
    .filter(Boolean)
    .map((d: string) => new Date(d).getTime());
  if (fechas.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
  const min = Math.min(...fechas);
  const diff = Math.ceil((min - Date.now()) / (1000 * 60 * 60 * 24));
  const urgent = diff <= 3;
  const d = new Date(min);
  const short = d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" }).replace(".", "");
  return (
    <div className="flex flex-col gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`text-sm tabular-nums whitespace-nowrap ${urgent ? "font-semibold text-rose-700 dark:text-rose-400" : "text-foreground"}`}>
            {short}
          </span>
        </TooltipTrigger>
        <TooltipContent>{formatDate(d.toISOString())}</TooltipContent>
      </Tooltip>
      {urgent && (
        <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 leading-none">
          {diff === 0 ? "Hoy" : diff < 0 ? "Vencida" : `${diff}d`}
        </span>
      )}
    </div>
  );
}

function AccionCell({ row, onAction }: { row: any; onAction: (r: any, t: CotizacionTab) => void }) {
  const estatus = row.estatus as RequisicionEstatus;
  if (estatus === "enviada") {
    return (
      <Button size="sm" className="h-6 px-2 text-xs" onClick={() => onAction(row, "requisicion")}>
        Cotizar
      </Button>
    );
  }
  if (estatus === "en_cotizacion") {
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-6 px-2 text-xs"
        onClick={() => onAction(row, "requisicion")}
      >
        Continuar
      </Button>
    );
  }
  if (["pendiente_autorizacion", "oc_generada", "completada"].includes(estatus)) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-6 px-2 text-xs"
        onClick={() => onAction(row, "ocs")}
      >
        Ver OCs
      </Button>
    );
  }
  return null;
}

function RequisicionesTable({
  rows,
  loading,
  emptyText,
  onRowClick,
  onAction,
  fetchDetalle,
}: {
  rows: any[];
  loading: boolean;
  emptyText: string;
  onRowClick: (id: string) => void;
  onAction: (r: any, t: CotizacionTab) => void;
  fetchDetalle: any;
}) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }
  if (rows.length === 0) {
    return (
      <Card className="p-10 text-center border-dashed">
        <FileText className="size-8 mx-auto text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">{emptyText}</p>
      </Card>
    );
  }
  return (
    <TooltipProvider delayDuration={150}>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[600px]">
            <TableHeader>
              <TableRow className="bg-muted/40 border-b border-border hover:bg-muted/40">
                <TableHead className="py-2.5 pl-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[90px]">
                  Folio
                </TableHead>
                <TableHead className="py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Obra
                </TableHead>
                <TableHead className="py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[160px]">
                  Solicitante
                </TableHead>
                <TableHead className="hidden xl:table-cell py-2.5 text-xs font-semibold uppercase tracking-wider text-center text-muted-foreground w-[50px]">
                  Ins.
                </TableHead>
                <TableHead className="py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[88px]">
                  Fecha req.
                </TableHead>
                <TableHead className="py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[160px]">
                  Estatus
                </TableHead>
                <TableHead className="py-2.5 pr-4 text-xs font-semibold uppercase tracking-wider text-right text-muted-foreground w-[100px]">
                  Acción
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const meta = ESTATUS_META[r.estatus as RequisicionEstatus];
                return (
                  <TableRow
                    key={r.id}
                    className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={() => onRowClick(r.id)}
                  >
                    {/* Folio */}
                    <TableCell className="py-3 pl-4 align-middle">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="font-mono text-xs font-semibold tracking-wide text-foreground whitespace-nowrap">
                            {r.folio}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{r.folio}</TooltipContent>
                      </Tooltip>
                    </TableCell>

                    {/* Obra */}
                    <TableCell className="py-3 align-middle min-w-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block text-sm font-medium text-foreground truncate max-w-[280px]">
                            {r.obra?.nombre ?? "—"}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{r.obra?.nombre ?? "—"}</TooltipContent>
                      </Tooltip>
                    </TableCell>

                    {/* Solicitante */}
                    <TableCell className="py-3 align-middle min-w-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block text-sm text-muted-foreground truncate">
                            {r.solicitante ?? "—"}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{r.solicitante ?? "—"}</TooltipContent>
                      </Tooltip>
                    </TableCell>

                    {/* Ins. */}
                    <TableCell className="hidden xl:table-cell py-3 text-center align-middle">
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {r.insumos_count}
                      </span>
                    </TableCell>

                    {/* Fecha */}
                    <TableCell className="py-3 align-middle">
                      <FechaProximaCell rowId={r.id} fetchDetalle={fetchDetalle} />
                    </TableCell>

                    {/* Estatus */}
                    <TableCell className="py-3 align-middle">
                      <Badge
                        className={`${meta?.badge ?? ""} border-0 text-xs px-2 py-0.5 font-medium whitespace-nowrap`}
                        variant="secondary"
                      >
                        {meta?.label ?? r.estatus}
                      </Badge>
                    </TableCell>

                    {/* Acción */}
                    <TableCell className="py-3 pr-4 text-right align-middle">
                      <div
                        className="flex justify-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AccionCell row={r} onAction={onAction} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </TooltipProvider>
  );
}

export default AdminRequisicionesPage;

