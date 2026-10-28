"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { Link } from "@/lib/navigation";
import { useServerFn } from "@/lib/server-fn/client";
import {
  getDashboardEmpresa,
  type DashboardCxP,
  type DashboardData,
  type DashboardObra,
  type DashboardTesoreria,
} from "@/lib/api-client/dashboard.functions";
import { usePendientes } from "@/hooks/usePendientes";
import { usePermisos } from "@/hooks/usePermisos";
import { useEffectiveIsDirector, useEffectiveRoles } from "@/stores/auth";
import { formatMXN } from "@/lib/format";
import { formatRangoSemana } from "@/lib/estimacion-utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PendientesBadge } from "@/components/PendientesBadge";
import { KpiValor } from "@/components/anim/KpiValor";
import { BarraProporcion } from "@/components/anim/BarraProporcion";
import { useBarrasProporcion } from "@/components/anim/useBarrasProporcion";
import { useStagger } from "@/components/anim/useStagger";
import { gsap, MOTION, MOTION_OK, useGSAP } from "@/lib/anim/gsap";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  ClipboardList,
  Coins,
  FileText,
  Fuel,
  HardHat,
  Plus,
  Receipt,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

const PERIODOS = [4, 8, 12] as const;

/**
 * La gráfica carga fuera del paquete inicial: `recharts` pesa más que el resto
 * del panel junto. El hueco que deja es del mismo alto que la gráfica, así que
 * el panel no se mueve cuando llega.
 */
const ProduccionGastoChart = dynamic(
  () => import("@/components/dashboard/ProduccionGastoChart").then((m) => m.ProduccionGastoChart),
  {
    ssr: false,
    loading: () => <div className="mt-3 h-[240px] w-full sm:h-[280px]" aria-hidden />,
  },
);

/** Referencias estables para no recrear los contadores en cada render. */
const SIN_CONTEO: Record<string, number> = {};
const SIN_CONTEO_POR_OBRA: Record<string, Record<string, number>> = {};

const CATEGORIA_LABELS: Record<string, string> = {
  almacen: "Almacén",
  nomina: "Nómina",
  destajos: "Destajos",
  subcontratos: "Subcontratos",
  rentas: "Rentas",
  gasolinas: "Gasolinas",
  cajaChica: "Caja chica",
};

type FilaPendiente = {
  key: string;
  label: string;
  count: number;
  to: string;
  icon: LucideIcon;
};

const MODULOS_PENDIENTES: Array<Omit<FilaPendiente, "count"> & { moduleKey: string }> = [
  {
    key: "requisiciones",
    moduleKey: "requisiciones",
    label: "Requisiciones por autorizar",
    to: "/app/admin/requisiciones",
    icon: ClipboardList,
  },
  {
    key: "cuentas-por-pagar",
    moduleKey: "cuentas-por-pagar",
    label: "Cuentas por pagar",
    to: "/app/admin/cuentas-por-pagar",
    icon: FileText,
  },
  {
    key: "nomina",
    moduleKey: "nomina",
    label: "Nóminas cerradas por pagar",
    to: "/app/admin/nomina",
    icon: Users,
  },
  {
    key: "caja-chica",
    moduleKey: "caja-chica",
    label: "Caja chica",
    to: "/app/admin/caja-chica",
    icon: Coins,
  },
  {
    key: "gasolinas",
    moduleKey: "gasolinas",
    label: "Vales de gasolina",
    to: "/app/admin/gasolinas",
    icon: Fuel,
  },
  {
    key: "gastos-oficina",
    moduleKey: "gastos-oficina",
    label: "Gastos de oficina",
    to: "/app/admin/gastos-oficina",
    icon: Receipt,
  },
  {
    key: "rentas",
    moduleKey: "rentas",
    label: "Rentas solicitadas",
    to: "/app/admin/rentas",
    icon: Truck,
  },
];

// ============================================================
// Helpers de presentación
// ============================================================

function fechaCorta(fecha: string): string {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });
}

function etiquetaSemana(inicio: string): string {
  return fechaCorta(inicio);
}

// ============================================================
// Pantalla
// ============================================================

export function DashboardModule() {
  const [semanas, setSemanas] = useState<number>(8);

  const fetchDashboard = useServerFn(getDashboardEmpresa);
  const roles = useEffectiveRoles();
  const esDirector = useEffectiveIsDirector();
  const esAdmin = esDirector || roles.includes("administrativo");

  const q = useQuery({
    queryKey: ["dashboard-empresa", semanas],
    queryFn: () => fetchDashboard({ data: { semanas } }),
    // Al cambiar el periodo se conserva el panel anterior mientras llega el nuevo.
    placeholderData: keepPreviousData,
  });

  const pendientesQ = usePendientes();
  const adminCounts = pendientesQ.data?.admin ?? SIN_CONTEO;
  const obraCounts = pendientesQ.data?.obras ?? SIN_CONTEO_POR_OBRA;

  const data = q.data;

  const filasPendientes = useMemo<FilaPendiente[]>(() => {
    if (!data) return [];
    if (esAdmin) {
      return MODULOS_PENDIENTES.map((m) => ({
        key: m.key,
        label: m.label,
        to: m.to,
        icon: m.icon,
        count: adminCounts[m.moduleKey] ?? 0,
      })).filter((f) => f.count > 0);
    }
    return data.obras
      .map((obra) => {
        const counts = obraCounts[obra.id] ?? {};
        const count = Object.values(counts).reduce((acc, n) => acc + (n ?? 0), 0);
        return {
          key: obra.id,
          label: obra.nombre,
          count,
          to: `/app/obras/${obra.id}`,
          icon: HardHat as LucideIcon,
        };
      })
      .filter((f) => f.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [data, esAdmin, adminCounts, obraCounts]);

  /**
   * Relevo esqueleto → contenido: los paneles entran cuando llegan los datos,
   * en vez de sustituirse en el mismo frame. `gsap.from` (no `fromTo`) deja el
   * contenido visible si GSAP no llega a correr.
   */
  const raiz = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (q.isLoading || !data) return;

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from("[data-panel]", {
          autoAlpha: 0,
          y: 4,
          duration: MOTION.entrada,
          ease: "power2.out",
          stagger: 0.04,
        });
      });
      return () => mm.revert();
    },
    { scope: raiz, dependencies: [q.isLoading] },
  );

  /** Las barras de "En qué se fue el gasto" crecen en orden: la proporción se lee. */
  const barrasGasto = useRef<HTMLUListElement>(null);
  useBarrasProporcion(barrasGasto, data?.kpis.costo ?? 0);

  return (
    <div ref={raiz} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {data
              ? `${formatRangoSemana(data.periodo.inicio, data.periodo.fin)} · producción y gasto al corte de hoy; la semana en curso sigue en captura.`
              : "Producción, gasto y pendientes de la operación."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">Periodo</span>
          <ToggleGroup
            type="single"
            size="sm"
            value={String(semanas)}
            onValueChange={(valor) => {
              if (valor) setSemanas(Number(valor));
            }}
            aria-label="Semanas del periodo"
          >
            {PERIODOS.map((p) => (
              <ToggleGroupItem
                key={p}
                value={String(p)}
                className="px-2.5 text-xs"
                aria-label={`Últimas ${p} semanas`}
              >
                {p} sem
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      {q.isLoading ? (
        <DashboardSkeleton />
      ) : q.isError || !data ? (
        <Card className="p-10 text-center">
          <AlertCircle className="mx-auto size-8 text-destructive" />
          <p className="mt-3 font-medium">No se pudo cargar el dashboard</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {q.error instanceof Error
              ? q.error.message
              : "Revisa tu conexión e inténtalo de nuevo."}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => void q.refetch()}>
            Reintentar
          </Button>
        </Card>
      ) : data.obras.length === 0 ? (
        <SinObras />
      ) : (
        <>
          <div
            data-panel
            className={`grid gap-3 sm:grid-cols-2 ${
              esAdmin && data.cxp ? "xl:grid-cols-5" : "xl:grid-cols-4"
            }`}
          >
            <KpiObras data={data} />
            <KpiProduccion data={data} />
            <KpiGasto data={data} />
            <KpiResultado data={data} />
            {esAdmin && data.cxp && <KpiPorPagar cxp={data.cxp} />}
          </div>

          <div data-panel className="grid gap-4 lg:grid-cols-3">
            <Card className="p-4 lg:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-medium">Producción vs. gasto</h2>
                  <p className="text-xs text-muted-foreground">
                    Semana por semana, sumando todas las obras del periodo.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-sm bg-primary" aria-hidden />
                    Producción
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-sm bg-destructive" aria-hidden />
                    Gasto
                  </span>
                </div>
              </div>

              {data.serie.every((s) => s.produccion === 0 && s.costo === 0) ? (
                <p className="grid h-[240px] place-items-center text-sm text-muted-foreground sm:h-[280px]">
                  Sin producción ni gasto registrados en el periodo.
                </p>
              ) : (
                <ProduccionGastoChart serie={data.serie} />
              )}

              {/* Alternativa textual de la gráfica para lectores de pantalla. */}
              <div className="sr-only">
                <table>
                  <caption>Producción y gasto por semana</caption>
                  <thead>
                    <tr>
                      <th scope="col">Semana</th>
                      <th scope="col">Producción</th>
                      <th scope="col">Gasto</th>
                      <th scope="col">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.serie.map((semana) => (
                      <tr key={semana.inicio}>
                        <th scope="row">{etiquetaSemana(semana.inicio)}</th>
                        <td>{formatMXN(semana.produccion)}</td>
                        <td>{formatMXN(semana.costo)}</td>
                        <td>{formatMXN(semana.resultado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-medium">En qué se fue el gasto</h2>
                  <p className="text-xs text-muted-foreground">Categorías del periodo.</p>
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {formatMXN(data.kpis.costo)}
                </span>
              </div>

              {data.costos.every((c) => c.monto === 0) ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Sin gasto registrado en el periodo.
                </p>
              ) : (
                <ul ref={barrasGasto} className="mt-3 space-y-3">
                  {data.costos
                    .filter((c) => c.monto > 0)
                    .map((c) => (
                      <li key={c.categoria}>
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="truncate">
                            {CATEGORIA_LABELS[c.categoria] ?? c.categoria}
                          </span>
                          <span className="tabular-nums font-medium">{formatMXN(c.monto)}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <BarraProporcion className="flex-1" pct={c.pct} />
                          <span className="w-9 text-right text-[11px] tabular-nums text-muted-foreground">
                            {c.pct.toFixed(0)}%
                          </span>
                        </div>
                      </li>
                    ))}
                </ul>
              )}

              <p className="mt-auto pt-4 text-[11px] leading-snug text-muted-foreground">
                El gasto incluye almacén consumido, nómina, destajos, subcontratos, rentas,
                gasolinas y caja chica. Las rentas se prorratean por día.
              </p>
            </Card>
          </div>

          <CarteraTable obras={data.obras} pendientes={obraCounts} />

          <div data-panel className={`grid gap-4 ${esAdmin && data.cxp ? "lg:grid-cols-2" : ""}`}>
            <PendientesPanel
              titulo={esAdmin ? "Espera visto bueno" : "Pendientes en tus obras"}
              descripcion={
                esAdmin
                  ? "Documentos que no avanzan hasta que alguien los autorice."
                  : "Lo que tienes por capturar o corregir en cada obra."
              }
              filas={filasPendientes}
              vacio={
                esAdmin
                  ? "Nada espera autorización. Todo al día."
                  : "No tienes pendientes de captura en tus obras."
              }
              cargando={pendientesQ.isLoading}
              error={pendientesQ.isError}
              onRetry={() => void pendientesQ.refetch()}
            />

            {esAdmin && data.cxp && <CxPPanel cxp={data.cxp} tesoreria={data.tesoreria} />}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// KPIs
// ============================================================

function KpiCard({
  label,
  value,
  hint,
  tono,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tono?: "positivo" | "negativo";
}) {
  return (
    <Card className="p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-semibold tracking-tight tabular-nums ${
          tono === "positivo"
            ? "text-emerald-700 dark:text-emerald-400"
            : tono === "negativo"
              ? "text-rose-700 dark:text-rose-400"
              : ""
        }`}
      >
        {value}
      </p>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </Card>
  );
}

function KpiObras({ data }: { data: DashboardData }) {
  const { obras_activas, obras_total, monto_contratado } = data.kpis;
  return (
    <KpiCard
      label="Obras activas"
      value={<KpiValor valor={obras_activas} tipo="entero" />}
      hint={`${obras_total} en cartera · ${formatMXN(monto_contratado)} contratado`}
    />
  );
}

function KpiProduccion({ data }: { data: DashboardData }) {
  const variacion = data.kpis.variacion_produccion;
  return (
    <KpiCard
      label="Producción del periodo"
      value={<KpiValor valor={data.kpis.produccion} />}
      hint={
        variacion === null ? (
          <span>Sin periodo anterior para comparar</span>
        ) : (
          <span className="inline-flex flex-wrap items-center gap-1">
            {variacion >= 0 ? (
              <ArrowUpRight className="size-3.5 text-emerald-600" aria-hidden />
            ) : (
              <ArrowDownRight className="size-3.5 text-rose-600" aria-hidden />
            )}
            <span
              className={
                variacion >= 0
                  ? "font-medium text-emerald-700 dark:text-emerald-400"
                  : "font-medium text-rose-700 dark:text-rose-400"
              }
            >
              {Math.abs(variacion * 100).toFixed(1)}%
            </span>
            vs. periodo anterior
          </span>
        )
      }
    />
  );
}

function KpiGasto({ data }: { data: DashboardData }) {
  const pct = data.kpis.costo_sobre_produccion;
  return (
    <KpiCard
      label="Gasto del periodo"
      value={<KpiValor valor={data.kpis.costo} />}
      hint={
        pct === null ? "Sin producción registrada" : `${(pct * 100).toFixed(1)}% de la producción`
      }
    />
  );
}

function KpiResultado({ data }: { data: DashboardData }) {
  const { resultado, margen, produccion } = data.kpis;
  const positivo = resultado >= 0;
  return (
    <KpiCard
      label={positivo ? "Utilidad del periodo" : "Pérdida del periodo"}
      value={<KpiValor valor={resultado} />}
      tono={positivo ? "positivo" : "negativo"}
      hint={
        produccion > 0
          ? `Margen ${(margen * 100).toFixed(1)}% sobre producción`
          : "Sin producción en el periodo"
      }
    />
  );
}

function KpiPorPagar({ cxp }: { cxp: DashboardCxP }) {
  return (
    <KpiCard
      label="Por pagar"
      value={<KpiValor valor={cxp.total} />}
      hint={
        cxp.vencidas > 0 ? (
          <span className="font-medium text-rose-700 dark:text-rose-400">
            {cxp.vencidas} vencida{cxp.vencidas === 1 ? "" : "s"} · {formatMXN(cxp.vencido)}
          </span>
        ) : (
          `${cxp.pendientes} documento${cxp.pendientes === 1 ? "" : "s"} abierto${
            cxp.pendientes === 1 ? "" : "s"
          } · nada vencido`
        )
      }
    />
  );
}

// ============================================================
// Cartera de obras
// ============================================================

function CarteraTable({
  obras,
  pendientes,
}: {
  obras: DashboardObra[];
  pendientes: Record<string, Record<string, number>>;
}) {
  const totalContratado = obras.reduce((acc, o) => acc + o.monto_contratado, 0);
  const totalEstimado = obras.reduce((acc, o) => acc + o.estimado, 0);

  /** Las barras de avance crecen al entrar la cartera; las filas no se escalonan. */
  const barrasAvance = useRef<HTMLTableSectionElement>(null);
  useBarrasProporcion(barrasAvance, obras.length);

  return (
    <Card data-panel className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-medium">Cartera de obras</h2>
          <p className="text-xs text-muted-foreground">
            Presupuesto autorizado contra lo estimado a la fecha.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/app/obras">
            Ver obras <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th scope="col" className="px-4 py-2 font-medium">
                Obra
              </th>
              <th scope="col" className="hidden px-4 py-2 text-right font-medium md:table-cell">
                Contratado
              </th>
              <th scope="col" className="hidden px-4 py-2 text-right font-medium sm:table-cell">
                Estimado
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Avance
              </th>
              <th scope="col" className="px-4 py-2 text-right font-medium">
                Pend.
              </th>
            </tr>
          </thead>
          <tbody ref={barrasAvance}>
            {obras.map((obra) => {
              const counts = pendientes[obra.id] ?? {};
              const totalPendientes = Object.values(counts).reduce((acc, n) => acc + (n ?? 0), 0);
              return (
                <tr
                  key={obra.id}
                  className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                >
                  <td className="max-w-[280px] px-4 py-2.5">
                    <Link
                      to="/app/obras/$obraId"
                      params={{ obraId: obra.id }}
                      title={obra.nombre}
                      className="block truncate font-medium underline-offset-4 hover:underline"
                    >
                      {obra.nombre}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {obra.cliente ?? "Sin cliente"}
                      {obra.unidad_negocio ? ` · ${obra.unidad_negocio}` : ""}
                      {!obra.activa ? " · Terminada" : ""}
                    </p>
                  </td>
                  <td className="hidden px-4 py-2.5 text-right tabular-nums md:table-cell">
                    {obra.monto_contratado > 0 ? formatMXN(obra.monto_contratado) : "—"}
                  </td>
                  <td className="hidden px-4 py-2.5 text-right tabular-nums sm:table-cell">
                    {formatMXN(obra.estimado)}
                  </td>
                  <td className="px-4 py-2.5">
                    <Avance obra={obra} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {totalPendientes > 0 ? (
                      <PendientesBadge count={totalPendientes} className="inline-grid" />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-muted/30 text-xs">
              <td className="px-4 py-2 font-medium">Total</td>
              <td className="hidden px-4 py-2 text-right font-medium tabular-nums md:table-cell">
                {formatMXN(totalContratado)}
              </td>
              <td className="hidden px-4 py-2 text-right font-medium tabular-nums sm:table-cell">
                {formatMXN(totalEstimado)}
              </td>
              <td className="px-4 py-2 text-muted-foreground">
                {totalContratado > 0
                  ? `${((totalEstimado / totalContratado) * 100).toFixed(1)}% global`
                  : "Sin presupuesto"}
              </td>
              <td className="px-4 py-2" />
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

function Avance({ obra }: { obra: DashboardObra }) {
  if (obra.avance === null) {
    return <span className="text-xs text-muted-foreground">Sin presupuesto autorizado</span>;
  }
  const pct = obra.avance * 100;
  const excedido = pct > 100;
  return (
    <div className="flex items-center gap-2">
      <BarraProporcion
        className="w-16 sm:w-24"
        pct={pct}
        rellenoClassName={excedido ? "bg-rose-600" : "bg-primary"}
      />
      <span
        className={`w-11 text-right text-xs tabular-nums ${
          excedido ? "font-medium text-rose-700 dark:text-rose-400" : "text-muted-foreground"
        }`}
      >
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

// ============================================================
// Pendientes
// ============================================================

function PendientesPanel({
  titulo,
  descripcion,
  filas,
  vacio,
  cargando,
  error,
  onRetry,
}: {
  titulo: string;
  descripcion: string;
  filas: FilaPendiente[];
  vacio: string;
  cargando: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  const total = filas.reduce((acc, f) => acc + f.count, 0);

  /** Cada pendiente es una decisión: la lista entra escalonada, no la tabla. */
  const listaPendientes = useRef<HTMLUListElement>(null);
  // `cargando` es la señal de montaje: la lista sustituye al esqueleto.
  useStagger(listaPendientes, "[data-fila-pendiente]", [filas.length, cargando]);

  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">{titulo}</h2>
          <p className="text-xs text-muted-foreground">{descripcion}</p>
        </div>
        {total > 0 && (
          <span className="shrink-0 text-xs text-muted-foreground">
            <span className="text-sm font-semibold tabular-nums text-foreground">{total}</span> en
            total
          </span>
        )}
      </div>

      {error ? (
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">No se pudieron cargar los pendientes.</p>
          {onRetry && (
            <Button variant="ghost" size="sm" className="mt-1" onClick={onRetry}>
              Reintentar
            </Button>
          )}
        </div>
      ) : cargando ? (
        <div className="mt-3 space-y-2" aria-hidden>
          <div className="h-8 rounded-md bg-muted/60 motion-safe:animate-pulse" />
          <div className="h-8 rounded-md bg-muted/60 motion-safe:animate-pulse" />
        </div>
      ) : filas.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{vacio}</p>
      ) : (
        <ul ref={listaPendientes} className="mt-2 flex-1 divide-y divide-border">
          {filas.map((fila) => {
            const Icon = fila.icon;
            return (
              <li key={fila.key} data-fila-pendiente>
                <Link
                  to={fila.to}
                  className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1 text-sm">{fila.label}</span>
                  <PendientesBadge count={fila.count} />
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// ============================================================
// Cuentas por pagar
// ============================================================

function CxPPanel({ cxp, tesoreria }: { cxp: DashboardCxP; tesoreria: DashboardTesoreria | null }) {
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Cuentas por pagar</h2>
          <p className="text-xs text-muted-foreground">
            {cxp.pendientes === 1 ? "1 documento abierto" : `${cxp.pendientes} documentos abiertos`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold tabular-nums">{formatMXN(cxp.total)}</p>
          {cxp.vencidas > 0 && (
            <p className="text-xs font-medium text-rose-700 dark:text-rose-400">
              {cxp.vencidas} vencida{cxp.vencidas === 1 ? "" : "s"} · {formatMXN(cxp.vencido)}
            </p>
          )}
        </div>
      </div>

      {cxp.proximos.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No hay cuentas pendientes de pago.
        </p>
      ) : (
        <ul className="mt-2 flex-1 divide-y divide-border">
          {cxp.proximos.map((item) => (
            <li key={item.id} className="py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 text-sm">{item.beneficiario}</p>
                <p className="shrink-0 text-sm font-medium tabular-nums">{formatMXN(item.saldo)}</p>
              </div>
              <div className="mt-1 flex flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2">
                <p className="min-w-0 text-xs text-muted-foreground">
                  <span className="font-mono">{item.folio}</span> · {item.concepto}
                </p>
                <VencimientoBadge fecha={item.fecha_vencimiento} vencida={item.vencida} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <div className="text-xs text-muted-foreground">
          {tesoreria ? (
            <>
              Saldo en cuentas{" "}
              <span className="font-medium tabular-nums text-foreground">
                {formatMXN(tesoreria.total)}
              </span>{" "}
              ({tesoreria.cuentas} activa{tesoreria.cuentas === 1 ? "" : "s"})
            </>
          ) : (
            <span>El pago se registra en Tesorería.</span>
          )}
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/app/admin/cuentas-por-pagar">
            Ver todas <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function VencimientoBadge({ fecha, vencida }: { fecha: string | null; vencida: boolean }) {
  if (!fecha) {
    return (
      <Badge className="border-0 bg-slate-100 text-[10px] text-slate-700 hover:bg-slate-100">
        Sin fecha
      </Badge>
    );
  }

  const dias = Math.ceil((new Date(fecha + "T12:00:00").getTime() - Date.now()) / 86_400_000);
  const clase = vencida
    ? "bg-rose-100 text-rose-800 hover:bg-rose-100"
    : dias <= 7
      ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
      : "bg-slate-100 text-slate-700 hover:bg-slate-100";

  return (
    <Badge className={`border-0 text-[10px] ${clase}`}>
      {vencida ? "Vencida" : "Vence"} {fechaCorta(fecha)}
    </Badge>
  );
}

// ============================================================
// Estados
// ============================================================

function SinObras() {
  const { can } = usePermisos();
  const puedeCrear = can("obras.crear");

  return (
    <Card className="border-dashed p-10 text-center">
      <HardHat className="mx-auto size-8 text-muted-foreground" aria-hidden />
      <p className="mt-3 font-medium">Todavía no hay obras que mostrar</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {puedeCrear
          ? "Crea la primera obra para empezar a ver producción, gasto y pendientes."
          : "Cuando te asignen a una obra, aquí verás su avance y sus pendientes."}
      </p>
      {puedeCrear && (
        <Button asChild className="mt-4">
          <Link to="/app/obras/nueva">
            <Plus className="size-4" aria-hidden /> Nueva obra
          </Link>
        </Button>
      )}
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-busy="true">
      <span className="sr-only">Cargando el dashboard…</span>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl border border-border bg-card motion-safe:animate-pulse"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-[340px] rounded-xl border border-border bg-card motion-safe:animate-pulse lg:col-span-2" />
        <div className="h-[340px] rounded-xl border border-border bg-card motion-safe:animate-pulse" />
      </div>
      <div className="h-64 rounded-xl border border-border bg-card motion-safe:animate-pulse" />
    </div>
  );
}
