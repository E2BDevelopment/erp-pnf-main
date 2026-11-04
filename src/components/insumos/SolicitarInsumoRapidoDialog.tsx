"use client";

import { useEffect, useState } from "react";
import { useServerFn } from "@/lib/server-fn/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { solicitarInsumo } from "@/lib/api-client/insumos.functions";

export function SolicitarInsumoRapidoDialog({
  open,
  onOpenChange,
  categorias,
  unidades,
  isDirector,
  onCreated,
  disponibleRenta,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  categorias: Array<{ id: string; nombre: string; estatus?: string }>;
  unidades: Array<{ id: string; codigo: string; nombre?: string; estatus?: string }>;
  isDirector: boolean;
  onCreated: (newId?: string, pending?: { nombre: string; unidad: string; categoria: string | null }) => void;
  disponibleRenta?: boolean;
}) {
  const solicitar = useServerFn(solicitarInsumo);
  const [nombre, setNombre] = useState("");
  const [unidad, setUnidad] = useState<string>("");
  const [categoriaId, setCategoriaId] = useState<string>("none");
  const [unidadNueva, setUnidadNueva] = useState("");
  const [unidadNuevaNombre, setUnidadNuevaNombre] = useState("");
  const [categoriaNueva, setCategoriaNueva] = useState("");

  useEffect(() => {
    if (open) {
      setNombre("");
      setCategoriaId("none");
      setUnidad(unidades[0]?.codigo ?? "");
      setUnidadNueva("");
      setUnidadNuevaNombre("");
      setCategoriaNueva("");
    }
  }, [open, unidades]);

  const mut = useMutation({
    mutationFn: solicitar,
    onSuccess: (r: any) => {
      toast.success(
        isDirector
          ? "Insumo creado y autorizado."
          : "Solicitud enviada. Un Director revisará tu solicitud.",
      );
      onCreated(r?.id, isDirector ? undefined : {
        nombre,
        unidad: unidad === "__nueva__" ? unidadNueva : unidad,
        categoria: categoriaId === "__nueva__" ? categoriaNueva : categorias.find((c) => c.id === categoriaId)?.nombre ?? null,
      });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isDirector ? "Nuevo insumo" : "Solicitar insumo"}</DialogTitle>
          <DialogDescription>
            {isDirector
              ? "El insumo se creará autorizado y podrás agregarlo al momento."
              : "El Director revisará tu solicitud. Podrás agregar el insumo una vez autorizado."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nombre</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={200} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Unidad</Label>
              <Select value={unidad} onValueChange={setUnidad}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__nueva__">{isDirector ? "+ Agregar nueva unidad" : "+ Solicitar unidad nueva"}</SelectItem>
                  {unidades.length === 0 && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      Sin unidades. Pide al Director crearlas.
                    </div>
                  )}
                  {unidades.map((u) => (
                    <SelectItem key={u.id} value={u.codigo} disabled={u.estatus !== "autorizado"}>
                      {u.codigo}
                      {u.nombre ? ` — ${u.nombre}` : ""}
                      {u.estatus === "pendiente" ? " (en espera de autorización)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {unidad === "__nueva__" && <div className="mt-2 space-y-2">
                <div>
                  <Label htmlFor="unidad-nueva-codigo" className="text-xs">Código</Label>
                  <Input id="unidad-nueva-codigo" value={unidadNueva} onChange={(e) => setUnidadNueva(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))} placeholder="Ej. CUB" maxLength={10} />
                </div>
                <div>
                  <Label htmlFor="unidad-nueva-nombre" className="text-xs">Nombre (opcional)</Label>
                  <Input id="unidad-nueva-nombre" value={unidadNuevaNombre} onChange={(e) => setUnidadNuevaNombre(e.target.value)} placeholder="Ej. Cubeta" maxLength={100} />
                </div>
                <p className="text-xs text-muted-foreground">{isDirector ? "Se creará autorizada al guardar." : "(en espera de autorización)"}</p>
              </div>}
            </div>
            <div>
              <Label>Categoría</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__nueva__">{isDirector ? "+ Agregar nueva categoría" : "+ Solicitar categoría nueva"}</SelectItem>
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id} disabled={c.estatus !== "autorizado"}>
                      {c.nombre}{c.estatus === "pendiente" ? " (en espera de autorización)" : c.estatus === "rechazado" ? " (rechazada)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categoriaId === "__nueva__" && <div className="mt-2 space-y-2">
                <Input value={categoriaNueva} onChange={(e) => setCategoriaNueva(e.target.value)} placeholder="Nombre de categoría" maxLength={100} />
                <p className="text-xs text-muted-foreground">{isDirector ? "Se creará autorizada al guardar." : "(en espera de autorización)"}</p>
              </div>}
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Checkbox id="disponible-renta" checked={!!disponibleRenta} disabled />
            <Label htmlFor="disponible-renta" className="text-sm font-normal">
              Disponible para renta
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!nombre.trim() || (!unidad || (unidad === "__nueva__" && !unidadNueva)) || (categoriaId === "__nueva__" && !categoriaNueva.trim()) || mut.isPending}
            onClick={() =>
              mut.mutate({
                data: {
                  nombre: nombre.trim(),
                  unidad: unidad === "__nueva__" ? unidadNueva : unidad,
                  ...(unidad === "__nueva__" ? { unidadNueva: { codigo: unidadNueva, nombre: unidadNuevaNombre.trim() } } : {}),
                  categoriaId: categoriaId === "none" || categoriaId === "__nueva__" ? null : categoriaId,
                  ...(categoriaId === "__nueva__" ? { categoriaNueva: categoriaNueva.trim() } : {}),
                  disponibleRenta: disponibleRenta ?? false,
                },
              })
            }
          >
            {isDirector ? "Crear" : "Solicitar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
