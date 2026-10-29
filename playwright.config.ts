import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  outputDir: "docs/reportes/playwright-artifacts",
  reporter: [
    ["list"],
    ["json", { outputFile: "docs/reportes/playwright-results.json" }],
    ["html", { outputFolder: "docs/reportes/playwright-html", open: "never" }],
  ],
  use: {
    baseURL: BASE_URL,
    locale: "es-MX",
    timezoneId: "America/Mexico_City",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
  },
  projects: [
    {
      name: "desktop-edge",
      use: {
        ...devices["Desktop Chrome"],
        channel: "msedge",
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command: "node node_modules/next/dist/bin/next dev",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
