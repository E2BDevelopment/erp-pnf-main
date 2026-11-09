# Harden → Colorize → Polish

6 de noviembre de 2026. Trabajo aplicado sobre los hallazgos de la auditoría posterior a harden, conservando los cambios locales previos.

## Harden

- Las filas de trabajadores vuelven a ser ítems de lista. La apertura de ficha y el menú de acciones son botones independientes: Espacio sobre el menú ya no abre una ficha oculta para tecnologías de asistencia.
- Escape devuelve el foco al botón que abrió la ficha. Se mantienen los permisos y operaciones existentes.
- El archivo del logo tiene etiqueta e instrucciones asociadas. Los campos de nueva unidad y edición de unidad de negocio tienen nombres accesibles.
- AlertDialog respeta movimiento reducido y contiene su altura en pantallas pequeñas.

## Colorize

Los badges Proveedor, Contratista y Ambos comparten ahora la gramática existente: relleno pastel, tinta oscura, etiqueta textual, sin borde ni sombra. El cambio se aplica tanto al catálogo como al detalle mediante las constantes compartidas. La prueba de contraste axe pasa en proveedores.

Se conservaron grafito y naranja como estructura y acción del ERP. No se cambió la identidad visual ni se añadió una paleta de decoración.

## Polish

- Categorías: el nombre ocupa el ancho disponible en móvil; prefijo y alta quedan en una segunda fila. Los nombres, estados y acciones de cada categoría se distribuyen sin desplazamiento horizontal.
- La lista móvil pasó de 400 px de contenido en 292 px visibles a **292/292 px**. El campo de nombre pasó de aproximadamente 71 px a **294 px**.
- Los filtros de proveedores e insumos se adaptan al espacio que queda después del sidebar a 768 px. Antes la revisión visual detectó anchos de documento de 965 y 797 px respectivamente; ahora ambos permanecen en 768 px.
- La ficha de trabajador reserva espacio al cierre, muestra el nombre sin truncarlo, permite desplazar las pestañas en móvil y parte correos largos dentro de sus celdas.
- Estados, metadatos y responsables del ejemplo público usan 12 px como mínimo. El estado del ejemplo pasa a una segunda fila en móvil para mantener el texto legible. Se ajustó el espaciado de la cabecera y se retiró un selector que ya no correspondía al enlace de marca.

## Validación final

- **11 pruebas E2E aprobadas** en `tests/e2e/a11y.spec.ts` y `tests/e2e/ui-hardening.spec.ts`, incluyendo teclado, foco, nombres accesibles, contraste, colores bajo CSP, carga lenta, movimiento reducido y layout móvil/tableta.
- **15 estados renderizados** en Edge Chromium a 360, 390, 768 y 1440 px: cero violaciones de las reglas axe ejecutadas y cero desbordamientos globales. Resultados en `verification.json`.
- Verificación con teclado y toques emulados de la ficha y el menú de trabajador. No se confirmó ninguna autorización, baja ni eliminación.
- Capturas inspeccionadas visualmente de la ficha móvil, categorías y landing. Se corrigieron los problemas de tableta y el solapamiento del cierre detectados durante esta revisión.
- ESLint de los archivos revisados: cero errores; tres advertencias preexistentes relacionadas con dependencias de `useMemo`.
- La compilación de producción se valida con Webpack. El fallo de Turbopack documentado anteriormente no forma parte de este cambio y no se cambió el comando de build del proyecto.

## Alcance y límites

No se guardaron datos de empresa durante la validación, no se modificó autorización de negocio ni aislamiento entre empresas y no se añadieron dependencias.

No se probó dispositivo físico ni lector de pantalla real. El resultado de axe se refiere a los estados ejecutados, no a una certificación completa del ERP. Se mantiene para otra tarea la consolidación general de los bloques CSS públicos y la alerta previamente documentada del badge «9+» en dashboard móvil; no se declara resuelta esa revisión de voz ni se recalculó la puntuación de auditoría.
