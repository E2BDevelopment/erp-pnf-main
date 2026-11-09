# Auditoría posterior a polish — ERP PNF

6 de noviembre de 2026. Se auditó el estado actual sin modificar la interfaz ni guardar formularios.

## Veredicto de integridad

**Aprobado en coherencia de producto y en los recorridos comprobados.** La navegación por obra, los controles de autorización, la densidad operativa y la gramática de color corresponden al ERP documentado. Las correcciones de harden, colorize y polish se mantienen en producción local. La deuda verificada restante se concentra en el CSS público y en seis textos del diagrama ilustrativo.

No se identificaron P0 ni P1 nuevos confirmados en la muestra. Persisten dos avisos automáticos de nombre accesible en dashboard móvil que requieren una decisión tras probar control por voz; no se declaran resueltos ni se cuentan como dos defectos confirmados.

## Resultado

| Dimensión | Auditoría anterior | Ahora | Motivo |
|---|---:|---:|---|
| Accesibilidad | 2/4 | 3/4 | Desaparecieron los controles sin nombre, la interacción anidada y el contraste insuficiente de contratistas. Queda la revisión de «9+». |
| Rendimiento | 3/4 | 3/4 | Se mantienen importaciones diferidas y no hay regresión identificada; falta perfil bajo conexión/dispositivo limitados. |
| Temas y tokens | 2/4 | 2/4 | Gráficas y sellos correctos; siguen valores literales y redefiniciones en CSS público. |
| Adaptación móvil | 3/4 | 4/4 | Categorías y filtros caben en 320/768 px; menú y desplazamiento de pestañas funcionan con entrada táctil sintetizada. |
| Integridad | 3/4 | 3/4 | Patrones operativos coherentes; persiste deuda localizada en estilos públicos. |
| **Total** | **13/20** | **15/20** | **Bueno: atender las dimensiones pendientes.** |

**Problemas confirmados: P0: 0 · P1: 0 · P2: 2 · P3: 0.** Se agrupan por causa y no por cantidad de nodos. Puntuación orientativa para las pantallas y estados comprobados, no certificación WCAG del ERP completo.

## Método y cobertura

- Servidor temporal de producción local, compilado con Webpack al terminar polish y escuchando solo en `127.0.0.1`. El servidor se detuvo al terminar la auditoría.
- Edge Chromium headless, sesión de Director demo y reglas axe WCAG 2 A/AA, 2.1 A/AA y 2.2 AA.
- **34 estados principales y siete adicionales**: landing, recorrido, login, dashboard, facturación, General, equipo, clientes, insumos, proveedores, trabajadores, categorías, unidades, obras y estados de configuración. Los tamaños principales fueron 360 × 900 y 1440 × 900.
- Estados secundarios: identidad, cuentas, permisos, documentos, notificaciones, edición de unidad de negocio y confirmación de baja abierta sin ejecutarla.
- Pruebas complementarias de layout a **320 y 768 px**, categorías internas, ficha táctil y texto al 200 % mediante cambio temporal del tamaño raíz de fuente. Este último es un ensayo de ampliación de texto, no una prueba completa de zoom nativo del navegador.
- Entrada táctil sintetizada mediante Playwright/CDP: toque sobre menú y ficha; gesto de desplazamiento horizontal en pestañas. El menú fue visible, el scroll de pestañas pasó de 0 a 25 px y Escape devolvió el foco al botón original.
- Detector de fuente: **201 avisos orientativos** —137 de color, 46 de tamaño, 17 de radio y uno de cuadrícula— concentrados en `globals.css`. Antes eran 209. No son 201 defectos independientes.
- Detector público renderizado: **16 alertas**, frente a 34 de la pasada anterior. Los seis avisos de texto funcional diminuto corresponden al diagrama semanal. Desaparecieron los avisos de los estados y metadatos del ejemplo corregido. El comando produjo JSON pero devolvió código 1 sin diagnóstico adicional; se utiliza como evidencia auxiliar, junto a las mediciones independientes.
- No se repitieron build ni las 11 pruebas E2E de polish: no hubo cambios de producto desde esa validación. Esta auditoría sí volvió a ejecutar mediciones renderizadas independientes.
- No se probaron otros perfiles, dispositivo físico, lector de pantalla real, software de voz, todas las operaciones de negocio ni todos los estados de error. La ruta de nómina se exploró, sin validar su cierre ni captura semanal.
- Modo oscuro excluido porque DESIGN.md lo mantiene sin publicar.

## P2 — Hallazgos confirmados

### 1. El CSS público sigue manteniendo valores paralelos al sistema

**Ubicación:** `src/app/globals.css:984` en adelante; ejemplos en las reglas de `.landing-page`, `.landing-header`, `.landing-cta` y `.landing-tour-*`.

**Categoría:** Temas / integridad de implementación.

**Evidencia:** continúan 137 avisos de color, 46 de tamaño y 17 de radio fuera de la documentación del detector. Hay valores públicos como `#f36b21`, `#222326` y `#f6f5f1` y bloques sucesivos que redefinen selectores. El problema no es que todos esos valores sean visualmente incorrectos, sino que la superficie pública no depende de una única fuente documentada de estilos.

**Impacto:** cambiar marca, contraste o espaciado en los tokens centrales puede dejar diferencias en la landing y el recorrido; las redefiniciones hacen más costosa la verificación.

**Estándar:** reglas de tokens y consistencia de DESIGN.md. No se atribuye una infracción WCAG automática por usar un literal.

**Recomendación:** consolidar reglas activas, retirar las sustituidas y resolver los valores repetidos mediante tokens existentes. Documentar cualquier excepción pública deliberada después de decidirla. No añadir valores a DESIGN.md solo para silenciar el detector.

**Comando sugerido:** `$impeccable distill`; `$impeccable document` si se acepta ampliar el sistema.

### 2. El diagrama semanal conserva texto informativo de 8–9 px

**Ubicación:** `src/app/globals.css:1094`, `:1096`, `:1186` y `:1188`; diagrama de la sección `cierre-semanal` de `src/app/page.tsx`.

**Categoría:** Adaptación móvil / tipografía.

**Evidencia:** a 360 px, «CIERRE SEMANAL» y «POR OBRA» miden **8.32 px**; «NÓMINA», «ALMACÉN», «CAJA CHICA» y «RESUMEN», **8.96 px**. Tanto el detector como el estilo calculado del navegador confirman los seis textos. Los estados del ejemplo y los responsables del flujo sí quedaron corregidos en polish.

**Impacto:** leer los nombres de las etapas del diagrama exige ampliar la página, aunque el resto de la sección se entiende y el recorrido no queda bloqueado.

**Estándar:** calidad de legibilidad y jerarquía tipográfica del producto. WCAG no establece un tamaño mínimo absoluto en píxeles; no se presenta esto como infracción AA automática.

**Recomendación:** llevar los nombres necesarios para entender el diagrama a 12 px y reorganizarlo o simplificarlo en móvil, sin ampliar todo el bloque como una imagen.

**Comando sugerido:** `$impeccable typeset`.

## Aviso pendiente: nombre accesible del contador «9+»

**Ubicación:** `src/components/dashboard/DashboardModule.tsx:734` y `src/components/PendientesBadge.tsx:30`.

Axe sigue señalando dos enlaces del dashboard móvil: visualmente muestran «9+ Pendientes», mientras su `aria-label` anuncia el total exacto —14 o 13— y la obra. El nombre conserva la palabra Pendientes y proporciona un conteo más preciso, pero no incluye la cadena visible «9+».

Se mantiene como revisión pendiente, sin afirmar que sea un falso positivo ni una infracción confirmada por el solo resultado automático. Falta probar las órdenes de voz basadas en el texto visible y escoger una solución que conserve el conteo exacto. La referencia normativa para la evaluación es [WCAG 2.5.3, Label in Name](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html).

No se debe anunciar conformidad AA completa mientras esta diferencia siga sin resolver y no se haya probado el resto del producto.

## Correcciones verificadas

| Hallazgo anterior | Estado actual |
|---|---|
| Trabajadores: filas con controles anidados y ficha oculta tras Espacio | Sin fallos `list` ni `nested-interactive` en ambos tamaños. Menú y ficha funcionan con toque; foco restaurado. |
| Input del logo y edición de unidad sin nombre | Sin violaciones axe en ambos estados de configuración. |
| Badge Contratista con contraste 3.66:1 | Sin infracciones de contraste detectadas en proveedores a 360/1440 px. |
| Categorías con contenido de 400 px en 292 px | Sin desbordamiento interno: 252/252 px a viewport 320 y 460/460 px a viewport 768. |
| Filtros desbordados a 768 px | Documentos de proveedores e insumos permanecen en 768 px. También caben en 320 px. |
| Estados y metadatos del ejemplo público diminutos | No reaparecen los avisos correspondientes; queda únicamente el diagrama semanal indicado arriba. |
| Confirmaciones animadas bajo movimiento reducido | `animation-name: none`, duración `0s`, sin violaciones axe en la confirmación estable. |
| Gráficas negras y estilos rechazados por CSP | Paths de producción naranja y gasto rojo en la muestra actual. |

## Resultados positivos y límites de las mediciones

- **40 de los 41 estados axe** no presentaron violaciones de las reglas ejecutadas. La única excepción es dashboard móvil con los dos avisos del contador descritos arriba.
- No hubo desbordamiento global en los 41 estados principales/adicionales. A 320 px una lectura inicial de la landing registró 322 px; la comprobación posterior del estado cargado dio 320 px y ningún elemento desbordado. No se eleva esa lectura transitoria a defecto persistente.
- El ensayo de facturación con texto al 200 % mantuvo el ancho de documento y los controles visibles en la captura. Las pestañas siguen permitiendo desplazamiento interno.
- La navegación, los estados de autorización y los sellos conservan texto además del color. Los cierres compartidos mantienen áreas de 44 × 44 px y foco visible.
- Se mantienen las importaciones diferidas de Recharts, Excel y Lottie. Los datos de navegación/transferencia de `runtime.json` son muestras locales con caché de sesión; no se utilizan como Core Web Vitals ni para comparar el coste total entre rutas.
- No se observaron pruebas de layout thrashing o degradación de FPS en esta revisión; tampoco se midieron lo suficiente como para conceder 4/4 en rendimiento.
- La cuadrícula del dibujo, Inter y advertencias de composición del detector se evaluaron en contexto: la primera corresponde al tema de obra y la fuente está fijada por DESIGN.md. No se tratan como defectos técnicos por sí mismas.

## Orden recomendado

1. **P2 — `$impeccable distill`:** consolidar los estilos públicos y sus tokens.
2. **P2 — `$impeccable typeset`:** resolver los seis textos diminutos del diagrama semanal.
3. **Por validar — `$impeccable harden`:** probar voz y decidir el nombre del contador sin perder el total real.
4. **Final — `$impeccable polish`:** verificar visualmente los cambios aceptados.

Puedes pedir ejecutar estos pasos uno por uno, todos juntos o en el orden que prefieras. Repetir `$impeccable audit` tras las correcciones para actualizar la puntuación.

## Evidencia

- `runtime.json`: 34 estados principales, capturas y métricas calculadas.
- `extra.json`: siete estados secundarios de configuración y confirmación.
- `responsive.json`: anchos, layout interno, toque, deslizamiento y retorno del foco.
- `landing-320-layout.json`: comprobación estable del posible desbordamiento inicial.
- `detector-source.json` y `detector-mobile.json`: avisos completos del detector.
- `scan.mjs`, `extra.mjs`, `responsive.mjs` y capturas `.png`: diagnóstico reproducible local. Los informes anteriores no se sobrescribieron.
