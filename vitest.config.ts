import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: [
      "tests/unit/**/*.test.ts",
      "tests/contract/**/*.test.ts",
      "tests/integration/**/*.test.ts",
      "tests/security/**/*.test.ts",
    ],
    reporters: ["default", "json"],
    outputFile: { json: "docs/reportes/vitest-results.json" },
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "docs/reportes/coverage",
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/api/**", "src/lib/api-client/**", "src/lib/server-fn/**"],
    },
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
