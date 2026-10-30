import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DEMO_USERS, loadTestEnv } from "../helpers/env";
import { assertServerIsUp, BASE_URL } from "../helpers/rpc";
import {
  adminClient,
  anonClient,
  signInDemo,
  signOut,
  type DemoSession,
} from "../helpers/supabase";

loadTestEnv();

const admin = adminClient();

let auxiliar: DemoSession;
let residente: DemoSession;
let residente2: DemoSession;

let tempCompanyId: string;
let tempObraId: string;
let originalCompanyId: string | null;

beforeAll(async () => {
  await assertServerIsUp();
  [auxiliar, residente, residente2] = await Promise.all([
    signInDemo(DEMO_USERS.auxiliar),
    signInDemo(DEMO_USERS.residente),
    signInDemo(DEMO_USERS.residente2),
  ]);
  originalCompanyId = auxiliar.companyId;

  const suffix = Date.now().toString().slice(-8);
  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({
      razon_social: `Empresa temporal de seguridad ${suffix}`,
      rfc: `T${suffix}${randomUUID().slice(0, 4)}`.slice(0, 13).toUpperCase(),
      tipo_persona: "moral",
    })
    .select("id")
    .single();
  if (companyError) throw companyError;
  tempCompanyId = company.id;

  const { data: obra, error: obraError } = await admin
    .from("obras")
    .insert({
      company_id: originalCompanyId!,
      nombre: `Obra temporal de seguridad ${suffix}`,
    })
    .select("id")
    .single();
  if (obraError) throw obraError;
  tempObraId = obra.id;
}, 60_000);

afterAll(async () => {
  // Restaurar primero el perfil: la empresa temporal no debe quedar referenciada.
  if (originalCompanyId) {
    await admin
      .from("profiles")
      .update({ company_id: originalCompanyId })
      .eq("id", auxiliar.userId);
  }
  if (tempObraId) await admin.from("obras").delete().eq("id", tempObraId);
  if (tempCompanyId) await admin.from("companies").delete().eq("id", tempCompanyId);

  await Promise.all([auxiliar, residente, residente2].map(signOut));
});

describe("aislamiento entre empresas", () => {
  /** SEC-01 regression: identity and tenant columns are server-managed. */
  it("un usuario no puede cambiar su propia empresa", async () => {
    try {
      const { error } = await auxiliar.client
        .from("profiles")
        .update({ company_id: tempCompanyId })
        .eq("id", auxiliar.userId);

      expect(error).not.toBeNull();
    } finally {
      if (originalCompanyId) {
        await admin
          .from("profiles")
          .update({ company_id: originalCompanyId })
          .eq("id", auxiliar.userId);
      }
    }
  });

  it("un usuario no puede crear su perfil asignándose otra empresa", async () => {
    const { error } = await auxiliar.client.from("profiles").insert({
      id: auxiliar.userId,
      company_id: tempCompanyId,
      nombre_completo: "Perfil manipulado",
      email: "perfil-manipulado@example.invalid",
    });
    expect(error).not.toBeNull();
  });

  it("un usuario anónimo no puede leer obras ni perfiles", async () => {
    const anon = anonClient();
    const [obras, perfiles] = await Promise.all([
      anon.from("obras").select("id").limit(1),
      anon.from("profiles").select("id").limit(1),
    ]);

    expect(obras.error || (obras.data ?? []).length === 0).toBeTruthy();
    expect(perfiles.error || (perfiles.data ?? []).length === 0).toBeTruthy();
  });

  it("un usuario anónimo no puede insertar obras", async () => {
    const anon = anonClient();
    const { error } = await anon.from("obras").insert({
      company_id: originalCompanyId!,
      nombre: "Obra anónima que no debe existir",
    });
    expect(error).not.toBeNull();
  });
});

describe("escalamiento de privilegios", () => {
  /** SEC-04 regression: role grants are managed by trusted server code. */
  it("un auxiliar no puede insertarse el rol director", async () => {
    try {
      const { error } = await auxiliar.client.from("user_roles").insert({
        user_id: auxiliar.userId,
        company_id: tempCompanyId,
        role: "director",
      });

      expect(error).not.toBeNull();
    } finally {
      await admin
        .from("user_roles")
        .delete()
        .eq("user_id", auxiliar.userId)
        .eq("company_id", tempCompanyId)
        .eq("role", "director");
    }
  });

  it("un residente no puede leer el dashboard de otra obra por RPC", async () => {
    const response = await fetch(
      `${BASE_URL}/api/rpc/${encodeURIComponent("api/obras.functions.getObraDashboard")}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${residente2.token}`,
        },
        body: JSON.stringify({
          data: { obraId: "4d616d86-3c6f-5c35-bfa0-b91333ad9796" },
        }),
      },
    );
    expect([401, 403, 404]).toContain(response.status);
  });
});

describe("RLS laxa en obras y obra_team", () => {
  /** SEC-03 regression: a user without obra-management permission cannot edit. */
  it("un residente no puede editar una obra por PostgREST", async () => {
    try {
      const { error } = await residente.client
        .from("obras")
        .update({ nombre: "Obra temporal editada por residente" })
        .eq("id", tempObraId);

      expect(error).not.toBeNull();
    } finally {
      await admin
        .from("obras")
        .update({ nombre: "Obra temporal de seguridad restaurada" })
        .eq("id", tempObraId);
    }
  });

  /** SEC-05 regression: team membership cannot be self-assigned. */
  it("residente2 no puede agregarse al equipo de otra obra", async () => {
    try {
      const { error } = await residente2.client.from("obra_team").insert({
        obra_id: tempObraId,
        user_id: residente2.userId,
        role: "supervisor",
      });

      expect(error).not.toBeNull();
    } finally {
      await admin
        .from("obra_team")
        .delete()
        .eq("obra_id", tempObraId)
        .eq("user_id", residente2.userId);
    }
  });
});

describe("superficie pública y cabeceras", () => {
  /** SEC-06 regression: privileged work starts only after constant-time auth. */
  it("el hook de rentas valida credencial antes de importar el cliente privilegiado", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/api/public/hooks/devengar-rentas/route.ts"),
      "utf8",
    );
    expect(source).toMatch(/authorization|bearer|secret|apikey|signature/i);
    expect(source.indexOf("timingSafeEqual")).toBeLessThan(
      source.indexOf('await import("@/integrations/supabase/client.server")'),
    );
  });

  it("el hook de rentas rechaza solicitudes sin credencial", async () => {
    const response = await fetch(`${BASE_URL}/api/public/hooks/devengar-rentas`, {
      method: "POST",
    });
    expect([401, 503]).toContain(response.status);
  });

  it("la aplicación envía cabeceras de seguridad", async () => {
    const response = await fetch(BASE_URL);
    expect(response.headers.get("content-security-policy")).toMatch(/'nonce-[^']+'/);
    if (process.env.NODE_ENV === "production") {
      expect(response.headers.get("strict-transport-security")).toBeTruthy();
    }
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBeTruthy();
    expect(response.headers.get("referrer-policy")).toBeTruthy();
    expect(response.headers.get("permissions-policy")).toBeTruthy();
    expect(response.headers.get("x-powered-by")).toBeNull();
  });
});
