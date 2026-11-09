import { createServerFn } from "@/lib/server-fn";
import { CATALOGO_ACCIONES, isObraAction } from "@/lib/permisos/catalogo";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listRolePermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ obraId: z.string().uuid().optional() }).parse(d ?? {}))
  .handler(async ({ data: input, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.company_id) throw new Error("Sin empresa asignada");

    let obraItems: Array<{ role: string; action_key: string; allowed: boolean }> = [];
    if (input.obraId) {
      const { data: obra, error: obraError } = await supabase
        .from("obras")
        .select("id")
        .eq("id", input.obraId)
        .eq("company_id", profile.company_id)
        .maybeSingle();
      if (obraError) throw new Error(obraError.message);
      if (!obra) throw new Error("Obra no encontrada o sin acceso");
      const { data, error } = await supabase
        .from("obra_role_permissions")
        .select("role, action_key, allowed")
        .eq("company_id", profile.company_id)
        .eq("obra_id", input.obraId);
      if (error) throw new Error(error.message);
      obraItems = data ?? [];
    }

    const { data, error } = await supabase
      .from("role_permissions")
      .select("role, action_key, allowed")
      .eq("company_id", profile.company_id);
    if (error) throw new Error(error.message);
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role, custom_role_id")
      .eq("user_id", userId)
      .eq("company_id", profile.company_id);
    if (rolesError) throw new Error(rolesError.message);
    return {
      items: data ?? [],
      obra_items: obraItems,
      permission_roles: (roles ?? []).map((r) => r.custom_role_id ?? r.role),
    };
  });

const setSchema = z
  .object({
    role: z.union([
      z.enum(["residente", "auxiliar", "administrativo", "supervisor"]),
      z.string().uuid(),
    ]),
    action_key: z
      .string()
      .refine((key) => CATALOGO_ACCIONES.some((a) => a.key === key), "Acción no válida"),
    allowed: z.boolean().nullable(),
    obraId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.obraId ? !isObraAction(data.action_key) : data.allowed === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Configuración de permiso no válida" });
    }
  });

export const setRolePermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => setSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.company_id) throw new Error("Sin empresa asignada");

    const { data: director, error: directorError } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("company_id", profile.company_id)
      .eq("role", "director")
      .maybeSingle();
    if (directorError) throw new Error(directorError.message);
    if (!director) throw new Error("Solo el Director puede configurar permisos");
    if (data.obraId) {
      const { data: obra, error: obraError } = await supabase
        .from("obras")
        .select("id")
        .eq("id", data.obraId)
        .eq("company_id", profile.company_id)
        .maybeSingle();
      if (obraError) throw new Error(obraError.message);
      if (!obra) throw new Error("Obra no encontrada o sin acceso");
      const query = supabase.from("obra_role_permissions");
      const { error } =
        data.allowed === null
          ? await query
              .delete()
              .eq("company_id", profile.company_id)
              .eq("obra_id", data.obraId)
              .eq("role", data.role)
              .eq("action_key", data.action_key)
          : await query.upsert(
              {
                company_id: profile.company_id,
                obra_id: data.obraId,
                role: data.role,
                action_key: data.action_key,
                allowed: data.allowed,
                updated_by: userId,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "company_id,obra_id,role,action_key" },
            );
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await supabase.from("role_permissions").upsert(
      {
        company_id: profile.company_id,
        role: data.role,
        action_key: data.action_key,
        allowed: data.allowed!,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "company_id,role,action_key" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listCompanyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("company_id")
      .eq("id", context.userId)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);
    if (!profile?.company_id) return [];
    const { data, error } = await context.supabase
      .from("company_roles")
      .select("id, name, base_role")
      .eq("company_id", profile.company_id)
      .order("created_at");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const createRoleSchema = z.object({
  name: z.string().trim().min(1).max(60),
  base_role: z.enum(["residente", "auxiliar", "administrativo", "supervisor"]),
});

export const createCompanyRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createRoleSchema.parse(data))
  .handler(async ({ data, context }) => {
    const defaults = Object.fromEntries(
      CATALOGO_ACCIONES.map((a) => [a.key, a.defaults[data.base_role]]),
    );
    const { data: id, error } = await context.supabase.rpc("create_company_role", {
      _name: data.name,
      _base_role: data.base_role,
      _defaults: defaults,
    });
    if (error)
      throw new Error(error.code === "23505" ? "Ya existe un rol con ese nombre" : error.message);
    return { id };
  });
