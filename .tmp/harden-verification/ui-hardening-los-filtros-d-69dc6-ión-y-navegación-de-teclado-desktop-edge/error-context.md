# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-hardening.spec.ts >> los filtros de clientes tienen selección y navegación de teclado
- Location: tests\e2e\ui-hardening.spec.ts:52:1

# Error details

```
Error: expect(locator).toBeChecked() failed

Locator: getByRole('group', { name: 'Filtrar clientes por autorización' }).getByRole('radio', { name: 'Todos', exact: true })
Expected: checked
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeChecked" getByRole('group', { name: 'Filtrar clientes por autorización' }).getByRole('radio', { name: 'Todos', exact: true }) with timeout 15000ms
  - waiting for getByRole('group', { name: 'Filtrar clientes por autorización' }).getByRole('radio', { name: 'Todos', exact: true })

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
    - link "Requisiciones 10 pendientes":
      - /url: /app/admin/requisiciones
    - link "Almacén central":
      - /url: /app/admin/almacen-central
    - paragraph: Dinero
    - link "Cuentas por pagar 13 pendientes":
      - /url: /app/admin/cuentas-por-pagar
    - link "Tesorería":
      - /url: /app/admin/tesoreria
    - link "Contabilidad":
      - /url: /app/admin/contabilidad
    - link "Condensado semanal":
      - /url: /app/admin/condensado-semanal
    - paragraph: Obra
    - link "Nómina 2 pendientes":
      - /url: /app/admin/nomina
    - link "Destajos":
      - /url: /app/admin/destajos
    - link "Subcontratos":
      - /url: /app/admin/subcontratos
    - link "Rentas 1 pendiente":
      - /url: /app/admin/rentas
    - link "Gasolinas 3 pendientes":
      - /url: /app/admin/gasolinas
    - paragraph: Operación
    - link "Caja chica 2 pendientes":
      - /url: /app/admin/caja-chica
    - link "Gastos de oficina 3 pendientes":
      - /url: /app/admin/gastos-oficina
    - link "Tareas":
      - /url: /app/admin/tareas
- banner:
  - link "ERP PNF":
    - /url: /app/dashboard
  - button "Notificaciones, ninguna sin leer"
  - button "Cuenta de RN Ricardo Naranja Salazar"
- main:
  - heading "Catálogos" [level=1]
  - paragraph: Información maestra que se reutiliza en obras, compras y nómina.
  - link "Clientes":
    - /url: /app/catalogos/clientes
  - link "Insumos":
    - /url: /app/catalogos/insumos
  - link "Trabajadores":
    - /url: /app/catalogos/trabajadores
  - link "Proveedores/Contratistas":
    - /url: /app/catalogos/proveedores
  - heading "Clientes" [level=2]
  - paragraph: Empresas y personas a las que facturas tus obras.
  - radiogroup "Filtrar clientes por autorización":
    - radio "Todos" [checked]
    - radio "Pendientes"
  - button "Nuevo cliente"
  - textbox "Buscar clientes por nombre o RFC":
    - /placeholder: Buscar por nombre o RFC…
  - combobox "Tipo de persona": Todos los tipos
  - table:
    - rowgroup:
      - row "Nombre RFC Tipo Teléfono Correo Alertas Estatus Acciones":
        - columnheader "Nombre"
        - columnheader "RFC"
        - columnheader "Tipo"
        - columnheader "Teléfono"
        - columnheader "Correo"
        - columnheader "Alertas"
        - columnheader "Estatus"
        - columnheader "Acciones"
    - rowgroup:
      - row "Desarrollos Punta Norte, S.A. de C.V. DPN190228Q71 Moral 322 225 6700 contacto@punta-norte.mx — Autorizado Más acciones del cliente":
        - cell "Desarrollos Punta Norte, S.A. de C.V."
        - cell "DPN190228Q71"
        - cell "Moral"
        - cell "322 225 6700"
        - cell "contacto@punta-norte.mx"
        - cell "—"
        - cell "Autorizado"
        - cell "Más acciones del cliente":
          - button "Más acciones del cliente"
      - row "Inmobiliaria Los Encinos, S.A. de C.V. ILE150422H23 Moral 33 3615 8800 proyectos@loseninos.mx — Autorizado Más acciones del cliente":
        - cell "Inmobiliaria Los Encinos, S.A. de C.V."
        - cell "ILE150422H23"
        - cell "Moral"
        - cell "33 3615 8800"
        - cell "proyectos@loseninos.mx"
        - cell "—"
        - cell "Autorizado"
        - cell "Más acciones del cliente":
          - button "Más acciones del cliente"
      - row "Logística Integral Bajío, S. de R.L. de C.V. LIB180915K45 Moral 477 712 3400 compras@logisticabajio.mx — Autorizado Más acciones del cliente":
        - cell "Logística Integral Bajío, S. de R.L. de C.V."
        - cell "LIB180915K45"
        - cell "Moral"
        - cell "477 712 3400"
        - cell "compras@logisticabajio.mx"
        - cell "—"
        - cell "Autorizado"
        - cell "Más acciones del cliente":
          - button "Más acciones del cliente"
- region "Notifications alt+T"
- alert: Clientes · ERP PNF
```

# Test source

```ts
  1  | import AxeBuilder from "@axe-core/playwright";
  2  | import { expect, test } from "@playwright/test";
  3  | import { DEMO_USERS, login } from "./helpers";
  4  | 
  5  | test("las gráficas conservan sus colores bajo CSP y navegación cliente", async ({ page }) => {
  6  |   await login(page, DEMO_USERS.director);
  7  |   const comprobarSeries = async () => {
  8  |     const chart = page.locator("[data-chart]");
  9  |     await expect(chart.locator(".recharts-bar-rectangle path").first()).toBeVisible();
  10 |     await expect
  11 |       .poll(() =>
  12 |         chart
  13 |           .locator("style")
  14 |           .evaluate((el) => el instanceof HTMLStyleElement && Boolean(el.nonce && el.sheet)),
  15 |       )
  16 |       .toBe(true);
  17 |     for (const [serie, token] of [
  18 |       ["produccion", "--color-primary"],
  19 |       ["gasto", "--color-destructive"],
  20 |     ]) {
  21 |       const path = chart.locator(`path[fill="var(--color-${serie})"]`).first();
  22 |       await expect
  23 |         .poll(() =>
  24 |           path.evaluate((el, name) => {
  25 |             const style = getComputedStyle(el);
  26 |             return { fill: style.fill, variable: style.getPropertyValue(`--color-${name}`).trim() };
  27 |           }, serie),
  28 |         )
  29 |         .toEqual({
  30 |           fill: serie === "produccion" ? "rgb(244, 119, 33)" : "rgb(220, 38, 38)",
  31 |           variable: await chart.evaluate(
  32 |             (el, name) => getComputedStyle(el).getPropertyValue(name).trim(),
  33 |             token,
  34 |           ),
  35 |         });
  36 |     }
  37 |   };
  38 |   await comprobarSeries();
  39 |   await page.reload();
  40 |   await comprobarSeries();
  41 |   await page
  42 |     .getByRole("navigation", { name: "Navegación principal", exact: true })
  43 |     .getByRole("link", { name: "Obras", exact: true })
  44 |     .click();
  45 |   await page
  46 |     .getByRole("navigation", { name: "Navegación principal", exact: true })
  47 |     .getByRole("link", { name: "Dashboard", exact: true })
  48 |     .click();
  49 |   await comprobarSeries();
  50 | });
  51 | 
  52 | test("facturación y alta de equipo tienen etiquetas accesibles", async ({ page }) => {
  53 |   await login(page, DEMO_USERS.director);
  54 |   await page.goto("/app/configuracion");
  55 |   await expect(page.getByLabel("RFC *", { exact: true })).toHaveValue(/.+/);
  56 |   await expect(page.getByRole("combobox", { name: "Régimen fiscal", exact: true })).toBeVisible();
> 57 |   const results = await new AxeBuilder({ page }).withRules(["label", "button-name"]).analyze();
     |                       ^ Error: expect(locator).toBeChecked() failed
  58 |   expect(results.violations).toEqual([]);
  59 |   await page.goto("/app/equipo");
  60 |   await page.getByRole("button", { name: "Crear usuario", exact: true }).click();
  61 |   const dialog = page.getByRole("dialog");
  62 |   await expect(dialog.getByLabel("Nombre completo", { exact: true })).toBeFocused();
  63 |   await expect(dialog.getByLabel("Email", { exact: true })).toBeVisible();
  64 |   await expect(dialog.getByRole("combobox", { name: "Rol", exact: true })).toBeVisible();
  65 |   const fields = await new AxeBuilder({ page }).withRules(["label", "button-name"]).analyze();
  66 |   expect(fields.violations).toEqual([]);
  67 |   await page.keyboard.press("Escape");
  68 |   await expect(dialog).not.toBeVisible();
  69 |   await expect(page.getByRole("button", { name: "Crear usuario", exact: true })).toBeFocused();
  70 | });
  71 | 
  72 | test("los filtros de clientes tienen selección y navegación de teclado", async ({ page }) => {
  73 |   await login(page, DEMO_USERS.director);
  74 |   await page.goto("/app/catalogos");
  75 |   const group = page.getByRole("group", { name: "Filtrar clientes por autorización" });
  76 |   const todos = group.getByRole("radio", { name: "Todos", exact: true });
  77 |   await expect(todos).toBeChecked();
  78 |   await todos.focus();
  79 |   await page.keyboard.press("ArrowRight");
  80 |   const pendientes = group.getByRole("radio", { name: /Pendientes/ });
  81 |   await page.keyboard.press("Space");
  82 |   await expect(pendientes).toBeChecked();
  83 |   await page.keyboard.press("ArrowLeft");
  84 |   await page.keyboard.press("Space");
  85 |   await expect(todos).toBeChecked();
  86 |   const results = await new AxeBuilder({ page })
  87 |     .withRules(["aria-valid-attr-value", "button-name"])
  88 |     .analyze();
  89 |   expect(results.violations).toEqual([]);
  90 | });
  91 | 
```