import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { registry } from "@/lib/server-fn/registry.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Single RPC endpoint backing every generated `@/lib/api-client/*` facade.
 * The id is the original module/export pair, e.g. `api/obras.functions.listObras`.
 */
export async function POST(request: Request, context: { params: Promise<{ fn: string }> }) {
  const { fn } = await context.params;
  const id = decodeURIComponent(fn);
  const entry = registry[id];

  if (!entry || typeof entry.__execute !== "function") {
    return NextResponse.json(
      { ok: false, error: `Server function no encontrada: ${id}` },
      { status: 404 },
    );
  }

  try {
    const input = await request.json().catch(() => undefined);
    const data = await entry.__execute(input);
    return NextResponse.json({ ok: true, data: data ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.startsWith("Unauthorized") ? 401 : error instanceof ZodError ? 400 : 500;
    if (status === 500) console.error(`[rpc:${id}]`, error);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
