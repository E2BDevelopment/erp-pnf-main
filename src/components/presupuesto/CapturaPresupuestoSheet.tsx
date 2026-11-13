"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useServerFn } from "@/lib/server-fn/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getPresupuesto,
  guardarRenglones,
  solicitarAutorizacionPresupuesto,
  parsearExcelPresupuesto,
  parsearPdfPresupuesto,
  descargarPlantillaPresupuesto,
} from "@/lib/api-client/presupuestos.functions";
import { usePermisos } from "@/hooks/usePermisos";
import {
  procesarRenglones,
  calcularClavesPadre,
  claseFilaPresupuesto,
  esGrupoPresupuesto,
  normalizarEntradaDecimal,
  nivelDeClave,
  type RenglonInput,
} from "@/lib/presupuesto-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Upload, Download, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { formatMXN } from "@/lib/format";
import { useSacudir } from "@/components/anim/useSacudir";
import { useConfirm } from "@/hooks/useConfirm";

type RowDraft = RenglonInput & { _id: string };

let _id = 0;
const nextId = () => `r${++_id}`;
const emptyRow = (): RowDraft => ({
  _id: nextId(),
  clave: "",
  concepto: "",
  unidad: "",
  cantidad: null,
  precio_unitario: null,
});

export function CapturaPresupuestoSheet({
  presupuestoId,
  onClose,
  onSaved,
}: {
  presupuestoId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const confirm = useConfirm();
  const fetchOne = useServerFn(getPresupuesto);
  const { data, isLoading } = useQuery({
    queryKey: ["presupuesto", presupuestoId],
    queryFn: () => fetchOne({ data: { id: presupuestoId } }),
  });

  const [rows, setRows] = useState<RowDraft[]>([emptyRow()]);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [cantidadDrafts, setCantidadDrafts] = useState<Record<string, string>>({});
  const [precioDrafts, setPrecioDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data?.renglones && data.renglones.length > 0) {
      setRows(
        data.renglones.map((r: any) => ({
          _id: nextId(),
          clave: r.clave,
          concepto: r.concepto,
          unidad: r.unidad ?? "",
          cantidad: r.cantidad,
          precio_unitario: r.precio_unitario,
        })),
      );
      setActiveRowId(null);
    }
  }, [data]);

  const updateRow = (id: string, patch: Partial<RowDraft>) => {
    setRows((rs) => rs.map((r) => (r._id === id ? { ...r, ...patch } : r)));
  };
  const removeRow = (id: string) => {
    let nextActive: string | null = activeRowId;
    setRows((rs) => {
      if (activeRowId === id) {
        const idx = rs.findIndex((r) => r._id === id);
        nextActive = rs[idx - 1]?._id ?? rs[idx + 1]?._id ?? null;
      }
      return rs.filter((r) => r._id !== id);
    });
    setActiveRowId(nextActive);
  };
  const addRow = () => {
    const newRow = emptyRow();
    setRows((rs) => {
      if (!activeRowId) return [...rs, newRow];
      const idx = rs.findIndex((r) => r._id === activeRowId);
      if (idx === -1) return [...rs, newRow];
      const next = [...rs];
      next.splice(idx + 1, 0, newRow);
      return next;
    });
    setActiveRowId(newRow._id);
  };
  const handleRowActivate = (id: string) => () => setActiveRowId(id);

  // Cálculo en vivo
  const calc = useMemo(() => {
    const input: RenglonInput[] = rows
      .filter((r) => r.clave.trim() || r.concepto.trim())
      .map((r) => ({
        clave: r.clave.trim(),
        concepto: r.concepto.trim(),
        unidad: r.unidad?.toString().trim() || null,
        cantidad: r.cantidad,
        precio_unitario: r.precio_unitario,
      }));
    return procesarRenglones(input);
  }, [rows]);

  // Map errores por clave para mostrar inline
  const erroresPorClave = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const e of calc.errores) {
      const existing = map.get(e.clave) ?? [];
      map.set(e.clave, [...existing, ...e.errores]);
    }
    return map;
  }, [calc.errores]);

  const irAlPrimerError = () => {
    const renglon = rows.find((r) => erroresPorClave.has(r.clave.trim()));
    if (!renglon) return;

    setActiveRowId(renglon._id);
    const elemento = document.getElementById(`renglon-${renglon._id}`);
    elemento?.scrollIntoView({ behavior: "smooth", block: "center" });
    const campoConcepto = (erroresPorClave.get(renglon.clave.trim()) ?? []).some((error) =>
      error.toLowerCase().includes("concepto"),
    );
    elemento?.querySelectorAll<HTMLInputElement>("input")[campoConcepto ? 1 : 0]?.focus({
      preventScroll: true,
    });
  };

  // Importes por clave (cuando no hay errores)
  const importePorClave = useMemo(() => {
    const m = new Map<string, number>();
    if (calc.errores.length === 0) {
      for (const r of calc.renglones) m.set(r.clave, r.importe);
    }
    return m;
  }, [calc]);

  // Claves padre (partidas que tienen al menos un hijo)
  const clavesPadre = useMemo(() => calcularClavesPadre(rows.map((r) => r.clave)), [rows]);

  const guardar = useServerFn(guardarRenglones);
  const guardarM = useMutation({
    mutationFn: guardar,
    onSuccess: () => {
      toast.success("Renglones guardados");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const solicitar = useServerFn(solicitarAutorizacionPresupuesto);
  const solicitarM = useMutation({
    mutationFn: solicitar,
    onSuccess: () => {
      toast.success("Presupuesto enviado a autorización");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // El toast dice qué falló; la sacudida dice dónde. Solo en validación local.
  const sacudirRef = useRef<HTMLDivElement>(null);
  const sacudir = useSacudir(sacudirRef);

  const handleGuardar = (enviarDespues: boolean) => {
    if (calc.errores.length > 0) {
      sacudir();
      toast.error("Corrige los errores antes de guardar");
      return;
    }
    const payload = rows
      .filter((r) => r.clave.trim())
      .map((r) => ({
        clave: r.clave.trim(),
        concepto: r.concepto.trim(),
        unidad: r.unidad?.toString().trim() || null,
        cantidad: r.cantidad,
        precio_unitario: r.precio_unitario,
      }));
    guardarM.mutate(
      { data: { presupuestoId, renglones: payload } },
      {
        onSuccess: () => {
          if (enviarDespues) {
            solicitarM.mutate({ data: { id: presupuestoId } });
          }
        },
      },
    );
  };

  // Importar Excel
  const descargarPlantilla = useServerFn(descargarPlantillaPresupuesto);
  const parsear = useServerFn(parsearExcelPresupuesto);
  const parsearPdf = useServerFn(parsearPdfPresupuesto);
  const [parsing, setParsing] = useState(false);
  const [parsingPdf, setParsingPdf] = useState(false);
  const importing = parsing || parsingPdf;

  const handleDescargarPlantilla = async () => {
    try {
      const res = await descargarPlantilla();
      const blob = b64ToBlob(
        res.fileBase64,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "plantilla-presupuesto.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const hasContenido = () =>
    rows.some(
      (r) =>
        r.clave.trim() ||
        r.concepto.trim() ||
        (r.unidad ?? "").toString().trim() ||
        r.cantidad != null ||
        r.precio_unitario != null,
    );

  const aplicarRenglonesImportados = (
    renglones: Array<{
      clave: string;
      concepto: string;
      unidad?: string | null;
      cantidad?: number | null;
      precio_unitario?: number | null;
    }>,
  ) => {
    setRows(
      renglones.map((r) => ({
        _id: nextId(),
        clave: r.clave,
        concepto: r.concepto,
        unidad: r.unidad ?? "",
        cantidad: r.cantidad ?? null,
        precio_unitario: r.precio_unitario ?? null,
      })),
    );
  };

  const handleImportarExcel = async (file: File) => {
    if (hasContenido()) {
      const confirmed = await confirm({
        title: "¿Reemplazar los renglones actuales?",
        description: "Se reemplazarán los renglones actuales con los del archivo seleccionado.",
        confirmLabel: "Reemplazar",
      });
      if (!confirmed) return;
    }
    setParsing(true);
    try {
      const b64 = await fileToBase64(file);
      const res = await parsear({ data: { fileBase64: b64 } });
      if (!res.renglones.length) {
        toast.error("No se encontraron renglones en el archivo");
        return;
      }
      aplicarRenglonesImportados(res.renglones);
      toast.success(`${res.renglones.length} renglones importados. Revísalos antes de guardar.`);
      if (res.subtitulosAgregados > 0) {
        const cantidad = res.subtitulosAgregados;
        toast.info(
          `Se agreg${cantidad === 1 ? "ó" : "aron"} ${cantidad} subtítulo${cantidad === 1 ? "" : "s"} faltante${cantidad === 1 ? "" : "s"} automáticamente.`,
        );
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setParsing(false);
    }
  };

  const handleImportarPdf = async (file: File) => {
    if (hasContenido()) {
      const confirmed = await confirm({
        title: "¿Reemplazar los renglones actuales?",
        description: "Se reemplazarán los renglones actuales con los del PDF seleccionado.",
        confirmLabel: "Reemplazar",
      });
      if (!confirmed) return;
    }
    setParsingPdf(true);
    try {
      const b64 = await fileToBase64(file);
      const res = await parsearPdf({
        data: { fileBase64: b64, mimeType: file.type || "application/pdf", filename: file.name },
      });
      if (!res.renglones.length) {
        toast.error("No se detectaron partidas en el PDF");
        return;
      }
      aplicarRenglonesImportados(res.renglones);
      toast.success(
        `${res.renglones.length} partidas extraídas. Revísalas y edita antes de guardar.`,
      );
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setParsingPdf(false);
    }
  };

  const presupuesto = data?.presupuesto;
  const esOC = presupuesto?.tipo === "adenda";
  const enBorrador = presupuesto?.estatus === "borrador";
  const { can } = usePermisos();
  const puedeEditar = enBorrador && can(esOC ? "presupuestos.crear_oc" : "presupuestos.crear_base");
  const puedeEnviar = enBorrador && can(esOC ? "presupuestos.crear_oc" : "presupuestos.crear_base");
  const yaAutorizado = presupuesto?.estatus === "autorizado";

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o && !importing) onClose();
      }}
    >
      <DialogContent
        ref={sacudirRef}
        className="w-[calc(100%-2rem)] max-w-[90vw] h-[85vh] max-h-[calc(100dvh-2rem)] flex flex-col gap-0 overflow-hidden p-0 sm:p-0"
        onPointerDownOutside={(e) => {
          if (importing) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (importing) e.preventDefault();
        }}
      >
        {importing && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-auto">
            <Loader2 className="size-10 animate-spin text-primary-ink" />
            <p className="mt-4 text-sm text-muted-foreground">
              {parsingPdf
                ? "Analizando PDF, por favor no cierres esta ventana..."
                : "Importando archivo, por favor espera..."}
            </p>
          </div>
        )}
        <DialogHeader className="min-h-14 shrink-0 flex-row items-center space-y-0 px-6 pr-14">
          <DialogTitle>
            {presupuesto?.nombre ?? "Editar presupuesto"}
            {yaAutorizado && <Badge className="ml-2">Autorizado</Badge>}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground mt-6 px-6">Cargando…</p>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap shrink-0 px-6 pb-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDescargarPlantilla}
                disabled={importing}
              >
                <Download className="size-4 mr-1" /> Plantilla
              </Button>
              <label className="inline-flex">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  disabled={importing}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImportarExcel(f);
                    e.target.value = "";
                  }}
                />
                <Button size="sm" variant="outline" asChild disabled={importing}>
                  <span>
                    <Upload className="size-4 mr-1" />
                    {parsing ? "Importando…" : "Importar Excel"}
                  </span>
                </Button>
              </label>
              <label className="inline-flex">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  disabled={importing}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImportarPdf(f);
                    e.target.value = "";
                  }}
                />
                <Button size="sm" variant="outline" asChild disabled={importing}>
                  <span>
                    <Upload className="size-4 mr-1" />
                    {parsingPdf ? "Analizando PDF…" : "Importar PDF"}
                  </span>
                </Button>
              </label>
              <Button size="sm" variant="ghost" onClick={addRow} disabled={importing}>
                <Plus className="size-4 mr-1" /> Agregar renglón
              </Button>

              <div className="ml-auto flex items-center gap-4">
                {calc.errores.length > 0 ? (
                  <button
                    type="button"
                    className={`${badgeVariants({ variant: "destructive" })} gap-1 cursor-pointer`}
                    onClick={irAlPrimerError}
                    aria-label={`${calc.errores.length} errores; ir al primero`}
                  >
                    <AlertCircle className="size-3" />
                    {calc.errores.length} error(es)
                  </button>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="text-right text-xs">
                      <p className="text-muted-foreground">Subtotal</p>
                      <p className="font-medium tabular-nums">{formatMXN(calc.montoTotal)}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="text-muted-foreground">IVA (16%)</p>
                      <p className="font-medium tabular-nums">{formatMXN(calc.montoTotal * 0.16)}</p>
                    </div>
                    <div className="border-l pl-4 text-right text-xs">
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold tabular-nums">
                        {formatMXN(calc.montoTotal * 1.16)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabla editable */}
            <div className="flex-1 min-h-0 overflow-auto px-6">
              <Card className="overflow-visible">
                <table className="w-full min-w-[960px] text-sm">
                  <thead className="sticky top-0 z-20 bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="sticky top-0 z-20 text-center p-2 w-24 bg-muted">Clave</th>
                      <th className="sticky top-0 z-20 text-center p-2 bg-muted">Concepto</th>
                      <th className="sticky top-0 z-20 text-center p-2 w-20 bg-muted">Unidad</th>
                      <th className="sticky top-0 z-20 text-center p-2 w-15 bg-muted">Cantidad</th>
                      <th className="sticky top-0 z-20 text-center p-2 w-32 bg-muted">PU</th>
                      <th className="sticky top-0 z-20 text-center p-2 w-28 bg-muted">Importe</th>
                      <th className="sticky top-0 z-20 text-center w-10 bg-muted"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const claveTrim = r.clave.trim();
                      const errs = erroresPorClave.get(claveTrim) ?? [];
                      const importe = importePorClave.get(claveTrim) ?? 0;
                      const claveValida = /^\d+(\.\d+){0,4}$/.test(claveTrim);
                      const nivel = claveValida ? nivelDeClave(claveTrim) : 3;
                      const esPadre = claveValida && esGrupoPresupuesto(r, clavesPadre.has(claveTrim));
                      const esActivo = activeRowId === r._id;
                      return (
                        <tr
                          key={r._id}
                          id={`renglon-${r._id}`}
                          onFocus={handleRowActivate(r._id)}
                          onMouseDown={handleRowActivate(r._id)}
                          className={`border-t border-border cursor-pointer transition-colors ${
                            errs.length ? "bg-destructive/5" : claseFilaPresupuesto(nivel, esPadre)
                          } ${esActivo ? "ring-1 ring-inset ring-primary/20" : "hover:brightness-[0.99]"}`}
                        >
                          <td className="p-1">
                            <Input
                              value={r.clave}
                              onChange={(e) => updateRow(r._id, { clave: e.target.value })}
                              placeholder="1.1"
                              className="h-8"
                              disabled={importing}
                            />
                          </td>
                          <td className="p-1">
                            <Input
                              value={r.concepto}
                              onChange={(e) => updateRow(r._id, { concepto: e.target.value })}
                              placeholder="Concepto"
                              className="h-8"
                              disabled={importing}
                            />
                            {errs.length > 0 && (
                              <p className="text-xs text-destructive mt-1">{errs.join(" · ")}</p>
                            )}
                          </td>
                          {esPadre ? (
                            <>
                              <td className="w-20 p-2 text-center text-muted-foreground">—</td>
                              <td className="w-32 p-2 text-center text-muted-foreground">—</td>
                              <td className="p-2 text-center text-muted-foreground">—</td>
                            </>
                          ) : (
                            <>
                              <td className="p-1">
                                <Input
                                  value={r.unidad ?? ""}
                                  onChange={(e) => updateRow(r._id, { unidad: e.target.value })}
                                  placeholder="m2"
                                  className="h-8"
                                  disabled={importing}
                                />
                              </td>
                              <td className="w-20 p-1">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={cantidadDrafts[r._id] ?? (r.cantidad != null ? r.cantidad.toFixed(2) : "")}
                                  onFocus={(e) => {
                                    const value = e.currentTarget.value;
                                    setCantidadDrafts((drafts) => ({ ...drafts, [r._id]: value }));
                                  }}
                                  onChange={(e) => {
                                    const normalized = normalizarEntradaDecimal(e.target.value);
                                    const cantidad = normalized === "" ? null : Number(normalized);
                                    setCantidadDrafts((drafts) => ({ ...drafts, [r._id]: normalized }));
                                    updateRow(r._id, {
                                      cantidad: cantidad == null || Number.isFinite(cantidad) ? cantidad : null,
                                    });
                                  }}
                                  onBlur={() =>
                                    setCantidadDrafts((drafts) => {
                                      const { [r._id]: _draft, ...rest } = drafts;
                                      return rest;
                                    })
                                  }
                                  className="h-8 text-right"
                                  disabled={importing}
                                />
                              </td>
                              <td className="w-32 p-1">
                                <div className="relative">
                                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    $
                                  </span>
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={precioDrafts[r._id] ?? (r.precio_unitario != null ? r.precio_unitario.toFixed(2) : "")}
                                    onFocus={(e) => {
                                      const value = e.currentTarget.value;
                                      setPrecioDrafts((drafts) => ({ ...drafts, [r._id]: value }));
                                    }}
                                    onChange={(e) => {
                                      const normalized = normalizarEntradaDecimal(e.target.value);
                                      const precio = normalized === "" ? null : Number(normalized);
                                      setPrecioDrafts((drafts) => ({ ...drafts, [r._id]: normalized }));
                                      updateRow(r._id, {
                                        precio_unitario:
                                          precio == null || Number.isFinite(precio) ? precio : null,
                                      });
                                    }}
                                    onBlur={() =>
                                      setPrecioDrafts((drafts) => {
                                        const { [r._id]: _draft, ...rest } = drafts;
                                        return rest;
                                      })
                                    }
                                    className="h-8 pl-6"
                                    disabled={importing}
                                  />
                                </div>
                              </td>
                            </>
                          )}
                          <td className="p-2 text-right tabular-nums">{formatMXN(importe)}</td>
                          <td className="p-1 text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              aria-label="Quitar renglón"
                              onClick={() => removeRow(r._id)}
                              disabled={importing}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </div>

            <div className="flex items-center justify-end gap-2 shrink-0 border-t bg-background px-6 py-3">
              <Button variant="outline" onClick={onClose} disabled={importing}>
                Cerrar
              </Button>
              {puedeEditar && (
                <Button
                  variant="outline"
                  disabled={importing || guardarM.isPending || calc.errores.length > 0}
                  onClick={() => handleGuardar(false)}
                >
                  {guardarM.isPending && !solicitarM.isPending ? "Guardando…" : "Guardar borrador"}
                </Button>
              )}
              {puedeEditar && puedeEnviar && (
                <Button
                  disabled={
                    importing ||
                    guardarM.isPending ||
                    solicitarM.isPending ||
                    calc.errores.length > 0 ||
                    calc.renglones.length === 0
                  }
                  onClick={() => handleGuardar(true)}
                >
                  {solicitarM.isPending ? "Enviando…" : "Enviar a autorización"}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const idx = res.indexOf(",");
      resolve(idx >= 0 ? res.slice(idx + 1) : res);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function b64ToBlob(b64: string, mime: string): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
