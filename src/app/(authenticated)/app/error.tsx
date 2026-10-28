"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Error de una sección del sistema. Vive dentro de `AppShell`, así que la
 * navegación sigue disponible: el usuario puede reintentar o volver al panel
 * en lugar de quedar varado en una pantalla suelta.
 */
export default function AppError({
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
    <div>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">No se pudo cargar esta sección</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          El resto del sistema sigue disponible. Reintenta o vuelve al panel.
        </p>
      </header>

      <Card className="mt-6 p-6 shadow-none">
        <p className="text-sm text-muted-foreground">
          Puede ser un problema temporal de conexión. Si vuelve a pasar, cierra sesión y entra de
          nuevo.
        </p>
        {error.digest && (
          <p className="mt-4 font-mono text-xs text-muted-foreground">Referencia: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={reset}>
            <RotateCw aria-hidden />
            Reintentar
          </Button>
          <Button variant="outline" asChild>
            <Link href="/app/dashboard">
              <LayoutDashboard aria-hidden />
              Volver al panel
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
