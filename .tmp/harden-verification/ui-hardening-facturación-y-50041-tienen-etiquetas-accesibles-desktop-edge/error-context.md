# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-hardening.spec.ts >> facturación y alta de equipo tienen etiquetas accesibles
- Location: tests\e2e\ui-hardening.spec.ts:32:1

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  getByRole('button', { name: 'Crear usuario', exact: true })
Expected: focused
Received: inactive
Timeout:  15000ms

Call log:
  - Expect "toBeFocused" getByRole('button', { name: 'Crear usuario', exact: true }) with timeout 15000ms
  - waiting for getByRole('button', { name: 'Crear usuario', exact: true })
    33 × locator resolved to <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">…</button>
       - unexpected value "inactive"

```

```yaml
- button "Crear usuario"
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
  10 |     await expect.poll(() => chart.locator("style").evaluate((el) => Boolean(el.nonce && el.sheet))).toBe(true);
  11 |     for (const [serie, token] of [["produccion", "--color-primary"], ["gasto", "--color-destructive"]]) {
  12 |       const path = chart.locator(`path[fill="var(--color-${serie})"]`).first();
  13 |       await expect.poll(() => path.evaluate((el, name) => {
  14 |         const style = getComputedStyle(el);
  15 |         return { fill: style.fill, variable: style.getPropertyValue(`--color-${name}`).trim() };
  16 |       }, serie)).toEqual({
  17 |         fill: serie === "produccion" ? "rgb(244, 119, 33)" : "rgb(220, 38, 38)",
  18 |         variable: await chart.evaluate((el, name) => getComputedStyle(el).getPropertyValue(name).trim(), token),
  19 |       });
  20 |     }
  21 |   };
  22 |   await comprobarSeries();
  23 |   await page.reload();
  24 |   await comprobarSeries();
  25 |   await page.getByRole("navigation", { name: "Navegación principal", exact: true })
  26 |     .getByRole("link", { name: "Obras", exact: true }).click();
  27 |   await page.getByRole("navigation", { name: "Navegación principal", exact: true })
  28 |     .getByRole("link", { name: "Dashboard", exact: true }).click();
  29 |   await comprobarSeries();
  30 | });
  31 | 
  32 | test("facturación y alta de equipo tienen etiquetas accesibles", async ({ page }) => {
  33 |   await login(page, DEMO_USERS.director);
  34 |   await page.goto("/app/configuracion");
  35 |   await expect(page.getByLabel("RFC *", { exact: true })).toHaveValue(/.+/);
  36 |   await expect(page.getByRole("combobox", { name: "Régimen fiscal", exact: true })).toBeVisible();
  37 |   const results = await new AxeBuilder({ page }).withRules(["label", "button-name"]).analyze();
  38 |   expect(results.violations).toEqual([]);
  39 |   await page.goto("/app/equipo");
  40 |   await page.getByRole("button", { name: "Crear usuario", exact: true }).click();
  41 |   const dialog = page.getByRole("dialog");
  42 |   await expect(dialog.getByLabel("Nombre completo", { exact: true })).toBeFocused();
  43 |   await expect(dialog.getByLabel("Email", { exact: true })).toBeVisible();
  44 |   await expect(dialog.getByRole("combobox", { name: "Rol", exact: true })).toBeVisible();
  45 |   const fields = await new AxeBuilder({ page }).withRules(["label", "button-name"]).analyze();
  46 |   expect(fields.violations).toEqual([]);
  47 |   await page.keyboard.press("Escape");
  48 |   await expect(dialog).not.toBeVisible();
> 49 |   await expect(page.getByRole("button", { name: "Crear usuario", exact: true })).toBeFocused();
     |                                                                                  ^ Error: expect(locator).toBeFocused() failed
  50 | });
  51 | 
  52 | test("los filtros de clientes tienen selección y navegación de teclado", async ({ page }) => {
  53 |   await login(page, DEMO_USERS.director);
  54 |   await page.goto("/app/catalogos");
  55 |   const group = page.getByRole("group", { name: "Filtrar clientes por autorización" });
  56 |   const todos = group.getByRole("radio", { name: "Todos", exact: true });
  57 |   await expect(todos).toBeChecked();
  58 |   await todos.focus();
  59 |   await page.keyboard.press("ArrowRight");
  60 |   const pendientes = group.getByRole("radio", { name: /Pendientes/ });
  61 |   await page.keyboard.press("Space");
  62 |   await expect(pendientes).toBeChecked();
  63 |   await page.keyboard.press("ArrowLeft");
  64 |   await page.keyboard.press("Space");
  65 |   await expect(todos).toBeChecked();
  66 |   const results = await new AxeBuilder({ page }).withRules(["aria-valid-attr-value", "button-name"]).analyze();
  67 |   expect(results.violations).toEqual([]);
  68 | });
  69 | 
```