---
target: shell autenticado (AppShell + estados transversales)
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 3
p1_count: 2
target_identity: "file:C:\\Users\\enriq\\OneDrive\\Documentos\\NARANJA FORTE\\erp-pnf-main\\erp-pnf-main\\src\\components\\AppShell.tsx"
target_fingerprint: "sha256:deff1a8c98f6f047aafaac0fad47b170b30dcd9c9a23976ec5723100bd614290"
target_path: "C:\\Users\\enriq\\OneDrive\\Documentos\\NARANJA FORTE\\erp-pnf-main\\erp-pnf-main\\src\\components\\AppShell.tsx"
timestamp: 2026-10-27T20-14-40Z
slug: src-components-appshell-tsx
---
# Critique — shell autenticado de ERP PNF

Método: dual-agent (A: revisión de diseño · B: detector). Sin navegador ni Supabase local: la app no se renderizó en ninguna de las dos evaluaciones.

## Design Health Score

| # | Heurística | Nota | Problema clave |
|---|---|---|---|
| 1 | Visibilidad del estado | 2 | El chrome nunca dice dónde estás: sin título de página, sin obra, sin semana, sin rol asumido. El estado activo es una diferencia de relleno de 0.06 L. |
| 2 | Sistema y mundo real | 3 | Vocabulario de obra impecable, roto por "CXP", "Gastos", "Config" y "DEV" en la barra móvil. |
| 3 | Control y libertad | 2 | El chevron de regreso de obra sale a un placeholder; un administrativo en móvil no alcanza 8 de sus 14 módulos; no hay salida del rol asumido persistido. |
| 4 | Consistencia y estándares | 2 | El estado activo se calcula distinto por grupo (`===` vs `startsWith`); dos nombres para el mismo destino; anillo de foco de 1 px vs 2 px. |
| 5 | Prevención de errores | 2 | Suplantación de usuario sin confirmación ni comprobación de rol; cerrar sesión junto a "Mi cuenta" sin guardia de captura en curso. |
| 6 | Reconocer antes que recordar | 2 | 19–32 enlaces, sin búsqueda, sin fijados, sin recientes; los módulos escondidos tras el quinto lugar del scroll. |
| 7 | Flexibilidad y eficiencia | 2 | Sin paleta de comandos, sin atajos, sin creación global, sin cambiador de obra; la única herramienta de poder es la de desarrollo. |
| 8 | Estética y minimalismo | 3 | Disciplinado: plano, un solo acento, radios 6/8/12, separación por regla. Lo socavan tres navegaciones paralelas y una píldora "DEV". |
| 9 | Reconocer, diagnosticar y recuperar | 3 | Tres niveles de frontera de error con referencia y reintento, y salida alterna; los pendientes fallan abiertos (eso penaliza el estado, no la recuperación). |
| 10 | Ayuda y documentación | 1 | Sin ayuda, sin leyenda del contador, sin explicación de qué es un pendiente por rol. |
| **Total** | | **22/40** | **Aceptable** (banda 20–27) |

A entregó 21/40 y lo etiquetó "Poor (18–23)". La banda citada no existe en la guía (20–27 es Acceptable, 12–19 es Poor) y su 2 en la heurística 9 contradecía su propia evidencia: tres fronteras de error con lenguaje llano, referencia, reintento y ruta alterna es exactamente el 3 de la rúbrica. Subí esa nota; el resto queda como A lo midió.

## Veredicto de especificidad

**Las palabras son de una constructora mexicana; la composición no.** Los destinos y su orden son la cadena real de obra: Presupuesto → Estimaciones → Requisiciones → Nómina → Destajos → Subcontratos → Almacén → Rentas → Gasolinas → Caja chica → Gastos de obra → Tareas. Ninguna abstracción de ERP genérico sobrevive, salvo "Dashboard". Pero quite las etiquetas y queda la plantilla shadcn: sidebar navy de 256 px, barra de 56 px con logo a la izquierda, campana y avatar a la derecha, barra inferior de 64 px, menú de cuenta. Cambie las cadenas y se envía igual como CRM de clínica.

El North Star de DESIGN.md, "la bitácora de obra", aparece en el chrome solo como un valor hexadecimal. No hay renglón, no hay folio, no hay atribución ("capturó / autorizó") y, sobre todo, **no hay semana en ninguna parte**: PRODUCT.md dice que la semana es el ciclo operativo y el shell nunca dice en qué semana está ni si está cerrada. Tampoco dice en qué obra está: el grupo de navegación se llama "Obra", no como la obra. En una constructora con varias obras simultáneas, el control número uno del shell es "¿en qué obra estoy?" y no existe.

Las dos ideas propias son los contadores de pendientes y la cadena de módulos de obra. Ambas son semillas, no sistemas terminados: el contador es un punto rosa sin unidad ni leyenda cuya ausencia es indistinguible de cero, y la cadena son 936 px de scroll dentro de una barra de 360 px. Un shell construido para este producto abriría con "qué espera mi visto bueno, en qué obra, de qué semana". Hoy abre con una tarjeta que dice "Próximamente".

**Escaneo determinista:** 14 archivos, 2 hallazgos, ambos `design-system-font-size` en `MobileBottomBar.tsx:68` y `:90`, ambos de 11 px. Cero defectos reales, cero falsos positivos: DESIGN.md documenta la rampa micro como 10–11 px en cuatro lugares, así que los dos son excepciones documentadas. El detector resuelve la rampa solo desde el front-matter, donde `micro` vale 10 px; de ahí el desacuerdo. Un escaneo de todo `src/` devuelve 73 hallazgos de tamaño, 67 de ellos de 11 px: es un desajuste prosa/token del sistema, no un defecto del componente. Detalle relevante para CI: los avisos nunca cambian el código de salida, así que un gate que mire solo `exit` deja pasar estos dos.

**Overlays:** no disponibles. Sin automatización de navegador y sin app corriendo, la inyección del overlay no se intentó; no hay pestaña [Human] ni mensajes de consola que reportar.

## Impresión general

El shell está mejor construido que diseñado. La disciplina de sistema es real: densidad de 14 px, radios correctos, cero decoración, estados transversales que la mayoría de los ERP no tiene. Pero el shell no tiene hogar: todas las salidas de emergencia llevan a una pantalla que anuncia que el producto no está hecho, y el contexto que hace único a este producto (obra, semana, visto bueno) vive en los módulos, nunca en el chrome. La mayor oportunidad no es un componente: es que la llegada al sistema sea la cola de autorizaciones que el Supervisor y el Director abren la app para atender.

## Lo que funciona

- **El contador está montado donde se decide.** Pendientes por módulo en la navegación, por obra en las tarjetas, invalidados en tiempo real con debounce de 300 ms sobre 16 tablas. Para un producto de cadena de autorización es el instinto arquitectónico correcto: la señal vive en el punto de acción, no en un reporte.
- **Disciplina de vocabulario y de orden.** La navegación codifica la secuencia real de obra mexicana y no traduce el oficio: destajo, caja chica, condensado semanal, visto bueno. El estado vacío de notificaciones y la insignia "Requiere VB Residente" demuestran que el copy sabe ser específico cuando alguien lo escribe.
- **Los estados transversales están ingenierizados.** Tres fronteras anidadas, un skeleton de sección que conserva el shell, un 404 que no saca al usuario y un permiso denegado distinto de "próximamente". Casi todos los ERP entregan una pantalla blanca.

## Problemas prioritarios

**[P0] En móvil, el shell administrativo deja la mitad de los módulos inalcanzables.**
Para usuarios con `showAdmin` la barra inferior pinta 8 destinos sin `onMoreClick`; el sheet con el menú completo solo se abre desde la rama corporativa. Requisiciones (primera de `ADMIN_MODULES` y entrada de toda la cadena de compra), Caja chica, Tareas, Almacén central, Destajos, Subcontratos, Rentas y Gasolinas no se alcanzan en un teléfono; Tesorería, Contabilidad y Gastos exigen scroll a ciegas.
*Arreglo:* dar a la rama administrativa el mismo `onMoreClick` + sheet, y fijar la barra en cuatro (CXP, Requisiciones, Obras, Más) en lugar de un scroll de ocho.
*Comando:* `/impeccable adapt`

**[P0] Todo inicio de sesión aterriza en un "Próximamente", que además es el destino de todas las salidas.**
`/app` es la casa autenticada de los cinco perfiles y una tarjeta de obra en construcción; el chevron de regreso de una obra, el botón del error de sección, el 404 interno y el "Volver al panel" del permiso denegado apuntan ahí. La primera pantalla después de entrar es un aviso de que el producto no está terminado.
*Arreglo:* convertir `/app` en "lo que espera de ti" por rol (autorizaciones pendientes agrupadas por obra, cierres de la semana, tus obras) o, mientras eso no exista, redirigir a cada perfil a su casa real: Director a Obras, Residente y Supervisor a su obra.
*Comando:* `/impeccable shape`

**[P0] Un control de suplantación sin guardia ocupa el chrome principal.**
`DevUserSwitcher` se renderiza siempre en la barra superior, con el peso visual del menú de cuenta y rotulado "DEV" en inglés dentro de un producto en español. `impersonateUser` solo comprueba que el destino comparta empresa: no exige rol. Cualquier Auxiliar puede convertirse en el Director. En un producto cuyo principio es que nada se ejecuta sin visto bueno y que el registro dice quién autorizó, es un agujero de seguridad y una declaración de que la auditoría es decorativa.
*Arreglo:* sacarlo del shell, condicionarlo por entorno y exigir rol de Director en el servidor; si la simulación es una función real, construirla como modo de primera clase con banner persistente. La función `switchRole` ya existe y no se llama desde ningún lado.
*Comando:* `/impeccable harden`

**[P1] La orientación se cae pasados diez destinos y el shell nunca nombra su contexto.**
Hasta 32 filas en la barra lateral, sin búsqueda, sin fijados, sin recientes, sin cambiador de obra. El grupo de obra se titula "Obra" y no como la obra. La barra superior no tiene título de página y ninguna ruta del árbol autenticado declara `metadata` ni cambia `document.title`: cuatro pestañas de obra son cuatro pestañas idénticas. Además, el grupo administrativo se recorre directo desde `ADMIN_MODULES` sin filtro de permisos, mientras dos filas más arriba "Nueva obra" sí se condiciona con `can()`: una empresa que revoca un permiso sigue viendo el módulo.
*Arreglo:* filtrar cada grupo por `usePermisos().can()`, poner obra + semana + rol en la barra superior, partir Administración en Compras, Dinero y Operación (≤4 cada uno) y añadir búsqueda arriba de la navegación.
*Comando:* `/impeccable layout`

**[P1] Las señales de estado fallan en silencio y no dicen qué miden.**
`safeCount` devuelve 0 ante cualquier error y `usePendientesAdmin` convierte una carga ausente en `{}`: un Supervisor cuya consulta falló ve exactamente la misma interfaz que alguien sin nada que autorizar. `staleTime: Infinity` vuelve inerte el refresco al enfocar, así que el realtime es la única vía. El contador es un número pelado: el nombre accesible del enlace es "Requisiciones 3", la tarjeta de obra muestra "9+" sin leyenda, y es blanco de 10 px sobre `rose-500`, 3.66:1, por debajo de AA en la señal más importante del producto.
*Arreglo:* distinguir "cero", "desconocido" y "error" en la insignia, etiquetarla con unidad ("3 requisiciones por autorizar"), subir el contraste a `rose-600` o usar tinta `rose-700` sobre `rose-50`, y mostrar una fila "No se pudieron cargar los pendientes" cuando la consulta falle.
*Comando:* `/impeccable polish`

## Banderas por persona

**Alex (Director, cuatro obras, 1440 px).** No distingue cuatro pestañas: ninguna ruta cambia el título y el grupo de obra no dice qué obra es. Su único indicador de contexto es un color de relleno. Saltar del mismo módulo entre dos obras cuesta: chevron → "Próximamente" → Obras → elegir → Requisiciones. No hay búsqueda, fijados, recientes ni atajos. Ni la barra superior ni la lateral son sticky, así que en una tabla larga de requisiciones pierde la navegación y la campana. "Obras" y "Nueva obra" comparten el mismo icono de casco a 16 px de distancia: tiene que leer en lugar de reconocer.

**Sam (lector de pantalla y teclado).** No existe enlace de salto al contenido: tras cada cambio de ruta el recorrido es logo → campana → DEV → avatar → hasta 32 enlaces antes del contenido. El `<nav>` de escritorio no tiene nombre accesible, aunque el móvil sí; al abrir el sheet quedan dos navegaciones sin nombre. Los contadores entran al nombre del enlace como un dígito sin unidad. El estado activo es relleno y peso, sin cambio de título, sin foco al `<h1>` y sin región viva: la navegación de cliente no anuncia nada.

**Casey (Residente, 360 px, una mano, con guantes).** La barra de obra son 13 destinos por 72 px dentro de una barra de 360: caben cinco, sin asomo, sin degradado y sin scrollbar, así que Caja chica, Gasolinas, Gastos de obra, Tareas y Configuración son invisibles, y justo dos de sus capturas diarias quedan fuera. Su salida de un módulo es un chevron de 16 px, con área de toque de unos 24 px, que va al dashboard y no a su obra. Campana de 36 px y avatar de 32 px, por debajo de los 44 px. El padding de safe-area está inerte porque el viewport no declara `viewportFit: "cover"`. Y donde debería haber una captura rápida hay una píldora "DEV".

## Observaciones menores

- `CONFIG_MODULES` es código muerto, y está mal por dentro: dos de sus tres entradas apuntan a la misma ruta, y "Equipo", la acción central del Director, no es navegable desde el shell.
- `switchRole` está definido y nunca se invoca, mientras `assumedRole` persiste en localStorage: un Director con esa llave queda convertido en un rol menor, sin indicador y sin regreso.
- La barra lateral fija "Constructoras" bajo "ERP PNF" mientras la barra superior muestra el logo del cliente: dos identidades, y "Constructoras" no es el nombre del cliente.
- El monograma "P" se invierte entre la barra lateral y las pantallas de error.
- Los títulos de notificación truncan sin `title` ni expansión, y las horas son absolutas en un feed que se refresca cada 30 segundos, donde lo útil es "hace 12 min".
- `/app/clientes` existe fuera de toda navegación (Catálogos sirve `/app/catalogos/clientes`): ruta duplicada huérfana. Las páginas de módulo de obra renderizan dos `<h1>`.

## Preguntas para pensar

1. Si la semana es el ciclo operativo, ¿por qué el shell nunca dice qué semana es ni si está cerrada? Una barra que dijera "Semana 34 · 12–18 oct · Obra Cumbres · Residente" haría más por la especificidad del producto que cualquier componente de DESIGN.md.
2. El contador rosa es lo único en el chrome que dice "algo te espera". ¿Es una función o el marcador de posición de una superficie que nadie ha diseñado: la cola de vistos buenos?
3. Cuando un Director actúa como Residente, ¿qué en el chrome lo prueba, para él, para el Residente cuyo nombre aparece en pantalla y para el auditor que lea el registro en seis meses? Hoy la única huella es una llave de localStorage sin interfaz.
