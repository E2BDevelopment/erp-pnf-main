# Procesos funcionales por módulo — ERP PNF

> Documento de referencia elaborado a partir de la navegación, componentes de interfaz y funciones de servidor existentes en el repositorio. Describe el comportamiento implementado observado; no sustituye reglas operativas que todavía no estén expresadas en el código. Cuando una ruta está conectada a un marcador, se indica explícitamente. Revisar este documento junto con las funciones de `src/lib/api/` al formalizar la documentación funcional.

## 1. Alcance y conceptos comunes

ERP PNF organiza la operación por empresa y obra. La obra es el contexto de presupuestos, compras, consumos, estimaciones y pagos. Las áreas corporativas agregan información de varias obras. El ciclo de trabajo se articula alrededor de semanas, especialmente para nómina, almacén, caja chica y condensado.

### Perfiles y autorización

- **Director:** acceso global y posibilidad de asumir temporalmente la vista de otro perfil. Las acciones realizadas mientras asume un rol de forma interna siguen quedando atribuidas a su usuario Director; la suplantación de usuarios completos solo existe como herramienta de demostración cuando el modo demo está activo.
- **Residente:** operación cotidiana de obra y captura de solicitudes, avances y consumos.
- **Auxiliar:** captura de obra sujeta a revisión conforme a la configuración y al flujo del módulo.
- **Supervisor:** revisa y autoriza operaciones de obra que requieren visto bueno.
- **Administrativo:** gestiona compras, pagos, tesorería, catálogos y procesos administrativos.

Los permisos de navegación determinan qué módulos y acciones aparecen, pero las funciones de servidor vuelven a validar permisos y contexto de empresa/obra. La base aplica aislamiento de datos mediante RLS. Los valores predeterminados de permisos se documentan en `src/lib/permisos/catalogo.ts`; pueden cambiarse por empresa. Por tanto, las atribuciones de perfil que siguen son las predeterminadas o la intención funcional, no una garantía de que cada empresa conserve exactamente esa configuración.

### Convención de estados

Los nombres concretos de estado pueden variar entre entidades. En términos generales, los módulos usan registros en captura/borrador, solicitudes enviadas o pendientes de revisión, autorizadas/aprobadas, rechazadas/canceladas y cerradas/pagadas. Un registro rechazado suele poder corregirse o reabrirse solo cuando la función de servidor contempla esa operación. Las notificaciones y contadores de pendientes anuncian algunos eventos y revisiones; no todas las transiciones necesariamente generan el mismo aviso.

## 2. Flujo integral de compra y abastecimiento

### 2.1 Requisiciones de obra

**Objetivo:** expresar una necesidad de materiales/insumos de una obra y darle seguimiento hasta surtido o compra.

1. El usuario abre la requisición dentro de una obra y consulta solicitudes, partidas, cantidades, estatus y recepciones vinculadas. La navegación contextual de obra también ofrece accesos rápidos a Requisiciones, Almacén, Gastos y Tareas con sus contadores de pendientes.
2. Puede crear una requisición, agregar insumos, guardar una captura como borrador y posteriormente enviarla. La requisición identifica al creador y la obra; el servidor valida el contexto, el permiso y que el borrador siga siendo editable por quien lo creó.
3. El Supervisor revisa la solicitud y puede aprobarla o rechazarla. Una requisición puede cancelarse conforme a las reglas de su estado.
4. El área administrativa gestiona solicitudes de cotización para requisiciones aprobadas, captura propuestas de proveedores y arma paquetes comparativos. La ruta administrativa global `/app/admin/requisiciones` sigue siendo un marcador; el flujo operativo está en la ruta de cada obra.
5. A partir de una propuesta elegida se genera una orden de compra (OC), se envía al flujo de autorización de Supervisor y puede autorizarse, rechazarse/cancelarse o reabrirse según el estado.
6. La OC autorizada puede enviarse al proveedor. El almacén registra las recepciones parciales o completas y las partidas recibidas se vinculan con la requisición/OC.
7. La obligación resultante pasa a Cuentas por pagar y después a Tesorería para registrar uno o más pagos.

**Reglas/documentos relacionados:** requisición, partidas, solicitud de cotización (SC), respuestas de proveedor, paquete comparativo, OC y recepción. Las funciones cubren borrador, envío, cancelación, consulta de recepciones y acceso a OCs por requisición. El módulo de requisiciones administrativo aún aparece como marcador en `AdminModuleView`; la operación detallada de requisiciones está implementada en la ruta de obra y su API.

### 2.2 Solicitudes de cotización y comparativa

El Administrativo obtiene las SC asociadas a la requisición, crea/edita/elimina solicitudes, las marca como enviadas, captura las respuestas recibidas y puede descartar una solicitud. Existe generación de datos y documento PDF para emitir la solicitud. Las cotizaciones se agrupan en paquetes comparables; el paquete seleccionado se usa para generar la OC. El código permite eliminar paquetes y enviar una OC al Supervisor para su visto bueno, y luego al proveedor. La decisión del proveedor y el registro de evidencia externa deben describirse según el proceso real de la empresa: el código gestiona el flujo documental, no demuestra por sí solo el canal de envío real.

### 2.3 Almacén central

La ruta administrativa `/app/admin/almacen-central` está conectada actualmente a un marcador (“Próximamente”), no al módulo de recepciones operativo. El módulo de almacén disponible desde la obra usa la API de recepción y cierre semanal:

1. Lista OCs pendientes de recibir y obtiene el detalle de una OC para captura.
2. Registra recepciones vinculadas a la OC y sus renglones.
3. Consulta la semana activa, registra cantidades utilizadas/consumidas y bloquea la semana.
4. Si se necesita corregir una semana bloqueada, se solicita desbloqueo; el Administrativo revisa solicitudes y resuelve autorizando o denegando.
5. Consulta semanas históricas y el detalle de una semana.

La denominación “central” de la ruta y el proceso real de recepción semanal requieren validación funcional antes de presentar este módulo como almacén central ya terminado.

## 3. Finanzas, pagos y reportes

### 3.1 Cuentas por pagar (CxP)

Consolida obligaciones por origen (entre ellos OCs/proveedores, destajos, subcontratos, caja chica, nómina, gasolinas y gastos de obra, según las funciones disponibles). Presenta saldos y detalles de proveedor, permite consultar pendientes por categoría y registrar/cancelar pagos en las entidades que admiten esas acciones. El pago enlaza obligación, cuenta de salida, fecha, importe y datos de referencia/comprobante capturados por el usuario. Los pagos pueden alimentar movimientos bancarios y asientos contables.

En particular, existen funciones para registrar y consultar pagos de OCs, saldos y detalle por proveedor, pendientes de destajo/subcontrato/caja chica/nómina/gasolina, y pagos de CxP. Los permisos predeterminados permiten ver CxP a Administrativo/Supervisor, registrar y cancelar pagos a Administrativo. Confirmar en la UI si cada categoría queda expuesta en la pestaña correspondiente.

### 3.2 Tesorería y cuentas

Tesorería muestra las cuentas activas de la empresa, sus saldos y movimientos. El catálogo de cuentas permite listar, crear y actualizar cuentas, activarlas/desactivarlas y consultar sus movimientos. Al registrar pagos desde los módulos financieros se selecciona una cuenta y se genera el movimiento correspondiente; cancelar un pago debe revertir o ajustar su efecto conforme a la función específica. Esta pantalla está reservada por interfaz a Director/Administrativo y su descripción visible indica “Cuentas activas de la empresa, saldos y movimientos”.

### 3.3 Contabilidad

El componente de contabilidad ofrece consulta del balance general y su catálogo contable. El acceso se restringe en la interfaz a Director/Administrativo y hay permisos separados para ver balance y condensado. Los asientos se relacionan con eventos financieros originados en pagos y otros procesos. La fuente de cálculo y el detalle de cada póliza se deben validar en `src/lib/contabilidad/` y migraciones antes de definir reglas contables formales; no inferir tratamiento fiscal ni reglas de cierre que no estén en el código.

### 3.4 Condensado semanal

Reporte agregado para comparar, por obra y semana, producción/ingresos, egresos o conceptos de costo registrados. La función `getCondensadoSemanal` entrega el conjunto del periodo; el módulo es de acceso Director/Administrativo. Sirve como punto de conciliación del ciclo semanal. Los conceptos, fórmula de totales y tolerancias deben documentarse contra el cálculo real y validarse con Finanzas antes de usarlo como reporte contable oficial.

### 3.5 Estado de resultados

Las funciones de servidor permiten consultar estado de resultados por semana, histórico, límites de semanas de una obra y acumulado, con agrupación de movimientos en categorías (“buckets”). El módulo aparece como capacidad en la navegación/títulos, pero hay que verificar la ruta de interfaz correspondiente antes de asumir que está expuesto al usuario. No confundir este reporte gerencial con balance general ni condensado.

## 4. Operación de obra

### 4.1 Obras y configuración de obra

El Director/usuario autorizado lista obras, consulta el dashboard/resumen de una obra y crea una obra con información general (nombre, tipo, cliente, contrato, ubicación y fechas), presupuesto opcional y equipo. Puede editar datos, actualizar asignaciones del equipo y administrar comisiones de obra. La configuración de obra permite obtener la información y actualizarla según permisos. El equipo funcional mínimo indicado por producto es Residente y Administrativo, con máximo un integrante de cada uno de esos roles por obra. Las funciones verifican permisos de creación/edición/asignación; las reglas exactas de obligatoriedad deben contrastarse con el validador actual.

### 4.2 Presupuesto y órdenes de cambio

1. Se crea/carga el presupuesto base por obra; se consultan presupuestos y su detalle por renglón.
2. Puede importarse un Excel o extraerse información de un PDF; también existe una plantilla descargable. Los renglones contienen conceptos/partidas, unidad, cantidad, precio unitario e importes según el esquema.
3. Se capturan/guardan renglones y se solicita autorización.
4. El autorizador acepta o rechaza el presupuesto. Un presupuesto autorizado constituye el vigente para medir estimaciones y controlar cambios; las funciones contemplan reapertura y eliminación bajo permisos/estados específicos.
5. Una orden de cambio (OC de presupuesto, distinta de una orden de compra) registra ajustes al presupuesto, con renglones y autorización. Se consulta el vigente y se guardan partidas de la OC.

**Distinción terminológica:** “OC” en Compras significa orden de compra; “orden de cambio” pertenece al control del presupuesto. Conviene usar el nombre completo en documentación y UI.

### 4.3 Estimaciones de obra

El módulo consulta estimaciones por obra, crea o recupera el borrador del periodo, permite capturar cantidades por renglón presupuestal y guardar cambios; el usuario revisa el detalle y cierra/envía la estimación. La estimación compara cantidades/avance capturado contra el presupuesto vigente y conserva el historial. Existe eliminación de registros en estados permitidos. A diferencia de las APIs de destajos/subcontratos, la API de estimación general expone explícitamente borrador, guardar, cerrar, detalle y eliminar; verificar en la UI qué rol realiza la autorización posterior y si está implementada en otro proceso.

### 4.4 Gastos directos de obra

El Residente captura un gasto no tramitado como compra ordinaria, adjunta/relaciona los datos del comprobante y lo envía. El Supervisor autoriza o rechaza. El solicitante o rol habilitado puede cancelar mientras las reglas de estado lo permitan. Gastos autorizados pueden integrarse a CxP para pago. El sistema lista gastos por obra, detalle y gastos pendientes de pago. La clasificación contable, datos obligatorios y límites monetarios dependen del formulario/validador; no asumir topes que no estén definidos.

### 4.5 Nómina de obra

1. Se consultan nóminas por obra/semana; se obtiene o crea el registro del periodo.
2. Se seleccionan trabajadores disponibles y se asignan a la nómina.
3. Se captura asistencia por trabajador y día/periodo. El servidor ofrece validación y persistencia de asistencia.
4. Se cierra la nómina semanal para consolidar el periodo.
5. El panel administrativo agrega nóminas de varias obras, permite revisar/ajustar asistencia según permisos y lista semanas por pagar.
6. Se consultan trabajadores y montos de la semana y se registra el pago de nómina.

La nómina de oficina es distinta: se administra personal de oficina en Gastos de oficina y se genera una nómina del periodo allí. No mezclar sus empleados ni su flujo con la nómina semanal de obra.

### 4.6 Destajos

1. Se crea el destajo ligado a una obra, tercero/contratista y términos; se consultan y actualizan términos, o se elimina según estado.
2. Se seleccionan renglones del presupuesto vigente para definir alcance, precios/cantidades del destajo. Las órdenes de cambio del destajo agregan o modifican alcance y pasan por envío, autorización/rechazo o reapertura.
3. Se asignan trabajadores al destajo; el sistema lista asignaciones activas y puede indicar trabajadores bloqueados por otra asignación.
4. Por semana se obtiene/crea una estimación, se capturan avances/cantidades por renglón y se cierra para revisión.
5. Supervisor autoriza o rechaza la estimación; una rechazada puede reabrirse/corregirse cuando se permite.
6. Puede gestionarse anticipo: consultar saldo, solicitar/cancelar solicitud y registrar pago desde el proceso financiero.
7. Las estimaciones autorizadas alimentan CxP; pagos de anticipo y estimaciones se tramitan mediante las funciones de pago disponibles.

### 4.7 Subcontratos

Proceso paralelo al destajo, pero el contrato es con una empresa/tercero subcontratista:

1. Crear subcontrato y definir términos, tercero, alcance, importes y condiciones.
2. Vincular renglones presupuestales y gestionar órdenes de cambio del subcontrato (captura, envío, aprobación/rechazo, reapertura).
3. Crear estimación semanal, capturar avance, guardarla/cerrarla para revisión.
4. Supervisor autoriza/rechaza; estimaciones rechazadas pueden reabrirse si su estado lo permite.
5. Gestionar anticipo y sus solicitudes/pagos.
6. Estimaciones autorizadas y anticipos pendientes pasan a CxP/pagos.

### 4.8 Rentas de maquinaria/equipo

1. Residente genera solicitud de renta indicando equipo/tercero, obra y condiciones/periodo.
2. Administrativo cotiza la solicitud y registra precio/condiciones.
3. El autorizador aprueba o rechaza la renta.
4. Al ingresar el equipo se marca llegada; al salir se registra devolución.
5. Durante la renta se registran eventos (por ejemplo, cambios o incidencias), con posibilidad de eliminarlos si está permitido.
6. Si se extiende el periodo, se solicita renovación y un autorizador la acepta o rechaza.
7. Se recalculan periodos/cargos y se gestionan pagos registrados; existe eliminación de pago y eliminación de renta condicionadas por estado/permisos.

El detalle conserva el historial del servicio y sus periodos. Confirmar en UI qué periodicidad (día/semana/mes) aplica a cada proveedor; no está universalizada en la descripción de funciones.

### 4.9 Gasolinas / vales de combustible

1. Se emite un vale asociado a una obra y a la necesidad de combustible; se consulta el listado.
2. El autorizador aprueba o rechaza el vale; el solicitante puede cancelarlo según estado.
3. Se liga un código/folio de vale con el registro y se confirma su recepción.
4. Los vales aprobados/recibidos se listan como pendientes de pago y se liquidan agrupando los vales seleccionados.
5. El pago se refleja en CxP/tesorería conforme al flujo financiero.

### 4.10 Caja chica

La caja chica separa la asignación del fondo, los gastos y el reembolso semanal:

1. Se administran asignaciones y monto base del fondo.
2. El responsable solicita un fondo; se autoriza o rechaza. Una vez autorizado, el Administrativo entrega/registra la salida del fondo.
3. El responsable captura cada gasto, actualiza o elimina gastos corregibles y agrega comprobantes/datos requeridos.
4. El Supervisor aprueba o cuestiona los gastos según permisos/estados.
5. Para recuperar lo ejercido, se solicita reembolso del periodo. El Administrativo revisa cada comprobante, puede reclasificarlo y cierra la revisión.
6. El reembolso se autoriza, rechaza o repone/paga; las obligaciones pendientes pasan a CxP.
7. Se consulta el saldo del fondo y el historial de fondos, gastos y reembolsos.

El cálculo de saldo debe considerar fondo entregado, comprobantes aceptados, reclasificaciones, reembolsos y pagos. La implementación de utilidades está en `src/lib/caja-chica-utils.ts`; para políticas (gastos aceptables, plazo, tipos fiscales) seguir la configuración y validar con Administración.

### 4.11 Tareas

Usuarios consultan tareas de la obra o las asignadas a sí mismos, crean nuevas tareas, actualizan estatus y eliminan cuando el estado/permisos lo permiten. La implementación actual es un seguimiento de tareas simple; no asumir subtareas, dependencias, calendarios o aprobaciones formales sin comprobarlas. Revisar campos del formulario y enum de estatus antes de fijar el catálogo documental.

## 5. Gastos y personal de oficina

El módulo permite listar solicitudes de gasto, crear una solicitud, aprobarla/rechazarla o cancelarla conforme a permisos. También gestiona el personal asociado a la nómina de oficina: listar personal, consultar trabajadores disponibles, actualizar la asignación/condición de personal y generar la nómina de oficina para un periodo. Los gastos aprobados pueden incorporarse a CxP y pagarse por Tesorería. Es un flujo corporativo y separado de gastos directos de obra y caja chica.

## 6. Catálogos maestros

### 6.1 Clientes

Lista y consulta fichas de cliente; crea registros que pueden requerir autorización, permite autorizar/rechazar, actualizar y eliminar con validaciones de uso/estado. La ficha maneja datos fiscales y documentos adjuntos; permite subir y eliminar documentos. El alta de cliente se utiliza al configurar obras y contratos.

### 6.2 Terceros: proveedores y subcontratistas

El catálogo lista/busca terceros y muestra el detalle. El alta captura datos de identificación/fiscales y clasificación como proveedor/contratista (según constantes de UI), pasa por autorización/rechazo si aplica, y permite actualización/eliminación controlada. Admite documentos y su eliminación. Existe consulta de estado de cuenta de proveedor vinculada a obligaciones/pagos. Los mismos terceros pueden alimentar cotizaciones, OCs, rentas, destajos y subcontratos.

### 6.3 Trabajadores

El catálogo permite listar/buscar, consultar ficha, crear, editar, autorizar y eliminar trabajadores según permisos/estado. Maneja datos personales/laborales, cálculos/ayudas de datos IMSS en el cliente y documentos adjuntos. Los trabajadores autorizados/disponibles se asignan a nóminas y/o destajos. La ficha maestra no equivale a una nómina ni registra asistencia por sí sola.

### 6.4 Insumos

Permite buscar y filtrar el catálogo por estatus, consultar métricas, categorías, unidades e historial de precios, además de importar insumos desde archivo. Las solicitudes de alta pueden proponer también una categoría y/o unidad nuevas; estas quedan pendientes de autorización del Director. El Director administra categorías y unidades y revisa solicitudes pendientes. Los insumos conservan estatus autorizado, pendiente o rechazado: los rechazados permanecen en el catálogo y no se pueden enviar en una requisición; el borrador debe quitar el insumo rechazado antes de enviarse. La autorización valida que la unidad y categoría asociadas estén autorizadas. Las requisiciones muestran el estatus del insumo para orientar la captura.

### 6.5 Unidades de negocio

Configuración corporativa para listar, crear, editar y eliminar unidades de negocio. No confundir este catálogo con las unidades físicas de medida de los insumos ni con las obras.

## 7. Administración de empresa, usuarios y cuenta

### 7.1 Onboarding

Registro de dos etapas: datos de la persona moral/física (razón social o nombre completo y RFC) y cuenta Director (nombre, correo y contraseña). La operación de servidor crea empresa, identidad y relación de usuario/rol y conduce al dashboard. Es una operación privilegiada ejecutada solo en servidor.

### 7.2 Configuración de empresa

La pantalla agrupa identidad/datos de facturación, logo, documentos, cuentas bancarias, equipo, permisos y preferencias de notificación. Las funciones permiten consultar y guardar datos de facturación/configuración, subir y obtener URL firmada del logo, gestionar documentos de empresa, capital social, cuentas, miembros/roles y permisos. La sección “otras configuraciones” puede contener elementos aún no definidos.

### 7.3 Equipo de empresa

Se listan miembros; un usuario autorizado invita/agrega miembros con un rol, actualiza roles y elimina miembros. La gestión usa operaciones de servidor con privilegios elevados cuando se requiere omitir RLS. Las asignaciones de obra se configuran aparte en cada obra.

### 7.4 Permisos y preferencias

El Director consulta y actualiza qué roles pueden ejecutar acciones del catálogo de permisos. Las preferencias de notificación se listan y actualizan por usuario. Los permisos afectan la disponibilidad de rutas y acciones; la comprobación en servidor y RLS permanece como control de seguridad.

### 7.5 Mi cuenta, login y sesión

El usuario inicia sesión por autenticación Supabase, obtiene contexto de sesión/perfil/empresa/roles y puede actualizar su perfil. Al cerrar sesión, se cierra la sesión de Supabase y se limpia el estado local. Las rutas autenticadas están bajo el layout protegido; onboarding/login son rutas separadas.

## 8. Dashboard, pendientes y notificaciones

### Dashboard corporativo

Consulta agregados de empresa y ofrece un punto de entrada a obras y procesos corporativos. No sustituye la vista contextual de una obra. La granularidad del contenido depende de rol y permisos.

### Dashboard de obra

Proporciona resumen/contexto de obra (nombre, cliente, contrato y datos de avance que entregue la función). El encabezado se reutiliza para identificar la obra en sus módulos.

### Pendientes

Las funciones de pendientes agregan elementos por módulo para mostrar badges de navegación. Hay consulta administrativa y por obra y actualizaciones en tiempo real. Un contador orienta al usuario, pero la fuente de verdad del estado sigue siendo el registro y su función de autorización.

### Notificaciones

Se consultan notificaciones propias, se marca una notificación o todas como leídas y se configuran preferencias. Se muestran mediante campana/listado. La notificación comunica que hay una acción o cambio; no autoriza por sí misma la operación.

### Bitácora de auditoría

La ruta `/app/auditoria` está disponible para el Director real de la empresa (la vista temporal de otro rol no concede acceso). Antes de cada consulta se vuelve a validar la contraseña de la cuenta. La bitácora muestra cambios registrados por empresa, en orden descendente, con actor, fecha, tabla, operación (creación, edición o eliminación), identificador del registro y campos afectados. Permite filtrar por operación y nombre de tabla, paginar en bloques de 50 y bloquear/cerrar la consulta para limpiar el resultado y la contraseña de la pantalla. El registro se genera en base de datos para cambios en tablas públicas de negocio; no representa un historial de lecturas ni garantiza por sí solo una explicación semántica de cada cambio.

### Navegación y búsqueda

La lista de obras permite buscar por nombre de obra, cliente, número de contrato o unidad de negocio, y presenta un estado vacío cuando no hay coincidencias. En escritorio el menú lateral agrupa los módulos administrativos por Compras, Dinero, Obra y Operación; en móvil usa una barra inferior contextual y un panel con el menú completo. Los accesos y badges de pendientes dependen del perfil y permisos vigentes.

## 9. Módulos o rutas actualmente incompletos

Algunas rutas administrativas están registradas en navegación pero siguen renderizando `ModulePlaceholder` (“Próximamente”) en `src/app/(authenticated)/app/admin/[...slug]/AdminModuleView.tsx`. En la versión del repositorio revisada esto incluye Requisiciones administrativas, Almacén central, Destajos, Subcontratos, Rentas y Tareas. Puede haber lógica de servidor y vistas funcionales en rutas de obra, aunque la pantalla administrativa global no esté conectada; el estado de una ruta no debe inferirse a partir de que exista su API o componente.

La ruta `/app/admin/gasolinas`, `/app/admin/caja-chica`, `/app/admin/nomina`, `/app/admin/cuentas-por-pagar`, `/app/admin/tesoreria`, `/app/admin/contabilidad`, `/app/admin/gastos-oficina` y `/app/admin/condensado-semanal` sí conectan con sus módulos/componentes correspondientes. El catálogo de subcontratistas `/app/catalogos/subcontratistas` también permanece como marcador. La navegación corporativa incluye dashboard, obras (con búsqueda), nueva obra, catálogos, equipo, configuración, auditoría (solo Director), notificaciones y cuenta.

## 10. Matriz breve de trazabilidad de código

| Proceso | Interfaz principal | Funciones de servidor representativas |
|---|---|---|
| Obras y equipo de obra | `src/app/(authenticated)/app/obras/`, `src/components/ObraShell.tsx` | `src/lib/api/obras.functions.ts` |
| Presupuesto y cambios | `src/components/presupuesto/` | `src/lib/api/presupuestos.functions.ts` |
| Estimaciones | `src/components/estimaciones/` | `src/lib/api/estimaciones.functions.ts` |
| Requisiciones y cotizaciones | `src/components/requisiciones/` | `requisiciones.functions.ts`, `solicitudes-cotizacion.functions.ts`, `cotizaciones.functions.ts` |
| Recepción y almacén semanal | `src/components/almacen/` | `src/lib/api/almacen.functions.ts` |
| Nómina de obra | `src/components/nomina/`, `src/components/pagos/` | `src/lib/api/nominas.functions.ts` |
| Destajos | `src/components/destajos/` | `src/lib/api/destajos.functions.ts` |
| Subcontratos | `src/components/subcontratos/` | `src/lib/api/subcontratos.functions.ts` |
| Rentas | `src/components/rentas/` | `src/lib/api/rentas.functions.ts` |
| Gasolinas | `src/components/gasolinas/` | `src/lib/api/vales-gasolina.functions.ts` |
| Caja chica | `src/components/caja-chica/` | `src/lib/api/caja-chica.functions.ts` |
| Gastos de obra/oficina | `src/components/gastos-obra/`, `src/components/gastos-oficina/` | `gastos-obra.functions.ts`, `gastos-oficina.functions.ts` |
| CxP y pagos | `src/components/pagos/` | `src/lib/api/pagos.functions.ts` |
| Tesorería/cuentas/contabilidad | `src/components/tesoreria/`, `src/components/contabilidad/` | `cuentas.functions.ts`, `src/lib/contabilidad/` |
| Catálogos | `src/components/clientes/`, `terceros/`, `trabajadores/`, `insumos/` | funciones homónimas en `src/lib/api/` |
| Tareas | `src/components/tareas/` | `src/lib/api/tareas.functions.ts` |
| Notificaciones/pendientes | `src/components/notificaciones/`, `src/components/NotificacionesBell.tsx` | `notificaciones.functions.ts`, `pendientes.functions.ts` |
| Bitácora de auditoría | `src/app/(authenticated)/app/auditoria/page.tsx` | `src/lib/api/auditoria.functions.ts`, `src/lib/audit-context.server.ts`, migraciones de `audit_log` |
| Administración de empresa | `src/components/configuracion/`, `src/components/equipo/` | `company.functions.ts`, `team.functions.ts`, `permisos.functions.ts` |

## 11. Puntos que requieren confirmación funcional antes de documentación normativa

1. Qué acciones capturadas por Auxiliar requieren revisión previa del Residente y en qué módulos; el alcance declarado en producto no aparece necesariamente como un estado uniforme en todas las entidades.
2. Matriz final de permisos por perfil, porque el Director puede modificar permisos por empresa.
3. Quién autoriza cada etapa de estimación general, gasto de oficina, renta y recepción, y los montos/límites aplicables.
4. Fórmulas oficiales de estimación, destajo, subcontrato, CxP, saldos de caja chica y reportes contables.
5. Reglas de cancelación, reapertura, eliminación y auditoría requeridas por la operación.
6. Diferencia operativa y alcance entre “almacén central” y almacén semanal de obra, y disponibilidad real de la pantalla central.
7. Qué módulos se consideran productivos frente a los que aún están conectados a placeholder, revisando cada ruta publicada.
8. Retención, exportación y política de acceso operativo a la bitácora; la interfaz actual ofrece consulta filtrada y paginada, sin exportación documentada.

