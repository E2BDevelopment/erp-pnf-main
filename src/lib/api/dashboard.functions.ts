import { createServerFn } from "@/lib/server-fn";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { calcularSemana, toISODate } from "@/lib/estimacion-utils";
// Reutiliza el mismo cálculo de producción y costos que el estado de resultados
// de una obra; aquí se le pasan todas las obras visibles para agregar la empresa.
import {
  calcularBuckets,
  totalCostos,
  type Bucket,
  type CostoCategoria,
} from "@/lib/api/estado-resultados.functions";

// ============================================================
// Tipos públicos
// ============================================================

export type DashboardSemana = {
  inicio: string;
  fin: string;
  produccion: number;
  costo: number;
  resultado: number;
};

export type DashboardObra = {
  id: string;
  nombre: string;
  cliente: string | null;
  unidad_negocio: string | null;
  monto_contratado: number;
  estimado: number;
  /** Estimado / contratado. `null` cuando la obra no tiene presupuesto autorizado. */
  avance: number | null;
  fecha_terminacion: string | null;
  activa: boolean;
};

export type DashboardCxPItem = {
  id: string;
  folio: string;
  beneficiario: string;
  concepto: string;
  saldo: number;
  fecha_vencimiento: string | null;
  vencida: boolean;
};

export type DashboardCxP = {
  total: number;
  vencido: number;
  vencidas: number;
  pendientes: number;
  proximos: DashboardCxPItem[];
};

export type DashboardTesoreria = {
  total: number;
  cuentas: number;
};

export type DashboardData = {
  semanas: number;
  periodo: { inicio: string; fin: string };
  kpis: {
    obras_activas: number;
    obras_total: number;
    monto_contratado: number;
    produccion: number;
    costo: number;
    resultado: number;
    margen: number;
    costo_sobre_produccion: number | null;
    produccion_anterior: number;
    /** Variación porcentual contra el periodo anterior; `null` si no hay base. */
    variacion_produccion: number | null;
  };
  serie: DashboardSemana[];
  costos: Array<{ categoria: CostoCategoria; monto: number; pct: number }>;
  obras: DashboardObra[];
  cxp: DashboardCxP | null;
  tesoreria: DashboardTesoreria | null;
};

// ============================================================
// Helpers
// ============================================================

function num(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

function hoyISO(): string {
  return toISODate(new Date());
}

function ultimasSemanas(cantidad: number): { inicio: string; fin: string }[] {
  const semanas: { inicio: string; fin: string }[] = [];
  const hoy = new Date();
  for (let i = cantidad - 1; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() - i * 7);
    semanas.push(calcularSemana(d));
  }
  return semanas;
}

/**
 * Consulta accesoria: si falla (por RLS o por un error puntual) el dashboard
 * sigue funcionando sin ese bloque en lugar de caerse completo.
 */
async function consultaOpcional<T>(
  etiqueta: string,
  consulta: PromiseLike<{ data: T | null; error: unknown }>,
): Promise<T | null> {
  try {
    const { data, error } = (await consulta) as { data: T | null; error: unknown };
    if (error) {
      console.warn(`[dashboard] ${etiqueta}:`, (error as { message?: string })?.message ?? error);
      return null;
    }
    return data ?? null;
  } catch (e) {
    console.warn(`[dashboard] ${etiqueta} threw:`, (e as { message?: string })?.message ?? e);
    return null;
  }
}

// ============================================================
// Server function
// ============================================================

const esquema = z.object({
  semanas: z.number().int().min(4).max(26).default(8),
});

export const getDashboardEmpresa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => esquema.parse(d))
  .handler(async ({ data, context }): Promise<DashboardData> => {
    const { supabase, userId } = context;

    const [{ data: profile }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("company_id").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    const companyId = (profile as { company_id?: string | null } | null)?.company_id ?? null;
    if (!companyId) throw new Error("Tu usuario no tiene empresa asignada.");

    const roles = new Set<string>(((roleRows ?? []) as Array<{ role: string }>).map((r) => r.role));
    const isDirector = roles.has("director");
    const isAdmin = isDirector || roles.has("administrativo");
    // El Supervisor autoriza desde la obra; las cuentas por pagar y la tesorería
    // son vistas de Administración, igual que en la navegación.
    const puedeVerCxP = isAdmin;

    // --- Obras visibles: el Director ve toda la empresa; el resto, su equipo ---
    const camposObra =
      "id, nombre, monto_contratado, fecha_terminacion, unidad_negocio:unidades_negocio(nombre), cliente:clientes(razon_social)";

    // Estas dos consultas solo dependen de la empresa y del rol, no de las
    // obras: se lanzan antes para correr en paralelo con la de obras. Antes
    // esperaban su turno y cada una sumaba un viaje completo a la base.
    const cxpPromise = puedeVerCxP
      ? consultaOpcional(
          "cuentas_por_pagar",
          supabase
            .from("cuentas_por_pagar")
            .select(
              "id, folio, beneficiario_nombre, concepto, monto_total, monto_pagado, saldo, fecha_vencimiento",
            )
            .eq("company_id", companyId)
            .in("estatus", ["pendiente", "parcial"])
            .order("fecha_vencimiento", { ascending: true, nullsFirst: false }),
        )
      : Promise.resolve(null);

    const tesoreriaPromise = isAdmin
      ? consultaOpcional(
          "cuentas",
          supabase
            .from("cuentas")
            .select("saldo_actual")
            .eq("company_id", companyId)
            .eq("activa", true),
        )
      : Promise.resolve(null);

    const obrasRes = isDirector
      ? await supabase
          .from("obras")
          .select(camposObra)
          .eq("company_id", companyId)
          .order("created_at", { ascending: false })
      : await supabase
          .from("obras")
          .select(`${camposObra}, obra_team!inner(user_id)`)
          .eq("obra_team.user_id", userId)
          .order("created_at", { ascending: false });

    if (obrasRes.error) throw new Error(obrasRes.error.message);
    const obrasRaw = (obrasRes.data ?? []) as any[];
    const obraIds = obrasRaw.map((o) => o.id as string);

    const semanasTodas = ultimasSemanas(data.semanas * 2);
    const semanasPeriodo = semanasTodas.slice(data.semanas);

    const periodo = {
      inicio: semanasPeriodo[0].inicio,
      fin: semanasPeriodo[semanasPeriodo.length - 1].fin,
    };

    // --- Obras y estimado acumulado ---
    let obras: DashboardObra[] = [];
    const estimadoPorObra = new Map<string, number>();
    // Los buckets del periodo se calculan junto con el estimado acumulado:
    // ambos dependen solo de las obras visibles.
    let buckets: Bucket[] = [];

    if (obraIds.length > 0) {
      const [estimacionesRes, bucketsRes] = await Promise.all([
        consultaOpcional(
          "obra_estimaciones",
          supabase.from("obra_estimaciones").select("obra_id, monto_total").in("obra_id", obraIds),
        ),
        calcularBuckets(supabase, obraIds, semanasTodas),
      ]);
      buckets = bucketsRes;

      for (const e of (estimacionesRes ?? []) as Array<{ obra_id: string; monto_total: number }>) {
        estimadoPorObra.set(e.obra_id, (estimadoPorObra.get(e.obra_id) ?? 0) + num(e.monto_total));
      }

      const hoy = hoyISO();
      obras = obrasRaw.map((o) => {
        const contratado = num(o.monto_contratado);
        const estimado = estimadoPorObra.get(o.id) ?? 0;
        return {
          id: o.id,
          nombre: o.nombre,
          cliente: o.cliente?.razon_social ?? null,
          unidad_negocio: o.unidad_negocio?.nombre ?? null,
          monto_contratado: contratado,
          estimado,
          avance: contratado > 0 ? estimado / contratado : null,
          fecha_terminacion: o.fecha_terminacion ?? null,
          activa: !o.fecha_terminacion || o.fecha_terminacion >= hoy,
        };
      });

      // Activas primero; dentro de cada grupo, la de mayor contratado.
      obras.sort((a, b) => {
        if (a.activa !== b.activa) return a.activa ? -1 : 1;
        return b.monto_contratado - a.monto_contratado;
      });
    }

    // --- Serie semanal: periodo actual + periodo anterior en una sola pasada ---
    const serie: DashboardSemana[] = semanasPeriodo.map((s) => ({
      inicio: s.inicio,
      fin: s.fin,
      produccion: 0,
      costo: 0,
      resultado: 0,
    }));
    const porInicio = new Map(serie.map((s) => [s.inicio, s]));
    let produccionAnterior = 0;
    const costosPeriodo = {
      almacen: 0,
      nomina: 0,
      destajos: 0,
      subcontratos: 0,
      rentas: 0,
      gasolinas: 0,
      cajaChica: 0,
    } as Record<CostoCategoria, number>;

    if (obraIds.length > 0) {
      // Una sola pasada de 2N semanas: las primeras N son el periodo anterior y
      // las últimas N el periodo que se muestra.
      for (const b of buckets) {
        if (!porInicio.has(b.inicio)) {
          produccionAnterior += b.produccion;
          continue;
        }
        const costo = totalCostos(b.costos);
        for (const categoria of Object.keys(costosPeriodo) as CostoCategoria[]) {
          costosPeriodo[categoria] += b.costos[categoria];
        }
        const semana = porInicio.get(b.inicio)!;
        semana.produccion = b.produccion;
        semana.costo = costo;
        semana.resultado = b.produccion - costo;
      }
    }

    const produccion = serie.reduce((acc, s) => acc + s.produccion, 0);
    const costo = serie.reduce((acc, s) => acc + s.costo, 0);
    const resultado = produccion - costo;
    const costosTotal = Object.values(costosPeriodo).reduce((acc, v) => acc + v, 0);

    const costos = (Object.keys(costosPeriodo) as CostoCategoria[])
      .map((categoria) => ({
        categoria,
        monto: costosPeriodo[categoria],
        pct: costosTotal > 0 ? (costosPeriodo[categoria] / costosTotal) * 100 : 0,
      }))
      .sort((a, b) => b.monto - a.monto);

    // --- Cuentas por pagar (solo perfiles que las consultan) ---
    let cxp: DashboardCxP | null = null;
    if (puedeVerCxP) {
      const cxpRes = await cxpPromise;

      if (cxpRes) {
        const hoy = hoyISO();
        const items = (cxpRes as any[]).map((row) => {
          const saldo = num(row.saldo ?? num(row.monto_total) - num(row.monto_pagado));
          return {
            id: row.id as string,
            folio: row.folio as string,
            beneficiario: row.beneficiario_nombre as string,
            concepto: row.concepto as string,
            saldo,
            fecha_vencimiento: (row.fecha_vencimiento ?? null) as string | null,
            vencida: Boolean(row.fecha_vencimiento && row.fecha_vencimiento < hoy),
          };
        });

        cxp = {
          total: items.reduce((acc, i) => acc + i.saldo, 0),
          vencido: items.reduce((acc, i) => acc + (i.vencida ? i.saldo : 0), 0),
          vencidas: items.filter((i) => i.vencida).length,
          pendientes: items.length,
          proximos: items.slice(0, 5),
        };
      }
    }

    // --- Saldo en cuentas (solo Dirección y Administración) ---
    let tesoreria: DashboardTesoreria | null = null;
    if (isAdmin) {
      const cuentasRes = await tesoreriaPromise;
      if (cuentasRes) {
        const filas = cuentasRes as Array<{ saldo_actual: number }>;
        tesoreria = {
          total: filas.reduce((acc, c) => acc + num(c.saldo_actual), 0),
          cuentas: filas.length,
        };
      }
    }

    const obrasActivas = obras.filter((o) => o.activa).length;
    const montoContratado = obras.reduce((acc, o) => acc + o.monto_contratado, 0);

    return {
      semanas: data.semanas,
      periodo,
      kpis: {
        obras_activas: obrasActivas,
        obras_total: obras.length,
        monto_contratado: montoContratado,
        produccion,
        costo,
        resultado,
        margen: produccion > 0 ? resultado / produccion : 0,
        costo_sobre_produccion: produccion > 0 ? costo / produccion : null,
        produccion_anterior: produccionAnterior,
        variacion_produccion:
          produccionAnterior > 0 ? (produccion - produccionAnterior) / produccionAnterior : null,
      },
      serie,
      costos,
      obras,
      cxp,
      tesoreria,
    };
  });
