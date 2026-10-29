---
name: ERP PNF
description: Grafito estructural y naranja de seguridad sobre papel — la bitácora operativa de una constructora mexicana.
colors:
  brand-orange: "#f47721"
  brand-orange-ink: "#c2410c"
  brand-orange-wash: "#fff1e6"
  graphite: "#20252b"
  graphite-raised: "#2b3138"
  graphite-deep: "#181c21"
  paper-white: "#f9fafb"
  sheet-white: "#ffffff"
  pencil-gray: "#5f6773"
  hairline: "#e5e7eb"
  wash: "#f3f4f6"
  ink-on-dark: "#f3f4f6"
  alert-red: "#dc2626"
  adjustment-cream: "oklch(0.975 0.035 95)"
  adjustment-ink: "oklch(0.42 0.11 75)"
  adjustment-line: "oklch(0.90 0.06 90)"
  seal-amber: "#fef3c7"
  seal-amber-ink: "#92400e"
  seal-green: "#d1fae5"
  seal-green-ink: "#065f46"
  seal-rose: "#ffe4e6"
  seal-rose-ink: "#9f1239"
  seal-blue: "#dbeafe"
  seal-blue-ink: "#1e40af"
  seal-violet: "#f3e8ff"
  seal-violet-ink: "#6b21a8"
  seal-slate: "#f1f5f9"
  seal-slate-ink: "#334155"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: "0em"
  label:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: "0em"
  micro:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.05em"
  micro-lg:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.05em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
components:
  button-primary:
    backgroundColor: "{colors.brand-orange}"
    textColor: "{colors.graphite}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.graphite}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.graphite}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-destructive:
    backgroundColor: "{colors.alert-red}"
    textColor: "{colors.paper-white}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  input-field:
    backgroundColor: "transparent"
    textColor: "{colors.graphite}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  card:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.xl}"
    padding: "24px"
  status-chip-slate:
    backgroundColor: "{colors.seal-slate}"
    textColor: "{colors.seal-slate-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 10px"
    height: "20px"
  status-chip-amber:
    backgroundColor: "{colors.seal-amber}"
    textColor: "{colors.seal-amber-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 10px"
    height: "20px"
  status-chip-blue:
    backgroundColor: "{colors.seal-blue}"
    textColor: "{colors.seal-blue-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 10px"
    height: "20px"
  status-chip-violet:
    backgroundColor: "{colors.seal-violet}"
    textColor: "{colors.seal-violet-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 10px"
    height: "20px"
  status-chip-green:
    backgroundColor: "{colors.seal-green}"
    textColor: "{colors.seal-green-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 10px"
    height: "20px"
  status-chip-rose:
    backgroundColor: "{colors.seal-rose}"
    textColor: "{colors.seal-rose-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 10px"
    height: "20px"
  tabs-track:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.pencil-gray}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "4px"
    height: "36px"
  tabs-trigger-active:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.graphite}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
  sidebar-item-active:
    backgroundColor: "{colors.graphite-raised}"
    textColor: "{colors.ink-on-dark}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "36px"
  edited-value:
    backgroundColor: "{colors.adjustment-cream}"
    textColor: "{colors.adjustment-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
---

# Design System: ERP PNF

## Overview

**Creative North Star: "La bitácora de obra"**

El sistema se comporta como la bitácora que vive en la caseta de obra: páginas blancas, renglones finos, tinta grafito, entradas firmadas y sellos de estado. No hay decoración porque cada marca en la página existe para registrar quién hizo qué, cuándo y con qué visto bueno. La interfaz hereda esa disciplina: superficies planas, reglas de un píxel, jerarquía por peso y tamaño, y naranja reservado para la acción y la atención.

La densidad es deliberada. El cuerpo de trabajo vive en 12 y 14 px; las tablas alinean cifras con números tabulares y los encabezados de sección se escriben en mayúsculas pequeñas con tracking abierto, como los rubros de un formato. La barra lateral grafito es la única superficie oscura extensa —la portada de la bitácora—; todo lo demás es papel blanco con líneas.

El lujo es de precisión, no de ornamento: una sombra apenas perceptible sobre las tarjetas, radios de 6 px en controles y 12 px en contenedores, iconos Lucide de 16 px y sellos pastel de 20 px. La referencia negativa es el dashboard genérico: nada de degradados, vidrio, fotografía de stock ni tarjetas de marketing dentro del producto.

**Key Characteristics:**
- Grafito sobre papel; el naranja de seguridad marca acción, estado activo y atención, nunca atmósfera.
- Densidad de bitácora: cuerpo de 12–14 px, tablas de una línea, cifras tabulares.
- Reglas de 1 px y superficies planas; la sombra es la excepción, no el sistema.
- El mismo lenguaje a 360 px y a 1440 px: cambia el shell, no la densidad.
- Sellos pastel para el estado; lápiz crema para lo ajustado por administración.

## Colors

Una paleta de tinta y seguridad: grafito para la estructura, naranja corporativo para la acción, grises neutros para el contenido y seis familias pastel que funcionan como sellos de estado.

### Primary
- **Naranja corporativo** (`#f47721`): relleno de la acción primaria, checkboxes y switches activos, riel de la navegación y cualquier marca que pida atención inmediata. Sobre él siempre va tinta grafito (5.5:1); nunca texto blanco.
- **Naranja profundo** (`#c2410c`): la versión legible del naranja. Se usa como tinta de enlaces, iconos activos, montos destacados y focus ring sobre superficie clara (4.9:1 sobre Fondo). El relleno saturado no se usa como texto.
- **Grafito** (`#20252b`): barra lateral de escritorio y menú móvil. La portada oscura de la bitácora. También es la tinta del texto principal.
- **Grafito levantado** (`#2b3138`): relleno del ítem activo y del hover en la navegación grafito.

### Secondary — el sistema de sellos
No es una marca secundaria: es el vocabulario semántico de estado. Todos los sellos comparten la misma gramática: relleno `-100`, tinta `-800`, texto de 12 px con peso 600, sin borde.
- **Sello ámbar** (`#fef3c7` / `#92400e`): algo en curso o con saldo — cotizando, pago parcial, consumo pendiente, advertencia operativa.
- **Sello verde** (`#d1fae5` / `#065f46`): cerrado y en orden — completada, pagado, autorizado, asistencia registrada.
- **Sello rosa** (`#ffe4e6` / `#9f1239`): rechazo o riesgo — rechazada, vencida, urgente. Su versión sólida (`rose-600`) es el contador de pendientes.
- **Sello azul** (`#dbeafe` / `#1e40af`): documento emitido — orden de compra generada, recepción en tránsito.
- **Sello violeta** (`#f3e8ff` / `#6b21a8`): espera de autorización — pendiente del visto bueno del Supervisor.
- **Sello pizarra** (`#f1f5f9` / `#334155`): borrador, enviada o metadato neutro.
- **Rojo de alerta** (`#dc2626`): la única versión fuerte del rojo; se reserva para acciones destructivas, errores de formulario y montos negativos. Convive con el naranja porque este nunca significa error.

Las variantes de una sola pantalla —cian para recepción parcial, por ejemplo— siguen la misma gramática `-100` / `-800`; no crean una familia nueva.

### Neutral
- **Papel de obra** (`#f9fafb`): fondo de la aplicación y de las páginas públicas.
- **Hoja** (`#ffffff`): tarjetas, sheets, barras y cualquier superficie que se apoya sobre el papel.
- **Grafito** (`#20252b`): texto principal.
- **Lápiz** (`#5f6773`): texto secundario, encabezados de tabla, metadatos y subtítulos (5.5:1 sobre Papel de obra).
- **Regla** (`#e5e7eb`): el borde de 1 px que separa casi todo.
- **Lavado** (`#f3f4f6`): riel de tabs, fondos deshabilitados, hover de filas.
- **Lavado cálido** (`#fff1e6`): hover de controles fantasma y botones outline. Es el naranja al 8 %, no un segundo acento.
- **Papel tenue** (`#f3f4f6`): texto de navegación sobre grafito.
- **Marcador de ajuste** (`oklch(0.975 0.035 95)` con tinta `oklch(0.42 0.11 75)` y línea `oklch(0.90 0.06 90)`): el crema del lápiz con el que administración corrige un valor. No es un warning.

### Named Rules
**The Graphite-and-Orange Rule.** El chrome es grafito sobre papel. El naranja entra como acción, estado activo o marca de atención; nunca como atmósfera, degradado o fondo de sección.

**The Two-Oranges Rule.** El naranja de relleno (`#f47721`) no carga texto: sobre él va grafito. Cuando el naranja es tinta —enlaces, iconos, foco— se usa el profundo (`#c2410c`) para conservar 4.5:1 sobre superficies claras.

**The Stamp Rule.** Un color de estado vive en un tag de 20 px, un punto de 6–8 px o una celda resaltada. Puede llenar un aviso en línea cuando el aviso *es* el estado; no puede pintar el chrome de la página ni un botón primario. El naranja corporativo no es un sello.

**The Series Rule.** Las gráficas usan como máximo dos series y ambas salen de tokens: `--color-primary` para producción e `--color-destructive` para costos. Nada de `hsl()` ni `#hex` literales: el gráfico también cambia con el tema.

**The Pencil Rule.** El crema `adjustment-cream` está reservado para valores ajustados por administración, siempre acompañado del icono de lápiz. No se usa para selección, hover, advertencia ni decoración.

## Typography

**Display Font:** Inter (con `system-ui`, `-apple-system`, `Segoe UI`)
**Body Font:** Inter (misma pila)
**Label/Mono Font:** monoespaciada del sistema para identificadores y contabilidad

**Character:** Una sola familia, sin fuente de display. La jerarquía nace del peso, el tamaño y el tracking —nunca de una segunda tipografía—. En pantalla, Inter se resuelve contra la pila del sistema: si no está instalada, Segoe UI toma el relevo sin cambiar la estructura.

### Hierarchy
- **Display** (600, 60 px, 1.0, −0.025em): solo el hero de la landing pública; en móvil baja a 36 px.
- **Headline** (600, 24 px, 1.33, −0.025em): título de página y de módulo, siempre seguido de un subtítulo de 14 px en Lápiz.
- **Title** (600, 18 px, 1.4): título de sheet o diálogo; las tarjetas usan 16 px con el mismo peso y tracking cerrado.
- **Body** (400, 14 px, 1.43): texto de trabajo, celdas de tabla, formularios y párrafos. Es el tamaño dominante del producto.
- **Label** (500, 12 px, 1.33): etiquetas de campo, badges, encabezados de tabla y metadatos.
- **Micro** (500, 10–11 px, 1.2, 0.05em, mayúsculas): rubros de navegación, leyendas de KPI y contadores. Se usa con cuentagotas para no perder legibilidad.
- **Mono** (400, 12–14 px): RFC, CURP, CLABE, folios y columnas contables.

### Named Rules
**The One-Family Rule.** No hay segunda tipografía. Si hace falta jerarquía, se cambia peso, tamaño o tracking; nunca se introduce una serif, una display o una fuente "de marca".

**The Dense-by-Default Rule.** 12 y 14 px cargan el producto. 16 px se reserva para títulos de tarjeta, sheets y campos en móvil; 24 px o más, para el título de la página y la landing.

**The Tabular Rule.** Toda cifra que se compara en columna —importes, cantidades, avances, totales— lleva `tabular-nums`. Los identificadores (RFC, CURP, CLABE, folio) van en monoespaciada.

## Layout

El shell corporativo es una barra lateral grafito de 256 px, una barra superior de 56 px y un contenido centrado a 1280 px (`max-w-7xl`) con padding de 16/24/32 px según el breakpoint. En móvil la barra lateral desaparece y una barra inferior fija de 64 px toma el relevo; el contenido reserva 96 px de padding inferior para no quedar debajo.

Dentro de una obra, el shell cambia a un workspace de 1024 px (`max-w-5xl`): una cabecera de dos líneas —nombre de la obra y cliente/contrato— con chevron de regreso, y debajo los módulos. La barra inferior de obra es la superficie más densa del sistema: concentra todos los módulos de la obra en una sola fila de iconos de 20 px con etiquetas de 10–11 px.

La plantilla de página es fija: título de 24 px y subtítulo de 14 px a la izquierda, acción primaria a la derecha; después tabs o filtros, y luego una tarjeta o tabla. Las páginas respiran con `space-y-6`; dentro de un módulo, el ritmo baja a `space-y-3` o `space-y-4` y las tarjetas operativas usan padding de 12–16 px en lugar de los 24 px por defecto.

Las tablas viven a sangre dentro de la tarjeta: cuerpo de 14 px, encabezado de 12 px en Lápiz, filas de una línea separadas por Regla, hover en Lavado y scroll horizontal en móvil. Las columnas secundarias se esconden en `sm` y `md` antes que encoger la columna principal.

Breakpoints observados: `sm` 640 px, `md` 768 px (cambio de shell), `lg` 1024 px (grids de 2–3 columnas), `xl` 1280 px (ancho máximo del contenido). La landing usa 1152 px (`max-w-6xl`), el login 448 px y el onboarding 512 px.

### Named Rules
**The Shell-Switch Rule.** Debajo de 768 px no se encoge la barra lateral: se sustituye por la barra inferior. Un módulo nuevo debe funcionar primero a 360 px y después a 1440 px.

**The Two-Line Obra Rule.** La identidad de la obra ocupa dos líneas como máximo: nombre y cliente/contrato. La ubicación, las fechas y el equipo son metadatos de 12–14 px, nunca un segundo encabezado.

## Elevation & Depth

El sistema es plano por defecto. La profundidad la lleva la Regla de 1 px: casi todas las superficies se separan con borde, no con sombra. La sombra existe solo para indicar que una superficie flota: los controles se levantan 1 px, las tarjetas son una hoja sobre el escritorio y los sheets/diálogos son el único plano realmente elevado.

### Shadow Vocabulary
- **Control** (`box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`): inputs, selects, botones outline y checkboxes. Es un susurro, no un relieve.
- **Hoja** (`box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`): tarjetas y contenedores de datos. La misma receta que el control, aplicada a una superficie mayor.
- **Panel flotante** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): sheets laterales y diálogos. Es la única elevación que se nota.
- **Scrim** (`bg-black/80`): fondo de sheets y diálogos. Oscuro y contundente; no hay blur ni transparencia decorativa.

### Named Rules
**The Flat-by-Default Rule.** Ninguna superficie se levanta al hacer hover. Una tarjeta interactiva cambia el borde a tinta al 40 %, no su posición ni su sombra.

**The Single-Sheet Rule.** No se apilan sombras. Una tarjeta dentro de un sheet no vuelve a proyectar sombra; el borde hace el trabajo.

## Shapes

La forma es contenida y ligeramente redondeada, nunca blanda. El radio base es 8 px: los controles (botones, inputs, selects, badges, ítems de navegación) usan 6 px, los contenedores (tarjetas, riel de tabs) 8–12 px, y solo avatares y contadores llegan a círculo completo. No existen radios de 16 px o más en la interfaz.

El borde de 1 px es el vocabulario de separación: separa filas, tarjetas, cabeceras y secciones. El borde discontinuo está reservado para el vacío —estados vacíos y placeholders— y el borde de 2 px solo aparece en los avatares traslapados del equipo de obra, donde el color del fondo hace de recorte.

Los diálogos son cuadrados en el teléfono y adoptan 8 px a partir de `sm`; los sheets laterales no llevan radio porque nacen del borde de la pantalla. Los botones nunca son píldoras: la única forma circular es la de un contador o un avatar.

### Named Rules
**The Hairline Rule.** Si dos superficies necesitan separarse, se agrega una Regla de 1 px antes que una sombra o un fondo nuevo.

**The 6/8/12 Rule.** Control 6 px, riel o grupo 8 px, tarjeta 12 px. Cualquier radio fuera de esa escala necesita una razón de producto, no estética.

## Components

### Buttons
- **Shape:** radio de 6 px (`6px`), altura de 36 px, padding horizontal de 16 px, texto de 14 px con peso 500, icono Lucide de 16 px y separación de 8 px.
- **Primary:** fondo Naranja corporativo, texto Grafito, sombra de control. Es la acción de la página; solo una por vista.
- **Hover / Focus:** el fondo baja a 90 % de opacidad; el foco dibuja un anillo de 1 px en Naranja profundo, sin glow ni cambio de borde. La transición es de 150 ms.
- **Secondary / Ghost / Tertiary:** `outline` es Hoja con borde Regla y sombra de control; `ghost` no tiene chrome hasta el hover (Lavado cálido); `destructive` usa Rojo de alerta con texto blanco. `link` es texto Naranja profundo subrayado al hover.
- **Sizes:** 32 px (`sm`), 36 px (default), 40 px (`lg`), 36×36 px (`icon`). En móvil, la acción primaria puede ocupar todo el ancho del formulario o del footer del sheet.

### Chips
- **Style:** badge de 20 px de alto, radio 6 px, padding 2×10 px, 12 px con peso 600. El estado usa relleno pastel `-100` y tinta `-800`, sin borde.
- **State:** no hay chip seleccionable. Para filtros se usan tabs o checkboxes; para metadatos neutros, badge `secondary` con Lavado y texto Grafito.
- **Counters:** contador de pendientes en Sello rosa fuerte (`bg-rose-600`), texto blanco, círculo completo, 16 px, 10 px en negrita, truncado a “9+”. Es `rose-600` y no `rose-500` porque el texto de 10 px necesita 4.5:1: con 500 la razón cae a 3.66:1.

### Cards / Containers
- **Corner Style:** 12 px (`12px`).
- **Background:** Hoja sobre Papel de obra.
- **Shadow Strategy:** sombra de Hoja; nunca se combina con otra sombra.
- **Border:** Regla de 1 px, siempre presente.
- **Internal Padding:** 24 px por defecto; los módulos operativos comprimen a 12–16 px. La cabecera de tarjeta usa 24 px y las tarjetas de datos suelen eliminar el padding para que la tabla llegue al borde.
- **Empty state:** borde discontinuo, fondo Lavado al 30 %, icono de 32 px en Lápiz, título de 16 px y una línea de 14 px; centrado y con padding vertical de 40–64 px.

### Inputs / Fields
- **Style:** altura 36 px, radio 6 px, fondo transparente sobre Hoja, borde Regla de 1 px, padding 12 px, texto de 16 px en móvil y 14 px desde `md`, sombra de control.
- **Focus:** anillo de 1 px en Naranja profundo (`ring-1`), sin glow. El borde no cambia de color.
- **Error / Disabled:** el error se comunica con texto Rojo de alerta y toast; el campo deshabilitado baja a 50 % de opacidad. Las etiquetas son 14 px con peso 500 y viven a 6 px del campo.
- **Layout:** los formularios se apilan con `space-y-4`; en escritorio, dos columnas solo cuando los campos son cortos (fechas, montos, claves).

### Navigation
- **Desktop:** barra lateral de 256 px en Grafito; monograma “P” de 32 px en Naranja corporativo con tinta Grafito, nombre del producto y “Constructoras” en 12 px al 60 %. Los rubros (“Obra”, “Corporativo”, “Administración”) son micro de 12 px en mayúsculas, tracking 0.05em, al 50 % de opacidad.
- **Items:** 36 px de alto, radio 6 px, icono de 16 px, texto de 14 px. El activo usa Grafito levantado y texto blanco; el inactivo vive al 80 % y el hover al 50 % del levantado. Los pendientes se montan como contador rosa a la derecha. El activo suma una barra de 3 px en Naranja corporativo pegada al borde izquierdo: el naranja separa 4.7:1 del Grafito levantado y cumple el 3:1 de WCAG 1.4.11. El foco de teclado dibuja el anillo de 1 px de `--sidebar-ring`.
- **Top bar:** 56 px, Hoja, borde inferior Regla. Logo de empresa o “ERP PNF”, campana de notificaciones y menú de avatar.
- **Mobile:** barra inferior fija de 64 px, Hoja, borde superior Regla. Cada destino es icono de 20 px sobre etiqueta de 10–11 px; el activo es Naranja profundo y el inactivo Lápiz. En modo corporativo, “Más” abre el menú completo en un sheet lateral.
- **Riel del menú:** el scrollbar del sidebar se dibuja con la tinta del panel al 28 % (46 % al hover), sin flechas, sobre riel transparente, y con `scrollbar-gutter: stable` para que el contenido no salte cuando aparece. El scrollbar del navegador no pertenece a ningún sistema; este sí.

### Tabs
- **Track:** 36 px de alto, fondo Lavado, radio 8 px, padding 4 px, texto de 14 px en Lápiz.
- **Active:** píldora de Hoja con radio 6 px, texto Grafito y sombra de control. La transición es de 150 ms.
- **Usage:** tabs para estados de un mismo recurso (Activas / Historial) y para submódulos; nunca para navegación entre páginas.

### Tables
- **Style:** ancho completo dentro de la tarjeta, cuerpo de 14 px, encabezado de 12 px en Lápiz y peso 500, celdas con padding de 8 px.
- **Rows:** borde inferior Regla, hover en Lavado al 50 %, altura compacta de una línea. Los importes se alinean a la derecha con `tabular-nums`; los folios van en mono.
- **Responsive:** scroll horizontal dentro de la tarjeta; las columnas secundarias se ocultan en `sm` y `md`. Los nombres largos usan una celda truncada con tooltip.

### Edited Value (signature)
- **Style:** fondo Marcador de ajuste, texto de tinta ámbar, radio 4 px, borde interior de 1 px en Línea de ajuste, icono de lápiz de 12 px.
- **Behavior:** marca el valor que administración corrigió sobre la captura original; aparece en celdas de nómina, badges de “Ajustada” y leyendas. Nunca se usa para selección ni para errores.
- **Legend:** cuando hay varios valores ajustados en una tabla, se muestra una leyenda de 12 px con el mismo cuadro crema.

### Capture Sheets (signature)
- **Style:** panel lateral de altura completa, 75 % del ancho en móvil y 384 px en escritorio, fondo Hoja, padding 24 px, título de 18 px.
- **Behavior:** es la superficie de captura en campo. El cuerpo hace scroll y las acciones viven en un footer fijo; el cierre es una X de 16 px en la esquina. No se usa un diálogo centrado para capturas de más de tres campos.

## Do's and Don'ts

### Do:
- **Do** usar los tokens del tema para el chrome y las familias `-100/-800` de Tailwind solo para sellos de estado.
- **Do** escribir el naranja con la tinta correcta: Grafito sobre el relleno, Naranja profundo cuando el naranja es texto.
- **Do** abrir cada página con título de 24 px/600, subtítulo de 14 px en Lápiz y una sola acción primaria a la derecha.
- **Do** mantener el cuerpo en 14 px, los metadatos en 12 px y los rubros en 10–11 px mayúsculas con tracking 0.05em.
- **Do** usar `tabular-nums` en toda cifra comparativa y monoespaciada en RFC, CURP, CLABE, folios y asientos.
- **Do** separar con Regla de 1 px y reservar la sombra para controles, tarjetas y paneles flotantes.
- **Do** usar radios de 6 px en controles, 8 px en rieles y 12 px en tarjetas.
- **Do** capturar en un sheet lateral en móvil, con la acción principal fija en el footer.
- **Do** acompañar el color de estado con su etiqueta textual: el color nunca es el único portador del significado.
- **Do** conservar los anillos de foco de 1 px y nombrar con `aria-label` todo botón que solo muestra un icono.

### Don't:
- **Don't** introducir degradados, glassmorphism, `backdrop-blur` decorativo, fotografía de stock ni tarjetas de marketing dentro del producto.
- **Don't** usar un sello de estado como fondo de página, chrome de navegación o relleno de un botón primario; el naranja corporativo no es un sello.
- **Don't** usar el crema de ajuste para selección, hover, advertencia o decoración.
- **Don't** añadir una segunda tipografía, una serif de display ni una fuente “de marca”.
- **Don't** pasar de 12 px de radio en superficies ni convertir botones en píldoras; el círculo se reserva a avatares y contadores.
- **Don't** apilar sombras ni levantar tarjetas al hover; el cambio de estado se hace con borde o fondo.
- **Don't** subir la densidad de trabajo a 16 px: tablas, formularios, metadatos y celdas viven en 14 px o menos.
- **Don't** publicar modo oscuro por partes: los tokens `.dark` existen pero están dormidos y no hay selector de tema.
- **Don't** agregar otro destino a la barra inferior de obra sin retirar uno; ya concentra todos los módulos de la obra.
