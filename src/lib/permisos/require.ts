import type { SupabaseClient } from "@supabase/supabase-js";
import { hasPermission, overridesFromRows } from "./check";
import { isObraAction } from "./catalogo";

// Referencias de servidor: la obra se obtiene del documento persistido, nunca del cliente.
export type PermissionScope = string | { table: string; id: string };

export async function resolvePermissionObra(
  supabase: SupabaseClient,
  scope: PermissionScope,
): Promise<string | null> {
  if (typeof scope === "string") return scope;
  const parents: Record<string, [string, string]> = {
    cotizacion_solicitudes: ["requisicion_id", "requisiciones"],
    cotizacion_paquetes: ["requisicion_id", "requisiciones"],
    obra_destajo_estimaciones: ["destajo_id", "obra_destajos"],
    obra_subcontrato_estimaciones: ["subcontrato_id", "obra_subcontratos"],
    almacen_movimientos_semana: ["semana_id", "almacen_semanas"],
    obra_nomina_renglones: ["nomina_id", "obra_nominas"],
    pagos: ["origen_id", "ordenes_compra"],
  };
  const parent = parents[scope.table];
  const { data, error } = await supabase
    .from(scope.table)
    .select(parent?.[0] ?? "obra_id")
    .eq("id", scope.id)
    .maybeSingle()
    .overrideTypes<Record<string, string | null>, { merge: false }>();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Documento no encontrado o sin acceso");
  if (parent) {
    const parentId = data[parent[0]];
    if (!parentId) throw new Error("El documento no tiene obra asociada");
    return resolvePermissionObra(supabase, { table: parent[1], id: parentId });
  }
  return data.obra_id ?? null;
}

/**
 * Enforcement server-side de permisos por rol.
 * - Lee los roles asociados al usuario autenticado.
 * - Director bypasea sin consultar overrides.
 * - Lanza si el usuario no tiene el permiso.
 */
export async function requirePermission(
  supabase: SupabaseClient,
  userId: string,
  actionKey: string,
  scope?: PermissionScope,
): Promise<void> {
  const obraId = scope ? await resolvePermissionObra(supabase, scope) : null;
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userId)
    .maybeSingle();
  if (pErr) throw new Error(pErr.message);
  if (!profile?.company_id) throw new Error("Sin empresa asignada");

  if (obraId) {
    const { data: obra, error } = await supabase
      .from("obras")
      .select("company_id")
      .eq("id", obraId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!obra || obra.company_id !== profile.company_id)
      throw new Error("Obra no encontrada o sin acceso");
  }

  const { data: roleRows, error: rErr } = await supabase
    .from("user_roles")
    .select("role, custom_role_id")
    .eq("user_id", userId)
    .eq("company_id", profile.company_id);
  if (rErr) throw new Error(rErr.message);
  const roles = (roleRows ?? []).map((r) => r.custom_role_id ?? r.role);

  if (roles.includes("director")) return;

  const { data: permRows, error: qErr } = await supabase
    .from("role_permissions")
    .select("role, action_key, allowed")
    .eq("company_id", profile.company_id);
  if (qErr) throw new Error(qErr.message);
  const overrides = overridesFromRows(permRows ?? []);

  let obraOverrides = new Map<string, boolean>();
  if (obraId && isObraAction(actionKey)) {
    const { data, error } = await supabase
      .from("obra_role_permissions")
      .select("role, action_key, allowed")
      .eq("company_id", profile.company_id)
      .eq("obra_id", obraId);
    if (error) throw new Error(error.message);
    obraOverrides = overridesFromRows(data ?? []);
  }

  if (!hasPermission(actionKey, roles, overrides, obraOverrides)) {
    throw new Error("No tienes permiso para realizar esta acción");
  }
}
