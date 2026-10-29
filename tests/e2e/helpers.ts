import { expect, type Page } from "@playwright/test";

export const DEMO_PASSWORD = "Demo1234!";
export const DEMO_USERS = {
  director: "director@demo.pnf",
  residente: "residente@demo.pnf",
  residente2: "residente2@demo.pnf",
  auxiliar: "auxiliar@demo.pnf",
  administrativo: "administrativo@demo.pnf",
  supervisor: "supervisor@demo.pnf",
} as const;

const IGNORED_CONSOLE = [
  /favicon/i,
  /React DevTools/i,
  /\[Fast Refresh\]/i,
  /Failed to load resource: the server responded with a status of 404/i,
];

/** Inicia sesión por la UI real y espera al dashboard. */
export async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico", { exact: true }).fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await page.waitForURL("**/app/dashboard", { timeout: 45_000 });
  await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();
}

/** Cierra la sesión desde el menú de cuenta y confirma el diálogo. */
export async function logout(page: Page) {
  await page.getByRole("button", { name: /Cuenta de/ }).click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cerrar sesión" }).click();
  await page.waitForURL("**/login", { timeout: 30_000 });
}

/** Recolecta errores de consola, ignorando ruido conocido de desarrollo. */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (IGNORED_CONSOLE.some((pattern) => pattern.test(text))) return;
    errors.push(text);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}
