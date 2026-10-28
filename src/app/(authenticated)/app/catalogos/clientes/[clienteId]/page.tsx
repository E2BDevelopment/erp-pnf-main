"use client";

import { useParams } from "@/lib/navigation";
import { CatalogoClientesModule } from "@/components/clientes/CatalogoClientesModule";

export default function ClienteDeepLinkPage() {
  const { clienteId } = useParams<{ clienteId: string }>();
  return <CatalogoClientesModule initialClienteId={clienteId} />;
}
