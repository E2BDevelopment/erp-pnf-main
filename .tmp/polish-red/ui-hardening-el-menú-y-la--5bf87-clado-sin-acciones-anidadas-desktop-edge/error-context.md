# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-hardening.spec.ts >> el menú y la ficha del trabajador funcionan por teclado sin acciones anidadas
- Location: tests\e2e\ui-hardening.spec.ts:129:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('menu')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('menu') with timeout 15000ms
  - waiting for getByRole('menu')

```

```yaml
- region "Notifications alt+T"
```

# Test source

```ts
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
  92  |   await expect(todos).toBeChecked();
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
  129 | test("el menú y la ficha del trabajador funcionan por teclado sin acciones anidadas", async ({ page }) => {
  130 |   await login(page, DEMO_USERS.director);
  131 |   await page.goto("/app/catalogos/trabajadores");
  132 |   const menuButton = page.getByRole("button", { name: "Más acciones del trabajador", exact: true }).first();
  133 |   await menuButton.focus();
  134 |   await page.keyboard.press("Space");
> 135 |   await expect(page.getByRole("menu")).toBeVisible();
      |                                        ^ Error: expect(locator).toBeVisible() failed
  136 |   await expect(page.getByRole("dialog")).not.toBeVisible();
  137 |   await page.keyboard.press("Escape");
  138 |   await expect(menuButton).toBeFocused();
  139 |   const row = page.locator("main ul > li").first();
  140 |   const open = row.getByRole("button").first();
  141 |   await open.focus();
  142 |   await page.keyboard.press("Enter");
  143 |   await expect(page.getByRole("dialog")).toBeVisible();
  144 |   await page.keyboard.press("Escape");
  145 |   await expect(open).toBeFocused();
  146 |   const result = await new AxeBuilder({ page }).withRules(["list", "nested-interactive"]).analyze();
  147 |   expect(result.violations).toEqual([]);
  148 | });
  149 | 
  150 | test("logo y edición de unidad de negocio tienen un nombre accesible", async ({ page }) => {
  151 |   await login(page, DEMO_USERS.director);
  152 |   await page.goto("/app/configuracion?tab=identidad");
  153 |   await expect(page.getByLabel("Logo de la empresa", { exact: true })).toHaveAttribute("type", "file");
  154 |   await page.goto("/app/configuracion?tab=configuracion");
  155 |   await page.getByRole("button", { name: /^Editar / }).first().click();
  156 |   await expect(page.getByRole("textbox", { name: "Nombre de la unidad de negocio", exact: true })).toBeFocused();
  157 |   const result = await new AxeBuilder({ page }).withRules(["label", "button-name"]).analyze();
  158 |   expect(result.violations).toEqual([]);
  159 |   await page.getByRole("button", { name: "Cancelar edición", exact: true }).click();
  160 | });
  161 | 
  162 | test("las categorías de proveedores conservan contraste AA", async ({ page }) => {
  163 |   await login(page, DEMO_USERS.director);
  164 |   await page.goto("/app/catalogos/proveedores");
  165 |   await expect(page.getByRole("cell", { name: "Contratista", exact: true }).first()).toBeVisible();
  166 |   const result = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  167 |   expect(result.violations).toEqual([]);
  168 | });
  169 | 
```