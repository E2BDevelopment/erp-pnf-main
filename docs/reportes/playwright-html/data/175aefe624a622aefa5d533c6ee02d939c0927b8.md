# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: public.spec.ts >> páginas públicas >> la landing renderiza la propuesta de valor y los CTAs
- Location: tests\e2e\public.spec.ts:5:3

# Error details

```
Error: Errores de consola:
WebSocket connection to 'ws://127.0.0.1:3000/_next/hmr?id=vs7IYRtqUrN2KtEERR5da' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "WebSocket connection to 'ws://127.0.0.1:3000/_next/hmr?id=vs7IYRtqUrN2KtEERR5da' failed: Error during WebSocket handshake: net::ERR_INVALID_HTTP_RESPONSE",
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - img "Logo ERP PNF" [ref=e6]
          - generic [ref=e7]: ERP PNF
        - generic [ref=e8]:
          - link "Iniciar sesión" [ref=e9] [cursor=pointer]:
            - /url: /login
          - link "Registrar empresa" [ref=e10] [cursor=pointer]:
            - /url: /onboarding
    - main [ref=e11]:
      - generic [ref=e12]:
        - paragraph [ref=e13]: ERP para empresas constructoras
        - heading "Tu obra, tu equipo y tus finanzas en un mismo lugar." [level=1] [ref=e14]
        - paragraph [ref=e15]: Centraliza estimaciones, requisiciones, nómina, destajos, tesorería y caja chica. Roles definidos para Director, Residente, Auxiliar, Administrativo y Supervisor.
        - generic [ref=e16]:
          - link "Registrar empresa" [ref=e17] [cursor=pointer]:
            - /url: /onboarding
          - link "Ya tengo cuenta" [ref=e18] [cursor=pointer]:
            - /url: /login
      - generic [ref=e19]:
        - heading "Capacidades del sistema" [level=2] [ref=e20]
        - generic [ref=e21]:
          - generic [ref=e22]:
            - heading "Gestión de obras" [level=3] [ref=e27]
            - paragraph [ref=e28]: Industrial, comercial, residencial, infraestructura, vivienda en serie y urbanización.
          - generic [ref=e29]:
            - heading "Perfiles y permisos" [level=3] [ref=e35]
            - paragraph [ref=e36]: Cinco perfiles operativos con accesos y vistos buenos diferenciados.
          - generic [ref=e37]:
            - heading "Finanzas en obra" [level=3] [ref=e41]
            - paragraph [ref=e42]: Caja chica, gasolinas, rentas, destajos, subcontratos y comisiones.
          - generic [ref=e43]:
            - heading "Estimaciones y órdenes" [level=3] [ref=e47]
            - paragraph [ref=e48]: Estimaciones y órdenes de cambio con flujo de aprobación.
          - generic [ref=e49]:
            - heading "Visto bueno del Supervisor" [level=3] [ref=e53]
            - paragraph [ref=e54]: Nada se paga ni se ejecuta sin el filtro del Supervisor.
          - generic [ref=e55]:
            - heading "Multi-empresa" [level=3] [ref=e60]
            - paragraph [ref=e61]: Cada empresa con su propio equipo, clientes y obras aisladas.
    - contentinfo [ref=e62]: © 2026 ERP PNF
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
> 21 |     expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
     |                                                                 ^ Error: Errores de consola:
  22 |   });
  23 | 
  24 |   test("el formulario de login es accesible y navegable", async ({ page }) => {
  25 |     await page.goto("/login");
  26 | 
  27 |     await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
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