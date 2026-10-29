#!/usr/bin/env node
/**
 * Asegura que el daemon de Docker esté disponible antes de arrancar Supabase.
 *
 * En Windows, si Docker Desktop está instalado pero no corriendo, lo inicia y
 * espera a que el motor responda. En macOS/Linux solo comprueba el daemon.
 *
 * Uso:
 *   node scripts/ensure-docker.mjs
 */

import { execFileSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const TIMEOUT_MS = 180_000;
const POLL_MS = 3_000;

function dockerReady() {
  try {
    execFileSync("docker", ["info", "--format", "{{.ServerVersion}}"], {
      stdio: "ignore",
      timeout: 15_000,
    });
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dockerDesktopPath() {
  const candidates = [
    process.env.LOCALAPPDATA &&
      path.join(process.env.LOCALAPPDATA, "Programs", "DockerDesktop", "Docker Desktop.exe"),
    "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe",
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate));
}

async function main() {
  if (dockerReady()) {
    console.log("✔ Docker está corriendo.");
    return;
  }

  if (process.platform !== "win32") {
    console.error("✖ Docker no está corriendo. Inícialo y vuelve a ejecutar el comando.");
    process.exit(1);
  }

  const desktop = dockerDesktopPath();
  if (!desktop) {
    console.error(
      "✖ Docker no está corriendo y no se encontró Docker Desktop. " +
        "Ábrelo manualmente y vuelve a ejecutar el comando.",
    );
    process.exit(1);
  }

  console.log("→ Docker Desktop no está corriendo; iniciándolo…");
  spawn(desktop, [], { detached: true, stdio: "ignore" }).unref();

  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_MS);
    if (dockerReady()) {
      console.log("✔ Docker listo.");
      return;
    }
  }

  console.error(
    "✖ Docker Desktop no respondió en 3 minutos. " +
      "Ábrelo manualmente, espera a que termine de iniciar y vuelve a ejecutar el comando.",
  );
  process.exit(1);
}

await main();
