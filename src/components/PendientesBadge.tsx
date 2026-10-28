"use client";

import { cn } from "@/lib/utils";
import { ContadorLatido } from "@/components/anim/ContadorLatido";

type Props = {
  count: number;
  className?: string;
};

/**
 * Contador de pendientes: círculo rosa, 16 px, truncado a "9+".
 * El texto visible trunca; el nombre accesible lleva la cifra real y su unidad.
 * El rosa es `rose-600`, no `rose-500`, porque el texto de 10 px necesita 4.5:1.
 *
 * Cuando el conteo sube —llega un pendiente por Realtime— el círculo late. Cuando
 * baja porque alguien autorizó, no hay animación: no hay nada nuevo que mirar.
 */
export function PendientesBadge({ count, className }: Props) {
  if (!count || count <= 0) return null;

  return (
    <ContadorLatido
      valor={count}
      className={cn(
        "relative inline-grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold leading-none text-white tabular-nums",
        className,
      )}
    >
      <span aria-hidden>{count > 9 ? "9+" : count}</span>
      <span className="sr-only">{count === 1 ? "1 pendiente" : `${count} pendientes`}</span>
    </ContadorLatido>
  );
}
