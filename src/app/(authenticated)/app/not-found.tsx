import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 404 dentro del sistema: conserva la navegación para que una dirección mal
 * escrita no saque al usuario de la aplicación.
 */
export default function AppNotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <FileQuestion className="mx-auto size-8 text-muted-foreground" aria-hidden />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Esta sección no existe</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        La dirección no corresponde a ningún módulo del sistema.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/app/dashboard">Volver al panel</Link>
      </Button>
    </div>
  );
}
