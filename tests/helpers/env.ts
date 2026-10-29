import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Carga .env.local / .env sin depender de dotenv.
 * Vitest no inyecta estas variables en process.env por sí solo.
 */
export function loadTestEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;

    for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) continue;

      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;

      let value = rawValue.trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}. Revisa .env.local.`);
  return value;
}

export const DEMO_PASSWORD = "Demo1234!";
export const DEMO_USERS = {
  director: "director@demo.pnf",
  residente: "residente@demo.pnf",
  residente2: "residente2@demo.pnf",
  auxiliar: "auxiliar@demo.pnf",
  administrativo: "administrativo@demo.pnf",
  supervisor: "supervisor@demo.pnf",
} as const;

export const DEMO_OBRAS = {
  ampliacion: "03f8c174-6bfc-5e77-802f-65470a4a1d1d",
  residencial: "4d616d86-3c6f-5c35-bfa0-b91333ad9796",
} as const;
