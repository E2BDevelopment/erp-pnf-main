import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

const URL = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_PUBLISHABLE_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = "Demo1234!";

async function signIn(email) {
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return { client: c, token: data.session.access_token, user: data.user };
}

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const director = await signIn("director@demo.pnf");
const residente = await signIn("residente@demo.pnf");
const residente2 = await signIn("residente2@demo.pnf");
const auxiliar = await signIn("auxiliar@demo.pnf");

const { data: auxProfile } = await admin
  .from("profiles")
  .select("company_id")
  .eq("id", auxiliar.user.id)
  .single();
const demoCompany = auxProfile.company_id;

const stamp = Date.now();
const { data: tempCompany, error: tcErr } = await admin
  .from("companies")
  .insert({ tipo_persona: "moral", razon_social: `TEST SEC ${stamp}`, rfc: `T${stamp}`.slice(0, 13) })
  .select("id")
  .single();
console.log("temp company", tcErr?.message ?? tempCompany);

const { data: tempObra, error: toErr } = await admin
  .from("obras")
  .insert({
    company_id: tempCompany.id,
    nombre: `TEST OBRA SEC ${stamp}`,
    unidad_negocio_id: null,
    cliente_id: null,
    created_by: director.user.id,
  })
  .select("id")
  .single();
console.log("temp obra", toErr?.message ?? tempObra);

// 1) profile company_id self-move
const { error: moveErr } = await auxiliar.client
  .from("profiles")
  .update({ company_id: tempCompany.id })
  .eq("id", auxiliar.user.id);
console.log("aux profile move", moveErr ? `BLOCKED: ${moveErr.message}` : "ALLOWED");
if (!moveErr) {
  const { data: visible, error: visErr } = await auxiliar.client
    .from("obras")
    .select("id,nombre")
    .eq("id", tempObra.id);
  console.log("aux sees temp obra after move", visErr?.message ?? visible);

  // 2) insert director role for temp company
  const { error: roleErr } = await auxiliar.client
    .from("user_roles")
    .insert({ user_id: auxiliar.user.id, company_id: tempCompany.id, role: "director" });
  console.log("aux director role in temp", roleErr ? `BLOCKED: ${roleErr.message}` : "ALLOWED");

  const { data: roles } = await auxiliar.client
    .from("user_roles")
    .select("role,company_id")
    .eq("user_id", auxiliar.user.id);
  console.log("aux roles", roles);

  const { data: prof } = await auxiliar.client
    .from("profiles")
    .select("company_id")
    .eq("id", auxiliar.user.id)
    .single();
  console.log("aux profile now", prof);

  // restore
  await admin.from("user_roles").delete().eq("user_id", auxiliar.user.id).eq("company_id", tempCompany.id);
  await admin.from("profiles").update({ company_id: demoCompany }).eq("id", auxiliar.user.id);
  console.log("restored aux");
}

// 3) residente creates obra directly in demo company
const { data: directObra, error: directErr } = await residente.client
  .from("obras")
  .insert({
    company_id: demoCompany,
    nombre: `TEST OBRA DIRECTA ${stamp}`,
    created_by: residente.user.id,
  })
  .select("id,nombre")
  .single();
console.log("residente direct obra insert", directErr ? `BLOCKED: ${directErr.message}` : "ALLOWED");
if (!directErr) {
  const { error: updErr } = await residente.client
    .from("obras")
    .update({ nombre: `TEST OBRA DIRECTA EDIT ${stamp}` })
    .eq("id", directObra.id);
  console.log("residente direct obra update", updErr ? `BLOCKED: ${updErr.message}` : "ALLOWED");
  await admin.from("obras").delete().eq("id", directObra.id);
  console.log("cleanup direct obra");
}

// 4) residente2 adds self to first demo obra team
const { data: demoObras } = await admin
  .from("obras")
  .select("id,nombre")
  .eq("company_id", demoCompany)
  .order("nombre");
console.log("demo obras", demoObras);
const target = demoObras[0];
const { error: teamErr } = await residente2.client
  .from("obra_team")
  .insert({ obra_id: target.id, user_id: residente2.user.id, role: "residente" });
console.log("residente2 self-add to obra team", teamErr ? `BLOCKED: ${teamErr.message}` : "ALLOWED");
if (!teamErr) {
  await admin
    .from("obra_team")
    .delete()
    .eq("obra_id", target.id)
    .eq("user_id", residente2.user.id);
  console.log("cleanup team");
}

// 5) residente deletes an obra directly? skip destructive.

// 6) anon reads
const anon = createClient(URL, ANON, { auth: { persistSession: false } });
const { data: anonObras, error: anonErr } = await anon.from("obras").select("id");
console.log("anon obras", anonErr ? `BLOCKED: ${anonErr.message}` : `ALLOWED rows=${anonObras.length}`);

// cleanup temp
await admin.from("obras").delete().eq("company_id", tempCompany.id);
await admin.from("user_roles").delete().eq("company_id", tempCompany.id);
await admin.from("companies").delete().eq("id", tempCompany.id);
console.log("cleanup temp company");
