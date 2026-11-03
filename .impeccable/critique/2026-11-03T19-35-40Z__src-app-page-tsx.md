---
target_identity: "file:C:\\Users\\enriq\\OneDrive\\Documentos\\Naranja Forte\\erp-pnf-main\\erp-pnf-main\\src\\app\\page.tsx"
target_fingerprint: "sha256:47eaeb6cf84800979fa7d642d4f2b472c54cced7f4b0f93c00b49ec4678a3900"
target_path: "C:\\Users\\enriq\\OneDrive\\Documentos\\Naranja Forte\\erp-pnf-main\\erp-pnf-main\\src\\app\\page.tsx"
timestamp: 2026-11-03T19-35-40Z
slug: src-app-page-tsx
target: src/app/page.tsx
total_score: 26
max_score: 40
na_heuristics: ""
p0_count: 0
p1_count: 2
---
Method: dual-agent (A: /root/critique_design · B: /root/critique_evidence)

# Evaluación de diseño — landing de ERP PNF

## Design Health Score

| # | Heurística | Puntaje | Hallazgo principal |
|---|---|---:|---|
| 1 | Visibilidad del estado del sistema | 3/4 | La vista se identifica como ilustrativa; el onboarding comunica “Paso 1 de 2” solo en texto. |
| 2 | Correspondencia con el mundo real | 4/4 | Vocabulario y secuencia de compra reflejan la operación de obra mexicana. |
| 3 | Control y libertad | 3/4 | Hay rutas claras a inicio de sesión y registro; el menú móvil se cierra al volver a activarlo. |
| 4 | Consistencia y estándares | 3/4 | Navegación y controles son coherentes; los beneficios se repiten en varias secciones. |
| 5 | Prevención de errores | 2/4 | El registro empieza pidiendo tipo de persona, razón social y RFC sin anticipar el motivo ni el resultado. |
| 6 | Reconocimiento antes que recuerdo | 3/4 | Roles y módulos son visibles, aunque términos como “destajo” y “condensado semanal” no se explican. |
| 7 | Flexibilidad y eficiencia | 2/4 | Dirección, obra y administración comparten la misma ruta, sin accesos por rol ni demo. |
| 8 | Diseño estético y minimalista | 3/4 | La jerarquía es fuerte, pero seis módulos y varios bloques vuelven a explicar beneficios similares. |
| 9 | Reconocer, diagnosticar y recuperarse de errores | 2/4 | No hay guía visible para RFC ni una ruta de ayuda/contacto en el primer paso del registro. |
| 10 | Ayuda y documentación | 1/4 | La landing no ofrece FAQ, glosario, demostración ni contacto visible. |

**Total: 26/40 — Aceptable.** Hay una base visual clara, pero conviene resolver la confianza y la orientación antes de pedir datos fiscales.

## Especificidad del diseño

**Veredicto — contenido específico, composición aún intercambiable.** El vocabulario de obra, los perfiles y la secuencia de compra corresponden a ERP PNF. Grafito, naranja y diagramas de proceso sostienen esa identidad, aunque la estructura podría pertenecer a otra landing SaaS. La mayor oportunidad es demostrar el cierre semanal y el rastro de autorización con un ejemplo concreto.

**Detector determinista:** `impeccable detect --json src/app/page.tsx` terminó con código 0: 0 hallazgos primarios, 0 advisory, sin reglas ni ubicaciones que clasificar como falsos positivos.

**Overlay visual:** no se pudo completar la preevaluación de inyección ni mostrar el overlay. La interfaz CUA disponible solo permitía evaluación DOM de lectura, así que no hay overlay visible confiable; la revisión usó capturas y árbol de accesibilidad como señal alternativa.

## Impresión general

La landing gana credibilidad cuando enseña el flujo de requisición y autorización. El principal riesgo aparece después del clic: pide datos fiscales antes de explicar con claridad qué sucederá. La mejora con mayor impacto es conectar la promesa operativa con una entrada al registro que genere confianza y dé rutas para cada perfil.

## Carga cognitiva

**2 de 8 comprobaciones fallan: chunking y opciones mínimas.** La sección de herramientas presenta seis módulos con peso parecido, y el menú móvil reúne cinco destinos/acciones. Son opciones sencillas, pero superan el límite de cuatro recomendado por la guía. La agrupación visual y la jerarquía principal sí funcionan; la landing no exige recordar datos entre pantallas.

Hay además una barrera de comprensión para quien no trabaja aún con el vocabulario de obra: “destajo” y “condensado semanal” aparecen sin explicación. El usuario también debe inferir qué ocurre al crear una cuenta antes de ver los campos de empresa y RFC.

## Recorrido emocional

La página abre con confianza, reconoce problemas cotidianos y explica el flujo de autorización. Después, los seis módulos introducen una pausa más abstracta y repetitiva. El CTA final vuelve a generar optimismo, pero al entrar al registro aparece incertidumbre por los datos legales que solicita.

## Aciertos

- El encabezado establece jerarquía y ofrece dos rutas comprensibles.
- El flujo requisición → visto bueno → cotización → compra → recepción → pago comunica trazabilidad con claridad.
- La vista del producto se marca como ilustrativa; a 390 px la página no presenta desbordamiento horizontal y el menú funciona.

## Problemas prioritarios

- **[P1] Expectativas y confianza antes del RFC.** El CTA lleva a un formulario que solicita tipo de persona, razón social y RFC desde el primer paso. **Por qué importa:** pedir un identificador fiscal sin explicar el proceso puede frenar el registro. **Arreglo:** anticipa qué crea la cuenta, quién debe registrarse y por qué se necesitan esos datos; ofrece una vía de contacto. Usa solo explicaciones confirmadas por el producto. **Comando sugerido:** `$impeccable clarify`.
- **[P1] El flujo se afirma más de lo que se demuestra.** La cadena de compra es estática y el diagrama no muestra un caso con responsable y autorización en cada etapa. **Por qué importa:** el flujo es la prueba más diferenciadora, pero hoy deja que el lector imagine el resultado. **Arreglo:** añade un ejemplo ilustrativo breve que muestre cómo una requisición llega a recepción con su contexto y visto bueno. **Comando sugerido:** `$impeccable shape`.
- **[P2] Beneficios repetidos.** Hero, beneficios, sección de México y cierre repiten que la operación queda conectada y organizada. **Por qué importa:** reduce el espacio para entender el cierre semanal y los resultados por rol. **Arreglo:** conserva la afirmación más fuerte y sustituye las repeticiones por evidencia operativa. **Comando sugerido:** `$impeccable distill`.
- **[P2] No hay una entrada por perfil.** Dirección, personal de obra y Administración reciben el mismo recorrido. **Por qué importa:** cada visitante debe inferir cómo encaja el producto en su trabajo. **Arreglo:** presenta resultados o rutas breves por perfil sin crear recorridos separados innecesarios. **Comando sugerido:** `$impeccable shape`.
- **[P3] Términos de oficio sin contexto.** “Destajo” y “condensado semanal” aparecen sin explicación. **Por qué importa:** la página también la leerán personas que aún no operan esos procesos. **Arreglo:** añade una explicación corta o enlace contextual en su primer uso. **Comando sugerido:** `$impeccable clarify`.

## Señales por perfil

- **Jordan, primerizo:** el CTA no anticipa el registro en dos pasos ni la solicitud de RFC; faltan demo, FAQ o contacto para construir confianza.
- **Riley, evaluador metódico:** el flujo no muestra evidencia de una operación completa ni el rastro de responsables en cada paso; necesita un ejemplo verificable.
- **Casey, usuario móvil de campo:** la llamada a crear cuenta cabe en pantalla, pero la vista del producto y sus detalles son pequeños y aparecen tras un hero largo; falta un ejemplo de captura móvil.

## Observaciones menores

- La microinformación de la vista ilustrativa puede resultar difícil de leer en móvil.
- El onboarding muestra “Paso 1 de 2”, pero no se observó una representación visual de progreso.
- La revisión cubrió la landing y el primer paso del onboarding; no se usó una sesión autenticada ni se enviaron datos.

## Preguntas provocadoras

- ¿La landing vende un ERP generalista o la trazabilidad del cierre semanal que distingue al producto?
- ¿Por qué debería un Director compartir su RFC antes de entender el registro y el uso de ese dato?
- ¿Qué perfil debe reconocer primero que esta plataforma es para su trabajo?
