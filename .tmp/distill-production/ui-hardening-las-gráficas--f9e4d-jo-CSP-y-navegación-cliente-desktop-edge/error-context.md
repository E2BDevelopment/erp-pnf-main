# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-hardening.spec.ts >> las gráficas conservan sus colores bajo CSP y navegación cliente
- Location: tests\e2e\ui-hardening.spec.ts:5:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Dashboard', level: 1 })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Dashboard', level: 1 }) with timeout 15000ms
  - waiting for getByRole('heading', { name: 'Dashboard', level: 1 })

```

```yaml
- link "Saltar al contenido":
  - /url: "#contenido"
- complementary:
  - img "Logo ERP PNF"
  - paragraph: ERP PNF
  - paragraph: Constructora Naranja del Bajío, S.A. de C.V.
  - searchbox "Buscar módulo"
  - navigation "Navegación principal":
    - paragraph: Corporativo
    - link "Dashboard":
      - /url: /app/dashboard
    - link "Obras":
      - /url: /app/obras
    - link "Catálogos":
      - /url: /app/catalogos
    - link "Nueva obra":
      - /url: /app/obras/nueva
    - link "Configuración":
      - /url: /app/configuracion
    - link "Auditoría":
      - /url: /app/auditoria
    - paragraph: Compras
    - link "Requisiciones":
      - /url: /app/admin/requisiciones
    - link "Almacén central":
      - /url: /app/admin/almacen-central
    - paragraph: Dinero
    - link "Cuentas por pagar":
      - /url: /app/admin/cuentas-por-pagar
    - link "Tesorería":
      - /url: /app/admin/tesoreria
    - link "Contabilidad":
      - /url: /app/admin/contabilidad
    - link "Condensado semanal":
      - /url: /app/admin/condensado-semanal
    - paragraph: Obra
    - link "Nómina":
      - /url: /app/admin/nomina
    - link "Destajos":
      - /url: /app/admin/destajos
    - link "Subcontratos":
      - /url: /app/admin/subcontratos
    - link "Rentas":
      - /url: /app/admin/rentas
    - link "Gasolinas":
      - /url: /app/admin/gasolinas
    - paragraph: Operación
    - link "Caja chica":
      - /url: /app/admin/caja-chica
    - link "Gastos de oficina":
      - /url: /app/admin/gastos-oficina
    - link "Tareas":
      - /url: /app/admin/tareas
- banner:
  - link "ERP PNF":
    - /url: /app/dashboard
  - button "Notificaciones, 1 sin leer": "1"
  - button "Cuenta de RN Ricardo Naranja Salazar"
- main:
  - status: Cargando la sección…
- region "Notifications alt+T"
- alert: Dashboard · ERP PNF
```

# Test source

```ts
  1  | import { expect, type Page } from "@playwright/test";
  2  | 
  3  | export const DEMO_PASSWORD = "Demo1234!";
  4  | export const DEMO_USERS = {
  5  |   director: "director@demo.pnf",
  6  |   residente: "residente@demo.pnf",
  7  |   residente2: "residente2@demo.pnf",
  8  |   auxiliar: "auxiliar@demo.pnf",
  9  |   administrativo: "administrativo@demo.pnf",
  10 |   supervisor: "supervisor@demo.pnf",
  11 | } as const;
  12 | 
  13 | const IGNORED_CONSOLE = [
  14 |   /favicon/i,
  15 |   /React DevTools/i,
  16 |   /\[Fast Refresh\]/i,
  17 |   /Failed to load resource: the server responded with a status of 404/i,
  18 |   /WebSocket connection to .*\/_next\/hmr/i,
  19 | ];
  20 | 
  21 | /** Inicia sesión por la UI real y espera al dashboard. */
  22 | export async function login(page: Page, email: string) {
  23 |   await page.goto("/login");
  24 |   await page.getByLabel("Correo electrónico", { exact: true }).fill(email);
  25 |   await page.getByLabel("Contraseña", { exact: true }).fill(DEMO_PASSWORD);
  26 |   await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  27 |   await page.waitForURL("**/app/dashboard", { timeout: 45_000 });
> 28 |   await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();
     |                                                                            ^ Error: expect(locator).toBeVisible() failed
  29 | }
  30 | 
  31 | /** Cierra la sesión desde el menú de cuenta y confirma el diálogo. */
  32 | export async function logout(page: Page) {
  33 |   await page.getByRole("button", { name: /Cuenta de/ }).click();
  34 |   await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  35 |   const dialog = page.getByRole("alertdialog");
  36 |   await expect(dialog).toBeVisible();
  37 |   await dialog.getByRole("button", { name: "Cerrar sesión" }).click();
  38 |   await page.waitForURL("**/login", { timeout: 30_000 });
  39 | }
  40 | 
  41 | /** Recolecta errores de consola, ignorando ruido conocido de desarrollo. */
  42 | export function collectConsoleErrors(page: Page): string[] {
  43 |   const errors: string[] = [];
  44 |   page.on("console", (message) => {
  45 |     if (message.type() !== "error") return;
  46 |     const text = message.text();
  47 |     if (IGNORED_CONSOLE.some((pattern) => pattern.test(text))) return;
  48 |     errors.push(text);
  49 |   });
  50 |   page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  51 |   return errors;
  52 | }
  53 | 
```