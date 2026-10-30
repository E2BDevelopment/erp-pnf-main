# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y.spec.ts >> accesibilidad WCAG 2.1 AA >> landing sin violaciones críticas ni serias (hallazgo A11Y-01)
- Location: tests\e2e\a11y.spec.ts:38:3

# Error details

```
Error: color-contrast (serious): Elements must meet minimum color contrast ratio thresholds — 5 nodo(s)
label-content-name-mismatch (serious): Elements must have their visible text as part of their accessible name — 1 nodo(s)

expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 236

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f6f5f1",
+               "contrastRatio": 2.55,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#9c9b95",
+               "fontSize": "8.2pt (10.88px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.55 (foreground color: #9c9b95, background color: #f6f5f1, font size: 8.2pt (10.88px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<section class=\"landing-problem\" id=\"soluciones\">",
+                 "target": Array [
+                   "#soluciones",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.55 (foreground color: #9c9b95, background color: #f6f5f1, font size: 8.2pt (10.88px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>01</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".landing-problem-list > p:nth-child(1) > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f6f5f1",
+               "contrastRatio": 2.55,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#9c9b95",
+               "fontSize": "8.2pt (10.88px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.55 (foreground color: #9c9b95, background color: #f6f5f1, font size: 8.2pt (10.88px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<section class=\"landing-problem\" id=\"soluciones\">",
+                 "target": Array [
+                   "#soluciones",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.55 (foreground color: #9c9b95, background color: #f6f5f1, font size: 8.2pt (10.88px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>02</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "p:nth-child(2) > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f6f5f1",
+               "contrastRatio": 2.55,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#9c9b95",
+               "fontSize": "8.2pt (10.88px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.55 (foreground color: #9c9b95, background color: #f6f5f1, font size: 8.2pt (10.88px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<section class=\"landing-problem\" id=\"soluciones\">",
+                 "target": Array [
+                   "#soluciones",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.55 (foreground color: #9c9b95, background color: #f6f5f1, font size: 8.2pt (10.88px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>03</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "p:nth-child(3) > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#f6f5f1",
+               "contrastRatio": 2.55,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#9c9b95",
+               "fontSize": "8.2pt (10.88px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.55 (foreground color: #9c9b95, background color: #f6f5f1, font size: 8.2pt (10.88px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<section class=\"landing-problem\" id=\"soluciones\">",
+                 "target": Array [
+                   "#soluciones",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.55 (foreground color: #9c9b95, background color: #f6f5f1, font size: 8.2pt (10.88px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span>04</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "p:nth-child(4) > span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ffffff",
+               "contrastRatio": 2.05,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#f6a16e",
+               "fontSize": "8.2pt (10.88px)",
+               "fontWeight": "bold",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.05 (foreground color: #f6a16e, background color: #ffffff, font size: 8.2pt (10.88px), font weight: bold). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<section class=\"landing-mexico\" id=\"nosotros\">",
+                 "target": Array [
+                   "#nosotros",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 2.05 (foreground color: #f6a16e, background color: #ffffff, font size: 8.2pt (10.88px), font weight: bold). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"landing-kicker\"><span></span> CONSTRUIDO ALREDEDOR DE LA OBRA</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".landing-mexico-grid > div:nth-child(1) > .landing-kicker",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+   Object {
+     "description": "Ensure that elements labelled through their content must have their visible text as part of their accessible name",
+     "help": "Elements must have their visible text as part of their accessible name",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.14/label-content-name-mismatch?application=playwright",
+     "id": "label-content-name-mismatch",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "label-content-name-mismatch",
+             "impact": "serious",
+             "message": "Text inside the element is not included in the accessible name",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Text inside the element is not included in the accessible name",
+         "html": "<a aria-label=\"ERP PNF, inicio\" class=\"landing-brand\" href=\"/\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "a[aria-label=\"ERP PNF, inicio\"]",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.semantics",
+       "wcag21a",
+       "wcag253",
+       "EN-301-549",
+       "EN-9.2.5.3",
+       "RGAAv4",
+       "RGAA-6.1.5",
+     ],
+   },
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - link "ERP PNF, inicio" [ref=e6] [cursor=pointer]:
          - /url: /
          - generic [ref=e7]:
            - strong [ref=e8]: NARANJA FORTE
            - generic [ref=e9]: ERP para constructoras
        - navigation "Navegación principal" [ref=e10]:
          - link "Plataforma" [ref=e11] [cursor=pointer]:
            - /url: "#plataforma"
          - link "Soluciones" [ref=e12] [cursor=pointer]:
            - /url: "#soluciones"
          - link "Beneficios" [ref=e13] [cursor=pointer]:
            - /url: "#beneficios"
          - link "Nosotros" [ref=e14] [cursor=pointer]:
            - /url: "#nosotros"
        - generic [ref=e15]:
          - link "Iniciar sesión" [ref=e16] [cursor=pointer]:
            - /url: /login
          - link "Crear cuenta" [ref=e17] [cursor=pointer]:
            - /url: /onboarding
    - main [ref=e18]:
      - generic [ref=e19]:
        - generic [ref=e20]:
          - generic [ref=e21]:
            - paragraph [ref=e22]: CONSTRUCTION MANAGEMENT SOFTWARE
            - heading "Tu constructora. Todos sus proyectos. Un solo lugar." [level=1] [ref=e24]:
              - generic [ref=e25]: Tu constructora.
              - generic [ref=e27]: Todos sus proyectos.
              - generic [ref=e29]: Un solo lugar.
            - paragraph [ref=e31]: Administra obras, equipos, presupuestos y operaciones desde una plataforma diseñada para las necesidades de las constructoras mexicanas.
            - generic [ref=e32]: UNA OPERACIÓN, CADA RESPONSABILIDAD CLARA
          - generic [ref=e34]:
            - generic [ref=e35]:
              - text: OBRA
              - strong [ref=e36]: POR PROYECTO
            - generic [ref=e37]:
              - text: VISTO BUENO
              - strong [ref=e38]: POR RESPONSABLE
            - generic "Vista ilustrativa de módulos de ERP PNF" [ref=e39]:
              - generic [ref=e40]:
                - generic [ref=e41]:
                  - generic [ref=e42]: P
                  - generic [ref=e43]: Obra · Control operativo
                - generic [ref=e44]: Vista ilustrativa
              - generic [ref=e45]:
                - complementary [aria-hidden] [ref=e46]:
                  - generic [ref=e47]: Obra
                  - generic [ref=e53]: Requisiciones
                  - generic [ref=e58]: Caja chica
                  - generic [ref=e62]: Estimaciones
                - generic [ref=e65]:
                  - generic [ref=e66]:
                    - generic [ref=e67]:
                      - paragraph [ref=e68]: CONTROL DE OBRA
                      - heading "Semana de trabajo" [level=2] [ref=e69]
                    - generic [ref=e70]: Ciclo semanal
                  - generic [ref=e71]:
                    - generic [ref=e72]:
                      - generic [ref=e73]: Presupuesto autorizado
                      - generic [ref=e74]: Seguimiento por renglón
                    - generic [ref=e77]: Estimaciones · Compras · Gastos
                  - generic [ref=e82]: EN SEGUIMIENTO
                  - generic [ref=e83]:
                    - generic [ref=e89]:
                      - strong [ref=e90]: Material para obra
                      - generic [ref=e91]: Requisición · Supervisor
                    - generic [ref=e92]: Por autorizar
                  - generic [ref=e93]:
                    - generic [ref=e97]:
                      - strong [ref=e98]: Cierre semanal
                      - generic [ref=e99]: Nómina · Almacén · Caja chica
                    - generic [ref=e100]: En revisión
                  - generic [ref=e101]: Cada movimiento queda asociado a su obra y autorización.
        - generic [ref=e105]:
          - generic [ref=e106]: Del frente de trabajo
          - generic [ref=e108]: al cierre semanal
      - generic [ref=e110]:
        - generic [ref=e111]:
          - paragraph [ref=e112]: LA REALIDAD DE LA OBRA
          - heading "Una obra no debería administrarse entre hojas de cálculo, mensajes y documentos dispersos." [level=2] [ref=e114]
          - paragraph [ref=e115]: Cuando la información está fragmentada, coordinar proyectos y tomar decisiones se vuelve más complicado.
        - generic [ref=e116]:
          - paragraph [ref=e117]:
            - generic [ref=e118]: "01"
            - text: Información distribuida entre distintas herramientas
          - paragraph [ref=e119]:
            - generic [ref=e120]: "02"
            - text: Seguimiento manual de proyectos y actividades
          - paragraph [ref=e121]:
            - generic [ref=e122]: "03"
            - text: Responsabilidades y avances difíciles de consultar
          - paragraph [ref=e123]:
            - generic [ref=e124]: "04"
            - text: Menos visibilidad sobre costos y recursos
      - generic [ref=e126]:
        - generic [ref=e127]:
          - generic [ref=e128]:
            - paragraph [ref=e129]: UNA OPERACIÓN CONECTADA
            - heading "Del requerimiento al pago, con control en cada paso." [level=2] [ref=e131]
          - paragraph [ref=e132]: La operación conserva su contexto desde la solicitud en obra hasta la cuenta por pagar y el pago en tesorería.
        - list "Flujo de compra de obra" [ref=e133]:
          - listitem [aria-hidden] [ref=e134]
          - listitem [ref=e135]:
            - generic [ref=e141]: Requisición
          - listitem [ref=e142]:
            - generic [ref=e147]: Visto bueno
          - listitem [ref=e148]:
            - generic [ref=e153]: Cotizaciones
          - listitem [ref=e154]:
            - generic [ref=e160]: Orden de compra
          - listitem [ref=e161]:
            - generic [ref=e173]: Recepción
          - listitem [ref=e174]:
            - generic [ref=e178]: Pago
        - paragraph [ref=e183]: El visto bueno queda ligado a la operación, junto con el responsable y la obra que la originó.
      - generic [ref=e185]:
        - generic [ref=e186]:
          - generic [ref=e187]:
            - paragraph [ref=e188]: HERRAMIENTAS PARA LA OBRA
            - heading "Las herramientas que tu constructora necesita para avanzar." [level=2] [ref=e190]
          - paragraph [ref=e191]: Una plataforma que reúne procesos diarios de campo y oficina, organizados alrededor de cada obra.
        - generic [ref=e192]:
          - article [ref=e193]:
            - heading "Obras y proyectos" [level=3] [ref=e200]
            - paragraph [ref=e201]: Presupuesto, equipo y operación por obra.
            - generic [ref=e202]: 01 / 06
          - article [ref=e203]:
            - heading "Personal y asignaciones" [level=3] [ref=e210]
            - paragraph [ref=e211]: Roles, responsables y permisos configurables.
          - article [ref=e212]:
            - heading "Presupuestos y costos" [level=3] [ref=e217]
            - paragraph [ref=e218]: Seguimiento por renglón, estimaciones y gastos.
          - article [ref=e219]:
            - heading "Compras y almacén" [level=3] [ref=e231]
            - paragraph [ref=e232]: De la requisición a la recepción de materiales.
          - article [ref=e233]:
            - heading "Nómina y destajos" [level=3] [ref=e237]
            - paragraph [ref=e238]: Captura y seguimiento con ciclo semanal.
          - article [ref=e239]:
            - heading "Tesorería y reportes" [level=3] [ref=e243]
            - paragraph [ref=e244]: Pagos y condensado semanal de la operación.
      - generic [ref=e246]:
        - generic [ref=e247]:
          - paragraph [ref=e248]: TRABAJO EN CAMPO Y OFICINA
          - heading "El trabajo cambia según el rol. La información sigue conectada." [level=2] [ref=e250]
          - paragraph [ref=e251]: Una misma obra reúne al equipo de campo, al Supervisor, a Administración y a Dirección, cada quien con sus permisos.
        - generic [ref=e252]:
          - article [ref=e253]:
            - generic [ref=e259]:
              - heading "Varias obras, una misma operación" [level=3] [ref=e260]
              - paragraph [ref=e261]: Cada obra conserva su presupuesto, equipo, cliente y contrato. Consulta la operación por proyecto.
          - article [ref=e262]:
            - generic [ref=e267]:
              - heading "Responsables y autorizaciones por rol" [level=3] [ref=e268]
              - paragraph [ref=e269]: Dirección, Residente, Auxiliar, Supervisor y Administración trabajan con permisos y responsabilidades claras.
          - article [ref=e270]:
            - generic [ref=e274]:
              - heading "Captura en obra, seguimiento en oficina" [level=3] [ref=e275]
              - paragraph [ref=e276]: El equipo de campo registra desde el celular. Oficina y Dirección revisan la operación desde escritorio.
      - generic [ref=e278]:
        - generic [ref=e279]:
          - paragraph [ref=e280]: CONSTRUIDO ALREDEDOR DE LA OBRA
          - heading "Tecnología pensada para la realidad de las constructoras mexicanas." [level=2] [ref=e282]
          - paragraph [ref=e283]: "Una plataforma en español que sigue el orden de trabajo de una constructora: presupuesto por renglón, requisiciones, visto bueno, compras, recepción y pago."
          - link "Ver el flujo de trabajo" [ref=e284] [cursor=pointer]:
            - /url: "#flujo"
        - generic "Diagrama de procesos de obra" [ref=e287]:
          - generic [ref=e288]:
            - generic [ref=e289]: BITÁCORA DE OPERACIÓN
            - generic [ref=e290]: ERP PNF / 001
          - generic [ref=e291]:
            - generic [ref=e292]: OBRA
            - generic [ref=e294]: PRESUPUESTO
            - generic [ref=e296]: OPERACIÓN
            - generic [ref=e298]: CIERRE
          - generic [ref=e299]: PRESUPUESTO → REQUISICIÓN → AUTORIZACIÓN → PAGO
      - generic [ref=e301]:
        - generic [ref=e302]:
          - paragraph [ref=e303]: BUILD BEYOND
          - heading "Es momento de construir una operación más organizada." [level=2] [ref=e305]
          - paragraph [ref=e306]: Conoce la plataforma y organiza el equipo, los permisos y la primera obra de tu empresa.
        - link "Crear cuenta de empresa" [ref=e307] [cursor=pointer]:
          - /url: /onboarding
    - contentinfo [ref=e308]:
      - generic [ref=e309]:
        - link "NARANJA FORTE ERP para constructoras" [ref=e310] [cursor=pointer]:
          - /url: /
          - generic [ref=e311]:
            - strong [ref=e312]: NARANJA FORTE
            - generic [ref=e313]: ERP para constructoras
        - generic [ref=e314]: Software de gestión para constructoras mexicanas.
        - generic [ref=e315]:
          - link "Iniciar sesión" [ref=e316] [cursor=pointer]:
            - /url: /login
          - link "Crear cuenta" [ref=e317] [cursor=pointer]:
            - /url: /onboarding
        - generic [ref=e318]: © 2026 ERP PNF
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e324] [cursor=pointer]
  - alert [ref=e328]
```

# Test source

```ts
  1  | import AxeBuilder from "@axe-core/playwright";
  2  | import { expect, test, type Page } from "@playwright/test";
  3  | import { DEMO_USERS, login } from "./helpers";
  4  | 
  5  | const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
  6  | 
  7  | async function analizar(page: Page, nombre: string) {
  8  |   const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  9  |   await test.info().attach(`axe-${nombre}.json`, {
  10 |     body: JSON.stringify(results, null, 2),
  11 |     contentType: "application/json",
  12 |   });
  13 | 
  14 |   const bloqueantes = results.violations.filter(
  15 |     (violation) => violation.impact === "critical" || violation.impact === "serious",
  16 |   );
  17 | 
  18 |   expect(
  19 |     bloqueantes,
  20 |     bloqueantes
  21 |       .map(
  22 |         (violation) =>
  23 |           `${violation.id} (${violation.impact}): ${violation.help} — ${violation.nodes.length} nodo(s)`,
  24 |       )
  25 |       .join("\n"),
> 26 |   ).toEqual([]);
     |     ^ Error: color-contrast (serious): Elements must meet minimum color contrast ratio thresholds — 5 nodo(s)
  27 | 
  28 |   return results;
  29 | }
  30 | 
  31 | test.describe("accesibilidad WCAG 2.1 AA", () => {
  32 |   /**
  33 |    * Hallazgo A11Y-01 (serio): la landing nueva tiene 5 nodos con contraste
  34 |    * insuficiente (numeración 01-04 y kicker naranja) y el logo del header usa
  35 |    * aria-label sin incluir el texto visible. Se documenta como fallo esperado
  36 |    * para que el suite distinga defectos conocidos de regresiones nuevas.
  37 |    */
  38 |   test("landing sin violaciones críticas ni serias (hallazgo A11Y-01)", async ({ page }) => {
  39 |     test.fail(
  40 |       true,
  41 |       "A11Y-01: 5 nodos con contraste insuficiente y logo con label-content-name-mismatch",
  42 |     );
  43 |     await page.goto("/");
  44 |     await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  45 |     await analizar(page, "landing");
  46 |   });
  47 | 
  48 |   test("login sin violaciones críticas ni serias", async ({ page }) => {
  49 |     await page.goto("/login");
  50 |     await expect(page.getByText("Iniciar sesión", { exact: true })).toBeVisible();
  51 |     await analizar(page, "login");
  52 |   });
  53 | 
  54 |   /**
  55 |    * El contraste de los badges de pendientes se midió en 4.45:1 y 4.2:1 en una
  56 |    * corrida intermedia, pero con la carga de datos ya asentada axe no reporta
  57 |    * violaciones. Se espera explícitamente el panel para evitar el falso positivo
  58 |    * por analizar la página antes de que termine de pintar.
  59 |    */
  60 |   test("dashboard del director sin violaciones críticas ni serias", async ({ page }) => {
  61 |     await login(page, DEMO_USERS.director);
  62 |     await page.waitForLoadState("networkidle");
  63 |     await expect(page.getByText("Espera visto bueno", { exact: true })).toBeVisible();
  64 |     await analizar(page, "dashboard");
  65 |   });
  66 | });
  67 | 
```