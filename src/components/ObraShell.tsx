"use client";

import { Link, useParams } from "@/lib/navigation";
import { useRef } from "react";
import { useServerFn } from "@/lib/server-fn/client";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, RotateCw } from "lucide-react";
import { getObraDashboard } from "@/lib/api-client/obras.functions";
import { Button } from "@/components/ui/button";
import { gsap, MOTION, MOTION_OK, useGSAP } from "@/lib/anim/gsap";
import { usePathname } from "next/navigation";
import { usePermisos } from "@/hooks/usePermisos";
import { OBRA_MODULE_PERMISSIONS } from "@/lib/permisos/catalogo";

export function ObraShell({ children }: { children: React.ReactNode }) {
  const { obraId } = useParams({ from: "/_authenticated/app/obras/$obraId" });
  const fetchDashboard = useServerFn(getObraDashboard);
  const dashboard = useQuery({
    queryKey: ["obra-dashboard", obraId],
    queryFn: () => fetchDashboard({ data: { obraId } }),
  });
  const obra = dashboard.data?.obra;
  const pathname = usePathname();
  const { can, isLoading: permissionsLoading } = usePermisos(obraId);
  const permission = OBRA_MODULE_PERMISSIONS[pathname.split("/").at(-1) ?? ""];

  // El nombre de la obra llega después del shell: cuando sustituye al
  // esqueleto, entra en vez de aparecer de golpe.
  const raiz = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (dashboard.isPending) return;

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from("[data-obra-cabecera]", {
          autoAlpha: 0,
          y: 4,
          duration: MOTION.entrada,
          ease: "power2.out",
        });
      });
      return () => mm.revert();
    },
    { scope: raiz, dependencies: [dashboard.isPending] },
  );

  return (
    <div ref={raiz} className="flex min-h-full flex-col bg-background">
      <div className="border-b border-border">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 py-2">
          <Link
            to="/app/obras"
            aria-label="Volver a obras"
            title="Volver a obras"
            className="-m-2 grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none md:size-8"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Link>

          <div className="min-w-0 flex-1">
            {dashboard.isPending ? (
              <div className="py-0.5" aria-hidden>
                <div className="h-5 w-48 rounded-md bg-muted motion-safe:animate-pulse" />
              </div>
            ) : dashboard.isError ? (
              <div className="-my-1 flex flex-wrap items-center gap-3">
                <p className="text-sm text-muted-foreground">No se pudo cargar la obra.</p>
                <Button variant="ghost" size="sm" onClick={() => void dashboard.refetch()}>
                  <RotateCw aria-hidden />
                  Reintentar
                </Button>
              </div>
            ) : (
              <div data-obra-cabecera className="min-w-0">
                {/* El encabezado de la página es el módulo; la obra es contexto,
                    no un segundo h1 dentro de la misma pantalla. */}
                <p
                  className="min-w-0 truncate text-base font-semibold tracking-tight sm:text-lg"
                  title={obra?.nombre ?? undefined}
                >
                  {obra?.nombre ?? "Obra"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 pt-4">
        {permission && permissionsLoading ? (
          <p className="text-sm text-muted-foreground">Cargando permisos…</p>
        ) : permission && !can(permission) ? (
          <p role="alert" className="text-sm text-muted-foreground">
            No tienes permiso para consultar este módulo en esta obra.
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
