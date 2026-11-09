# Auditoría técnica de interfaz — ERP PNF

Fecha: 6 de noviembre de 2026. Estado auditado: árbol de trabajo actual, incluidos los cambios locales existentes. No se modificó código de producto.

## Veredicto de integridad

**Aprobado en coherencia de producto; no listo para cerrar calidad de interfaz.** La navegación por obra, los pendientes de autorización, la densidad de tablas y los tokens de grafito/naranja expresan un sistema propio. Sin embargo, hay fallos reproducibles de nombres accesibles, relaciones ARIA y representación de series. El detector de fuente encontró 211 avisos, todos orientativos y concentrados en `globals.css`; no equivalen a 211 defectos. La comprobación renderizada añadió 35 alertas que se revisaron por contexto.

## Resultado

| Dimensión | Puntos | Evidencia principal |
|---|---:|---|
| Accesibilidad | 2/4 | Facturación tiene 11 inputs y 2 selectores sin nombre accesible. |
| Rendimiento | 3/4 | Gráficas, Excel y Lottie se importan de forma diferida; sin perfil de producción. |
| Temas y tokens | 2/4 | Las variables de las series no se resuelven y ambas aparecen negras. |
| Adaptación móvil | 3/4 | Sin desbordamiento global en la muestra a 360 px; cierre de diálogo de 16 × 16 px. |
| Integridad de implementación | 2/4 | Filtros con semántica de tabs sin panel y deriva de estilos públicos. |
| **Total** | **12/20** | **Aceptable: requiere trabajo significativo.** |

Puntuación orientativa para la muestra revisada, no certificación WCAG ni evaluación exhaustiva del ERP. Se identifican **9 problemas agrupados: P0: 0, P1: 5, P2: 4, P3: 0**. La severidad de axe («critical») no se convierte automáticamente en P0.

## Método y límites

- Lectura de `PRODUCT.md`, `DESIGN.md`, componentes compartidos, shells, formularios, gráficas y páginas públicas.
- Detector Impeccable en `src` y página pública renderizada a 360 × 800.
- Playwright con Edge Chromium headless y axe, reglas WCAG 2 A/AA, 2.1 A/AA y 2.2 AA, con viewports de 1440 × 900 y 360 × 900.
- 24 capturas de estado inicial en 12 rutas: landing, recorrido, login, dashboard, configuración de empresa, equipo, catálogos, obras y cuatro rutas de una obra demo. Una segunda pasada de 7 estados esperó datos y animaciones, e incluyó Crear usuario. La cuenta usada fue Director demo. No se guardaron formularios.
- Se inspeccionaron visualmente las capturas estables de dashboard, configuración móvil y Crear usuario. La ruta de nómina se abrió como exploración; no se considera cobertura validada de su operación ni captura semanal.
- No se probaron usuarios de otros perfiles, teclado completo, lector de pantalla real, zoom al 200/400 %, teclado virtual, gestos táctiles sintetizados ni dispositivo físico. Cambiar el viewport no demuestra funcionamiento táctil.
- No se midieron Core Web Vitals ni bundle de producción. No se ejecutó build ni suites de negocio: el entregable es diagnóstico de UI, sin cambios funcionales.
- Modo oscuro excluido: DESIGN.md establece que está dormido y no hay selector. Su ausencia no es defecto.

## Hallazgos P1

### 1. Campos de captura sin nombre accesible

**Ubicación:** `src/components/configuracion/FacturacionTab.tsx:157`, `src/components/equipo/EquipoModule.tsx:263`, `src/components/insumos/CatalogoInsumosModule.tsx:612`, `src/components/insumos/SolicitarInsumoRapidoDialog.tsx:94`, `src/components/clientes/CatalogoClientesModule.tsx:236` y `src/app/(authenticated)/app/obras/[obraId]/configuracion/page.tsx:209`.

**Categoría:** Accesibilidad. **Evidencia:** la pasada estable detectó 11 inputs y 2 comboboxes sin nombre en facturación; Crear usuario añadió 2 inputs y 1 combobox. Configuración de obra tiene 2 comboboxes sin nombre. Los componentes de insumos repiten en fuente el patrón de `Label` separado sin `htmlFor` y control sin `id`.

**Impacto:** quien usa lector de pantalla no puede identificar con seguridad RFC, razón social, nombre, correo o tipo de selección. Pulsar la etiqueta tampoco lleva al control.

**Estándar:** WCAG 1.3.1 y 4.1.2. **Recomendación:** asociar `htmlFor`/`id`; nombrar los selectores por su propósito mediante etiqueta vinculada, sin depender del valor seleccionado ni del placeholder. Asociar también ayudas y errores con `aria-describedby`. **Comando:** `$impeccable harden`.

### 2. Producción y gasto se dibujan del mismo color

**Ubicación:** `src/components/ui/chart.tsx:81` y `src/components/dashboard/ProduccionGastoChart.tsx:60`. Componente compartido también consumido por `src/components/estado-resultados/HistorialChart.tsx`.

**Categoría:** Temas / integridad. **Evidencia:** captura estable del dashboard con ambas series negras; `getComputedStyle(path).fill` devuelve `rgb(0, 0, 0)` para producción y gasto. `--primary` y `--color-primary` existen, pero `--color-produccion` está vacío en los paths. La leyenda sí usa naranja y rojo. Ver `chart-and-controls.json`.

**Impacto:** la comparación visual no permite asociar las barras con su leyenda con seguridad, justo en una decisión central de Dirección.

**Estándar:** Series Rule de DESIGN.md; revisar además alternativas que no dependan solo del color. **Recomendación:** revisar la emisión y aplicación de reglas de `ChartStyle` hasta que las variables de ambas series tengan valores computados; validar también el consumidor de estado de resultados. No se afirma una causa exacta todavía. **Comando:** `$impeccable harden`.

### 3. Contraste insuficiente en la numeración de la landing

**Ubicación:** `src/app/globals.css:1059`.

**Categoría:** Accesibilidad. **Evidencia:** cuatro nodos «01–04», tanto a 1440 como a 360 px: `#9c9b95` sobre `#f6f5f1`, contraste **2.55:1**, tamaño 10.88 px.

**Impacto:** la numeración que organiza el contenido se pierde para usuarios con baja visión o en pantallas de poco contraste.

**Estándar:** WCAG 1.4.3 cuando se conserva como información textual. **Recomendación:** usar tinta con contraste mínimo 4.5:1; si se confirma que es decoración redundante, retirarla de la información accesible y documentar esa intención. **Comando:** `$impeccable colorize`.

### 4. El nombre accesible del enlace de marca omite su texto visible

**Ubicación:** `src/app/page.tsx:96`, `src/app/recorrido/page.tsx:66`.

**Categoría:** Accesibilidad. **Evidencia:** el enlace muestra «NARANJA FORTE / ERP para constructoras», pero `aria-label` lo reemplaza por «ERP PNF, inicio». Reproducido en ambos tamaños.

**Impacto:** una orden por voz basada en el texto que el usuario ve puede no encontrar el enlace.

**Estándar:** WCAG 2.5.3, Label in Name. **Recomendación:** conservar el nombre visible dentro del nombre accesible, preferentemente dejando que el contenido del enlace lo proporcione. **Comando:** `$impeccable harden`.

### 5. Filtros implementados como tabs apuntan a paneles inexistentes

**Ubicación:** `src/components/clientes/CatalogoClientesModule.tsx:186`. Patrón repetido en `CatalogoTerceroModule.tsx:219` y `CatalogoTrabajadoresModule.tsx:205`, pendiente de ejercicio renderizado en esos dos consumidores.

**Categoría:** Accesibilidad / integridad. **Evidencia:** axe estable reporta `aria-valid-attr-value`: el tab Todos declara `aria-controls="…content-todos"`, pero ese panel no existe. El código usa `TabsList`/`TabsTrigger` para filtrar un listado externo, sin `TabsContent`.

**Impacto:** el lector de pantalla recibe una relación a contenido inexistente y un modelo de navegación que no corresponde al control.

**Estándar:** WCAG 4.1.2; patrón ARIA Tabs. **Recomendación:** usar controles de filtro con estado seleccionado o proporcionar paneles correctamente asociados si realmente son pestañas. **Comando:** `$impeccable harden`.

## Hallazgos P2

### 6. Cierre de paneles con área táctil de 16 × 16 px

**Ubicación:** `src/components/ui/dialog.tsx:44`, `src/components/ui/sheet.tsx:122`.

**Categoría:** Adaptación móvil. **Evidencia:** botón Close del diálogo Crear usuario medido en 16 × 16 px; el botón del sheet repite en fuente un icono de 16 px sin padding.

**Impacto:** cerrar una captura con una mano exige demasiada precisión en campo. **Estándar:** revisar WCAG 2.5.8 con sus excepciones de espaciado; el tamaño por sí solo no prueba una infracción AA. **Recomendación:** ampliar el área a 44 × 44 px conservando el icono y separación de otros controles; localizar «Close» a «Cerrar». **Comando:** `$impeccable adapt`.

### 7. Texto informativo excesivamente pequeño en móvil público

**Ubicación:** `src/app/globals.css:1164`, `:1165` y `:1178`.

**Categoría:** Adaptación móvil / tipografía. **Evidencia:** reglas de 8.8 px para metadatos del ejemplo, 8 px para sus estados y 10.56 px para responsables del flujo. El detector confirma 23 alertas de texto funcional bajo 11 px, además de cuatro de texto diminuto; no todas representan controles independientes.

**Impacto:** cuesta leer los estados y quién interviene sin ampliar la página. **Estándar:** calidad de legibilidad; WCAG no establece un tamaño mínimo absoluto en píxeles. **Recomendación:** priorizar 12–14 px para estados y responsables, simplificando el ejemplo a 360 px. **Comando:** `$impeccable typeset`.

### 8. La superficie pública acumula valores ajenos al sistema documentado

**Ubicación:** `src/app/globals.css:989` en adelante; ejemplos `:1007`, `:1038` y `:1059`.

**Categoría:** Temas / integridad. **Evidencia:** el escáner de fuente agrupa 139 avisos de color, 54 de tamaño y 17 de radio, todos en este archivo. Existen colores literales públicos como `#f36b21`, `#222326` y `#f6f5f1`, distintos de los tokens documentados, además de bloques sucesivos que redefinen selectores de la landing.

**Impacto:** corregir el token global de contraste o marca no corrige estas superficies; mantener estilos sucesivos aumenta el riesgo de que una regla antigua siga influyendo.

**Estándar:** uso de tokens de DESIGN.md. **Recomendación:** decidir qué valores públicos son intencionales, consolidar las reglas activas y asignarles tokens de superficie. La cantidad de avisos no demuestra por sí misma que cada valor esté mal. No actualizar DESIGN.md solo para silenciar el detector. **Comando:** `$impeccable distill` y, si se acepta ampliar el sistema, `$impeccable document`.

### 9. Preferencia de movimiento reducido incompleta

**Ubicación:** `src/components/LoadingOverlay.tsx:20`, `src/components/ui/dialog.tsx:38`, `src/components/ui/sheet.tsx:36`.

**Categoría:** Accesibilidad / movimiento. **Evidencia:** Lottie se inicia con `loop: true` y `autoplay: true` sin consultar la preferencia. El diálogo mantiene `animation-name: enter` y duración 0.2 s bajo `reducedMotion: reduce`; el shell GSAP sí consulta `MOTION_OK`.

**Impacto:** usuarios que solicitan menos movimiento siguen recibiendo bucles y zoom/deslizamientos. **Estándar:** preferencia de usuario; no se declara incumplimiento AA automático por esta observación. **Recomendación:** reemplazar el bucle por un indicador estático accesible y usar aparición sin desplazamiento/zoom para paneles bajo esa preferencia, preservando el estado de carga. **Comando:** `$impeccable animate`.

## Alertas descartadas o no elevadas

- Contraste del badge del dashboard durante su entrada: la primera pasada midió 4.41:1, pero desapareció al esperar datos y animaciones. El dashboard estable de escritorio no presentó violaciones axe. No se cuenta como defecto persistente.
- Recorrido: axe señaló seis números de paso con 3.93:1, pero son `aria-hidden` y redundantes con la secuencia ordenada. No se suman como seis infracciones WCAG; su tratamiento decorativo debe conservarse.
- Dashboard móvil: axe señala dos diferencias entre «9+» visible y el número completo del nombre accesible de pendientes. Se conserva la evidencia; no se suma sin validar el resultado de voz/lector y la intención del truncado.
- El detector de grid decorativo señala un dibujo de construcción: es una referencia contextual de la superficie pública, no prueba de defecto funcional. Inter está fijada por DESIGN.md y no se reemplaza por su alerta de fuente frecuente.
- Las advertencias de tarjetas anidadas, iconos y encabezado desbalanceado requieren juicio visual y no son fallos técnicos demostrados por sí mismas.
- Los controles de 32/36 px no se marcan automáticamente como infracción AA: se deben evaluar área, espaciado y equivalentes.

## Lo que funciona

- Shell con `main`, destino de contenido, navegación nombrada, foco visible y `aria-current` en barra móvil.
- Capturas estables de login sin violaciones axe en ambos tamaños; dashboard de escritorio también, dentro de las reglas ejecutadas.
- Sin desbordamiento horizontal del documento en los 24 estados iniciales medidos. Tablas y pestañas contienen su desplazamiento.
- Separación correcta entre naranja de relleno y tinta, números tabulares y vocabulario propio de construcción.
- Importación diferida de Recharts, XLSX y Lottie; animaciones GSAP acotadas con limpieza y preferencia reducida en varios componentes.

## Orden recomendado

1. **P1 — `$impeccable harden`:** nombres de campos y selectores, enlaces de marca, semántica de filtros y resolución de variables de gráficas.
2. **P1 — `$impeccable colorize`:** contraste de la numeración pública.
3. **P2 — `$impeccable adapt` y `$impeccable typeset`:** cierres táctiles y textos de estados/responsables en móvil.
4. **P2 — `$impeccable animate`:** alternativa de movimiento reducido para loader y paneles.
5. **P2 — `$impeccable distill`:** consolidar CSS público; `$impeccable document` solo para decisiones de sistema aceptadas.
6. **Final — `$impeccable polish`:** comprobar visualmente los cambios a 360 y 1440 px.

Puedes pedir ejecutar estos pasos uno por uno, todos juntos o en el orden que prefieras. Repetir `$impeccable audit` después de corregir para actualizar el resultado.

## Evidencia reproducible

- `detector-source.json`: salida completa del detector de fuente.
- `detector-mobile.json`: salida renderizada pública.
- `runtime.json`: mediciones exploratorias por ruta y ancho.
- `verification.json`: resultados estables, prevalecen sobre la primera pasada.
- `chart-and-controls.json`: colores calculados, área de cierre y movimiento reducido.
- `stable-*.png`, `crear-usuario-360.png`: capturas estables.
- `scan.mjs`, `verify.mjs`, `chart-check.mjs`: scripts locales de diagnóstico. Requieren el servidor local, Edge y datos demo; no son pruebas incorporadas al suite de producto.
