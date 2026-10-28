import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 404 público, con la identidad del producto (monograma "P" + tinta navy).
 * Para una dirección fuera del sistema; dentro de `/app` manda el 404 del shell.
 */
export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <FileQuestion className="mx-auto size-8 text-muted-foreground" aria-hidden />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Página no encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          La dirección que abriste no existe o cambió de lugar.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/">Ir al inicio</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Iniciar sesión</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
