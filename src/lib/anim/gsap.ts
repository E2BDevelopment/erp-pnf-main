/**
 * Punto único de entrada a GSAP.
 *
 * Todo el movimiento del producto pasa por aquí para que las duraciones, los
 * eases y el respeto a `prefers-reduced-motion` no se reinventen componente por
 * componente. Ver `docs/animacion-gsap.md`.
 *
 * Reglas de la casa (DESIGN.md):
 * - Solo `transform` y `opacity`. Nunca `width`, `height`, `top` ni `left`.
 * - Nada de `elastic` ni `bounce` en el chrome; el único overshoot admitido es
 *   `back.out` en los contadores que anuncian que llegó algo.
 * - Ninguna animación supera los 700 ms.
 */
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Flip } from "gsap/Flip";

// Idempotente: registra el hook para que useGSAP funcione como plugin. Flip se
// registra uno por uno; anima cambios de posición con transform, que es la otra
// mitad de la regla "solo transform y opacity".
gsap.registerPlugin(useGSAP, Flip);

// Defaults globales. `entrada` es el valor por omisión de todo el producto.
gsap.defaults({ duration: 0.28, ease: "power2.out" });

/**
 * Duraciones del vocabulario de movimiento. `micro` pertenece a CSS (hover,
 * foco, cambio de color a 150 ms); no se usa con GSAP.
 */
export const MOTION = {
  micro: 0.15,
  entrada: 0.28,
  lectura: 0.6,
  enfasis: 0.34,
} as const;

/** Usuario que pidió menos movimiento: se escribe el estado final, sin tween. */
export const REDUCED = "(prefers-reduced-motion: reduce)";

/**
 * Complemento de `REDUCED`, para registrar la rama animada.
 * Sintaxis de media query válida: `not all and (prefers-reduced-motion: reduce)`.
 */
export const MOTION_OK = `not all and ${REDUCED}`;

/**
 * Tope de elementos escalonados. `DESIGN.md` es denso por defecto: escalonar
 * una tabla de 40 renglones son 0.8 s de filas entrando y rompe la lectura.
 */
export const MAX_STAGGER = 8;

export { gsap, useGSAP, Flip };
