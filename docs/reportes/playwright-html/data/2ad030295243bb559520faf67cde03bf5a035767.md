# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: public.spec.ts >> páginas públicas >> el formulario de login es accesible y navegable
- Location: tests\e2e\public.spec.ts:24:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Iniciar sesión' })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Iniciar sesión' }) with timeout 15000ms
  - waiting for getByRole('heading', { name: 'Iniciar sesión' })

```

```yaml
- main:
  - link "Volver al inicio":
    - /url: /
  - text: Iniciar sesión Accede a tu cuenta de ERP PNF. Correo electrónico
  - textbox "Correo electrónico"
  - text: Contraseña
  - textbox "Contraseña"
  - checkbox "Recuerda mi cuenta"
  - text: Recuerda mi cuenta
  - checkbox "Mantén mi sesión abierta" [checked]
  - text: Mantén mi sesión abierta
  - button "Ingresar"
  - paragraph:
    - text: ¿No tienes cuenta?
    - link "Registra tu empresa":
      - /url: /onboarding
- region "Notifications alt+T"
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | import { collectConsoleErrors } from "./helpers";
  3  | 
  4  | test.describe("páginas públicas", () => {
  5  |   test("la landing renderiza la propuesta de valor y los CTAs", async ({ page }) => {
  6  |     const errors = collectConsoleErrors(page);
  7  |     await page.goto("/");
  8  | 
  9  |     await expect(
  10 |       page.getByRole("heading", {
  11 |         level: 1,
  12 |         name: /Tu obra, tu equipo y tus finanzas en un mismo lugar/i,
  13 |       }),
  14 |     ).toBeVisible();
  15 |     await expect(page.getByRole("link", { name: "Iniciar sesión" })).toBeVisible();
  16 |     await expect(page.getByRole("link", { name: "Registrar empresa" }).first()).toBeVisible();
  17 |     await expect(
  18 |       page.getByRole("heading", { level: 2, name: "Capacidades del sistema" }),
  19 |     ).toHaveCount(1);
  20 | 
  21 |     expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  22 |   });
  23 | 
  24 |   test("el formulario de login es accesible y navegable", async ({ page }) => {
  25 |     await page.goto("/login");
  26 | 
> 27 |     await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
     |                                                                         ^ Error: expect(locator).toBeVisible() failed
  28 |     await expect(page.getByLabel("Correo electrónico", { exact: true })).toBeVisible();
  29 |     await expect(page.getByLabel("Contraseña", { exact: true })).toBeVisible();
  30 |     await expect(page.getByRole("button", { name: "Ingresar", exact: true })).toBeVisible();
  31 |     await expect(page.getByRole("link", { name: "Volver al inicio" })).toBeVisible();
  32 | 
  33 |     await page.getByRole("link", { name: "Volver al inicio" }).click();
  34 |     await expect(page).toHaveURL(/\/$/);
  35 |   });
  36 | 
  37 |   test("el onboarding muestra el paso 1 de registro de empresa", async ({ page }) => {
  38 |     await page.goto("/onboarding");
  39 | 
  40 |     await expect(page.getByText("Registrar empresa", { exact: true }).first()).toBeVisible();
  41 |     await expect(page.getByText(/Paso 1 de 2/)).toBeVisible();
  42 |     await expect(page.getByLabel("Razón social")).toBeVisible();
  43 |     await expect(page.getByLabel("RFC")).toBeVisible();
  44 |   });
  45 | 
  46 |   test("una ruta privada sin sesión redirige al login", async ({ page }) => {
  47 |     await page.goto("/app/dashboard");
  48 |     await page.waitForURL("**/login", { timeout: 30_000 });
  49 |     await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
  50 |   });
  51 | 
  52 |   test("una ruta inexistente responde 404", async ({ page }) => {
  53 |     const response = await page.goto("/ruta-que-no-existe");
  54 |     expect(response?.status()).toBe(404);
  55 |   });
  56 | });
  57 | 
```