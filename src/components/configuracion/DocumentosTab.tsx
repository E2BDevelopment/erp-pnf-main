"use client";

import { useRef, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, FileUp, Trash2, Calendar, AlertTriangle, Eye, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@/lib/server-fn/client";
import {
  listCompanyDocumentos,
  saveCompanyDocumento,
  deleteCompanyDocumento,
} from "@/lib/api-client/company.functions";
import { useAuthStore } from "@/stores/auth";
import { estadoVencimiento, formatDate, type EstadoDoc } from "@/lib/format";

const BUCKET = "company-docs";

const TIPOS_PREDEFINIDOS = [
  "Acta Constitutiva",
  "Constancia de Situación Fiscal (CSF)",
  "Opinión de Cumplimiento SAT",
  "Poder Notarial",
  "Comprobante de Domicilio Fiscal",
  "Identificación Representante Legal",
  "Registro IMSS / Patrón",
  "Registro INFONAVIT",
  "Contrato de Arrendamiento",
  "Póliza de Seguro",
  "Otro",
];

const ESTADO_STYLES: Record<EstadoDoc, string> = {
  ok: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300",
  por_vencer: "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300",
  vencido: "bg-rose-100 text-rose-800 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300",
  sin_documento: "bg-muted text-muted-foreground hover:bg-muted",
};

const ESTADO_LABEL: Record<EstadoDoc, string> = {
  ok: "Vigente",
  por_vencer: "Por vencer",
  vencido: "Expirado",
  sin_documento: "Sin fecha",
};

export function DocumentosTab() {
  const qc = useQueryClient();
  const companyId = useAuthStore((s) => s.profile?.company_id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tipoSelect, setTipoSelect] = useState<string>("");
  const [tipoCustom, setTipoCustom] = useState<string>("");
  const [vencimiento, setVencimiento] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Modal para ver documentos ya guardados
  const [viewerDoc, setViewerDoc] = useState<{ titulo: string; url: string; isPdf: boolean } | null>(null);

  // Manejar URL temporal del archivo seleccionado para previsualización
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const fetchDocs = useServerFn(listCompanyDocumentos);
  const saveDoc = useServerFn(saveCompanyDocumento);
  const deleteDoc = useServerFn(deleteCompanyDocumento);

  const { data: documentos = [], isLoading } = useQuery({
    queryKey: ["company_documentos", companyId],
    queryFn: () => fetchDocs(),
  });

  const saveMutation = useMutation({
    mutationFn: saveDoc,
    onSuccess: () => {
      toast.success("Documento guardado con éxito");
      qc.invalidateQueries({ queryKey: ["company_documentos", companyId] });
      qc.invalidateQueries({ queryKey: ["notificaciones"] });
      // Reset form
      setTipoSelect("");
      setTipoCustom("");
      setVencimiento("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (e: Error) => toast.error(e.message || "Error al registrar documento"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDoc,
    onSuccess: () => {
      toast.success("Documento eliminado");
      qc.invalidateQueries({ queryKey: ["company_documentos", companyId] });
    },
    onError: (e: Error) => toast.error(e.message || "Error al eliminar documento"),
  });

  const handleVerDocumento = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.url, 300);
      if (error || !data?.signedUrl) {
        toast.error("No se pudo obtener el archivo");
        return;
      }
      const isPdf = doc.nombre_archivo?.toLowerCase().endsWith(".pdf") || doc.url?.toLowerCase().endsWith(".pdf");
      setViewerDoc({ titulo: `${doc.tipo} - ${doc.nombre_archivo}`, url: data.signedUrl, isPdf });
    } catch {
      toast.error("Error al abrir visualizador");
    }
  };

  const handleDescargar = async (url: string) => {
    try {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(url, 60);
      if (error || !data?.signedUrl) {
        toast.error("No se pudo obtener el archivo de descarga");
        return;
      }
      window.open(data.signedUrl, "_blank");
    } catch {
      toast.error("Error al abrir archivo");
    }
  };

  const handleUploadAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTipo = (tipoSelect === "Otro" ? tipoCustom : tipoSelect).trim();
    if (!finalTipo) {
      toast.error("Selecciona o escribe el tipo de documento");
      return;
    }
    if (!selectedFile) {
      toast.error("Selecciona un archivo a subir");
      return;
    }
    if (!companyId) {
      toast.error("No se pudo identificar la empresa actual");
      return;
    }

    setUploading(true);
    try {
      const ext = selectedFile.name.split(".").pop();
      const safeTipo = finalTipo.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
      const path = `${companyId}/${safeTipo}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, selectedFile, { upsert: true });

      if (upErr) throw new Error(upErr.message);

      await saveMutation.mutateAsync({
        data: {
          tipo: finalTipo,
          url: path,
          nombre_archivo: selectedFile.name,
          fecha_vencimiento: vencimiento || null,
        },
      });
    } catch (err: any) {
      toast.error(err.message || "Error al subir archivo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Formulario para agregar / actualizar */}
      <form onSubmit={handleUploadAndSave} className="rounded-lg border bg-card p-5 space-y-4 shadow-sm">
        <h3 className="text-base font-semibold">Subir documento de la empresa</h3>
        <p className="text-sm text-muted-foreground">
          Sube actas, constancias, opiniones del SAT u otros archivos oficiales con control opcional de vigencia.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <Label htmlFor="tipo-doc">Tipo de documento *</Label>
            <Select value={tipoSelect} onValueChange={setTipoSelect}>
              <SelectTrigger id="tipo-doc">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_PREDEFINIDOS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tipoSelect === "Otro" && (
              <Input
                className="mt-2"
                placeholder="Escribe el nombre del tipo..."
                value={tipoCustom}
                onChange={(e) => setTipoCustom(e.target.value)}
                required
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vigencia-doc" className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Fecha de vigencia (opcional)
            </Label>
            <Input
              id="vigencia-doc"
              type="date"
              value={vencimiento}
              onChange={(e) => setVencimiento(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="archivo-doc">Archivo (PDF / Imagen) *</Label>
            <Input
              id="archivo-doc"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              required
            />
          </div>
        </div>

        {/* Previsualizador del archivo que se va a subir */}
        {selectedFile && previewUrl && (
          <div className="rounded-md border p-3 bg-muted/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                Vista previa: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                <X className="h-3.5 w-3.5 mr-1" /> Quitar
              </Button>
            </div>
            {selectedFile.type.includes("pdf") || selectedFile.name.toLowerCase().endsWith(".pdf") ? (
              <iframe
                src={previewUrl}
                title="Vista previa PDF"
                className="w-full h-72 rounded border bg-background"
              />
            ) : (
              <div className="flex justify-center bg-background/50 rounded border p-2">
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="max-h-64 max-w-full rounded object-contain shadow-sm"
                />
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={uploading || saveMutation.isPending}>
            <FileUp className="h-4 w-4 mr-2" />
            {uploading || saveMutation.isPending ? "Subiendo..." : "Guardar documento"}
          </Button>
        </div>
      </form>

      {/* Lista de documentos existentes */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold">Documentos registrados</h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando documentos…</p>
        ) : documentos.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-lg text-muted-foreground text-sm">
            No hay documentos cargados en la empresa.
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Documento</TableHead>
                  <TableHead>Archivo</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentos.map((doc: any) => {
                  const est = doc.fecha_vencimiento
                    ? estadoVencimiento(doc.fecha_vencimiento, doc.url)
                    : "sin_documento";

                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.tipo}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={doc.nombre_archivo}>
                        {doc.nombre_archivo}
                      </TableCell>
                      <TableCell className="text-sm">
                        {doc.fecha_vencimiento ? formatDate(doc.fecha_vencimiento) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={ESTADO_STYLES[est]}>
                          {est === "por_vencer" || est === "vencido" ? (
                            <AlertTriangle className="h-3 w-3 mr-1 inline" />
                          ) : null}
                          {ESTADO_LABEL[est]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Visualizar"
                          onClick={() => handleVerDocumento(doc)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Descargar"
                          onClick={() => handleDescargar(doc.url)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          title="Eliminar"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (confirm(`¿Eliminar el documento "${doc.tipo}"?`)) {
                              deleteMutation.mutate({ data: { id: doc.id } });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Modal para visualizar documento existente */}
      <Dialog open={!!viewerDoc} onOpenChange={(open) => !open && setViewerDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-4">
          <DialogHeader>
            <DialogTitle className="text-base truncate pr-6">{viewerDoc?.titulo}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full min-h-[500px] overflow-hidden rounded border bg-muted/20 flex items-center justify-center">
            {viewerDoc?.isPdf ? (
              <iframe
                src={viewerDoc.url}
                title={viewerDoc.titulo}
                className="w-full h-[65vh] border-0 rounded"
              />
            ) : viewerDoc?.url ? (
              <img
                src={viewerDoc.url}
                alt={viewerDoc.titulo}
                className="max-h-[65vh] max-w-full object-contain rounded"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
