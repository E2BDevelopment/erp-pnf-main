"use client";

import { useRef, type ReactNode } from "react";
import { gsap, MOTION, MOTION_OK, useGSAP } from "@/lib/anim/gsap";

type Props = {
  /** Cifra que se vigila. Late cuando SUBE, nunca cuando baja. */
  valor: number;
  children: ReactNode;
  className?: string;
};

/**
 * Envoltorio que late cuando `valor` sube.
 *
 * No impone aspecto: renderiza un `<span>` y escala ese span, así que el
 * consumidor decide si el que late es un círculo rosa, un contador o un icono.
 * Es la única animación con overshoot del producto, y lo tiene porque el rebote
 * significa algo: acaba de llegar trabajo nuevo.
 */
export function ContadorLatido({ valor, children, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const previo = useRef(valor);

  useGSAP(
    () => {
      const subio = valor > previo.current;
      previo.current = valor;

      const el = ref.current;
      if (!el || !subio) return;

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          el,
          { scale: 0.72 },
          { scale: 1, duration: MOTION.enfasis, ease: "back.out(3)", overwrite: "auto" },
        );
      });

      return () => mm.revert();
    },
    { dependencies: [valor] },
  );

  return (
    <span ref={ref} className={className}>
      {children}
    </span>
  );
}
