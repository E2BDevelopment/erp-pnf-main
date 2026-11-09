# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-hardening.spec.ts >> los filtros de clientes tienen selección y navegación de teclado
- Location: tests\e2e\ui-hardening.spec.ts:79:1

# Error details

```
Error: expect(locator).toBeChecked() failed

Locator: getByRole('radiogroup', { name: 'Filtrar clientes por autorización' }).getByRole('radio', { name: 'Todos', exact: true })
Expected: checked
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeChecked" getByRole('radiogroup', { name: 'Filtrar clientes por autorización' }).getByRole('radio', { name: 'Todos', exact: true }) with timeout 15000ms
  - waiting for getByRole('radiogroup', { name: 'Filtrar clientes por autorización' }).getByRole('radio', { name: 'Todos', exact: true })

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
    - link "Requisiciones 11 pendientes":
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
  - button "Notificaciones, 1 sin leer": "1"
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
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  1   | import AxeBuilder from "@axe-core/playwright";
  2   | import { expect, test } from "@playwright/test";
  3   | import { DEMO_USERS, login } from "./helpers";
  4   | 
  5   | test("las gráficas conservan sus colores bajo CSP y navegación cliente", async ({ page }) => {
  6   |   await login(page, DEMO_USERS.director);
  7   |   const comprobarSeries = async () => {
  8   |     const chart = page.locator("[data-chart]");
  9   |     await expect(chart.locator(".recharts-bar-rectangle path").first()).toBeVisible();
  10  |     await expect
  11  |       .poll(() =>
  12  |         chart
  13  |           .locator("style")
  14  |           .evaluate((el) => el instanceof HTMLStyleElement && Boolean(el.nonce && el.sheet)),
  15  |       )
  16  |       .toBe(true);
  17  |     for (const [serie, token] of [
  18  |       ["produccion", "--color-primary"],
  19  |       ["gasto", "--color-destructive"],
  20  |     ]) {
  21  |       const path = chart.locator(`path[fill="var(--color-${serie})"]`).first();
  22  |       await expect
  23  |         .poll(() =>
  24  |           path.evaluate((el, name) => {
  25  |             const style = getComputedStyle(el);
  26  |             return { fill: style.fill, variable: style.getPropertyValue(`--color-${name}`).trim() };
  27  |           }, serie),
  28  |         )
  29  |         .toEqual({
  30  |           fill: serie === "produccion" ? "rgb(244, 119, 33)" : "rgb(220, 38, 38)",
  31  |           variable: await chart.evaluate(
  32  |             (el, name) => getComputedStyle(el).getPropertyValue(name).trim(),
  33  |             token,
  34  |           ),
  35  |         });
  36  |     }
  37  |   };
  38  |   await comprobarSeries();
  39  |   await page.reload();
  40  |   await comprobarSeries();
  41  |   await page
  42  |     .getByRole("navigation", { name: "Navegación principal", exact: true })
  43  |     .getByRole("link", { name: "Obras", exact: true })
  44  |     .click();
  45  |   await page
  46  |     .getByRole("navigation", { name: "Navegación principal", exact: true })
  47  |     .getByRole("link", { name: "Dashboard", exact: true })
  48  |     .click();
  49  |   await comprobarSeries();
  50  | });
  51  | 
  52  | test("facturación y alta de equipo tienen etiquetas accesibles", async ({ page }) => {
  53  |   await login(page, DEMO_USERS.director);
  54  |   await page.setViewportSize({ width: 360, height: 900 });
  55  |   await page.emulateMedia({ reducedMotion: "reduce" });
  56  |   await page.goto("/app/configuracion");
  57  |   await expect(page.getByLabel("RFC *", { exact: true })).toHaveValue(/.+/);
  58  |   await expect(page.getByRole("combobox", { name: "Régimen fiscal", exact: true })).toBeVisible();
  59  |   const results = await new AxeBuilder({ page }).withRules(["label", "button-name"]).analyze();
  60  |   expect(results.violations).toEqual([]);
  61  |   await page.goto("/app/equipo");
  62  |   await page.getByRole("button", { name: "Crear usuario", exact: true }).click();
  63  |   const dialog = page.getByRole("dialog");
  64  |   await expect(dialog.getByLabel("Nombre completo", { exact: true })).toBeFocused();
  65  |   await expect(dialog.getByLabel("Email", { exact: true })).toBeVisible();
  66  |   await expect(dialog.getByRole("combobox", { name: "Rol", exact: true })).toBeVisible();
  67  |   await expect(dialog).toHaveCSS("animation-name", "none");
  68  |   const close = dialog.getByRole("button", { name: "Cerrar", exact: true });
  69  |   const box = await close.boundingBox();
  70  |   expect(box?.width).toBeGreaterThanOrEqual(44);
  71  |   expect(box?.height).toBeGreaterThanOrEqual(44);
  72  |   const fields = await new AxeBuilder({ page }).withRules(["label", "button-name"]).analyze();
  73  |   expect(fields.violations).toEqual([]);
  74  |   await page.keyboard.press("Escape");
  75  |   await expect(dialog).not.toBeVisible();
  76  |   await expect(page.getByRole("button", { name: "Crear usuario", exact: true })).toBeFocused();
  77  | });
  78  | 
  79  | test("los filtros de clientes tienen selección y navegación de teclado", async ({ page }) => {
  80  |   await login(page, DEMO_USERS.director);
  81  |   await page.goto("/app/catalogos");
  82  |   const group = page.getByRole("radiogroup", { name: "Filtrar clientes por autorización" });
  83  |   const todos = group.getByRole("radio", { name: "Todos", exact: true });
> 84  |   await expect(todos).toBeChecked();
      |                       ^ Error: expect(locator).toBeChecked() failed
  85  |   await todos.focus();
  86  |   await page.keyboard.press("ArrowRight");
  87  |   const pendientes = group.getByRole("radio", { name: /Pendientes/ });
  88  |   await expect(pendientes).toBeFocused();
  89  |   await page.keyboard.press("Space");
  90  |   await expect(pendientes).toBeChecked();
  91  |   await page.keyboard.press("ArrowLeft");
  92  |   await expect(todos).toBeFocused();
  93  |   await page.keyboard.press("Space");
  94  |   await expect(todos).toBeChecked();
  95  |   const results = await new AxeBuilder({ page })
  96  |     .withRules(["aria-valid-attr-value", "button-name"])
  97  |     .analyze();
  98  |   expect(results.violations).toEqual([]);
  99  | });
  100 | 
  101 | test("la carga respeta cambios de movimiento reducido sin perder su estado", async ({ page }) => {
  102 |   await login(page, DEMO_USERS.director);
  103 |   await page.emulateMedia({ reducedMotion: "reduce" });
  104 |   let release!: () => void;
  105 |   const pending = new Promise<void>((resolve) => {
  106 |     release = resolve;
  107 |   });
  108 |   await page.route("**/api/rpc/**", async (route) => {
  109 |     if (decodeURIComponent(route.request().url()).endsWith("auth.functions.getSessionContext")) {
  110 |       await pending;
  111 |     }
  112 |     await route.continue();
  113 |   });
  114 |   try {
  115 |     await page.reload({ waitUntil: "domcontentloaded" });
  116 |     const loading = page.getByRole("status", { name: "Cargando información", exact: true });
  117 |     await expect(loading.getByText("Cargando información…")).toBeVisible();
  118 |     await expect(loading.locator("svg")).toHaveCount(0);
  119 |     await page.emulateMedia({ reducedMotion: "no-preference" });
  120 |     await expect(loading.locator("svg")).toBeVisible();
  121 |     await page.emulateMedia({ reducedMotion: "reduce" });
  122 |     await expect(loading.locator("svg")).toHaveCount(0);
  123 |     await expect(loading.getByText("Cargando información…")).toBeVisible();
  124 |     release();
  125 |     await expect(loading).not.toBeVisible();
  126 |   } finally {
  127 |     release();
  128 |   }
  129 | });
  130 | 
  131 | test("el menú y la ficha del trabajador funcionan por teclado sin acciones anidadas", async ({
  132 |   page,
  133 | }) => {
  134 |   await login(page, DEMO_USERS.director);
  135 |   await page.goto("/app/catalogos/trabajadores");
  136 |   const menuButton = page
  137 |     .getByRole("button", { name: "Más acciones del trabajador", exact: true })
  138 |     .first();
  139 |   await menuButton.focus();
  140 |   await page.keyboard.press("Space");
  141 |   await expect(page.getByRole("menu")).toBeVisible();
  142 |   await expect(page.getByRole("dialog")).not.toBeVisible();
  143 |   await page.keyboard.press("Escape");
  144 |   await expect(menuButton).toBeFocused();
  145 |   const row = page.locator("main ul > li").first();
  146 |   const open = row.getByRole("button").first();
  147 |   await open.focus();
  148 |   await page.keyboard.press("Enter");
  149 |   await expect(page.getByRole("dialog")).toBeVisible();
  150 |   await page.keyboard.press("Escape");
  151 |   await expect(open).toBeFocused();
  152 |   const result = await new AxeBuilder({ page }).withRules(["list", "nested-interactive"]).analyze();
  153 |   expect(result.violations).toEqual([]);
  154 | });
  155 | 
  156 | test("logo y edición de unidad de negocio tienen un nombre accesible", async ({ page }) => {
  157 |   await login(page, DEMO_USERS.director);
  158 |   await page.goto("/app/configuracion?tab=identidad");
  159 |   await expect(page.getByLabel("Logo de la empresa", { exact: true })).toHaveAttribute(
  160 |     "type",
  161 |     "file",
  162 |   );
  163 |   await page.goto("/app/configuracion?tab=configuracion");
  164 |   await page
  165 |     .getByRole("button", { name: /^Editar / })
  166 |     .first()
  167 |     .click();
  168 |   await expect(
  169 |     page.getByRole("textbox", { name: "Nombre de la unidad de negocio", exact: true }),
  170 |   ).toBeFocused();
  171 |   const result = await new AxeBuilder({ page }).withRules(["label", "button-name"]).analyze();
  172 |   expect(result.violations).toEqual([]);
  173 |   await page.getByRole("button", { name: "Cancelar edición", exact: true }).click();
  174 | });
  175 | 
  176 | test("las categorías de proveedores conservan contraste AA", async ({ page }) => {
  177 |   await login(page, DEMO_USERS.director);
  178 |   await page.goto("/app/catalogos/proveedores");
  179 |   await expect(page.getByRole("cell", { name: "Contratista", exact: true }).first()).toBeVisible();
  180 |   const result = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  181 |   expect(result.violations).toEqual([]);
  182 | });
  183 | 
  184 | test("los filtros y categorías caben en móvil y tableta", async ({ page }) => {
```