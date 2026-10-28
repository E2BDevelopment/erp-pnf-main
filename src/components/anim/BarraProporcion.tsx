"use client";

import { cn } from "@/lib/utils";

type Props = {
  /** Porcentaje ya calculado, 0–100. Se recorta al rango. */
  pct: number;
  /** Clase de la pista (alto, fondo, ancho). */
  className?: string;
  /** Clase del relleno (color). */
  rellenoClassName?: string;
};

/**
 * Barra de proporción. El `origin-left` es CSS, no GSAP: sin JavaScript la barra
 * ya está en su lugar y, si algo la anima, crece desde la izquierda y no desde
 * el centro.
 *
 * La animación la aplica `useBarrasProporcion` sobre el contenedor, para poder
 * escalonar varias barras hermanas.
 */
export function BarraProporcion({ pct, className, rellenoClassName }: Props) {
  const ancho = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));

  return (
    <div
      className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)}
      role="presentation"
    >
      <div
        data-barra
        className={cn("h-full origin-left rounded-full bg-primary", rellenoClassName)}
        style={{ width: `${ancho}%` }}
      />
    </div>
  );
}
