# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Cinco perfiles dentro de una constructora mexicana. Un usuario puede tener más de un rol.

- **Director** — dueño o dirección general. Registra la empresa, abre obras, asigna equipo y tiene acceso total a todos los módulos de todas las obras. Para operar como otro perfil, inicia sesión con la cuenta de ese perfil. Su trabajo es de dirección: vistas corporativas, desktop-first.
- **Residente** — encargado de la obra, presente en campo. Registra la operación diaria (estimaciones, requisiciones, asistencia, destajos, gasolinas, caja chica, almacén de obra) desde el celular en la obra. Responde por la ejecución de su obra.
- **Auxiliar** — apoya al Residente en captura y registro. Accede a los mismos módulos, pero todo lo que registra requiere el visto bueno del Residente antes de subir al Supervisor.
- **Administrativo** — oficina. Cotiza materiales, arma comparativas, genera órdenes de compra y tramita pagos; lleva cuentas por pagar, tesorería, almacén central y gastos de oficina.
- **Supervisor** — filtro de autorización entre el Residente y el Administrativo. Nada se paga ni se ejecuta sin su visto bueno; tiene visibilidad completa de las obras que le corresponden y autoriza desde el módulo de la obra, no desde una pantalla aparte.

La constructora puede operar varias obras simultáneas; cada obra tiene su propio equipo, cliente, contrato y presupuesto.

## Product Purpose

ERP PNF reúne en un solo sistema la administración completa de una constructora mexicana: obra, presupuesto, compras, almacén, nómina, destajos, subcontratos, rentas, gasolinas, caja chica, tesorería y contabilidad de obra.

Existe porque la administración de obra genera muchos documentos, consumos y autorizaciones que deben quedar amarrados a la obra que los originó y a la persona que los autorizó, sin depender de reconstruir la información al cierre.

El éxito es que una constructora pueda operar y auditar una obra de principio a fin dentro del sistema: presupuesto autorizado, requisiciones convertidas en órdenes de compra, material recibido, nómina y destajos cerrados por semana, gastos de campo comprobados y un condensado semanal que cuadra.

## Positioning

ERP PNF modela la administración mexicana de obra como estructura del sistema, no como campos añadidos a un ERP genérico: persona moral o física con RFC, presupuesto autorizado por renglón, requisición, comparativa de cotizaciones, orden de compra, recepción en almacén, cuenta por pagar, tesorería y condensado semanal, con el vocabulario y el orden en que una constructora mexicana realmente trabaja.

El producto empieza como herramienta interna de una constructora y está construido multi-empresa desde el origen (onboarding de empresa, datos aislados por compañía), de modo que pueda abrirse a terceros más adelante sin rehacer el modelo.

## Operating Context

- **Dos escenarios de uso.** Campo: Residente y Auxiliar capturan desde el celular. Corporativo: Dirección y Administración trabajan desde escritorio.
- **La semana es el ciclo operativo.** Nómina de obra, cierre de almacén, reembolso de caja chica y condensado semanal se cierran por semana.
- **El presupuesto autorizado es la base.** Se carga como archivo Excel (`.xlsx`) al crear la obra o después, desde dentro de la obra; los renglones del presupuesto son la referencia contra la que se estima y se gasta.
- **Cadena documental de compra.** Requisición de obra → visto bueno del Supervisor → solicitud y comparativa de cotizaciones → orden de compra → recepción en almacén → cuenta por pagar → pago en tesorería.
- **Datos de la obra.** Nombre, tipo (Industrial, Comercial, Residencial, Infraestructura, Vivienda en serie, Urbanización), cliente, número de contrato, ubicación, fecha de inicio y fecha de terminación.
- **Equipo mínimo por obra.** Para poder operar, el Director asigna al menos un Residente y un Administrativo. Solo puede haber un Residente y un Administrativo por obra.
- **Autorización configurable.** Cada empresa ajusta qué rol puede ejecutar cada acción. Dirección tiene acceso total mientras opera con su propio rol; al seleccionar temporalmente otro rol, aplican los permisos de ese rol hasta que regresa al suyo. Las acciones sensibles se validan también en el servidor, no solo en la navegación.
- **Documentos que entran y salen.** El presupuesto autorizado se carga desde Excel (`.xlsx`) o se anexa en PDF; las solicitudes de cotización se emiten en PDF; los catálogos de insumos se importan y exportan en Excel.
- **Avisos dentro del producto.** Notificaciones y contadores de pendientes por módulo avisan lo que espera autorización o captura.

## Capabilities and Constraints

**Onboarding.** Registro de empresa en dos pasos: datos de la empresa (persona moral o física, razón social o nombre completo, RFC) y cuenta del Director (nombre, correo, contraseña). Al terminar se crea la empresa, el usuario con perfil de Director y se entra al dashboard corporativo.

**Roles personalizados.** El Director puede crear roles por empresa desde la tabla de permisos y asignarlos al equipo. Cada rol conserva un perfil operativo base (Residente, Auxiliar, Administrativo o Supervisor) para los flujos, módulos y reglas RLS existentes; copia sus permisos actuales al crearse y después mantiene una matriz independiente. Un permiso nuevo sin configurar queda denegado para roles personalizados. Director conserva acceso total y no puede usarse como perfil base.

**Permisos por obra.** Cada obra hereda la matriz de la empresa. El Director configura excepciones por rol estándar o personalizado desde Configuración de la obra → Permisos: heredar, permitir o denegar. Una excepción sustituye la regla de empresa para ese rol, acción y obra; entre varios roles se mantiene la unión de permisos. Volver a heredar elimina la excepción. Los cambios corporativos afectan a las casillas heredadas. Las excepciones no conceden acceso a obras, no modifican los perfiles operativos ni eliminan vistos buenos o restricciones del proceso. Las acciones corporativas quedan fuera de esta matriz y el Director conserva acceso total. Los cambios se auditan y se comprueban en servidor y base de datos.

**Configuración de empresa.** Tres secciones: datos de facturación, equipo (alta de usuarios con los cinco perfiles) y otras configuraciones, aún por definir.

**Creación de obra.** Asistente de tres pasos: datos generales, presupuesto opcional en Excel y asignación de equipo.

**Módulos por perfil.**
- Residente, Auxiliar y Supervisor: estimaciones, órdenes de cambio, requisiciones, nómina, destajos, subcontratos, rentas, gasolinas, caja chica, almacén de obra, tareas y catálogos.
- Administrativo (y Dirección): requisiciones, cuentas por pagar, tesorería, catálogos, almacén central, gastos de oficina, nómina, destajos, subcontratos, rentas, gasolinas, caja chica, tareas, más contabilidad y condensado semanal.
- El Supervisor autoriza desde la obra; no existe una pantalla separada de supervisión.

**Controles ya vigentes.** Rutas y acciones se filtran por el perfil de la sesión y por permiso configurable por empresa (`role_permissions`); las acciones sensibles se validan en el servidor con `requirePermission`, y el aislamiento por empresa se refuerza con RLS en la base de datos.

**Restricciones técnicas.** Next.js 16 (App Router), React 19, Tailwind CSS 4, Supabase para autenticación, PostgreSQL y almacenamiento, Zustand para estado global, TanStack Query para datos de servidor. La lógica de negocio vive en server functions (`src/lib/api/*.functions.ts`) con fachadas generadas; las operaciones que saltan RLS (onboarding, equipo, cambio de rol) usan la service role key solo en servidor. Módulos de obra mobile-first; vistas corporativas y administrativas desktop-first.

**Decisiones abiertas.** El contenido de "otras configuraciones" no está definido. No hay estándar de accesibilidad acordado, ni precio, licenciamiento o modelo de venta definidos. El repositorio no registra un destino de producción: hoy corre contra un Supabase local de demostración.

## Brand Commitments

- El nombre **ERP PNF** es definitivo.
- El producto se escribe en **español mexicano de obra**: requisición, estimación, destajo, caja chica, visto bueno, condensado semanal. Los términos del oficio no se traducen ni se sustituyen por jerga de ERP genérico.
- La única marca gráfica existente en el código es el monograma "P" sobre fondo primario; no hay logotipo, isotipo ni manual de identidad.

## Evidence on Hand

- **Datos de demostración locales.** El proyecto corre contra un stack local de Supabase con datos demo; no hay constructoras ni usuarios reales operando en producción todavía.
- **Esquema real y maduro.** Más de ochenta migraciones definen el modelo completo (obras, presupuesto por renglón, estimaciones, requisiciones, cotizaciones, órdenes de compra, almacén por semana, nómina, destajos, subcontratos, rentas, gasolinas, caja chica, cuentas, pagos, asientos contables, cuentas por pagar, gastos de oficina).
- **Brief fundacional** en `README.md`: alcance, perfiles, módulos y reglas de operación originales.
- **Ausencias que el trabajo futuro no debe rellenar inventando:** no hay testimonios, casos de estudio, clientes, métricas de resultado, precios, licencias, certificaciones ni logotipos. No hay fotografía de obra ni material de marca más allá del monograma.

## Product Principles

1. **La obra es la unidad de todo.** Cada peso, documento y consumo pertenece a una obra concreta; las vistas globales agregan, nunca sustituyen el registro de la obra.
2. **Nada se ejecuta sin visto bueno.** La autorización es parte del registro —quién autorizó, cuándo y sobre qué— no un acuerdo fuera del sistema.
3. **Se captura donde ocurre.** Los módulos de obra deben funcionar de pie, con una mano, desde el celular; los de oficina pueden ser densos y comparativos.
4. **Los permisos viven en el servidor.** Ocultar una ruta o un botón no es seguridad; el aislamiento por empresa y la autorización se verifican en el servidor, no en la interfaz.
5. **Se habla como la obra.** El sistema usa el vocabulario real de la construcción mexicana y el orden real del trabajo, aunque eso lo aleje de la convención de un ERP genérico.
