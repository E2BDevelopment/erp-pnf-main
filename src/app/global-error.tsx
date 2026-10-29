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
          background: "#f9fafb",
          color: "#20252b",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          padding: "1.5rem",
        }}
      >
        <div style={{ width: "100%", maxWidth: "26rem", textAlign: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/img/icon-1.png"
            alt="Logo ERP PNF"
            width={40}
            height={40}
            style={{
              width: "2.5rem",
              height: "2.5rem",
              margin: "0 auto 1rem",
              borderRadius: "0.5rem",
              objectFit: "contain",
              display: "block",
            }}
          />
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.025em", margin: 0 }}>
            No se pudo cargar la aplicación
          </h1>
          <p style={{ color: "#5f6773", margin: "0.5rem 0 0" }}>
            Algo falló antes de que la interfaz estuviera lista. Recarga para volver a intentarlo.
          </p>
          {error.digest && (
            <p
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                fontSize: "0.75rem",
                color: "#5f6773",
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
              background: "#f47721",
              color: "#20252b",
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
