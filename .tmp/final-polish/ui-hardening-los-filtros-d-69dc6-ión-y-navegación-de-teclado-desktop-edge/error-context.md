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

Locator:  getByRole('radiogroup', { name: 'Filtrar clientes por autorización' }).getByRole('radio', { name: 'Todos', exact: true })
Expected: checked
Received: unchecked
Timeout:  15000ms

Call log:
  - Expect "toBeChecked" getByRole('radiogroup', { name: 'Filtrar clientes por autorización' }).getByRole('radio', { name: 'Todos', exact: true }) with timeout 15000ms
  - waiting for getByRole('radiogroup', { name: 'Filtrar clientes por autorización' }).getByRole('radio', { name: 'Todos', exact: true })
    33 × locator resolved to <button role="radio" tabindex="0" type="button" data-state="off" aria-checked="false" data-radix-collection-item="" class="inline-flex items-center justify-center gap-2 rounded-md font-medium cursor-pointer transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-transparent min-w-9 text-x…>Todos</button>
       - unexpected value "unchecked"

```

```yaml
- radio "Todos"
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
  84  |   await expect(todos).toBeChecked();
  85  |   await todos.focus();
  86  |   await page.keyboard.press("ArrowRight");
  87  |   const pendientes = group.getByRole("radio", { name: /Pendientes/ });
  88  |   await page.keyboard.press("Space");
  89  |   await expect(pendientes).toBeChecked();
  90  |   await page.keyboard.press("ArrowLeft");
  91  |   await page.keyboard.press("Space");
> 92  |   await expect(todos).toBeChecked();
      |                       ^ Error: expect(locator).toBeChecked() failed
  93  |   const results = await new AxeBuilder({ page })
  94  |     .withRules(["aria-valid-attr-value", "button-name"])
  95  |     .analyze();
  96  |   expect(results.violations).toEqual([]);
  97  | });
  98  | 
  99  | test("la carga respeta cambios de movimiento reducido sin perder su estado", async ({ page }) => {
  100 |   await login(page, DEMO_USERS.director);
  101 |   await page.emulateMedia({ reducedMotion: "reduce" });
  102 |   let release!: () => void;
  103 |   const pending = new Promise<void>((resolve) => {
  104 |     release = resolve;
  105 |   });
  106 |   await page.route("**/api/rpc/**", async (route) => {
  107 |     if (decodeURIComponent(route.request().url()).endsWith("auth.functions.getSessionContext")) {
  108 |       await pending;
  109 |     }
  110 |     await route.continue();
  111 |   });
  112 |   try {
  113 |     await page.reload({ waitUntil: "domcontentloaded" });
  114 |     const loading = page.getByRole("status", { name: "Cargando información", exact: true });
  115 |     await expect(loading.getByText("Cargando información…")).toBeVisible();
  116 |     await expect(loading.locator("svg")).toHaveCount(0);
  117 |     await page.emulateMedia({ reducedMotion: "no-preference" });
  118 |     await expect(loading.locator("svg")).toBeVisible();
  119 |     await page.emulateMedia({ reducedMotion: "reduce" });
  120 |     await expect(loading.locator("svg")).toHaveCount(0);
  121 |     await expect(loading.getByText("Cargando información…")).toBeVisible();
  122 |     release();
  123 |     await expect(loading).not.toBeVisible();
  124 |   } finally {
  125 |     release();
  126 |   }
  127 | });
  128 | 
  129 | test("el menú y la ficha del trabajador funcionan por teclado sin acciones anidadas", async ({
  130 |   page,
  131 | }) => {
  132 |   await login(page, DEMO_USERS.director);
  133 |   await page.goto("/app/catalogos/trabajadores");
  134 |   const menuButton = page
  135 |     .getByRole("button", { name: "Más acciones del trabajador", exact: true })
  136 |     .first();
  137 |   await menuButton.focus();
  138 |   await page.keyboard.press("Space");
  139 |   await expect(page.getByRole("menu")).toBeVisible();
  140 |   await expect(page.getByRole("dialog")).not.toBeVisible();
  141 |   await page.keyboard.press("Escape");
  142 |   await expect(menuButton).toBeFocused();
  143 |   const row = page.locator("main ul > li").first();
  144 |   const open = row.getByRole("button").first();
  145 |   await open.focus();
  146 |   await page.keyboard.press("Enter");
  147 |   await expect(page.getByRole("dialog")).toBeVisible();
  148 |   await page.keyboard.press("Escape");
  149 |   await expect(open).toBeFocused();
  150 |   const result = await new AxeBuilder({ page }).withRules(["list", "nested-interactive"]).analyze();
  151 |   expect(result.violations).toEqual([]);
  152 | });
  153 | 
  154 | test("logo y edición de unidad de negocio tienen un nombre accesible", async ({ page }) => {
  155 |   await login(page, DEMO_USERS.director);
  156 |   await page.goto("/app/configuracion?tab=identidad");
  157 |   await expect(page.getByLabel("Logo de la empresa", { exact: true })).toHaveAttribute(
  158 |     "type",
  159 |     "file",
  160 |   );
  161 |   await page.goto("/app/configuracion?tab=configuracion");
  162 |   await page
  163 |     .getByRole("button", { name: /^Editar / })
  164 |     .first()
  165 |     .click();
  166 |   await expect(
  167 |     page.getByRole("textbox", { name: "Nombre de la unidad de negocio", exact: true }),
  168 |   ).toBeFocused();
  169 |   const result = await new AxeBuilder({ page }).withRules(["label", "button-name"]).analyze();
  170 |   expect(result.violations).toEqual([]);
  171 |   await page.getByRole("button", { name: "Cancelar edición", exact: true }).click();
  172 | });
  173 | 
  174 | test("las categorías de proveedores conservan contraste AA", async ({ page }) => {
  175 |   await login(page, DEMO_USERS.director);
  176 |   await page.goto("/app/catalogos/proveedores");
  177 |   await expect(page.getByRole("cell", { name: "Contratista", exact: true }).first()).toBeVisible();
  178 |   const result = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  179 |   expect(result.violations).toEqual([]);
  180 | });
  181 | 
```