# Animación con GSAP en ERP PNF — estado y reglas

> Este documento dejó de ser una propuesta: describe **lo que está implementado**, dónde vive
> cada animación y qué se descartó. El filtro sigue siendo el mismo: la animación entra cuando
> hace que el usuario entienda algo más rápido, no cuando solo lo entretiene.

---

## 1. Estado

GSAP está instalado (`gsap` 3.15 y `@gsap/react` 2.1) y centralizado en `src/lib/anim/gsap.ts`.
Todo el movimiento del producto pasa por ese módulo: ahí viven las duraciones, los eases y el
gate de `prefers-reduced-motion`, para que ningún componente los reinvente.

El hero de la landing pública **no** usa GSAP. Su entrada es CSS (`.hero-entrada` en
`src/app/globals.css`) porque ocurre en la primera pintura y no puede esperar a la hidratación;
el razonamiento está en §5.

Resumen por superficie:

| Superficie | Estado | Dónde |
|---|---|---|
| Cifras KPI del dashboard | GSAP | `components/anim/KpiValor.tsx` |
| Barras de proporción (gasto, avance) | GSAP | `components/anim/useBarrasProporcion.ts` |
| Contador de pendientes y campana | GSAP | `components/anim/ContadorLatido.tsx` |
| Relevo esqueleto → contenido | GSAP | `DashboardModule`, `ContabilidadModule` |
| Cabecera de obra | GSAP | `components/ObraShell.tsx` |
| Listas de decisión | GSAP | `components/anim/useStagger.ts` |
| Coreografía interna del sheet | GSAP | `components/ui/sheet.tsx` |
| Entrada de ruta | GSAP | `components/AppShell.tsx` |
| Riel del sidebar | GSAP + Flip | `components/AppShell.tsx` |
| Pasos del onboarding | GSAP | `src/app/onboarding/page.tsx` |
| Sacudida de error en capturas | GSAP | `components/anim/useSacudir.ts` |
| Entrada del hero público | **CSS** | `src/app/globals.css` |
| ScrollTrigger, parallax, pinning | Descartado | — |

---

## 2. El vocabulario de movimiento

`src/lib/anim/gsap.ts` exporta estas constantes. Son las únicas duraciones admitidas; si una
animación necesita otra, se discute aquí antes de escribirla.

| Token | Valor | Uso |
|---|---|---|
| `MOTION.micro` | 0.15 s | **CSS**, no GSAP. Hover, foco y cambio de estado de un control. |
| `MOTION.entrada` | 0.28 s | Contenido que aparece: paneles, listas, sheet, ruta. Ease `power2.out`. |
| `MOTION.lectura` | 0.6 s | Cifras que cuentan y barras que crecen: hay que poder leer el cambio. |
| `MOTION.enfasis` | 0.34 s | Contador que late al recibir trabajo nuevo. Ease `back.out(3)`. |
| `MAX_STAGGER` | 8 | Tope de elementos escalonados, sin importar el tamaño de la lista. |

Reglas de ease, alineadas al tono de la bitácora (preciso, no juguetón):

- `power2.out` para todo lo que aparece. Es el equivalente animado de la regla de 1 px.
- `back.out` **solo** en `ContadorLatido`. Es el único overshoot admitido, porque el rebote
  significa "acaba de llegar algo".
- Prohibido `elastic` y `bounce` en el chrome. Un ERP que rebota pierde autoridad.

`gsap.defaults({ duration: 0.28, ease: "power2.out" })` se define una sola vez en el módulo
central. Nunca por componente.

---

## 3. Qué hace cada animación

### 3.1 Cifras KPI — contar en vez de saltar

`KpiValor` recibe un número y un `tipo` (`"moneda"` por omisión, `"entero"` para conteos como
obras activas). Usa `gsap.to` sobre un objeto `{ n: 0 }` y reescribe el `textContent` en cada
frame con el formateador ya estable.

- El valor final se renderiza en el HTML: con JS apagado o GSAP fallando, la cifra es correcta.
- `tabular-nums` en el contenedor evita el reflow al cambiar de ancho.
- `revertOnUpdate` corta la cuenta anterior si el usuario cambia de periodo a media animación.
- No se aplica a celdas de tabla: 40 cifras contando a la vez son ruido.

### 3.2 Barras de proporción — crecer de izquierda a derecha

`BarraProporcion` es el primitivo (pista + relleno con `width` ya definido y `origin-left`).
`useBarrasProporcion` anima `scaleX` de 0 a 1 sobre cada `[data-barra]` del scope, con un
escalonado total que nunca pasa de ~0.5 s aunque haya 40 barras.

Se usa en el gasto por categoría y en el avance por obra del dashboard.

- Se anima `scaleX` sobre un ancho ya calculado: cero layout, solo composición.
- `origin-left` es CSS, no GSAP: sin JavaScript la barra ya está en su lugar.
- No se animan los `<Bar>` de Recharts: ya traen su propia animación y duplicarla produce
  parpadeo.

### 3.3 El contador que late — la única animación "viva"

`ContadorLatido` envuelve el contenido en un `<span>` y lo escala cuando el valor **sube**
(nunca cuando baja). Es el mismo componente para el badge de pendientes y la campana.

- Se anima el hijo, no el `Badge`: el `sr-only` con la cifra real no debe desalinearse del
  texto visible durante los 340 ms.
- `overwrite: "auto"`: si llegan dos ráfagas, gana la última; no se apilan tweens.

### 3.4 El relevo esqueleto → contenido

`DashboardModule` y `ContabilidadModule` animan sus `[data-panel]` cuando termina la carga, y
`ObraShell` hace lo mismo con la cabecera de la obra cuando llega el nombre.

- **`gsap.from()`, nunca `fromTo({ autoAlpha: 0 })`.** Con `from`, el estado inicial se aplica al
  crear el tween y el elemento vuelve solo a su estado natural; si GSAP no carga o el tween se
  interrumpe, el contenido está visible.
- Se animan solo los contenedores, no las filas.

### 3.5 Listas de decisión

`useStagger(scope, selector, deps)` anima `y: 4` + `autoAlpha` con un escalonado topado a 8.
Se usa en tarjetas de obra, pendientes del dashboard, tareas de obra, avisos de la campana y
notificaciones.

El parámetro `deps` importa: en listas que viven en un portal (campana), hay que incluir la
señal de apertura, no solo el número de ítems, o la animación nunca corre al abrir con datos
ya cargados.

**Límite duro:** `CarteraTable` y las tablas de estimaciones o presupuesto **no** se escalonan.
Si se quiere una señal de frescura, un solo `from` de opacidad sobre `<tbody>`, nada más.

### 3.6 Sheet de captura

`ui/sheet.tsx` anima los hijos directos del contenido (encabezado, campos, footer) en 0.28 s,
en paralelo al deslizamiento de Radix. Se excluyen el botón de cierre y los nodos `sr-only`
de 1×1 px: con `autoAlpha` saldrían del árbol de accesibilidad durante la entrada.

### 3.7 Entrada de ruta

`AppShell` hace un `from` de 0.28 s sobre `<main>` cuando cambia `pathname`, con `y: 4`. El
marco (sidebar, barra superior) se queda quieto: se cambia el contenido, no el shell.

### 3.8 Riel del sidebar con Flip

El ítem activo del sidebar tiene un `<span data-rail>` real (antes era un pseudo-elemento
`before:`, que Flip no puede medir). Al cambiar de ruta, `Flip.getState` captura la posición
anterior y `Flip.from` la recorre hasta la nueva usando transform.

Con `prefers-reduced-motion` el riel se coloca sin tween.

### 3.9 Onboarding

El paso entra desde el lado hacia el que se avanza: `x: 10` al continuar, `x: -10` al volver,
0.24 s con `clearProps: "all"` para no dejar transforms pegados al cambiar de paso.

### 3.10 Sacudida de error

`useSacudir` sacude el contenedor de captura ±4 px durante 0.3 s cuando una validación local
falla. El toast dice qué pasó; la sacudida dice **dónde**. Solo en validación local, no en
errores de red, y con `prefers-reduced-motion` no se crea ningún tween.

Desactiva la `transition` del panel mientras dura el golpe (si queda activa, cada frame se
interpola otra vez y el movimiento se lava) y la restaura al terminar.

---

## 4. Descartado, y por qué

| Caso | Veredicto | Razón |
|---|---|---|
| ScrollTrigger, pinning, parallax | No | El scroll es funcional en pantallas densas, no narrativo |
| Filas de tabla con stagger | No | 0.8 s de renglones entrando rompe la lectura de columna |
| Barras de Recharts con GSAP | No | Recharts ya anima; duplicar produce parpadeo |
| Popover, dropdown, dialog, accordion | No | `tw-animate-css` ya lo resuelve vía `data-[state]` |
| Hover de tarjeta / botón / fila | No | `The Flat-by-Default Rule` + 150 ms CSS ya está |
| Toasts (sonner) | No | Ya animados |
| Degradados, glass, `backdrop-blur` | No | Prohibido explícitamente en `DESIGN.md` |
| Destello crema al recalcular un total | No | `The Pencil Rule`: el crema está reservado a ajustes |
| Contar cifras en celdas de tabla | No | Se comparan en columna; contar 40 a la vez es ruido |

---

## 5. El hero público: por qué CSS y no GSAP

La entrada del hero ocurría en la primera pintura de la página. Con GSAP había dos problemas:

1. El HTML llegaba visible y el contenido saltaba 14 px cuando el bundle terminaba de cargar.
2. La landing entera quedaba como `"use client"` y pagaba GSAP en el paquete inicial.

Hoy es un `@keyframes` de 0.55 s con `cubic-bezier(0.33, 1, 0.68, 1)` y `backwards`, aplicado
por clase con `animationDelay` de 80 ms entre bloques. Corre antes de la hidratación, GSAP sale
del bundle público y `prefers-reduced-motion` apaga la animación con `animation: none`.

Ventaja lateral, medida: con el `requestAnimationFrame` suspendido (pestaña en segundo plano,
ventana oculta), una animación GSAP de entrada deja el elemento en su estado inicial —oculto—
mientras que esta deja el texto legible y solo 14 px abajo. Es el peor caso correcto.

**Regla:** la primera pintura se anima con CSS. GSAP entra cuando hay que interpolar un valor,
encadenar una coreografía o reaccionar a datos.

---

## 6. Accesibilidad

- **`prefers-reduced-motion`**: cada `useGSAP` registra la rama `REDUCED` y escribe el estado
  final sin crear tween. `MOTION_OK` es el complemento (`not all and (prefers-reduced-motion: reduce)`).
- **El estado final siempre existe sin JS.** Las cifras se renderizan formateadas, las barras
  con su ancho, el contenido visible. GSAP solo mejora la transición.
- **`autoAlpha` solo en lo prescindible.** No se aplica a texto que deba leerse; en el sheet se
  excluyen los nodos `sr-only`.
- **Nada late dos veces.** `ContadorLatido` solo reacciona cuando la cifra sube, y el debounce
  de `usePendientesRealtime` agrupa las ráfagas.

---

## 7. Checklist antes de dar por buena una animación

- [ ] ¿Anima solo `transform` y `opacity`? Nada de `width`/`height`/`top`/`left`.
- [ ] ¿Usa `gsap.from()` (no `fromTo` con `autoAlpha: 0`) cuando el contenido debe ser legible?
- [ ] ¿Está envuelta en `gsap.matchMedia()` con `MOTION_OK` y `REDUCED`?
- [ ] ¿El estado final se renderiza sin GSAP (SSR / JS deshabilitado)?
- [ ] ¿Está dentro de `useGSAP` con `scope` y `dependencies` correctas?
- [ ] ¿El stagger está topado a `MAX_STAGGER`, y no se aplica a tablas de datos?
- [ ] ¿Dura ≤ 700 ms y usa `power2.out` (o `back.out` solo en contadores)?
- [ ] ¿No duplica una animación que Radix o Recharts ya hacen?
- [ ] ¿Sobrevive un cambio de datos a media animación (`revertOnUpdate` / `overwrite`)?

---

## 8. Verificación

- Las duraciones y el catálogo de superficies se pueden comprobar con
  `grep -r "lib/anim/gsap" src`.
- `npm run build` debe seguir dejando la landing fuera del bundle de GSAP: si `gsap` aparece en
  los chunks de `/`, alguien volvió a importarlo desde una superficie pública.
- Al auditar visualmente una superficie animada, la ventana tiene que estar visible: con
  `requestAnimationFrame` suspendido, cualquier `from` se queda en su estado inicial y las
  herramientas de accesibilidad ven menos de lo que hay. Eso no es un bug del producto, pero
  invalida la medición.
