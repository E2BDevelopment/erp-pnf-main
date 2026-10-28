"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSessionContext } from "@/lib/api-client/auth.functions";
import { useAuthStore } from "@/stores/auth";

/**
 * Mantiene el store de Zustand en sincronía con la sesión de Supabase.
 *
 * Vive en su propio módulo y se carga en diferido: arrastra `supabase-js`
 * (~55 KB comprimidos) y solo lo necesitan las rutas que leen la sesión. La
 * landing pública no lo monta, así que no paga ese peso ni hidrata un efecto
 * que no tiene nada que sincronizar.
 */
export function AuthSync() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const reset = useAuthStore((s) => s.reset);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (!data.session) {
        reset();
        return;
      }
      try {
        const ctx = await getSessionContext();
        if (!active) return;
        setSession({
          userId: ctx.userId,
          profile: ctx.profile,
          roles: ctx.roles,
        });
        // Si el usuario ya no es director, limpiar cualquier rol asumido persistido.
        if (!ctx.roles.includes("director")) {
          useAuthStore.getState().setAssumedRole(null);
        }
        queryClient.invalidateQueries({ queryKey: ["role_permissions"] });
        queryClient.invalidateQueries({ queryKey: ["dev-switchable-users"] });
        queryClient.invalidateQueries({ queryKey: ["obras"] });
      } catch (error) {
        console.error("session sync failed", error);
        reset();
      }
    };

    setLoading(true);
    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        reset();
        router.refresh();
        return;
      }
      void loadSession().then(() => router.refresh());
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router, queryClient, setSession, reset, setLoading]);

  return null;
}
