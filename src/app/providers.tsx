"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmDialogProvider } from "@/components/ConfirmDialogProvider";
import { LoadingOverlay } from "@/components/LoadingOverlay";

/**
 * El puente de sesión se carga en diferido: solo las rutas que leen la sesión
 * lo necesitan. Importarlo aquí directamente metía `supabase-js` en el bundle
 * de la landing pública, que no tiene sesión que leer.
 */
const AuthSync = dynamic(() => import("@/components/auth-sync").then((m) => m.AuthSync), {
  ssr: false,
});

const RUTAS_CON_SESION = ["/login", "/onboarding"];

function AuthSyncGate() {
  const pathname = usePathname();
  const necesitaSesion = pathname.startsWith("/app") || RUTAS_CON_SESION.includes(pathname);
  return necesitaSesion ? <AuthSync /> : null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <ConfirmDialogProvider>
          <AuthSyncGate />
          {children}
          <LoadingOverlay />
          <Toaster />
        </ConfirmDialogProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
