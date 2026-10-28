#!/usr/bin/env node
/**
 * Seed de datos de demostración para el ERP de construcción (Naranja Forte).
 *
 * SOLO funciona contra Supabase local (127.0.0.1 / localhost). Nunca toca el
 * proyecto remoto configurado en `.env`.
 *
 * Uso:
 *   node scripts/seed-demo.mjs            # crea datos si la empresa demo no existe
 *   node scripts/seed-demo.mjs --reset    # borra TODOS los datos locales y vuelve a sembrar
 *
 * Requisitos:
 *   - Supabase local corriendo (`npx supabase start`)
 *   - `.env.local` con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY locales
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Configuración y utilidades
// ---------------------------------------------------------------------------

if (existsSync(".env.local")) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Node antiguo: se asume que las variables ya están exportadas.
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "Demo1234!";
const COMPANY_RFC = "CNB200315AB1";

class SeedAbort extends Error {}

function fail(message) {
  throw new SeedAbort(message);
}

let supabase = null;

try {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    fail("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Revisa .env.local.");
  }

  const host = (() => {
    try {
      return new URL(SUPABASE_URL).hostname;
    } catch {
      return "";
    }
  })();

  if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
    fail(
      `El seed es únicamente para la base local. SUPABASE_URL apunta a "${host}". ` +
        "No se escribió nada.",
    );
  }

  supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
} catch (error) {
  if (!(error instanceof SeedAbort)) throw error;
  console.error(`\n✖ ${error.message}\n`);
  process.exitCode = 1;
}

const RESET = process.argv.includes("--reset");
const DRY_RUN = process.argv.includes("--dry-run");

function uid(key) {
  const hash = createHash("sha1").update(`pnf-demo:${key}`).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function log(msg) {
  console.log(msg);
}

function money(n) {
  return Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function round4(n) {
  return Math.round((Number(n) + Number.EPSILON) * 10000) / 10000;
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function mondayOf(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12));
  const day = d.getUTCDay(); // 0 domingo, 1 lunes
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

function at(dateISO, hour = 12, minute = 0) {
  return `${dateISO}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`;
}

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}

async function insert(table, rows, { chunkSize = 250 } = {}) {
  const list = Array.isArray(rows) ? rows : [rows];
  if (list.length === 0) return [];
  if (DRY_RUN) {
    log(`  [dry-run] ${table}: ${list.length} fila(s)`);
    return list;
  }
  const inserted = [];
  for (const part of chunk(list, chunkSize)) {
    const { data, error } = await supabase.from(table).insert(part).select();
    if (error) {
      throw new Error(`Insert en "${table}" falló: ${error.message}\n${JSON.stringify(part[0], null, 2)}`);
    }
    if (data) inserted.push(...data);
  }
  return inserted;
}

async function upsert(table, rows, onConflict, { chunkSize = 250 } = {}) {
  const list = Array.isArray(rows) ? rows : [rows];
  if (list.length === 0) return [];
  if (DRY_RUN) {
    log(`  [dry-run] ${table}: ${list.length} fila(s) (upsert)`);
    return list;
  }
  const inserted = [];
  for (const part of chunk(list, chunkSize)) {
    const { data, error } = await supabase.from(table).upsert(part, { onConflict }).select();
    if (error) throw new Error(`Upsert en "${table}" falló: ${error.message}`);
    if (data) inserted.push(...data);
  }
  return inserted;
}

function dockerDbContainer() {
  try {
    const names = execFileSync("docker", ["ps", "--format", "{{.Names}}"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const local = names.find((n) => n.startsWith("supabase_db_"));
    if (!local) {
      throw new Error("No se encontró el contenedor supabase_db_*. ¿Está corriendo `npx supabase start`?");
    }
    return local;
  } catch (e) {
    fail(
      `No se pudo localizar el contenedor de base de datos local: ${e.message}. ` +
        "Inicia Supabase local antes de usar --reset.",
    );
  }
}

function resetLocalDatabase() {
  const container = dockerDbContainer();
  log(`→ Reiniciando base local (contenedor ${container})…`);
  const sql = `
    DO $$
    DECLARE t text;
    BEGIN
      SELECT string_agg(format('public.%I', tablename), ', ')
        INTO t
        FROM pg_tables
       WHERE schemaname = 'public';
      IF t IS NOT NULL THEN
        EXECUTE 'TRUNCATE TABLE ' || t || ' RESTART IDENTITY CASCADE';
      END IF;
    END $$;
    DELETE FROM auth.users;
  `;
  execFileSync("docker", ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-c", sql], {
    stdio: "inherit",
  });
  log("  Base local vacía.");
}

// ---------------------------------------------------------------------------
// Calendario de demo
// ---------------------------------------------------------------------------

const TODAY = new Date();
const CURRENT_MONDAY = mondayOf(TODAY);
const WEEKS = Array.from({ length: 6 }, (_, i) => {
  const inicio = addDays(CURRENT_MONDAY, (i - 5) * 7);
  return { inicio: isoDate(inicio), fin: isoDate(addDays(inicio, 6)) };
});
const WEEK_START = WEEKS[0].inicio;
const CURRENT_WEEK = WEEKS[WEEKS.length - 1].inicio;

// ---------------------------------------------------------------------------
// IDs deterministas
// ---------------------------------------------------------------------------

const ID = {
  company: uid("company"),
  unidadResidencial: uid("unidad:residencial"),
  unidadIndustrial: uid("unidad:industrial"),

  userDirector: uid("user:director"),
  userResidente: uid("user:residente"),
  userResidente2: uid("user:residente2"),
  userAuxiliar: uid("user:auxiliar"),
  userAdministrativo: uid("user:administrativo"),
  userSupervisor: uid("user:supervisor"),

  obraA: uid("obra:A"),
  obraB: uid("obra:B"),

  clienteA: uid("cliente:A"),
  clienteB: uid("cliente:B"),
  clienteC: uid("cliente:C"),

  cuentaBBVA: uid("cuenta:bbva"),
  cuentaSantander: uid("cuenta:santander"),
  cuentaCaja: uid("cuenta:caja"),

  presupuestoABase: uid("presupuesto:A:base"),
  presupuestoAAdenda: uid("presupuesto:A:adenda"),
  presupuestoBBase: uid("presupuesto:B:base"),
  presupuestoBAdenda: uid("presupuesto:B:adenda"),
};

const USERS = [
  {
    key: "director",
    id: ID.userDirector,
    email: "director@demo.pnf",
    nombre: "Ricardo Naranja Salazar",
    role: "director",
    telefono: "33 1234 5678",
  },
  {
    key: "residente",
    id: ID.userResidente,
    email: "residente@demo.pnf",
    nombre: "Ing. Mariana Torres Villalobos",
    role: "residente",
    telefono: "33 2345 6789",
  },
  {
    key: "residente2",
    id: ID.userResidente2,
    email: "residente2@demo.pnf",
    nombre: "Ing. Jorge Luis Mendoza Ríos",
    role: "residente",
    telefono: "477 345 6789",
  },
  {
    key: "auxiliar",
    id: ID.userAuxiliar,
    email: "auxiliar@demo.pnf",
    nombre: "Paola Guadalupe Serrano León",
    role: "auxiliar",
    telefono: "33 4567 8901",
  },
  {
    key: "administrativo",
    id: ID.userAdministrativo,
    email: "administrativo@demo.pnf",
    nombre: "Luis Fernando Aguirre Campos",
    role: "administrativo",
    telefono: "33 5678 9012",
  },
  {
    key: "supervisor",
    id: ID.userSupervisor,
    email: "supervisor@demo.pnf",
    nombre: "Arq. Claudia Estrada Navarro",
    role: "supervisor",
    telefono: "477 678 9012",
  },
];

// ---------------------------------------------------------------------------
// 1. Empresa, usuarios y perfiles
// ---------------------------------------------------------------------------

async function seedCompanyAndUsers() {
  log("→ Empresa y usuarios…");

  await upsert(
    "companies",
    {
      id: ID.company,
      tipo_persona: "moral",
      razon_social: "Constructora Naranja del Bajío, S.A. de C.V.",
      nombre_completo: "Constructora Naranja del Bajío",
      rfc: COMPANY_RFC,
      regimen_fiscal: "601 - General de Ley Personas Morales",
      datos_facturacion: {
        correo: "facturacion@constructoranaranja.mx",
        telefono: "33 3812 4500",
        direccion: "Av. López Mateos Sur 1450, Col. Ciudad del Sol, Zapopan, Jalisco",
      },
      calle: "Av. López Mateos Sur",
      numero_exterior: "1450",
      colonia: "Ciudad del Sol",
      municipio: "Zapopan",
      estado: "Jalisco",
      codigo_postal: "45050",
      moneda: "MXN",
      zona_horaria: "America/Mexico_City",
      capital_social: 12000000,
    },
    "id",
  );

  for (const u of USERS) {
    if (DRY_RUN) {
      u.authId = u.id;
      auth[u.key] = u.id;
      continue;
    }

    const { data: existing, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) throw new Error(`No se pudieron listar usuarios: ${listErr.message}`);
    const found = (existing?.users ?? []).find((x) => x.email?.toLowerCase() === u.email.toLowerCase());

    let authId = found?.id;
    if (!authId) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { nombre_completo: u.nombre, demo: true },
      });
      if (error) throw new Error(`No se pudo crear ${u.email}: ${error.message}`);
      authId = data.user.id;
    } else {
      const { error } = await supabase.auth.admin.updateUserById(authId, {
        password: DEMO_PASSWORD,
        user_metadata: { nombre_completo: u.nombre, demo: true },
      });
      if (error) throw new Error(`No se pudo actualizar ${u.email}: ${error.message}`);
    }

    u.authId = authId;
    auth[u.key] = authId;

    await upsert(
      "profiles",
      {
        id: authId,
        company_id: ID.company,
        nombre_completo: u.nombre,
        email: u.email,
      },
      "id",
    );

    await upsert(
      "user_roles",
      {
        id: uid(`user_role:${u.key}`),
        user_id: authId,
        company_id: ID.company,
        role: u.role,
      },
      "id",
    );
  }

  // El trigger handle_new_user usa el id de auth; guardamos el mapeo por key.
  for (const u of USERS) {
    if (!u.authId) throw new Error(`Usuario ${u.email} sin authId`);
  }
}

const auth = {};

// ---------------------------------------------------------------------------
// 2. Catálogos base
// ---------------------------------------------------------------------------

const CLIENTES = [
  {
    id: ID.clienteA,
    tipo_persona: "moral",
    razon_social: "Inmobiliaria Los Encinos, S.A. de C.V.",
    nombre_comercial: "Los Encinos",
    rfc: "ILE150422H23",
    telefono: "33 3615 8800",
    correo: "proyectos@loseninos.mx",
    contacto_nombre: "Laura Méndez Covarrubias",
    contacto_telefono: "33 3615 8812",
    condiciones_pago: 30,
    limite_credito: 5000000,
    calle: "Av. Paseo de los Encinos",
    numero_exterior: "245",
    colonia: "Los Encinos",
    municipio: "Zapopan",
    estado: "Jalisco",
    codigo_postal: "45116",
    estatus_autorizacion: "autorizado",
    datos_contacto: { cargo: "Gerente de proyectos", correo: "proyectos@loseninos.mx" },
  },
  {
    id: ID.clienteB,
    tipo_persona: "moral",
    razon_social: "Logística Integral Bajío, S. de R.L. de C.V.",
    nombre_comercial: "Logística Bajío",
    rfc: "LIB180915K45",
    telefono: "477 712 3400",
    correo: "compras@logisticabajio.mx",
    contacto_nombre: "Carlos Ramírez del Toro",
    contacto_telefono: "477 712 3418",
    condiciones_pago: 45,
    limite_credito: 8000000,
    calle: "Blvd. Apolo",
    numero_exterior: "1200",
    colonia: "Parque Industrial Apolo",
    municipio: "León",
    estado: "Guanajuato",
    codigo_postal: "37295",
    estatus_autorizacion: "autorizado",
    datos_contacto: { cargo: "Director de operaciones", correo: "compras@logisticabajio.mx" },
  },
  {
    id: ID.clienteC,
    tipo_persona: "moral",
    razon_social: "Desarrollos Punta Norte, S.A. de C.V.",
    nombre_comercial: "Punta Norte",
    rfc: "DPN190228Q71",
    telefono: "322 225 6700",
    correo: "contacto@punta-norte.mx",
    contacto_nombre: "Sofía Álvarez Michel",
    condiciones_pago: 30,
    calle: "Av. Francisco Medina Ascencio",
    numero_exterior: "2450",
    colonia: "Zona Hotelera Norte",
    municipio: "Puerto Vallarta",
    estado: "Jalisco",
    codigo_postal: "48300",
    estatus_autorizacion: "autorizado",
    datos_contacto: { cargo: "Gerente de desarrollo", correo: "contacto@punta-norte.mx" },
  },
];

const TERCEROS = [
  {
    key: "cementos",
    razon_social: "Cementos y Concretos del Bajío, S.A. de C.V.",
    nombre_comercial: "Cementos Bajío",
    rfc: "CCB120618T78",
    categoria: "proveedor",
    tipo_persona: "moral",
    telefono: "477 123 4500",
    correo: "ventas@cementosbajio.mx",
    contacto_nombre: "Arturo Villanueva",
    credito_disponible: 1500000,
    dias_credito: 30,
    requiere_factura: true,
    calle: "Blvd. Juan Alonso de Torres",
    numero_exterior: "1315",
    colonia: "Valle del Campestre",
    municipio: "León",
    estado: "Guanajuato",
    codigo_postal: "37150",
    estatus_autorizacion: "autorizado",
  },
  {
    key: "aceros",
    razon_social: "Aceros y Perfiles de Occidente, S.A. de C.V.",
    nombre_comercial: "Aceros Occidente",
    rfc: "APO100812L34",
    categoria: "proveedor",
    tipo_persona: "moral",
    telefono: "33 3812 6600",
    correo: "proyectos@acerosoccidente.mx",
    contacto_nombre: "Mauricio Brambila",
    credito_disponible: 2200000,
    dias_credito: 30,
    requiere_factura: true,
    calle: "Carr. Guadalajara-Chapala Km 12",
    numero_exterior: "850",
    colonia: "El Salto",
    municipio: "El Salto",
    estado: "Jalisco",
    codigo_postal: "45680",
    estatus_autorizacion: "autorizado",
  },
  {
    key: "electricos",
    razon_social: "Materiales Eléctricos Guadalajara, S.A. de C.V.",
    nombre_comercial: "MEESA",
    rfc: "MEG151120P22",
    categoria: "proveedor",
    tipo_persona: "moral",
    telefono: "33 3619 4400",
    correo: "cotizaciones@meesa.mx",
    contacto_nombre: "Diana Robles",
    credito_disponible: 900000,
    dias_credito: 30,
    requiere_factura: true,
    calle: "Av. Colón",
    numero_exterior: "620",
    colonia: "Centro",
    municipio: "Guadalajara",
    estado: "Jalisco",
    codigo_postal: "44100",
    estatus_autorizacion: "autorizado",
  },
  {
    key: "maquinaria",
    razon_social: "Renta de Maquinaria del Bajío, S. de R.L. de C.V.",
    nombre_comercial: "Maquinaria Bajío",
    rfc: "RMB140305N90",
    categoria: "proveedor",
    tipo_persona: "moral",
    telefono: "477 771 2200",
    correo: "rentas@maquinariabajio.mx",
    contacto_nombre: "Eduardo Lomelí",
    dias_credito: 15,
    requiere_factura: true,
    calle: "Carretera Silao-León Km 8",
    numero_exterior: "400",
    colonia: "Parque Industrial Las Colinas",
    municipio: "Silao",
    estado: "Guanajuato",
    codigo_postal: "36170",
    disponible_renta: true,
    estatus_autorizacion: "autorizado",
  },
  {
    key: "gruas",
    razon_social: "Transportes y Grúas del Centro, S.A. de C.V.",
    nombre_comercial: "Grúas del Centro",
    rfc: "TGC090527R11",
    categoria: "proveedor",
    tipo_persona: "moral",
    telefono: "33 3633 7700",
    correo: "operaciones@gruasdelcentro.mx",
    contacto_nombre: "Sergio Ibarra",
    dias_credito: 15,
    requiere_factura: true,
    calle: "Av. 8 de Julio",
    numero_exterior: "2270",
    colonia: "Ferrocarril",
    municipio: "Guadalajara",
    estado: "Jalisco",
    codigo_postal: "44440",
    disponible_renta: true,
    estatus_autorizacion: "autorizado",
  },
  {
    key: "ferreteria",
    razon_social: "Ferretería Industrial León, S.A. de C.V.",
    nombre_comercial: "Ferre León",
    rfc: "FIL061130J45",
    categoria: "proveedor",
    tipo_persona: "moral",
    telefono: "477 715 9090",
    correo: "ventas@ferreleon.mx",
    contacto_nombre: "Rosa María Delgado",
    dias_credito: 15,
    requiere_factura: true,
    calle: "Blvd. Mariano Escobedo",
    numero_exterior: "3200",
    colonia: "San Marcos",
    municipio: "León",
    estado: "Guanajuato",
    codigo_postal: "37340",
    estatus_autorizacion: "autorizado",
  },
  {
    key: "electro",
    razon_social: "Electroinstalaciones del Occidente, S.A. de C.V.",
    nombre_comercial: "Electro Occidente",
    rfc: "EDO110422B88",
    categoria: "contratista",
    tipo_persona: "moral",
    telefono: "33 3825 4400",
    correo: "contratos@electrooccidente.mx",
    contacto_nombre: "Héctor Quintero",
    tipo_trabajos: "Instalaciones eléctricas y voz/datos",
    fondo_garantia: true,
    fondo_garantia_pct: 5,
    dias_credito: 30,
    requiere_factura: true,
    calle: "Av. Niños Héroes",
    numero_exterior: "1120",
    colonia: "Moderna",
    municipio: "Guadalajara",
    estado: "Jalisco",
    codigo_postal: "44190",
    estatus_autorizacion: "autorizado",
  },
  {
    key: "hidro",
    razon_social: "Hidrosanitaria y Contra Incendios de México, S.A. de C.V.",
    nombre_comercial: "Hidromex",
    rfc: "HCI130918M56",
    categoria: "contratista",
    tipo_persona: "moral",
    telefono: "33 3673 2200",
    correo: "licitaciones@hidromex.mx",
    contacto_nombre: "Fernanda Solís",
    tipo_trabajos: "Instalación hidrosanitaria y sistemas contra incendio",
    fondo_garantia: true,
    fondo_garantia_pct: 5,
    dias_credito: 30,
    requiere_factura: true,
    calle: "Calle 3",
    numero_exterior: "285",
    colonia: "Parque Industrial El Castillo",
    municipio: "Tlajomulco de Zúñiga",
    estado: "Jalisco",
    codigo_postal: "45655",
    estatus_autorizacion: "autorizado",
  },
  {
    key: "estructuras",
    razon_social: "Estructuras Metálicas del Bajío, S.A. de C.V.",
    nombre_comercial: "Estructuras Bajío",
    rfc: "EMB080714F29",
    categoria: "contratista",
    tipo_persona: "moral",
    telefono: "477 167 8800",
    correo: "proyectos@estructurasbajio.mx",
    contacto_nombre: "Raúl Ochoa",
    tipo_trabajos: "Fabricación y montaje de estructura metálica",
    fondo_garantia: true,
    fondo_garantia_pct: 5,
    dias_credito: 30,
    requiere_factura: true,
    calle: "Blvd. Aeropuerto",
    numero_exterior: "1450",
    colonia: "Parque Industrial Delta",
    municipio: "León",
    estado: "Guanajuato",
    codigo_postal: "37545",
    estatus_autorizacion: "autorizado",
  },
  {
    key: "pavimentos",
    razon_social: "Pavimentos Industriales de Guanajuato, S.A. de C.V.",
    nombre_comercial: "Pavimentos GTO",
    rfc: "PIG160601X43",
    categoria: "contratista",
    tipo_persona: "moral",
    telefono: "477 325 6100",
    correo: "contacto@pavimentosgto.mx",
    contacto_nombre: "Javier Muñoz",
    tipo_trabajos: "Pavimento de concreto y asfalto industrial",
    fondo_garantia: true,
    fondo_garantia_pct: 5,
    dias_credito: 30,
    requiere_factura: true,
    calle: "Carr. León-San Francisco Km 5",
    numero_exterior: "120",
    colonia: "San Francisco del Rincón",
    municipio: "San Francisco del Rincón",
    estado: "Guanajuato",
    codigo_postal: "36300",
    estatus_autorizacion: "autorizado",
  },
  {
    key: "block",
    razon_social: "Block y Tabique de Jalisco, S.A. de C.V.",
    nombre_comercial: "Block Jalisco",
    rfc: "BTJ050217V12",
    categoria: "proveedor",
    tipo_persona: "moral",
    telefono: "33 3688 1200",
    correo: "pedidos@blockjalisco.mx",
    contacto_nombre: "Antonio Preciado",
    dias_credito: 15,
    requiere_factura: true,
    calle: "Carr. a Tesistán",
    numero_exterior: "780",
    colonia: "La Venta del Astillero",
    municipio: "Zapopan",
    estado: "Jalisco",
    codigo_postal: "45221",
    estatus_autorizacion: "autorizado",
  },
  {
    key: "pinturas",
    razon_social: "Pinturas y Acabados del Pacífico, S.A. de C.V.",
    nombre_comercial: "Pinturas Pacífico",
    rfc: "PAP170824D67",
    categoria: "proveedor",
    tipo_persona: "moral",
    telefono: "33 3660 5500",
    correo: "ventas@pinturaspacifico.mx",
    contacto_nombre: "Gabriela Iñiguez",
    dias_credito: 30,
    requiere_factura: true,
    calle: "Av. Lázaro Cárdenas",
    numero_exterior: "2100",
    colonia: "Las Torres",
    municipio: "Guadalajara",
    estado: "Jalisco",
    codigo_postal: "44920",
    estatus_autorizacion: "autorizado",
  },
  {
    key: "oficina",
    razon_social: "Servicios Administrativos Integrales del Bajío, S.C.",
    nombre_comercial: "SAIB",
    rfc: "SAI191011K89",
    categoria: "proveedor",
    tipo_persona: "moral",
    telefono: "33 3122 4400",
    correo: "servicios@saib.mx",
    contacto_nombre: "Patriciaft Osorio",
    dias_credito: 15,
    requiere_factura: true,
    calle: "Av. Américas",
    numero_exterior: "1500",
    colonia: "Providencia",
    municipio: "Guadalajara",
    estado: "Jalisco",
    codigo_postal: "44630",
    estatus_autorizacion: "autorizado",
  },
];

const TERCERO_ID = Object.fromEntries(TERCEROS.map((t) => [t.key, uid(`tercero:${t.key}`)]));

const CATEGORIAS = [
  { key: "cem", nombre: "Cemento y concreto", prefijo: "CEM" },
  { key: "acr", nombre: "Acero de refuerzo", prefijo: "ACR" },
  { key: "agr", nombre: "Agregados pétreos", prefijo: "AGR" },
  { key: "blk", nombre: "Block y tabique", prefijo: "BLK" },
  { key: "ele", nombre: "Material eléctrico", prefijo: "ELE" },
  { key: "hid", nombre: "Hidrosanitario", prefijo: "HID" },
  { key: "pin", nombre: "Pintura y acabados", prefijo: "PIN" },
  { key: "her", nombre: "Herramienta y consumibles", prefijo: "HER" },
  { key: "mad", nombre: "Madera y cimbra", prefijo: "MAD" },
  { key: "equ", nombre: "Equipo y renta", prefijo: "EQU" },
];

const INSUMOS = [
  { key: "cem1", cat: "cem", codigo: "CEM-0001", nombre: "Cemento Portland CPC 50 kg", unidad: "SACO", precio: 245 },
  { key: "cem2", cat: "cem", codigo: "CEM-0002", nombre: "Concreto premezclado f'c=250 kg/cm²", unidad: "M3", precio: 2450 },
  { key: "cem3", cat: "cem", codigo: "CEM-0003", nombre: "Mortero premezclado", unidad: "SACO", precio: 185 },
  { key: "acr1", cat: "acr", codigo: "ACR-0001", nombre: "Acero de refuerzo No. 3", unidad: "KG", precio: 27.5 },
  { key: "acr2", cat: "acr", codigo: "ACR-0002", nombre: "Acero de refuerzo No. 4", unidad: "KG", precio: 26.8 },
  { key: "acr3", cat: "acr", codigo: "ACR-0003", nombre: "Malla electrosoldada 6x6-10/10", unidad: "M2", precio: 48 },
  { key: "agr1", cat: "agr", codigo: "AGR-0001", nombre: "Arena cribada", unidad: "M3", precio: 380 },
  { key: "agr2", cat: "agr", codigo: "AGR-0002", nombre: "Grava triturada 3/4\"", unidad: "M3", precio: 420 },
  { key: "blk1", cat: "blk", codigo: "BLK-0001", nombre: "Block de concreto 12x20x40", unidad: "PZA", precio: 18.5 },
  { key: "blk2", cat: "blk", codigo: "BLK-0002", nombre: "Tabique rojo recocido", unidad: "PZA", precio: 9.8 },
  { key: "ele1", cat: "ele", codigo: "ELE-0001", nombre: "Cable THW calibre 12", unidad: "ML", precio: 38 },
  { key: "ele2", cat: "ele", codigo: "ELE-0002", nombre: "Tubería conduit PVC 3/4\"", unidad: "ML", precio: 22 },
  { key: "ele3", cat: "ele", codigo: "ELE-0003", nombre: "Tablero de distribución 12 circuitos", unidad: "PZA", precio: 1850 },
  { key: "hid1", cat: "hid", codigo: "HID-0001", nombre: "Tubo PVC hidráulico 1/2\"", unidad: "ML", precio: 28 },
  { key: "hid2", cat: "hid", codigo: "HID-0002", nombre: "Tubo CPVC 3/4\"", unidad: "ML", precio: 46 },
  { key: "hid3", cat: "hid", codigo: "HID-0003", nombre: "Válvula de bola 1/2\"", unidad: "PZA", precio: 125 },
  { key: "pin1", cat: "pin", codigo: "PIN-0001", nombre: "Pintura vinílica blanca", unidad: "CUBETA", precio: 1250 },
  { key: "pin2", cat: "pin", codigo: "PIN-0002", nombre: "Sellador acrílico", unidad: "CUBETA", precio: 890 },
  { key: "pin3", cat: "pin", codigo: "PIN-0003", nombre: "Impermeabilizante prefabricado", unidad: "M2", precio: 68 },
  { key: "her1", cat: "her", codigo: "HER-0001", nombre: "Disco de corte 14\"", unidad: "PZA", precio: 85 },
  { key: "her2", cat: "her", codigo: "HER-0002", nombre: "Electrodo 6013 3/32\"", unidad: "KG", precio: 48 },
  { key: "mad1", cat: "mad", codigo: "MAD-0001", nombre: "Triplay de pino 16 mm", unidad: "PZA", precio: 620 },
  { key: "mad2", cat: "mad", codigo: "MAD-0002", nombre: "Barrote 2x4x8'", unidad: "PZA", precio: 145 },
  { key: "equ1", cat: "equ", codigo: "EQU-0001", nombre: "Andamio multidireccional (renta mensual)", unidad: "PZA", precio: 4800, disponible_renta: true },
  { key: "equ2", cat: "equ", codigo: "EQU-0002", nombre: "Revolvedora 1 saco (renta semanal)", unidad: "PZA", precio: 8500, disponible_renta: true },
];

const INSUMO_ID = Object.fromEntries(INSUMOS.map((i) => [i.key, uid(`insumo:${i.key}`)]));
const CATEGORIA_ID = Object.fromEntries(CATEGORIAS.map((c) => [c.key, uid(`categoria:${c.key}`)]));

const NOMBRES_M = [
  "José Luis", "Juan Carlos", "Miguel Ángel", "Pedro", "Francisco", "Alejandro", "Ricardo", "Fernando",
  "Raúl", "Arturo", "Sergio", "Javier", "Roberto", "Daniel", "Manuel", "Antonio", "Luis Enrique",
  "Marco Antonio", "Óscar", "Héctor", "Gerardo", "Rubén", "Alfredo", "Salvador", "Andrés", "Jorge",
  "Emilio", "Gabriel", "Iván", "Mauricio",
];
const NOMBRES_F = [
  "María Guadalupe", "Laura", "Patricia", "Ana Karen", "Verónica", "Gabriela", "Claudia", "Adriana",
  "Rosa María", "Sandra", "Mónica", "Silvia", "Leticia", "Alejandra", "Daniela", "Fernanda", "Diana",
  "Paola", "Mariana", "Cecilia",
];
const APELLIDOS = [
  "García", "Hernández", "Martínez", "López", "González", "Pérez", "Rodríguez", "Sánchez", "Ramírez",
  "Cruz", "Flores", "Gómez", "Morales", "Vázquez", "Jiménez", "Reyes", "Torres", "Díaz", "Gutiérrez",
  "Mendoza", "Aguilar", "Ortiz", "Castillo", "Romero", "Álvarez", "Chávez", "Rivera", "Juárez",
  "Domínguez", "Herrera", "Medina", "Castro", "Vargas", "Guzmán", "Rojas", "Núñez", "Luna", "Contreras",
];

function buildTrabajadores() {
  const rows = [];
  const office = [
    { key: "office1", nombre: "Luis Fernando Aguirre Campos", puesto: "administrativo", sueldo: 950, sexo: "masculino" },
    { key: "office2", nombre: "Paola Guadalupe Serrano León", puesto: "auxiliar", sueldo: 620, sexo: "femenino" },
    { key: "office3", nombre: "Claudia Estrada Navarro", puesto: "residente", sueldo: 1450, sexo: "femenino" },
  ];

  office.forEach((o, i) => {
    rows.push({
      id: uid(`trabajador:${o.key}`),
      nombre_completo: o.nombre,
      nombres: o.nombre.split(" ")[0],
      apellido_paterno: o.nombre.split(" ")[1] ?? "Pérez",
      apellido_materno: o.nombre.split(" ")[2] ?? "Gómez",
      telefono: `33 1000 ${String(2000 + i).padStart(4, "0")}`,
      correo: `oficina${i + 1}@constructoranaranja.mx`,
      direccion: "Av. López Mateos Sur 1450, Zapopan, Jalisco",
      curp: `AACL${String(800101 + i).slice(-6)}HJC${String(100 + i).padStart(3, "0")}A`,
      nss: `1234567890${i}`,
      rfc: `AACL${String(800101 + i).slice(-6)}AB${i}`,
      fecha_nacimiento: `198${i}-01-15`,
      sexo: o.sexo,
      estado_civil: "casado",
      puesto: o.puesto,
      sueldo_diario: o.sueldo,
      tipo_contrato: "permanente",
      fecha_ingreso: "2021-03-01",
      imss_estatus: "alta_activa",
      imss_fecha_alta: "2021-03-01",
      imss_nss: `1234567890${i}`,
      imss_sbc: o.sueldo * 30,
      imss_tipo_trabajador: "permanente",
      estatus_autorizacion: "autorizado",
      es_personal_oficina: true,
      periodicidad_pago: "quincenal",
      sueldo_periodo: o.sueldo * 15,
    });
  });

  const plan = [
    { obra: "A", count: 60, prefix: "A" },
    { obra: "B", count: 36, prefix: "B" },
  ];

  for (const p of plan) {
    const puestos = [];
    if (p.obra === "A") {
      puestos.push(...Array(2).fill("sobrestante"));
      puestos.push(...Array(22).fill("oficial"));
      puestos.push(...Array(26).fill("ayudante"));
      puestos.push(...Array(6).fill("operador_maquinaria"));
      puestos.push(...Array(2).fill("auxiliar"));
      puestos.push(...Array(2).fill("residente"));
    } else {
      puestos.push(...Array(1).fill("sobrestante"));
      puestos.push(...Array(12).fill("oficial"));
      puestos.push(...Array(18).fill("ayudante"));
      puestos.push(...Array(4).fill("operador_maquinaria"));
      puestos.push(...Array(1).fill("auxiliar"));
    }
    const sueldos = {
      sobrestante: 950,
      oficial: 720,
      ayudante: 430,
      operador_maquinaria: 780,
      auxiliar: 480,
      residente: 1350,
    };

    puestos.forEach((puesto, i) => {
      const idx = (p.obra === "A" ? 3 : 63) + i;
      const masc = idx % 3 !== 0;
      const nombres = masc ? NOMBRES_M : NOMBRES_F;
      const nombre = nombres[idx % nombres.length];
      const ap1 = APELLIDOS[(idx * 3) % APELLIDOS.length];
      const ap2 = APELLIDOS[(idx * 7 + 5) % APELLIDOS.length];
      const sueldo = sueldos[puesto] + (idx % 5) * 12;
      rows.push({
        id: uid(`trabajador:${p.prefix}:${i + 1}`),
        nombre_completo: `${nombre} ${ap1} ${ap2}`,
        nombres: nombre,
        apellido_paterno: ap1,
        apellido_materno: ap2,
        telefono: `${p.obra === "A" ? "33" : "477"} ${String(1000 + idx).slice(-4)} ${String(3000 + idx).slice(-4)}`,
        correo: `trabajador${p.prefix}${String(i + 1).padStart(3, "0")}@demo.pnf`,
        direccion: p.obra === "A" ? "Zapopan, Jalisco" : "León, Guanajuato",
        curp: `XAXX${String(800101 + idx).slice(-6)}HJC${String(100 + idx).padStart(3, "0")}X`,
        nss: `10${String(10000000 + idx).slice(-9)}`,
        rfc: `XAXX${String(800101 + idx).slice(-6)}AB${String(idx).padStart(2, "0").slice(-2)}`,
        fecha_nacimiento: `198${idx % 9}-${String((idx % 12) + 1).padStart(2, "0")}-${String((idx % 27) + 1).padStart(2, "0")}`,
        sexo: masc ? "masculino" : "femenino",
        estado_civil: idx % 2 ? "casado" : "soltero",
        puesto,
        sueldo_diario: sueldo,
        tipo_contrato: idx % 8 === 0 ? "permanente" : "eventual_urbano",
        fecha_ingreso: idx % 4 === 0 ? "2026-02-16" : "2026-08-24",
        imss_estatus: "alta_activa",
        imss_fecha_alta: "2026-08-24",
        imss_nss: `10${String(10000000 + idx).slice(-9)}`,
        imss_sbc: sueldo * 30,
        imss_tipo_trabajador: "eventual",
        estatus_autorizacion: "autorizado",
        es_personal_oficina: false,
        periodicidad_pago: "semanal",
        sueldo_periodo: sueldo * 6,
      });
    });
  }

  // Destajistas (no forman parte de la nómina semanal)
  const destajistas = [
    { key: "dA1", nombre: "Felipe de Jesús Rangel Quiroz", obra: "A" },
    { key: "dA2", nombre: "Octavio Cárdenas Bravo", obra: "A" },
    { key: "dB1", nombre: "Ramiro Espinoza Salas", obra: "B" },
    { key: "dB2", nombre: "Norberto Salgado Ríos", obra: "B" },
  ];
  destajistas.forEach((d, i) => {
    rows.push({
      id: uid(`trabajador:${d.key}`),
      nombre_completo: d.nombre,
      nombres: d.nombre.split(" ")[0],
      apellido_paterno: d.nombre.split(" ")[1] ?? "Rangel",
      apellido_materno: d.nombre.split(" ")[2] ?? "Quiroz",
      telefono: `33 2000 ${String(4000 + i).padStart(4, "0")}`,
      correo: `destajo${i + 1}@demo.pnf`,
      direccion: d.obra === "A" ? "Zapopan, Jalisco" : "León, Guanajuato",
      curp: `RAQF${String(780101 + i).slice(-6)}HJC${String(200 + i).padStart(3, "0")}X`,
      nss: `20${String(20000000 + i).slice(-9)}`,
      rfc: `RAQF${String(780101 + i).slice(-6)}AB${i}`,
      fecha_nacimiento: `197${i + 2}-06-12`,
      sexo: "masculino",
      estado_civil: "casado",
      puesto: "oficial",
      sueldo_diario: 850,
      tipo_contrato: "eventual_urbano",
      fecha_ingreso: "2026-07-01",
      imss_estatus: "alta_activa",
      imss_fecha_alta: "2026-07-01",
      imss_nss: `20${String(20000000 + i).slice(-9)}`,
      imss_sbc: 25500,
      imss_tipo_trabajador: "eventual",
      estatus_autorizacion: "autorizado",
      es_personal_oficina: false,
      periodicidad_pago: "semanal",
      sueldo_periodo: 5100,
    });
  });

  return rows;
}

const TRABAJADORES = buildTrabajadores();
const TRABAJADOR_ID = Object.fromEntries(TRABAJADORES.map((t) => [t.id, t]));

const OBRAS = [
  {
    id: ID.obraA,
    nombre: "Residencial Los Encinos — Torre A",
    cliente_id: ID.clienteA,
    unidad_negocio_id: ID.unidadResidencial,
    numero_contrato: "CNB-2026-014",
    ubicacion: "Av. Paseo de los Encinos 245, Zapopan, Jalisco",
    fecha_inicio: "2026-09-21",
    fecha_terminacion: "2027-06-30",
    monto_contratado: 68203525,
    residenteKey: "residente",
    residenteNombre: "Mariana Torres",
  },
  {
    id: ID.obraB,
    nombre: "Ampliación Nave Industrial Bajío",
    cliente_id: ID.clienteB,
    unidad_negocio_id: ID.unidadIndustrial,
    numero_contrato: "CNB-2026-021",
    ubicacion: "Blvd. Apolo 1200, Parque Industrial Apolo, León, Guanajuato",
    fecha_inicio: "2026-09-21",
    fecha_terminacion: "2027-03-31",
    monto_contratado: 42723500,
    residenteKey: "residente2",
    residenteNombre: "Jorge Luis Mendoza",
  },
];

async function seedCatalogos() {
  log("→ Catálogos, clientes, proveedores y trabajadores…");

  await insert("unidades_negocio", [
    { id: ID.unidadResidencial, company_id: ID.company, nombre: "Edificación Residencial" },
    { id: ID.unidadIndustrial, company_id: ID.company, nombre: "Nave Industrial y Logística" },
  ]);

  await insert(
    "clientes",
    CLIENTES.map(({ nombre_comercial, ...c }) => ({
      ...c,
      datos_contacto: { ...(c.datos_contacto ?? {}), nombre_comercial },
      company_id: ID.company,
      creado_por: auth.administrativo,
    })),
  );

  await insert(
    "terceros",
    TERCEROS.map((t) => ({
      id: TERCERO_ID[t.key],
      company_id: ID.company,
      tipo_persona: t.tipo_persona,
      razon_social: t.razon_social,
      nombre_comercial: t.nombre_comercial,
      rfc: t.rfc,
      telefono: t.telefono,
      correo: t.correo,
      contacto_nombre: t.contacto_nombre,
      categoria: t.categoria,
      categoria_productos: t.categoria === "proveedor" ? t.nombre_comercial : null,
      tipo_trabajos: t.tipo_trabajos ?? null,
      credito_disponible: t.credito_disponible ?? 0,
      dias_credito: t.dias_credito ?? 0,
      requiere_factura: t.requiere_factura ?? true,
      fondo_garantia: t.fondo_garantia ?? false,
      fondo_garantia_pct: t.fondo_garantia_pct ?? 0,
      disponible_renta: t.disponible_renta ?? false,
      calle: t.calle,
      numero_exterior: t.numero_exterior,
      colonia: t.colonia,
      municipio: t.municipio,
      estado: t.estado,
      codigo_postal: t.codigo_postal,
      estatus_autorizacion: t.estatus_autorizacion,
      creado_por: auth.administrativo,
    })),
  );

  await insert("insumo_categorias", CATEGORIAS.map((c) => ({
    id: CATEGORIA_ID[c.key],
    company_id: ID.company,
    nombre: c.nombre,
    prefijo: c.prefijo,
  })));

  await insert("insumo_unidades", ["PZA", "M3", "M2", "KG", "ML", "SACO", "CUBETA"].map((u, i) => ({
    id: uid(`unidad:insumo:${u}`),
    company_id: ID.company,
    codigo: u,
    nombre: {
      PZA: "Pieza",
      M3: "Metro cúbico",
      M2: "Metro cuadrado",
      KG: "Kilogramo",
      ML: "Metro lineal",
      SACO: "Saco",
      CUBETA: "Cubeta",
    }[u],
  })));

  await insert(
    "insumos",
    INSUMOS.map((i) => ({
      id: INSUMO_ID[i.key],
      company_id: ID.company,
      categoria_id: CATEGORIA_ID[i.cat],
      nombre: i.nombre,
      unidad: i.unidad,
      codigo: i.codigo,
      estatus: "autorizado",
      disponible_renta: i.disponible_renta ?? false,
      solicitado_por: auth.residente,
      autorizado_por: auth.director,
      autorizado_at: at("2026-09-10", 10),
    })),
  );

  await insert(
    "insumos_historial_precios",
    INSUMOS.flatMap((i, idx) => [
      {
        id: uid(`precio:${i.key}:1`),
        insumo_id: INSUMO_ID[i.key],
        precio_unitario: round2(i.precio * 0.97),
        proveedor: TERCEROS[idx % TERCEROS.length].nombre_comercial,
        fecha: "2026-09-01",
        obra_id: null,
        cantidad: 1,
      },
      {
        id: uid(`precio:${i.key}:2`),
        insumo_id: INSUMO_ID[i.key],
        precio_unitario: i.precio,
        proveedor: TERCEROS[(idx + 3) % TERCEROS.length].nombre_comercial,
        fecha: "2026-10-01",
        obra_id: null,
        cantidad: 1,
      },
    ]),
  );

  await insert("trabajadores", TRABAJADORES.map((t) => ({ ...t, company_id: ID.company, creado_por: auth.administrativo })));

  await insert(
    "obras",
    OBRAS.map((o) => ({
      id: o.id,
      company_id: ID.company,
      nombre: o.nombre,
      cliente_id: o.cliente_id,
      unidad_negocio_id: o.unidad_negocio_id,
      numero_contrato: o.numero_contrato,
      ubicacion: o.ubicacion,
      fecha_inicio: o.fecha_inicio,
      fecha_terminacion: o.fecha_terminacion,
      monto_contratado: o.monto_contratado,
      created_by: auth.director,
    })),
  );

  const teamRows = [];
  for (const o of OBRAS) {
    teamRows.push(
      { id: uid(`team:${o.id}:residente`), obra_id: o.id, user_id: auth[o.residenteKey], role: "residente" },
      { id: uid(`team:${o.id}:administrativo`), obra_id: o.id, user_id: auth.administrativo, role: "administrativo" },
      { id: uid(`team:${o.id}:supervisor`), obra_id: o.id, user_id: auth.supervisor, role: "supervisor" },
      { id: uid(`team:${o.id}:director`), obra_id: o.id, user_id: auth.director, role: "director" },
      { id: uid(`team:${o.id}:auxiliar`), obra_id: o.id, user_id: auth.auxiliar, role: "auxiliar" },
    );
  }
  await insert("obra_team", teamRows);

  await insert("obra_comisiones", [
    { id: uid("comision:A"), obra_id: ID.obraA, user_id: auth.residente, porcentaje: 1.2, base_calculo: "utilidad" },
    { id: uid("comision:B"), obra_id: ID.obraB, user_id: auth.residente2, porcentaje: 1.0, base_calculo: "utilidad" },
    { id: uid("comision:dir"), obra_id: ID.obraA, user_id: auth.director, porcentaje: 0.5, base_calculo: "monto_contratado" },
  ]);
}

// ---------------------------------------------------------------------------
// 3. Presupuestos
// ---------------------------------------------------------------------------

const BUDGET_A = {
  groups: [
    ["1", "Preliminares"],
    ["2", "Cimentación"],
    ["3", "Estructura"],
    ["4", "Albañilería"],
    ["5", "Instalaciones"],
    ["6", "Acabados"],
    ["7", "Obra exterior"],
    ["8", "Gestión y servicios"],
  ],
  leaves: [
    ["1.1", "Limpieza y trazo", "M2", 1250, 85.5, "preliminares"],
    ["1.2", "Excavación masiva", "M3", 3800, 185, "preliminares"],
    ["1.3", "Plantilla de concreto", "M3", 620, 1850, "preliminares"],
    ["2.1", "Zapata corrida f'c=250", "M3", 480, 3450, "cimentacion"],
    ["2.2", "Acero de refuerzo", "KG", 42000, 34.5, "cimentacion"],
    ["2.3", "Muro de contención", "M3", 310, 4250, "cimentacion"],
    ["3.1", "Columnas de concreto", "M3", 560, 4850, "estructura"],
    ["3.2", "Losas macizas", "M2", 1850, 2950, "estructura"],
    ["3.3", "Acero estructural", "KG", 128000, 36.2, "estructura"],
    ["3.4", "Cimbra", "M2", 6400, 285, "estructura"],
    ["3.5", "Muros de concreto", "M3", 1100, 4650, "estructura"],
    ["4.1", "Muro block 12x20x40", "M2", 3850, 720, "albanileria"],
    ["4.2", "Aplanado cemento-arena", "M2", 5200, 295, "albanileria"],
    ["4.3", "Pisos cerámicos", "M2", 2400, 685, "albanileria"],
    ["4.4", "Muros de tablaroca", "M2", 2800, 485, "albanileria"],
    ["5.1", "Instalación hidrosanitaria", "SALIDA", 1450, 1280, "instalaciones"],
    ["5.2", "Instalación eléctrica", "SALIDA", 2100, 985, "instalaciones"],
    ["5.3", "Aire acondicionado", "EQUIPO", 38, 28500, "instalaciones"],
    ["5.4", "Red contra incendios", "ML", 1200, 1450, "instalaciones"],
    ["5.5", "Sistema de bombeo", "EQUIPO", 4, 185000, "instalaciones"],
    ["5.6", "Elevadores", "EQUIPO", 2, 2450000, "instalaciones"],
    ["6.1", "Pintura vinílica", "M2", 9800, 82, "acabados"],
    ["6.2", "Cancelería de aluminio", "M2", 620, 2850, "acabados"],
    ["6.3", "Carpintería", "PUERTA", 148, 3450, "acabados"],
    ["6.4", "Impermeabilizante", "M2", 1850, 195, "acabados"],
    ["6.5", "Fachada de cristal templado", "M2", 1500, 3250, "acabados"],
    ["6.6", "Herrería y protecciones", "ML", 480, 1850, "acabados"],
    ["7.1", "Pavimento de concreto", "M2", 2400, 1150, "exterior"],
    ["7.2", "Jardinería", "M2", 1100, 380, "exterior"],
    ["7.3", "Cisterna y bombeo", "PZA", 1, 1250000, "exterior"],
    ["7.4", "Muro perimetral", "ML", 620, 1950, "exterior"],
    ["7.5", "Andadores y banquetas", "M2", 1850, 780, "exterior"],
    ["8.1", "Gestión y supervisión", "SERVICIO", 1, 2850000, "gestion"],
    ["8.2", "Limpieza final de obra", "SERVICIO", 1, 480000, "gestion"],
    ["8.3", "Pruebas y puesta en marcha", "SERVICIO", 1, 620000, "gestion"],
  ],
};

const BUDGET_B = {
  groups: [
    ["1", "Preliminares"],
    ["2", "Cimentación"],
    ["3", "Estructura metálica"],
    ["4", "Albañilería"],
    ["5", "Instalaciones"],
    ["6", "Acabados"],
    ["7", "Obra exterior"],
    ["8", "Gestión y servicios"],
    ["9", "Estructura complementaria"],
  ],
  leaves: [
    ["1.1", "Trazo y nivelación", "M2", 1800, 75, "preliminares"],
    ["1.2", "Excavación y retiro", "M3", 2400, 165, "preliminares"],
    ["1.3", "Plantilla de concreto", "M3", 480, 1780, "preliminares"],
    ["2.1", "Zapatas aisladas", "M3", 380, 3350, "cimentacion"],
    ["2.2", "Acero de refuerzo", "KG", 32000, 34, "cimentacion"],
    ["2.3", "Concreto premezclado en muros", "M3", 290, 3950, "cimentacion"],
    ["3.1", "Columna IPR", "KG", 86000, 38.5, "estructura"],
    ["3.2", "Armaduras y trabes", "KG", 52000, 42, "estructura"],
    ["3.3", "Lámina deck", "M2", 4200, 395, "estructura"],
    ["3.4", "Placa colaborante y malla", "M2", 4200, 185, "estructura"],
    ["3.5", "Muros de concreto", "M3", 760, 4450, "estructura"],
    ["3.6", "Entrepiso de concreto", "M2", 1100, 1650, "estructura"],
    ["4.1", "Muro block", "M2", 2300, 690, "albanileria"],
    ["4.2", "Aplanado", "M2", 3100, 285, "albanileria"],
    ["4.3", "Firmes de concreto", "M2", 2600, 560, "albanileria"],
    ["5.1", "Instalación hidrosanitaria", "SALIDA", 820, 1250, "instalaciones"],
    ["5.2", "Instalación eléctrica", "SALIDA", 1150, 980, "instalaciones"],
    ["5.3", "Red contra incendios", "ML", 850, 1420, "instalaciones"],
    ["5.4", "Ventilación industrial", "EQUIPO", 12, 42000, "instalaciones"],
    ["6.1", "Pintura industrial", "M2", 7200, 78, "acabados"],
    ["6.2", "Pisos epóxicos", "M2", 2200, 495, "acabados"],
    ["6.3", "Cancelería metálica", "M2", 340, 2150, "acabados"],
    ["6.4", "Impermeabilizante", "M2", 4300, 185, "acabados"],
    ["6.5", "Recubrimiento de fachada", "M2", 2100, 205, "acabados"],
    ["7.1", "Pavimento asfáltico", "M2", 1900, 920, "exterior"],
    ["7.2", "Patio de maniobras", "M2", 2800, 780, "exterior"],
    ["7.3", "Cerco perimetral", "ML", 540, 1650, "exterior"],
    ["7.4", "Caseta de vigilancia", "PZA", 1, 385000, "exterior"],
    ["8.1", "Gestión y supervisión", "SERVICIO", 1, 2250000, "gestion"],
    ["8.2", "Limpieza final", "SERVICIO", 1, 420000, "gestion"],
    ["8.3", "Pruebas y puesta en marcha", "SERVICIO", 1, 510000, "gestion"],
    ["9.1", "Mezzanine de oficinas", "M2", 950, 1950, "complementaria"],
    ["9.2", "Escaleras metálicas", "PZA", 8, 58000, "complementaria"],
    ["9.3", "Andenes de carga", "PZA", 6, 125000, "complementaria"],
  ],
};

const ADENDA_A = [
  ["8.4", "Muro de contención adicional sótano", "M3", 180, 4250, "adicion"],
  ["6.7", "Cancelería de aluminio línea alta (adicional)", "M2", 620, 1250, "adicion"],
  ["5.7", "Red de datos y CCTV", "SERVICIO", 1, 607600, "adicion"],
];

const ADENDA_B = [
  ["9.4", "Oficinas modulares", "M2", 320, 4850, "adicion"],
  ["7.5", "Ampliación patio de maniobras", "M2", 300, 780, "adicion"],
  ["1.4", "Retiro de escombro adicional", "SERVICIO", 1, 66000, "adicion"],
];

function budgetRows(presupuestoId, groups, leaves) {
  const importeLeaf = new Map();
  const rows = [];

  for (const [clave, concepto] of groups) {
    const children = leaves.filter((l) => l[0].startsWith(`${clave}.`));
    const importe = children.reduce((s, l) => s + l[3] * l[4], 0);
    rows.push({
      id: uid(`renglon:${presupuestoId}:${clave}`),
      presupuesto_id: presupuestoId,
      clave,
      nivel: 1,
      parent_clave: null,
      concepto,
      unidad: null,
      cantidad: null,
      precio_unitario: null,
      importe: round2(importe),
      es_grupo: true,
      orden: rows.length,
      tipo_movimiento: "renglon",
      importe_delta: 0,
    });
  }

  for (const [clave, concepto, unidad, cantidad, pu] of leaves) {
    const importe = round2(cantidad * pu);
    importeLeaf.set(clave, importe);
    rows.push({
      id: uid(`renglon:${presupuestoId}:${clave}`),
      presupuesto_id: presupuestoId,
      clave,
      nivel: clave.split(".").length,
      parent_clave: clave.includes(".") ? clave.slice(0, clave.lastIndexOf(".")) : null,
      concepto,
      unidad,
      cantidad,
      precio_unitario: pu,
      importe,
      es_grupo: false,
      orden: 0,
      tipo_movimiento: "renglon",
      importe_delta: 0,
    });
  }

  // Orden WBS
  rows.sort((a, b) => {
    const pa = a.clave.split(".").map(Number);
    const pb = b.clave.split(".").map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const x = pa[i] ?? -1;
      const y = pb[i] ?? -1;
      if (x !== y) return x - y;
    }
    return 0;
  });
  rows.forEach((r, i) => {
    r.orden = i;
  });

  const total = leaves.reduce((s, l) => s + l[3] * l[4], 0);
  return { rows, total: round2(total) };
}

function adendaRows(presupuestoId, items, startOrder = 0) {
  let order = startOrder;
  return items.map(([clave, concepto, unidad, cantidad, pu]) => {
    const importe = round2(cantidad * pu);
    return {
      id: uid(`renglon:${presupuestoId}:${clave}`),
      presupuesto_id: presupuestoId,
      clave,
      nivel: clave.split(".").length,
      parent_clave: clave.slice(0, clave.lastIndexOf(".")),
      concepto,
      unidad,
      cantidad,
      precio_unitario: pu,
      importe,
      es_grupo: false,
      orden: order++,
      tipo_movimiento: "adicion",
      importe_delta: importe,
    };
  });
}

async function seedPresupuestos() {
  log("→ Presupuestos base y adendas…");

  const baseA = budgetRows(ID.presupuestoABase, BUDGET_A.groups, BUDGET_A.leaves);
  const baseB = budgetRows(ID.presupuestoBBase, BUDGET_B.groups, BUDGET_B.leaves);
  const adA = adendaRows(ID.presupuestoAAdenda, ADENDA_A);
  const adB = adendaRows(ID.presupuestoBAdenda, ADENDA_B);

  await insert("obra_presupuestos", [
    {
      id: ID.presupuestoABase,
      obra_id: ID.obraA,
      company_id: ID.company,
      tipo: "base",
      numero: 0,
      nombre: "Presupuesto base — Torre A",
      descripcion: "Presupuesto contractual original aprobado por dirección.",
      estatus: "autorizado",
      monto_total: baseA.total,
      created_by: auth.director,
      enviado_por: auth.residente,
      enviado_at: at("2026-09-18", 10),
      autorizado_por: auth.director,
      autorizado_at: at("2026-09-19", 9),
    },
    {
      id: ID.presupuestoAAdenda,
      obra_id: ID.obraA,
      company_id: ID.company,
      tipo: "adenda",
      numero: 1,
      nombre: "OC-01 — Ampliación sótano y CCTV",
      descripcion: "Muro de contención adicional, cancelería de línea alta y red de datos/CCTV.",
      estatus: "autorizado",
      monto_total: round2(adA.reduce((s, r) => s + r.importe_delta, 0)),
      created_by: auth.director,
      enviado_por: auth.residente,
      enviado_at: at("2026-10-06", 11),
      autorizado_por: auth.director,
      autorizado_at: at("2026-10-08", 16),
    },
    {
      id: ID.presupuestoBBase,
      obra_id: ID.obraB,
      company_id: ID.company,
      tipo: "base",
      numero: 0,
      nombre: "Presupuesto base — Nave Industrial",
      descripcion: "Presupuesto contractual original de ampliación de nave.",
      estatus: "autorizado",
      monto_total: baseB.total,
      created_by: auth.director,
      enviado_por: auth.residente2,
      enviado_at: at("2026-09-18", 12),
      autorizado_por: auth.director,
      autorizado_at: at("2026-09-19", 10),
    },
    {
      id: ID.presupuestoBAdenda,
      obra_id: ID.obraB,
      company_id: ID.company,
      tipo: "adenda",
      numero: 1,
      nombre: "OC-01 — Oficinas modulares y patio",
      descripcion: "Oficinas modulares, ampliación de patio y retiro de escombro.",
      estatus: "autorizado",
      monto_total: round2(adB.reduce((s, r) => s + r.importe_delta, 0)),
      created_by: auth.director,
      enviado_por: auth.residente2,
      enviado_at: at("2026-10-13", 9),
      autorizado_por: auth.director,
      autorizado_at: at("2026-10-14", 17),
    },
  ]);

  await insert("obra_presupuesto_renglones", [...baseA.rows, ...baseB.rows, ...adA, ...adB]);

  const totalA = round2(baseA.total + adA.reduce((s, r) => s + r.importe_delta, 0));
  const totalB = round2(baseB.total + adB.reduce((s, r) => s + r.importe_delta, 0));
  if (!DRY_RUN) {
    const { error: e1 } = await supabase
      .from("obras")
      .update({ monto_contratado: totalA })
      .eq("id", ID.obraA);
    if (e1) throw new Error(`No se pudo actualizar el monto contratado de la obra A: ${e1.message}`);
    const { error: e2 } = await supabase
      .from("obras")
      .update({ monto_contratado: totalB })
      .eq("id", ID.obraB);
    if (e2) throw new Error(`No se pudo actualizar el monto contratado de la obra B: ${e2.message}`);
  }
  log(`  Obra A: presupuesto vigente ${money(totalA)} · Obra B: ${money(totalB)}`);

  return { baseA, baseB, adA, adB };
}

// ---------------------------------------------------------------------------
// 4. Tesorería
// ---------------------------------------------------------------------------

const CUENTAS = [
  { id: ID.cuentaBBVA, nombre: "BBVA — Cuenta maestra", tipo: "bancaria", banco: "BBVA México", numero_cuenta: "0123456789", clabe: "012180001234567890", saldo_inicial: 9500000 },
  { id: ID.cuentaSantander, nombre: "Santander — Operación obras", tipo: "bancaria", banco: "Santander", numero_cuenta: "9876543210", clabe: "014180009876543210", saldo_inicial: 5200000 },
  { id: ID.cuentaCaja, nombre: "Caja fuerte corporativa", tipo: "caja_fuerte", banco: null, numero_cuenta: null, clabe: null, saldo_inicial: 350000 },
];

async function seedCuentas() {
  log("→ Cuentas de tesorería…");
  await insert(
    "cuentas",
    CUENTAS.map((c) => ({
      ...c,
      company_id: ID.company,
      moneda: "MXN",
      saldo_actual: c.saldo_inicial,
      activa: true,
      notas: c.tipo === "caja_fuerte" ? "Fondo fijo para pagos menores y caja chica." : null,
      created_by: auth.director,
    })),
  );

  await insert(
    "cuenta_movimientos",
    CUENTAS.map((c) => ({
      id: uid(`mov:apertura:${c.id}`),
      cuenta_id: c.id,
      company_id: ID.company,
      fecha: "2026-09-01",
      tipo: "ingreso",
      monto: c.saldo_inicial,
      concepto: "Apertura de cuenta / saldo inicial de demo",
      referencia: "APERTURA-2026",
      origen: "apertura",
      origen_id: null,
      creado_por: auth.director,
    })),
  );
}

// ---------------------------------------------------------------------------
// Helpers de tesorería / CxP
// ---------------------------------------------------------------------------

const SALDOS = new Map(CUENTAS.map((c) => [c.id, Number(c.saldo_inicial)]));

function weekDate(weekIndex, dayOffset = 0) {
  return isoDate(addDays(new Date(`${WEEKS[weekIndex].inicio}T12:00:00Z`), dayOffset));
}

async function registrarPago({
  key,
  cuentaId,
  fecha,
  monto,
  metodo = "transferencia",
  referencia = null,
  concepto,
  origenTipo,
  origenId,
  cxpId = null,
  notas = null,
}) {
  const importe = round2(monto);
  if (!(importe > 0)) return null;
  if (!SALDOS.has(cuentaId)) throw new Error(`Cuenta desconocida en pago ${key}`);

  const pagoId = uid(`pago:${key}`);
  const movId = uid(`mov:pago:${key}`);

  await insert("cuenta_movimientos", {
    id: movId,
    cuenta_id: cuentaId,
    company_id: ID.company,
    fecha,
    tipo: "egreso",
    monto: importe,
    concepto,
    referencia,
    origen: "pago",
    origen_id: pagoId,
    creado_por: auth.director,
  });

  await insert("pagos", {
    id: pagoId,
    company_id: ID.company,
    cuenta_id: cuentaId,
    fecha,
    monto: importe,
    metodo,
    referencia,
    concepto,
    notas,
    origen_tipo: origenTipo,
    origen_id: origenId,
    cuenta_movimiento_id: movId,
    cxp_id: cxpId,
    creado_por: auth.director,
  });

  SALDOS.set(cuentaId, round2((SALDOS.get(cuentaId) ?? 0) - importe));
  return { pagoId, movId };
}

async function crearCxP({
  key,
  obraId = null,
  beneficiarioTipo,
  beneficiarioId,
  beneficiarioNombre,
  concepto,
  origenTipo,
  origenId = null,
  monto,
  fechaEmision,
  fechaVencimiento = null,
  montoPagado = 0,
  estatus = "pendiente",
}) {
  const id = uid(`cxp:${key}`);
  const total = round2(monto);
  const pagado = round2(montoPagado);
  await insert("cuentas_por_pagar", {
    id,
    company_id: ID.company,
    obra_id: obraId,
    folio: `CxP-${new Date().getFullYear()}-${String(crearCxP.seq++).padStart(4, "0")}`,
    fecha_emision: fechaEmision,
    fecha_vencimiento: fechaVencimiento,
    beneficiario_tipo: beneficiarioTipo,
    beneficiario_id: beneficiarioId,
    beneficiario_nombre: beneficiarioNombre,
    concepto,
    origen_tipo: origenTipo,
    origen_id: origenId,
    monto_total: total,
    monto_pagado: pagado,
    estatus,
    creado_por: auth.administrativo,
  });
  return { id, monto_total: total, monto_pagado: pagado };
}
crearCxP.seq = 1;

async function pagarCxP(cxp, { key, fecha, cuentaId, metodo = "transferencia", referencia = null, notas = null }) {
  const saldo = round2(Number(cxp.monto_total) - Number(cxp.monto_pagado));
  if (!(saldo > 0)) return;
  await registrarPago({
    key,
    cuentaId,
    fecha,
    monto: saldo,
    metodo,
    referencia,
    concepto: `Pago CxP ${cxp.id.slice(0, 8)}`,
    origenTipo: "cxp",
    origenId: cxp.id,
    cxpId: cxp.id,
    notas,
  });
  if (!DRY_RUN) {
    const { error } = await supabase
      .from("cuentas_por_pagar")
      .update({ monto_pagado: cxp.monto_total, estatus: "pagada" })
      .eq("id", cxp.id);
    if (error) throw new Error(`No se pudo pagar la CxP ${cxp.id}: ${error.message}`);
  }
  cxp.monto_pagado = cxp.monto_total;
}

async function registrarAsiento({ key, fecha, concepto, referencia = null, origenTipo, origenId = null, movimientos }) {
  const asientoId = uid(`asiento:${key}`);
  await insert(
    "asientos_contables",
    movimientos.map((m, i) => ({
      id: uid(`asiento-row:${key}:${i + 1}`),
      company_id: ID.company,
      asiento_id: asientoId,
      fecha,
      concepto,
      referencia,
      origen_tipo: origenTipo,
      origen_id: origenId,
      tipo_movimiento: m.tipo,
      cuenta_contable: m.cuenta,
      monto: round2(m.monto),
      creado_por: auth.administrativo,
    })),
  );
}

async function actualizarSaldosCuentas() {
  if (DRY_RUN) return;
  for (const c of CUENTAS) {
    const { error } = await supabase
      .from("cuentas")
      .update({ saldo_actual: round2(SALDOS.get(c.id) ?? 0) })
      .eq("id", c.id);
    if (error) throw new Error(`No se pudo actualizar el saldo de ${c.nombre}: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// 5. Requisiciones, cotizaciones, órdenes de compra y recepciones
// ---------------------------------------------------------------------------

const INSUMO_POR_KEY = Object.fromEntries(INSUMOS.map((i) => [i.key, i]));

const REQ_ITEMS = {
  "A-001": [
    ["cem1", 600], ["cem2", 220], ["acr1", 6000], ["acr2", 3500], ["blk1", 2500],
  ],
  "A-002": [
    ["ele1", 1200], ["ele2", 800], ["ele3", 12], ["hid1", 600], ["hid2", 400], ["hid3", 80],
  ],
  "A-003": [
    ["pin1", 80], ["pin2", 60], ["pin3", 1200], ["blk2", 8000],
  ],
  "A-004": [
    ["her1", 120], ["her2", 300], ["mad1", 60], ["mad2", 200],
  ],
  "A-005": [
    ["equ1", 10], ["equ2", 4],
  ],
  "B-001": [
    ["cem2", 160], ["acr1", 9000], ["blk1", 5000], ["agr1", 300], ["agr2", 250],
  ],
  "B-002": [
    ["ele1", 1000], ["ele3", 10], ["hid1", 500], ["hid3", 60],
  ],
  "B-003": [
    ["her2", 400], ["her1", 80], ["mad2", 150],
  ],
  "B-004": [
    ["cem1", 800], ["agr1", 400], ["agr2", 300],
  ],
};

const REQUISICIONES = [
  {
    key: "A-001", obraId: ID.obraA, folio: "REQ-A-2026-001", estatus: "completada",
    creadoPor: "residente", semana: 0,
    notas: "Material para cimentación y desplante de Torre A. Entrega en obra con descarga programada.",
    paquetes: [
      { proveedor: "cementos", numero: 1, factor: 0.985 },
      { proveedor: "aceros", numero: 2, factor: 1.002 },
      { proveedor: "block", numero: 3, factor: 0.996 },
    ],
    oc: { key: "A-001-1", paqueteNumero: 1, folio: "OC-A-2026-001", estatus: "recibida", pagada: true, recepcionCompleta: true },
  },
  {
    key: "A-002", obraId: ID.obraA, folio: "REQ-A-2026-002", estatus: "en_cotizacion",
    creadoPor: "auxiliar", semana: 2,
    notas: "Instalación eléctrica e hidráulica de las primeras crujías.",
    paquetes: [
      { proveedor: "electricos", numero: 1, factor: 0.98 },
      { proveedor: "ferreteria", numero: 2, factor: 1.015 },
      { proveedor: "hidro", numero: 3, factor: 1.004 },
    ],
  },
  {
    key: "A-003", obraId: ID.obraA, folio: "REQ-A-2026-003", estatus: "pendiente_autorizacion",
    creadoPor: "residente", semana: 3,
    notas: "Acabados de muestra para departamento piloto. Requiere validación de dirección.",
    paquetes: [
      { proveedor: "pinturas", numero: 1, factor: 0.99 },
      { proveedor: "block", numero: 2, factor: 1.01 },
      { proveedor: "ferreteria", numero: 3, factor: 1.02 },
    ],
    oc: { key: "A-003-1", paqueteNumero: 1, folio: "OC-A-2026-002", estatus: "pendiente_autorizacion", pagada: false },
  },
  {
    key: "A-004", obraId: ID.obraA, folio: "REQ-A-2026-004", estatus: "enviada",
    creadoPor: "auxiliar", semana: 4,
    notas: "Consumibles de corte y cimbra para frente de estructura.",
    paquetes: [],
  },
  {
    key: "A-005", obraId: ID.obraA, folio: "REQ-A-2026-005", estatus: "rechazada",
    creadoPor: "auxiliar", semana: 4,
    notas: "Renta de equipo adicional para montaje.",
    rechazoMotivo: "No se justifica la renta: almacén central tiene andamios y revolvedoras disponibles.",
    paquetes: [],
  },
  {
    key: "B-001", obraId: ID.obraB, folio: "REQ-B-2026-001", estatus: "completada",
    creadoPor: "residente2", semana: 0,
    notas: "Concreto y acero para zapatas y dados de la ampliación.",
    paquetes: [
      { proveedor: "cementos", numero: 1, factor: 0.988 },
      { proveedor: "aceros", numero: 2, factor: 1.006 },
      { proveedor: "block", numero: 3, factor: 0.999 },
    ],
    oc: { key: "B-001-1", paqueteNumero: 1, folio: "OC-B-2026-001", estatus: "recibida", pagada: true, recepcionCompleta: true },
  },
  {
    key: "B-002", obraId: ID.obraB, folio: "REQ-B-2026-002", estatus: "en_cotizacion",
    creadoPor: "residente2", semana: 2,
    notas: "Material eléctrico e hidráulico para caseta y oficinas modulares.",
    paquetes: [
      { proveedor: "electricos", numero: 1, factor: 0.982 },
      { proveedor: "hidro", numero: 2, factor: 1.008 },
      { proveedor: "ferreteria", numero: 3, factor: 1.018 },
    ],
  },
  {
    key: "B-003", obraId: ID.obraB, folio: "REQ-B-2026-003", estatus: "enviada",
    creadoPor: "auxiliar", semana: 4,
    notas: "Herramienta de corte y madera para remates.",
    paquetes: [],
  },
  {
    key: "B-004", obraId: ID.obraB, folio: "REQ-B-2026-004", estatus: "oc_generada",
    creadoPor: "residente2", semana: 3,
    notas: "Cemento y agregados para colado de entrepiso.",
    paquetes: [
      { proveedor: "cementos", numero: 1, factor: 0.991 },
      { proveedor: "block", numero: 2, factor: 1.012 },
      { proveedor: "ferreteria", numero: 3, factor: 1.025 },
    ],
    oc: { key: "B-004-1", paqueteNumero: 1, folio: "OC-B-2026-002", estatus: "autorizada", pagada: false },
  },
];

function paqueteTotal(items) {
  return round2(items.reduce((s, it) => s + Number(it.cantidad) * Number(it.precio_unitario), 0));
}

async function seedRequisicionesCompras() {
  log("→ Requisiciones, cotizaciones, órdenes de compra y recepciones…");

  const reqRows = [];
  const itemRows = [];
  const paqueteRows = [];
  const paqueteItemRows = [];
  const ocRows = [];
  const scRows = [];
  const scItemRows = [];
  let scSeq = 0;
  const recepcionRows = [];
  const recepcionPartidaRows = [];
  const ocsParaPagar = [];
  const recepcionesData = [];

  for (const r of REQUISICIONES) {
    const base = WEEKS[r.semana];
    const enviadaAt = at(base.inicio, 8, 15);
    const cotizacionAt = r.estatus === "enviada" || r.estatus === "rechazada" ? null : at(weekDate(r.semana, 1), 12, 0);
    const autorizacionAt = ["pendiente_autorizacion", "oc_generada", "completada"].includes(r.estatus)
      ? at(weekDate(r.semana, 2), 10, 0)
      : null;
    const ocAt = ["oc_generada", "completada"].includes(r.estatus) ? at(weekDate(r.semana, 2), 16, 0) : null;

    const row = {
      id: uid(`req:${r.key}`),
      obra_id: r.obraId,
      company_id: ID.company,
      folio: r.folio,
      creado_por: auth[r.creadoPor],
      estatus: r.estatus,
      notas: r.notas,
      enviada_at: enviadaAt,
      cotizacion_at: cotizacionAt,
      cotizacion_por: cotizacionAt ? auth.administrativo : null,
      autorizacion_at: autorizacionAt,
      autorizacion_por: autorizacionAt ? auth.director : null,
      oc_at: ocAt,
      oc_por: ocAt ? auth.administrativo : null,
      completada_at: r.estatus === "completada" ? at(weekDate(r.semana, 4), 17, 0) : null,
      completada_por: r.estatus === "completada" ? auth.administrativo : null,
      rechazada_at: r.estatus === "rechazada" ? at(weekDate(r.semana, 1), 15, 0) : null,
      rechazada_por: r.estatus === "rechazada" ? auth.director : null,
      rechazo_motivo: r.rechazoMotivo ?? null,
    };
    reqRows.push(row);

    const reqItems = REQ_ITEMS[r.key] ?? [];
    for (const [insumoKey, cantidad] of reqItems) {
      itemRows.push({
        id: uid(`req-item:${r.key}:${insumoKey}`),
        requisicion_id: row.id,
        insumo_id: INSUMO_ID[insumoKey],
        cantidad,
        fecha_requerida: weekDate(r.semana, 5),
        nota: null,
      });
    }

    const paquetesCreados = [];
    for (const p of r.paquetes) {
      const paqueteId = uid(`paquete:${r.key}:${p.numero}`);
      const paqueteItems = reqItems.map(([insumoKey, cantidad]) => {
        const basePrice = INSUMO_POR_KEY[insumoKey].precio;
        return {
          id: uid(`paquete-item:${r.key}:${p.numero}:${insumoKey}`),
          paquete_id: paqueteId,
          insumo_id: INSUMO_ID[insumoKey],
          cantidad,
          precio_unitario: round4(basePrice * p.factor),
        };
      });
      paqueteRows.push({
        id: paqueteId,
        requisicion_id: row.id,
        company_id: ID.company,
        proveedor_id: TERCERO_ID[p.proveedor],
        numero: p.numero,
      });
      paqueteItemRows.push(...paqueteItems);
      paquetesCreados.push({
        ...p,
        id: paqueteId,
        total: paqueteTotal(paqueteItems),
      });

      // La solicitud de cotización (SC) es el origen del paquete: misma
      // requisición, mismo proveedor y mismos precios capturados.
      scSeq += 1;
      const scId = uid(`sc:${r.key}:${p.numero}`);
      const folioSc = `SC-2026-${String(scSeq).padStart(3, "0")}`;
      const proveedor = TERCEROS.find((t) => t.key === p.proveedor);
      scRows.push({
        id: scId,
        requisicion_id: row.id,
        company_id: ID.company,
        proveedor_id: TERCERO_ID[p.proveedor],
        folio: folioSc,
        estatus: "recibida",
        notas: `Enviada a ${proveedor?.nombre_comercial ?? "proveedor"}. Vigencia de la cotización: 15 días naturales.`,
        creado_por: auth.administrativo,
        enviada_at: at(weekDate(r.semana, 1), 9, 0),
        recibida_at: at(weekDate(r.semana, 2), 12, 0),
      });
      scItemRows.push(
        ...paqueteItems.map((pi) => ({
          id: uid(`sc-item:${r.key}:${p.numero}:${pi.insumo_id}`),
          solicitud_id: scId,
          insumo_id: pi.insumo_id,
          cantidad: pi.cantidad,
          precio_unitario: pi.precio_unitario,
          disponible: true,
          nota: null,
        })),
      );
    }

    if (r.oc) {
      const paquete = paquetesCreados.find((p) => p.numero === r.oc.paqueteNumero);
      if (!paquete) throw new Error(`Paquete ${r.oc.paqueteNumero} no encontrado para ${r.key}`);
      const ocId = uid(`oc:${r.oc.key}`);
      const total = paquete.total;
      const pagado = r.oc.pagada ? total : 0;
      ocRows.push({
        id: ocId,
        paquete_id: paquete.id,
        requisicion_id: row.id,
        company_id: ID.company,
        obra_id: r.obraId,
        proveedor_id: TERCERO_ID[paquete.proveedor],
        folio: r.oc.folio,
        estatus: r.oc.estatus,
        total,
        creado_por: auth.administrativo,
        enviada_supervisor_at: at(weekDate(r.semana, 2), 11, 0),
        autorizada_at: ["autorizada", "enviada", "recibida", "recibida_parcial", "pagada"].includes(r.oc.estatus)
          ? at(weekDate(r.semana, 2), 15, 0)
          : null,
        autorizada_por: ["autorizada", "enviada", "recibida", "recibida_parcial", "pagada"].includes(r.oc.estatus)
          ? auth.director
          : null,
        enviada_proveedor_at: ["enviada", "recibida", "recibida_parcial", "pagada"].includes(r.oc.estatus)
          ? at(weekDate(r.semana, 3), 9, 0)
          : null,
        enviada_proveedor_por: ["enviada", "recibida", "recibida_parcial", "pagada"].includes(r.oc.estatus)
          ? auth.administrativo
          : null,
        monto_pagado: pagado,
        estado_pago: pagado > 0 ? "pagado" : "pendiente",
        pagada_at: pagado > 0 ? at(weekDate(r.semana, 4), 13, 0) : null,
        notas_supervisor: null,
      });

      if (["recibida", "recibida_parcial", "pagada"].includes(r.oc.estatus)) {
        const recepcionId = uid(`recepcion:${r.oc.key}:1`);
        recepcionRows.push({
          id: recepcionId,
          company_id: ID.company,
          obra_id: r.obraId,
          oc_id: ocId,
          folio_remision: `REM-${r.oc.folio.replace("OC-", "")}`,
          fecha: weekDate(r.semana, 4),
          recibido_por: auth.residente,
          notas: r.oc.recepcionCompleta ? "Recepción completa, material verificado en obra." : "Recepción parcial: faltó una parte del pedido.",
          sin_remision: false,
        });
        const itemsPaquete = paqueteItemRows.filter((pi) => pi.paquete_id === paquete.id);
        for (const pi of itemsPaquete) {
          const cantidad = r.oc.recepcionCompleta ? pi.cantidad : round2(pi.cantidad * 0.6);
          if (cantidad <= 0) continue;
          recepcionPartidaRows.push({
            id: uid(`recepcion-partida:${r.oc.key}:1:${pi.insumo_id}`),
            recepcion_id: recepcionId,
            insumo_id: pi.insumo_id,
            cantidad,
            precio_unitario: pi.precio_unitario,
          });
          recepcionesData.push({
            obraId: r.obraId,
            semana: r.semana,
            insumoId: pi.insumo_id,
            cantidad,
            precioUnitario: pi.precio_unitario,
          });
        }
      }

      if (r.oc.pagada) ocsParaPagar.push({ ocId, total, folio: r.oc.folio, semana: r.semana });
    }
  }

  await insert("requisiciones", reqRows);
  await insert("requisicion_insumos", itemRows);
  await insert("cotizacion_paquetes", paqueteRows);
  await insert("cotizacion_paquete_insumos", paqueteItemRows);
  await insert("cotizacion_solicitudes", scRows);
  await insert("cotizacion_solicitud_insumos", scItemRows);
  await insert("ordenes_compra", ocRows);
  await insert("almacen_recepciones", recepcionRows);
  await insert("almacen_recepcion_partidas", recepcionPartidaRows);

  for (const [i, oc] of ocsParaPagar.entries()) {
    await registrarPago({
      key: `oc:${oc.folio}`,
      cuentaId: i % 3 === 2 ? ID.cuentaSantander : ID.cuentaBBVA,
      fecha: weekDate(oc.semana, 4),
      monto: oc.total,
      metodo: "transferencia",
      referencia: `SPEI-${oc.folio}`,
      concepto: `Pago OC ${oc.folio}`,
      origenTipo: "oc",
      origenId: oc.ocId,
    });
    await registrarAsiento({
      key: `oc:${oc.folio}`,
      fecha: weekDate(oc.semana, 4),
      concepto: `Pago orden de compra ${oc.folio}`,
      referencia: oc.folio,
      origenTipo: "pago_oc",
      origenId: oc.ocId,
      movimientos: [
        { tipo: "cargo", cuenta: "Proveedores", monto: oc.total },
        { tipo: "abono", cuenta: "Bancos", monto: oc.total },
      ],
    });
  }

  return recepcionesData;
}

// ---------------------------------------------------------------------------
// 6. Estimaciones de producción (avance semanal)
// ---------------------------------------------------------------------------

const PESOS_SEMANA = [0.12, 0.14, 0.16, 0.18, 0.2, 0.2];
const PRODUCCION_OBJETIVO = {
  [ID.obraA]: 11_460_000,
  [ID.obraB]: 9_650_000,
};

function esConceptoEjecutable(renglon) {
  if (renglon.es_grupo) return false;
  if (!(Number(renglon.cantidad) > 0)) return false;
  if (!(Number(renglon.precio_unitario) > 0)) return false;
  const unidad = String(renglon.unidad ?? "").toUpperCase();
  return unidad !== "EQUIPO" && unidad !== "SERVICIO";
}

function repartirSemanal(total, pesos = PESOS_SEMANA) {
  const partes = pesos.map((p) => round4(total * p));
  const suma = round4(partes.reduce((s, n) => s + n, 0));
  partes[partes.length - 1] = round4(partes[partes.length - 1] + (total - suma));
  return partes;
}

async function seedEstimaciones(budgets) {
  log("→ Estimaciones de producción semanales…");

  const obras = [
    {
      obraId: ID.obraA,
      residente: auth.residente,
      prefijo: "A",
      renglones: [...budgets.baseA.rows, ...budgets.adA],
    },
    {
      obraId: ID.obraB,
      residente: auth.residente2,
      prefijo: "B",
      renglones: [...budgets.baseB.rows, ...budgets.adB],
    },
  ];

  const estimaciones = [];
  const partidas = [];
  const totales = {};

  for (const obra of obras) {
    const ejecutables = obra.renglones.filter(esConceptoEjecutable);
    const baseEjecutable = ejecutables.reduce(
      (s, r) => s + Number(r.cantidad) * Number(r.precio_unitario),
      0,
    );
    const objetivo = PRODUCCION_OBJETIVO[obra.obraId];
    const factor = objetivo / baseEjecutable;
    if (!(factor > 0) || factor >= 1) {
      throw new Error(`Factor de avance inválido para la obra ${obra.prefijo}: ${factor}`);
    }

    let totalObra = 0;
    for (let w = 0; w < WEEKS.length; w++) {
      const estimacionId = uid(`estimacion:${obra.prefijo}:${w + 1}`);
      let monto = 0;

      for (const r of ejecutables) {
        const cantidadTotal = Number(r.cantidad) * factor;
        const cantidades = repartirSemanal(cantidadTotal);
        const cantidad = cantidades[w];
        if (!(cantidad > 0.0001)) continue;

        const pu = Number(r.precio_unitario);
        const importe = round2(cantidad * pu);
        monto += importe;
        partidas.push({
          id: uid(`estimacion-partida:${obra.prefijo}:${w + 1}:${r.clave}`),
          estimacion_id: estimacionId,
          renglon_clave: r.clave,
          concepto: r.concepto,
          unidad: r.unidad,
          cantidad_vigente: Number(r.cantidad),
          pu_vigente: pu,
          cantidad_ejecutada: cantidad,
          importe_ejecutado: importe,
        });
      }

      monto = round2(monto);
      totalObra += monto;
      estimaciones.push({
        id: estimacionId,
        obra_id: obra.obraId,
        company_id: ID.company,
        numero: w + 1,
        semana_inicio: WEEKS[w].inicio,
        semana_fin: WEEKS[w].fin,
        estatus: w === WEEKS.length - 1 ? "borrador" : "cerrada",
        monto_total: monto,
        creado_por: obra.residente,
        cerrada_por: w === WEEKS.length - 1 ? null : auth.director,
        cerrada_at: w === WEEKS.length - 1 ? null : at(weekDate(w, 4), 17, 0),
      });
    }
    totales[obra.obraId] = round2(totalObra);
    log(`  Obra ${obra.prefijo}: avance acumulado ${money(totalObra)} (${(factor * 100).toFixed(1)}% de conceptos ejecutables)`);
  }

  await insert("obra_estimaciones", estimaciones);
  await insert("obra_estimacion_renglones", partidas, { chunkSize: 400 });

  return totales;
}

// ---------------------------------------------------------------------------
// 7. Almacén de obra
// ---------------------------------------------------------------------------

const CONSUMO_ALMACEN = {
  A: [
    ["cem1", 1600], ["cem2", 400], ["acr1", 26000], ["acr2", 12000],
    ["blk1", 22000], ["agr1", 600], ["agr2", 500], ["ele1", 4000],
    ["ele2", 1500], ["hid1", 1500], ["hid2", 800], ["pin1", 100],
    ["pin3", 5000], ["her1", 300], ["her2", 600], ["mad1", 100], ["mad2", 500],
  ],
  B: [
    ["cem1", 1300], ["cem2", 300], ["acr1", 22000], ["acr2", 8000],
    ["blk1", 20000], ["agr1", 800], ["agr2", 550], ["ele1", 3000],
    ["ele2", 1500], ["hid1", 2000], ["pin1", 120], ["pin3", 3500],
    ["her1", 500], ["her2", 800], ["mad1", 80], ["mad2", 600],
  ],
};

function nombreObra(obraId) {
  return obraId === ID.obraA ? "A" : "B";
}

async function seedAlmacen(recepcionesData) {
  log("→ Almacén: semanas, inventarios y consumo…");

  const semanas = [];
  const movimientos = [];

  for (const obraId of [ID.obraA, ID.obraB]) {
    const prefijo = nombreObra(obraId);
    const consumo = new Map(CONSUMO_ALMACEN[prefijo]);

    const recibidoTotal = new Map();
    const recibidoSemana = new Map();
    for (const r of recepcionesData.filter((x) => x.obraId === obraId)) {
      recibidoTotal.set(r.insumoId, round4((recibidoTotal.get(r.insumoId) ?? 0) + r.cantidad));
      const clave = `${r.semana}|${r.insumoId}`;
      recibidoSemana.set(clave, round4((recibidoSemana.get(clave) ?? 0) + r.cantidad));
    }

    const insumosObra = Array.from(
      new Set([
        ...CONSUMO_ALMACEN[prefijo].map(([key]) => INSUMO_ID[key]),
        ...recibidoTotal.keys(),
      ]),
    );

    const stockInicial = new Map();
    for (const insumoId of insumosObra) {
      const consumido = [...consumo.entries()].find(([key]) => INSUMO_ID[key] === insumoId)?.[1] ?? 0;
      const recibido = recibidoTotal.get(insumoId) ?? 0;
      const finalDeseado = consumido > 0 ? Math.max(2, round4(consumido * 0.04)) : recibido;
      stockInicial.set(insumoId, Math.max(0, round4(consumido + finalDeseado - recibido)));
    }

    for (let w = 0; w < WEEKS.length; w++) {
      const semanaId = uid(`almacen-semana:${prefijo}:${w + 1}`);
      semanas.push({
        id: semanaId,
        company_id: ID.company,
        obra_id: obraId,
        semana_inicio: WEEKS[w].inicio,
        semana_fin: WEEKS[w].fin,
        estatus: w === WEEKS.length - 1 ? "abierta" : "cerrada",
        cerrada_at: w === WEEKS.length - 1 ? null : at(weekDate(w, 6), 18, 0),
        cerrada_por: w === WEEKS.length - 1 ? null : auth.director,
      });
    }

    const inventario = new Map(stockInicial);
    const consumoSemana = new Map();
    for (const [key, total] of consumo.entries()) {
      const partes = repartirSemanal(total);
      consumoSemana.set(INSUMO_ID[key], partes);
    }

    for (const insumoId of insumosObra) {
      const insumo = INSUMOS.find((i) => INSUMO_ID[i.key] === insumoId);
      if (!insumo) throw new Error(`Insumo desconocido en almacén: ${insumoId}`);
      let inv = inventario.get(insumoId) ?? 0;
      const partes = consumoSemana.get(insumoId) ?? Array(WEEKS.length).fill(0);

      for (let w = 0; w < WEEKS.length; w++) {
        const recibido = recibidoSemana.get(`${w}|${insumoId}`) ?? 0;
        const utilizado = partes[w] ?? 0;
        const final = round4(inv + recibido - utilizado);
        if (final < -0.01) {
          throw new Error(
            `Inventario negativo en obra ${prefijo}, insumo ${insumo.nombre}, semana ${WEEKS[w].inicio}: ${final}`,
          );
        }
        movimientos.push({
          id: uid(`almacen-mov:${prefijo}:${w + 1}:${insumo.key}`),
          semana_id: uid(`almacen-semana:${prefijo}:${w + 1}`),
          insumo_id: insumoId,
          inv_inicial: inv,
          recibido,
          utilizado,
          precio_unitario: insumo.precio,
        });
        inv = final;
      }
      inventario.set(insumoId, inv);
    }

    const valorConsumo = CONSUMO_ALMACEN[prefijo].reduce((s, [key, qty]) => {
      const insumo = INSUMOS.find((i) => i.key === key);
      return s + qty * Number(insumo?.precio ?? 0);
    }, 0);
    log(`  Obra ${prefijo}: consumo de almacén ${money(valorConsumo)} en 6 semanas.`);
  }

  await insert("almacen_semanas", semanas);
  await insert("almacen_movimientos_semana", movimientos, { chunkSize: 400 });
}

// ---------------------------------------------------------------------------
// 8. Nóminas semanales de obra
// ---------------------------------------------------------------------------

function trabajadoresDeObra(prefijo, cantidad) {
  return Array.from({ length: cantidad }, (_, i) => {
    const id = uid(`trabajador:${prefijo}:${i + 1}`);
    const trabajador = TRABAJADOR_ID[id];
    if (!trabajador) throw new Error(`Trabajador no encontrado: ${prefijo}:${i + 1}`);
    return trabajador;
  });
}

const TRABAJADORES_OBRA = {
  A: trabajadoresDeObra("A", 60),
  B: trabajadoresDeObra("B", 36),
};

async function seedNominas() {
  log("→ Nóminas semanales…");

  const nominas = [];
  const renglones = [];
  const asistencias = [];
  const totales = { A: 0, B: 0 };

  for (const [prefijo, obraId] of [
    ["A", ID.obraA],
    ["B", ID.obraB],
  ]) {
    const residente = prefijo === "A" ? auth.residente : auth.residente2;
    const trabajadores = TRABAJADORES_OBRA[prefijo];

    for (let w = 0; w < WEEKS.length; w++) {
      const nominaId = uid(`nomina:${prefijo}:${w + 1}`);
      let montoNomina = 0;

      trabajadores.forEach((trabajador, idx) => {
        const sueldo = Number(trabajador.sueldo_diario);
        const dias = 6;
        const extras = round2(((idx + w * 3) % 6) * 1.5 + (idx % 9 === 0 ? 2 : 0));
        const importeJornadas = round2(dias * sueldo);
        const importeExtras = round2(extras * (sueldo / 8));
        const importeTotal = round2(importeJornadas + importeExtras);
        montoNomina += importeTotal;

        const renglonId = uid(`nomina-renglon:${prefijo}:${w + 1}:${trabajador.id}`);
        renglones.push({
          id: renglonId,
          nomina_id: nominaId,
          trabajador_id: trabajador.id,
          sueldo_diario_snapshot: sueldo,
          multiplicador_extras: 2,
          dias_trabajados: dias,
          horas_extras_total: extras,
          importe_jornadas: importeJornadas,
          importe_extras: importeExtras,
          importe_total: importeTotal,
        });

        for (let d = 0; d < 6; d++) {
          asistencias.push({
            id: uid(`nomina-asistencia:${prefijo}:${w + 1}:${trabajador.id}:${d + 1}`),
            renglon_id: renglonId,
            fecha: weekDate(w, d),
            jornada: 1,
            horas_extras: d === 4 ? extras : 0,
            nota_extras: d === 4 && extras > 0 ? "Cierre de colado / trabajo extraordinario" : null,
          });
        }
      });

      montoNomina = round2(montoNomina);
      totales[prefijo] += montoNomina;
      nominas.push({
        id: nominaId,
        obra_id: obraId,
        company_id: ID.company,
        numero: w + 1,
        semana_inicio: WEEKS[w].inicio,
        semana_fin: WEEKS[w].fin,
        estatus: w < 4 ? "pagada" : w === 4 ? "cerrada" : "borrador",
        monto_total: montoNomina,
        creado_por: residente,
        cerrada_por: w <= 4 ? auth.director : null,
        cerrada_at: w <= 4 ? at(weekDate(w, 6), 19, 0) : null,
      });
    }
  }

  await insert("obra_nominas", nominas);
  await insert("obra_nomina_renglones", renglones, { chunkSize: 400 });
  await insert("obra_nomina_asistencias", asistencias, { chunkSize: 500 });

  for (const nomina of nominas.filter((n) => n.estatus === "pagada")) {
    const prefijo = nombreObra(nomina.obra_id);
    await registrarPago({
      key: `nomina:${prefijo}:${nomina.numero}`,
      cuentaId: ID.cuentaBBVA,
      fecha: nomina.semana_fin,
      monto: nomina.monto_total,
      metodo: "transferencia",
      referencia: `NOM-${prefijo}-${String(nomina.numero).padStart(2, "0")}`,
      concepto: `Pago nómina ${prefijo} semana ${nomina.numero}`,
      origenTipo: "nomina",
      origenId: nomina.id,
    });
    await registrarAsiento({
      key: `nomina:${prefijo}:${nomina.numero}`,
      fecha: nomina.semana_fin,
      concepto: `Nómina de obra ${prefijo} semana ${nomina.numero}`,
      referencia: `NOM-${prefijo}-${String(nomina.numero).padStart(2, "0")}`,
      origenTipo: "pago_nomina",
      origenId: nomina.id,
      movimientos: [
        { tipo: "cargo", cuenta: "Mano de obra directa", monto: nomina.monto_total },
        { tipo: "abono", cuenta: "Bancos", monto: nomina.monto_total },
      ],
    });
  }

  log(`  Nómina acumulada: obra A ${money(totales.A)} · obra B ${money(totales.B)}.`);
}

// ---------------------------------------------------------------------------
// 9. Destajos
// ---------------------------------------------------------------------------

const DESTAJOS_DEMO = [
  {
    key: "A1",
    prefijo: "A",
    obraId: ID.obraA,
    destajistaKey: "dA1",
    nombre: "Cimentación y estructura de concreto — Torre A",
    descripcion: "Ejecución de excavación, zapatas, columnas, losas y cimbra del cuerpo principal.",
    anticipoPct: 10,
    fondoPct: 5,
    avance: 0.16,
    leaves: [
      ["1.1", "Excavación y desplante", "M3", 800, 220],
      ["1.2", "Plantilla de concreto", "M3", 120, 1800],
      ["1.3", "Zapata corrida y dados", "M3", 300, 3600],
      ["1.4", "Acero de refuerzo", "KG", 16000, 30],
      ["1.5", "Columnas de concreto", "M3", 280, 4800],
      ["1.6", "Losas macizas", "M2", 850, 2600],
      ["1.7", "Cimbra y descimbra", "M2", 3200, 280],
    ],
  },
  {
    key: "A2",
    prefijo: "A",
    obraId: ID.obraA,
    destajistaKey: "dA2",
    nombre: "Albañilería y acabados — Torre A",
    descripcion: "Muros, aplanados, pisos, pintura e impermeabilización de departamentos muestra.",
    anticipoPct: 10,
    fondoPct: 5,
    avance: 0.1,
    leaves: [
      ["1.1", "Muro de block 12x20x40", "M2", 1800, 650],
      ["1.2", "Aplanado cemento-arena", "M2", 2200, 280],
      ["1.3", "Pisos cerámicos", "M2", 1200, 620],
      ["1.4", "Pintura vinílica", "M2", 4000, 80],
      ["1.5", "Impermeabilizante prefabricado", "M2", 900, 190],
    ],
  },
  {
    key: "B1",
    prefijo: "B",
    obraId: ID.obraB,
    destajistaKey: "dB1",
    nombre: "Cimentación y firmes — Nave Industrial",
    descripcion: "Zapatas, acero, firmes y muros de block de la ampliación.",
    anticipoPct: 10,
    fondoPct: 5,
    avance: 0.2,
    leaves: [
      ["1.1", "Excavación y retiro", "M3", 600, 200],
      ["1.2", "Zapatas aisladas", "M3", 220, 3400],
      ["1.3", "Acero de refuerzo", "KG", 12000, 29],
      ["1.4", "Firmes de concreto", "M2", 1800, 520],
      ["1.5", "Muro de block", "M2", 1200, 640],
    ],
  },
  {
    key: "B2",
    prefijo: "B",
    obraId: ID.obraB,
    destajistaKey: "dB2",
    nombre: "Montaje y acabados metálicos — Nave Industrial",
    descripcion: "Montaje de estructura, lámina deck, placas y pintura industrial.",
    anticipoPct: 10,
    fondoPct: 5,
    avance: 0.22,
    leaves: [
      ["1.1", "Montaje de estructura metálica", "KG", 45000, 12],
      ["1.2", "Lámina deck", "M2", 2400, 180],
      ["1.3", "Placa colaborante y malla", "M2", 2400, 150],
      ["1.4", "Pintura industrial", "M2", 3200, 70],
    ],
  },
];

function renglonesContrato(presupuestoId, leaves, etiqueta, columnaPresupuesto) {
  const rows = [];
  const total = round2(leaves.reduce((s, [, , , cantidad, pu]) => s + cantidad * pu, 0));
  rows.push({
    id: uid(`${etiqueta}-renglon:${presupuestoId}:1`),
    [columnaPresupuesto]: presupuestoId,
    clave: "1",
    parent_clave: null,
    nivel: 1,
    es_grupo: true,
    concepto: "Conceptos contratados",
    unidad: null,
    cantidad: null,
    precio_unitario: null,
    importe: total,
    tipo_movimiento: "renglon",
    importe_delta: 0,
    orden: 0,
  });

  leaves.forEach(([clave, concepto, unidad, cantidad, pu], idx) => {
    rows.push({
      id: uid(`${etiqueta}-renglon:${presupuestoId}:${clave}`),
      [columnaPresupuesto]: presupuestoId,
      clave,
      parent_clave: "1",
      nivel: 2,
      es_grupo: false,
      concepto,
      unidad,
      cantidad,
      precio_unitario: pu,
      importe: round2(cantidad * pu),
      tipo_movimiento: "renglon",
      importe_delta: 0,
      orden: idx + 1,
    });
  });

  return { rows, total, leaves };
}

const ESTADOS_ESTIMACION = ["pagada", "pagada", "pagada", "pagada", "autorizada", "borrador"];

async function seedDestajos() {
  log("→ Destajos, presupuestos y estimaciones…");

  const destajos = [];
  const presupuestos = [];
  const renglones = [];
  const asignaciones = [];
  const anticipos = [];
  const estimaciones = [];
  const estimacionRenglones = [];
  const pagosAnticipo = [];
  const pagosEstimacion = [];
  const asientos = [];

  for (const def of DESTAJOS_DEMO) {
    const destajoId = uid(`destajo:${def.key}`);
    const presupuestoId = uid(`destajo-presupuesto:${def.key}:base`);
    const destajistaId = uid(`trabajador:${def.destajistaKey}`);
    const residente = def.prefijo === "A" ? auth.residente : auth.residente2;
    const { rows, total } = renglonesContrato(presupuestoId, def.leaves, "destajo", "presupuesto_destajo_id");
    const anticipoMonto = round2(total * (def.anticipoPct / 100));

    destajos.push({
      id: destajoId,
      obra_id: def.obraId,
      company_id: ID.company,
      destajista_id: destajistaId,
      numero: DESTAJOS_DEMO.filter((d) => d.prefijo === def.prefijo).findIndex((d) => d.key === def.key) + 1,
      nombre: def.nombre,
      descripcion: def.descripcion,
      estatus: "autorizado",
      monto_total: total,
      creado_por: residente,
      anticipo_pct: def.anticipoPct,
      anticipo_monto: anticipoMonto,
      fondo_garantia_pct: def.fondoPct,
    });
    presupuestos.push({
      id: presupuestoId,
      destajo_id: destajoId,
      tipo: "base",
      numero: 0,
      nombre: "Presupuesto base",
      descripcion: "Presupuesto de conceptos contratados con el destajista.",
      estatus: "autorizado",
      monto_total: total,
      creado_por: residente,
      enviado_at: at(weekDate(0, 0), 10, 0),
      enviado_por: residente,
      autorizado_at: at(weekDate(0, 1), 9, 0),
      autorizado_por: auth.director,
    });
    renglones.push(...rows);
    asignaciones.push({
      id: uid(`destajo-asignacion:${def.key}`),
      destajo_id: destajoId,
      trabajador_id: destajistaId,
      asignado_por: residente,
    });

    const anticipoId = uid(`destajo-anticipo:${def.key}`);
    anticipos.push({
      id: anticipoId,
      destajo_id: destajoId,
      company_id: ID.company,
      fecha: weekDate(0, 1),
      monto: anticipoMonto,
      metodo_pago: "transferencia",
      referencia: `ANT-DZ-${def.key}`,
      pagado: true,
      pagado_at: at(weekDate(0, 1), 12, 0),
      pagado_por: auth.administrativo,
      solicitado_at: at(weekDate(0, 0), 11, 0),
      solicitado_por: residente,
      solicitud_notas: "Anticipo contractual autorizado al inicio de los trabajos.",
      folio: `ANT-DZ-2026-${String(DESTAJOS_DEMO.indexOf(def) + 1).padStart(3, "0")}`,
      creado_por: residente,
    });
    pagosAnticipo.push({
      key: `destajo-anticipo:${def.key}`,
      cuentaId: ID.cuentaBBVA,
      fecha: weekDate(0, 1),
      monto: anticipoMonto,
      referencia: `ANT-DZ-${def.key}`,
      concepto: `Anticipo destajo ${def.nombre}`,
      origenTipo: "destajo",
      origenId: anticipoId,
    });
    asientos.push({
      key: `destajo-anticipo:${def.key}`,
      fecha: weekDate(0, 1),
      concepto: `Anticipo destajo ${def.nombre}`,
      referencia: `ANT-DZ-${def.key}`,
      origenTipo: "destajo_anticipo",
      origenId: anticipoId,
      movimientos: [
        { tipo: "cargo", cuenta: "Anticipos a contratistas", monto: anticipoMonto },
        { tipo: "abono", cuenta: "Bancos", monto: anticipoMonto },
      ],
    });

    for (let w = 0; w < WEEKS.length; w++) {
      const estimacionId = uid(`destajo-estimacion:${def.key}:${w + 1}`);
      const estado = ESTADOS_ESTIMACION[w];
      let bruto = 0;

      for (const [clave, concepto, unidad, cantidad, pu] of def.leaves) {
        const cantidades = repartirSemanal(cantidad * def.avance);
        const ejecutada = cantidades[w];
        if (!(ejecutada > 0.0001)) continue;
        const importe = round2(ejecutada * pu);
        bruto += importe;
        estimacionRenglones.push({
          id: uid(`destajo-estimacion-renglon:${def.key}:${w + 1}:${clave}`),
          estimacion_id: estimacionId,
          renglon_clave: clave,
          concepto,
          unidad,
          cantidad_vigente: cantidad,
          pu_vigente: pu,
          cantidad_ejecutada: ejecutada,
          importe_ejecutado: importe,
        });
      }

      bruto = round2(bruto);
      const cerrada = estado !== "borrador";
      const amortizacion = cerrada ? round2(bruto * (def.anticipoPct / 100)) : 0;
      const retencion = cerrada ? round2(bruto * (def.fondoPct / 100)) : 0;
      const neto = cerrada ? round2(bruto - amortizacion - retencion) : 0;
      let cxp = null;

      if (cerrada && neto > 0) {
        const cxpKey = `destajo-estimacion:${def.key}:${w + 1}`;
        cxp = await crearCxP({
          key: cxpKey,
          obraId: def.obraId,
          beneficiarioTipo: "trabajador",
          beneficiarioId: destajistaId,
          beneficiarioNombre: TRABAJADOR_ID[destajistaId]?.nombre_completo ?? "Destajista",
          concepto: `Estimación ${w + 1} destajo · ${def.nombre}`,
          origenTipo: "destajo_estimacion",
          origenId: estimacionId,
          monto: neto,
          fechaEmision: WEEKS[w].fin,
          fechaVencimiento: weekDate(w, 15),
        });
        if (estado === "pagada") {
          pagosEstimacion.push({
            cxp,
            key: `destajo-pago:${def.key}:${w + 1}`,
            fecha: weekDate(w, 5),
            referencia: `DZ-${def.key}-${String(w + 1).padStart(2, "0")}`,
            notas: `Pago estimación ${w + 1} destajo ${def.nombre}`,
          });
        }
        asientos.push({
          key: `destajo-estimacion:${def.key}:${w + 1}`,
          fecha: WEEKS[w].fin,
          concepto: `Estimación ${w + 1} destajo · ${def.nombre}`,
          referencia: cxp.id,
          origenTipo: "destajo_estimacion",
          origenId: estimacionId,
          movimientos: [
            { tipo: "cargo", cuenta: "Costo de obra - Destajos", monto: bruto },
            { tipo: "abono", cuenta: "Anticipos a contratistas", monto: amortizacion },
            { tipo: "abono", cuenta: "Fondo de garantía retenido", monto: retencion },
            { tipo: "abono", cuenta: "Cuentas por pagar - Contratistas destajo", monto: neto },
          ],
        });
      }

      estimaciones.push({
        id: estimacionId,
        destajo_id: destajoId,
        company_id: ID.company,
        numero: w + 1,
        semana_inicio: WEEKS[w].inicio,
        semana_fin: WEEKS[w].fin,
        estatus: estado,
        monto_total: bruto,
        creado_por: residente,
        cerrada_at: cerrada ? at(weekDate(w, 4), 18, 0) : null,
        cerrada_por: cerrada ? residente : null,
        amortizacion_anticipo: amortizacion,
        retencion_fondo: retencion,
        liberacion_fondo: 0,
        monto_neto: neto,
        autorizada_at: cerrada ? at(weekDate(w, 5), 10, 0) : null,
        autorizada_por: cerrada ? auth.director : null,
        cxp_id: cxp?.id ?? null,
      });
    }
  }

  await insert("obra_destajos", destajos);
  await insert("obra_destajo_presupuestos", presupuestos);
  await insert("obra_destajo_renglones", renglones, { chunkSize: 400 });
  await insert("obra_destajo_trabajadores", asignaciones);
  await insert("obra_destajo_anticipos", anticipos);
  await insert("obra_destajo_estimaciones", estimaciones);
  await insert("obra_destajo_estimacion_renglones", estimacionRenglones, { chunkSize: 400 });

  for (const p of pagosAnticipo) await registrarPago(p);
  for (const a of asientos.filter((x) => x.origenTipo === "destajo_anticipo")) await registrarAsiento(a);

  for (const p of pagosEstimacion) {
    await pagarCxP(p.cxp, {
      key: p.key,
      fecha: p.fecha,
      cuentaId: p.cxp.id.charCodeAt(0) % 2 ? ID.cuentaBBVA : ID.cuentaSantander,
      referencia: p.referencia,
      notas: p.notas,
    });
  }
  for (const a of asientos.filter((x) => x.origenTipo === "destajo_estimacion")) await registrarAsiento(a);
}

// ---------------------------------------------------------------------------
// 10. Subcontratos
// ---------------------------------------------------------------------------

const SUBCONTRATOS_DEMO = [
  {
    key: "A-ELE",
    prefijo: "A",
    obraId: ID.obraA,
    contratistaKey: "electro",
    nombre: "Instalación eléctrica y voz/datos — Torre A",
    descripcion: "Instalaciones eléctricas, tableros, voz y datos de áreas comunes y departamentos.",
    anticipoPct: 10,
    fondoPct: 5,
    avance: 0.23,
    leaves: [
      ["1.1", "Salidas eléctricas", "SALIDA", 1200, 1850],
      ["1.2", "Tableros de distribución", "PZA", 24, 12500],
      ["1.3", "Cableado y canalización", "ML", 8500, 280],
      ["1.4", "Voz y datos / CCTV", "SALIDA", 320, 1450],
      ["1.5", "Pruebas y puesta en marcha", "SERVICIO", 1, 380000],
    ],
  },
  {
    key: "B-EST",
    prefijo: "B",
    obraId: ID.obraB,
    contratistaKey: "estructuras",
    nombre: "Estructura metálica — Nave Industrial",
    descripcion: "Fabricación, montaje y acabado de estructura metálica de la ampliación.",
    anticipoPct: 10,
    fondoPct: 5,
    avance: 0.15,
    leaves: [
      ["1.1", "Fabricación de columnas IPR", "KG", 86000, 28],
      ["1.2", "Armaduras y trabes", "KG", 52000, 31],
      ["1.3", "Lámina deck", "M2", 4200, 260],
      ["1.4", "Placa colaborante y malla", "M2", 4200, 145],
      ["1.5", "Montaje y acabado", "SERVICIO", 1, 780000],
    ],
  },
];

async function seedSubcontratos() {
  log("→ Subcontratos, presupuestos y estimaciones…");

  const subcontratos = [];
  const presupuestos = [];
  const renglones = [];
  const anticipos = [];
  const estimaciones = [];
  const estimacionRenglones = [];
  const pagosAnticipo = [];
  const pagosEstimacion = [];
  const asientos = [];

  for (const def of SUBCONTRATOS_DEMO) {
    const subcontratoId = uid(`subcontrato:${def.key}`);
    const presupuestoId = uid(`subcontrato-presupuesto:${def.key}:base`);
    const contratistaId = TERCERO_ID[def.contratistaKey];
    const contratista = TERCEROS.find((t) => t.key === def.contratistaKey);
    const residente = def.prefijo === "A" ? auth.residente : auth.residente2;
    const { rows, total } = renglonesContrato(presupuestoId, def.leaves, "subcontrato", "presupuesto_subcontrato_id");
    const anticipoMonto = round2(total * (def.anticipoPct / 100));

    subcontratos.push({
      id: subcontratoId,
      company_id: ID.company,
      obra_id: def.obraId,
      contratista_id: contratistaId,
      creado_por: residente,
      numero: SUBCONTRATOS_DEMO.indexOf(def) + 1,
      nombre: def.nombre,
      descripcion: def.descripcion,
      estatus: "autorizado",
      monto_total: total,
      anticipo_pct: def.anticipoPct,
      anticipo_monto: anticipoMonto,
      fondo_garantia_pct: def.fondoPct,
    });
    presupuestos.push({
      id: presupuestoId,
      subcontrato_id: subcontratoId,
      tipo: "base",
      numero: 0,
      nombre: "Presupuesto base",
      descripcion: "Presupuesto de conceptos contratados con el subcontratista.",
      estatus: "autorizado",
      monto_total: total,
      creado_por: residente,
      enviado_at: at(weekDate(0, 0), 10, 0),
      enviado_por: residente,
      autorizado_at: at(weekDate(0, 1), 9, 0),
      autorizado_por: auth.director,
    });
    renglones.push(...rows);

    const anticipoId = uid(`subcontrato-anticipo:${def.key}`);
    anticipos.push({
      id: anticipoId,
      subcontrato_id: subcontratoId,
      company_id: ID.company,
      fecha: weekDate(0, 1),
      monto: anticipoMonto,
      metodo_pago: "transferencia",
      referencia: `ANT-SC-${def.key}`,
      pagado: true,
      pagado_at: at(weekDate(0, 1), 12, 0),
      pagado_por: auth.administrativo,
      solicitado_at: at(weekDate(0, 0), 11, 0),
      solicitado_por: residente,
      solicitud_notas: "Anticipo contractual autorizado al inicio de los trabajos.",
      folio: `ANT-SC-2026-${String(SUBCONTRATOS_DEMO.indexOf(def) + 1).padStart(3, "0")}`,
      creado_por: residente,
    });
    pagosAnticipo.push({
      key: `subcontrato-anticipo:${def.key}`,
      cuentaId: ID.cuentaSantander,
      fecha: weekDate(0, 1),
      monto: anticipoMonto,
      referencia: `ANT-SC-${def.key}`,
      concepto: `Anticipo subcontrato ${def.nombre}`,
      origenTipo: "subcontrato",
      origenId: anticipoId,
    });
    asientos.push({
      key: `subcontrato-anticipo:${def.key}`,
      fecha: weekDate(0, 1),
      concepto: `Anticipo subcontrato ${def.nombre}`,
      referencia: `ANT-SC-${def.key}`,
      origenTipo: "subcontrato_anticipo",
      origenId: anticipoId,
      movimientos: [
        { tipo: "cargo", cuenta: "Anticipos a subcontratistas", monto: anticipoMonto },
        { tipo: "abono", cuenta: "Bancos", monto: anticipoMonto },
      ],
    });

    for (let w = 0; w < WEEKS.length; w++) {
      const estimacionId = uid(`subcontrato-estimacion:${def.key}:${w + 1}`);
      const estado = ESTADOS_ESTIMACION[w];
      let bruto = 0;

      for (const [clave, concepto, unidad, cantidad, pu] of def.leaves) {
        const cantidades = repartirSemanal(cantidad * def.avance);
        const ejecutada = cantidades[w];
        if (!(ejecutada > 0.0001)) continue;
        const importe = round2(ejecutada * pu);
        bruto += importe;
        estimacionRenglones.push({
          id: uid(`subcontrato-estimacion-renglon:${def.key}:${w + 1}:${clave}`),
          estimacion_id: estimacionId,
          renglon_clave: clave,
          concepto,
          unidad,
          cantidad_vigente: cantidad,
          pu_vigente: pu,
          cantidad_ejecutada: ejecutada,
          importe_ejecutado: importe,
        });
      }

      bruto = round2(bruto);
      const cerrada = estado !== "borrador";
      const amortizacion = cerrada ? round2(bruto * (def.anticipoPct / 100)) : 0;
      const retencion = cerrada ? round2(bruto * (def.fondoPct / 100)) : 0;
      const neto = cerrada ? round2(bruto - amortizacion - retencion) : 0;
      let cxp = null;

      if (cerrada && neto > 0) {
        const cxpKey = `subcontrato-estimacion:${def.key}:${w + 1}`;
        cxp = await crearCxP({
          key: cxpKey,
          obraId: def.obraId,
          beneficiarioTipo: "tercero",
          beneficiarioId: contratistaId,
          beneficiarioNombre: contratista?.razon_social ?? "Subcontratista",
          concepto: `Estimación ${w + 1} subcontrato · ${def.nombre}`,
          origenTipo: "subcontrato_estimacion",
          origenId: estimacionId,
          monto: neto,
          fechaEmision: WEEKS[w].fin,
          fechaVencimiento: weekDate(w, 15),
        });
        if (estado === "pagada") {
          pagosEstimacion.push({
            cxp,
            key: `subcontrato-pago:${def.key}:${w + 1}`,
            fecha: weekDate(w, 5),
            referencia: `SC-${def.key}-${String(w + 1).padStart(2, "0")}`,
            notas: `Pago estimación ${w + 1} subcontrato ${def.nombre}`,
          });
        }
        asientos.push({
          key: `subcontrato-estimacion:${def.key}:${w + 1}`,
          fecha: WEEKS[w].fin,
          concepto: `Estimación ${w + 1} subcontrato · ${def.nombre}`,
          referencia: cxp.id,
          origenTipo: "subcontrato_estimacion",
          origenId: estimacionId,
          movimientos: [
            { tipo: "cargo", cuenta: "Costo de obra - Subcontratos", monto: bruto },
            { tipo: "abono", cuenta: "Anticipos a subcontratistas", monto: amortizacion },
            { tipo: "abono", cuenta: "Fondo de garantía retenido", monto: retencion },
            { tipo: "abono", cuenta: "Cuentas por pagar - Subcontratistas", monto: neto },
          ],
        });
      }

      estimaciones.push({
        id: estimacionId,
        subcontrato_id: subcontratoId,
        company_id: ID.company,
        numero: w + 1,
        semana_inicio: WEEKS[w].inicio,
        semana_fin: WEEKS[w].fin,
        estatus: estado,
        monto_total: bruto,
        creado_por: residente,
        cerrada_at: cerrada ? at(weekDate(w, 4), 18, 0) : null,
        cerrada_por: cerrada ? residente : null,
        amortizacion_anticipo: amortizacion,
        retencion_fondo: retencion,
        liberacion_fondo: 0,
        monto_neto: neto,
        autorizada_at: cerrada ? at(weekDate(w, 5), 10, 0) : null,
        autorizada_por: cerrada ? auth.director : null,
        cxp_id: cxp?.id ?? null,
      });
    }
  }

  await insert("obra_subcontratos", subcontratos);
  await insert("obra_subcontrato_presupuestos", presupuestos);
  await insert("obra_subcontrato_renglones", renglones, { chunkSize: 400 });
  await insert("obra_subcontrato_anticipos", anticipos);
  await insert("obra_subcontrato_estimaciones", estimaciones);
  await insert("obra_subcontrato_estimacion_renglones", estimacionRenglones, { chunkSize: 400 });

  for (const p of pagosAnticipo) await registrarPago(p);
  for (const a of asientos.filter((x) => x.origenTipo === "subcontrato_anticipo")) await registrarAsiento(a);

  for (const p of pagosEstimacion) {
    await pagarCxP(p.cxp, {
      key: p.key,
      fecha: p.fecha,
      cuentaId: p.cxp.id.charCodeAt(0) % 2 ? ID.cuentaBBVA : ID.cuentaSantander,
      referencia: p.referencia,
      notas: p.notas,
    });
  }
  for (const a of asientos.filter((x) => x.origenTipo === "subcontrato_estimacion")) await registrarAsiento(a);
}

// ---------------------------------------------------------------------------
// 10. Rentas de equipo
// ---------------------------------------------------------------------------

const RENTAS_DEMO = [
  {
    key: "A-AND",
    prefijo: "A",
    obraId: ID.obraA,
    numero: 1,
    insumoKey: "equ1",
    equipo: "EQU-0001 — Andamio multidireccional",
    cantidad: 25,
    descripcion: "Andamiaje para fachadas y trabajos en altura de la Torre A.",
    proveedorKey: "maquinaria",
    periodicidad: "mensual",
    tarifaUnitaria: 3800,
    deposito: 0,
    condiciones: "Incluye transporte, montaje y desmontaje. Mantenimiento mensual incluido.",
    fechaEstimadaInicio: weekDate(0, 0),
    fechaLlegadaReal: weekDate(0, 0),
    fechaFinProgramada: isoDate(addDays(new Date(`${WEEKS[5].fin}T12:00:00Z`), 60)),
    fechaDevolucionReal: null,
    estatus: "activa",
    creadoPor: "residente",
    cotizadoPor: "administrativo",
    autorizadoPor: "supervisor",
    periodosPagados: 1,
    eventos: [
      {
        tipo: "averia",
        fechaInicio: weekDate(1, 5),
        fechaFin: weekDate(1, 5),
        descripcion: "Se reemplazaron 12 marcos y 4 diagonales dañadas por viento.",
      },
      {
        tipo: "nota",
        fechaInicio: weekDate(4, 2),
        fechaFin: null,
        descripcion: "Proveedor confirma continuidad de renta hasta el término de fachadas.",
      },
    ],
    renovaciones: [
      {
        numero: 1,
        fechaFinAnterior: isoDate(addDays(new Date(`${WEEKS[5].fin}T12:00:00Z`), 30)),
        fechaFinNueva: isoDate(addDays(new Date(`${WEEKS[5].fin}T12:00:00Z`), 60)),
        tarifaNueva: 3950,
        motivo: "Extensión de fachadas y trabajos exteriores.",
        estatus: "autorizada",
        solicitadoPor: "residente",
        autorizadoPor: "supervisor",
      },
    ],
  },
  {
    key: "A-REV",
    prefijo: "A",
    obraId: ID.obraA,
    numero: 2,
    insumoKey: "equ2",
    equipo: "EQU-0002 — Revolvedora 1 saco",
    cantidad: 1,
    descripcion: "Revolvedora para morteros y concretos menores en muestras.",
    proveedorKey: "maquinaria",
    periodicidad: "semanal",
    tarifaUnitaria: 7800,
    deposito: 0,
    condiciones: "Renta semanal con operador. Combustible por cuenta de la obra.",
    fechaEstimadaInicio: weekDate(1, 0),
    fechaLlegadaReal: weekDate(1, 0),
    fechaFinProgramada: weekDate(3, 6),
    fechaDevolucionReal: weekDate(3, 6),
    estatus: "devuelta",
    creadoPor: "residente",
    cotizadoPor: "administrativo",
    autorizadoPor: "supervisor",
    periodosPagados: 3,
    eventos: [
      {
        tipo: "inactividad",
        fechaInicio: weekDate(2, 4),
        fechaFin: weekDate(2, 5),
        descripcion: "Equipo detenido por falta de material; se acordó no cobrar los días.",
      },
    ],
    renovaciones: [],
  },
  {
    key: "A-COMP",
    prefijo: "A",
    obraId: ID.obraA,
    numero: 3,
    insumoKey: null,
    equipo: "Compactadora de placa reversible",
    cantidad: 1,
    descripcion: "Compactación de relleno en patio de maniobras.",
    proveedorKey: null,
    periodicidad: null,
    tarifaUnitaria: 0,
    deposito: 0,
    condiciones: null,
    fechaEstimadaInicio: isoDate(addDays(new Date(`${WEEKS[5].fin}T12:00:00Z`), 14)),
    fechaLlegadaReal: null,
    fechaFinProgramada: null,
    fechaDevolucionReal: null,
    estatus: "solicitada",
    creadoPor: "residente",
    cotizadoPor: null,
    autorizadoPor: null,
    periodosPagados: 0,
    eventos: [],
    renovaciones: [],
  },
  {
    key: "B-AND",
    prefijo: "B",
    obraId: ID.obraB,
    numero: 1,
    insumoKey: "equ1",
    equipo: "EQU-0001 — Andamio multidireccional",
    cantidad: 20,
    descripcion: "Andamiaje para montaje de estructura y fachada de la nave.",
    proveedorKey: "maquinaria",
    periodicidad: "mensual",
    tarifaUnitaria: 3900,
    deposito: 0,
    condiciones: "Incluye transporte y montaje. Vigencia mensual renovable.",
    fechaEstimadaInicio: weekDate(0, 0),
    fechaLlegadaReal: weekDate(0, 0),
    fechaFinProgramada: isoDate(addDays(new Date(`${WEEKS[5].fin}T12:00:00Z`), 45)),
    fechaDevolucionReal: null,
    estatus: "activa",
    creadoPor: "residente2",
    cotizadoPor: "administrativo",
    autorizadoPor: "supervisor",
    periodosPagados: 1,
    eventos: [
      {
        tipo: "nota",
        fechaInicio: weekDate(3, 3),
        fechaFin: null,
        descripcion: "Se amplía cobertura de andamio para montaje de trabes.",
      },
    ],
    renovaciones: [
      {
        numero: 1,
        fechaFinAnterior: isoDate(addDays(new Date(`${WEEKS[5].fin}T12:00:00Z`), 30)),
        fechaFinNueva: isoDate(addDays(new Date(`${WEEKS[5].fin}T12:00:00Z`), 45)),
        tarifaNueva: 4100,
        motivo: "Mayor tiempo de montaje por ajuste de secuencia.",
        estatus: "pendiente",
        solicitadoPor: "residente2",
        autorizadoPor: null,
      },
    ],
  },
  {
    key: "B-GRUA",
    prefijo: "B",
    obraId: ID.obraB,
    numero: 2,
    insumoKey: null,
    equipo: "Grúa telescópica 25 toneladas",
    cantidad: 1,
    descripcion: "Izaje de armaduras y columnas de estructura metálica.",
    proveedorKey: "gruas",
    periodicidad: "diaria",
    tarifaUnitaria: 18500,
    deposito: 0,
    condiciones: "Incluye operador y maniobrista. Horario de 8 horas.",
    fechaEstimadaInicio: weekDate(3, 0),
    fechaLlegadaReal: weekDate(3, 0),
    fechaFinProgramada: weekDate(3, 6),
    fechaDevolucionReal: weekDate(3, 6),
    estatus: "devuelta",
    creadoPor: "residente2",
    cotizadoPor: "administrativo",
    autorizadoPor: "supervisor",
    periodosPagados: 5,
    eventos: [
      {
        tipo: "averia",
        fechaInicio: weekDate(3, 3),
        fechaFin: weekDate(3, 3),
        descripcion: "Falla hidráulica en pluma; proveedor envió equipo de respaldo por la tarde.",
      },
    ],
    renovaciones: [],
  },
  {
    key: "B-LUZ",
    prefijo: "B",
    obraId: ID.obraB,
    numero: 3,
    insumoKey: null,
    equipo: "Planta de luz 60 kVA",
    cantidad: 1,
    descripcion: "Respaldo eléctrico para pruebas y oficinas de obra.",
    proveedorKey: "maquinaria",
    periodicidad: "diaria",
    tarifaUnitaria: 2800,
    deposito: 0,
    condiciones: "Incluye tablero de transferencia y cableado.",
    fechaEstimadaInicio: isoDate(addDays(new Date(`${WEEKS[5].fin}T12:00:00Z`), 1)),
    fechaLlegadaReal: null,
    fechaFinProgramada: isoDate(addDays(new Date(`${WEEKS[5].fin}T12:00:00Z`), 31)),
    fechaDevolucionReal: null,
    estatus: "autorizada",
    creadoPor: "residente2",
    cotizadoPor: "administrativo",
    autorizadoPor: "supervisor",
    periodosPagados: 0,
    eventos: [],
    renovaciones: [],
  },
];

function periodosRenta(def) {
  const diasPeriodo = { diaria: 1, semanal: 7, quincenal: 15, mensual: 30 }[def.periodicidad] ?? 30;
  const limite = def.fechaDevolucionReal ?? isoDate(TODAY);
  let cursor = def.fechaLlegadaReal;
  const out = [];
  if (!cursor || !(def.tarifaUnitaria > 0)) return out;

  while (cursor <= limite) {
    let fin = isoDate(addDays(new Date(`${cursor}T12:00:00Z`), diasPeriodo - 1));
    if (fin > limite) fin = limite;
    const diasReales = Math.round(
      (new Date(`${fin}T12:00:00Z`).getTime() - new Date(`${cursor}T12:00:00Z`).getTime()) /
        86_400_000,
    ) + 1;
    out.push({
      inicio: cursor,
      fin,
      monto: round2((def.tarifaUnitaria * def.cantidad * diasReales) / diasPeriodo),
    });
    if (fin >= limite) break;
    cursor = isoDate(addDays(new Date(`${fin}T12:00:00Z`), 1));
  }
  return out;
}

async function seedRentas() {
  log("→ Rentas de equipo, periodos y pagos…");

  const rentas = [];
  const periodos = [];
  const eventos = [];
  const renovaciones = [];
  const pagosPeriodo = [];
  const devengos = [];

  for (const def of RENTAS_DEMO) {
    const rentaId = uid(`renta:${def.key}`);
    const proveedor = def.proveedorKey ? TERCEROS.find((t) => t.key === def.proveedorKey) : null;
    const fechaCotizacion = weekDate(0, 5);
    const fechaAutorizacion = weekDate(0, 6);

    rentas.push({
      id: rentaId,
      company_id: ID.company,
      obra_id: def.obraId,
      numero: def.numero,
      insumo_id: def.insumoKey ? INSUMO_ID[def.insumoKey] : null,
      equipo: def.equipo,
      cantidad: def.cantidad,
      descripcion: def.descripcion,
      proveedor_id: def.proveedorKey ? TERCERO_ID[def.proveedorKey] : null,
      periodicidad: def.periodicidad,
      tarifa_unitaria: def.tarifaUnitaria,
      deposito: def.deposito,
      condiciones: def.condiciones,
      fecha_estimada_inicio: def.fechaEstimadaInicio,
      fecha_llegada_real: def.fechaLlegadaReal,
      fecha_fin_programada: def.fechaFinProgramada,
      fecha_devolucion_real: def.fechaDevolucionReal,
      dias_aviso_vencimiento: 5,
      estatus: def.estatus,
      creado_por: auth[def.creadoPor],
      cotizado_por: def.cotizadoPor ? auth[def.cotizadoPor] : null,
      cotizado_at: def.cotizadoPor ? at(fechaCotizacion, 11, 30) : null,
      autorizado_por: def.autorizadoPor ? auth[def.autorizadoPor] : null,
      autorizado_at: def.autorizadoPor ? at(fechaAutorizacion, 16, 0) : null,
      periodos_estimados: def.periodicidad ? Math.max(1, Math.ceil(45 / ({ diaria: 1, semanal: 7, quincenal: 15, mensual: 30 }[def.periodicidad] ?? 30))) : null,
    });

    for (const ev of def.eventos) {
      eventos.push({
        id: uid(`renta-evento:${def.key}:${ev.tipo}:${ev.fechaInicio}`),
        renta_id: rentaId,
        tipo: ev.tipo,
        fecha_inicio: ev.fechaInicio,
        fecha_fin: ev.fechaFin,
        descripcion: ev.descripcion,
        creado_por: auth[def.creadoPor],
      });
    }

    for (const ren of def.renovaciones) {
      renovaciones.push({
        id: uid(`renta-renovacion:${def.key}:${ren.numero}`),
        renta_id: rentaId,
        numero: ren.numero,
        fecha_fin_anterior: ren.fechaFinAnterior,
        fecha_fin_nueva: ren.fechaFinNueva,
        tarifa_nueva: ren.tarifaNueva,
        motivo: ren.motivo,
        estatus: ren.estatus,
        solicitado_por: auth[ren.solicitadoPor],
        autorizado_por: ren.autorizadoPor ? auth[ren.autorizadoPor] : null,
        autorizado_at: ren.autorizadoPor ? at(weekDate(4, 5), 12, 0) : null,
      });
    }

    const listaPeriodos = periodosRenta(def);
    listaPeriodos.forEach((p, idx) => {
      const periodoId = uid(`renta-periodo:${def.key}:${p.inicio}`);
      const cxp = null;
      periodos.push({
        id: periodoId,
        renta_id: rentaId,
        periodo_inicio: p.inicio,
        periodo_fin: p.fin,
        monto: p.monto,
        referencia: `RENTA-${def.prefijo}-${String(def.numero).padStart(2, "0")}-${String(idx + 1).padStart(2, "0")}`,
        creado_por: auth[def.creadoPor],
        estatus: idx < def.periodosPagados ? "pagado" : "pendiente",
        pagado_at: idx < def.periodosPagados ? isoDate(addDays(new Date(`${p.fin}T12:00:00Z`), 3)) : null,
        dias_vencimiento: 15,
        fecha_vencimiento: isoDate(addDays(new Date(`${p.fin}T12:00:00Z`), 15)),
        _proveedor: proveedor,
        _cxp: cxp,
        _def: def,
      });
      devengos.push({
        key: `renta-devengo:${def.key}:${p.inicio}`,
        fecha: p.fin,
        concepto: `Devengo renta ${def.equipo} · ${p.inicio}–${p.fin}`,
        referencia: `RENTA-${def.prefijo}-${String(def.numero).padStart(2, "0")}`,
        origenTipo: "renta_devengo",
        origenId: rentaId,
        movimientos: [
          { tipo: "cargo", cuenta: "Costo de obra - Rentas", monto: p.monto },
          { tipo: "abono", cuenta: "Cuentas por pagar - Rentas", monto: p.monto },
        ],
      });
    });
  }

  await insert("obra_rentas", rentas);
  await insert("obra_renta_eventos", eventos);
  await insert("obra_renta_renovaciones", renovaciones);
  await insert("obra_renta_pagos", periodos.map(({ _proveedor, _cxp, _def, ...row }) => row));

  for (const p of periodos) {
    const def = p._def;
    const proveedor = p._proveedor;
    const cxp = await crearCxP({
      key: `renta-periodo:${def.key}:${p.periodo_inicio}`,
      obraId: def.obraId,
      beneficiarioTipo: "tercero",
      beneficiarioId: TERCERO_ID[def.proveedorKey],
      beneficiarioNombre: proveedor?.razon_social ?? "Proveedor de renta",
      concepto: `Renta ${def.equipo} · ${p.periodo_inicio}–${p.periodo_fin}`,
      origenTipo: "renta_periodo",
      origenId: p.id,
      monto: p.monto,
      fechaEmision: p.periodo_fin,
      fechaVencimiento: p.fecha_vencimiento,
    });

    if (!DRY_RUN) {
      const { error } = await supabase
        .from("obra_renta_pagos")
        .update({ cxp_id: cxp.id })
        .eq("id", p.id);
      if (error) throw new Error(`No se pudo ligar la CxP del periodo de renta ${p.id}: ${error.message}`);
    }

    if (p.estatus === "pagado") {
      const fechaPago = p.pagado_at;
      pagosPeriodo.push({
        key: `renta-pago:${def.key}:${p.periodo_inicio}`,
        periodoId: p.id,
        cxp,
        monto: p.monto,
        fecha: fechaPago,
        cuentaId: (def.numero + (def.prefijo === "A" ? 0 : 1)) % 2 ? ID.cuentaBBVA : ID.cuentaSantander,
        referencia: p.referencia,
        concepto: `Pago renta ${def.equipo} · ${p.periodo_inicio}–${p.periodo_fin}`,
      });
    }
  }

  for (const p of pagosPeriodo) {
    await registrarPago({
      key: p.key,
      cuentaId: p.cuentaId,
      fecha: p.fecha,
      monto: p.monto,
      metodo: "transferencia",
      referencia: p.referencia,
      concepto: p.concepto,
      origenTipo: "renta",
      origenId: p.periodoId,
      cxpId: p.cxp.id,
    });

    if (!DRY_RUN) {
      const { error: e1 } = await supabase
        .from("cuentas_por_pagar")
        .update({ monto_pagado: p.monto, estatus: "pagada" })
        .eq("id", p.cxp.id);
      if (e1) throw new Error(`No se pudo cerrar la CxP de renta ${p.cxp.id}: ${e1.message}`);
      const { error: e2 } = await supabase
        .from("obra_renta_pagos")
        .update({ estatus: "pagado", pagado_at: p.fecha })
        .eq("id", p.periodoId);
      if (e2) throw new Error(`No se pudo marcar pagado el periodo de renta ${p.periodoId}: ${e2.message}`);
    }

    await registrarAsiento({
      key: `${p.key}:pago`,
      fecha: p.fecha,
      concepto: p.concepto,
      referencia: p.referencia,
      origenTipo: "pago_renta",
      origenId: p.periodoId,
      movimientos: [
        { tipo: "cargo", cuenta: "Cuentas por pagar - Rentas", monto: p.monto },
        { tipo: "abono", cuenta: "Bancos", monto: p.monto },
      ],
    });
  }

  for (const d of devengos) await registrarAsiento(d);

  const total = periodos.reduce((s, p) => s + p.monto, 0);
  const pagado = periodos.filter((p) => p.estatus === "pagado").reduce((s, p) => s + p.monto, 0);
  log(`  Renta devengada ${money(total)} · pagada ${money(pagado)} · CxP abierta ${money(total - pagado)}.`);
}

// ---------------------------------------------------------------------------
// 11. Vales de gasolina
// ---------------------------------------------------------------------------

const VALES_DEMO = [
  {
    key: "A-G1", obraId: ID.obraA, semana: 0, dia: 1, tipo: "magna", solicitado: 9500,
    autorizado: 9500, descripcion: "Combustible para camioneta de supervisión y motobomba.",
    estatus: "confirmado", pagado: true,
  },
  {
    key: "A-G2", obraId: ID.obraA, semana: 1, dia: 2, tipo: "diesel", solicitado: 14500,
    autorizado: 14000, descripcion: "Diésel para retroexcavadora y camión de volteo.",
    estatus: "confirmado", pagado: true,
  },
  {
    key: "A-G3", obraId: ID.obraA, semana: 2, dia: 1, tipo: "magna", solicitado: 8000,
    autorizado: 8000, descripcion: "Gasolina para vehículos de residentes y auxiliares.",
    estatus: "confirmado", pagado: true,
  },
  {
    key: "A-G4", obraId: ID.obraA, semana: 3, dia: 3, tipo: "diesel", solicitado: 12500,
    autorizado: 12200, descripcion: "Diésel para planta de soldar y camión grúa.",
    estatus: "confirmado", pagado: false,
  },
  {
    key: "A-G5", obraId: ID.obraA, semana: 4, dia: 2, tipo: "magna", solicitado: 7500,
    autorizado: 7500, descripcion: "Gasolina para traslado de cuadrilla a proveedor.",
    estatus: "entregado", pagado: false,
  },
  {
    key: "A-G6", obraId: ID.obraA, semana: 5, dia: 0, tipo: "magna", solicitado: 6800,
    autorizado: 6800, descripcion: "Gasolina para cierre de semana y traslado de muestra.",
    estatus: "autorizado", pagado: false,
  },
  {
    key: "A-G7", obraId: ID.obraA, semana: 5, dia: 1, tipo: "diesel", solicitado: 5000,
    autorizado: null, descripcion: "Diésel adicional para montacargas.",
    estatus: "pendiente_autorizacion", pagado: false,
  },
  {
    key: "B-G1", obraId: ID.obraB, semana: 0, dia: 2, tipo: "diesel", solicitado: 11000,
    autorizado: 11000, descripcion: "Diésel para excavadora y camión de materiales.",
    estatus: "confirmado", pagado: true,
  },
  {
    key: "B-G2", obraId: ID.obraB, semana: 1, dia: 1, tipo: "magna", solicitado: 7800,
    autorizado: 7800, descripcion: "Gasolina para supervisión y camioneta de obra.",
    estatus: "confirmado", pagado: true,
  },
  {
    key: "B-G3", obraId: ID.obraB, semana: 2, dia: 3, tipo: "diesel", solicitado: 13200,
    autorizado: 13000, descripcion: "Diésel para montacargas y generador.",
    estatus: "confirmado", pagado: true,
  },
  {
    key: "B-G4", obraId: ID.obraB, semana: 3, dia: 2, tipo: "magna", solicitado: 9000,
    autorizado: 9000, descripcion: "Gasolina para traslado de estructura y cuadrilla.",
    estatus: "confirmado", pagado: false,
  },
  {
    key: "B-G5", obraId: ID.obraB, semana: 4, dia: 1, tipo: "diesel", solicitado: 10500,
    autorizado: 10200, descripcion: "Diésel para pruebas de equipo y planta de luz.",
    estatus: "entregado", pagado: false,
  },
  {
    key: "B-G6", obraId: ID.obraB, semana: 5, dia: 0, tipo: "magna", solicitado: 6200,
    autorizado: null, descripcion: "Gasolina para cierre de mes.",
    estatus: "pendiente_autorizacion", pagado: false,
  },
  {
    key: "B-G7", obraId: ID.obraB, semana: 5, dia: 2, tipo: "diesel", solicitado: 4500,
    autorizado: null, descripcion: "Diésel para equipo menor.",
    estatus: "rechazado", pagado: false,
    motivoRechazo: "El vale anterior de diésel aún no se comprueba; se rechaza hasta entregar tickets.",
  },
  {
    key: "G-G1", obraId: null, semana: 4, dia: 2, tipo: "magna", solicitado: 5500,
    autorizado: 5500, descripcion: "Gasolina para vehículo administrativo de dirección.",
    estatus: "confirmado", pagado: true,
  },
];

async function seedGasolinas() {
  log("→ Vales de gasolina, autorizaciones y pagos…");

  const vales = [];
  const pagos = [];
  const asientosEntrega = [];
  const asientosPago = [];

  VALES_DEMO.forEach((def, idx) => {
    const valeId = uid(`vale:${def.key}`);
    const solicitadoAt = at(weekDate(def.semana, def.dia), 8, 30);
    const autorizadoAt = def.autorizado != null ? at(weekDate(def.semana, def.dia), 10, 15) : null;
    const ligadoAt = ["entregado", "confirmado"].includes(def.estatus)
      ? at(weekDate(def.semana, def.dia + 1), 9, 0)
      : null;
    const confirmadoAt = def.estatus === "confirmado"
      ? at(weekDate(def.semana, def.dia + 2), 17, 30)
      : null;
    const rechazadoAt = def.estatus === "rechazado"
      ? at(weekDate(def.semana, def.dia), 11, 0)
      : null;
    const folio = `VG-2026-${String(idx + 1).padStart(4, "0")}`;

    vales.push({
      id: valeId,
      folio,
      company_id: ID.company,
      obra_id: def.obraId,
      tipo_combustible: def.tipo,
      monto_solicitado: def.solicitado,
      descripcion: def.descripcion,
      estatus: def.estatus,
      solicitado_por: def.obraId === ID.obraB ? auth.residente2 : def.obraId === ID.obraA ? auth.residente : auth.administrativo,
      solicitado_at: solicitadoAt,
      autorizado_por: autorizadoAt ? auth.supervisor : null,
      autorizado_at: autorizadoAt,
      monto_autorizado: def.autorizado,
      rechazado_por: rechazadoAt ? auth.supervisor : null,
      rechazado_at: rechazadoAt,
      motivo_rechazo: def.motivoRechazo ?? null,
      codigo_vale: ligadoAt ? `TKT-${folio.replace("VG-", "")}-${String(100 + idx)}` : null,
      ligado_por: ligadoAt ? auth.administrativo : null,
      ligado_at: ligadoAt,
      confirmado_por: confirmadoAt ? (def.obraId === ID.obraB ? auth.residente2 : def.obraId === ID.obraA ? auth.residente : auth.administrativo) : null,
      confirmado_at: confirmadoAt,
      created_at: solicitadoAt,
    });

    if (ligadoAt) {
      asientosEntrega.push({
        key: `vale-entrega:${def.key}`,
        fecha: ligadoAt.slice(0, 10),
        concepto: `Vale ${folio} — ${def.tipo}`,
        referencia: folio,
        origenTipo: "vale_gasolina_entregado",
        origenId: valeId,
        movimientos: [
          { tipo: "cargo", cuenta: "Costo de obra - Gasolinas", monto: def.autorizado ?? def.solicitado },
          { tipo: "abono", cuenta: "Cuentas por pagar - Gasolinas", monto: def.autorizado ?? def.solicitado },
        ],
      });
    }

    if (def.pagado) {
      const fechaPago = weekDate(def.semana, Math.min(6, def.dia + 3));
      pagos.push({
        key: `gasolina:${def.key}`,
        valeId,
        folio,
        monto: def.autorizado ?? def.solicitado,
        fecha: fechaPago,
        cuentaId: idx % 2 === 0 ? ID.cuentaBBVA : ID.cuentaSantander,
      });
      asientosPago.push({
        key: `vale-pago:${def.key}`,
        fecha: fechaPago,
        concepto: `Pago vale ${folio}`,
        referencia: folio,
        origenTipo: "pago_gasolina",
        origenId: valeId,
        movimientos: [
          { tipo: "cargo", cuenta: "Cuentas por pagar - Gasolinas", monto: def.autorizado ?? def.solicitado },
          { tipo: "abono", cuenta: "Bancos", monto: def.autorizado ?? def.solicitado },
        ],
      });
    }
  });

  await insert("vales_gasolina", vales);

  for (const p of pagos) {
    await registrarPago({
      key: p.key,
      cuentaId: p.cuentaId,
      fecha: p.fecha,
      monto: p.monto,
      metodo: "transferencia",
      referencia: `SPEI-${p.folio}`,
      concepto: `Pago vale de gasolina ${p.folio}`,
      origenTipo: "gasolina",
      origenId: p.valeId,
    });
  }

  for (const a of asientosEntrega) await registrarAsiento(a);
  for (const a of asientosPago) await registrarAsiento(a);

  const total = vales.reduce((s, v) => s + Number(v.monto_autorizado ?? 0), 0);
  const pagado = pagos.reduce((s, p) => s + p.monto, 0);
  log(`  Gasolina autorizada ${money(total)} · pagada ${money(pagado)} · pendiente ${money(total - pagado)}.`);
}

// ---------------------------------------------------------------------------
// 12. Caja chica
// ---------------------------------------------------------------------------

const CAJA_CHICA_FONDOS = [
  {
    key: "A-1", obraId: ID.obraA, residenteKey: "residente", monto: 60000, semana: 0, dia: 1,
    notas: "Fondo inicial para gastos menores de la Torre A.",
  },
  {
    key: "A-2", obraId: ID.obraA, residenteKey: "residente", monto: 40000, semana: 3, dia: 2,
    notas: "Reposición de fondo para acabados y trabajos de detalle.",
  },
  {
    key: "B-1", obraId: ID.obraB, residenteKey: "residente2", monto: 50000, semana: 0, dia: 2,
    notas: "Fondo inicial para la ampliación de la nave industrial.",
  },
  {
    key: "B-2", obraId: ID.obraB, residenteKey: "residente2", monto: 30000, semana: 3, dia: 3,
    notas: "Reposición para consumibles y traslados del frente de estructura.",
  },
];

const CAJA_CHICA_REEMBOLSOS = [
  {
    key: "A-CC1", obraId: ID.obraA, residenteKey: "residente", semana: 0, estatus: "repuesto",
    gastos: [
      { concepto: "Cemento gris para detalles de castillos", tipo: "factura", monto: 3450, dia: 1 },
      { concepto: "Fletes locales de material", tipo: "nota", monto: 2890, dia: 2 },
      { concepto: "Herramienta menor y discos de corte", tipo: "factura", monto: 4120, dia: 3 },
    ],
  },
  {
    key: "A-CC2", obraId: ID.obraA, residenteKey: "residente", semana: 2, estatus: "enviado_admin",
    gastos: [
      { concepto: "Block y mortero para muestras", tipo: "factura", monto: 4780, dia: 1 },
      { concepto: "Pasajes y viáticos de supervisión", tipo: "ninguno", monto: 3950, dia: 2 },
      { concepto: "Impermeabilizante para prueba de azotea", tipo: "factura", monto: 5260, dia: 4 },
    ],
  },
  {
    key: "A-CC3", obraId: ID.obraA, residenteKey: "residente", semana: 4, estatus: "en_revision",
    gastos: [
      { concepto: "Pintura y sellador para departamento muestra", tipo: "factura", monto: 5340, dia: 1 },
      { concepto: "Consumibles de limpieza de obra", tipo: "nota", monto: 4610, dia: 3 },
    ],
  },
  {
    key: "A-CC4", obraId: ID.obraA, residenteKey: "residente", semana: 5, estatus: "solicitado",
    gastos: [
      { concepto: "Gasolina para traslado de cuadrilla", tipo: "nota", monto: 3280, dia: 0 },
      { concepto: "Papelería y copias de planos", tipo: "factura", monto: 2940, dia: 1 },
    ],
  },
  {
    key: "B-CC1", obraId: ID.obraB, residenteKey: "residente2", semana: 0, estatus: "repuesto",
    gastos: [
      { concepto: "Cemento y arena para ajustes de trazo", tipo: "factura", monto: 2980, dia: 1 },
      { concepto: "Fletes de acero de refuerzo", tipo: "nota", monto: 3450, dia: 2 },
      { concepto: "Herramienta menor para habilitado", tipo: "factura", monto: 2760, dia: 4 },
    ],
  },
  {
    key: "B-CC2", obraId: ID.obraB, residenteKey: "residente2", semana: 2, estatus: "enviado_admin",
    gastos: [
      { concepto: "Material eléctrico para caseta", tipo: "factura", monto: 3640, dia: 1 },
      { concepto: "Viáticos de supervisión", tipo: "ninguno", monto: 4120, dia: 2 },
      { concepto: "Sellador y silicón para oficinas modulares", tipo: "factura", monto: 2890, dia: 4 },
    ],
  },
  {
    key: "B-CC3", obraId: ID.obraB, residenteKey: "residente2", semana: 4, estatus: "en_revision",
    gastos: [
      { concepto: "Pintura para oficinas modulares", tipo: "factura", monto: 4210, dia: 1 },
      { concepto: "Limpieza de obra y retiro de escombro", tipo: "nota", monto: 3380, dia: 3 },
    ],
  },
  {
    key: "B-CC4", obraId: ID.obraB, residenteKey: "residente2", semana: 5, estatus: "solicitado",
    gastos: [
      { concepto: "Diésel para generador de respaldo", tipo: "nota", monto: 2640, dia: 0 },
      { concepto: "Copias y papelería de obra", tipo: "factura", monto: 3120, dia: 1 },
    ],
  },
];

const CAJA_CHICA_SUELTOS = [
  {
    key: "A-BOR1", obraId: ID.obraA, residenteKey: "residente", semana: 5, dia: 2,
    concepto: "Reposición de brocas para rotomartillo", tipo: "factura", monto: 1850, estatus: "borrador",
  },
  {
    key: "A-BOR2", obraId: ID.obraA, residenteKey: "residente", semana: 5, dia: 3,
    concepto: "Agua potable para cuadrilla", tipo: "nota", monto: 2430, estatus: "borrador",
  },
  {
    key: "A-REC1", obraId: ID.obraA, residenteKey: "residente", semana: 3, dia: 2,
    concepto: "Renta de planta de luz adicional", tipo: "factura", monto: 6800, estatus: "rechazado",
    motivoRechazo: "La planta de luz de la obra está disponible; no se justifica la renta adicional.",
  },
  {
    key: "B-BOR1", obraId: ID.obraB, residenteKey: "residente2", semana: 5, dia: 2,
    concepto: "Discos de corte para estructura", tipo: "factura", monto: 1980, estatus: "borrador",
  },
  {
    key: "B-BOR2", obraId: ID.obraB, residenteKey: "residente2", semana: 5, dia: 3,
    concepto: "Agua y hielo para cuadrilla", tipo: "nota", monto: 2240, estatus: "borrador",
  },
  {
    key: "B-REC1", obraId: ID.obraB, residenteKey: "residente2", semana: 3, dia: 1,
    concepto: "Decoración de oficina de obra", tipo: "factura", monto: 4500, estatus: "rechazado",
    motivoRechazo: "No es un gasto prioritario para la obra; se rechaza hasta concluir el montaje.",
  },
];

async function seedCajaChica() {
  log("→ Caja chica: asignaciones, fondos, gastos y reembolsos…");

  await insert("caja_chica_asignaciones", [
    {
      id: uid("caja-asignacion:A"),
      company_id: ID.company,
      obra_id: ID.obraA,
      residente_id: auth.residente,
      monto_base: 120000,
      activo: true,
      asignado_por: auth.director,
      notas: "Fondo autorizado para la Torre A; incluye reposiciones semanales.",
    },
    {
      id: uid("caja-asignacion:B"),
      company_id: ID.company,
      obra_id: ID.obraB,
      residente_id: auth.residente2,
      monto_base: 90000,
      activo: true,
      asignado_por: auth.director,
      notas: "Fondo autorizado para la ampliación de la nave industrial.",
    },
  ]);

  const fondosRows = [];
  const asientosFondo = [];

  for (const def of CAJA_CHICA_FONDOS) {
    const fondoId = uid(`caja-fondo:${def.key}`);
    const residente = auth[def.residenteKey];
    const fechaEntrega = weekDate(def.semana, def.dia);
    const folioCxp = `Fondo ${def.key}`;
    const beneficiario = USERS.find((u) => u.key === def.residenteKey)?.nombre ?? "Residente";

    const cxp = await crearCxP({
      key: `caja-fondo:${def.key}`,
      obraId: def.obraId,
      beneficiarioTipo: "residente",
      beneficiarioId: residente,
      beneficiarioNombre: beneficiario,
      concepto: `Fondo de caja chica ${def.key} · ${beneficiario}`,
      origenTipo: "caja_chica_fondo",
      origenId: fondoId,
      monto: def.monto,
      fechaEmision: fechaEntrega,
      fechaVencimiento: fechaEntrega,
    });

    fondosRows.push({
      id: fondoId,
      company_id: ID.company,
      obra_id: def.obraId,
      residente_id: residente,
      monto_solicitado: def.monto,
      monto_entregado: def.monto,
      estatus: "entregado",
      solicitado_por: residente,
      solicitado_at: at(fechaEntrega, 8, 15),
      autorizado_por: auth.supervisor,
      autorizado_at: at(fechaEntrega, 9, 0),
      entregado_por: auth.administrativo,
      entregado_at: at(fechaEntrega, 10, 0),
      cxp_id: cxp.id,
      notas: def.notas,
      created_at: at(fechaEntrega, 8, 15),
    });

    await pagarCxP(cxp, {
      key: `caja-fondo-pago:${def.key}`,
      fecha: fechaEntrega,
      cuentaId: ID.cuentaCaja,
      metodo: "efectivo",
      referencia: `FONDO-${def.key}`,
      notas: `Entrega de efectivo al residente (${folioCxp}).`,
    });

    asientosFondo.push({
      key: `caja-fondo:${def.key}`,
      fecha: fechaEntrega,
      concepto: `Entrega de fondo de caja chica ${def.key}`,
      referencia: `FONDO-${def.key}`,
      origenTipo: "caja_chica_fondo",
      origenId: fondoId,
      movimientos: [
        { tipo: "cargo", cuenta: "Caja chica", monto: def.monto },
        { tipo: "abono", cuenta: "Caja fuerte", monto: def.monto },
      ],
    });
  }

  await insert("caja_chica_fondos", fondosRows);
  for (const a of asientosFondo) await registrarAsiento(a);

  const reembolsosRows = [];
  const gastosRows = [];
  const asientosGasto = [];
  let reembolsoSeq = 0;

  for (const def of CAJA_CHICA_REEMBOLSOS) {
    reembolsoSeq++;
    const reembolsoId = uid(`caja-reembolso:${def.key}`);
    const residente = auth[def.residenteKey];
    const total = round2(def.gastos.reduce((s, g) => s + g.monto, 0));
    const inicio = WEEKS[def.semana].inicio;
    const fin = WEEKS[def.semana].fin;
    const folio = `CC-2026-${String(reembolsoSeq).padStart(4, "0")}`;
    const solicitadoAt = at(fin, 17, 30);
    const revisadoAt = ["en_revision", "enviado_admin", "repuesto"].includes(def.estatus)
      ? at(weekDate(def.semana, 6), 10, 0)
      : null;
    const enviadoAt = ["enviado_admin", "repuesto"].includes(def.estatus)
      ? at(weekDate(def.semana, 6), 12, 0)
      : null;
    const repuestoAt = def.estatus === "repuesto"
      ? at(weekDate(def.semana, 6), 16, 0)
      : null;

    const gastoEstatus = def.estatus === "repuesto"
      ? "reembolsado"
      : def.estatus === "enviado_admin"
        ? "aprobado"
        : "solicitado";

    reembolsosRows.push({
      id: reembolsoId,
      folio,
      company_id: ID.company,
      obra_id: def.obraId,
      residente_id: residente,
      semana_inicio: inicio,
      semana_fin: fin,
      estatus: def.estatus,
      monto_solicitado: total,
      monto_aprobado: ["enviado_admin", "repuesto"].includes(def.estatus) ? total : 0,
      monto_reembolsado: def.estatus === "repuesto" ? total : null,
      solicitado_por: residente,
      solicitado_at: solicitadoAt,
      revisado_por: revisadoAt ? auth.supervisor : null,
      revisado_at: revisadoAt,
      enviado_admin_at: enviadoAt,
      enviado_admin_por: enviadoAt ? auth.administrativo : null,
      repuesto_por: repuestoAt ? auth.administrativo : null,
      repuesto_at: repuestoAt,
      created_at: solicitadoAt,
    });

    def.gastos.forEach((g, idx) => {
      const gastoId = uid(`caja-gasto:${def.key}:${idx + 1}`);
      const fecha = weekDate(def.semana, g.dia);
      gastosRows.push({
        id: gastoId,
        company_id: ID.company,
        obra_id: def.obraId,
        residente_id: residente,
        reembolso_id: reembolsoId,
        fecha,
        concepto: g.concepto,
        descripcion: `Comprobante ${g.tipo} · reembolso ${folio}`,
        monto: g.monto,
        tipo_comprobante: g.tipo,
        evidencia_url: null,
        estatus: gastoEstatus,
        revisado_por: revisadoAt ? auth.supervisor : null,
        revisado_at: revisadoAt,
        created_at: at(fecha, 13, 0),
      });

      if (gastoEstatus !== "rechazado") {
        asientosGasto.push({
          key: `caja-gasto:${def.key}:${idx + 1}`,
          fecha,
          concepto: `Gasto de caja chica · ${g.concepto}`,
          referencia: folio,
          origenTipo: "caja_chica_gasto",
          origenId: gastoId,
          movimientos: [
            { tipo: "cargo", cuenta: "Costo de obra - Caja chica", monto: g.monto },
            { tipo: "abono", cuenta: "Caja chica", monto: g.monto },
          ],
        });
      }
    });
  }

  for (const def of CAJA_CHICA_SUELTOS) {
    const gastoId = uid(`caja-gasto:${def.key}`);
    const fecha = weekDate(def.semana, def.dia);
    const residente = auth[def.residenteKey];
    const rechazado = def.estatus === "rechazado";
    gastosRows.push({
      id: gastoId,
      company_id: ID.company,
      obra_id: def.obraId,
      residente_id: residente,
      reembolso_id: null,
      fecha,
      concepto: def.concepto,
      descripcion: rechazado ? "Gasto rechazado por supervisión." : "Gasto menor pendiente de comprobar.",
      monto: def.monto,
      tipo_comprobante: def.tipo,
      evidencia_url: null,
      estatus: def.estatus,
      revisado_por: rechazado ? auth.supervisor : null,
      revisado_at: rechazado ? at(weekDate(def.semana, def.dia + 1), 9, 0) : null,
      motivo_rechazo: def.motivoRechazo ?? null,
      created_at: at(fecha, 13, 0),
    });

    if (!rechazado) {
      asientosGasto.push({
        key: `caja-gasto:${def.key}`,
        fecha,
        concepto: `Gasto de caja chica · ${def.concepto}`,
        referencia: `CC-2026-S/N`,
        origenTipo: "caja_chica_gasto",
        origenId: gastoId,
        movimientos: [
          { tipo: "cargo", cuenta: "Costo de obra - Caja chica", monto: def.monto },
          { tipo: "abono", cuenta: "Caja chica", monto: def.monto },
        ],
      });
    }
  }

  await insert("caja_chica_reembolsos", reembolsosRows);
  await insert("caja_chica_gastos", gastosRows);
  for (const a of asientosGasto) await registrarAsiento(a);

  const entregado = CAJA_CHICA_FONDOS.reduce((s, f) => s + f.monto, 0);
  const gastado = gastosRows
    .filter((g) => ["solicitado", "aprobado", "reembolsado"].includes(g.estatus))
    .reduce((s, g) => s + Number(g.monto), 0);
  const porReponer = reembolsosRows
    .filter((r) => r.estatus === "enviado_admin")
    .reduce((s, r) => s + Number(r.monto_aprobado), 0);
  log(
    `  Fondos entregados ${money(entregado)} · gastado ${money(gastado)} · ` +
      `efectivo en residentes ${money(entregado - gastado)} · por reponer ${money(porReponer)}.`,
  );
}

// ---------------------------------------------------------------------------
// 13. Gastos directos de obra
// ---------------------------------------------------------------------------

const GASTOS_OBRA_DEMO = [
  {
    key: "A-GD1", obraId: ID.obraA, residenteKey: "residente", semana: 0, dia: 2,
    tipo: "servicio", proveedorKey: "maquinaria", comprobante: "factura",
    concepto: "Renta de bomba de concreto para colado de cimentación",
    monto: 48000, estatus: "pagado", pagarCon: ID.cuentaBBVA,
    notas: "Incluye operador y suministro de manguera.",
  },
  {
    key: "A-GD2", obraId: ID.obraA, residenteKey: "residente", semana: 2, dia: 2,
    tipo: "servicio", proveedorKey: "gruas", comprobante: "factura",
    concepto: "Servicio de grúa para montaje de columnas prefabricadas",
    monto: 36500, estatus: "autorizado",
    notas: "Servicio programado para el frente de columnas eje B.",
  },
  {
    key: "A-GD3", obraId: ID.obraA, residenteKey: "residente", semana: 3, dia: 1,
    tipo: "material", proveedorKey: "block", comprobante: "nota",
    concepto: "Block y mortero para muestras de fachada",
    monto: 18400, estatus: "borrador",
    partidas: [["blk1", 600], ["blk2", 300]],
    notas: "Pendiente de enviar a autorización; material para departamento muestra.",
  },
  {
    key: "A-GD4", obraId: ID.obraA, residenteKey: "residente", semana: 4, dia: 2,
    tipo: "servicio", proveedorKey: "ferreteria", comprobante: "nota",
    concepto: "Reparación de herramienta menor y afilado de brocas",
    monto: 12800, estatus: "solicitado",
    notas: "Taller externo; se requiere autorización del supervisor.",
  },
  {
    key: "A-GD5", obraId: ID.obraA, residenteKey: "residente", semana: 1, dia: 3,
    tipo: "servicio", proveedorKey: "pinturas", comprobante: "factura",
    concepto: "Suministro de pintura decorativa para área común",
    monto: 54000, estatus: "rechazado",
    motivoRechazo: "El alcance de pintura decorativa no está en el presupuesto vigente; se difiere a la adenda de acabados.",
  },
  {
    key: "B-GD1", obraId: ID.obraB, residenteKey: "residente2", semana: 1, dia: 2,
    tipo: "servicio", proveedorKey: "pavimentos", comprobante: "factura",
    concepto: "Preparación de base y colado de patio de maniobras",
    monto: 42000, estatus: "pagado", pagarCon: ID.cuentaSantander,
    notas: "Incluye vibrado y curado de concreto.",
  },
  {
    key: "B-GD2", obraId: ID.obraB, residenteKey: "residente2", semana: 3, dia: 2,
    tipo: "servicio", proveedorKey: "estructuras", comprobante: "factura",
    concepto: "Montaje de estructura metálica de la ampliación",
    monto: 65000, estatus: "autorizado",
    notas: "Se autoriza con estimación de avance del 50%.",
  },
  {
    key: "B-GD3", obraId: ID.obraB, residenteKey: "residente2", semana: 4, dia: 1,
    tipo: "material", proveedorKey: "aceros", comprobante: "factura",
    concepto: "Acero de refuerzo para losa de entrepiso",
    monto: 28500, estatus: "solicitado",
    partidas: [["acr1", 900], ["acr2", 350]],
    notas: "Material pendiente de autorización y recepción en almacén.",
  },
  {
    key: "B-GD4", obraId: ID.obraB, residenteKey: "residente2", semana: 2, dia: 3,
    tipo: "servicio", proveedorKey: "ferreteria", comprobante: "nota",
    concepto: "Renta de equipo de soldadura y consumibles",
    monto: 9700, estatus: "rechazado",
    motivoRechazo: "La cuadrilla cuenta con equipo propio; se rechaza la renta.",
  },
  {
    key: "B-GD5", obraId: ID.obraB, residenteKey: "residente2", semana: 0, dia: 3,
    tipo: "servicio", proveedorKey: "maquinaria", comprobante: "nota",
    concepto: "Traslado de retroexcavadora y maniobras de descarga",
    monto: 22400, estatus: "pagado", pagarCon: ID.cuentaCaja,
    notas: "Pago en efectivo desde caja fuerte por comprobante tipo nota.",
  },
];

async function seedGastosObra() {
  log("→ Gastos directos de obra…");

  const gastos = [];
  const partidas = [];
  const asientos = [];
  let seq = 0;

  for (const def of GASTOS_OBRA_DEMO) {
    seq++;
    const gastoId = uid(`gasto-obra:${def.key}`);
    const folio = `GD-2026-${String(seq).padStart(4, "0")}`;
    const residente = auth[def.residenteKey];
    const fecha = weekDate(def.semana, def.dia);
    const proveedor = TERCEROS.find((t) => t.key === def.proveedorKey);
    const proveedorId = TERCERO_ID[def.proveedorKey];
    const solicitado = def.estatus !== "borrador";
    const autorizado = ["autorizado", "pagado", "rechazado"].includes(def.estatus);
    let cxp = null;

    if (["autorizado", "pagado"].includes(def.estatus)) {
      const origenTipo = def.comprobante === "factura" ? "gasto_obra_factura" : "gasto_obra_nota";
      cxp = await crearCxP({
        key: `gasto-obra:${def.key}`,
        obraId: def.obraId,
        beneficiarioTipo: "tercero",
        beneficiarioId: proveedorId,
        beneficiarioNombre: proveedor?.razon_social ?? "Proveedor",
        concepto: `${folio} · ${def.concepto}`,
        origenTipo,
        origenId: gastoId,
        monto: def.monto,
        fechaEmision: fecha,
        fechaVencimiento: weekDate(def.semana, Math.min(6, def.dia + 3)),
      });
    }

    gastos.push({
      id: gastoId,
      company_id: ID.company,
      obra_id: def.obraId,
      folio,
      tipo: def.tipo,
      proveedor_id: proveedorId,
      concepto: def.concepto,
      tipo_comprobante: def.comprobante,
      comprobante_path: null,
      fecha,
      monto_total: def.monto,
      notas: def.notas ?? null,
      estatus: def.estatus,
      motivo_rechazo: def.motivoRechazo ?? null,
      solicitado_por: solicitado ? residente : null,
      solicitado_at: solicitado ? at(fecha, 9, 0) : null,
      autorizado_por: autorizado ? auth.supervisor : null,
      autorizado_at: autorizado ? at(fecha, 15, 0) : null,
      cxp_id: cxp?.id ?? null,
      creado_por: residente,
      created_at: at(fecha, 8, 30),
    });

    if (def.tipo === "material" && def.partidas) {
      def.partidas.forEach(([insumoKey, cantidad], idx) => {
        partidas.push({
          id: uid(`gasto-obra-partida:${def.key}:${idx + 1}`),
          gasto_id: gastoId,
          insumo_id: INSUMO_ID[insumoKey],
          cantidad,
          precio_unitario: INSUMO_POR_KEY[insumoKey].precio,
        });
      });
    }

    if (def.estatus === "pagado" && cxp) {
      await pagarCxP(cxp, {
        key: `gasto-obra-pago:${def.key}`,
        fecha: weekDate(def.semana, Math.min(6, def.dia + 2)),
        cuentaId: def.pagarCon,
        metodo: def.pagarCon === ID.cuentaCaja ? "efectivo" : "transferencia",
        referencia: `PAGO-${folio}`,
      });

      asientos.push({
        key: `gasto-obra-pago:${def.key}`,
        fecha: weekDate(def.semana, Math.min(6, def.dia + 2)),
        concepto: `Pago gasto de obra ${folio}`,
        referencia: folio,
        origenTipo: "gasto_obra_pagado",
        origenId: gastoId,
        movimientos: [
          { tipo: "cargo", cuenta: "Costo de obra - Servicios", monto: def.monto },
          { tipo: "abono", cuenta: def.pagarCon === ID.cuentaCaja ? "Caja fuerte" : "Bancos", monto: def.monto },
        ],
      });
    }
  }

  await insert("obra_gastos_directos", gastos);
  await insert("obra_gasto_directo_partidas", partidas);
  for (const a of asientos) await registrarAsiento(a);

  const total = gastos.reduce((s, g) => s + Number(g.monto_total), 0);
  const pagado = gastos.filter((g) => g.estatus === "pagado").reduce((s, g) => s + Number(g.monto_total), 0);
  log(`  Gastos directos ${money(total)} · pagados ${money(pagado)} · CxP abiertas ${money(total - pagado)}.`);
}

// ---------------------------------------------------------------------------
// 14. Gastos de oficina y nómina administrativa
// ---------------------------------------------------------------------------

const PERIODOS_NOMINA_OFICINA = [
  { key: "sep-q2", inicio: "2026-09-16", fin: "2026-09-30", pago: "2026-10-01", estatus: "pagada" },
  { key: "oct-q1", inicio: "2026-10-01", fin: "2026-10-15", pago: "2026-10-16", estatus: "pagada" },
];

const GASTOS_OFICINA_DEMO = [
  {
    key: "serv-cont", tipo: "servicio", proveedorKey: "oficina", comprobante: "factura",
    concepto: "Servicios contables y administrativos · octubre",
    monto: 28500, fecha: "2026-10-05", requerida: "2026-10-15", estatus: "pagada",
    pagarCon: ID.cuentaBBVA, solicitadoPor: "administrativo",
    notas: "Incluye contabilidad, nómina y declaraciones mensuales.",
  },
  {
    key: "serv-aire", tipo: "servicio", proveedorKey: "ferreteria", comprobante: "factura",
    concepto: "Mantenimiento preventivo de aire acondicionado",
    monto: 9800, fecha: "2026-10-20", requerida: "2026-10-30", estatus: "aprobada",
    solicitadoPor: "administrativo", notas: "Servicio a dos minisplits de oficina.",
  },
  {
    key: "papeleria", tipo: "papeleria", proveedorKey: "ferreteria", comprobante: "nota",
    concepto: "Papelería y consumibles de oficina",
    monto: 3850, fecha: "2026-10-22", requerida: "2026-10-29", estatus: "pendiente_aprobacion",
    solicitadoPor: "auxiliar",
  },
  {
    key: "cafeteria", tipo: "otro", proveedorKey: "oficina", comprobante: "ninguno",
    concepto: "Cafetería y agua purificada para oficina",
    monto: 2450, fecha: "2026-10-24", requerida: "2026-10-31", estatus: "pendiente_aprobacion",
    solicitadoPor: "auxiliar",
  },
  {
    key: "decoracion", tipo: "otro", proveedorKey: "pinturas", comprobante: "factura",
    concepto: "Decoración de recepción corporativa",
    monto: 18900, fecha: "2026-10-18", requerida: "2026-10-28", estatus: "rechazada",
    solicitadoPor: "auxiliar", aprobadoPor: "director",
    motivoRechazo: "No es un gasto prioritario; se pospone hasta el cierre del ejercicio.",
  },
  {
    key: "mensajeria", tipo: "servicio", proveedorKey: "oficina", comprobante: "nota",
    concepto: "Mensajería y paquetería de documentación",
    monto: 1780, fecha: "2026-10-23", requerida: "2026-10-27", estatus: "pagada",
    pagarCon: ID.cuentaCaja, solicitadoPor: "administrativo",
    notas: "Envío de estimaciones y facturas a clientes.",
  },
];

async function seedGastosOficina() {
  log("→ Gastos de oficina y nómina administrativa…");

  const personal = TRABAJADORES.filter((t) => t.es_personal_oficina);
  const gastos = [];
  const asientos = [];
  let seq = 0;

  for (const periodo of PERIODOS_NOMINA_OFICINA) {
    for (const trabajador of personal) {
      seq++;
      const gastoId = uid(`gasto-oficina:nomina:${periodo.key}:${trabajador.id}`);
      const folio = `GO-2026-${String(seq).padStart(4, "0")}`;
      const monto = Number(trabajador.sueldo_periodo);
      const cxp = await crearCxP({
        key: `gasto-oficina:nomina:${periodo.key}:${trabajador.id}`,
        beneficiarioTipo: "trabajador",
        beneficiarioId: trabajador.id,
        beneficiarioNombre: trabajador.nombre_completo,
        concepto: `${folio} · Nómina oficina ${periodo.inicio} a ${periodo.fin}`,
        origenTipo: "gasto_oficina",
        origenId: gastoId,
        monto,
        fechaEmision: periodo.fin,
        fechaVencimiento: periodo.pago,
      });
      await pagarCxP(cxp, {
        key: `gasto-oficina-pago:nomina:${periodo.key}:${trabajador.id}`,
        fecha: periodo.pago,
        cuentaId: ID.cuentaBBVA,
        metodo: "transferencia",
        referencia: `NOM-OF-${periodo.key}-${trabajador.id.slice(0, 4)}`,
      });

      gastos.push({
        id: gastoId,
        company_id: ID.company,
        folio,
        tipo: "nomina_oficina",
        concepto: `Nómina ${periodo.key} · ${trabajador.nombre_completo}`,
        proveedor_id: null,
        beneficiario_trabajador_id: trabajador.id,
        periodo_inicio: periodo.inicio,
        periodo_fin: periodo.fin,
        monto,
        fecha_gasto: periodo.fin,
        fecha_requerida_pago: periodo.pago,
        notas: "Nómina quincenal de personal administrativo.",
        evidencia_url: null,
        estatus: "pagada",
        cxp_id: cxp.id,
        motivo_rechazo: null,
        solicitado_por: auth.administrativo,
        aprobado_por: auth.director,
        aprobado_at: at(periodo.fin, 17, 0),
        created_at: at(periodo.fin, 16, 0),
      });

      asientos.push({
        key: `gasto-oficina-pago:nomina:${periodo.key}:${trabajador.id}`,
        fecha: periodo.pago,
        concepto: `Pago nómina oficina ${trabajador.nombre_completo}`,
        referencia: folio,
        origenTipo: "gasto_oficina_pagado",
        origenId: gastoId,
        movimientos: [
          { tipo: "cargo", cuenta: "Nómina oficina", monto },
          { tipo: "abono", cuenta: "Bancos", monto },
        ],
      });
    }
  }

  // Nómina del periodo en curso, aún pendiente de aprobación.
  seq++;
  const pendiente = personal[0];
  gastos.push({
    id: uid(`gasto-oficina:nomina:oct-q2:${pendiente.id}`),
    company_id: ID.company,
    folio: `GO-2026-${String(seq).padStart(4, "0")}`,
    tipo: "nomina_oficina",
    concepto: `Nómina oct-q2 · ${pendiente.nombre_completo}`,
    proveedor_id: null,
    beneficiario_trabajador_id: pendiente.id,
    periodo_inicio: "2026-10-16",
    periodo_fin: "2026-10-31",
    monto: Number(pendiente.sueldo_periodo),
    fecha_gasto: "2026-10-31",
    fecha_requerida_pago: "2026-11-01",
    notas: "Nómina de la quincena en curso; pendiente de aprobación.",
    evidencia_url: null,
    estatus: "pendiente_aprobacion",
    cxp_id: null,
    motivo_rechazo: null,
    solicitado_por: auth.administrativo,
    aprobado_por: null,
    aprobado_at: null,
    created_at: at("2026-10-27", 9, 0),
  });

  for (const def of GASTOS_OFICINA_DEMO) {
    seq++;
    const gastoId = uid(`gasto-oficina:${def.key}`);
    const folio = `GO-2026-${String(seq).padStart(4, "0")}`;
    const proveedor = TERCEROS.find((t) => t.key === def.proveedorKey);
    const proveedorId = TERCERO_ID[def.proveedorKey];
    let cxp = null;

    if (["aprobada", "pagada"].includes(def.estatus)) {
      cxp = await crearCxP({
        key: `gasto-oficina:${def.key}`,
        beneficiarioTipo: "tercero",
        beneficiarioId: proveedorId,
        beneficiarioNombre: proveedor?.razon_social ?? "Proveedor",
        concepto: `${folio} · ${def.concepto}`,
        origenTipo: "gasto_oficina",
        origenId: gastoId,
        monto: def.monto,
        fechaEmision: def.fecha,
        fechaVencimiento: def.requerida,
      });
    }

    gastos.push({
      id: gastoId,
      company_id: ID.company,
      folio,
      tipo: def.tipo,
      concepto: def.concepto,
      proveedor_id: proveedorId,
      beneficiario_trabajador_id: null,
      periodo_inicio: null,
      periodo_fin: null,
      monto: def.monto,
      fecha_gasto: def.fecha,
      fecha_requerida_pago: def.requerida,
      notas: def.notas ?? null,
      evidencia_url: null,
      estatus: def.estatus,
      cxp_id: cxp?.id ?? null,
      motivo_rechazo: def.motivoRechazo ?? null,
      solicitado_por: auth[def.solicitadoPor],
      aprobado_por: def.estatus === "pendiente_aprobacion" ? null : auth[def.aprobadoPor ?? "administrativo"],
      aprobado_at: def.estatus === "pendiente_aprobacion" ? null : at(def.fecha, 18, 0),
      created_at: at(def.fecha, 9, 0),
    });

    if (def.estatus === "pagada" && cxp) {
      await pagarCxP(cxp, {
        key: `gasto-oficina-pago:${def.key}`,
        fecha: def.fecha,
        cuentaId: def.pagarCon,
        metodo: def.pagarCon === ID.cuentaCaja ? "efectivo" : "transferencia",
        referencia: `PAGO-${folio}`,
      });
      asientos.push({
        key: `gasto-oficina-pago:${def.key}`,
        fecha: def.fecha,
        concepto: `Pago gasto de oficina ${folio}`,
        referencia: folio,
        origenTipo: "gasto_oficina_pagado",
        origenId: gastoId,
        movimientos: [
          { tipo: "cargo", cuenta: "Gastos de administración", monto: def.monto },
          { tipo: "abono", cuenta: def.pagarCon === ID.cuentaCaja ? "Caja fuerte" : "Bancos", monto: def.monto },
        ],
      });
    }
  }

  await insert("gastos_oficina", gastos);
  for (const a of asientos) await registrarAsiento(a);

  const total = gastos.reduce((s, g) => s + Number(g.monto), 0);
  const pagado = gastos.filter((g) => g.estatus === "pagada").reduce((s, g) => s + Number(g.monto), 0);
  log(`  Gastos de oficina ${money(total)} · pagados ${money(pagado)} · pendientes de aprobación ${gastos.filter((g) => g.estatus === "pendiente_aprobacion").length}.`);
}

// ---------------------------------------------------------------------------
// 15. Tareas de obra
// ---------------------------------------------------------------------------

const TAREAS_DEMO = [
  {
    key: "A-T1", obraId: ID.obraA, asignado: "auxiliar", creado: "residente", semana: 1, dia: 0,
    limiteDia: 4, titulo: "Revisar armado de acero de columnas eje B",
    descripcion: "Verificar separación, traslapes y recubrimiento antes del colado.",
    estatus: "completada", completadaDia: 4,
  },
  {
    key: "A-T2", obraId: ID.obraA, asignado: "auxiliar", creado: "residente", semana: 2, dia: 0,
    limiteDia: 5, titulo: "Solicitar cotización de impermeabilizante",
    descripcion: "Comparar al menos tres proveedores para la prueba de azotea.",
    estatus: "en_progreso",
  },
  {
    key: "A-T3", obraId: ID.obraA, asignado: "residente", creado: "director", semana: 4, dia: 0,
    limiteDia: 5, titulo: "Validar estimación semanal con dirección",
    descripcion: "Revisar renglones ejecutados y soportes fotográficos antes del cierre.",
    estatus: "pendiente",
  },
  {
    key: "A-T4", obraId: ID.obraA, asignado: "residente", creado: "supervisor", semana: 5, dia: 0,
    limiteDia: 5, titulo: "Programar colado de losa nivel 2",
    descripcion: "Coordinar bomba, concreto y cuadrilla; confirmar clima y accesos.",
    estatus: "pendiente",
  },
  {
    key: "A-T5", obraId: ID.obraA, asignado: "auxiliar", creado: "residente", semana: 3, dia: 1,
    limiteDia: 5, titulo: "Actualizar planos as-built de instalación eléctrica",
    descripcion: "Incorporar cambios de trayectorias aprobados en campo.",
    estatus: "en_progreso",
  },
  {
    key: "A-T6", obraId: ID.obraA, asignado: "supervisor", creado: "director", semana: 0, dia: 1,
    limiteDia: 4, titulo: "Cerrar permisos de acceso de contratistas",
    descripcion: "Validar documentación de seguridad y vigencia de pólizas.",
    estatus: "completada", completadaDia: 3,
  },
  {
    key: "B-T1", obraId: ID.obraB, asignado: "auxiliar", creado: "residente2", semana: 1, dia: 1,
    limiteDia: 4, titulo: "Revisar trazo de ampliación de patio",
    descripcion: "Confirmar ejes y niveles contra plano topográfico.",
    estatus: "completada", completadaDia: 3,
  },
  {
    key: "B-T2", obraId: ID.obraB, asignado: "residente2", creado: "supervisor", semana: 3, dia: 0,
    limiteDia: 5, titulo: "Coordinar montaje de estructura metálica",
    descripcion: "Alinear grúa, maniobristas y secuencia de montaje.",
    estatus: "en_progreso",
  },
  {
    key: "B-T3", obraId: ID.obraB, asignado: "auxiliar", creado: "residente2", semana: 4, dia: 1,
    limiteDia: 5, titulo: "Solicitar pruebas de laboratorio de concreto",
    descripcion: "Programar muestreo de cilindros para el colado de entrepiso.",
    estatus: "pendiente",
  },
  {
    key: "B-T4", obraId: ID.obraB, asignado: "residente2", creado: "supervisor", semana: 5, dia: 0,
    limiteDia: 5, titulo: "Validar recepción de acero de refuerzo",
    descripcion: "Verificar diámetros, certificados y cantidad contra orden de compra.",
    estatus: "pendiente",
  },
  {
    key: "B-T5", obraId: ID.obraB, asignado: "auxiliar", creado: "residente2", semana: 2, dia: 1,
    limiteDia: 4, titulo: "Elaborar comparativo de renta de grúa",
    descripcion: "Comparar tarifas, disponibilidad y alcance de tres proveedores.",
    estatus: "completada", completadaDia: 4,
  },
  {
    key: "B-T6", obraId: ID.obraB, asignado: "supervisor", creado: "director", semana: 5, dia: 0,
    limiteDia: 6, titulo: "Actualizar matriz de riesgos de obra",
    descripcion: "Incorporar riesgos de montaje y suministro de estructura.",
    estatus: "pendiente",
  },
  {
    key: "B-T7", obraId: ID.obraB, asignado: "residente2", creado: "residente2", semana: 4, dia: 2,
    limiteDia: 2, titulo: "Cancelar tarea duplicada de limpieza",
    descripcion: "La limpieza ya fue programada con el contratista de intendencia.",
    estatus: "cancelada",
  },
  {
    key: "B-T8", obraId: ID.obraB, asignado: "residente2", creado: "director", semana: 5, dia: 1,
    limiteDia: 5, titulo: "Revisar cierre de estimación de subcontrato",
    descripcion: "Validar cantidades y amortización de anticipo antes de autorizar.",
    estatus: "pendiente",
  },
];

async function seedTareas() {
  log("→ Tareas de obra…");

  const tareas = TAREAS_DEMO.map((t) => {
    const created = weekDate(t.semana, t.dia);
    const limite = weekDate(t.semana, t.limiteDia);
    const completada = t.estatus === "completada" ? at(weekDate(t.semana, t.completadaDia), 17, 0) : null;
    return {
      id: uid(`tarea:${t.key}`),
      company_id: ID.company,
      obra_id: t.obraId,
      titulo: t.titulo,
      descripcion: t.descripcion,
      asignado_a: auth[t.asignado],
      creado_por: auth[t.creado],
      fecha_limite: limite,
      estatus: t.estatus,
      completada_at: completada,
      created_at: at(created, 9, 0),
      updated_at: completada ?? at(created, 9, 0),
    };
  });

  await insert("obra_tareas", tareas);
  const abiertas = tareas.filter((t) => ["pendiente", "en_progreso"].includes(t.estatus)).length;
  log(`  Tareas ${tareas.length} · abiertas ${abiertas} · completadas ${tareas.filter((t) => t.estatus === "completada").length}.`);
}

// ---------------------------------------------------------------------------
// 16. Notificaciones
// ---------------------------------------------------------------------------

const NOTIFICACIONES_DEMO = [
  {
    key: "n1", user: "director", obraId: ID.obraA, semana: 5, dia: 1, hora: 9, leida: false,
    tipo: "gasto_obra_solicitado", titulo: "Gasto de obra por autorizar",
    mensaje: "GD-2026-0004 · Reparación de herramienta menor y afilado de brocas · Torre A.",
    link: `/app/obras/${ID.obraA}/gastos-obra`,
  },
  {
    key: "n2", user: "director", obraId: ID.obraB, semana: 5, dia: 1, hora: 8, leida: false,
    tipo: "caja_chica_reembolso_solicitado", titulo: "Reembolso CC-2026-0008 solicitado",
    mensaje: "El residente de la nave industrial solicita reembolso por gastos de la semana.",
    link: `/app/admin/caja-chica`,
  },
  {
    key: "n3", user: "director", obraId: null, semana: 5, dia: 0, hora: 12, leida: false,
    tipo: "gasto_oficina_solicitado", titulo: "Gastos de oficina pendientes",
    mensaje: "Hay 2 solicitudes de oficina pendientes de aprobación por $6,300.00.",
    link: "/app/admin/gastos-oficina",
  },
  {
    key: "n4", user: "director", obraId: ID.obraA, semana: 4, dia: 5, hora: 17, leida: true,
    tipo: "destajo_estimacion_autorizada", titulo: "Estimación de destajo autorizada",
    mensaje: "Se autorizó la estimación semanal del destajo de albañilería de la Torre A.",
    link: `/app/obras/${ID.obraA}/destajos`,
  },
  {
    key: "n5", user: "director", obraId: ID.obraB, semana: 3, dia: 4, hora: 16, leida: true,
    tipo: "renta_vencimiento", titulo: "Renta próxima a vencer",
    mensaje: "La renta de la grúa de la nave industrial requiere renovación esta semana.",
    link: `/app/obras/${ID.obraB}/rentas`,
  },
  {
    key: "n6", user: "director", obraId: ID.obraA, semana: 2, dia: 2, hora: 10, leida: false,
    tipo: "oc_autorizada", titulo: "OC autorizada",
    mensaje: "La OC-A-2026-001 fue autorizada y enviada al proveedor de cemento.",
    link: `/app/obras/${ID.obraA}/requisiciones`,
  },
  {
    key: "n7", user: "residente", obraId: ID.obraA, semana: 5, dia: 0, hora: 8, leida: false,
    tipo: "tarea_asignada", titulo: "Nueva tarea: programar colado de losa",
    mensaje: "El supervisor te asignó la coordinación del colado de la losa nivel 2.",
    link: `/app/obras/${ID.obraA}/tareas`,
  },
  {
    key: "n8", user: "residente", obraId: ID.obraA, semana: 4, dia: 5, hora: 18, leida: false,
    tipo: "caja_chica_reembolso_autorizado", titulo: "Reembolso en revisión",
    mensaje: "Tu reembolso CC-2026-0003 fue recibido y está en revisión por supervisión.",
    link: `/app/obras/${ID.obraA}/caja-chica?tab=reembolsos`,
  },
  {
    key: "n9", user: "residente", obraId: ID.obraA, semana: 4, dia: 4, hora: 11, leida: true,
    tipo: "gasto_obra_pagado", titulo: "Gasto de obra pagado",
    mensaje: "Se pagó GD-2026-0001 por la renta de la bomba de concreto.",
    link: `/app/obras/${ID.obraA}/gastos-obra`,
  },
  {
    key: "n10", user: "residente", obraId: ID.obraA, semana: 3, dia: 1, hora: 9, leida: false,
    tipo: "almacen_recepcion", titulo: "Recepción registrada en almacén",
    mensaje: "Se recibió material de la OC-A-2026-001 y se actualizó el inventario.",
    link: `/app/obras/${ID.obraA}/almacen`,
  },
  {
    key: "n11", user: "residente", obraId: ID.obraA, semana: 2, dia: 3, hora: 15, leida: true,
    tipo: "pago_registrado", titulo: "Pago de estimación de destajo",
    mensaje: "Se registró el pago de la estimación de destajo de la semana 2.",
    link: `/app/obras/${ID.obraA}/destajos`,
  },
  {
    key: "n12", user: "residente2", obraId: ID.obraB, semana: 5, dia: 1, hora: 8, leida: false,
    tipo: "tarea_asignada", titulo: "Nueva tarea: validar acero de refuerzo",
    mensaje: "El supervisor te asignó la validación de la recepción de acero.",
    link: `/app/obras/${ID.obraB}/tareas`,
  },
  {
    key: "n13", user: "residente2", obraId: ID.obraB, semana: 5, dia: 0, hora: 10, leida: false,
    tipo: "gasto_obra_autorizado", titulo: "Gasto de obra autorizado",
    mensaje: "GD-2026-0007 · Montaje de estructura metálica fue autorizado.",
    link: `/app/obras/${ID.obraB}/gastos-obra`,
  },
  {
    key: "n14", user: "residente2", obraId: ID.obraB, semana: 4, dia: 4, hora: 17, leida: true,
    tipo: "caja_chica_reembolso_autorizado", titulo: "Reembolso enviado a administración",
    mensaje: "El reembolso CC-2026-0006 fue aprobado y enviado para reposición.",
    link: `/app/obras/${ID.obraB}/caja-chica?tab=reembolsos`,
  },
  {
    key: "n15", user: "residente2", obraId: ID.obraB, semana: 3, dia: 2, hora: 12, leida: false,
    tipo: "subcontrato_estimacion_cerrada", titulo: "Estimación de subcontrato cerrada",
    mensaje: "La estimación del subcontrato de estructura está lista para autorización.",
    link: `/app/obras/${ID.obraB}/subcontratos`,
  },
  {
    key: "n16", user: "residente2", obraId: ID.obraB, semana: 1, dia: 3, hora: 9, leida: true,
    tipo: "almacen_recepcion", titulo: "Recepción de material",
    mensaje: "Se recibió cemento y agregados para el frente de cimentación.",
    link: `/app/obras/${ID.obraB}/almacen`,
  },
  {
    key: "n17", user: "auxiliar", obraId: ID.obraA, semana: 5, dia: 2, hora: 9, leida: false,
    tipo: "tarea_asignada", titulo: "Tarea en progreso",
    mensaje: "Recuerda actualizar los planos as-built de instalación eléctrica.",
    link: `/app/obras/${ID.obraA}/tareas`,
  },
  {
    key: "n18", user: "auxiliar", obraId: ID.obraA, semana: 4, dia: 1, hora: 10, leida: false,
    tipo: "requisicion_aprobada", titulo: "Requisición aprobada",
    mensaje: "La requisición REQ-A-2026-002 pasó a cotización.",
    link: `/app/obras/${ID.obraA}/requisiciones`,
  },
  {
    key: "n19", user: "auxiliar", obraId: ID.obraB, semana: 5, dia: 1, hora: 11, leida: true,
    tipo: "gasto_oficina_solicitado", titulo: "Gasto de oficina enviado",
    mensaje: "Tu solicitud de papelería fue enviada para aprobación.",
    link: "/app/admin/gastos-oficina",
  },
  {
    key: "n20", user: "auxiliar", obraId: ID.obraB, semana: 3, dia: 3, hora: 16, leida: true,
    tipo: "vale_gasolina_solicitado", titulo: "Vale de gasolina entregado",
    mensaje: "El vale VG-2026-0010 fue entregado y está pendiente de comprobación.",
    link: `/app/obras/${ID.obraB}/gasolinas`,
  },
  {
    key: "n21", user: "administrativo", obraId: null, semana: 5, dia: 1, hora: 8, leida: false,
    tipo: "caja_chica_reembolso_solicitado", titulo: "Reembolsos por reponer",
    mensaje: "Hay 2 reembolsos aprobados por $24,640.00 listos para reposición.",
    link: "/app/admin/caja-chica",
  },
  {
    key: "n22", user: "administrativo", obraId: null, semana: 5, dia: 0, hora: 9, leida: false,
    tipo: "gasto_oficina_solicitado", titulo: "Gastos de oficina por aprobar",
    mensaje: "Hay solicitudes de papelería y cafetería pendientes de revisión.",
    link: "/app/admin/gastos-oficina",
  },
  {
    key: "n23", user: "administrativo", obraId: ID.obraA, semana: 4, dia: 5, hora: 17, leida: true,
    tipo: "pago_registrado", titulo: "Pago de nómina registrado",
    mensaje: "Se registró el pago de la nómina de la Torre A de la semana 4.",
    link: `/app/obras/${ID.obraA}/nominas`,
  },
  {
    key: "n24", user: "administrativo", obraId: ID.obraB, semana: 3, dia: 2, hora: 12, leida: false,
    tipo: "oc_pendiente", titulo: "OC pendiente de pago",
    mensaje: "La OC-B-2026-001 está recibida y pendiente de conciliación.",
    link: `/app/obras/${ID.obraB}/requisiciones`,
  },
  {
    key: "n25", user: "supervisor", obraId: ID.obraA, semana: 5, dia: 0, hora: 8, leida: false,
    tipo: "gasto_obra_solicitado", titulo: "Gasto de obra por autorizar",
    mensaje: "GD-2026-0004 · Reparación de herramienta menor requiere tu autorización.",
    link: `/app/obras/${ID.obraA}/gastos-obra`,
  },
  {
    key: "n26", user: "supervisor", obraId: ID.obraB, semana: 5, dia: 1, hora: 9, leida: false,
    tipo: "caja_chica_fondo_solicitado", titulo: "Fondo de caja chica por autorizar",
    mensaje: "El residente de la nave industrial solicita reposición de fondo.",
    link: `/app/obras/${ID.obraB}/caja-chica?tab=fondos`,
  },
  {
    key: "n27", user: "supervisor", obraId: ID.obraA, semana: 4, dia: 5, hora: 16, leida: true,
    tipo: "destajo_estimacion_cerrada", titulo: "Estimación de destajo cerrada",
    mensaje: "La estimación de albañilería de la semana 4 está lista para revisión.",
    link: `/app/obras/${ID.obraA}/destajos`,
  },
  {
    key: "n28", user: "supervisor", obraId: ID.obraB, semana: 3, dia: 1, hora: 10, leida: false,
    tipo: "subcontrato_estimacion_cerrada", titulo: "Estimación de subcontrato cerrada",
    mensaje: "La estimación de estructura metálica requiere validación de cantidades.",
    link: `/app/obras/${ID.obraB}/subcontratos`,
  },
];

async function seedNotificaciones() {
  log("→ Notificaciones de bandeja…");

  const rows = NOTIFICACIONES_DEMO.map((n) => {
    const created = at(weekDate(n.semana, n.dia), n.hora, 15);
    return {
      id: uid(`notificacion:${n.key}`),
      user_id: auth[n.user],
      company_id: ID.company,
      obra_id: n.obraId,
      tipo: n.tipo,
      titulo: n.titulo,
      mensaje: n.mensaje,
      link: n.link,
      leida_at: n.leida ? at(weekDate(n.semana, Math.min(6, n.dia + 1)), 9, 0) : null,
      created_at: created,
    };
  });

  await insert("notificaciones", rows);
  const noLeidas = rows.filter((r) => !r.leida_at).length;
  log(`  Notificaciones ${rows.length} · no leídas ${noLeidas}.`);
}

// ---------------------------------------------------------------------------
// 17. Resumen final
// ---------------------------------------------------------------------------

async function contar(tabla) {
  if (DRY_RUN) return null;
  const { count, error } = await supabase.from(tabla).select("id", { count: "exact", head: true });
  if (error) return `? (${error.message})`;
  return count ?? 0;
}

async function imprimirResumen() {
  log("\n── Resumen de la demo ─────────────────────────────────────────────");

  if (DRY_RUN) {
    log("  [dry-run] No se escribió nada en la base local.");
    log("  Ejecuta `npm run demo:reset` para crear la demo completa.");
    return;
  }

  const tablas = [
    "companies", "profiles", "user_roles", "obras", "terceros", "trabajadores",
    "insumos", "requisiciones", "cotizacion_solicitudes", "ordenes_compra", "almacen_semanas",
    "obra_estimaciones", "obra_nominas", "obra_destajos", "obra_subcontratos",
    "obra_rentas", "vales_gasolina", "caja_chica_reembolsos", "caja_chica_gastos",
    "obra_gastos_directos", "gastos_oficina", "obra_tareas", "notificaciones",
    "cuentas_por_pagar", "pagos", "asientos_contables",
  ];
  const conteos = await Promise.all(tablas.map((t) => contar(t)));
  log(`  Registros: ${tablas.map((t, i) => `${t}=${conteos[i]}`).join(" · ")}`);

  const { data: saldos } = await supabase
    .from("cuentas")
    .select("nombre, saldo_actual")
    .eq("company_id", ID.company)
    .order("nombre");

  log("\n  Saldos de tesorería:");
  for (const c of saldos ?? []) log(`   • ${c.nombre}: ${money(c.saldo_actual)}`);

  log("\n  Empresa: Constructora Naranja del Bajío, S.A. de C.V.");
  log("  Obras: Residencial Los Encinos — Torre A · Ampliación Nave Industrial Bajío");
  log("\n  Usuarios de demostración (contraseña: " + DEMO_PASSWORD + "):");
  for (const u of USERS) {
    log(`   • ${u.email.padEnd(26)} ${u.role.padEnd(15)} ${u.nombre}`);
  }

  log("\n  Rutas sugeridas:");
  log("   • /app                         Panel general y pendientes");
  log("   • /app/obras                   Listado de obras y avance");
  log(`   • /app/obras/${ID.obraA}       Dashboard de la Torre A`);
  log(`   • /app/obras/${ID.obraB}       Dashboard de la nave industrial`);
  log("   • /app/admin/pagos             CxP, pagos y caja chica por pagar");
  log("   • /app/notificaciones          Bandeja de notificaciones");
  log("\n  Para reiniciar la demo: npm run demo:reset");
  log("───────────────────────────────────────────────────────────────────\n");
}

// ---------------------------------------------------------------------------
// 18. Orquestación
// ---------------------------------------------------------------------------

async function verificarEmpresaExistente() {
  if (DRY_RUN) return false;
  const { data, error } = await supabase
    .from("companies")
    .select("id")
    .eq("id", ID.company)
    .maybeSingle();
  if (error) throw new Error(`No se pudo verificar la empresa demo: ${error.message}`);
  return !!data;
}

async function main() {
  const inicio = Date.now();
  log("╔══════════════════════════════════════════════════════════════════╗");
  log("║  Seed de demostración · ERP Naranja Forte (Supabase local)      ║");
  log("╚══════════════════════════════════════════════════════════════════╝");
  log(`  Base: ${SUPABASE_URL}`);
  log(`  Semana actual: ${CURRENT_WEEK} · calendario de 6 semanas${DRY_RUN ? " · DRY-RUN" : ""}`);

  if (RESET && !DRY_RUN) {
    resetLocalDatabase();
  }

  const existe = await verificarEmpresaExistente();
  if (existe && !RESET) {
    fail(
      "La empresa demo ya existe en esta base local. " +
        "Usa `npm run demo:reset` para reiniciar todos los datos de demostración.",
    );
  }

  await seedCompanyAndUsers();
  await seedCatalogos();
  const budgets = await seedPresupuestos();
  await seedCuentas();
  const recepciones = await seedRequisicionesCompras();
  await seedEstimaciones(budgets);
  await seedAlmacen(recepciones);
  await seedNominas();
  await seedDestajos();
  await seedSubcontratos();
  await seedRentas();
  await seedGasolinas();
  await seedCajaChica();
  await seedGastosObra();
  await seedGastosOficina();
  await seedTareas();
  await seedNotificaciones();
  await actualizarSaldosCuentas();

  await imprimirResumen();
  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
  log(`✔ Demo lista en ${segundos}s.\n`);
}

if (supabase) {
  main().catch((error) => {
    if (error instanceof SeedAbort) {
      console.error(`\n✖ ${error.message}\n`);
    } else {
      console.error("\n✖ El seed falló:");
      console.error(error?.stack ?? error?.message ?? error);
    }
    process.exitCode = 1;
  });
}

