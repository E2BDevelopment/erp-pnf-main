/**
 * Transición entre secciones: el shell permanece y el contenido avisa que está
 * en camino, en vez de dejar la pantalla anterior congelada sin señal.
 */
export default function AppLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-6">
      <span className="sr-only">Cargando la sección…</span>

      <div className="space-y-2">
        <div className="h-6 w-48 rounded-md bg-muted motion-safe:animate-pulse" />
        <div className="h-4 w-72 rounded-md bg-muted/70 motion-safe:animate-pulse" />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-9 rounded-md bg-muted/60 motion-safe:animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
