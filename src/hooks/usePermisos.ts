"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@/lib/server-fn/client";
import { listRolePermissions } from "@/lib/api-client/permisos.functions";
import { hasPermission, overridesFromRows } from "@/lib/permisos/check";
import { useEffectiveRoles, useRealIsDirector } from "@/stores/auth";
import { useParams } from "next/navigation";
import { isObraAction } from "@/lib/permisos/catalogo";

/**
 * Fuente de verdad en cliente para permisos por rol.
 * `can(actionKey)` evalúa contra los roles de la sesión.
 */
export function usePermisos(explicitObraId?: string) {
  const params = useParams();
  const obraId = explicitObraId ?? (typeof params?.obraId === "string" ? params.obraId : undefined);
  const listFn = useServerFn(listRolePermissions);
  const roles = useEffectiveRoles();
  const isDirector = useRealIsDirector();
  const rolesKey = roles.slice().sort().join("|") || "none";

  const q = useQuery({
    queryKey: ["role_permissions", rolesKey, obraId ?? "empresa"],
    queryFn: () => listFn({ data: { obraId } }),
    staleTime: 0,
  });

  const overrides = useMemo(() => {
    const items =
      (
        q.data as
          { items?: Array<{ role: string; action_key: string; allowed: boolean }> } | undefined
      )?.items ?? [];
    return overridesFromRows(items);
  }, [q.data]);

  const obraOverrides = useMemo(() => overridesFromRows(q.data?.obra_items ?? []), [q.data]);

  const can = useMemo(() => {
    return (actionKey: string) => {
      if (!roles.includes("director") && (q.data === undefined || q.isError)) return false;
      return hasPermission(
        actionKey,
        q.data?.permission_roles ?? roles,
        overrides,
        isObraAction(actionKey) ? obraOverrides : undefined,
      );
    };
  }, [roles, overrides, obraOverrides, q.data, q.isError]);

  return { can, isDirector, isLoading: q.isLoading };
}
