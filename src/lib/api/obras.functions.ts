import { createServerFn } from "@/lib/server-fn";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission } from "@/lib/permisos/require";
import { validarComisionesEquipo, validarEquipoObra } from "@/lib/obra-utils";
import { roleColor } from "@/lib/roles/colors";

export const listObras = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .maybeSingle();
    const companyId = (profile as any)?.company_id as string | null;

    let isDirector = false;
    if (companyId) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("company_id", companyId)
        .eq("role", "director");
      isDirector = (roles ?? []).length > 0;
    }

    const select =
      "id, nombre, unidad_negocio:unidades_negocio(id, nombre), numero_contrato, ubicacion, fecha_inicio, fecha_terminacion, cliente:clientes(razon_social)";

    if (isDirector) {
      const { data, error } = await supabase
        .from("obras")
        .select(select)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    }

    const { data, error } = await supabase
      .from("obras")
      .select(`${select}, obra_team!inner(user_id)`)
      .eq("obra_team.user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getObraDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ obraId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: obra, error: obraError } = await supabase
      .from("obras")
      .select(
        "id, company_id, nombre, unidad_negocio:unidades_negocio(id, nombre), numero_contrato, ubicacion, fecha_inicio, fecha_terminacion, presupuesto_url, cliente:clientes(id, razon_social, rfc, tipo_persona)",
      )
      .eq("id", data.obraId)
      .maybeSingle();
    if (obraError) throw new Error(obraError.message);
    if (!obra) throw new Error("Unauthorized: obra no disponible");

    const { data: teamRows, error: teamError } = await supabase
      .from("obra_team")
      .select("id, role, user_id")
      .eq("obra_id", data.obraId);
    if (teamError) throw new Error(teamError.message);

    const userIds = (teamRows ?? []).map((r) => r.user_id);
    let profiles: Array<{ id: string; nombre_completo: string; email: string }> = [];
    let roleAssignments: Array<{ user_id: string; role: string; custom_role_id: string | null }> = [];
    let customRoles: Array<{ id: string; name: string; color: string }> = [];
    if (userIds.length > 0) {
      const [
        { data: profileRows, error: profErr },
        { data: assignments, error: assignmentErr },
        { data: companyRoles, error: customRoleErr },
      ] = await Promise.all([
        supabase.from("profiles").select("id, nombre_completo, email").in("id", userIds),
        supabase
          .from("user_roles")
          .select("user_id, role, custom_role_id")
          .eq("company_id", obra.company_id)
          .in("user_id", userIds),
        supabase
          .from("company_roles")
          .select("id, name, color")
          .eq("company_id", obra.company_id),
      ]);
      if (profErr) throw new Error(profErr.message);
      if (assignmentErr) throw new Error(assignmentErr.message);
      if (customRoleErr) throw new Error(customRoleErr.message);
      profiles = profileRows ?? [];
      roleAssignments = assignments ?? [];
      customRoles = companyRoles ?? [];
    }
    const profileMap = new Map(profiles.map((p) => [p.id, p]));
    const assignedCustomRole = new Map(
      roleAssignments
        .filter((assignment) => assignment.custom_role_id)
        .map((assignment) => [`${assignment.user_id}:${assignment.role}`, assignment.custom_role_id!]),
    );
    const customRoleColors = new Map(customRoles.map((role) => [role.id, role.color]));
    const customRoleNames = new Map(customRoles.map((role) => [role.id, role.name]));

    const team = (teamRows ?? []).map((r) => {
      const customRoleId = assignedCustomRole.get(`${r.user_id}:${r.role}`);
      return {
        id: r.id,
        role: r.role,
        roleLabel: (customRoleId && customRoleNames.get(customRoleId)) || null,
        color: roleColor(r.role, customRoleId && customRoleColors.get(customRoleId)),
        user: profileMap.get(r.user_id) ?? null,
      };
    });

    return { obra, team };
  });

const crearObraSchema = z.object({
  nombre: z.string().trim().min(1).max(255),
  unidad_negocio_id: z.string().uuid(),
  cliente_id: z.string().uuid().nullable(),
  numero_contrato: z.string().trim().max(100).optional(),
  ubicacion: z.string().trim().max(500).optional(),
  fecha_inicio: z.string().optional(),
  fecha_terminacion: z.string().optional(),
  presupuesto_url: z.string().max(1000).nullable().optional(),

  team: z
    .array(
      z.object({
        user_id: z.string().uuid(),
        role: z.enum(["director", "residente", "auxiliar", "administrativo", "supervisor"]),
      }),
    )
    .default([]),
  comisiones: z
    .array(
      z.object({
        user_id: z.string().uuid(),
        porcentaje: z.number().min(0).max(100),
        base_calculo: z.enum(["monto_contratado", "monto_cobrado", "utilidad"]),
      }),
    )
    .default([]),
});

export const crearObra = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => crearObraSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requirePermission(supabase, userId, "obras.crear");
    await requirePermission(supabase, userId, "obras.asignar_team");

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.company_id) throw new Error("Sin empresa asociada");

    const errorEquipo = validarEquipoObra(data.team);
    if (errorEquipo) throw new Error(errorEquipo);
    const errorComisiones = validarComisionesEquipo(data.team, data.comisiones);
    if (errorComisiones) throw new Error(errorComisiones);

    const obraId = randomUUID();
    const { error } = await supabase
      .from("obras")
      .insert({
        id: obraId,
        company_id: profile.company_id,
        nombre: data.nombre,
        unidad_negocio_id: data.unidad_negocio_id,
        cliente_id: data.cliente_id,
        numero_contrato: data.numero_contrato || null,
        ubicacion: data.ubicacion || null,
        fecha_inicio: data.fecha_inicio || null,
        fecha_terminacion: data.fecha_terminacion || null,
        presupuesto_url: data.presupuesto_url || null,
        monto_contratado: null,
        created_by: userId,
      });
    if (error) throw new Error(error.message);

    if (data.team.length > 0) {
      const { error: teamError } = await supabase
        .from("obra_team")
        .insert(data.team.map((m) => ({ obra_id: obraId, user_id: m.user_id, role: m.role })));
      if (teamError) throw new Error(teamError.message);
    }

    if (data.comisiones.length > 0) {
      const { error: comError } = await supabase.from("obra_comisiones").insert(
        data.comisiones.map((c) => ({
          obra_id: obraId,
          user_id: c.user_id,
          porcentaje: c.porcentaje,
          base_calculo: c.base_calculo,
        })),
      );
      if (comError) throw new Error(comError.message);
    }

    return { obraId };
  });

export const listCompanyUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase.from("profiles").select("id, nombre_completo, email");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ============================================================
// Edición de obra (permiso `obras.editar` / `obras.asignar_team`)
// ============================================================

export const getObraConfiguracion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ obraId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const permissions = await Promise.allSettled([
      requirePermission(supabase, userId, "obras.editar", data.obraId),
      requirePermission(supabase, userId, "obras.asignar_team", data.obraId),
    ]);
    if (permissions.every((result) => result.status === "rejected")) {
      throw new Error("No tienes permiso para consultar la configuración de esta obra");
    }

    const { data: obra, error } = await supabase
      .from("obras")
      .select(
        "id, nombre, unidad_negocio_id, cliente_id, numero_contrato, ubicacion, fecha_inicio, fecha_terminacion, presupuesto_url, monto_contratado",
      )
      .eq("id", data.obraId)
      .single();
    if (error) throw new Error(error.message);

    const { data: team, error: tErr } = await supabase
      .from("obra_team")
      .select("user_id, role")
      .eq("obra_id", data.obraId);
    if (tErr) throw new Error(tErr.message);

    const { data: comisiones, error: cErr } = await supabase
      .from("obra_comisiones")
      .select("user_id, porcentaje, base_calculo")
      .eq("obra_id", data.obraId);
    if (cErr) throw new Error(cErr.message);

    return { obra, team: team ?? [], comisiones: comisiones ?? [] };
  });

const actualizarObraSchema = z.object({
  obraId: z.string().uuid(),
  nombre: z.string().trim().min(1).max(255),
  unidad_negocio_id: z.string().uuid(),
  cliente_id: z.string().uuid().nullable(),
  numero_contrato: z.string().trim().max(100).nullable().optional(),
  ubicacion: z.string().trim().max(500).nullable().optional(),
  fecha_inicio: z.string().nullable().optional(),
  fecha_terminacion: z.string().nullable().optional(),
  presupuesto_url: z.string().max(1000).nullable().optional(),
});

export const actualizarObra = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => actualizarObraSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requirePermission(supabase, userId, "obras.editar", data.obraId);

    const { error } = await supabase
      .from("obras")
      .update({
        nombre: data.nombre,
        unidad_negocio_id: data.unidad_negocio_id,
        cliente_id: data.cliente_id,
        numero_contrato: data.numero_contrato ?? null,
        ubicacion: data.ubicacion ?? null,
        fecha_inicio: data.fecha_inicio ?? null,
        fecha_terminacion: data.fecha_terminacion ?? null,
        presupuesto_url: data.presupuesto_url ?? null,
      })
      .eq("id", data.obraId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const actualizarObraTeamSchema = z.object({
  obraId: z.string().uuid(),
  team: z.array(
    z.object({
      user_id: z.string().uuid(),
      role: z.enum(["director", "residente", "auxiliar", "administrativo", "supervisor"]),
    }),
  ),
});

export const actualizarObraTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => actualizarObraTeamSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requirePermission(supabase, userId, "obras.asignar_team", data.obraId);

    const errorEquipo = validarEquipoObra(data.team);
    if (errorEquipo) throw new Error(errorEquipo);

    const { error } = await supabase.rpc("replace_obra_team", {
      _obra_id: data.obraId,
      _team: data.team,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const actualizarObraComisionesSchema = z.object({
  obraId: z.string().uuid(),
  comisiones: z.array(
    z.object({
      user_id: z.string().uuid(),
      porcentaje: z.number().min(0).max(100),
      base_calculo: z.enum(["monto_contratado", "monto_cobrado", "utilidad"]),
    }),
  ),
});

export const actualizarObraComisiones = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => actualizarObraComisionesSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requirePermission(supabase, userId, "obras.asignar_team", data.obraId);

    const { data: team, error: teamErr } = await supabase
      .from("obra_team")
      .select("user_id")
      .eq("obra_id", data.obraId);
    if (teamErr) throw new Error(teamErr.message);

    const errorEquipo = validarComisionesEquipo(team ?? [], data.comisiones);
    if (errorEquipo) throw new Error(errorEquipo);

    const { error: delErr } = await supabase
      .from("obra_comisiones")
      .delete()
      .eq("obra_id", data.obraId);
    if (delErr) throw new Error(delErr.message);

    if (data.comisiones.length > 0) {
      const { error: insErr } = await supabase.from("obra_comisiones").insert(
        data.comisiones.map((c) => ({
          obra_id: data.obraId,
          user_id: c.user_id,
          porcentaje: c.porcentaje,
          base_calculo: c.base_calculo,
        })),
      );
      if (insErr) throw new Error(insErr.message);
    }
    return { ok: true };
  });
