#!/usr/bin/env node
/**
 * Converts the remaining TanStack Router route files into Next.js App Router
 * pages. Route definitions are stripped; the main component is exported as the
 * page default export.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();

const routes = [
  ["src/routes/index.tsx", "src/app/page.tsx", "Landing"],
  ["src/routes/login.tsx", "src/app/login/page.tsx", "LoginPage"],
  ["src/routes/onboarding.tsx", "src/app/onboarding/page.tsx", "Onboarding"],
  [
    "src/routes/_authenticated/app.obras.index.tsx",
    "src/app/(authenticated)/app/obras/page.tsx",
    "ObrasPage",
  ],
  [
    "src/routes/_authenticated/app.obras.nueva.tsx",
    "src/app/(authenticated)/app/obras/nueva/page.tsx",
    "NuevaObra",
  ],
  [
    "src/routes/_authenticated/app.obras.$obraId.index.tsx",
    "src/app/(authenticated)/app/obras/[obraId]/page.tsx",
    "ObraDashboard",
  ],
  [
    "src/routes/_authenticated/app.obras.$obraId.configuracion.tsx",
    "src/app/(authenticated)/app/obras/[obraId]/configuracion/page.tsx",
    "ConfiguracionObra",
  ],
  [
    "src/routes/_authenticated/app.obras.$obraId.requisiciones.tsx",
    "src/app/(authenticated)/app/obras/[obraId]/requisiciones/page.tsx",
    "RequisicionesPage",
  ],
  [
    "src/routes/_authenticated/app.admin.requisiciones.tsx",
    "src/app/(authenticated)/app/admin/requisiciones/page.tsx",
    "AdminRequisicionesPage",
  ],
];

function removeRouteBlock(source) {
  const marker = "export const Route = createFileRoute";
  const start = source.indexOf(marker);
  if (start === -1) return source;

  // Walk forward until the parentheses opened by createFileRoute(...)(...) close.
  let index = source.indexOf("(", start);
  let depth = 0;
  let seen = false;
  for (; index < source.length; index += 1) {
    const char = source[index];
    if (char === "(") {
      depth += 1;
      seen = true;
    } else if (char === ")") {
      depth -= 1;
      if (seen && depth === 0) break;
    }
  }
  // Consume trailing `;` and newlines.
  let end = index + 1;
  while (end < source.length && /[;\s]/.test(source[end])) end += 1;
  return source.slice(0, start) + source.slice(end);
}

function usedNames(source, candidates) {
  return candidates.filter((name) => new RegExp(`\\b${name}\\b`).test(source));
}

for (const [from, to, component] of routes) {
  let source = readFileSync(join(root, from), "utf8");

  // Drop the TanStack Router import and re-add only what the file uses.
  source = source.replace(/import\s+\{[^}]*\}\s+from\s+["']@tanstack\/react-router["'];?\r?\n?/g, "");
  source = removeRouteBlock(source);

  const routerNames = usedNames(source, ["Link", "useNavigate", "useParams", "useSearch", "useRouterState", "ClientOnly"]);
  if (routerNames.length > 0) {
    source = `import { ${routerNames.join(", ")} } from "@/lib/navigation";\n${source}`;
  }

  // Server functions.
  source = source.replace(
    /import\s+\{\s*useServerFn\s*\}\s+from\s+["']@tanstack\/react-start["'];?/g,
    'import { useServerFn } from "@/lib/server-fn/client";',
  );

  // API facades.
  source = source.replace(
    /from\s+["']@\/lib\/api\/([a-z0-9-]+)\.functions["']/g,
    'from "@/lib/api-client/$1.functions"',
  );

  // Route params.
  source = source.replace(/Route\.useParams\(\)/g, "useParams()");
  source = source.replace(/Route\.useSearch\(\)/g, "useSearch()");

  source = `"use client";\n\n${source.trimEnd()}\n\nexport default ${component};\n`;

  const destination = join(root, to);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, source, "utf8");
  console.log(`${from}  →  ${to}`);
}
