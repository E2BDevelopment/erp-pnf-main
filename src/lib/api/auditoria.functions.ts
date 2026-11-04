import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@/lib/server-fn";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const auditQuerySchema = z.object({
  password: z.string().min(1).max(256),
  page: z.number().int().min(0).max(10000).default(0),
  operation: z.enum(["INSERT", "UPDATE", "DELETE", "all"]).default("all"),
  table: z.string().trim().max(80).default(""),
});

export const getAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => auditQuerySchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);
    if (!profile?.company_id) throw new Error("Solo los directores pueden consultar la auditoría.");

    const { data: directorRole, error: roleError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("user_id", userId)
      .eq("company_id", profile.company_id)
      .eq("role", "director")
      .maybeSingle();
    if (roleError) throw new Error(roleError.message);
    if (!directorRole) throw new Error("Solo los directores pueden consultar la auditoría.");

    const email = typeof claims.email === "string" ? claims.email : "";
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!email || !url || !key) throw new Error("No se pudo validar la contraseña de la cuenta.");

    const verifier = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: verified, error: passwordError } = await verifier.auth.signInWithPassword({
      email,
      password: data.password,
    });
    if (passwordError || verified.user?.id !== userId) {
      throw new Error("La contraseña es incorrecta. Inténtalo de nuevo.");
    }

    const pageSize = 50;
    let query = supabaseAdmin
      .from("audit_log")
      .select(
        "id, occurred_at, actor_user_id, table_name, operation, record_id, old_data, new_data, transaction_id",
        { count: "exact" },
      )
      .eq("company_id", profile.company_id)
      .order("occurred_at", { ascending: false })
      .range(data.page * pageSize, data.page * pageSize + pageSize - 1);
    if (data.operation !== "all") query = query.eq("operation", data.operation);
    if (data.table) query = query.ilike("table_name", `%${data.table}%`);

    const { data: items, error: auditError, count } = await query;
    if (auditError) throw new Error(auditError.message);

    const actorIds = [
      ...new Set(
        (items ?? [])
          .map((item) => item.actor_user_id)
          .filter((id): id is string => typeof id === "string"),
      ),
    ];
    const actors = actorIds.length
      ? await supabaseAdmin
          .from("profiles")
          .select("id, nombre_completo, email")
          .eq("company_id", profile.company_id)
          .in("id", actorIds)
      : { data: [] };

    return {
      items: items ?? [],
      actors: (actors.data ?? []).map(({ id, nombre_completo, email: actorEmail }) => ({
        id,
        nombre_completo,
        email: actorEmail,
      })),
      total: count ?? 0,
      page: data.page,
      pageSize,
    };
  });
