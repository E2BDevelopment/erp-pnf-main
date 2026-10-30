import { expect, test } from "@playwright/test";
import { DEMO_USERS, login, logout } from "./helpers";

test.describe("autenticación y navegación por rol", () => {
  test("credenciales inválidas muestran un error y no navegan", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico", { exact: true }).fill("nadie@demo.pnf");
    await page.getByLabel("Contraseña", { exact: true }).fill("ContraseñaIncorrecta1!");
    await page.getByRole("button", { name: "Ingresar", exact: true }).click();

    await expect(page.locator("[data-sonner-toast]").first()).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("el director entra, ve ambas obras y su configuración", async ({ page }) => {
    await login(page, DEMO_USERS.director);

    await expect(page.getByRole("link", { name: "Configuración", exact: true })).toBeVisible();

    await page.goto("/app/obras");
    await expect(page.getByRole("heading", { name: "Obras", level: 1 })).toBeVisible();
    await expect(page.getByText("Residencial Los Encinos — Torre A")).toBeVisible();
    await expect(page.getByText("Ampliación Nave Industrial Bajío")).toBeVisible();
    await expect(
      page.locator("#contenido").getByRole("link", { name: "Nueva obra", exact: true }),
    ).toBeVisible();
  });

  test("el residente solo ve su obra y no ve configuración de empresa", async ({ page }) => {
    await login(page, DEMO_USERS.residente);

    await expect(page.getByRole("link", { name: "Configuración", exact: true })).toHaveCount(0);

    await page.goto("/app/obras");
    await expect(page.getByRole("heading", { name: "Obras", level: 1 })).toBeVisible();
    await expect(page.getByText("Residencial Los Encinos — Torre A")).toBeVisible();
    await expect(page.getByText("Ampliación Nave Industrial Bajío")).toHaveCount(0);
  });

  test("el residente recibe 'Sin acceso' en contabilidad", async ({ page }) => {
    await login(page, DEMO_USERS.residente);
    await page.goto("/app/admin/contabilidad");

    await expect(page.getByText("Sin acceso", { exact: true })).toBeVisible();
    await expect(page.getByText(/no tiene permiso para ver contabilidad/i)).toBeVisible();
  });

  test("el director sí entra a contabilidad", async ({ page }) => {
    await login(page, DEMO_USERS.director);
    await page.goto("/app/admin/contabilidad");

    await expect(page.getByRole("heading", { name: "Contabilidad", level: 1 })).toBeVisible();
    await expect(page.getByText("Sin acceso", { exact: true })).toHaveCount(0);
  });

  test("cerrar sesión vuelve al login y bloquea rutas privadas", async ({ page }) => {
    await login(page, DEMO_USERS.director);
    await logout(page);

    await expect(page.getByText("Iniciar sesión", { exact: true })).toBeVisible();
    await page.goto("/app/dashboard");
    await page.waitForURL("**/login", { timeout: 30_000 });
  });
});
