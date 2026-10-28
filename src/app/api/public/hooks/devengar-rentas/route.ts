import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron / external hook: devenga asientos de rentas activas y genera periodos.
 */
export async function POST() {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: asientos, error: aErr } = await supabaseAdmin.rpc(
      "devengar_asientos_rentas_activas",
    );
    if (aErr) {
      return NextResponse.json({ ok: false, error: aErr.message }, { status: 500 });
    }

    const { data: periodos, error: pErr } = await supabaseAdmin.rpc(
      "generar_periodos_rentas_activas",
    );
    if (pErr) {
      return NextResponse.json({ ok: false, error: pErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      asientos_diarios: Number(asientos ?? 0),
      periodos_generados: Number(periodos ?? 0),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
