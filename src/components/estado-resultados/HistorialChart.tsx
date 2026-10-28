"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatMXN } from "@/lib/format";

export type PuntoHistorial = {
  /** Etiqueta ya resuelta por el módulo ("S3" o "03-14"). */
  semana: string;
  produccion: number;
  costos: number;
};

/**
 * Histórico de ocho semanas del estado de resultados. Módulo aparte para que
 * `recharts` no entre en el paquete inicial de la ruta: la tabla y el
 * acumulado se leen sin esperar la gráfica.
 */
export function HistorialChart({ datos }: { datos: PuntoHistorial[] }) {
  return (
    <ChartContainer
      config={{
        produccion: { label: "Producción", color: "var(--color-primary)" },
        costos: { label: "Costos", color: "var(--color-destructive)" },
      }}
      className="h-[220px] w-full"
    >
      <BarChart data={datos}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="semana" tickLine={false} axisLine={false} />
        <YAxis
          tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`}
          tickLine={false}
          axisLine={false}
          width={50}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <span>
                  <span className="text-muted-foreground mr-2">
                    {name === "produccion" ? "Producción" : "Costos"}:
                  </span>
                  {formatMXN(Number(value))}
                </span>
              )}
            />
          }
        />
        <Bar dataKey="produccion" fill="var(--color-produccion)" radius={4} />
        <Bar dataKey="costos" fill="var(--color-costos)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
