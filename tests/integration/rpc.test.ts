import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DEMO_OBRAS, DEMO_USERS, loadTestEnv } from "../helpers/env";
import { assertServerIsUp, BASE_URL, rpc } from "../helpers/rpc";
import { signInDemo, signOut, type DemoSession } from "../helpers/supabase";

loadTestEnv();

type ObraRow = { id: string; nombre: string };
type SessionContext = {
  userId: string;
  profile: { company_id: string | null; email: string | null } | null;
  roles: string[];
};

let director: DemoSession;
let residente: DemoSession;
let residente2: DemoSession;

beforeAll(async () => {
  await assertServerIsUp();
  [director, residente, residente2] = await Promise.all([
    signInDemo(DEMO_USERS.director),
    signInDemo(DEMO_USERS.residente),
    signInDemo(DEMO_USERS.residente2),
  ]);
}, 60_000);

afterAll(async () => {
  await Promise.all([director, residente, residente2].map(signOut));
});

describe("contrato HTTP del RPC", () => {
  it("rechaza una llamada sin token", async () => {
    const response = await rpc("api/obras.functions.listObras");
    expect(response.status).toBe(401);
    expect(response.error).toMatch(/Unauthorized/i);
  });

  it("rechaza un token inválido", async () => {
    const response = await rpc("api/obras.functions.listObras", {}, "token-invalido");
    expect(response.status).toBe(401);
  });

  it("devuelve 404 para una función inexistente", async () => {
    const response = await rpc("api/no-existe.functions.nada");
    expect(response.status).toBe(404);
    expect(response.error).toContain("Server function no encontrada");
  });

  it("devuelve 400 cuando el validador recibe un UUID inválido", async () => {
    const response = await rpc(
      "api/obras.functions.getObraDashboard",
      { obraId: "no-es-uuid" },
      director.token,
    );
    expect(response.status).toBe(400);
    expect(response.error).toBeTruthy();
  });

  it("devuelve 400 cuando el cuerpo no trae el sobre { data }", async () => {
    const fn = encodeURIComponent("api/obras.functions.getObraDashboard");
    const response = await fetch(`${BASE_URL}/api/rpc/${fn}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${director.token}`,
      },
      body: JSON.stringify({}),
    });
    expect(response.status).toBe(400);
  });
});

describe("sesión y contexto", () => {
  it("getSessionContext devuelve perfil y rol del director", async () => {
    const response = await rpc<SessionContext>(
      "api/auth.functions.getSessionContext",
      {},
      director.token,
    );
    expect(response.status).toBe(200);
    expect(response.data?.userId).toBe(director.userId);
    expect(response.data?.profile?.company_id).toBe(director.companyId);
    expect(response.data?.roles).toContain("director");
  });

  it("cada usuario demo ve su propio contexto", async () => {
    const response = await rpc<SessionContext>(
      "api/auth.functions.getSessionContext",
      {},
      residente.token,
    );
    expect(response.status).toBe(200);
    expect(response.data?.userId).toBe(residente.userId);
    expect(response.data?.roles).toContain("residente");
  });
});

describe("lecturas por rol", () => {
  it("el director ve todas las obras de la empresa", async () => {
    const response = await rpc<ObraRow[]>("api/obras.functions.listObras", {}, director.token);
    expect(response.status).toBe(200);
    const ids = (response.data ?? []).map((obra) => obra.id);
    expect(ids).toEqual(expect.arrayContaining([DEMO_OBRAS.ampliacion, DEMO_OBRAS.residencial]));
  });

  it("residente solo ve la obra donde está asignado", async () => {
    const response = await rpc<ObraRow[]>("api/obras.functions.listObras", {}, residente.token);
    expect(response.status).toBe(200);
    const ids = (response.data ?? []).map((obra) => obra.id);
    expect(ids).toContain(DEMO_OBRAS.residencial);
    expect(ids).not.toContain(DEMO_OBRAS.ampliacion);
  });

  it("residente2 solo ve la obra donde está asignado", async () => {
    const response = await rpc<ObraRow[]>("api/obras.functions.listObras", {}, residente2.token);
    expect(response.status).toBe(200);
    const ids = (response.data ?? []).map((obra) => obra.id);
    expect(ids).toContain(DEMO_OBRAS.ampliacion);
    expect(ids).not.toContain(DEMO_OBRAS.residencial);
  });

  it("el dashboard de obra propio responde para el residente", async () => {
    const response = await rpc<{ obra: { id: string }; team: unknown[] }>(
      "api/obras.functions.getObraDashboard",
      { obraId: DEMO_OBRAS.residencial },
      residente.token,
    );
    expect(response.status).toBe(200);
    expect(response.data?.obra.id).toBe(DEMO_OBRAS.residencial);
    expect(Array.isArray(response.data?.team)).toBe(true);
  });

  it("el director puede abrir el dashboard de ambas obras", async () => {
    for (const obraId of [DEMO_OBRAS.ampliacion, DEMO_OBRAS.residencial]) {
      const response = await rpc<{ obra: { id: string } }>(
        "api/obras.functions.getObraDashboard",
        { obraId },
        director.token,
      );
      expect(response.status).toBe(200);
      expect(response.data?.obra.id).toBe(obraId);
    }
  });

  it("el dashboard de empresa responde con la serie semanal", async () => {
    const response = await rpc<{ semanas: number; serie: unknown[]; obras: unknown[] }>(
      "api/dashboard.functions.getDashboardEmpresa",
      { semanas: 8 },
      director.token,
    );
    expect(response.status).toBe(200);
    expect(response.data?.semanas).toBe(8);
    expect(response.data?.serie).toHaveLength(8);
    expect(Array.isArray(response.data?.obras)).toBe(true);
  });

  it("los catálogos principales responden para el director", async () => {
    const [clientes, presupuestos] = await Promise.all([
      rpc<unknown[]>("api/clientes.functions.listClientes", {}, director.token),
      rpc<unknown[]>(
        "api/presupuestos.functions.listPresupuestos",
        { obraId: DEMO_OBRAS.residencial },
        director.token,
      ),
    ]);
    expect(clientes.status).toBe(200);
    expect(Array.isArray(clientes.data)).toBe(true);
    expect(presupuestos.status).toBe(200);
    expect(Array.isArray(presupuestos.data)).toBe(true);
  });
});

describe("permisos de servidor", () => {
  it("un residente no puede crear obras", async () => {
    const response = await rpc(
      "api/obras.functions.crearObra",
      {
        nombre: "Obra de prueba (no debe crearse)",
        unidad_negocio_id: "00000000-0000-4000-8000-000000000000",
        cliente_id: null,
        team: [],
        comisiones: [],
      },
      residente.token,
    );
    expect(response.status).toBe(500);
    expect(response.error).toContain("No tienes permiso");
  });

  /** SEC-03 regression: an unassigned resident must not read another obra. */
  it("residente2 no puede leer el dashboard de otra obra", async () => {
    const response = await rpc(
      "api/obras.functions.getObraDashboard",
      { obraId: DEMO_OBRAS.residencial },
      residente2.token,
    );
    expect([401, 403, 404]).toContain(response.status);
  });
});
