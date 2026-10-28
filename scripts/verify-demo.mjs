#!/usr/bin/env node
/**
 * Verifica que la demo local esté completa y que cada usuario pueda iniciar sesión.
 *
 * Uso:
 *   node scripts/verify-demo.mjs
 *
 * Comprueba, contra la base local:
 *   1. La empresa demo existe y tiene datos en las tablas principales.
 *   2. Cada usuario demo autentica con su contraseña.
 *   3. Cada usuario tiene perfil con company_id y su rol asignado (leyendo con RLS).
 *
 * Sale con código 1 si algo falla.
 */

import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Variables ya exportadas en el entorno.
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "Demo1234!";
const COMPANY_RFC = "CNB200315AB1";

const USERS = [
  { email: "director@demo.pnf", role: "director", nombre: "Ricardo Naranja Salazar" },
  { email: "residente@demo.pnf", role: "residente", nombre: "Ing. Mariana Torres Villalobos" },
  { email: "residente2@demo.pnf", role: "residente", nombre: "Ing. Jorge Luis Mendoza Ríos" },
  { email: "auxiliar@demo.pnf", role: "auxiliar", nombre: "Paola Guadalupe Serrano León" },
  { email: "administrativo@demo.pnf", role: "administrativo", nombre: "Luis Fernando Aguirre Campos" },
  { email: "supervisor@demo.pnf", role: "supervisor", nombre: "Arq. Claudia Estrada Navarro" },
];

const TABLAS = [
  "obras",
  "clientes",
  "terceros",
  "trabajadores",
  "insumos",
  "obra_presupuestos",
  "requisiciones",
  "cotizacion_solicitudes",
  "ordenes_compra",
  "almacen_semanas",
  "obra_estimaciones",
  "obra_nominas",
  "obra_destajos",
  "obra_subcontratos",
  "obra_rentas",
  "vales_gasolina",
  "caja_chica_gastos",
  "obra_gastos_directos",
  "gastos_oficina",
  "obra_tareas",
  "notificaciones",
  "cuentas_por_pagar",
  "pagos",
  "asientos_contables",
];

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exitCode = 1;
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║  Verificación de la demo · ERP Naranja Forte                     ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝");

  if (!SUPABASE_URL || !PUBLISHABLE_KEY || !SERVICE_ROLE_KEY) {
    return fail(
      "Faltan SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY o SUPABASE_SERVICE_ROLE_KEY. Revisa .env.local.",
    );
  }

  const host = (() => {
    try {
      return new URL(SUPABASE_URL).hostname;
    } catch {
      return "";
    }
  })();
  if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
    return fail(`Esta verificación es solo para la base local; SUPABASE_URL apunta a "${host}".`);
  }

  console.log(`  Base: ${SUPABASE_URL}\n`);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("id, razon_social")
    .eq("rfc", COMPANY_RFC)
    .maybeSingle();

  if (companyError) return fail(`No se pudo leer la empresa demo: ${companyError.message}`);
  if (!company) {
    return fail("No existe la empresa demo. Ejecuta `npm run demo:reset` para crearla.");
  }
  console.log(`✔ Empresa demo: ${company.razon_social}`);

  let filasVacias = 0;
  const conteos = [];
  for (const tabla of TABLAS) {
    const { count, error } = await admin
      .from(tabla)
      .select("id", { count: "exact", head: true });
    if (error) {
      conteos.push(`${tabla}=?`);
      continue;
    }
    if ((count ?? 0) === 0) filasVacias += 1;
    conteos.push(`${tabla}=${count ?? 0}`);
  }
  console.log(`  Datos: ${conteos.join(" · ")}`);
  if (filasVacias > 0) {
    console.log(`  ⚠ ${filasVacias} tabla(s) de la demo están vacías (¿seed incompleto?).`);
  } else {
    console.log("✔ Todas las tablas principales tienen datos.");
  }

  console.log("\n  Inicio de sesión de los usuarios demo:");
  let fallos = 0;
  for (const u of USERS) {
    const client = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: u.email,
      password: DEMO_PASSWORD,
    });

    if (authError || !authData.user) {
      fallos += 1;
      console.log(`  ✖ ${u.email.padEnd(24)} ${authError?.message ?? "sin usuario"}`);
      continue;
    }

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("company_id, nombre_completo")
      .eq("id", authData.user.id)
      .maybeSingle();
    const { data: roles, error: rolesError } = await client
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id);

    const problemas = [];
    if (profileError) problemas.push(`perfil: ${profileError.message}`);
    if (rolesError) problemas.push(`roles: ${rolesError.message}`);
    if (!profile) problemas.push("sin fila en profiles");
    else if (!profile.company_id) problemas.push("perfil sin company_id");
    else if (profile.company_id !== company.id) problemas.push("perfil de otra empresa");
    if (!(roles ?? []).some((r) => r.role === u.role)) problemas.push(`rol ${u.role} ausente`);

    await client.auth.signOut();

    if (problemas.length > 0) {
      fallos += 1;
      console.log(`  ✖ ${u.email.padEnd(24)} ${problemas.join("; ")}`);
    } else {
      console.log(`  ✔ ${u.email.padEnd(24)} ${u.role.padEnd(15)} ${profile?.nombre_completo ?? u.nombre}`);
    }
  }

  console.log("");
  if (fallos > 0) {
    return fail(
      `${fallos} de ${USERS.length} usuarios no pueden iniciar sesión correctamente. ` +
        "Ejecuta `npm run demo:reset` y vuelve a verificar.",
    );
  }

  console.log(`✔ ${USERS.length}/${USERS.length} usuarios autentican y tienen perfil y rol.`);
  console.log(`  Contraseña de la demo: ${DEMO_PASSWORD}`);
  console.log("  Si el navegador sigue fallando, recarga sin caché (Ctrl+Shift+R) o usa una ventana privada.\n");
}

main().catch((error) => {
  console.error("\n✖ La verificación falló:");
  console.error(error?.stack ?? error?.message ?? error);
  process.exitCode = 1;
});
