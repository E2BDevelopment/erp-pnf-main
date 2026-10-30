export const BASE_URL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

export type RpcResponse<T = unknown> = {
  status: number;
  ok: boolean;
  data: T | null;
  error: string | null;
  headers: Headers;
};

/**
 * Invoca el contrato HTTP real del ERP.
 * El cuerpo siempre es { data: ... } porque así lo espera cada server function.
 */
export async function rpc<T = unknown>(
  fn: string,
  payload: unknown = {},
  token?: string,
): Promise<RpcResponse<T>> {
  const response = await fetch(`${BASE_URL}/api/rpc/${encodeURIComponent(fn)}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ data: payload }),
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as
    { ok: true; data: T | null } | { ok: false; error: string } | null;

  return {
    status: response.status,
    ok: response.ok,
    data: body && body.ok ? body.data : null,
    error: body && !body.ok ? body.error : null,
    headers: response.headers,
  };
}

export async function assertServerIsUp() {
  try {
    const response = await fetch(BASE_URL, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    throw new Error(
      `El servidor de pruebas no responde en ${BASE_URL}. ` +
        `Arranca "npm run dev" antes de ejecutar integración/E2E. Detalle: ${
          error instanceof Error ? error.message : String(error)
        }`,
    );
  }
}
