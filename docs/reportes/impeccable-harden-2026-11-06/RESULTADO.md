# Endurecimiento de interfaz — 6 de noviembre de 2026

Se corrigieron los hallazgos técnicos de accesibilidad e integridad del informe de auditoría, conservando los cambios locales previos y las reglas de producto.

## Cambios

- Etiquetas asociadas a inputs y selectores de facturación, configuración general, equipo, insumos y datos de obra. También se nombraron filtros de los cuatro catálogos y campos de equipo/comisiones de obra.
- Filtros Todos/Pendientes convertidos de pestañas sin panel a selección única, con estado accesible y navegación por flechas/espacio. La selección activa no se puede vaciar.
- Nombres de marca derivados del texto visible en landing y recorrido, sin reemplazarlos por un nombre distinto.
- Numeración pública con tinta de contraste suficiente, usando el token existente.
- Gráficas con estilos autorizados por el nonce CSP del documento. La causa confirmada era un `<style>` sin nonce; además, una navegación RSC puede traer un nonce distinto que no reemplaza la política del documento. Se conserva el nonce inicial hasta una recarga completa. No se relajó la CSP.
- Cierres de diálogos y sheets de 44 × 44 px; «Cerrar» localizado. Los diálogos de alta y edición de equipo devuelven el foco al botón que los abrió.
- Movimiento reducido en apertura/cierre de diálogos y sheets. El loader usa texto estático bajo esa preferencia, responde a cambios durante la carga, destruye Lottie y limpia su listener al desmontarse.
- La prueba de accesibilidad pública dejó de estar marcada como fallo esperado.

## Validación

- TypeScript sin errores.
- Siete pruebas E2E distintas aprobadas en las pasadas de validación: landing, login, dashboard, colores bajo CSP con recarga y navegación cliente, etiquetas/foco móvil, selección por teclado y carga lenta con cambios de movimiento reducido.
- Revisión renderizada con Edge Chromium a 360 × 900 y 1440 × 900, incluyendo nombres largos, acentos, CJK y emoji sin guardar datos. Sin desbordamiento del documento en la muestra.
- Revisión visual de dashboard, formulario largo y diálogo de usuario. Gráficas naranja/rojo confirmadas; cierre medido en 44 × 44 px y animación `none` bajo movimiento reducido.
- Revisión de reglas `label`, `button-name`, `aria-valid-attr-value` y `label-content-name-mismatch` en configuración, equipo, cuatro catálogos, alta de insumo y configuración de obra: sin violaciones en esos estados. Evidencia en `verification.json` y capturas de esta carpeta.
- Compilación de producción completada con `node node_modules/next/dist/bin/next build --webpack`.
- `npm run build` con Turbopack falla al iniciar su proceso auxiliar de CSS, tanto dentro como fuera del sandbox. No se cambió el bundler del proyecto; la compilación alternativa valida el código, pero no resuelve ese fallo de herramientas.

## Límites y pendientes

La tipografía diminuta y la consolidación del CSS público permanecen para `typeset`/`distill`. No se recalculó la puntuación de auditoría. Persiste la alerta previamente documentada sobre «9+» y el conteo completo del nombre accesible de pendientes en dashboard móvil; requiere validar la experiencia de voz antes de cambiar el contador.

Las comprobaciones se hicieron con viewport emulado y teclado en Edge, sin lector de pantalla real, dispositivo físico ni gestos táctiles sintetizados. No se enviaron formularios ni se cambiaron datos de empresa. El siguiente paso de acabado es `$impeccable polish`.
