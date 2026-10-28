"use client";

import { gsap, MAX_STAGGER, MOTION, MOTION_OK, useGSAP } from "@/lib/anim/gsap";
import type { RefObject } from "react";

/**
 * Anima de izquierda a derecha todas las barras `[data-barra]` que viven dentro
 * de `scope`. Se usa `scaleX` sobre un relleno que ya tiene su ancho definido:
 * cero cálculo de layout, solo composición.
 *
 * `clave` reinicia la animación cuando cambian los datos (por ejemplo el periodo
 * del dashboard).
 */
export function useBarrasProporcion(scope: RefObject<HTMLElement | null>, clave: unknown) {
  useGSAP(
    () => {
      if (!scope.current) return;

      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        const barras = gsap.utils.toArray<HTMLElement>("[data-barra]", scope.current);
        if (!barras.length) return;

        // El escalonado total nunca pasa de ~0.5 s, tenga 7 barras o 40.
        const escalonadas = Math.min(barras.length, MAX_STAGGER);

        gsap.from(barras, {
          scaleX: 0,
          duration: MOTION.lectura,
          ease: "power2.out",
          stagger: { amount: escalonadas * 0.06 },
        });
      });

      return () => mm.revert();
    },
    { scope, dependencies: [clave] },
  );
}
