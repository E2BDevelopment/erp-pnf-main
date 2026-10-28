"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Error boundary de las rutas públicas. Reemplaza la pantalla completa, por eso
 * conserva la identidad y ofrece una salida además de reintentar; el mensaje
 * técnico del error no se muestra al usuario.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div
          aria-hidden
          className="mx-auto grid size-10 place-items-center rounded-lg bg-primary text-base font-semibold text-primary-foreground"
        >
          P
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">No se pudo cargar la página</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo falló al abrir esta pantalla. Vuelve a intentarlo; si persiste, entra de nuevo a tu
          cuenta.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-muted-foreground">Referencia: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={reset}>
            <RotateCw aria-hidden />
            Reintentar
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <LayoutDashboard aria-hidden />
              Ir al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
