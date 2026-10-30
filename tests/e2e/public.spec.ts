import { expect, test } from "@playwright/test";
import { collectConsoleErrors } from "./helpers";

test.describe("páginas públicas", () => {
  test("la landing renderiza la propuesta de valor y los CTAs", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Tu constructora\. Todos sus proyectos\. Un solo lugar\./i,
      }),
    ).toBeVisible();
    const banner = page.getByRole("banner");
    await expect(banner.getByRole("link", { name: "Iniciar sesión" })).toBeVisible();
    await expect(banner.getByRole("link", { name: "Crear cuenta", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("el formulario de login es accesible y navegable", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText("Iniciar sesión", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Correo electrónico", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Contraseña", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ingresar", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Volver al inicio" })).toBeVisible();

    await page.getByRole("link", { name: "Volver al inicio" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("el onboarding muestra el paso 1 de registro de empresa", async ({ page }) => {
    await page.goto("/onboarding");

    await expect(page.getByText("Registrar empresa", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Paso 1 de 2/)).toBeVisible();
    await expect(page.getByLabel("Razón social")).toBeVisible();
    await expect(page.getByLabel("RFC")).toBeVisible();
  });

  test("una ruta privada sin sesión redirige al login", async ({ page }) => {
    await page.goto("/app/dashboard");
    await page.waitForURL("**/login", { timeout: 30_000 });
    await expect(page.getByText("Iniciar sesión", { exact: true })).toBeVisible();
  });

  test("una ruta inexistente responde 404", async ({ page }) => {
    const response = await page.goto("/ruta-que-no-existe");
    expect(response?.status()).toBe(404);
  });
});
