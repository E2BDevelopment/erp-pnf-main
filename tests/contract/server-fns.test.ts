import { readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SRC = resolve(ROOT, "src");
const REGISTRY_PATH = resolve(SRC, "lib/server-fn/registry.server.ts");

type SourceFn = {
  moduleId: string;
  exportName: string;
  file: string;
  block: string;
};

function sourceFiles(): string[] {
  const apiDir = resolve(SRC, "lib/api");
  const files = readdirSync(apiDir)
    .filter((name) => name.endsWith(".functions.ts"))
    .map((name) => resolve(apiDir, name));

  files.push(
    resolve(SRC, "lib/dev-switch.functions.ts"),
    resolve(SRC, "lib/contabilidad/balance.functions.ts"),
  );
  return files;
}

function moduleIdFor(file: string): string {
  return relative(SRC, file)
    .replace(/\\/g, "/")
    .replace(/^lib\//, "")
    .replace(/\.ts$/, "");
}

function parseSourceFunctions(): SourceFn[] {
  const result: SourceFn[] = [];

  for (const file of sourceFiles()) {
    const content = readFileSync(file, "utf8");
    const declaration = /export const (\w+) = createServerFn/g;
    const matches = [...content.matchAll(declaration)];

    matches.forEach((match, index) => {
      const start = match.index ?? 0;
      const nextStart = matches[index + 1]?.index ?? content.length;
      result.push({
        moduleId: moduleIdFor(file),
        exportName: match[1],
        file: relative(ROOT, file).replace(/\\/g, "/"),
        block: content.slice(start, nextStart),
      });
    });
  }

  return result;
}

function parseRegistry(): string[] {
  const content = readFileSync(REGISTRY_PATH, "utf8");
  return [...content.matchAll(/^\s{2}"([^"]+)":/gm)].map((match) => match[1]);
}

function parseFacades(): Array<{ exportName: string; id: string; file: string }> {
  const dir = resolve(SRC, "lib/api-client");
  return readdirSync(dir)
    .filter((name) => name.endsWith(".functions.ts"))
    .flatMap((name) => {
      const file = relative(ROOT, resolve(dir, name)).replace(/\\/g, "/");
      const content = readFileSync(resolve(dir, name), "utf8");
      return [...content.matchAll(/export const (\w+) = clientFn<[^>]+>\("([^"]+)"\)/g)].map(
        (match) => ({ exportName: match[1], id: match[2], file }),
      );
    });
}

const sourceFns = parseSourceFunctions();
const registryIds = parseRegistry();
const facades = parseFacades();
const expectedIds = sourceFns.map((fn) => `${fn.moduleId}.${fn.exportName}`);

describe("contrato de server functions", () => {
  it("encuentra el inventario completo de implementaciones", () => {
    expect(sourceFns.length).toBeGreaterThan(250);
    expect(new Set(expectedIds).size).toBe(expectedIds.length);
  });

  it("el registro generado contiene exactamente las mismas funciones que el código fuente", () => {
    expect([...registryIds].sort()).toEqual([...expectedIds].sort());
  });

  it("cada fachada de api-client apunta a una función registrada", () => {
    expect(facades.length).toBe(sourceFns.length);
    for (const facade of facades) {
      expect(registryIds, `${facade.file} -> ${facade.exportName}`).toContain(facade.id);
    }
  });

  it("cada fachada conserva el nombre exportado por la implementación", () => {
    for (const facade of facades) {
      const target = sourceFns.find((fn) => `${fn.moduleId}.${fn.exportName}` === facade.id);
      expect(target, `Destino inexistente para ${facade.file}`).toBeDefined();
      expect(facade.exportName).toBe(target?.exportName);
    }
  });

  it("todas las funciones usan requireSupabaseAuth, salvo el ejemplo público", () => {
    const withoutAuth = sourceFns
      .filter((fn) => !fn.block.includes(".middleware([requireSupabaseAuth])"))
      .map((fn) => `${fn.moduleId}.${fn.exportName}`)
      .sort();

    expect(withoutAuth).toEqual(["api/example.functions.getGreeting"]);
  });

  it("todas las funciones registradas tienen handler", () => {
    const withoutHandler = sourceFns
      .filter((fn) => !fn.block.includes(".handler("))
      .map((fn) => `${fn.moduleId}.${fn.exportName}`);

    expect(withoutHandler).toEqual([]);
  });

  it("el RPC mapea autenticación a 401, Zod a 400 y el resto a 500", () => {
    const route = readFileSync(resolve(SRC, "app/api/rpc/[fn]/route.ts"), "utf8");
    expect(route).toContain("message.startsWith(\"Unauthorized\") ? 401");
    expect(route).toContain("error instanceof ZodError ? 400 : 500");
    expect(route).toContain("Server function no encontrada");
  });
});
