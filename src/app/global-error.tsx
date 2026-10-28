"use client";

import { useEffect } from "react";
import { RotateCw } from "lucide-react";

/**
 * Último recurso: errores del propio root layout. Reemplaza el documento entero,
 * así que usa estilos en línea y no depende de Tailwind ni de las hojas globales.
 */
export default function GlobalError({
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
    <html lang="es">
      <body
        style={{
          font: '14px/1.5 "Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
          background: "oklch(0.99 0 0)",
          color: "oklch(0.18 0.02 250)",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          padding: "1.5rem",
        }}
      >
        <div style={{ width: "100%", maxWidth: "26rem", textAlign: "center" }}>
          <div
            aria-hidden
            style={{
              display: "grid",
              placeItems: "center",
              width: "2.5rem",
              height: "2.5rem",
              margin: "0 auto 1rem",
              borderRadius: "0.5rem",
              background: "oklch(0.28 0.06 255)",
              color: "oklch(0.99 0 0)",
              fontSize: "1.125rem",
              fontWeight: 600,
            }}
          >
            P
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.025em", margin: 0 }}>
            No se pudo cargar la aplicación
          </h1>
          <p style={{ color: "oklch(0.5 0.015 250)", margin: "0.5rem 0 0" }}>
            Algo falló antes de que la interfaz estuviera lista. Recarga para volver a intentarlo.
          </p>
          {error.digest && (
            <p
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                fontSize: "0.75rem",
                color: "oklch(0.5 0.015 250)",
                margin: "0.75rem 0 0",
              }}
            >
              Referencia: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              height: "2.25rem",
              marginTop: "1.5rem",
              padding: "0 1rem",
              borderRadius: "0.375rem",
              border: "1px solid transparent",
              background: "oklch(0.28 0.06 255)",
              color: "oklch(0.99 0 0)",
              font: "inherit",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <RotateCw size={16} aria-hidden />
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
