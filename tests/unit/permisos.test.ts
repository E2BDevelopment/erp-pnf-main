import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { CATALOGO_ACCIONES } from "@/lib/permisos/catalogo";
import { hasPermission, overridesFromRows } from "@/lib/permisos/check";
import { requirePermission, resolvePermissionObra } from "@/lib/permisos/require";

type QueryResult = { data: unknown; error: { message: string } | null };

function queryBuilder(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  builder.select = () => builder;
  builder.eq = () => builder;
  builder.maybeSingle = () => builder;
  builder.overrideTypes = () => builder;
  builder.then = (
    resolve: (value: QueryResult) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(resolve, reject);
  return builder;
}

function fakeSupabase(results: Record<string, QueryResult>) {
  const from = vi.fn((table: string) => queryBuilder(results[table] ?? { data: [], error: null }));
  return { client: { from } as unknown as SupabaseClient, from };
}

describe("catálogo de permisos", () => {
  it("no tiene claves duplicadas y todos los defaults cubren los cuatro roles", () => {
    const keys = CATALOGO_ACCIONES.map((accion) => accion.key);
    expect(new Set(keys).size).toBe(keys.length);

    for (const accion of CATALOGO_ACCIONES) {
      expect(Object.keys(accion.defaults).sort()).toEqual([
        "administrativo",
        "auxiliar",
        "residente",
        "supervisor",
      ]);
    }
  });

  it("documenta la matriz esperada para obras", () => {
    const crear = CATALOGO_ACCIONES.find((accion) => accion.key === "obras.crear");
    const eliminar = CATALOGO_ACCIONES.find((accion) => accion.key === "obras.eliminar");

    expect(crear?.defaults).toMatchObject({ administrativo: true, residente: false });
    expect(eliminar?.defaults).toEqual({
      residente: false,
      auxiliar: false,
      administrativo: false,
      supervisor: false,
    });
  });
});

describe("hasPermission", () => {
  const sinOverrides = new Map<string, boolean>();

  it("el director siempre tiene permiso, incluso para acciones desconocidas", () => {
    expect(hasPermission("accion.inexistente", ["director"], sinOverrides)).toBe(true);
  });

  it("respeta los defaults del catálogo", () => {
    expect(hasPermission("obras.crear", ["administrativo"], sinOverrides)).toBe(true);
    expect(hasPermission("obras.crear", ["residente"], sinOverrides)).toBe(false);
    expect(hasPermission("presupuestos.autorizar_oc", ["supervisor"], sinOverrides)).toBe(true);
  });

  it("un override de la empresa gana sobre el default", () => {
    const overrides = overridesFromRows([
      { role: "residente", action_key: "obras.crear", allowed: true },
      { role: "administrativo", action_key: "obras.crear", allowed: false },
    ]);

    expect(hasPermission("obras.crear", ["residente"], overrides)).toBe(true);
    expect(hasPermission("obras.crear", ["administrativo"], overrides)).toBe(false);
  });

  it("combina varios roles con unión: basta que uno tenga el permiso", () => {
    expect(
      hasPermission("presupuestos.autorizar_oc", ["residente", "supervisor"], sinOverrides),
    ).toBe(true);
    expect(
      hasPermission("presupuestos.autorizar_oc", ["residente", "auxiliar"], sinOverrides),
    ).toBe(false);
  });

  it("devuelve false para una acción que no existe", () => {
    expect(hasPermission("no.existe", ["administrativo"], sinOverrides)).toBe(false);
  });
});

describe("requirePermission", () => {
  const perfil = { data: { company_id: "company-1" }, error: null };
  const roles = (role: string) => ({ data: [{ role }], error: null });

  it("rechaza si el usuario no tiene empresa", async () => {
    const { client } = fakeSupabase({ profiles: { data: null, error: null } });
    await expect(requirePermission(client, "user-1", "obras.crear")).rejects.toThrow(
      "Sin empresa asignada",
    );
  });

  it("propaga el error al leer el perfil", async () => {
    const { client } = fakeSupabase({ profiles: { data: null, error: { message: "boom" } } });
    await expect(requirePermission(client, "user-1", "obras.crear")).rejects.toThrow("boom");
  });

  it("deja pasar al director sin consultar overrides", async () => {
    const { client, from } = fakeSupabase({ profiles: perfil, user_roles: roles("director") });
    await expect(requirePermission(client, "user-1", "obras.crear")).resolves.toBeUndefined();
    expect(from).not.toHaveBeenCalledWith("role_permissions");
  });

  it("deja pasar un default permitido", async () => {
    const { client } = fakeSupabase({
      profiles: perfil,
      user_roles: roles("administrativo"),
      role_permissions: { data: [], error: null },
    });
    await expect(requirePermission(client, "user-1", "obras.crear")).resolves.toBeUndefined();
  });

  it("rechaza un default denegado", async () => {
    const { client } = fakeSupabase({
      profiles: perfil,
      user_roles: roles("residente"),
      role_permissions: { data: [], error: null },
    });
    await expect(requirePermission(client, "user-1", "obras.crear")).rejects.toThrow(
      "No tienes permiso para realizar esta acción",
    );
  });

  it("aplica overrides de la empresa en ambos sentidos", async () => {
    const permitido = fakeSupabase({
      profiles: perfil,
      user_roles: roles("residente"),
      role_permissions: {
        data: [{ role: "residente", action_key: "obras.crear", allowed: true }],
        error: null,
      },
    });
    await expect(
      requirePermission(permitido.client, "user-1", "obras.crear"),
    ).resolves.toBeUndefined();

    const denegado = fakeSupabase({
      profiles: perfil,
      user_roles: roles("administrativo"),
      role_permissions: {
        data: [{ role: "administrativo", action_key: "obras.crear", allowed: false }],
        error: null,
      },
    });
    await expect(requirePermission(denegado.client, "user-1", "obras.crear")).rejects.toThrow(
      "No tienes permiso para realizar esta acción",
    );
  });

  it("usa los permisos del rol personalizado sin heredar los del perfil base", async () => {
    const customRole = "f1109454-0fa3-4f39-b1d9-79e97de2e044";
    const overrides = overridesFromRows([
      { role: "administrativo", action_key: "obras.crear", allowed: true },
      { role: customRole, action_key: "obras.crear", allowed: false },
    ]);
    expect(hasPermission("obras.crear", [customRole], overrides)).toBe(false);
    expect(hasPermission("obras.editar", [customRole], overrides)).toBe(false);
    const { client } = fakeSupabase({
      profiles: perfil,
      user_roles: { data: [{ role: "administrativo", custom_role_id: customRole }], error: null },
      role_permissions: {
        data: [{ role: customRole, action_key: "obras.crear", allowed: false }],
        error: null,
      },
    });
    await expect(requirePermission(client, "user-1", "obras.crear")).rejects.toThrow(
      "No tienes permiso",
    );
    expect(
      hasPermission(
        "obras.crear",
        [customRole],
        overridesFromRows([{ role: customRole, action_key: "obras.crear", allowed: true }]),
      ),
    ).toBe(true);
  });

  it("propaga errores de roles y de overrides", async () => {
    const rolesError = fakeSupabase({
      profiles: perfil,
      user_roles: { data: null, error: { message: "roles boom" } },
    });
    await expect(requirePermission(rolesError.client, "user-1", "obras.crear")).rejects.toThrow(
      "roles boom",
    );

    const permisosError = fakeSupabase({
      profiles: perfil,
      user_roles: roles("residente"),
      role_permissions: { data: null, error: { message: "permisos boom" } },
    });
    await expect(requirePermission(permisosError.client, "user-1", "obras.crear")).rejects.toThrow(
      "permisos boom",
    );
  });
});

describe("validación de permisos con contexto de obra", () => {
  const base = {
    profiles: { data: { company_id: "company-1" }, error: null },
    obras: { data: { company_id: "company-1" }, error: null },
    user_roles: { data: [{ role: "residente" }], error: null },
    role_permissions: { data: [], error: null },
  };

  it("aplica la denegación de obra antes del default permitido", async () => {
    const { client } = fakeSupabase({
      ...base,
      obra_role_permissions: {
        data: [{ role: "residente", action_key: "requisiciones.crear", allowed: false }],
        error: null,
      },
    });
    await expect(
      requirePermission(client, "user-1", "requisiciones.crear", "obra-1"),
    ).rejects.toThrow("No tienes permiso");
  });

  it("permite la excepción de obra sobre una denegación de empresa", async () => {
    const { client } = fakeSupabase({
      ...base,
      role_permissions: {
        data: [{ role: "residente", action_key: "requisiciones.crear", allowed: false }],
        error: null,
      },
      obra_role_permissions: {
        data: [{ role: "residente", action_key: "requisiciones.crear", allowed: true }],
        error: null,
      },
    });
    await expect(
      requirePermission(client, "user-1", "requisiciones.crear", "obra-1"),
    ).resolves.toBeUndefined();
  });

  it("rechaza una obra de otra empresa incluso para un Director", async () => {
    const { client } = fakeSupabase({
      ...base,
      obras: { data: { company_id: "company-2" }, error: null },
      user_roles: { data: [{ role: "director" }], error: null },
    });
    await expect(
      requirePermission(client, "user-1", "requisiciones.crear", "obra-1"),
    ).rejects.toThrow("sin acceso");
  });

  it("rechaza una obra inaccesible y falla cerrado cuando falla la consulta", async () => {
    const missing = fakeSupabase({ ...base, obras: { data: null, error: null } });
    await expect(
      requirePermission(missing.client, "user-1", "requisiciones.crear", "obra-1"),
    ).rejects.toThrow("sin acceso");
    const failed = fakeSupabase({
      ...base,
      obra_role_permissions: { data: null, error: { message: "consulta fallida" } },
    });
    await expect(
      requirePermission(failed.client, "user-1", "requisiciones.crear", "obra-1"),
    ).rejects.toThrow("consulta fallida");
  });

  it("obtiene la obra real de documentos y de sus documentos padre", async () => {
    const { client } = fakeSupabase({
      cotizacion_solicitudes: { data: { requisicion_id: "req-1" }, error: null },
      requisiciones: { data: { obra_id: "obra-real" }, error: null },
      inexistente: { data: null, error: null },
    });
    await expect(
      resolvePermissionObra(client, { table: "cotizacion_solicitudes", id: "sc-1" }),
    ).resolves.toBe("obra-real");
    await expect(
      resolvePermissionObra(client, { table: "inexistente", id: "missing" }),
    ).rejects.toThrow("sin acceso");
  });
});
