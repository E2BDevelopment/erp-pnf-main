# Distill → typeset → polish

Fecha: 2026-11-06. Alcance: páginas públicas `/` y `/recorrido`, estilos y animaciones compartidas. Se conserva el sistema de DESIGN.md, Inter y las fuentes de respaldo existentes.

## Cambios

- Se consolidaron los estilos públicos en `src/app/landing.css`, importado desde `globals.css`. El bloque pasó de 389 reglas y 1194 declaraciones a 314 reglas y 1044 declaraciones; de 39849 a 39497 bytes. No quedan colores literales en ese archivo: la paleta depende de los tokens existentes, incluidos los colores semánticos de estado.
- La consolidación, antes de los ajustes intencionales de color y tipografía, produjo cero diferencias en los estilos calculados comparados (`cascade-comparison.json`).
- Se unificaron los roles pequeños en etiquetas de 12 px y cuerpo de 14 px. Se conservaron los títulos fluidos y las medidas de lectura. El diagrama semanal tiene etiquetas de 12 px y disposición vertical hasta 980 px, horizontal en escritorio.
- Se retiraron 17 líneas de animaciones dirigidas a elementos inexistentes. Se conserva el ámbito y la limpieza de `useGSAP`.
- Se añadió una prueba que verifica el tamaño mínimo de las siete etiquetas del diagrama y su ajuste en cuatro anchos.

## Verificación

- Inspección visual de ambas rutas a 320, 360, 768, 980 y 1440 px: diez estados, sin desbordamiento del documento ni infracciones detectadas por axe (`verification.json` y capturas `after-*`).
- Diagrama con texto al 200 %: etiquetas de 24 px sin desbordamiento interno a 360 y 1440 px (`text-scaling.json`).
- Sin errores de consola en las capturas públicas ni avisos de objetivos GSAP ausentes con movimiento habilitado (`motion-errors.json`).
- El detector tipográfico pasó de 46 a 18 avisos orientativos y conserva cero hallazgos primarios. Los avisos restantes corresponden a extremos de títulos fluidos y textos introductorios de 1 rem conservados intencionalmente.
- ESLint de los archivos TypeScript modificados y revisión de espacios con `git diff --check`: correctos.
- Compilación de producción y comprobación TypeScript con `next build --webpack`: correctas.
- E2E sobre producción: 10 de 12 pruebas pasaron en la ejecución estándar. Gráficas y filtros de clientes agotaron la espera de 15 segundos al cargar Dashboard; la traza registró archivos JavaScript locales con HTTP 200 que tardaron más de 18 segundos. Ambas pasaron al repetir únicamente esos casos con una configuración temporal de espera de 45 segundos, sin cambiar sus comprobaciones. Resultado combinado: los 12 casos validados; la ejecución estándar no quedó completamente verde. Evidencia en `.tmp/distill-production` y `.tmp/distill-production-slow`.

Las capturas automatizadas y axe no sustituyen una revisión con lector de pantalla ni dispositivos físicos. No se modificaron autorizaciones, aislamiento por empresa ni datos de negocio.
