import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");
const URL = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_PUBLISHABLE_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP = "http://127.0.0.1:3000";

async function signIn(email) {
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password: "Demo1234!" });
  if (error) throw error;
  return { client: c, token: data.session.access_token, user: data.user };
}

async function rpc(token, fn, body) {
  const res = await fetch(`${APP}/api/rpc/${encodeURIComponent(fn)}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body ?? {}),
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const r1 = await signIn("residente@demo.pnf");
const r2 = await signIn("residente2@demo.pnf");
const aux = await signIn("auxiliar@demo.pnf");

const { data: obras } = await admin.from("obras").select("id,nombre,company_id").order("nombre");
const residencial = obras.find((o) => o.nombre.includes("Residencial"));
const ampliacion = obras.find((o) => o.nombre.includes("Ampliación"));
console.log("obras", obras);

let r = await rpc(r2.token, "api/obras.functions.getObraDashboard", { data: { obraId: residencial.id } });
console.log("r2 dashboard of r1 obra", r.status, r.json?.data?.obra?.nombre ?? r.json);

r = await rpc(r2.token, "api/obras.functions.getObraConfiguracion", { data: { obraId: residencial.id } });
console.log("r2 config of r1 obra", r.status, r.json?.error ?? "OK");

const { error: teamErr } = await r2.client
  .from("obra_team")
  .insert({ obra_id: residencial.id, user_id: r2.user.id, role: "supervisor" });
console.log("r2 add self supervisor to r1 obra", teamErr ? `BLOCKED: ${teamErr.message}` : "ALLOWED");
if (!teamErr) {
  const { data: existing } = await admin
    .from("obra_presupuestos")
    .select("id,nombre")
    .eq("obra_id", residencial.id)
    .limit(1)
    .maybeSingle();
  if (existing) {
    const { error: updErr } = await r2.client
      .from("obra_presupuestos")
      .update({ nombre: `${existing.nombre} TEST SEC` })
      .eq("id", existing.id);
    console.log("r2 update presupuesto after self-add", updErr ? `BLOCKED: ${updErr.message}` : "ALLOWED");
    if (!updErr) await admin.from("obra_presupuestos").update({ nombre: existing.nombre }).eq("id", existing.id);
  }
  const { data: canWrite, error: writeErr } = await r2.client.from("obra_presupuestos").insert({
    company_id: residencial.company_id,
    obra_id: residencial.id,
    nombre: "TEST SEC",
    tipo: "base",
    estatus: "borrador",
    created_by: r2.user.id,
  }).select("id").single();
  console.log("r2 write presupuesto after self-add", writeErr ? `BLOCKED: ${writeErr.message}` : `ALLOWED ${canWrite.id}`);
  if (!writeErr) await admin.from("obra_presupuestos").delete().eq("id", canWrite.id);
  await admin.from("obra_team").delete().eq("obra_id", residencial.id).eq("user_id", r2.user.id).eq("role", "supervisor");
  console.log("cleanup team");
}

// admin creates obra via server fn? test permission
const { data: unidades } = await admin.from("unidades_negocio").select("id").eq("company_id", residencial.company_id).limit(1);
const { data: teamUsers } = await admin.from("profiles").select("id").eq("company_id", residencial.company_id);
const roles = ["residente", "administrativo", "supervisor"];
const team = roles.map((role, i) => ({ user_id: teamUsers[i].id, role }));
const payload = {
  data: {
    nombre: `TEST SERVER OBRA ${Date.now()}`,
    unidad_negocio_id: unidades[0]?.id,
    cliente_id: null,
    team,
  },
};
for (const [label, u] of [["admin", await signIn("administrativo@demo.pnf")], ["r1", r1], ["sup", await signIn("supervisor@demo.pnf")]]) {
  r = await rpc(u.token, "api/obras.functions.crearObra", payload);
  console.log(`crearObra as ${label}`, r.status, r.json?.error ?? r.json?.data);
  if (r.status === 200) await admin.from("obras").delete().eq("id", r.json.data.obraId);
}

// invalid token
r = await rpc("garbage", "api/obras.functions.listObras", {});
console.log("garbage token", r.status, r.json);

// direct query of role_permissions as auxiliar
const { data: perms, error: permErr } = await aux.client.from("role_permissions").select("*").limit(2);
console.log("aux role_permissions", permErr?.message ?? perms);
