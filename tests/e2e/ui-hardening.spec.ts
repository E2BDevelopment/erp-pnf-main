import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { DEMO_USERS, login } from "./helpers";

test("las gráficas conservan sus colores bajo CSP y navegación cliente", async ({ page }) => {
  await login(page, DEMO_USERS.director);
  const comprobarSeries = async () => {
    const chart = page.locator("[data-chart]");
    await expect(chart.locator(".recharts-bar-rectangle path").first()).toBeVisible();
    await expect
      .poll(() =>
        chart
          .locator("style")
          .evaluate((el) => el instanceof HTMLStyleElement && Boolean(el.nonce && el.sheet)),
      )
      .toBe(true);
    for (const [serie, token] of [
      ["produccion", "--color-primary"],
      ["gasto", "--color-destructive"],
    ]) {
      const path = chart.locator(`path[fill="var(--color-${serie})"]`).first();
      await expect
        .poll(() =>
          path.evaluate((el, name) => {
            const style = getComputedStyle(el);
            return { fill: style.fill, variable: style.getPropertyValue(`--color-${name}`).trim() };
          }, serie),
        )
        .toEqual({
          fill: serie === "produccion" ? "rgb(244, 119, 33)" : "rgb(220, 38, 38)",
          variable: await chart.evaluate(
            (el, name) => getComputedStyle(el).getPropertyValue(name).trim(),
            token,
          ),
        });
    }
  };
  await comprobarSeries();
  await page.reload();
  await comprobarSeries();
  await page
    .getByRole("navigation", { name: "Navegación principal", exact: true })
    .getByRole("link", { name: "Obras", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Navegación principal", exact: true })
    .getByRole("link", { name: "Dashboard", exact: true })
    .click();
  await comprobarSeries();
});

test("facturación y alta de equipo tienen etiquetas accesibles", async ({ page }) => {
  await login(page, DEMO_USERS.director);
  await page.setViewportSize({ width: 360, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/app/configuracion");
  await expect(page.getByLabel("RFC *", { exact: true })).toHaveValue(/.+/);
  await expect(page.getByRole("combobox", { name: "Régimen fiscal", exact: true })).toBeVisible();
  const results = await new AxeBuilder({ page }).withRules(["label", "button-name"]).analyze();
  expect(results.violations).toEqual([]);
  await page.goto("/app/equipo");
  await page.getByRole("button", { name: "Crear usuario", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Nombre completo", { exact: true })).toBeFocused();
  await expect(dialog.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("combobox", { name: "Rol", exact: true })).toBeVisible();
  await expect(dialog).toHaveCSS("animation-name", "none");
  const close = dialog.getByRole("button", { name: "Cerrar", exact: true });
  const box = await close.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
  const fields = await new AxeBuilder({ page }).withRules(["label", "button-name"]).analyze();
  expect(fields.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Crear usuario", exact: true })).toBeFocused();
});

test("los filtros de clientes tienen selección y navegación de teclado", async ({ page }) => {
  await login(page, DEMO_USERS.director);
  await page.goto("/app/catalogos");
  const group = page.getByRole("radiogroup", { name: "Filtrar clientes por autorización" });
  const todos = group.getByRole("radio", { name: "Todos", exact: true });
  await expect(todos).toBeChecked();
  await todos.focus();
  await page.keyboard.press("ArrowRight");
  const pendientes = group.getByRole("radio", { name: /Pendientes/ });
  await expect(pendientes).toBeFocused();
  await page.keyboard.press("Space");
  await expect(pendientes).toBeChecked();
  await page.keyboard.press("ArrowLeft");
  await expect(todos).toBeFocused();
  await page.keyboard.press("Space");
  await expect(todos).toBeChecked();
  const results = await new AxeBuilder({ page })
    .withRules(["aria-valid-attr-value", "button-name"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("la carga respeta cambios de movimiento reducido sin perder su estado", async ({ page }) => {
  await login(page, DEMO_USERS.director);
  await page.emulateMedia({ reducedMotion: "reduce" });
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/rpc/**", async (route) => {
    if (decodeURIComponent(route.request().url()).endsWith("auth.functions.getSessionContext")) {
      await pending;
    }
    await route.continue();
  });
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    const loading = page.getByRole("status", { name: "Cargando información", exact: true });
    await expect(loading.getByText("Cargando información…")).toBeVisible();
    await expect(loading.locator("svg")).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(loading.locator("svg")).toBeVisible();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(loading.locator("svg")).toHaveCount(0);
    await expect(loading.getByText("Cargando información…")).toBeVisible();
    release();
    await expect(loading).not.toBeVisible();
  } finally {
    release();
  }
});

test("el menú y la ficha del trabajador funcionan por teclado sin acciones anidadas", async ({
  page,
}) => {
  await login(page, DEMO_USERS.director);
  await page.goto("/app/catalogos/trabajadores");
  const menuButton = page
    .getByRole("button", { name: "Más acciones del trabajador", exact: true })
    .first();
  await menuButton.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("menu")).toBeVisible();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menuButton).toBeFocused();
  const row = page.locator("main ul > li").first();
  const open = row.getByRole("button").first();
  await open.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(open).toBeFocused();
  const result = await new AxeBuilder({ page }).withRules(["list", "nested-interactive"]).analyze();
  expect(result.violations).toEqual([]);
});

test("logo y edición de unidad de negocio tienen un nombre accesible", async ({ page }) => {
  await login(page, DEMO_USERS.director);
  await page.goto("/app/configuracion?tab=identidad");
  await expect(page.getByLabel("Logo de la empresa", { exact: true })).toHaveAttribute(
    "type",
    "file",
  );
  await page.goto("/app/configuracion?tab=configuracion");
  await page
    .getByRole("button", { name: /^Editar / })
    .first()
    .click();
  await expect(
    page.getByRole("textbox", { name: "Nombre de la unidad de negocio", exact: true }),
  ).toBeFocused();
  const result = await new AxeBuilder({ page }).withRules(["label", "button-name"]).analyze();
  expect(result.violations).toEqual([]);
  await page.getByRole("button", { name: "Cancelar edición", exact: true }).click();
});

test("las categorías de proveedores conservan contraste AA", async ({ page }) => {
  await login(page, DEMO_USERS.director);
  await page.goto("/app/catalogos/proveedores");
  await expect(page.getByRole("cell", { name: "Contratista", exact: true }).first()).toBeVisible();
  const result = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  expect(result.violations).toEqual([]);
});

test("los filtros y categorías caben en móvil y tableta", async ({ page }) => {
  await login(page, DEMO_USERS.director);
  for (const width of [360, 768]) {
    await page.setViewportSize({ width, height: 900 });
    for (const section of ["proveedores", "insumos"]) {
      await page.goto(`/app/catalogos/${section}`);
      await expect(
        page.getByRole("combobox", {
          name:
            section === "insumos" ? "Categoría de insumo" : "Categoría de proveedor o contratista",
          exact: true,
        }),
      ).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    }
    await page.getByRole("button", { name: "Categorías", exact: true }).click();
    const dialog = page.getByRole("dialog");
    const list = dialog.locator(".max-h-80");
    await expect(list).toBeVisible();
    const dimensions = await list.evaluate((el) => ({
      client: el.clientWidth,
      scroll: el.scrollWidth,
    }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client);
    await page.keyboard.press("Escape");
  }
});

test("el ciclo semanal conserva etiquetas legibles y cabe en cada ancho", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const drawing = page.getByRole("img", {
    name: "Ciclo semanal: nómina, almacén y caja chica se reúnen en un resumen por obra",
    exact: true,
  });
  for (const width of [320, 360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await drawing.scrollIntoViewIfNeeded();
    const layout = await drawing.evaluate((el) => ({
      width: el.clientWidth,
      scroll: el.scrollWidth,
      labels: [
        ...el.querySelectorAll(
          ".landing-drawing-top span, .landing-structure-node, .landing-drawing-bottom",
        ),
      ].map((label) => parseFloat(getComputedStyle(label).fontSize)),
    }));
    expect(layout.labels).toHaveLength(7);
    expect(Math.min(...layout.labels)).toBeGreaterThanOrEqual(12);
    expect(layout.scroll).toBeLessThanOrEqual(layout.width);
  }
});
