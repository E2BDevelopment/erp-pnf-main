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

  const insumosFiltrados = useMemo(() => {
    const norm = (value: string) =>
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
    const term = norm(buscarInsumo.trim());
    return insumos
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
  }, [insumos, buscarInsumo, categoriaId]);

  const bloquesPorCategoria = useMemo(() => {
    const groups = new Map<string, Array<{ bloque: Bloque; index: number; nombre: string }>>();
    bloques.forEach((bloque, index) => {
      const insumo = insumos.find((item) => item.id === bloque.insumo_id);
      const categoria = insumo?.categoria?.nombre ?? "Sin categoría";
      const group = groups.get(categoria) ?? [];
      group.push({ bloque, index, nombre: insumo?.nombre ?? "Insumo" });
      groups.set(categoria, group);
    });
    return [...groups.entries()].sort(([a], [b]) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );
  }, [bloques, insumos]);

  // Reset y carga del borrador cuando abre
  useEffect(() => {
    if (!open) return;
    setCurrentBorradorId(borradorId ?? null);
    if (!borradorId) {
      setBloques([]);
      setNotas("");
      return;
    }
    fetchBorrador({ data: { id: borradorId } })
      .then((r: any) => {
        setNotas(r.notas ?? "");
        const items = (r.items ?? []) as Array<any>;
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
      <DialogContent className="flex h-[min(90dvh,900px)] max-w-6xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4 pr-12">
          <DialogTitle>
            {currentBorradorId ? "Editar borrador de requisición" : "Nueva requisición"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Agrega y organiza los materiales solicitados para esta obra.
          </p>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] md:overflow-hidden">
          <section
            className="flex min-h-[320px] flex-col border-b md:min-h-0 md:border-b-0 md:border-r"
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
                  <SelectTrigger className="w-[150px] shrink-0">
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
                className="w-full justify-start"
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
                    className="flex items-center gap-3 rounded-md border-b p-3 last:border-0 hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{insumo.nombre}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {insumo.categoria?.nombre ?? "Sin categoría"} · {insumo.unidad}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={agregado ? "secondary" : "outline"}
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
            className="flex min-h-[320px] flex-col md:min-h-0"
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
                      const insumoSel = insumos.find((x) => x.id === b.insumo_id);
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
                          {expanded && (
                            <div className="grid grid-cols-1 gap-2 border-t bg-muted/20 p-3 sm:grid-cols-[1fr_1.4fr]">
                              <div className="space-y-0.5">
                                <Label className="text-[11px]">Cantidad</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="h-8 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  value={b.cantidad}
                                  onChange={(e) => updateBloque(i, { cantidad: e.target.value })}
                                />
                              </div>
                              <div className="space-y-0.5">
                                <Label className="text-[11px]">Fecha requerida</Label>
                                <Popover
                                  open={openFechaIdx === i}
                                  onOpenChange={(v) => setOpenFechaIdx(v ? i : null)}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "h-8 w-full justify-start px-2 text-left text-xs font-normal",
                                        !b.fecha_requerida && "text-muted-foreground",
                                      )}
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
            <div className="space-y-1 border-t p-4">
              <Label>Notas generales</Label>
              <Textarea
                rows={2}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones para administración…"
              />
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-2 border-t bg-background px-6 py-3 sm:flex-row sm:justify-end">
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
      </DialogContent>
      <SolicitarInsumoRapidoDialog
        open={solicitarForIdx !== null}
        onOpenChange={(v) => {
          if (!v) setSolicitarForIdx(null);
        }}
        categorias={categorias}
        unidades={unidades}
        isDirector={isDirector}
        onCreated={(newId) => {
          qc.invalidateQueries({ queryKey: ["insumos"] });
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
