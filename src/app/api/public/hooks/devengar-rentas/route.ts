import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron / external hook: devenga asientos de rentas activas y genera periodos.
 */
export async function POST(request: Request) {
  const secret = process.env.RENTAS_CRON_SECRET;
  const authorization = request.headers.get("authorization") ?? "";
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!secret || secret.length < 32) {
    return NextResponse.json({ ok: false, error: "Hook no configurado" }, { status: 503 });
  }

  const expectedBuffer = Buffer.from(secret);
  const providedBuffer = Buffer.from(provided);
  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: asientos, error: aErr } = await supabaseAdmin.rpc(
      "devengar_asientos_rentas_activas",
    );
    if (aErr) {
      console.error("rent accrual hook failed", aErr.message);
      return NextResponse.json({ ok: false, error: "No fue posible procesar rentas" }, { status: 500 });
    }

    const { data: periodos, error: pErr } = await supabaseAdmin.rpc(
      "generar_periodos_rentas_activas",
    );
    if (pErr) {
      console.error("rent period hook failed", pErr.message);
      return NextResponse.json({ ok: false, error: "No fue posible procesar rentas" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      asientos_diarios: Number(asientos ?? 0),
      periodos_generados: Number(periodos ?? 0),
    });
  } catch (error) {
    console.error("rent hook failed", error);
    return NextResponse.json({ ok: false, error: "No fue posible procesar rentas" }, { status: 500 });
  }
}
