# Plan de corrección de seguridad — ERP Naranja Forte

> **Estado:** cambios en repositorio; despliegue y validación pendientes · **Fecha:** 30/10/2026  
> **Base:** hallazgos SEC-01 y SEC-03–SEC-08 del [Plan de Testing](PLAN-DE-TESTING.md).  
> Este documento define acciones y criterios de cierre. La implementación en código no equivale a la validación de los ambientes.

> **Seguimiento 30/10/2026:** se implementaron cambios en el repositorio para SEC-01 y SEC-03–SEC-08, además de pruebas de regresión y configuración/documentación del secreto del hook. La migración aún debe aplicarse a la base local y después a staging/producción; los cambios no se consideran cerrados hasta ejecutar y revisar la evidencia de la sección 6.
>
> El límite de frecuencia por IP de SEC-06 requiere configuración del gateway de despliegue, que no está definido en este repositorio. Antes del GO, establecer allí un límite para el endpoint; los bloqueos transaccionales añadidos en la base reducen el riesgo de ejecuciones concurrentes.

## 1. Objetivo y alcance

Eliminar las rutas de escalamiento de privilegios, ruptura del aislamiento entre empresas y obras, ejecución no autorizada de operaciones contables y privilegios innecesarios detectados en la ejecución local. El plan incluye SEC-01, SEC-03, SEC-04, SEC-05, SEC-06, SEC-07 y SEC-08. SEC-02 se consolidó en SEC-01/SEC-03 y no requiere una remediación separada.

La evaluación disponible es local; antes de reabrir producción, se deben verificar las migraciones y la configuración efectiva en staging y producción. Los responsables se expresan por función y deben asignarse a personas del equipo.

## 2. Prioridad y orden de ejecución

| Ola | Hallazgos | Prioridad | Salida requerida |
|---|---|---|---|
| 0 — Contención | SEC-01, SEC-04, SEC-06 | P0, bloqueo de producción | No hay cambio de empresa ni autoasignación de rol privilegiado; hook cerrado sin credencial válida |
| 1 — Aislamiento | SEC-03, SEC-05 | P0, bloqueo de producción | Autorización por obra en RLS y en RPC; ninguna autoasignación indebida |
| 2 — Endurecimiento | SEC-07, SEC-08 | P1 | Cabeceras verificadas y privilegios SQL mínimos |
| 3 — Validación y salida | Todos | P0 | Migraciones verificadas, suite de seguridad verde y aprobación de seguridad/negocio |

**Responsables sugeridos:** Backend/DBA para migraciones y RLS; backend para endpoint y server functions; plataforma/DevOps para secretos, cabeceras y despliegue; QA para pruebas negativas y regresión; responsable de seguridad para revisión independiente y autorización del GO.

## 3. Acciones por hallazgo

### SEC-01 — Modificación de `profiles.company_id` (crítico)

**Evidencia:** la política `Users update own profile` permite actualizar cualquier columna del perfil propio. El usuario puede cambiar el `company_id` que usa `current_company_id()` para resolver acceso.

**Corrección:** crear una migración aditiva que quite el permiso de actualización indiscriminada. Otorgar a `authenticated` actualización únicamente de las columnas de perfil que el usuario puede editar, y mantener `company_id` y otros atributos de autorización fuera de ese conjunto. Si el onboarding/cambio legítimo requiere establecer empresa, efectuarlo en una server function de servidor con validación explícita, credencial de servicio solo en servidor y reglas de negocio. No confiar en ocultar campos en la UI.

**Responsable:** Backend/DBA. **Dependencias:** inventario de columnas actualizables y flujo de onboarding. **Criterio de cierre:** el usuario no puede cambiar `company_id` por PostgREST ni por RPC; actualizar campos permitidos sigue funcionando; las pruebas demuestran que una empresa no puede leer ni modificar datos de otra.

### SEC-04 — Autoasignación del rol `director` (crítico)

**Evidencia:** la política `User inserts own director role on onboarding` solo comprueba `user_id = auth.uid()`.

**Corrección:** eliminar el INSERT directo de usuarios autenticados en `user_roles`. Crear el rol inicial únicamente en onboarding de servidor, validando identidad, empresa y estado del alta. Restringir también UPDATE/DELETE de roles a un administrador autorizado de esa empresa; conservar la operación privilegiada en servidor. Registrar actor, objetivo, empresa, rol anterior/nuevo y fecha en auditoría.

**Responsable:** Backend/DBA. **Criterio de cierre:** ningún usuario puede asignarse un rol, alterar el rol de terceros ni convertirse en director por PostgREST; onboarding válido crea el rol esperado; los cambios administrativos quedan auditados.

### SEC-06 — Hook contable público con `service_role` (crítico)

**Evidencia:** `POST /api/public/hooks/devengar-rentas` no autentica la solicitud y ejecuta RPC contables con `supabaseAdmin`.

**Corrección:** proteger el hook con secreto de cron de alta entropía o HMAC con timestamp y protección contra replay; comparar secretos en tiempo constante y mantenerlos solo en entorno servidor. Rechazar credenciales ausentes/incorrectas antes de importar o llamar al cliente admin. Añadir límite de frecuencia y controles de tamaño/método. Hacer las RPC idempotentes (o fijar clave de idempotencia/periodo contable) y registrar resultado sin guardar el secreto. Responder con errores genéricos, sin exponer mensajes internos. Rotar cualquier secreto si el endpoint estuvo accesible en un entorno real sin protección.

**Responsable:** Backend + Plataforma. **Criterio de cierre:** 401/403 sin credencial, ejecución correcta con credencial válida, llamadas repetidas no duplican asientos/periodos, y los logs no filtran secretos ni detalles internos. Ejecutar pruebas contra base aislada con datos sintéticos.

### SEC-03 — RLS de obras/equipo/comisiones solo por empresa (alto)

**Evidencia:** migración `20260728171938_d3a2d030-f22a-43bb-8e90-3a4bfa528576.sql` amplió políticas `FOR ALL` a cualquier integrante de la empresa. Esto hace depender la protección de la capa de aplicación y habilita acceso directo por PostgREST.

**Corrección:** reemplazar políticas amplias por políticas separadas para SELECT/INSERT/UPDATE/DELETE. Para datos de obra, permitir acceso a miembros asignados a esa obra y a roles administrativos explícitamente autorizados; verificar tanto la obra existente (`USING`) como el destino (`WITH CHECK`) en cambios. Aplicar el mismo control a `obra_comisiones` y tablas dependientes de `obra_id`. Si se crea `can_access_obra`, usar `SECURITY DEFINER` solo si hace falta, fijar `search_path`, calificar objetos y revisar grants para evitar bypass o recursión de RLS. Alinear los guards de todas las server functions/RPC con la misma matriz.

**Responsable:** Backend/DBA. **Criterio de cierre:** residente de obra A no puede leer ni mutar obra B por PostgREST, RPC ni interfaz; director autorizado conserva acceso según el modelo aprobado; se cubren obras, equipos, comisiones y módulos relacionados.

### SEC-05 — Autoinscripción en `obra_team` (alto)

**Evidencia:** la política permite a cualquier miembro agregar filas de equipo en una obra de su empresa, incluso su propia asignación.

**Corrección:** revocar mutaciones directas de `obra_team` a miembros generales. Autorizar INSERT/UPDATE/DELETE solo a director o responsable con permiso específico de administrar el equipo de esa obra. Bloquear autoasignación salvo flujo administrativo autorizado. Validar que usuario y obra pertenecen a la misma empresa y registrar cambios de asignación.

**Responsable:** Backend/DBA. **Criterio de cierre:** cada rol no autorizado recibe denegación al intentar asignarse o asignar a terceros; el administrador autorizado puede gestionar miembros de las obras permitidas; no se generan duplicados.

### SEC-07 — Cabeceras HTTP (medio)

**Evidencia:** no se detectaron CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` ni `Permissions-Policy`; la respuesta expone `X-Powered-By`.

**Corrección:** configurar cabeceras en la capa de despliegue/Next.js: CSP compatible con los recursos legítimos y probada primero en modo report-only; HSTS solo en HTTPS y una vez confirmado el dominio; `nosniff`; política contra framing (`frame-ancestors` y/o `X-Frame-Options`); `strict-origin-when-cross-origin`; `Permissions-Policy` mínima. Deshabilitar `poweredByHeader`. Revisar CSP con los flujos de autenticación, Supabase, fuentes y reportes antes de aplicarla en modo enforcement.

**Responsable:** Plataforma + Frontend. **Criterio de cierre:** cabeceras presentes en respuestas de producción/staging, sin romper login ni recursos; no se expone `X-Powered-By`; TLS confirmado antes de HSTS.

### SEC-08 — Privilegios SQL amplios y `TRUNCATE` (medio)

**Evidencia:** el reporte local encontró grants amplios, incluido `TRUNCATE`, en 73 tablas para roles de API. `TRUNCATE` no está protegido por RLS.

**Corrección:** generar inventario de grants efectivos, incluido `PUBLIC`, `anon`, `authenticated`, secuencias, funciones y privilegios por defecto. Revocar `TRUNCATE`, `TRIGGER` y `REFERENCES` donde no sean necesarios; conceder por tabla/operación solo lo requerido por los flujos reales. Revisar `ALTER DEFAULT PRIVILEGES` para que objetos futuros hereden el mínimo privilegio. Probar el cambio con las funciones de la app y mantener `service_role` únicamente en servidor.

**Responsable:** DBA/Backend. **Criterio de cierre:** roles públicos/de usuario no tienen `TRUNCATE` ni privilegios no justificados; tablas y objetos nuevos cumplen el baseline automatizado; operaciones legítimas siguen funcionando.

## 4. Secuencia y entregables

1. **Inventario y contención:** confirmar si hubo despliegue/exposición real, cerrar o proteger el hook, revisar cambios de empresa y rol anómalos y preservar evidencia de auditoría. No revertir cambios de datos sin análisis y respaldo.
2. **Diseño de migraciones:** preparar migraciones nuevas y reversibles cuando sea viable; documentar impacto, datos afectados, grants/policies previos y recuperación. No editar migraciones ya aplicadas en ambientes compartidos.
3. **Corrección de controles:** aplicar SEC-01/04 primero; SEC-03/05 en el mismo ciclo de base de datos para evitar ventanas con políticas inconsistentes; luego SEC-08 y SEC-07.
4. **Pruebas negativas y positivas:** convertir los casos marcados como `it.fails` en pruebas normales que esperan denegación; añadir cobertura por actor × empresa × obra × operación para PostgREST y RPC. Añadir tests de credencial incorrecta/correcta/idempotencia del hook y de grants.
5. **Despliegue controlado:** validar en staging con datos sintéticos, revisar logs, ejecutar pruebas de regresión, planificar ventana de despliegue y rollback. Aplicar a producción solo tras evidencia y aprobación de seguridad/negocio.
6. **Cierre:** adjuntar IDs de migración, salida de pruebas, consulta de grants y cabeceras, y aprobación; actualizar estado de cada hallazgo en el Plan de Testing.

## 5. Puertas de salida (GO/NO-GO)

El sistema permanece **NO-GO para producción** mientras haya cualquier SEC crítico o alto abierto. Autorizar GO únicamente cuando:

- SEC-01/03/04/05/06 estén corregidos y las pruebas negativas esperen denegación real (no `.fails`).
- Las lecturas y escrituras legítimas funcionen para cada rol y obra en RLS, RPC y aplicación.
- SEC-06 valide autenticación antes de operaciones privilegiadas y su ejecución sea idempotente.
- SEC-07 se confirme en HTTPS de staging/producción, y SEC-08 en grants efectivos y privilegios por defecto.
- No haya regresiones en onboarding, gestión de equipo, permisos, módulos contables ni `demo:verify`.
- Se revisen logs/auditoría y se documente el resultado de cualquier análisis de exposición histórica.
- Seguridad/DBA y dueño del producto firmen la aceptación de la evidencia.

## 6. Evidencia de cierre por hallazgo

| Hallazgo | Evidencia mínima |
|---|---|
| SEC-01 | Prueba PostgREST de actualización de `company_id` denegada + lectura cruzada denegada |
| SEC-04 | Pruebas de autoasignación y asignación a terceros denegadas; onboarding legítimo aprobado |
| SEC-06 | 401/403 sin secreto, éxito con secreto en entorno aislado, repetición idempotente, revisión de logs |
| SEC-03 | Matriz de permisos por obra para SELECT/INSERT/UPDATE/DELETE en tablas sensibles y RPC |
| SEC-05 | Inserción/edición/borrado de equipo por roles autorizados y no autorizados; auditoría |
| SEC-07 | Captura/automatización de cabeceras sobre HTTPS y revisión de errores CSP |
| SEC-08 | Consulta de grants antes/después, prueba de no `TRUNCATE` y validación de privilegios por defecto |

## 7. Riesgo residual y supuestos

No hay evidencia de pruebas en staging/producción ni de análisis histórico de accesos. El reporte local basta para tratar los hallazgos como bloqueantes, pero no permite determinar si hubo explotación. La revisión de logs, cambios de perfiles/roles, actividad contable y eventos de autenticación debe establecerse como tarea de respuesta a incidente antes de cerrar SEC-01/04/06 si el sistema estuvo expuesto.
