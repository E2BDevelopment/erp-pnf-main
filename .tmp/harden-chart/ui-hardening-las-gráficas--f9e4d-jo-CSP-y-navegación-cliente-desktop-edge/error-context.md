# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-hardening.spec.ts >> las gráficas conservan sus colores bajo CSP y navegación cliente
- Location: tests\e2e\ui-hardening.spec.ts:5:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - link "Saltar al contenido" [ref=e3] [cursor=pointer]:
      - /url: "#contenido"
    - complementary [ref=e4]:
      - generic [ref=e5]:
        - img "Logo ERP PNF" [ref=e6]
        - generic [ref=e7]:
          - paragraph [ref=e8]: ERP PNF
          - paragraph [ref=e9]: Constructora Naranja del Bajío, S.A. de C.V.
      - generic [ref=e10]:
        - searchbox "Buscar módulo" [ref=e13]
        - navigation "Navegación principal" [ref=e14]:
          - generic [ref=e15]:
            - paragraph [ref=e16]: Corporativo
            - link "Dashboard" [ref=e17] [cursor=pointer]:
              - /url: /app/dashboard
            - link "Obras" [ref=e24] [cursor=pointer]:
              - /url: /app/obras
            - link "Catálogos" [ref=e31] [cursor=pointer]:
              - /url: /app/catalogos
            - link "Nueva obra" [ref=e35] [cursor=pointer]:
              - /url: /app/obras/nueva
            - link "Configuración" [ref=e42] [cursor=pointer]:
              - /url: /app/configuracion
            - link "Auditoría" [ref=e47] [cursor=pointer]:
              - /url: /app/auditoria
          - generic [ref=e55]:
            - paragraph [ref=e56]: Compras
            - link "Requisiciones 10 pendientes" [ref=e57] [cursor=pointer]:
              - /url: /app/admin/requisiciones
              - generic [ref=e61]: Requisiciones
              - generic [ref=e62]:
                - generic [aria-hidden] [ref=e63]: 9+
                - generic [ref=e64]: 10 pendientes
            - link "Almacén central" [ref=e65] [cursor=pointer]:
              - /url: /app/admin/almacen-central
          - generic [ref=e70]:
            - paragraph [ref=e71]: Dinero
            - link "Cuentas por pagar 13 pendientes" [ref=e72] [cursor=pointer]:
              - /url: /app/admin/cuentas-por-pagar
              - generic [ref=e76]: Cuentas por pagar
              - generic [ref=e77]:
                - generic [aria-hidden] [ref=e78]: 9+
                - generic [ref=e79]: 13 pendientes
            - link "Tesorería" [ref=e80] [cursor=pointer]:
              - /url: /app/admin/tesoreria
            - link "Contabilidad" [ref=e85] [cursor=pointer]:
              - /url: /app/admin/contabilidad
            - link "Condensado semanal" [ref=e91] [cursor=pointer]:
              - /url: /app/admin/condensado-semanal
          - generic [ref=e95]:
            - paragraph [ref=e96]: Obra
            - link "Nómina 2 pendientes" [ref=e97] [cursor=pointer]:
              - /url: /app/admin/nomina
              - generic [ref=e103]: Nómina
              - generic [ref=e104]:
                - generic [aria-hidden] [ref=e105]: "2"
                - generic [ref=e106]: 2 pendientes
            - link "Destajos" [ref=e107] [cursor=pointer]:
              - /url: /app/admin/destajos
            - link "Subcontratos" [ref=e113] [cursor=pointer]:
              - /url: /app/admin/subcontratos
            - link "Rentas 1 pendiente" [ref=e120] [cursor=pointer]:
              - /url: /app/admin/rentas
              - generic [ref=e126]: Rentas
              - generic [ref=e127]:
                - generic [aria-hidden] [ref=e128]: "1"
                - generic [ref=e129]: 1 pendiente
            - link "Gasolinas 3 pendientes" [ref=e130] [cursor=pointer]:
              - /url: /app/admin/gasolinas
              - generic [ref=e134]: Gasolinas
              - generic [ref=e135]:
                - generic [aria-hidden] [ref=e136]: "3"
                - generic [ref=e137]: 3 pendientes
          - generic [ref=e138]:
            - paragraph [ref=e139]: Operación
            - link "Caja chica 2 pendientes" [ref=e140] [cursor=pointer]:
              - /url: /app/admin/caja-chica
              - generic [ref=e146]: Caja chica
              - generic [ref=e147]:
                - generic [aria-hidden] [ref=e148]: "2"
                - generic [ref=e149]: 2 pendientes
            - link "Gastos de oficina 3 pendientes" [ref=e150] [cursor=pointer]:
              - /url: /app/admin/gastos-oficina
              - generic [ref=e154]: Gastos de oficina
              - generic [ref=e155]:
                - generic [aria-hidden] [ref=e156]: "3"
                - generic [ref=e157]: 3 pendientes
            - link "Tareas" [ref=e158] [cursor=pointer]:
              - /url: /app/admin/tareas
    - generic [ref=e163]:
      - banner [ref=e164]:
        - link "ERP PNF" [ref=e166] [cursor=pointer]:
          - /url: /app/dashboard
        - generic [ref=e173]:
          - button "Notificaciones, ninguna sin leer" [ref=e174] [cursor=pointer]
          - button "Cuenta de RN Ricardo Naranja Salazar" [ref=e175] [cursor=pointer]:
            - generic [ref=e176]: Cuenta de
            - generic [ref=e177]: RN
            - generic [ref=e179]: Ricardo Naranja Salazar
      - main [ref=e180]:
        - generic [ref=e181]:
          - generic [ref=e182]:
            - generic [ref=e183]:
              - heading "Dashboard" [level=1] [ref=e184]
              - paragraph [ref=e185]: 14-sep – 08-nov 2026 · producción y gasto al corte de hoy; la semana en curso sigue en captura.
            - generic [ref=e186]:
              - generic [ref=e187]: Periodo
              - radiogroup "Semanas del periodo" [ref=e188]:
                - radio "Últimas 4 semanas" [ref=e189] [cursor=pointer]: 4 sem
                - radio "Últimas 8 semanas" [checked] [ref=e190] [cursor=pointer]: 8 sem
                - radio "Últimas 12 semanas" [ref=e191] [cursor=pointer]: 12 sem
          - generic [ref=e193]:
            - generic [ref=e201]:
              - generic [ref=e202]:
                - generic [ref=e203]: Semáforo Ejecutivo de Obras
                - generic [ref=e204]: Cartera bajo control
              - paragraph [ref=e205]: Todas las obras activas se mantienen dentro del marco presupuestal autorizado.
            - generic [ref=e206]:
              - generic [ref=e207]:
                - paragraph [ref=e208]: Avance Global
                - paragraph [ref=e209]: 19.0%
              - generic [ref=e210]:
                - paragraph [ref=e211]: Contratado Total
                - paragraph [ref=e212]: $110,927,025.00
          - generic [ref=e213]:
            - generic [ref=e214]:
              - paragraph [ref=e215]: Obras activas
              - paragraph [ref=e216]: "3"
              - generic [ref=e217]: 3 en cartera · $110,927,025.00 contratado
            - generic [ref=e218]:
              - paragraph [ref=e219]: Producción del periodo
              - paragraph [ref=e220]: $21,109,961.72
              - generic [ref=e221]: Sin periodo anterior para comparar
            - generic [ref=e222]:
              - paragraph [ref=e223]: Gasto del periodo
              - paragraph [ref=e224]: $15,299,737.44
              - generic [ref=e225]: 72.5% de la producción
            - generic [ref=e226]:
              - paragraph [ref=e227]: Utilidad del periodo
              - paragraph [ref=e228]: $5,810,224.28
              - generic [ref=e229]: Margen 27.5% sobre producción
            - generic [ref=e230]:
              - paragraph [ref=e231]: Por pagar
              - paragraph [ref=e232]: $973,531.70
              - generic [ref=e233]: 11 vencidas · $921,631.70
          - generic [ref=e236]:
            - generic [ref=e237]:
              - generic [ref=e238]:
                - heading "Espera visto bueno" [level=2] [ref=e239]
                - paragraph [ref=e240]: Documentos que no avanzan hasta que alguien los autorice.
              - generic [ref=e241]: 34 en total
            - list [ref=e242]:
              - listitem [ref=e243]:
                - link "Requisiciones por autorizar 10 pendientes" [ref=e244] [cursor=pointer]:
                  - /url: /app/admin/requisiciones
                  - generic [ref=e248]: Requisiciones por autorizar
                  - generic [ref=e249]:
                    - generic [aria-hidden] [ref=e250]: 9+
                    - generic [ref=e251]: 10 pendientes
              - listitem [ref=e254]:
                - link "Cuentas por pagar 13 pendientes" [ref=e255] [cursor=pointer]:
                  - /url: /app/admin/cuentas-por-pagar
                  - generic [ref=e259]: Cuentas por pagar
                  - generic [ref=e260]:
                    - generic [aria-hidden] [ref=e261]: 9+
                    - generic [ref=e262]: 13 pendientes
              - listitem [ref=e265]:
                - link "Nóminas cerradas por pagar 2 pendientes" [ref=e266] [cursor=pointer]:
                  - /url: /app/admin/nomina
                  - generic [ref=e272]: Nóminas cerradas por pagar
                  - generic [ref=e273]:
                    - generic [aria-hidden] [ref=e274]: "2"
                    - generic [ref=e275]: 2 pendientes
              - listitem [ref=e278]:
                - link "Caja chica 2 pendientes" [ref=e279] [cursor=pointer]:
                  - /url: /app/admin/caja-chica
                  - generic [ref=e285]: Caja chica
                  - generic [ref=e286]:
                    - generic [aria-hidden] [ref=e287]: "2"
                    - generic [ref=e288]: 2 pendientes
              - listitem [ref=e291]:
                - link "Vales de gasolina 3 pendientes" [ref=e292] [cursor=pointer]:
                  - /url: /app/admin/gasolinas
                  - generic [ref=e296]: Vales de gasolina
                  - generic [ref=e297]:
                    - generic [aria-hidden] [ref=e298]: "3"
                    - generic [ref=e299]: 3 pendientes
              - listitem [ref=e302]:
                - link "Gastos de oficina 3 pendientes" [ref=e303] [cursor=pointer]:
                  - /url: /app/admin/gastos-oficina
                  - generic [ref=e307]: Gastos de oficina
                  - generic [ref=e308]:
                    - generic [aria-hidden] [ref=e309]: "3"
                    - generic [ref=e310]: 3 pendientes
              - listitem [ref=e313]:
                - link "Rentas solicitadas 1 pendiente" [ref=e314] [cursor=pointer]:
                  - /url: /app/admin/rentas
                  - generic [ref=e320]: Rentas solicitadas
                  - generic [ref=e321]:
                    - generic [aria-hidden] [ref=e322]: "1"
                    - generic [ref=e323]: 1 pendiente
          - generic [ref=e326]:
            - generic [ref=e327]:
              - generic [ref=e328]:
                - generic [ref=e329]:
                  - heading "Producción vs. gasto" [level=2] [ref=e330]
                  - paragraph [ref=e331]: Semana por semana, sumando todas las obras del periodo.
                - generic [ref=e332]:
                  - generic [ref=e333]: Producción
                  - generic [ref=e335]: Gasto
              - img [ref=e340]:
                - generic [ref=e344]:
                  - generic [ref=e345]: 14-sep
                  - generic [ref=e347]: 21-sep
                  - generic [ref=e349]: 28-sep
                  - generic [ref=e351]: 05-oct
                  - generic [ref=e353]: 12-oct
                  - generic [ref=e355]: 19-oct
                  - generic [ref=e357]: 26-oct
                  - generic [ref=e359]: 02-nov
                - generic [ref=e362]:
                  - generic [ref=e363]: $0
                  - generic [ref=e365]: $1.5M
                  - generic [ref=e367]: $3.0M
                  - generic [ref=e369]: $4.5M
                  - generic [ref=e371]: $6.0M
              - table [ref=e406]:
                - caption [ref=e407]: Producción y gasto por semana
                - rowgroup [ref=e408]:
                  - row [ref=e409]:
                    - columnheader "Semana" [ref=e410]
                    - columnheader "Producción" [ref=e411]
                    - columnheader "Gasto" [ref=e412]
                    - columnheader "Resultado" [ref=e413]
                - rowgroup [ref=e414]:
                  - row [ref=e415]:
                    - rowheader "14-sep" [ref=e416]
                    - cell "$0.00" [ref=e417]
                    - cell "$0.00" [ref=e418]
                    - cell "$0.00" [ref=e419]
                  - row [ref=e420]:
                    - rowheader "21-sep" [ref=e421]
                    - cell "$2,533,249.15" [ref=e422]
                    - cell "$1,948,974.38" [ref=e423]
                    - cell "$584,274.77" [ref=e424]
                  - row [ref=e425]:
                    - rowheader "28-sep" [ref=e426]
                    - cell "$2,955,432.54" [ref=e427]
                    - cell "$2,185,887.32" [ref=e428]
                    - cell "$769,545.22" [ref=e429]
                  - row [ref=e430]:
                    - rowheader "05-oct" [ref=e431]
                    - cell "$3,377,576.86" [ref=e432]
                    - cell "$2,454,079.12" [ref=e433]
                    - cell "$923,497.74" [ref=e434]
                  - row [ref=e435]:
                    - rowheader "12-oct" [ref=e436]
                    - cell "$3,799,759.02" [ref=e437]
                    - cell "$2,807,051.72" [ref=e438]
                    - cell "$992,707.30" [ref=e439]
                  - row [ref=e440]:
                    - rowheader "19-oct" [ref=e441]
                    - cell "$4,222,034.78" [ref=e442]
                    - cell "$2,929,111.80" [ref=e443]
                    - cell "$1,292,922.98" [ref=e444]
                  - row [ref=e445]:
                    - rowheader "26-oct" [ref=e446]
                    - cell "$4,221,909.37" [ref=e447]
                    - cell "$2,931,799.79" [ref=e448]
                    - cell "$1,290,109.58" [ref=e449]
                  - row [ref=e450]:
                    - rowheader "02-nov" [ref=e451]
                    - cell "$0.00" [ref=e452]
                    - cell "$42,833.33" [ref=e453]
                    - cell "-$42,833.33" [ref=e454]
            - generic [ref=e455]:
              - generic [ref=e456]:
                - generic [ref=e457]:
                  - heading "En qué se fue el gasto" [level=2] [ref=e458]
                  - paragraph [ref=e459]: Categorías del periodo.
                - generic [ref=e460]: $15,299,737.44
              - list [ref=e461]:
                - listitem [ref=e462]:
                  - generic [ref=e463]:
                    - generic [ref=e464]: Almacén
                    - generic [ref=e465]: $7,757,600.00
                  - generic [ref=e466]: 51%
                - listitem [ref=e469]:
                  - generic [ref=e470]:
                    - generic [ref=e471]: Nómina
                    - generic [ref=e472]: $2,359,486.86
                  - generic [ref=e473]: 15%
                - listitem [ref=e476]:
                  - generic [ref=e477]:
                    - generic [ref=e478]: Subcontratos
                    - generic [ref=e479]: $2,296,270.00
                  - generic [ref=e480]: 15%
                - listitem [ref=e483]:
                  - generic [ref=e484]:
                    - generic [ref=e485]: Destajos
                    - generic [ref=e486]: $2,252,740.00
                  - generic [ref=e487]: 15%
                - listitem [ref=e490]:
                  - generic [ref=e491]:
                    - generic [ref=e492]: Rentas
                    - generic [ref=e493]: $437,933.33
                  - generic [ref=e494]: 3%
                - listitem [ref=e497]:
                  - generic [ref=e498]:
                    - generic [ref=e499]: Gasolinas
                    - generic [ref=e500]: $120,200.00
                  - generic [ref=e501]: 1%
                - listitem [ref=e504]:
                  - generic [ref=e505]:
                    - generic [ref=e506]: Caja chica
                    - generic [ref=e507]: $75,507.25
                  - generic [ref=e508]: 0%
              - paragraph [ref=e511]: El gasto incluye almacén consumido, nómina, destajos, subcontratos, rentas, gasolinas y caja chica. Las rentas se prorratean por día.
          - generic [ref=e513]:
            - generic [ref=e514]:
              - generic [ref=e515]:
                - heading "Cartera de obras" [level=2] [ref=e516]
                - paragraph [ref=e517]: Presupuesto autorizado contra lo estimado a la fecha.
              - link "Ver obras" [ref=e518] [cursor=pointer]:
                - /url: /app/obras
            - table [ref=e520]:
              - rowgroup [ref=e521]:
                - row [ref=e522]:
                  - columnheader "Obra" [ref=e523]
                  - columnheader "Contratado" [ref=e524]
                  - columnheader "Estimado" [ref=e525]
                  - columnheader "Avance" [ref=e526]
                  - columnheader "Pend." [ref=e527]
              - rowgroup [ref=e528]:
                - row [ref=e529]:
                  - cell [ref=e530]:
                    - link "Residencial Los Encinos — Torre A" [ref=e531] [cursor=pointer]:
                      - /url: /app/obras/4d616d86-3c6f-5c35-bfa0-b91333ad9796
                    - paragraph [ref=e532]: Inmobiliaria Los Encinos, S.A. de C.V. · Edificación Residencial
                  - cell "$68,203,525.00" [ref=e533]
                  - cell "$11,459,968.58" [ref=e534]
                  - cell "17%" [ref=e535]
                  - cell "14 pendientes" [ref=e539]:
                    - generic [ref=e540]:
                      - generic [aria-hidden] [ref=e541]: 9+
                      - generic [ref=e542]: 14 pendientes
                - row [ref=e543]:
                  - cell [ref=e544]:
                    - link "Ampliación Nave Industrial Bajío" [ref=e545] [cursor=pointer]:
                      - /url: /app/obras/03f8c174-6bfc-5e77-802f-65470a4a1d1d
                    - paragraph [ref=e546]: Logística Integral Bajío, S. de R.L. de C.V. · Nave Industrial y Logística
                  - cell "$42,723,500.00" [ref=e547]
                  - cell "$9,649,993.14" [ref=e548]
                  - cell "23%" [ref=e549]
                  - cell "13 pendientes" [ref=e553]:
                    - generic [ref=e554]:
                      - generic [aria-hidden] [ref=e555]: 9+
                      - generic [ref=e556]: 13 pendientes
                - row [ref=e557]:
                  - cell [ref=e558]:
                    - link "Obra de prueba" [ref=e559] [cursor=pointer]:
                      - /url: /app/obras/58a43d52-9a1e-49e3-9f38-a3bbcfe8bcf8
                    - paragraph [ref=e560]: Logística Integral Bajío, S. de R.L. de C.V. · Nave Industrial y Logística
                  - cell "—" [ref=e561]
                  - cell "$0.00" [ref=e562]
                  - cell "Sin presupuesto autorizado" [ref=e563]
                  - cell "—" [ref=e564]
              - rowgroup [ref=e565]:
                - row [ref=e566]:
                  - cell "Total" [ref=e567]
                  - cell "$110,927,025.00" [ref=e568]
                  - cell "$21,109,961.72" [ref=e569]
                  - cell "19.0% global" [ref=e570]
                  - cell [ref=e571]
          - generic [ref=e573]:
            - generic [ref=e574]:
              - generic [ref=e575]:
                - heading "Cuentas por pagar" [level=2] [ref=e576]
                - paragraph [ref=e577]: 13 documentos abiertos
              - generic [ref=e578]:
                - paragraph [ref=e579]: $973,531.70
                - paragraph [ref=e580]: 11 vencidas · $921,631.70
            - list [ref=e581]:
              - listitem [ref=e582]:
                - generic [ref=e583]:
                  - paragraph [ref=e584]: Transportes y Grúas del Centro, S.A. de C.V.
                  - paragraph [ref=e585]: $36,500.00
                - generic [ref=e586]:
                  - paragraph [ref=e587]: CxP-2026-0050 · GD-2026-0002 · Servicio de grúa para montaje de columnas prefabricadas
                  - generic [ref=e588]: Vencida 10-oct
              - listitem [ref=e589]:
                - generic [ref=e590]:
                  - paragraph [ref=e591]: Estructuras Metálicas del Bajío, S.A. de C.V.
                  - paragraph [ref=e592]: $65,000.00
                - generic [ref=e593]:
                  - paragraph [ref=e594]: CxP-2026-0052 · GD-2026-0007 · Montaje de estructura metálica de la ampliación
                  - generic [ref=e595]: Vencida 17-oct
              - listitem [ref=e596]:
                - generic [ref=e597]:
                  - paragraph [ref=e598]: Ferretería Industrial León, S.A. de C.V.
                  - paragraph [ref=e599]: $9,800.00
                - generic [ref=e600]:
                  - paragraph [ref=e601]: CxP-2026-0061 · GO-2026-0009 · Mantenimiento preventivo de aire acondicionado
                  - generic [ref=e602]: Vencida 30-oct
              - listitem [ref=e603]:
                - generic [ref=e604]:
                  - paragraph [ref=e605]: Transportes y Grúas del Centro, S.A. de C.V.
                  - paragraph [ref=e606]: $18,500.00
                - generic [ref=e607]:
                  - paragraph [ref=e608]: CxP-2026-0043 · Renta Grúa telescópica 25 toneladas · 2026-10-17–2026-10-17
                  - generic [ref=e609]: Vencida 01-nov
              - listitem [ref=e610]:
                - generic [ref=e611]:
                  - paragraph [ref=e612]: Transportes y Grúas del Centro, S.A. de C.V.
                  - paragraph [ref=e613]: $18,500.00
                - generic [ref=e614]:
                  - paragraph [ref=e615]: CxP-2026-0044 · Renta Grúa telescópica 25 toneladas · 2026-10-18–2026-10-18
                  - generic [ref=e616]: Vencida 02-nov
            - generic [ref=e617]:
              - generic [ref=e618]: Saldo en cuentas $5,855,861.41 (3 activas)
              - link "Ver todas" [ref=e619] [cursor=pointer]:
                - /url: /app/admin/cuentas-por-pagar
  - region "Notifications alt+T"
  - alert [ref=e620]: Dashboard · ERP PNF
  - generic [aria-hidden] [ref=e621]: $0
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
> 10 |     await expect.poll(() => chart.locator("style").evaluate((el) => Boolean(el.nonce && el.sheet))).toBe(true);
     |                                                                                                     ^ Error: expect(received).toBe(expected) // Object.is equality
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
  49 |   await expect(page.getByRole("button", { name: "Crear usuario", exact: true })).toBeFocused();
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