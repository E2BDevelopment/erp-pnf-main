# Auditoría posterior a harden — ERP PNF

Fecha: 6 de noviembre de 2026. Auditoría de código y aplicación renderizada. No se realizaron correcciones de interfaz ni se guardaron formularios.

## Veredicto de integridad

**Aprobado en coherencia del sistema; pendiente de aprobación para entrega.** Las correcciones iniciales funcionan: las series recuperaron sus colores, facturación y alta de equipo tienen etiquetas, los filtros tienen un modelo de selección válido y las páginas públicas recuperaron contraste y nombres accesibles correctos. La revisión ampliada descubre fallos en trabajadores, proveedores y estados secundarios de configuración.

El producto mantiene su vocabulario, jerarquía, navegación por obra y sistema de grafito/naranja. La deuda restante es de accesibilidad y consistencia de implementación; no requiere sustituir la identidad visual.

## Puntuación

| Dimensión | Antes | Ahora | Evidencia |
|---|---:|---:|---|
| Accesibilidad | 2/4 | 2/4 | Correcciones verificadas, pero hay interacción anidada en trabajadores y dos controles sin nombre en estados ampliados. |
| Rendimiento | 3/4 | 3/4 | Importaciones diferidas conservadas; muestra local de producción, sin perfil de CPU ni datos de campo. |
| Temas y tokens | 2/4 | 2/4 | Gráficas corregidas; persiste la paleta literal de la superficie pública. |
| Adaptación móvil | 3/4 | 3/4 | Sin desbordamiento del documento; categorías tiene desplazamiento horizontal interno y campos comprimidos. |
| Integridad | 2/4 | 3/4 | CSP y filtros corregidos; deuda localizada en patrones secundarios y CSS público. |
| **Total** | **12/20** | **13/20** | **Aceptable: todavía requiere trabajo significativo.** |

**7 problemas agrupados: P0: 0 · P1: 3 · P2: 4 · P3: 0.** No se cuentan por separado los nodos repetidos ni cada tamaño de pantalla. La cobertura de esta pasada es mayor: los P1 actuales no demuestran una regresión de harden, sino defectos detectados en superficies que la primera muestra no había evaluado con este detalle.

La puntuación es orientativa para esta muestra y no una certificación WCAG de todo el ERP.

## Evidencia y alcance

- Aplicación local de producción en Edge Chromium headless, usando la compilación Webpack validada al terminar harden. El servidor temporal escuchó únicamente en `127.0.0.1`.
- 34 estados principales en 15 URLs, a 1440 × 900 y 360 × 900, con reglas axe WCAG 2 A/AA, 2.1 A/AA y 2.2 AA. Se esperó la carga de red. Movimiento reducido activado para separar problemas persistentes de la animación de entrada.
- Siete estados adicionales de configuración y confirmación, más comprobaciones específicas de teclado y layout interno. Las acciones de edición y confirmación se abrieron sin guardarlas ni ejecutarlas.
- Landing, recorrido, login, dashboard, facturación, configuración general, equipo, cuatro catálogos, alta de usuario e insumo, categorías, unidades y rutas de obra. Se amplió configuración a identidad, cuentas, permisos, documentos, notificaciones y edición de unidad de negocio.
- La ruta de nómina se exploró sin errores axe en su estado mostrado; no se considera cobertura del cierre semanal ni de su formulario de captura.
- Detector de fuente: **209 avisos orientativos**, todos en `globals.css`: 137 de color, 54 de tamaño, 17 de radio y uno de cuadrícula. No son 209 defectos independientes.
- Detector público renderizado: **34 alertas**; desapareció la alerta de contraste de la pasada anterior. Produjo JSON utilizable pero devolvió código 1 sin diagnóstico adicional, por lo que se usa como evidencia auxiliar, no como certificado de ejecución completa. Axe y las mediciones independientes sustentan los hallazgos.
- Se inspeccionaron visualmente categorías y el estado de teclado de trabajadores. Las mediciones y capturas completas quedan en esta carpeta.
- No se ejecutaron build ni suites de negocio nuevamente. No hubo cambios funcionales en esta auditoría. No se probó lector de pantalla real, software de voz, dispositivo físico, zoom 200/400 % ni gestos táctiles sintetizados.
- Modo oscuro excluido: el sistema documentado lo mantiene sin publicar.

## P1 — Corregir antes de entrega

### 1. Las filas de trabajadores contienen controles interactivos anidados

**Ubicación:** `src/components/trabajadores/CatalogoTrabajadoresModule.tsx:313`, `:317`, `:320` y `:377`.

**Categoría:** Accesibilidad / integridad.

**Evidencia:** las 103 filas de la muestra usan `<li role="button" tabIndex={0}>` y contienen un botón de menú. Axe informa 103 nodos `nested-interactive` y un fallo `list`: el `<ul>` pierde hijos con semántica de ítem de lista. El contenedor de acciones detiene `click`, pero no el evento de teclado que asciende hasta la fila.

**Reproducción:** enfocar el primer «Más acciones del trabajador» y pulsar Espacio. Se abre la ficha del trabajador en lugar de quedar disponible el menú esperado. El DOM de la ficha contiene `role="dialog"` con `aria-hidden="true"`; el árbol accesible no expone menú ni diálogo. Captura `trabajadores-keyboard.png` y datos `interaction.json`.

**Impacto:** un usuario de teclado puede activar la acción equivocada; quien usa tecnología de asistencia queda sin acceso semántico a la superficie abierta.

**Estándar:** WCAG 1.3.1 y 4.1.2; afecta la operación por teclado de 2.1.1.

**Recomendación:** conservar cada fila como ítem de lista no interactivo y separar un enlace/botón de apertura de la ficha del botón de acciones. Eliminar el handler general que interpreta Espacio/Enter de sus descendientes. Verificar menú, ficha, Escape y retorno del foco con teclado.

**Comando sugerido:** `$impeccable harden`.

### 2. Persisten dos controles sin etiqueta en configuración

**Ubicación:** `src/components/configuracion/IdentidadTab.tsx:106` y `:124`; `src/components/configuracion/UnidadesNegocioManager.tsx:99`.

**Categoría:** Accesibilidad.

**Evidencia:** el input de archivo para el logo no está asociado al `Label` visible. Al abrir la edición de una unidad de negocio, el input de nombre tampoco tiene etiqueta, `aria-label` ni `aria-labelledby`. Axe confirma `label` en ambos estados. No se trata de los campos de facturación ya corregidos.

**Impacto:** el lector de pantalla no puede identificar el propósito de cargar un archivo o editar el nombre de la unidad.

**Estándar:** WCAG 1.3.1 y 4.1.2.

**Recomendación:** asociar la etiqueta del logo con su input; nombrar el campo de edición por su propósito y, si ayuda a distinguir filas, por la unidad que se edita. Probar estos estados abiertos, no solo la vista inicial de General.

**Comando sugerido:** `$impeccable harden`.

### 3. El badge Contratista no alcanza contraste AA

**Ubicación:** `src/components/terceros/constants.ts:21`, consumido por el catálogo de proveedores/contratistas.

**Categoría:** Accesibilidad / temas.

**Evidencia:** `bg-teal-600 text-white` produce blanco sobre `#009689`, **3.66:1** a 12 px. Axe lo confirma en cuatro filas, tanto a 360 como a 1440 px.

**Impacto:** cuesta distinguir la categoría para usuarios con baja visión o bajo condiciones de iluminación difíciles.

**Estándar:** WCAG 1.4.3; también se aparta de la gramática pastel `-100/-800` documentada para sellos.

**Recomendación:** usar una combinación de relleno y tinta que alcance 4.5:1 y siga la gramática existente; verificar el resto de los valores de `CATEGORIA_BADGE` en su fondo real.

**Comando sugerido:** `$impeccable colorize`.

## P2 — Próxima pasada

### 4. Categorías comprime la captura y oculta acciones lateralmente

**Ubicación:** `src/components/insumos/CatalogoInsumosModule.tsx:866`, `:913` y `:917`.

**Categoría:** Adaptación móvil.

**Evidencia:** a 360 px el diálogo mide 328 px. La lista tiene 292 px de área útil y 400 px de contenido horizontal; el input de nueva categoría mide aproximadamente 71 px. En las filas pendientes, nombre y estado se comprimen y las acciones Rechazar/Eliminar quedan fuera del área inicial. Ver `categories-layout.json` y `categorias-360.png`.

**Impacto:** requiere desplazarse en dos ejes para revisar y autorizar; el nombre completo no se puede leer de un vistazo al capturarlo.

**Estándar:** requisito de operación móvil de PRODUCT.md. No se declara infracción de reflow por el mero hecho de existir scroll interno.

**Recomendación:** apilar nombre y estado en móvil, colocar las acciones en una segunda fila y dar ancho completo al nombre en el alta. Conservar la vista compacta de escritorio.

**Comando sugerido:** `$impeccable adapt`.

### 5. Texto funcional de la página pública entre 8 y 10.56 px

**Ubicación:** `src/app/globals.css:1139`, `:1164`, `:1165` y `:1178`.

**Categoría:** Adaptación móvil / tipografía.

**Evidencia:** estados del ejemplo a 8 px, metadatos a 8.8 px y responsables del flujo a 10.56 px. El detector informa 23 alertas `undersized-ui-text` y cuatro `tiny-text`; la medición del navegador confirma los tamaños.

**Impacto:** los estados y responsables del proceso resultan difíciles de leer a tamaño normal en teléfono.

**Estándar:** legibilidad y sistema tipográfico del producto. WCAG no impone un mínimo absoluto de píxeles; no se presenta esta observación como infracción AA automática.

**Recomendación:** llevar la información necesaria para entender el flujo a 12–14 px y simplificar el ejemplo para mantener la composición móvil.

**Comando sugerido:** `$impeccable typeset`.

### 6. CSS público mantiene una paleta paralela y reglas sucesivas

**Ubicación:** `src/app/globals.css:989` en adelante; ejemplos `:1007`, `:1139` y `:1217`.

**Categoría:** Temas / integridad.

**Evidencia:** 137 avisos de color, 54 de tamaño y 17 de radio concentrados en el mismo archivo. Los valores públicos incluyen `#f36b21`, `#222326` y `#f6f5f1`, diferentes de los tokens del sistema. Hay bloques sucesivos que redefinen la landing.

**Impacto:** una corrección de marca o contraste en los tokens centrales puede dejar sin actualizar las páginas públicas; las redefiniciones dificultan saber qué regla decide el resultado final.

**Estándar:** reglas de tokens de DESIGN.md.

**Recomendación:** consolidar las reglas activas y resolver la paleta mediante tokens. Si existe una excepción pública intencional, documentarla después de decidirla, sin añadir valores solo para silenciar avisos.

**Comando sugerido:** `$impeccable distill`; `$impeccable document` si se acepta una ampliación del sistema.

### 7. Las confirmaciones no heredan la alternativa de movimiento reducido

**Ubicación:** `src/components/ui/alert-dialog.tsx:22` y `:41`.

**Categoría:** Accesibilidad / movimiento.

**Evidencia:** la confirmación de baja conserva `animation-name: enter` y duración 0.2 s con `prefers-reduced-motion: reduce`. Dialog y Sheet sí incorporan la alternativa corregida; AlertDialog usa otra implementación y quedó fuera.

**Impacto:** quien solicita menos movimiento sigue recibiendo el zoom de las confirmaciones.

**Estándar:** preferencia de usuario; no se declara infracción AA automática.

**Recomendación:** aplicar a overlay y contenido de AlertDialog la misma alternativa sin desplazamiento/zoom, conservando la confirmación y la gestión de foco.

**Comando sugerido:** `$impeccable animate`.

## Alertas no elevadas a defectos confirmados

- **Dashboard móvil, «9+» frente al total completo:** persisten dos avisos `label-content-name-mismatch`. El nombre incluye «pendientes» y el número real; el badge visible trunca. Sigue pendiente una comprobación con voz para decidir la solución sin empeorar la lectura accesible. La guía de [WCAG sobre Label in Name](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html) exige evaluar el texto visible y su función; no basta con declarar automáticamente que toda diferencia es falsa o que cambiar mayúsculas arregla el problema.
- **Contraste de la confirmación durante la entrada:** la primera captura informó 4.27:1. Tras esperar un segundo, axe no detectó violaciones y la opacidad era 1. No se cuenta como fallo persistente de contraste. El movimiento sí se cuenta por separado.
- **Cuadrícula de construcción, Inter y avisos de composición:** la cuadrícula pertenece a la representación contextual de obra; Inter está fijada por DESIGN.md. «Iconos en cajas», tarjetas anidadas y un encabezado desbalanceado no prueban por sí mismos defectos técnicos.
- **Targets de 32/36 px:** no se declaran infracción AA por tamaño solamente. Deben considerarse las excepciones de espaciado y equivalentes de WCAG 2.5.8.

## Lo corregido que se mantiene

- Landing, recorrido y login: sin violaciones de las reglas axe ejecutadas a ambos tamaños.
- Dashboard de escritorio: sin violaciones axe; producción naranja y gasto rojo verificados en los paths SVG de producción.
- Facturación y alta de usuario: controles nombrados. Los cuatro catálogos conservaron nombres en filtros y selectores; las alertas nuevas de proveedores/trabajadores pertenecen a badges y filas.
- Filtros Todos/Pendientes: desapareció la relación ARIA a paneles inexistentes.
- Configuración de obra, nuevo insumo, categorías y unidades: sin violaciones axe en sus estados escaneados. Esto no evita el problema de layout interno de categorías.
- Cierre compartido de Dialog/Sheet ampliado y loader con alternativa reducida conservados en fuente. La prueba interactiva de carga lenta había aprobado en harden; no se repitió en esta pasada.
- Los 34 estados principales y los siete adicionales conservaron el ancho del documento. La excepción observada es interna al diálogo de categorías.

## Rendimiento: alcance de la conclusión

La ejecución de producción mantuvo las importaciones diferidas de gráficas, Excel y loader. La primera carga local de la landing transfirió aproximadamente 269 KB de JavaScript, con caché y recursos de la sesión registrados en `runtime.json`; las rutas posteriores reutilizan caché, por lo que sus transferencias no sirven para comparar el coste total de cada ruta.

No hay evidencia suficiente en esta muestra para afirmar problemas de FPS, layout thrashing o Core Web Vitals. Tampoco para conceder 4/4: faltan perfil de CPU, dispositivo de campo y conexión limitada. El error de Turbopack descrito en harden no se intentó corregir ni se atribuye a la interfaz.

## Orden de acciones

1. **P1 — `$impeccable harden`:** separar acciones de las filas de trabajadores y etiquetar logo/edición de unidad.
2. **P1 — `$impeccable colorize`:** contraste del badge Contratista.
3. **P2 — `$impeccable adapt`:** composición del diálogo de categorías a 360 px.
4. **P2 — `$impeccable typeset`:** estados y responsables del recorrido público.
5. **P2 — `$impeccable animate`:** movimiento reducido de AlertDialog.
6. **P2 — `$impeccable distill`:** consolidar el CSS público.
7. **Final — `$impeccable polish`:** comprobar visualmente el resultado a ambos tamaños.

Puedes pedir ejecutar los pasos uno por uno, todos juntos o en el orden que prefieras. Repetir `$impeccable audit` después de corregir para actualizar la puntuación.

## Archivos de evidencia

`runtime.json` contiene los 34 estados principales; `extra.json`, los siete adicionales. `interaction.json` reproduce teclado y confirma el contraste estable de la confirmación. `categories-layout.json` mide el desbordamiento interno. Los scripts `scan.mjs`, `extra.mjs` e `interaction.mjs` son diagnósticos locales y las capturas `.png` muestran cada estado. Se conservan los informes anteriores sin sobrescribirlos.
