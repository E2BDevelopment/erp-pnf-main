"use client";

import type { RefObject } from "react";
import { gsap, MAX_STAGGER, MOTION, MOTION_OK, useGSAP } from "@/lib/anim/gsap";

/**
 * Entrada escalonada de los elementos que coinciden con `selector` dentro de
 * `scope`. Pensado para **listas de decisión** —pendientes, avisos, tarjetas de
 * obra—, donde cada ítem pide una lectura. No para tablas de datos: ahí el
 * escalonado rompe la comparación en columna (ver `docs/animacion-gsap.md`).
 *
 * `deps` decide cuándo volver a animar. Hay que incluir la señal de montaje
 * cuando la lista vive en un portal que aparece y desaparece: si solo se pasa
 * el número de ítems, al abrir un popover con datos ya cargados no cambia nada
 * y la animación nunca corre.
 *
 * El escalonado total está topado por `MAX_STAGGER`, así que una lista de 40
 * ítems no se convierte en una cascada de un segundo.
 */
export function useStagger(
  scope: RefObject<HTMLElement | null>,
  selector: string,
  deps: unknown[] = [],
) {
  useGSAP(
    () => {
      if (!scope.current) return;

      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        const items = gsap.utils.toArray<HTMLElement>(selector, scope.current);
        if (!items.length) return;

        gsap.from(items, {
          autoAlpha: 0,
          y: 4,
          duration: MOTION.entrada,
          ease: "power2.out",
          stagger: { amount: Math.min(items.length, MAX_STAGGER) * 0.03 },
        });
      });

      return () => mm.revert();
    },
    { scope, dependencies: deps },
  );
}
