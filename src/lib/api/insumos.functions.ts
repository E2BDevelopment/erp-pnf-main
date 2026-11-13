import { createServerFn } from "@/lib/server-fn";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const UNIDAD_REGEX = /^[A-Z0-9]{1,10}$/;
const unidadSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(UNIDAD_REGEX, "Unidad: 1-10 caracteres (letras o números)");

async function validateUnidad(supabase: any, companyId: string, unidad: string) {
  const { count, error } = await supabase
    .from("insumo_unidades")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("codigo", unidad)
    .eq("estatus", "autorizado");
  if (error) throw new Error(error.message);
  if (!count)
    throw new Error(`Unidad "${unidad}" no existe. Créala desde el catálogo de unidades.`);
}

async function getUserCompanyAndDirector(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.company_id) throw new Error("Sin empresa asociada");
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("company_id", profile.company_id);
  const isDirector = (roles ?? []).some((r: any) => r.role === "director");
  return { companyId: profile.company_id as string, isDirector };
}

async function notificarSolicitudCatalogo(
  supabase: any,
  companyId: string,
  userId: string,
  solicitud: { unidad?: { codigo: string; nombre?: string | null }; categoria?: string },
) {
  try {
    const [{ data: directors }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("user_id").eq("company_id", companyId).eq("role", "director"),
      supabase.from("profiles").select("nombre_completo").eq("id", userId).maybeSingle(),
    ]);
    const recipients = Array.from(
      new Set<string>(
        ((directors ?? []) as Array<{ user_id: string }>).map((row) => row.user_id),
      ),
    ).filter((id) => id !== userId);
    if (!recipients.length) return;

    const requested: string[] = [];
    if (solicitud.unidad) {
      requested.push(
        `la unidad ${solicitud.unidad.codigo}${solicitud.unidad.nombre ? ` — ${solicitud.unidad.nombre}` : ""}`,
      );
    }
    if (solicitud.categoria) requested.push(`la categoría ${solicitud.categoria}`);
    const who = profile?.nombre_completo ?? "Un usuario";
    const subject = requested.length > 1 ? "Nuevas solicitudes de catálogo" : "Nueva solicitud de catálogo";
    const message = `${who} solicita autorización para ${requested.join(" y ")}.`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("notificaciones").insert(
      recipients.map((uid) => ({
        user_id: uid,
        company_id: companyId,
        tipo: "insumo_catalogo_solicitado",
        titulo: subject,
        mensaje: message,
        link: "/app/catalogos/insumos",
      })),
    );
    if (error) console.error("[notificaciones] insumo_catalogo_solicitado", error.message);
  } catch (error: any) {
    console.error("[notificaciones] insumo_catalogo_solicitado", error?.message);
  }
}

const PREFIJO_REGEX = /^[A-Z0-9]{3}$/;

function derivarPrefijo(nombre: string): string {
  const clean = nombre.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return (clean + "XXX").slice(0, 3);
}

async function prefijoUnico(
  supabase: any,
  companyId: string,
  base: string,
  excludeId?: string,
): Promise<string> {
  let candidate = base;
  for (let suffix = 1; suffix <= 99; suffix++) {
    let q = supabase
      .from("insumo_categorias")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("prefijo", candidate);
    if (excludeId) q = q.neq("id", excludeId);
    const { count } = await q;
    if (!count) return candidate;
    candidate =
      suffix < 10
        ? base.slice(0, 2) + String(suffix + 1)
        : base.slice(0, 1) + String(suffix + 1).padStart(2, "0");
  }
  throw new Error("No se pudo generar un prefijo único");
}

export const listInsumos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        estatus: z.enum(["autorizado", "pendiente", "rechazado"]).optional(),
        categoriaId: z.string().uuid().nullable().optional(),
        unidad: unidadSchema.optional(),
        search: z.string().trim().max(200).optional(),
        soloRenta: z.boolean().optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase
      .from("insumos")
      .select(
        "id, codigo, nombre, unidad, estatus, categoria_id, solicitado_por, created_at, autorizado_at, disponible_renta, categoria:insumo_categorias(id, nombre, prefijo)",
      )
      .order("created_at", { ascending: false });
    if (data.estatus) q = q.eq("estatus", data.estatus);
    if (data.categoriaId) q = q.eq("categoria_id", data.categoriaId);
    if (data.unidad) q = q.eq("unidad", data.unidad);
    if (data.soloRenta) q = q.eq("disponible_renta", true);
    if (data.search) {
      const s = data.search.replace(/[%_]/g, "\\$&");
      q = q.or(`nombre.ilike.%${s}%,codigo.ilike.%${s}%`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const ids = (rows ?? []).map((r: any) => r.id);
    const userIds = Array.from(
      new Set((rows ?? []).map((r: any) => r.solicitado_por).filter(Boolean)),
    );

    const priceMap = new Map<string, { precio: number; proveedor: string | null; fecha: string }>();
    const requisitionMap = new Map<string, string>();
    if (ids.length > 0) {
      const [{ data: precios }, { data: requisitionItems }] = await Promise.all([
        supabase
          .from("insumos_historial_precios")
          .select("insumo_id, precio_unitario, proveedor, fecha")
          .in("insumo_id", ids)
          .order("fecha", { ascending: false }),
        supabase.from("requisicion_insumos").select("insumo_id, requisicion_id").in("insumo_id", ids),
      ]);
      for (const p of precios ?? []) {
        if (!priceMap.has(p.insumo_id)) {
          priceMap.set(p.insumo_id, {
            precio: Number(p.precio_unitario),
            proveedor: p.proveedor,
            fecha: p.fecha,
          });
        }
      }

      const requisitionIds = [
        ...new Set((requisitionItems ?? []).map((item) => item.requisicion_id)),
      ];
      if (requisitionIds.length > 0) {
        const { data: requisitions } = await supabase
          .from("requisiciones")
          .select("id, folio, created_at")
          .in("id", requisitionIds)
          .order("created_at", { ascending: true });
        const requisitionById = new Map(
          (requisitions ?? []).map((requisition) => [requisition.id, requisition]),
        );
        const orderedItems = [...(requisitionItems ?? [])].sort((a, b) => {
          const dateA = requisitionById.get(a.requisicion_id)?.created_at ?? "";
          const dateB = requisitionById.get(b.requisicion_id)?.created_at ?? "";
          return dateA.localeCompare(dateB);
        });
        for (const item of orderedItems) {
          const requisition = requisitionById.get(item.requisicion_id);
          if (requisition && !requisitionMap.has(item.insumo_id)) {
            requisitionMap.set(item.insumo_id, requisition.folio);
          }
        }
      }
    }

    const profileMap = new Map<string, { nombre_completo: string; email: string }>();
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, nombre_completo, email")
        .in("id", userIds);
      for (const p of profs ?? []) profileMap.set(p.id, p);
    }

    return (rows ?? []).map((r: any) => ({
      ...r,
      ultimo_precio: priceMap.get(r.id) ?? null,
      requisicion_origen: requisitionMap.get(r.id) ?? null,
      solicitante: r.solicitado_por ? (profileMap.get(r.solicitado_por) ?? null) : null,
    }));
  });

export const getMetricasInsumos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ count: total }, { count: pendientes }, cats, hist] = await Promise.all([
      supabase.from("insumos").select("*", { count: "exact", head: true }),
      supabase
        .from("insumos")
        .select("*", { count: "exact", head: true })
        .eq("estatus", "pendiente"),
      supabase.from("insumo_categorias").select("id", { count: "exact", head: true }),
      supabase.from("insumos_historial_precios").select("insumo_id"),
    ]);
    const conHistorial = new Set((hist.data ?? []).map((r: any) => r.insumo_id)).size;
    return {
      total: total ?? 0,
      pendientes: pendientes ?? 0,
      categorias: cats.count ?? 0,
      conHistorial,
    };
  });

export const listCategorias = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { companyId, isDirector } = await getUserCompanyAndDirector(supabase, userId);
    let query = supabase
      .from("insumo_categorias")
      .select("id, nombre, prefijo, estatus")
      .eq("company_id", companyId)
      .order("nombre");
    if (!isDirector) query = query.eq("estatus", "autorizado");
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const solicitarInsumo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        nombre: z.string().trim().min(1).max(200),
        unidad: unidadSchema,
        categoriaId: z.string().uuid().nullable(),
        unidadNueva: z.object({ codigo: unidadSchema, nombre: z.string().trim().max(100).nullable().optional() }).optional(),
        categoriaNueva: z.string().trim().min(1).max(100).optional(),
        disponibleRenta: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { companyId, isDirector } = await getUserCompanyAndDirector(supabase, userId);
    let categoriaId = data.categoriaId;
    if (data.unidadNueva) {
      const { error } = await supabase.from("insumo_unidades").insert({ company_id: companyId, codigo: data.unidadNueva.codigo, nombre: data.unidadNueva.nombre || null, estatus: isDirector ? "autorizado" : "pendiente", solicitado_por: userId, ...(isDirector ? { autorizado_por: userId, autorizado_at: new Date().toISOString() } : {}) });
      if (error && error.code !== "23505") throw new Error(error.message);
      if (error?.code === "23505") throw new Error("Esa unidad ya está registrada o pendiente de autorización");
    }
    if (data.categoriaNueva) {
      const prefijo = await prefijoUnico(supabase, companyId, derivarPrefijo(data.categoriaNueva));
      const { data: categoria, error } = await supabase.from("insumo_categorias").insert({ company_id: companyId, nombre: data.categoriaNueva, prefijo, estatus: isDirector ? "autorizado" : "pendiente", solicitado_por: userId, ...(isDirector ? { autorizado_por: userId, autorizado_at: new Date().toISOString() } : {}) }).select("id").single();
      if (error) throw new Error(error.code === "23505" ? "Esa categoría ya está registrada o pendiente de autorización" : error.message);
      categoriaId = categoria.id;
    }
    if (categoriaId) {
      const { count, error } = await supabase.from("insumo_categorias").select("id", { count: "exact", head: true }).eq("id", categoriaId).eq("company_id", companyId).eq("estatus", "autorizado");
      if (error) throw new Error(error.message);
      if (!count && !data.categoriaNueva) throw new Error("La categoría no está autorizada");
    }
    if (!data.unidadNueva || isDirector) await validateUnidad(supabase, companyId, data.unidad);
    const row: {
      company_id: string;
      categoria_id: string | null;
      nombre: string;
      unidad: string;
      solicitado_por: string;
      estatus: "autorizado" | "pendiente";
      autorizado_por?: string;
      autorizado_at?: string;
      disponible_renta?: boolean;
    } = {
      company_id: companyId,
      categoria_id: categoriaId,
      nombre: data.nombre,
      unidad: data.unidad,
      solicitado_por: userId,
      estatus: isDirector ? "autorizado" : "pendiente",
    };
    if (isDirector) {
      row.autorizado_por = userId;
      row.autorizado_at = new Date().toISOString();
      row.disponible_renta = data.disponibleRenta ?? false;
    }
    const { data: inserted, error } = await supabase
      .from("insumos")
      .insert(row)
      .select("id, estatus")
      .single();
    if (error) throw new Error(error.message);
    if (!isDirector && (data.unidadNueva || data.categoriaNueva)) {
      await notificarSolicitudCatalogo(supabase, companyId, userId, {
        ...(data.unidadNueva ? { unidad: data.unidadNueva } : {}),
        ...(data.categoriaNueva ? { categoria: data.categoriaNueva } : {}),
      });
    }
    return {
      ok: true,
      id: inserted?.id as string | undefined,
      estatus: inserted?.estatus as "autorizado" | "pendiente",
    };
  });

export const editarInsumo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        nombre: z.string().trim().min(1).max(200),
        unidad: unidadSchema,
        categoriaId: z.string().uuid().nullable(),
        disponibleRenta: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { companyId, isDirector } = await getUserCompanyAndDirector(supabase, userId);
    if (!isDirector) throw new Error("Solo el Director puede editar insumos");
    await validateUnidad(supabase, companyId, data.unidad);
    if (data.categoriaId) {
      const { data: categoria, error: categoriaError } = await supabase
        .from("insumo_categorias")
        .select("id")
        .eq("id", data.categoriaId)
        .eq("company_id", companyId)
        .maybeSingle();
      if (categoriaError) throw new Error(categoriaError.message);
      if (!categoria) throw new Error("La categoría no pertenece a tu empresa");
    }
    const patch: {
      nombre: string;
      unidad: typeof data.unidad;
      categoria_id: string | null;
      disponible_renta?: boolean;
    } = {
      nombre: data.nombre,
      unidad: data.unidad,
      categoria_id: data.categoriaId,
    };
    if (typeof data.disponibleRenta === "boolean") patch.disponible_renta = data.disponibleRenta;
    const { error } = await supabase
      .from("insumos")
      .update(patch)
      .eq("id", data.id)
      .eq("company_id", companyId);
    if (error) {
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const autorizarInsumo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { companyId, isDirector } = await getUserCompanyAndDirector(supabase, userId);
    if (!isDirector) throw new Error("Solo el Director puede autorizar");
    const { data: insumo } = await supabase.from("insumos").select("unidad, categoria_id").eq("id", data.id).eq("company_id", companyId).maybeSingle();
    if (!insumo) throw new Error("Insumo no encontrado");
    await validateUnidad(supabase, companyId, insumo.unidad);
    if (insumo.categoria_id) {
      const { data: categoria } = await supabase.from("insumo_categorias").select("estatus").eq("id", insumo.categoria_id).eq("company_id", companyId).maybeSingle();
      if (categoria?.estatus !== "autorizado") throw new Error("Autoriza primero la categoría asociada");
    }
    const { data: updated, error } = await supabase
      .from("insumos")
      .update({
        estatus: "autorizado",
        autorizado_por: userId,
        autorizado_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("company_id", companyId)
      .eq("estatus", "pendiente")
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated) throw new Error("El insumo ya no está pendiente de autorización");
    return { ok: true };
  });

export const rechazarInsumo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { companyId, isDirector } = await getUserCompanyAndDirector(supabase, userId);
    if (!isDirector) throw new Error("Solo el Director puede rechazar");
    const { data: rejected, error } = await supabase
      .from("insumos")
      .update({ estatus: "rechazado" })
      .eq("id", data.id)
      .eq("company_id", companyId)
      .eq("estatus", "pendiente")
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!rejected) throw new Error("El insumo ya no está pendiente de autorización");
    return { ok: true };
  });

export const crearCategoria = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        nombre: z.string().trim().min(1).max(100),
        prefijo: z
          .string()
          .trim()
          .toUpperCase()
          .regex(PREFIJO_REGEX, "Prefijo debe ser 3 letras o números")
          .optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { companyId, isDirector } = await getUserCompanyAndDirector(supabase, userId);
    if (!isDirector) throw new Error("Solo el Director puede crear categorías");
    const base = data.prefijo ?? derivarPrefijo(data.nombre);
    const prefijo = data.prefijo ? base : await prefijoUnico(supabase, companyId, base);
    const { error } = await supabase
      .from("insumo_categorias")
      .insert({ company_id: companyId, nombre: data.nombre, prefijo });
    if (error) {
      if (error.message.includes("insumo_categorias_prefijo_unique")) {
        throw new Error(`El prefijo "${prefijo}" ya está en uso`);
      }
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const editarCategoria = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        nombre: z.string().trim().min(1).max(100),
        prefijo: z
          .string()
          .trim()
          .toUpperCase()
          .regex(PREFIJO_REGEX, "Prefijo debe ser 3 letras o números")
          .optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: { nombre: string; prefijo?: string } = { nombre: data.nombre };
    if (data.prefijo) patch.prefijo = data.prefijo;
    const { error } = await context.supabase
      .from("insumo_categorias")
      .update(patch)
      .eq("id", data.id);
    if (error) {
      if (error.message.includes("insumo_categorias_prefijo_unique")) {
        throw new Error(`El prefijo "${data.prefijo}" ya está en uso`);
      }
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const eliminarCategoria = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { count } = await supabase
      .from("insumos")
      .select("id", { count: "exact", head: true })
      .eq("categoria_id", data.id);
    if ((count ?? 0) > 0)
      throw new Error("No se puede eliminar: la categoría tiene insumos asociados");
    const { error } = await supabase.from("insumo_categorias").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getHistorialPrecios = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ insumoId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("insumos_historial_precios")
      .select("id, precio_unitario, proveedor, fecha, cantidad, obra_id")
      .eq("insumo_id", data.insumoId)
      .order("fecha", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const importarInsumos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        filas: z
          .array(
            z.object({
              nombre: z.string().trim().min(1).max(200),
              unidad: unidadSchema,
              categoria: z.string().trim().min(1).max(100),
              row: z.number().int().positive(),
            }),
          )
          .min(1)
          .max(500),
        unidadesNuevas: z
          .array(
            z.object({
              codigo: unidadSchema,
              nombre: z.string().trim().min(1).max(100),
            }),
          )
          .max(100)
          .optional()
          .default([]),
        categoriasNuevas: z
          .array(
            z.object({
              nombre: z.string().trim().min(1).max(100),
              prefijo: z
                .string()
                .trim()
                .toUpperCase()
                .regex(PREFIJO_REGEX, "Prefijo debe ser 3 letras o números")
                .optional(),
            }),
          )
          .max(100)
          .optional()
          .default([]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { companyId, isDirector } = await getUserCompanyAndDirector(supabase, userId);
    if (!isDirector) throw new Error("Solo el Director puede importar insumos");

    // Crear unidades nuevas (si las hay) antes de validar
    if (data.unidadesNuevas.length > 0) {
      const { data: yaExisten } = await supabase
        .from("insumo_unidades")
        .select("codigo")
        .eq("company_id", companyId);
      const existentes = new Set((yaExisten ?? []).map((u: any) => String(u.codigo).toUpperCase()));
      const toInsert = data.unidadesNuevas
        .filter((u) => !existentes.has(u.codigo.toUpperCase()))
        .map((u) => ({
          company_id: companyId,
          codigo: u.codigo,
          nombre: u.nombre,
        }));
      if (toInsert.length > 0) {
        const { error: insUnidadesErr } = await supabase.from("insumo_unidades").insert(toInsert);
        if (insUnidadesErr) throw new Error(`Error creando unidades: ${insUnidadesErr.message}`);
      }
    }

    // Validar que todas las unidades existan en el catálogo
    const { data: existingUnits } = await supabase
      .from("insumo_unidades")
      .select("codigo")
      .eq("company_id", companyId);
    const validUnits = new Set(
      (existingUnits ?? []).map((u: any) => String(u.codigo).toUpperCase()),
    );
    const unidadesFaltantes = Array.from(
      new Set(data.filas.map((f) => f.unidad).filter((u) => !validUnits.has(u))),
    );
    if (unidadesFaltantes.length > 0) {
      throw new Error(
        `Las siguientes unidades no existen en el catálogo: ${unidadesFaltantes.join(", ")}. Créalas primero desde el catálogo de Unidades.`,
      );
    }

    // Cargar insumos existentes de la compañía para detectar duplicados
    const { data: existingInsumos, error: exErr } = await supabase
      .from("insumos")
      .select("nombre")
      .eq("company_id", companyId);
    if (exErr) throw new Error(exErr.message);
    const existingNames = new Set(
      (existingInsumos ?? []).map((i: any) => String(i.nombre).trim().toLowerCase()),
    );

    // Validar duplicados contra BD y duplicados internos
    const errores: {
      row: number;
      nombre: string;
      unidad: string;
      categoria: string;
      error: string;
    }[] = [];
    const seenInFile = new Map<string, number>();
    for (const f of data.filas) {
      const key = f.nombre.trim().toLowerCase();
      if (existingNames.has(key)) {
        errores.push({
          row: f.row,
          nombre: f.nombre,
          unidad: f.unidad,
          categoria: f.categoria,
          error: "Ya existe en la base de datos",
        });
      } else if (seenInFile.has(key)) {
        errores.push({
          row: f.row,
          nombre: f.nombre,
          unidad: f.unidad,
          categoria: f.categoria,
          error: `Duplicado en el archivo (fila ${seenInFile.get(key)})`,
        });
      } else {
        seenInFile.set(key, f.row);
      }
    }
    if (errores.length > 0) {
      return { ok: false as const, errores };
    }

    // Cargar categorías existentes
    const { data: existingCats, error: catErr } = await supabase
      .from("insumo_categorias")
      .select("id, nombre")
      .eq("company_id", companyId);
    if (catErr) throw new Error(catErr.message);
    const catMap = new Map<string, string>();
    for (const c of existingCats ?? []) catMap.set(String(c.nombre).trim().toLowerCase(), c.id);

    // Crear categorías nuevas (usando prefijos provistos por el usuario o derivándolos)
    const prefijoOverrides = new Map<string, string>();
    for (const c of data.categoriasNuevas) {
      if (c.prefijo) prefijoOverrides.set(c.nombre.trim().toLowerCase(), c.prefijo);
    }
    const nuevasCats = new Map<string, string>(); // key -> nombre original
    for (const f of data.filas) {
      const key = f.categoria.trim().toLowerCase();
      if (!catMap.has(key) && !nuevasCats.has(key)) {
        nuevasCats.set(key, f.categoria.trim());
      }
    }
    if (nuevasCats.size > 0) {
      const toInsert: { company_id: string; nombre: string; prefijo: string }[] = [];
      for (const [key, nombre] of nuevasCats.entries()) {
        const override = prefijoOverrides.get(key);
        const base = override ?? derivarPrefijo(nombre);
        const prefijo = override ? base : await prefijoUnico(supabase, companyId, base);
        toInsert.push({ company_id: companyId, nombre, prefijo });
      }
      const { data: inserted, error: insCatErr } = await supabase
        .from("insumo_categorias")
        .insert(toInsert)
        .select("id, nombre");
      if (insCatErr) {
        if (insCatErr.message.includes("insumo_categorias_prefijo_unique")) {
          throw new Error(
            "Uno de los prefijos elegidos ya está en uso. Ajusta los prefijos e intenta de nuevo.",
          );
        }
        throw new Error(`Error creando categorías: ${insCatErr.message}`);
      }
      for (const c of inserted ?? []) catMap.set(String(c.nombre).trim().toLowerCase(), c.id);
    }

    // Bulk insert insumos como autorizados
    const now = new Date().toISOString();
    const rows = data.filas.map((f) => ({
      company_id: companyId,
      categoria_id: catMap.get(f.categoria.trim().toLowerCase()) ?? null,
      nombre: f.nombre.trim(),
      unidad: f.unidad,
      estatus: "autorizado" as const,
      solicitado_por: userId,
      autorizado_por: userId,
      autorizado_at: now,
    }));
    const { error: insErr } = await supabase.from("insumos").insert(rows);
    if (insErr) throw new Error(`Error insertando insumos: ${insErr.message}`);

    return {
      ok: true as const,
      insertadas: rows.length,
      categoriasCreadas: nuevasCats.size,
      unidadesCreadas: data.unidadesNuevas.length,
    };
  });

// ============= UNIDADES =============

export const listUnidades = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { companyId, isDirector } = await getUserCompanyAndDirector(supabase, userId);
    let query = supabase
      .from("insumo_unidades")
      .select("id, codigo, nombre, estatus")
      .eq("company_id", companyId)
      .order("codigo");
    if (!isDirector) query = query.eq("estatus", "autorizado");
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const crearUnidad = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        codigo: unidadSchema,
        nombre: z.string().trim().max(100).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { companyId, isDirector } = await getUserCompanyAndDirector(supabase, userId);
    if (!isDirector) throw new Error("Solo el Director puede crear unidades desde el catálogo");
    const { error } = await supabase.from("insumo_unidades").insert({
      company_id: companyId,
      codigo: data.codigo,
      nombre: data.nombre || null,
    });
    if (error) {
      if (error.code === "23505") throw new Error(`La unidad "${data.codigo}" ya existe`);
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const revisarUnidad = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), aprobar: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { companyId, isDirector } = await getUserCompanyAndDirector(supabase, userId);
    if (!isDirector) throw new Error("Solo el Director puede revisar unidades");
    if (!data.aprobar) {
      const { error } = await supabase.from("insumo_unidades").delete().eq("id", data.id).eq("company_id", companyId).eq("estatus", "pendiente");
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("insumo_unidades").update({ estatus: "autorizado", autorizado_por: userId, autorizado_at: new Date().toISOString() }).eq("id", data.id).eq("company_id", companyId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const revisarCategoria = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), aprobar: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { companyId, isDirector } = await getUserCompanyAndDirector(supabase, userId);
    if (!isDirector) throw new Error("Solo el Director puede revisar categorías");
    const { error } = await supabase.from("insumo_categorias").update(data.aprobar ? { estatus: "autorizado", autorizado_por: userId, autorizado_at: new Date().toISOString() } : { estatus: "rechazado", autorizado_por: userId, autorizado_at: new Date().toISOString() }).eq("id", data.id).eq("company_id", companyId).eq("estatus", "pendiente");
    if (error) throw new Error(error.message);
    if (!data.aprobar) await supabase.from("insumos").update({ categoria_id: null }).eq("company_id", companyId).eq("categoria_id", data.id);
    return { ok: true };
  });

export const editarUnidad = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        codigo: unidadSchema,
        nombre: z.string().trim().max(100).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { companyId, isDirector } = await getUserCompanyAndDirector(supabase, userId);
    if (!isDirector) throw new Error("Solo el Director puede editar unidades");

    // Si cambia el código, actualizar los insumos asociados
    const { data: actual } = await supabase
      .from("insumo_unidades")
      .select("codigo")
      .eq("id", data.id)
      .maybeSingle();
    const codigoAnterior = actual?.codigo as string | undefined;

    const { error } = await supabase
      .from("insumo_unidades")
      .update({ codigo: data.codigo, nombre: data.nombre || null })
      .eq("id", data.id);
    if (error) {
      if (error.code === "23505") throw new Error(`La unidad "${data.codigo}" ya existe`);
      throw new Error(error.message);
    }

    if (codigoAnterior && codigoAnterior !== data.codigo) {
      await supabase
        .from("insumos")
        .update({ unidad: data.codigo })
        .eq("company_id", companyId)
        .eq("unidad", codigoAnterior);
    }
    return { ok: true };
  });

export const eliminarUnidad = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { companyId, isDirector } = await getUserCompanyAndDirector(supabase, userId);
    if (!isDirector) throw new Error("Solo el Director puede eliminar unidades");

    const { data: u } = await supabase
      .from("insumo_unidades")
      .select("codigo")
      .eq("id", data.id)
      .maybeSingle();
    if (!u) throw new Error("Unidad no encontrada");

    const { count } = await supabase
      .from("insumos")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("unidad", u.codigo);
    if ((count ?? 0) > 0) {
      throw new Error(
        `No se puede eliminar: la unidad "${u.codigo}" está en uso por ${count} insumo(s)`,
      );
    }
    const { error } = await supabase.from("insumo_unidades").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
