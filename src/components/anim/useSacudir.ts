"use client";

import type { RefObject } from "react";
import { gsap, REDUCED, useGSAP } from "@/lib/anim/gsap";

/**
 * Sacudida de error para hojas de captura.
 *
 * El toast dice qué pasó; la sacudida dice **dónde**. Se dispara solo cuando el
 * intento de guardar muere en una validación local (no en cada error de red) y
 * sacude el contenedor de captura, no la pantalla entera.
 *
 * ±4 px, 0.3 s, y con `prefers-reduced-motion` no se crea ningún tween: el toast
 * ya comunica el error por sí solo.
 */
/** Transición inline original de cada sheet, para restaurarla tras la sacudida. */
const transiciones = new WeakMap<HTMLElement, string>();

export function useSacudir(scope: RefObject<HTMLElement | null>) {
  const { contextSafe } = useGSAP({ scope });

  return contextSafe(() => {
    const el = scope.current;
    if (!el) return;
    if (window.matchMedia(REDUCED).matches) return;

    // El panel del sheet trae `transition` de Tailwind (incluye transform): si
    // queda activa, cada frame de la sacudida se interpola otra vez y el
    // movimiento se lava. Se apaga durante el golpe y se restaura al final.
    if (!transiciones.has(el)) transiciones.set(el, el.style.transition);
    el.style.transition = "none";

    gsap.to(el, {
      keyframes: { x: [0, -4, 4, -4, 4, -4, 0], easeEach: "sine.inOut" },
      duration: 0.3,
      overwrite: "auto",
      onComplete: () => {
        el.style.transition = transiciones.get(el) ?? "";
      },
    });
  });
}
