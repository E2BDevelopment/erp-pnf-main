"use client";

import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@/lib/server-fn/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, startOfDay } from "date-fns";
import {
  CalendarIcon,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Search,
  Save,
  PackagePlus,
  ShoppingCart,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { listInsumos, listCategorias, listUnidades } from "@/lib/api-client/insumos.functions";
import { SolicitarInsumoRapidoDialog } from "@/components/insumos/SolicitarInsumoRapidoDialog";

import { useEffectiveRoles, isDirector as checkDirector } from "@/stores/auth";
import {
  guardarBorradorRequisicion,
  enviarBorradorRequisicion,
  getBorradorRequisicion,
} from "@/lib/api-client/requisiciones.functions";

interface Props {
  obraId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  borradorId?: string | null;
}

interface Bloque {
  insumo_id: string;
  cantidad: string;
  fecha_requerida: Date | undefined;
  nota: string;
}

function emptyBloque(): Bloque {
  return { insumo_id: "", cantidad: "", fecha_requerida: undefined, nota: "" };
}

export function NuevaRequisicionSheet({ obraId, open, onOpenChange, borradorId }: Props) {
  const qc = useQueryClient();
  const fetchInsumos = useServerFn(listInsumos);
  const fetchCategorias = useServerFn(listCategorias);
  const guardarBorrador = useServerFn(guardarBorradorRequisicion);
  const enviarBorrador = useServerFn(enviarBorradorRequisicion);
  const fetchBorrador = useServerFn(getBorradorRequisicion);

  const insumosQ = useQuery({
    queryKey: ["insumos", "autorizado"],
    queryFn: () => fetchInsumos({ data: { estatus: "autorizado" } }),
    enabled: open,
  });
  const insumos = (insumosQ.data ?? []) as Array<{
    id: string;
    nombre: string;
    unidad: string;
    estatus?: string;
    categoria?: { id: string; nombre: string } | null;
  }>;

  const categoriasQ = useQuery({
    queryKey: ["insumo-categorias"],
    queryFn: () => fetchCategorias(),
    enabled: open,
  });
  const categorias = (categoriasQ.data ?? []) as Array<{ id: string; nombre: string }>;

  const fetchUnidades = useServerFn(listUnidades);
  const unidadesQ = useQuery({
    queryKey: ["insumo-unidades"],
    queryFn: () => fetchUnidades(),
    enabled: open,
  });
  const unidades = (unidadesQ.data ?? []) as Array<{ id: string; codigo: string; nombre?: string }>;

  const roles = useEffectiveRoles();
  const isDirector = checkDirector(roles);

  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [notas, setNotas] = useState("");
  const [openFechaIdx, setOpenFechaIdx] = useState<number | null>(null);
  const [currentBorradorId, setCurrentBorradorId] = useState<string | null>(borradorId ?? null);
  const [buscarInsumo, setBuscarInsumo] = useState("");
  const [categoriaId, setCategoriaId] = useState("all");
  const [solicitarForIdx, setSolicitarForIdx] = useState<number | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [pendingInsumos, setPendingInsumos] = useState<
    Array<{
      id: string;
      nombre: string;
      unidad: string;
      estatus: string;
      categoria: { id: string; nombre: string } | null;
    }>
  >([]);
  const [mobileStep, setMobileStep] = useState(0);
  const [attemptedDetails, setAttemptedDetails] = useState(false);
  const insumosDisponibles = [
    ...insumos,
    ...pendingInsumos.filter((p) => !insumos.some((i) => i.id === p.id)),
  ];

  const insumosFiltrados = useMemo(() => {
    const norm = (value: string) =>
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
    const term = norm(buscarInsumo.trim());
    return insumosDisponibles
      .filter(
        (ins) =>
          categoriaId === "all" ||
          (categoriaId === "none" ? !ins.categoria : ins.categoria?.id === categoriaId),
      )
      .filter(
        (ins) =>
          !term ||
          norm(`${ins.nombre} ${ins.unidad} ${ins.categoria?.nombre ?? ""}`).includes(term),
      )
      .sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base", numeric: true }),
      );
  }, [insumosDisponibles, buscarInsumo, categoriaId]);

  const bloquesPorCategoria = useMemo(() => {
    const groups = new Map<string, Array<{ bloque: Bloque; index: number; nombre: string }>>();
    bloques.forEach((bloque, index) => {
      const insumo = insumosDisponibles.find((item) => item.id === bloque.insumo_id);
      const categoria = insumo?.categoria?.nombre ?? "Sin categoría";
      const group = groups.get(categoria) ?? [];
      group.push({ bloque, index, nombre: insumo?.nombre ?? "Insumo" });
      groups.set(categoria, group);
    });
    return [...groups.entries()].sort(([a], [b]) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );
  }, [bloques, insumosDisponibles]);

  // Reset y carga del borrador cuando abre
  useEffect(() => {
    if (!open) return;
    setMobileStep(0);
    setAttemptedDetails(false);
    setCurrentBorradorId(borradorId ?? null);
    if (!borradorId) {
      setBloques([]);
      setNotas("");
      setPendingInsumos([]);
      return;
    }
    fetchBorrador({ data: { id: borradorId } })
      .then((r: any) => {
        setNotas(r.notas ?? "");
        const items = (r.items ?? []) as Array<any>;
        setPendingInsumos(
          items
            .filter((it) => it.insumo && it.insumo.estatus !== "autorizado")
            .map((it) => ({ ...it.insumo, categoria: it.insumo.categoria ?? null })),
        );
        if (items.length === 0) {
          setBloques([]);
        } else {
          setBloques(
            items.map((it) => ({
              insumo_id: it.insumo_id ?? "",
              cantidad: it.cantidad != null ? String(it.cantidad) : "",
              fecha_requerida: it.fecha_requerida ? parseISO(it.fecha_requerida) : undefined,
              nota: it.nota ?? "",
            })),
          );
        }
      })
      .catch((e: any) => toast.error(e?.message ?? "Error al cargar borrador"));
  }, [open, borradorId, fetchBorrador]);

  const resetForm = () => {
    setBloques([]);
    setNotas("");
    setCurrentBorradorId(null);
  };

  const invalidateLists = () => {
    qc.invalidateQueries({ queryKey: ["requisiciones", obraId] });
    qc.invalidateQueries({ queryKey: ["pendientes"] });
  };

  const mut = useMutation({
    mutationFn: async () => {
      if (bloques.length === 0) throw new Error("Agrega al menos un insumo a la requisición");
      const items = bloques.map((b) => ({
        insumo_id: b.insumo_id,
        cantidad: Number(b.cantidad),
        fecha_requerida: b.fecha_requerida ? format(b.fecha_requerida, "yyyy-MM-dd") : "",
        nota: b.nota?.trim() || null,
      }));
      for (const it of items) {
        if (!it.insumo_id) throw new Error("Selecciona un insumo en cada bloque");
        if (!(it.cantidad > 0)) throw new Error("Cantidad debe ser mayor a 0");
        if (!it.fecha_requerida) throw new Error("Fecha requerida obligatoria");
      }
      // Si no hay borrador, primero creamos uno y luego lo enviamos
      let bid = currentBorradorId;
      if (!bid) {
        const created = await guardarBorrador({
          data: {
            obraId,
            notas: notas.trim() || null,
            insumos: items.map((it) => ({
              insumo_id: it.insumo_id,
              cantidad: it.cantidad,
              fecha_requerida: it.fecha_requerida,
              nota: it.nota,
            })),
          },
        });
        bid = (created as any).id as string;
      }
      return enviarBorrador({
        data: { borradorId: bid, notas: notas.trim() || null, insumos: items },
      });
    },
    onSuccess: (res: any) => {
      toast.success(`Requisición ${res.folio} enviada`);
      invalidateLists();
      resetForm();
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Error al enviar"),
  });

  const guardar = useMutation({
    mutationFn: async () => {
      const items = bloques.map((b) => ({
        insumo_id: b.insumo_id || null,
        cantidad: b.cantidad !== "" ? Number(b.cantidad) : null,
        fecha_requerida: b.fecha_requerida ? format(b.fecha_requerida, "yyyy-MM-dd") : null,
        nota: b.nota?.trim() || null,
      }));
      const hasAny = items.some(
        (it) => it.insumo_id || (it.cantidad ?? 0) > 0 || it.fecha_requerida || it.nota,
      );
      if (!hasAny && !notas.trim()) {
        throw new Error("Agrega al menos un dato antes de guardar el borrador");
      }
      const res = await guardarBorrador({
        data: {
          borradorId: currentBorradorId ?? undefined,
          obraId,
          notas: notas.trim() || null,
          insumos: items,
        },
      });
      return res as { id: string };
    },
    onSuccess: (res) => {
      setCurrentBorradorId(res.id);
      toast.success("Borrador guardado");
      invalidateLists();
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Error al guardar borrador"),
  });

  const updateBloque = (i: number, patch: Partial<Bloque>) =>
    setBloques((arr) => arr.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  const removeBloque = (i: number) => setBloques((arr) => arr.filter((_, idx) => idx !== i));
  const agregarInsumo = (insumoId: string) => {
    if (bloques.some((item) => item.insumo_id === insumoId)) return;
    setBloques((arr) => [...arr, { ...emptyBloque(), insumo_id: insumoId }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-dvh max-h-dvh w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-[min(90dvh,900px)] sm:max-h-[min(90dvh,900px)] sm:w-full sm:max-w-6xl sm:rounded-lg">
        <DialogHeader className="border-b px-6 py-4 pr-12">
          <DialogTitle>
            {currentBorradorId ? "Editar borrador de requisición" : "Nueva requisición"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Agrega y organiza los materiales solicitados para esta obra.
          </p>
        </DialogHeader>

        <div className="border-b px-4 py-3 md:hidden">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold">
              {mobileStep === 0
                ? "Agregar insumos"
                : mobileStep === 1
                  ? "Completar cantidades"
                  : "Revisar requisición"}
            </span>
            <span className="text-muted-foreground">Paso {mobileStep + 1} de 3</span>
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            {[0, 1, 2].map((step) => (
              <div
                key={step}
                className={`h-1 flex-1 rounded-full ${step <= mobileStep ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] md:overflow-hidden">
          <section
            className={`${mobileStep === 0 ? "flex" : "hidden"} min-h-0 flex-col border-b md:flex md:min-h-0 md:border-b-0 md:border-r`}
            aria-label="Catálogo de insumos"
          >
            <div className="space-y-3 border-b bg-background p-4">
              <div className="flex items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoFocus
                    value={buscarInsumo}
                    onChange={(e) => setBuscarInsumo(e.target.value)}
                    placeholder="Buscar insumos…"
                    className="pl-9"
                  />
                </div>
                <Select value={categoriaId} onValueChange={setCategoriaId}>
                  <SelectTrigger className="h-11 w-[130px] shrink-0 md:h-9 md:w-[150px]">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="none">Sin categoría</SelectItem>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-start md:h-9"
                onClick={() => setSolicitarForIdx(-1)}
              >
                <PackagePlus className="mr-2 size-4" /> Solicitar insumo
              </Button>
            </div>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
              {insumosQ.isLoading && (
                <p className="p-4 text-sm text-muted-foreground">Cargando catálogo…</p>
              )}
              {!insumosQ.isLoading && insumosFiltrados.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">
                  No encontramos insumos con esa búsqueda.
                </p>
              )}
              {insumosFiltrados.map((insumo) => {
                const agregado = bloques.some((item) => item.insumo_id === insumo.id);
                return (
                  <div
                    key={insumo.id}
                    className="flex min-h-16 items-center gap-3 rounded-md border-b p-3 last:border-0 hover:bg-muted/40 md:min-h-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{insumo.nombre}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {insumo.categoria?.nombre ?? "Sin categoría"} · {insumo.unidad}
                        {insumo.estatus === "pendiente" && (
                          <span className="text-amber-700"> · (en espera de autorización)</span>
                        )}
                        {insumo.estatus === "rechazado" && (
                          <span className="text-destructive"> · (rechazado)</span>
                        )}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={agregado ? "secondary" : "outline"}
                      className="h-11 shrink-0 md:h-8"
                      disabled={agregado}
                      onClick={() => agregarInsumo(insumo.id)}
                    >
                      <Plus className="mr-1 size-4" /> {agregado ? "Agregado" : "Agregar"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>

          <section
            className={`${mobileStep === 1 ? "flex" : "hidden"} min-h-0 flex-col md:flex md:min-h-0`}
            aria-label="Carrito de insumos"
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <ShoppingCart className="size-4" /> Tu requisición
              </h2>
              <span className="text-xs text-muted-foreground">
                {bloques.length} {bloques.length === 1 ? "insumo" : "insumos"}
              </span>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {bloques.length === 0 && (
                <div className="flex min-h-40 flex-col items-center justify-center text-center text-sm text-muted-foreground">
                  <ShoppingCart className="mb-2 size-8 opacity-40" />
                  <p>Tu carrito está vacío</p>
                  <p className="text-xs">Agrega insumos desde el catálogo.</p>
                </div>
              )}
              {bloquesPorCategoria.map(([categoria, items]) => (
                <details key={categoria} open className="group/category">
                  <summary className="mb-1 flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-md px-2 text-xs font-semibold text-muted-foreground hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                    <ChevronRight className="size-4 shrink-0 group-open/category:rotate-90" />
                    {categoria} <span className="font-normal">({items.length})</span>
                  </summary>
                  <div className="divide-y rounded-md border">
                    {items.map(({ bloque: b, index: i, nombre }) => {
                      const expanded = expandedItemId === b.insumo_id;
                      const insumoSel = insumosDisponibles.find((x) => x.id === b.insumo_id);
                      const faltaCantidad = !(Number(b.cantidad) > 0);
                      const faltaFecha = !b.fecha_requerida;
                      const faltantes = [faltaCantidad && "cantidad", faltaFecha && "fecha"].filter(
                        Boolean,
                      );
                      return (
                        <div key={b.insumo_id}>
                          <div className="flex min-h-11 items-center gap-2 px-2">
                            <button
                              type="button"
                              className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left"
                              onClick={() => setExpandedItemId(expanded ? null : b.insumo_id)}
                              aria-expanded={expanded}
                            >
                              {expanded ? (
                                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                              )}
                              <span className="truncate text-sm font-medium">{nombre}</span>
                              {insumoSel?.estatus === "pendiente" && (
                                <span className="shrink-0 text-xs text-amber-700">
                                  (en espera de autorización)
                                </span>
                              )}
                              {insumoSel?.estatus === "rechazado" && (
                                <span className="shrink-0 text-xs text-destructive">
                                  (rechazado)
                                </span>
                              )}
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {b.cantidad
                                  ? `${b.cantidad} ${insumoSel?.unidad ?? ""}`
                                  : (insumoSel?.unidad ?? "Sin cantidad")}
                              </span>
                              {b.fecha_requerida && (
                                <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                                  · {format(b.fecha_requerida, "dd/MM/yyyy")}
                                </span>
                              )}
                            </button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => removeBloque(i)}
                              aria-label={`Quitar ${nombre} del carrito`}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                          {attemptedDetails && faltantes.length > 0 && !expanded && (
                            <p role="alert" className="px-3 pb-3 text-sm text-destructive">
                              Falta {faltantes.join(" y ")}.
                            </p>
                          )}
                          {expanded && (
                            <div className="grid grid-cols-1 gap-2 border-t bg-muted/20 p-3 sm:grid-cols-[1fr_1.4fr]">
                              <div className="space-y-0.5">
                                <Label htmlFor={`cantidad-${i}`} className="text-xs md:text-[11px]">
                                  Cantidad (obligatoria)
                                </Label>
                                <Input
                                  id={`cantidad-${i}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  aria-invalid={attemptedDetails && faltaCantidad}
                                  aria-describedby={
                                    attemptedDetails && faltaCantidad
                                      ? `cantidad-error-${i}`
                                      : undefined
                                  }
                                  className={`h-11 text-base md:h-8 md:text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${attemptedDetails && faltaCantidad ? "border-destructive" : ""}`}
                                  value={b.cantidad}
                                  onChange={(e) => updateBloque(i, { cantidad: e.target.value })}
                                />
                                {attemptedDetails && faltaCantidad && (
                                  <p
                                    id={`cantidad-error-${i}`}
                                    className="text-xs text-destructive"
                                  >
                                    Ingresa una cantidad mayor a cero.
                                  </p>
                                )}
                              </div>
                              <div className="space-y-0.5">
                                <Label className="text-xs md:text-[11px]">
                                  Fecha requerida (obligatoria)
                                </Label>
                                <Popover
                                  open={openFechaIdx === i}
                                  onOpenChange={(v) => setOpenFechaIdx(v ? i : null)}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "h-11 w-full justify-start px-2 text-left text-sm font-normal md:h-8 md:text-xs",
                                        !b.fecha_requerida && "text-muted-foreground",
                                        attemptedDetails && faltaFecha && "border-destructive",
                                      )}
                                      aria-invalid={attemptedDetails && faltaFecha}
                                      aria-describedby={
                                        attemptedDetails && faltaFecha
                                          ? `fecha-error-${i}`
                                          : undefined
                                      }
                                    >
                                      <CalendarIcon className="mr-1.5 size-3.5" />
                                      {b.fecha_requerida
                                        ? format(b.fecha_requerida, "dd/MM/yyyy")
                                        : "Selecciona"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={b.fecha_requerida}
                                      onSelect={(d) => {
                                        updateBloque(i, { fecha_requerida: d ?? undefined });
                                        setOpenFechaIdx(null);
                                      }}
                                      initialFocus
                                      startMonth={startOfDay(new Date())}
                                      disabled={{ before: startOfDay(new Date()) }}
                                      className="pointer-events-auto p-3"
                                    />
                                  </PopoverContent>
                                </Popover>
                                {attemptedDetails && faltaFecha && (
                                  <p id={`fecha-error-${i}`} className="text-xs text-destructive">
                                    Selecciona la fecha en que se necesita.
                                  </p>
                                )}
                              </div>
                              <div className="space-y-0.5 sm:col-span-2">
                                <Label className="text-[11px]">Nota (opcional)</Label>
                                <Textarea
                                  rows={1}
                                  className="min-h-8 resize-none text-xs"
                                  value={b.nota}
                                  onChange={(e) => updateBloque(i, { nota: e.target.value })}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>
            <div className="hidden space-y-1 border-t p-4 md:block">
              <Label>Notas generales</Label>
              <Textarea
                rows={2}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones para administración…"
              />
            </div>
          </section>

          <section
            className={`${mobileStep === 2 ? "flex" : "hidden"} min-h-0 flex-col overflow-y-auto p-4 md:hidden`}
            aria-label="Revisión de requisición"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Tu requisición</h2>
              <span className="text-sm text-muted-foreground">
                {bloques.length} {bloques.length === 1 ? "insumo" : "insumos"}
              </span>
            </div>
            {bloques.length === 0 ? (
              <p className="rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground">
                Agrega al menos un insumo para continuar.
              </p>
            ) : (
              <div className="divide-y rounded-md border">
                {bloques.map((bloque) => {
                  const insumo = insumosDisponibles.find((item) => item.id === bloque.insumo_id);
                  return (
                    <div
                      key={bloque.insumo_id}
                      className="flex items-start justify-between gap-3 p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{insumo?.nombre ?? "Insumo"}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {bloque.cantidad
                            ? `${bloque.cantidad} ${insumo?.unidad ?? ""}`
                            : "Cantidad pendiente"}
                          {bloque.fecha_requerida
                            ? ` · ${format(bloque.fecha_requerida, "dd/MM/yyyy")}`
                            : " · Fecha pendiente"}
                        </p>
                        {bloque.nota && (
                          <p className="mt-1 text-sm text-muted-foreground">{bloque.nota}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-11 min-w-11 shrink-0"
                        onClick={() => {
                          setMobileStep(1);
                          setExpandedItemId(bloque.insumo_id);
                        }}
                        aria-label={`Editar ${insumo?.nombre ?? "insumo"}`}
                      >
                        Editar
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-5 space-y-2">
              <Label htmlFor="mobile-notas">Notas generales</Label>
              <Textarea
                id="mobile-notas"
                rows={3}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones para administración…"
                className="text-base"
              />
            </div>
          </section>
        </div>

        <div className="hidden flex-col gap-2 border-t bg-background px-6 py-3 sm:flex-row sm:justify-end md:flex">
          {mut.error && (
            <p role="alert" className="mr-auto self-center text-sm text-destructive">
              {mut.error instanceof Error ? mut.error.message : "No se pudo enviar la requisición."}
            </p>
          )}
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            disabled={guardar.isPending || mut.isPending}
            onClick={() => guardar.mutate()}
          >
            <Save className="size-4 mr-1" />
            {guardar.isPending ? "Guardando…" : "Guardar borrador"}
          </Button>
          <Button
            className="w-full sm:w-auto"
            disabled={mut.isPending || guardar.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending ? "Enviando…" : "Enviar requisición"}
          </Button>
        </div>
        <div className="flex items-center gap-2 border-t bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
          {mobileStep > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="h-12 min-w-12 px-3"
              onClick={() => setMobileStep((step) => step - 1)}
              aria-label="Regresar"
            >
              <ArrowLeft className="size-4" />
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="h-12 flex-1"
            disabled={guardar.isPending || mut.isPending}
            onClick={() => guardar.mutate()}
          >
            <Save className="mr-1 size-4" />
            {guardar.isPending ? "Guardando…" : "Guardar borrador"}
          </Button>
          {mobileStep < 2 ? (
            <Button
              className="h-12 flex-1"
              disabled={mobileStep === 0 && bloques.length === 0}
              onClick={() => {
                if (mobileStep === 0 && bloques[0]) setExpandedItemId(bloques[0].insumo_id);
                if (mobileStep === 1) {
                  setAttemptedDetails(true);
                  const incompleto = bloques.find(
                    (bloque) => !(Number(bloque.cantidad) > 0) || !bloque.fecha_requerida,
                  );
                  if (incompleto) {
                    setExpandedItemId(incompleto.insumo_id);
                    return;
                  }
                }
                setMobileStep((step) => step + 1);
              }}
            >
              Continuar
            </Button>
          ) : (
            <Button
              className="h-12 flex-1"
              disabled={mut.isPending || guardar.isPending}
              onClick={() => mut.mutate()}
            >
              {mut.isPending ? "Enviando…" : "Enviar requisición"}
            </Button>
          )}
        </div>
      </DialogContent>
      <SolicitarInsumoRapidoDialog
        open={solicitarForIdx !== null}
        onOpenChange={(v) => {
          if (!v) setSolicitarForIdx(null);
        }}
        categorias={categorias}
        unidades={unidades}
        isDirector={isDirector}
        onCreated={(newId, pending) => {
          qc.invalidateQueries({ queryKey: ["insumos"] });
          if (newId && pending) {
            const categoria = pending.categoria
              ? { id: `pending-${newId}`, nombre: pending.categoria }
              : null;
            setPendingInsumos((items) => [
              ...items.filter((item) => item.id !== newId),
              {
                id: newId,
                nombre: pending.nombre,
                unidad: pending.unidad,
                categoria,
                estatus: "pendiente",
              },
            ]);
          }
          if (newId && solicitarForIdx === -1) {
            agregarInsumo(newId);
          } else if (newId && solicitarForIdx !== null) {
            updateBloque(solicitarForIdx, { insumo_id: newId });
          }
          setSolicitarForIdx(null);
        }}
      />
    </Dialog>
  );
}
