"use client";

import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { gsap, MOTION, MOTION_OK, useGSAP } from "@/lib/anim/gsap";

interface ModulePlaceholderProps {
  title: string;
  description?: string;
  badge?: string;
  /** Icono del estado. Por defecto, el de módulo en construcción. */
  icon?: LucideIcon;
  /** Título del estado. Por defecto, "Próximamente". */
  stateTitle?: string;
  /** Explicación del estado. Por defecto, la de módulo aún no construido. */
  stateDescription?: string;
  /** Acción de recuperación al pie del estado. */
  action?: React.ReactNode;
}

export function ModulePlaceholder({
  title,
  description,
  badge,
  icon: Icon = Construction,
  stateTitle = "Próximamente",
  stateDescription = "Todavía no está disponible. Lo estamos construyendo.",
  action,
}: ModulePlaceholderProps) {
  // Un estado vacío no debe entrar de golpe: el encabezado y la tarjeta se
  // componen en orden, una sola vez.
  const raiz = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from("[data-entrada]", {
          autoAlpha: 0,
          y: 4,
          duration: MOTION.entrada,
          ease: "power2.out",
          stagger: 0.03,
        });
      });
      return () => mm.revert();
    },
    { scope: raiz },
  );

  return (
    <div ref={raiz} className="flex flex-col gap-6">
      <header data-entrada className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {badge && <Badge variant="secondary">{badge}</Badge>}
      </header>

      <Card data-entrada className="border-dashed border-border bg-muted/30 shadow-none">
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <Icon className="size-8 text-muted-foreground" aria-hidden />
          <h2 className="text-base font-semibold text-foreground">{stateTitle}</h2>
          <p className="max-w-md text-sm text-muted-foreground">{stateDescription}</p>
          {action && <div className="mt-2">{action}</div>}
        </div>
      </Card>
    </div>
  );
}
