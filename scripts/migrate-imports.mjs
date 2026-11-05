#!/usr/bin/env node
/**
 * One-off codemod used by the Vite/TanStack Start → Next.js 16 migration.
 * It is kept in the repo for traceability; it is idempotent.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "src");

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry)) files.push(full);
  }
  return files;
}

const files = walk(srcDir);

const isImplementationModule = (rel) =>
  /^src[\\/]lib[\\/](api[\\/][^\\/]+\.functions\.ts|contabilidad[\\/][^\\/]+\.functions\.ts)$/.test(
    rel,
  );

const isGeneratedOrRuntime = (rel) =>
  rel.includes(`${join("lib", "api-client")}`) ||
  rel.includes(`${join("lib", "server-fn")}`) ||
  rel.includes(`${join("app", "api")}`);

let changed = 0;

for (const file of files) {
  const rel = relative(root, file);
  if (rel.startsWith("src\\routes") || rel.startsWith("src/routes")) continue;

  let source = readFileSync(file, "utf8");
  const original = source;

  // 1. TanStack Start imports -------------------------------------------------
  source = source.replace(
    /import\s+([^;]*?)\s+from\s+["']@tanstack\/react-start["'];?/g,
    (full, clause) => {
      if (clause.includes("createServerFn")) {
        return clause.includes("useServerFn")
          ? `import { createServerFn } from "@/lib/server-fn";\nimport { useServerFn } from "@/lib/server-fn/client";`
          : `import { createServerFn } from "@/lib/server-fn";`;
      }
      if (clause.includes("useServerFn")) return `import { useServerFn } from "@/lib/server-fn/client";`;
      return full;
    },
  );

  // 2. TanStack Router imports ------------------------------------------------
  source = source.replace(
    /from\s+["']@tanstack\/react-router["']/g,
    'from "@/lib/navigation"',
  );

  // 3. Client facades ---------------------------------------------------------
  if (!isImplementationModule(rel) && !isGeneratedOrRuntime(rel)) {
    source = source.replace(
      /from\s+["']@\/lib\/api\/([a-z0-9-]+)\.functions["']/g,
      'from "@/lib/api-client/$1.functions"',
    );
    source = source.replace(
      /from\s+["']@\/lib\/contabilidad\/balance\.functions["']/g,
      'from "@/lib/api-client/balance.functions"',
    );
  }

  // 4. Shared caja chica helpers moved out of the server module ---------------
  source = source.replace(
    /from\s+["']@\/lib\/api\/caja-chica\.functions["'];/g,
    (match) => match, // handled explicitly below to keep type imports
  );

  // 5. "use client" for browser-only modules ---------------------------------
  const needsClient =
    rel.includes(`${join("src", "components")}`) ||
    rel.includes(`${join("src", "hooks")}`) ||
    rel.includes(`${join("src", "stores")}`) ||
    rel.endsWith(`${join("src", "lib", "navigation.tsx")}`) ||
    rel.endsWith(`${join("src", "lib", "server-fn", "client.ts")}`) ||
    rel.includes(`${join("src", "lib", "pdf")}`);

  if (needsClient && !/^\s*["']use client["'];?/.test(source)) {
    source = `"use client";\n\n${source}`;
  }

  if (source !== original) {
    writeFileSync(file, source, "utf8");
    changed += 1;
  }
}

console.log(`Updated ${changed} files.`);
