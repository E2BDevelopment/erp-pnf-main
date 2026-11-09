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

Locator: locator('[data-chart]').locator('.recharts-bar-rectangle path').first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('[data-chart]').locator('.recharts-bar-rectangle path').first() with timeout 15000ms
  - waiting for locator('[data-chart]').locator('.recharts-bar-rectangle path').first()

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
  - heading "Dashboard" [level=1]
  - paragraph: 14-sep – 08-nov 2026 · producción y gasto al corte de hoy; la semana en curso sigue en captura.
  - text: Periodo
  - radiogroup "Semanas del periodo":
    - radio "Últimas 4 semanas": 4 sem
    - radio "Últimas 8 semanas" [checked]: 8 sem
    - radio "Últimas 12 semanas": 12 sem
  - text: Semáforo Ejecutivo de Obras Cartera bajo control
  - paragraph: Todas las obras activas se mantienen dentro del marco presupuestal autorizado.
  - paragraph: Avance Global
  - paragraph: 19.0%
  - paragraph: Contratado Total
  - paragraph: $110,927,025.00
  - paragraph: Obras activas
  - paragraph: "3"
  - text: 3 en cartera · $110,927,025.00 contratado
  - paragraph: Producción del periodo
  - paragraph: $21,109,961.72
  - text: Sin periodo anterior para comparar
  - paragraph: Gasto del periodo
  - paragraph: $15,299,737.44
  - text: 72.5% de la producción
  - paragraph: Utilidad del periodo
  - paragraph: $5,810,224.28
  - text: Margen 27.5% sobre producción
  - paragraph: Por pagar
  - paragraph: $973,531.70
  - text: 11 vencidas · $921,631.70
  - heading "Espera visto bueno" [level=2]
  - paragraph: Documentos que no avanzan hasta que alguien los autorice.
  - text: 35 en total
  - list:
    - listitem:
      - link "Requisiciones por autorizar 11 pendientes":
        - /url: /app/admin/requisiciones
    - listitem:
      - link "Cuentas por pagar 13 pendientes":
        - /url: /app/admin/cuentas-por-pagar
    - listitem:
      - link "Nóminas cerradas por pagar 2 pendientes":
        - /url: /app/admin/nomina
    - listitem:
      - link "Caja chica 2 pendientes":
        - /url: /app/admin/caja-chica
    - listitem:
      - link "Vales de gasolina 3 pendientes":
        - /url: /app/admin/gasolinas
    - listitem:
      - link "Gastos de oficina 3 pendientes":
        - /url: /app/admin/gastos-oficina
    - listitem:
      - link "Rentas solicitadas 1 pendiente":
        - /url: /app/admin/rentas
  - heading "Producción vs. gasto" [level=2]
  - paragraph: Semana por semana, sumando todas las obras del periodo.
  - text: Producción Gasto
  - table "Producción y gasto por semana":
    - caption: Producción y gasto por semana
    - rowgroup:
      - row "Semana Producción Gasto Resultado":
        - columnheader "Semana"
        - columnheader "Producción"
        - columnheader "Gasto"
        - columnheader "Resultado"
    - rowgroup:
      - row "14-sep $0.00 $0.00 $0.00":
        - rowheader "14-sep"
        - cell "$0.00"
        - cell "$0.00"
        - cell "$0.00"
      - row "21-sep $2,533,249.15 $1,948,974.38 $584,274.77":
        - rowheader "21-sep"
        - cell "$2,533,249.15"
        - cell "$1,948,974.38"
        - cell "$584,274.77"
      - row "28-sep $2,955,432.54 $2,185,887.32 $769,545.22":
        - rowheader "28-sep"
        - cell "$2,955,432.54"
        - cell "$2,185,887.32"
        - cell "$769,545.22"
      - row "05-oct $3,377,576.86 $2,454,079.12 $923,497.74":
        - rowheader "05-oct"
        - cell "$3,377,576.86"
        - cell "$2,454,079.12"
        - cell "$923,497.74"
      - row "12-oct $3,799,759.02 $2,807,051.72 $992,707.30":
        - rowheader "12-oct"
        - cell "$3,799,759.02"
        - cell "$2,807,051.72"
        - cell "$992,707.30"
      - row "19-oct $4,222,034.78 $2,929,111.80 $1,292,922.98":
        - rowheader "19-oct"
        - cell "$4,222,034.78"
        - cell "$2,929,111.80"
        - cell "$1,292,922.98"
      - row "26-oct $4,221,909.37 $2,931,799.79 $1,290,109.58":
        - rowheader "26-oct"
        - cell "$4,221,909.37"
        - cell "$2,931,799.79"
        - cell "$1,290,109.58"
      - row "02-nov $0.00 $42,833.33 -$42,833.33":
        - rowheader "02-nov"
        - cell "$0.00"
        - cell "$42,833.33"
        - cell "-$42,833.33"
  - heading "En qué se fue el gasto" [level=2]
  - paragraph: Categorías del periodo.
  - text: $15,299,737.44
  - list:
    - listitem: Almacén $7,757,600.00 51%
    - listitem: Nómina $2,359,486.86 15%
    - listitem: Subcontratos $2,296,270.00 15%
    - listitem: Destajos $2,252,740.00 15%
    - listitem: Rentas $437,933.33 3%
    - listitem: Gasolinas $120,200.00 1%
    - listitem: Caja chica $75,507.25 0%
  - paragraph: El gasto incluye almacén consumido, nómina, destajos, subcontratos, rentas, gasolinas y caja chica. Las rentas se prorratean por día.
  - heading "Cartera de obras" [level=2]
  - paragraph: Presupuesto autorizado contra lo estimado a la fecha.
  - link "Ver obras":
    - /url: /app/obras
  - table:
    - rowgroup:
      - row "Obra Contratado Estimado Avance Pend.":
        - columnheader "Obra"
        - columnheader "Contratado"
        - columnheader "Estimado"
        - columnheader "Avance"
        - columnheader "Pend."
    - rowgroup:
      - row "Residencial Los Encinos — Torre A Inmobiliaria Los Encinos, S.A. de C.V. · Edificación Residencial $68,203,525.00 $11,459,968.58 17% 14 pendientes":
        - cell "Residencial Los Encinos — Torre A Inmobiliaria Los Encinos, S.A. de C.V. · Edificación Residencial":
          - link "Residencial Los Encinos — Torre A":
            - /url: /app/obras/4d616d86-3c6f-5c35-bfa0-b91333ad9796
          - paragraph: Inmobiliaria Los Encinos, S.A. de C.V. · Edificación Residencial
        - cell "$68,203,525.00"
        - cell "$11,459,968.58"
        - cell "17%"
        - cell "14 pendientes"
      - row "Ampliación Nave Industrial Bajío Logística Integral Bajío, S. de R.L. de C.V. · Nave Industrial y Logística $42,723,500.00 $9,649,993.14 23% 13 pendientes":
        - cell "Ampliación Nave Industrial Bajío Logística Integral Bajío, S. de R.L. de C.V. · Nave Industrial y Logística":
          - link "Ampliación Nave Industrial Bajío":
            - /url: /app/obras/03f8c174-6bfc-5e77-802f-65470a4a1d1d
          - paragraph: Logística Integral Bajío, S. de R.L. de C.V. · Nave Industrial y Logística
        - cell "$42,723,500.00"
        - cell "$9,649,993.14"
        - cell "23%"
        - cell "13 pendientes"
      - row "Obra de prueba Logística Integral Bajío, S. de R.L. de C.V. · Nave Industrial y Logística — $0.00 Sin presupuesto autorizado —":
        - cell "Obra de prueba Logística Integral Bajío, S. de R.L. de C.V. · Nave Industrial y Logística":
          - link "Obra de prueba":
            - /url: /app/obras/58a43d52-9a1e-49e3-9f38-a3bbcfe8bcf8
          - paragraph: Logística Integral Bajío, S. de R.L. de C.V. · Nave Industrial y Logística
        - cell "—"
        - cell "$0.00"
        - cell "Sin presupuesto autorizado"
        - cell "—"
    - rowgroup:
      - row "Total $110,927,025.00 $21,109,961.72 19.0% global":
        - cell "Total"
        - cell "$110,927,025.00"
        - cell "$21,109,961.72"
        - cell "19.0% global"
        - cell
  - heading "Cuentas por pagar" [level=2]
  - paragraph: 13 documentos abiertos
  - paragraph: $973,531.70
  - paragraph: 11 vencidas · $921,631.70
  - list:
    - listitem:
      - paragraph: Transportes y Grúas del Centro, S.A. de C.V.
      - paragraph: $36,500.00
      - paragraph: CxP-2026-0050 · GD-2026-0002 · Servicio de grúa para montaje de columnas prefabricadas
      - text: Vencida 10-oct
    - listitem:
      - paragraph: Estructuras Metálicas del Bajío, S.A. de C.V.
      - paragraph: $65,000.00
      - paragraph: CxP-2026-0052 · GD-2026-0007 · Montaje de estructura metálica de la ampliación
      - text: Vencida 17-oct
    - listitem:
      - paragraph: Ferretería Industrial León, S.A. de C.V.
      - paragraph: $9,800.00
      - paragraph: CxP-2026-0061 · GO-2026-0009 · Mantenimiento preventivo de aire acondicionado
      - text: Vencida 30-oct
    - listitem:
      - paragraph: Transportes y Grúas del Centro, S.A. de C.V.
      - paragraph: $18,500.00
      - paragraph: CxP-2026-0043 · Renta Grúa telescópica 25 toneladas · 2026-10-17–2026-10-17
      - text: Vencida 01-nov
    - listitem:
      - paragraph: Transportes y Grúas del Centro, S.A. de C.V.
      - paragraph: $18,500.00
      - paragraph: CxP-2026-0044 · Renta Grúa telescópica 25 toneladas · 2026-10-18–2026-10-18
      - text: Vencida 02-nov
  - text: Saldo en cuentas $5,855,861.41 (3 activas)
  - link "Ver todas":
    - /url: /app/admin/cuentas-por-pagar
- region "Notifications alt+T"
- alert: Dashboard · ERP PNF
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
> 9   |     await expect(chart.locator(".recharts-bar-rectangle path").first()).toBeVisible();
      |                                                                         ^ Error: expect(locator).toBeVisible() failed
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
```