"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatMXN } from "@/lib/format";
import type { DashboardSemana } from "@/lib/api-client/dashboard.functions";

/**
 * Gráfica de producción contra gasto. Vive en su propio módulo para que
 * `recharts` (~100 KB comprimidos) se cargue después del panel y no antes:
 * la primera pantalla del dashboard no depende de ella.
 */
export function ProduccionGastoChart({ serie }: { serie: DashboardSemana[] }) {
  return (
    <ChartContainer
      config={{
        produccion: { label: "Producción", color: "var(--color-primary)" },
        gasto: { label: "Gasto", color: "var(--color-destructive)" },
      }}
      className="mt-3 h-[240px] w-full sm:h-[280px]"
    >
      <BarChart
        data={serie.map((s) => ({
          semana: new Date(s.inicio + "T12:00:00").toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
          }),
          produccion: s.produccion,
          gasto: s.costo,
        }))}
        barGap={2}
        margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="semana"
          tickLine={false}
          axisLine={false}
          minTickGap={16}
          interval="preserveStartEnd"
        />
        <YAxis tickFormatter={monedaCompacta} tickLine={false} axisLine={false} width={52} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <span>
                  <span className="text-muted-foreground mr-2">
                    {name === "produccion" ? "Producción" : "Gasto"}:
                  </span>
                  {formatMXN(Number(value))}
                </span>
              )}
            />
          }
        />
        <Bar dataKey="produccion" fill="var(--color-produccion)" radius={4} maxBarSize={28} />
        <Bar dataKey="gasto" fill="var(--color-gasto)" radius={4} maxBarSize={28} />
      </BarChart>
    </ChartContainer>
  );
}

function monedaCompacta(valor: number): string {
  const n = Number(valor) || 0;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}
