"use client";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@/lib/server-fn/client";
import { getMiRolEnObra } from "@/lib/api-client/obra-role.functions";

export function useObraRole(obraId: string | null | undefined) {
  const fetchRole = useServerFn(getMiRolEnObra);
  const q = useQuery({
    queryKey: ["obra-role", obraId],
    queryFn: () => fetchRole({ data: { obraId: obraId as string } }),
    enabled: !!obraId,
  });
  return {
    role: q.data?.role ?? null,
    isResidente: !!q.data?.isResidente,
    isSupervisor: !!q.data?.isSupervisor,
    isDirector: !!q.data?.isDirector,
    isAdministrativo: !!q.data?.isAdministrativo,
    loading: q.isLoading,
  };
}
