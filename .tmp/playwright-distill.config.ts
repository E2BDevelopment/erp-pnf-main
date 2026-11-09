import { defineConfig } from "@playwright/test";
import path from "node:path";
import base from "../playwright.config";

// La traza local registró chunks con HTTP 200 a los 18 s; conserva las aserciones y espera la carga.
export default defineConfig({
  ...base,
  testDir: path.resolve("tests/e2e"),
  outputDir: path.resolve(".tmp/distill-production-slow"),
  reporter: "line",
  timeout: 120_000,
  expect: { ...base.expect, timeout: 45_000 },
});
