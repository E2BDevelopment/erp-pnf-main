import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

const URL = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_PUBLISHABLE_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP = "http://127.0.0.1:3000";
const PASSWORD = "Demo1234!";

async function signIn(email) {
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return { client: c, token: data.session.access_token, user: data.user };
}

async function rpc(token, fn, body) {
  const res = await fetch(`${APP}/api/rpc/${encodeURIComponent(fn)}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

const director = await signIn("director@demo.pnf");
console.log("director", director.user.email);

let r = await rpc(director.token, "api/obras.functions.listObras", {});
console.log("listObras", r.status, Array.isArray(r.json?.data) ? r.json.data.length : r.json);
const obraId = r.json?.data?.[0]?.id;
console.log("obraId", obraId);

r = await rpc(director.token, "api/obras.functions.getObraDashboard", { data: { obraId } });
console.log("getObraDashboard", r.status, r.json?.data?.obra?.nombre ?? r.json);

r = await rpc(director.token, "api/obras.functions.getObraDashboard", { obraId });
console.log("getObraDashboard raw body", r.status, r.json);

r = await rpc(null, "api/obras.functions.listObras", {});
console.log("no auth", r.status, r.json);

r = await rpc(director.token, "api/nope.functions.nope", {});
console.log("unknown", r.status, r.json);

r = await rpc(director.token, "api/obras.functions.getObraDashboard", { data: { obraId: "not-a-uuid" } });
console.log("invalid uuid", r.status, r.json);

const aux = await signIn("auxiliar@demo.pnf");
r = await rpc(aux.token, "dev-switch.functions.listSwitchableUsers", {});
console.log("aux listSwitchableUsers", r.status, r.json);

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const { data: auxProfile } = await admin.from("profiles").select("company_id").eq("id", aux.user.id).single();
console.log("aux company", auxProfile);

const { error: insertErr } = await aux.client
  .from("user_roles")
  .insert({ user_id: aux.user.id, company_id: auxProfile.company_id, role: "director" });
console.log("self-promote insert", insertErr ? `BLOCKED: ${insertErr.message}` : "ALLOWED");

if (!insertErr) {
  const { data: roles } = await aux.client.from("user_roles").select("role").eq("user_id", aux.user.id);
  console.log("aux roles after", roles);
  r = await rpc(aux.token, "api/obras.functions.listSwitchableUsers", {});
  console.log("aux listSwitchableUsers after promotion", r.status, r.json);
  const { error: delErr } = await admin
    .from("user_roles")
    .delete()
    .eq("user_id", aux.user.id)
    .eq("role", "director");
  console.log("cleanup role", delErr?.message ?? "ok");
}

const { data: obrasAll, error: obrasErr } = await admin.from("obras").select("id,company_id");
console.log("admin obras", obrasErr?.message ?? obrasAll);
