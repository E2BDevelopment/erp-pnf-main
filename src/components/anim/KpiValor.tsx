"use client";

import { useRef } from "react";
import { formatMXN } from "@/lib/format";
import { gsap, MOTION, MOTION_OK, REDUCED, useGSAP } from "@/lib/anim/gsap";

/** Formateadores estables: si cambian de identidad, el tween se reinicia. */
const FORMATOS = {
  moneda: formatMXN,
  entero: (n: number) => String(Math.round(n)),
} as const;

export type TipoValor = keyof typeof FORMATOS;

type Props = {
  valor: number;
  /** Moneda (por omisión) o conteo entero, como "obras activas". */
  tipo?: TipoValor;
  className?: string;
};

/**
 * Cifra que cuenta hasta su valor.
 *
 * El valor final se renderiza en el HTML —si GSAP no corre (SSR, JS apagado o
 * error), la cifra está y es correcta—; GSAP solo la reescribe mientras cuenta.
 * `tabular-nums` en el contenedor evita que la cifra baile al cambiar de ancho.
 */
export function KpiValor({ valor, tipo = "moneda", className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const formato = FORMATOS[tipo];

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      // Sin animación: se escribe el estado final y no se crea ningún tween.
      mm.add(REDUCED, () => {
        el.textContent = formato(valor);
      });

      mm.add(MOTION_OK, () => {
        const estado = { n: 0 };
        gsap.to(estado, {
          n: valor,
          duration: MOTION.lectura,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = formato(estado.n);
          },
        });
      });

      return () => mm.revert();
    },
    { dependencies: [valor, tipo], revertOnUpdate: true },
  );

  return (
    <span ref={ref} className={className}>
      {formato(valor)}
    </span>
  );
}
