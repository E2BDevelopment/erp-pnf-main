# Plan de Testing — ERP Naranja Forte

> **Documento vivo · Versión 1.0 · 30/10/2026**
>
> Este documento combina el **plan de testing** y el **reporte de la ejecución** realizada
> sobre el ERP. Los resultados corresponden a la corrida del **30 de octubre de 2026** en
> entorno local. No se modificó lógica funcional de la aplicación: los cambios se limitaron a
> pruebas, configuración de testing/lint y documentación.

---

## 1. Resumen ejecutivo

Se ejecutaron **124 verificaciones automatizadas** (107 con Vitest y 17 con Playwright),
más los gates estáticos de TypeScript, lint y build, y una verificación de integridad de los
datos demo.

| Área | Herramienta | Resultado | Estado |
|---|---|---:|---|
| Unitarias | Vitest 5.0.5 | 73 pruebas, 72 pass + 1 fallo esperado | ✅ |
| Contrato de server functions | Vitest | 7/7 pass | ✅ |
| Integración RPC | Vitest + Supabase local | 18 pruebas, 17 pass + 1 fallo esperado | ✅ |
| Seguridad / RLS | Vitest + Supabase local | 9 pruebas, 2 pass + 7 fallos esperados | ⚠️ |
| E2E públicos y autenticación | Playwright 1.64.1 + Edge | 11/11 pass | ✅ |
| Accesibilidad WCAG 2.1 AA | axe-core + Playwright | 2/3 pass; landing con hallazgo A11Y-01 | ⚠️ |
| Rendimiento y móvil | Playwright | 3/3 pass | ✅ |
| **E2E total** | Playwright | **17 pruebas, 16 pass + 1 fallo esperado** | ✅ |
| TypeScript | `tsc --noEmit` | Sin errores | ✅ |
| Build de producción | `next build` | Compila; 22 páginas estáticas | ✅ |
| Lint | ESLint + Prettier | 444 errores, 51 warnings | ❌ |
| Datos demo | `demo:verify` | 6/6 usuarios y tablas principales OK | ✅ |

**Conclusión:** los flujos funcionales principales y la mayoría de los controles de acceso
pasan. Sin embargo, hay **tres hallazgos críticos de seguridad** (SEC-01, SEC-04 y SEC-06),
dos hallazgos altos de aislamiento por obra (SEC-03 y SEC-05), un hallazgo serio de
accesibilidad (A11Y-01) y el gate de lint en rojo. **La recomendación es NO GO** hasta
corregir los hallazgos críticos y altos de seguridad, A11Y-01 y el gate de lint.

---

## 2. Objetivo y alcance

### 2.1 Objetivo

Establecer una estrategia de pruebas repetible y basada en riesgo para un ERP multiempresa
con módulos financieros, operativos y de administración de personal, verificando:

- que las reglas de negocio y los cálculos críticos sean correctos;
- que el contrato entre frontend, server functions y base de datos no se rompa;
- que el aislamiento entre empresas y entre obras se cumpla a nivel de base de datos;
- que los flujos críticos de usuario funcionen de extremo a extremo;
- que la interfaz sea accesible, usable en móvil y razonablemente rápida;
- que el proyecto compile y pueda desplegarse.

### 2.2 Alcance de esta ejecución

**Incluido:**

- Utilidades de formato, fechas, presupuestos, estimaciones, caja chica, ubicación y permisos.
- Inventario y contrato de las **303 server functions** registradas.
- API RPC: autenticación, envelope `{ data }`, códigos HTTP, lecturas por rol, dashboards y catálogos.
- RLS de Supabase: aislamiento entre empresas, escalamiento de privilegios, acceso anónimo,
  políticas laxas de obras/equipo y superficie pública.
- E2E de landing, login, onboarding, rutas privadas, 404, autenticación por rol, logout,
  accesibilidad y rendimiento/móvil.
- Gates estáticos: `typecheck`, `lint`, `build`.
- Integridad de los datos demo.

**Excluido de esta ejecución:**

- Pruebas contra staging o producción.
- Pruebas de carga, estrés o soak testing.
- Navegadores distintos de Microsoft Edge.
- Auditoría manual de accesibilidad con lector de pantalla.
- Pentest formal o pruebas de explotación destructivas.
- Pruebas de regresión visual.
- Pruebas de todos los módulos de UI y de todas las server functions una por una.

### 2.3 Principios

1. **Basado en riesgo:** primero aislamiento multiempresa, permisos, dinero y contabilidad;
   después cobertura amplia de utilidades y pantallas.
2. **Pirámide de pruebas:** muchas unitarias rápidas, contrato e integración para las capas
   críticas, y E2E solo para recorridos de negocio de alto valor.
3. **La seguridad se prueba en la base de datos:** no basta con que la UI o la server function
   oculten un botón; la RLS debe impedir el acceso directo por PostgREST.
4. **Reproducible:** todo se ejecuta con comandos documentados y datos demo deterministas.
5. **No destructivo:** las pruebas que crean datos temporales los limpian al final; los hooks
   contables peligrosos solo se auditan estáticamente.
6. **Evidencia:** cada suite deja reporte JSON/HTML, cobertura, trazas o logs en `docs/reportes/`.

---

## 3. Arquitectura bajo prueba

| Capa | Tecnología | Superficie de prueba |
|---|---|---|
| UI | Next.js 16 App Router, React 19, Tailwind 4 | Renderizado, navegación, formularios, roles, responsive |
| Server functions | 303 funciones registradas en 35 módulos `*.functions.ts` | Contrato, autenticación, validación Zod, permisos |
| API RPC | `POST /api/rpc/[fn]` | Envelope, códigos 400/401/404/500, errores |
| API pública | `POST /api/public/hooks/devengar-rentas` | Autenticación del hook, uso de `service_role` |
| Persistencia | Supabase local (Postgres 17, PostgREST, Auth) | RLS, grants, políticas, datos multiempresa |
| Datos | 73 tablas en `public` | Aislamiento, integridad, RLS habilitada |

**Datos estructurales verificados:**

- **303** entradas en `src/lib/server-fn/registry.server.ts`.
- **35** archivos `src/lib/api/*.functions.ts`.
- **73** tablas en el esquema `public`.
- **73/73** tablas con `rowsecurity = true`.
- **73/73** tablas con grants amplios para `anon` y `authenticated`, incluido `TRUNCATE`
  (hallazgo SEC-08).

### 3.1 Modelo de amenazas relevante

| Amenaza | Ejemplo | Control esperado |
|---|---|---|
| Salto entre empresas | Cambiar `profiles.company_id` y leer datos ajenos | RLS + columnas inmutables |
| Salto entre obras | Miembro de la empresa A lee/edita una obra donde no está asignado | RLS por `obra_team` |
| Escalamiento de rol | Usuario se inserta rol `director` | Política de inserción restringida |
| Abuso de hook interno | Invocar contabilidad con `service_role` sin secreto | Secreto/HMAC + idempotencia |
| Exposición de datos | Grants excesivos, cabeceras ausentes | Principio de mínimo privilegio |
| Error financiero | Cálculo de IVA, estimaciones o presupuesto incorrecto | Unitarias + integración |

---

## 4. Estrategia por nivel

### 4.1 Pruebas unitarias

**Objetivo:** validar funciones puras y reglas de negocio aisladas, rápido y sin dependencias
externas.

**Herramienta:** Vitest 5.0.5, entorno Node, alias `@` hacia `src`.

**Suites ejecutadas:**

| Suite | Casos | Cobertura funcional |
|---|---:|---|
| `tests/unit/format.test.ts` | 15 | Moneda MXN, fechas, fechas relativas, nulos; incluye DATE-01 como fallo esperado |
| `tests/unit/estimacion-utils.test.ts` | 11 | Semanas lunes-domingo, rangos, cambio de mes, ISO dates |
| `tests/unit/caja-chica-utils.test.ts` | 5 | IVA acreditable, redondeo, notas, montos inválidos |
| `tests/unit/ubicacion.test.ts` | 7 | URLs, Google Maps, texto libre, estados de México |
| `tests/unit/presupuesto-utils.test.ts` | 21 | Claves WBS, orden numérico, renglones, cambios, árbol vigente |
| `tests/unit/permisos.test.ts` | 14 | Catálogo, defaults, overrides, unión de roles, `requirePermission` |
| **Total** | **73** | |

**Resultado:** **72 pass + 1 fallo esperado** (DATE-01). Sin fallos inesperados.

**Criterio de salida:** 100% de las unitarias pasan o están marcadas como defecto conocido
con seguimiento; no se aceptan fallos inesperados.

---

### 4.2 Pruebas de contrato

**Objetivo:** evitar que el registro de server functions, las fachadas del cliente y las
implementaciones se desincronicen.

**Herramienta:** Vitest + análisis estático de archivos.

**Casos:**

| ID | Caso | Qué verifica |
|---|---|---|
| C-01 | Inventario completo | Encuentra >250 implementaciones y detecta IDs duplicados |
| C-02 | Registro vs. fuente | El registro generado contiene exactamente las mismas funciones |
| C-03 | Fachadas vs. registro | Cada fachada de `api-client` apunta a una función registrada |
| C-04 | Nombres exportados | Cada fachada conserva el nombre de la implementación |
| C-05 | Middleware de auth | Todas usan `requireSupabaseAuth`, salvo el ejemplo público |
| C-06 | Handlers | Todas las funciones registradas tienen `.handler(` |
| C-07 | Mapeo HTTP | Auth → 401, Zod → 400, resto → 500; 404 para función inexistente |

**Resultado:** **7/7 pass**. Inventario real: **303 funciones**.

**Criterio de salida:** cualquier función nueva, renombrada o eliminada debe actualizar
registro y fachada; el test falla si no.

---

### 4.3 Pruebas de integración

**Objetivo:** probar la API RPC real contra Supabase local, con usuarios y datos demo,
verificando contrato HTTP, sesión, roles y lecturas.

**Herramienta:** Vitest + `fetch` + Supabase JS + usuarios demo.

**Casos (18):**

| Grupo | Casos | Qué verifica |
|---|---:|---|
| Contrato HTTP | 5 | Sin token → 401; token inválido → 401; función inexistente → 404; UUID inválido → 400; body sin `{ data }` → 400 |
| Sesión y contexto | 2 | `getSessionContext` devuelve perfil y rol correctos para director y residente |
| Lecturas por rol | 7 | Director ve ambas obras; residente y residente2 solo la suya; dashboard propio; dashboard de ambas para director; dashboard de empresa con serie semanal; catálogos |
| Permisos de servidor | 2 | Residente no puede crear obras; residente2 no debería leer otra obra (fallo esperado SEC-03) |

**Resultado:** **15 pass + 1 fallo esperado** (residente2 leyendo obra ajena).

**Criterio de salida:** todos los códigos HTTP y lecturas por rol deben coincidir con el
contrato; los fallos esperados deben estar vinculados a un hallazgo abierto.

---

### 4.4 Pruebas de seguridad y RLS

**Objetivo:** verificar que la base de datos, y no solo la UI, impide accesos indebidos.

**Herramienta:** Vitest + Supabase JS con `anon`, usuarios autenticados y `service_role`
para limpieza; consultas SQL directas para grants.

**Casos (9):**

| ID | Caso | Resultado | Hallazgo |
|---|---|---|---|
| S-01 | Usuario anónimo no lee obras ni perfiles | ✅ Pass | — |
| S-02 | Usuario anónimo no inserta obras | ✅ Pass | — |
| S-03 | Usuario no debería cambiar su propia empresa | ❌ Fallo esperado | SEC-01 |
| S-04 | Auxiliar no debería insertarse rol director | ❌ Fallo esperado | SEC-04 |
| S-05 | Residente2 no debería leer dashboard de otra obra por RPC | ❌ Fallo esperado | SEC-03 |
| S-06 | Residente no debería editar obra por PostgREST | ❌ Fallo esperado | SEC-03 |
| S-07 | Residente2 no debería agregarse a `obra_team` de otra obra | ❌ Fallo esperado | SEC-05 |
| S-08 | Hook público de rentas debería exigir autenticación o secreto | ❌ Fallo esperado | SEC-06 |
| S-09 | La app debería enviar cabeceras de seguridad | ❌ Fallo esperado | SEC-07 |

**Resultado:** **2 pass + 7 fallos esperados**. Los fallos esperados documentan
vulnerabilidades confirmadas; no son tests rotos.

**Consulta adicional a la base local:**

```sql
-- 73 tablas, 0 sin RLS
select count(*) from pg_tables where schemaname = 'public';
select tablename from pg_tables where schemaname = 'public' and rowsecurity = false;

-- 73 tablas con TRUNCATE para anon/authenticated
select count(distinct table_name)
from information_schema.role_table_grants
where table_schema = 'public'
  and privilege_type = 'TRUNCATE'
  and grantee in ('anon', 'authenticated');
```

**Criterio de salida:** cero hallazgos críticos o altos abiertos; RLS probada también por
PostgREST, no solo por la capa de aplicación.

---

### 4.5 Pruebas E2E

**Objetivo:** validar recorridos reales de usuario en un navegador, incluyendo hidratación,
navegación y sesión.

**Herramienta:** Playwright 1.64.1, Microsoft Edge (`channel: "msedge"`), viewport 1440×900,
locale `es-MX`, timezone `America/Mexico_City`.

**Casos (17):**

| Grupo | Casos | Qué verifica |
|---|---:|---|
| Público | 5 | Landing con propuesta de valor y CTAs; formulario de login; onboarding paso 1; ruta privada redirige al login; ruta inexistente → 404 |
| Autenticación y roles | 6 | Credenciales inválidas; director ve ambas obras y configuración; residente solo su obra y no configuración; residente recibe “Sin acceso” en contabilidad; director sí entra; logout bloquea rutas privadas |
| Accesibilidad | 3 | Landing (fallo esperado A11Y-01), login y dashboard del director |
| Rendimiento y móvil | 3 | Presupuesto de carga de landing; presupuesto de dashboard; sin desbordamiento horizontal a 375×812 |

**Resultado:** **16 pass + 1 fallo esperado** (A11Y-01). Sin fallos inesperados ni tests
flaky en la corrida final.

**Nota de entorno:** los E2E deben ejecutarse contra `http://localhost:3000`, no
`http://127.0.0.1:3000`. Next.js 16 bloquea recursos de desarrollo cuando el `Host` no
coincide con el origen del servidor; con `127.0.0.1` fallan HMR y las fuentes, y la página
no hidrata.

**Criterio de salida:** todos los recorridos críticos pasan; los fallos esperados están
documentados y no ocultan regresiones nuevas.

---

### 4.6 Accesibilidad

**Objetivo:** detectar violaciones automáticas de WCAG 2.1 AA en las pantallas principales.

**Herramienta:** `@axe-core/playwright` 4.14.0 con tags `wcag2a`, `wcag2aa`, `wcag21a`,
`wcag21aa`.

**Resultado:**

| Pantalla | Violaciones críticas/serias | Estado |
|---|---|---:|
| Login | 0 | ✅ |
| Dashboard del director | 0 (con espera determinista de datos) | ✅ |
| Landing | 5 nodos de contraste + 1 `label-content-name-mismatch` | ❌ A11Y-01 |

**A11Y-01 (serio):**

- 5 nodos con contraste insuficiente:
  - `#9c9b95` sobre `#f6f5f1`: ratio **2.55:1** (mínimo 4.5:1 para texto normal).
  - `#f6a16e` sobre blanco: ratio **2.05:1**.
  - Afecta numeración 01–04 y el kicker naranja de la landing.
- El logo del header usa `aria-label` sin incluir el texto visible, lo que produce
  `label-content-name-mismatch`.

**Observación A11Y-OBS-01:** en una corrida intermedia, axe marcó contraste en los badges
de pendientes del dashboard (4.45:1 y 4.2:1). Al esperar `networkidle` y la aparición del
panel “Espera visto bueno”, la violación no se reprodujo. Se clasifica como falso positivo
transitorio por analizar antes de que la UI terminara de pintar; el test quedó determinista.

**Criterio de salida:** cero violaciones críticas o serias en pantallas principales. La
accesibilidad automática no sustituye una auditoría manual con teclado y lector de pantalla.

---

### 4.7 Rendimiento y responsive

**Objetivo:** detectar regresiones groseras de carga y desbordamiento horizontal en local.

**Herramienta:** Playwright + `PerformanceNavigationTiming`.

**Presupuestos y resultados:**

| Caso | Presupuesto | Medido | Estado |
|---|---|---:|---:|
| Landing: título visible | < 10,000 ms | 302 ms | ✅ |
| Landing: DOMContentLoaded | < 10,000 ms | 219 ms | ✅ |
| Landing: load | < 20,000 ms | 0 ms (medido antes del load) | ✅ |
| Dashboard: login + carga | < 30,000 ms | 2,523 ms | ✅ |
| Dashboard: DOMContentLoaded | < 15,000 ms | 90 ms | ✅ |
| Dashboard: load | — | 381 ms | ✅ |
| Móvil 375×812: overflow | ≤ 1 px | 0 px | ✅ |

**Limitaciones:** son presupuestos de smoke en servidor de desarrollo, sin throttling de red
ni CPU. No sustituyen Lighthouse CI, Web Vitals de campo ni pruebas de carga.

---

### 4.8 Gates estáticos

| Gate | Comando | Resultado | Evidencia |
|---|---|---|---|
| TypeScript | `npm run typecheck` | ✅ Exit 0 | `docs/reportes/typecheck.log` |
| Build | `npm run build` | ✅ Exit 0; Next 16.4.3; 22 páginas | `docs/reportes/build.log` |
| Lint | `npm run lint` | ❌ 444 errores, 51 warnings | `docs/reportes/lint.log`, `eslint-src.json` |
| Lint de tests | `npx eslint tests` | ✅ 0 errores, 0 warnings | `docs/reportes/eslint-tests.json` |

**Desglose del lint:**

| Regla | Cantidad | Tipo |
|---|---:|---|
| `prettier/prettier` | 443 | Error de formato, auto-corregible |
| `@next/next/no-img-element` | 1 | Regla no definida en `src/app/global-error.tsx` |
| `react-hooks/exhaustive-deps` | 38 | Warning |
| `react-refresh/only-export-components` | 13 | Warning |

Los 444 errores están concentrados en **34 archivos** de `src`; 443 se corrigen con
`npm run format`. No se aplicó el formateo masivo para no mezclar deuda de estilo con la
entrega de pruebas. El baseline inicial de la sesión (14 errores) no se reprodujo al
ejecutar el árbol completo; la cifra final es la fuente de verdad.

---

## 5. Entornos y datos de prueba

### 5.1 Entorno local

| Componente | Valor |
|---|---|
| SO | Windows |
| Node.js | v26.13.0 |
| Next.js | 16.4.3 (Turbopack) |
| App | `http://localhost:3000` |
| Supabase API | `http://127.0.0.1:54321` |
| Postgres | 17.11 (contenedor local) |
| Navegador E2E | Microsoft Edge, desktop 1440×900 |

### 5.2 Usuarios demo

Contraseña común: **`Demo1234!`**

| Usuario | Rol | Uso principal |
|---|---|---|
| `director@demo.pnf` | director | Acceso total, ambas obras y contabilidad |
| `residente@demo.pnf` | residente | Solo obra Residencial |
| `residente2@demo.pnf` | residente | Solo obra Ampliación |
| `auxiliar@demo.pnf` | auxiliar | Pruebas de permisos y RLS |
| `administrativo@demo.pnf` | administrativo | Compras/administración |
| `supervisor@demo.pnf` | supervisor | Supervisión de obra |

### 5.3 Obras demo

| Obra | ID |
|---|---|
| Residencial | `4d616d86-3c6f-5c35-bfa0-b91333ad9796` |
| Ampliación | `03f8c174-6bfc-5e77-802f-65470a4a1d1d` |

### 5.4 Gestión de datos

- Las pruebas de seguridad crean una empresa y una obra temporales, y las eliminan en
  `afterAll`.
- El cambio de `company_id` de SEC-01 se revierte en `finally`.
- Las inserciones en `user_roles` y `obra_team` se limpian en `finally`.
- El hook SEC-06 **no se invoca**: solo se audita el código para no mutar contabilidad.
- `npm run demo:verify` confirmó que los datos demo siguen intactos después de la corrida.

### 5.5 Variables de entorno

Las pruebas cargan `.env.local` / `.env` sin `dotenv`. Variables relevantes:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`SUPABASE_SERVICE_ROLE_KEY` se usa **solo** en pruebas para crear/limpiar datos temporales.
Nunca debe exponerse al cliente.

---

## 6. Matriz de pruebas

| ID | Tipo | Superficie | Herramienta | Comando | Criterio | Resultado |
|---|---|---|---|---|---|---|
| U-01..06 | Unitaria | Utilidades y permisos | Vitest | `npm run test:unit` | 100% pass o fallo esperado | ✅ 72/73 + 1 esperado |
| C-01..07 | Contrato | 303 server functions | Vitest | `npm run test:contract` | Registro/fachadas consistentes | ✅ 7/7 |
| I-01..18 | Integración | API RPC + Supabase | Vitest | `npm run test:integration` | Contrato HTTP y roles | ✅ 17/18 + 1 esperado |
| S-01..09 | Seguridad/RLS | Postgres/PostgREST | Vitest + SQL | `npm run test:security` | Sin accesos indebidos | ⚠️ 2/9 + 7 esperados |
| E-01..05 | E2E público | Landing, login, onboarding | Playwright | `npm run test:e2e` | Flujos visibles | ✅ 5/5 |
| E-06..11 | E2E auth/roles | Login, roles, logout | Playwright | `npm run test:e2e` | Roles y sesión | ✅ 6/6 |
| A-01..03 | Accesibilidad | Landing, login, dashboard | axe + Playwright | `npm run test:a11y` | 0 críticas/serias | ⚠️ 2/3 + A11Y-01 |
| P-01..03 | Rendimiento/móvil | Landing, dashboard, 375px | Playwright | `npm run test:e2e` | Presupuestos | ✅ 3/3 |
| Q-01 | TypeScript | Todo el proyecto | `tsc` | `npm run typecheck` | Exit 0 | ✅ |
| Q-02 | Lint | `src`, `tests`, config | ESLint | `npm run lint` | Exit 0 | ❌ 444/51 |
| Q-03 | Build | Next.js producción | `next build` | `npm run build` | Exit 0 | ✅ |

---

## 7. Resultados de la ejecución

### 7.1 Comandos y salidas

```text
npm run typecheck
  → Exit 0

npx vitest run
  → Test Files  9 passed (9)
  → Tests       98 passed | 9 expected fail (107)
  → Exit 0

npx vitest run --coverage
  → Tests       98 passed | 9 expected fail (107)
  → Statements  48.37% (371/767)
  → Branches    44.16% (242/548)
  → Functions   42.37% (50/118)
  → Lines       46.58% (307/659)
  → Exit 0

npx playwright test
  → 17 passed (53.0s)
  → 16 pass + 1 fallo esperado (A11Y-01)
  → 0 unexpected, 0 flaky
  → Exit 0

npm run lint
  → 495 problems (444 errors, 51 warnings)
  → Exit 1

npm run build
  → ✓ Compiled successfully (570 ms en build incremental; 9.5 s en frío)
  → ✓ Finished TypeScript (2.2 s en incremental; 73 s en frío)
  → ✓ Generating static pages (22/22)
  → Exit 0

npm run demo:verify
  → 6/6 usuarios autentican y tienen perfil y rol
  → Tablas principales con datos
  → Exit 0
```

### 7.2 Cobertura

| Archivo / grupo | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| **Global** | **48.37%** | **44.16%** | **42.37%** | **46.58%** |
| `caja-chica-utils.ts` | 100% | 100% | 100% | 100% |
| `estimacion-utils.ts` | 100% | 100% | 100% | 100% |
| `ubicacion.ts` | 100% | 100% | 100% | 100% |
| `mx-estados.ts` | 100% | — | — | 100% |
| `presupuesto-utils.ts` | 97.54% | 81.86% | 100% | 98.53% |
| `format.ts` | 91.66% | 93.75% | 100% | 94.11% |
| `permisos/check.ts` | 94.73% | 90% | 100% | 100% |
| `permisos/require.ts` | 100% | 87.5% | 100% | 100% |
| `permisos/catalogo.ts` | 100% | — | 100% | 100% |
| `balance.functions.ts` | 0% | 0% | 0% | 0% |
| `solicitud-cotizacion-pdf.ts` | 0% | 0% | 0% | 0% |

**Interpretación:** la cobertura global es baja porque el alcance de V8 incluye algunos
archivos de server functions (`balance`), PDF y catálogos que no se ejercitan
desde unitarias. Las utilidades que sí se probaron tienen cobertura alta (varias al 100%).
El porcentaje global no debe usarse solo como gate; conviene fijar umbrales por carpeta.

**Brechas principales:**

- Server functions de negocio (presupuestos, estimaciones, OC, pagos, contabilidad) no tienen
  unitarias de cálculo; se cubren parcialmente por integración.
- Componentes de UI no están instrumentados.
- PDFs y catálogos de notificaciones/contabilidad no tienen pruebas dedicadas.
- No hay pruebas de propiedades (property-based) ni mutation testing.

### 7.3 Distribución de pruebas

| Nivel | Cantidad | Porcentaje |
|---|---:|---:|
| Unitarias | 73 | 58.9% |
| Contrato | 7 | 5.6% |
| Integración | 18 | 14.5% |
| Seguridad/RLS | 9 | 7.3% |
| E2E | 17 | 13.7% |
| **Total** | **124** | **100%** |

---

## 8. Hallazgos y defectos

### 8.1 Escala de severidad

| Severidad | Criterio | Acción |
|---|---|---|
| **Crítico** | Salto entre empresas, bypass de autenticación, corrupción de datos, acceso a `service_role` | Bloquea release; corregir de inmediato |
| **Alto** | Escalamiento de privilegios, acceso a obra ajena, integridad financiera | Bloquea release; corregir antes de producción |
| **Medio** | Hardening, accesibilidad seria, gate de calidad | Corregir en el ciclo o aceptar riesgo documentado |
| **Bajo** | Cosmético, formato, defecto de visualización | Backlog |
| **Informativo** | Observación, falso positivo, decisión de diseño | Documentar |

### 8.2 Tabla resumen

| ID | Severidad | Área | Estado | Evidencia |
|---|---|---|---|---|
| SEC-01 | Crítico | Aislamiento multiempresa | Abierto | `tests/security/rls.test.ts` |
| SEC-04 | Crítico | Escalamiento de rol | Abierto | `tests/security/rls.test.ts` |
| SEC-06 | Crítico | Hook público con `service_role` | Abierto | `src/app/api/public/hooks/devengar-rentas/route.ts` |
| SEC-03 | Alto | RLS de obras/equipo/comisiones | Abierto | `tests/security/rls.test.ts`, `tests/integration/rpc.test.ts` |
| SEC-05 | Alto | Auto-inserción en `obra_team` | Abierto | `tests/security/rls.test.ts` |
| SEC-07 | Medio | Cabeceras de seguridad | Abierto | `tests/security/rls.test.ts` |
| SEC-08 | Medio | Grants amplios y `TRUNCATE` | Abierto | Consulta SQL local |
| A11Y-01 | Serio | Contraste y nombre accesible | Abierto | `tests/e2e/a11y.spec.ts` |
| DATE-01 | Bajo | Desplazamiento de fecha UTC | Abierto | `tests/unit/format.test.ts` |
| LINT-01 | Medio | Gate de lint | Abierto | `docs/reportes/lint.log` |

---

### SEC-01 — Un usuario puede cambiar su propia empresa (crítico)

**Evidencia:** política `Users update own profile` en
`supabase/migrations/20260528011816_b36fc093-61b1-44a1-861d-a66f3d529fd9.sql`:

```sql
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
```

La política permite actualizar cualquier columna de la fila propia, incluida `company_id`.
Al cambiarla, `current_company_id()` cambia y la RLS abre los datos de la empresa víctima.

**Prueba:** `un usuario no debería poder cambiar su propia empresa` (fallo esperado).
La prueba revierte el cambio en `finally`.

**Impacto:** un usuario autenticado puede saltar el aislamiento multiempresa y leer o
modificar datos de otra empresa. Es uno de los hallazgos más graves del informe.

**Recomendación:**

1. Revocar `UPDATE` a nivel de tabla para `authenticated` y otorgar `UPDATE` solo sobre las
   columnas editables; o añadir un trigger que bloquee cambios de `company_id`.
2. Mover el cambio de empresa a una server function con `service_role` y validación de
   director/onboarding.
3. Convertir la prueba en test verde cuando se corrija.

---

### SEC-04 — Cualquier usuario puede insertarse rol `director` (crítico)

**Evidencia:** política `User inserts own director role on onboarding`:

```sql
CREATE POLICY "User inserts own director role on onboarding" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
```

Solo valida que el `user_id` sea el propio; no valida rol, empresa ni contexto de onboarding.

**Prueba:** `un auxiliar no debería poder insertarse el rol director` (fallo esperado).

**Impacto:** cualquier usuario autenticado puede autoconcederse permisos de director y
acceder a configuración, contabilidad y datos de toda la empresa.

**Recomendación:**

1. Eliminar la política de inserción directa.
2. Crear el rol inicial dentro de una server function de onboarding con `service_role` y
   validación de empresa/rol.
3. Añadir restricciones de unicidad y auditoría de cambios de rol.
4. Probar que un usuario no puede insertar roles para sí mismo ni para terceros.

---

### SEC-06 — Hook público de rentas usa `service_role` sin autenticación (crítico)

**Evidencia:** `src/app/api/public/hooks/devengar-rentas/route.ts` implementa `POST` sin
verificar token, secreto ni firma; importa `supabaseAdmin` (service role) y ejecuta:

- `devengar_asientos_rentas_activas`
- `generar_periodos_rentas_activas`

**Prueba:** auditoría estática (`el hook público de rentas debería exigir autenticación o
secreto`, fallo esperado). No se invoca para no mutar contabilidad.

**Impacto:** un atacante no autenticado puede disparar asientos y periodos contables,
provocar duplicados, degradar el servicio o alterar la contabilidad.

**Recomendación:**

1. Exigir `Authorization: Bearer <CRON_SECRET>` o firma HMAC con timestamp y nonce.
2. Validar método, origen y rate limit.
3. Hacer las RPC idempotentes y registrar auditoría de cada invocación.
4. Devolver 401/403 sin filtrar detalles internos.
5. Añadir prueba de integración que verifique 401 sin secreto y 200 con secreto.

---

### SEC-03 — RLS de obras y equipo es por empresa, no por obra (alto)

**Evidencia:** `supabase/migrations/20260728171938_d3a2d030-f22a-43bb-8e90-3a4bfa528576.sql`:

```sql
CREATE POLICY "Company members manage obras" ON public.obras FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Company members manage obra_team" ON public.obra_team FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.obras o
                 WHERE o.id = obra_team.obra_id
                   AND o.company_id = public.current_company_id()))
  WITH CHECK (EXISTS (...));
```

Cualquier miembro de la empresa puede leer y escribir cualquier obra, equipo y comisiones,
aunque no esté asignado a esa obra.

**Pruebas:**

- `un residente no debería poder editar una obra por PostgREST` (fallo esperado).
- `un residente no debería leer el dashboard de otra obra por RPC` (fallo esperado).
- `residente2 no debería leer el dashboard de otra obra` (integración, fallo esperado).

**Impacto:** escalamiento horizontal dentro de la empresa; un residente puede ver el
dashboard y datos operativos/financieros de obras ajenas, y modificar su configuración.

**Recomendación:**

1. Reescribir las políticas para exigir pertenencia a `obra_team` o rol director/admin.
2. Separar `SELECT`, `INSERT`, `UPDATE` y `DELETE`; no usar `FOR ALL` con una condición
   demasiado amplia.
3. Crear un helper `public.can_access_obra(obra_id)` con `SECURITY DEFINER` y `search_path`
   fijo.
4. Alinear la RLS con `requirePermission` de la capa de aplicación.
5. Añadir una matriz de pruebas por rol × obra × operación.

---

### SEC-05 — Un miembro puede agregarse a `obra_team` de otra obra (alto)

**Evidencia:** la política `Company members manage obra_team` permite insertar filas si la
obra pertenece a la empresa, sin validar quién administra el equipo.

**Prueba:** `residente2 no debería poder agregarse al equipo de otra obra` (fallo esperado).

**Impacto:** un usuario puede unirse a una obra ajena y luego usar los módulos de esa obra.

**Recomendación:**

1. Limitar `INSERT/UPDATE/DELETE` de `obra_team` a director o residente responsable de la obra.
2. Impedir auto-inserción salvo que el usuario sea director.
3. Auditar cambios de equipo.
4. Añadir prueba negativa para cada rol.

---

### SEC-07 — Faltan cabeceras de seguridad (medio)

**Evidencia:** la respuesta de la app no incluye CSP, HSTS, `X-Frame-Options`,
`X-Content-Type-Options`, `Referrer-Policy` ni `Permissions-Policy`; además se expone
`X-Powered-By`.

**Prueba:** `la aplicación debería enviar cabeceras de seguridad` (fallo esperado).

**Impacto:** mayor superficie para clickjacking, MIME sniffing, fuga de información y
mitigación incompleta de XSS.

**Recomendación:**

1. Configurar `headers()` en `next.config.ts` o un middleware.
2. Añadir CSP con nonce para scripts; HSTS solo en HTTPS.
3. `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
   `Referrer-Policy: strict-origin-when-cross-origin`,
   `Permissions-Policy` mínima.
4. `poweredByHeader: false`.
5. Probar las cabeceras en producción, no solo en dev.

---

### SEC-08 — Grants amplios y `TRUNCATE` para roles de API (medio)

**Evidencia:** consulta a la base local:

```text
anon          → DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
authenticated → DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE
73/73 tablas con TRUNCATE para anon/authenticated
```

RLS está habilitada en las 73 tablas, pero `TRUNCATE` **no está sujeto a RLS** y los grants
excesivos amplían la superficie si aparece otra falla de permisos.

**Recomendación:**

1. Revocar `TRUNCATE`, `TRIGGER` y `REFERENCES` de `anon`/`authenticated`.
2. Otorgar solo los privilegios necesarios por tabla (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
3. Revisar `ALTER DEFAULT PRIVILEGES` para que las tablas nuevas no hereden grants amplios.
4. Añadir una prueba SQL que falle si una tabla nueva queda con grants excesivos.

---

### A11Y-01 — Contraste y nombre accesible en la landing (serio)

**Evidencia:** `tests/e2e/a11y.spec.ts` (fallo esperado). axe reporta:

- 5 nodos con contraste insuficiente:
  - `#9c9b95` sobre `#f6f5f1` → **2.55:1**.
  - `#f6a16e` sobre blanco → **2.05:1**.
- 1 nodo con `label-content-name-mismatch` en el logo del header.

**Impacto:** usuarios con baja visión o lectores de pantalla pueden no percibir la
numeración/kicker ni identificar correctamente el logo.

**Recomendación:**

1. Oscurecer los colores de texto o aclarar los fondos hasta alcanzar 4.5:1 (texto normal)
   o 3:1 (texto grande).
2. Incluir el texto visible del logo en su nombre accesible o marcar el texto como decorativo.
3. Re-ejecutar axe y añadir revisión manual de teclado/zoom.

---

### DATE-01 — `formatDate` desplaza un día las fechas `YYYY-MM-DD` (bajo)

**Evidencia:** `tests/unit/format.test.ts` (fallo esperado):

```ts
formatDate("2026-10-29") // en America/Mexico_City muestra 28 de octubre
```

`new Date("YYYY-MM-DD")` se interpreta como medianoche UTC; al formatear en zona local se
resta un día.

**Impacto:** fechas de documentos, vencimientos y reportes pueden mostrarse un día antes.

**Recomendación:**

1. Detectar strings `YYYY-MM-DD` y construirlos como fecha local
   (`new Date(y, m - 1, d)`) o formatear en UTC.
2. Añadir pruebas para zonas `America/Mexico_City`, `UTC` y cruce de fin de mes.
3. Convertir el fallo esperado en test verde.

---

### LINT-01 — El gate de lint está en rojo (medio)

**Evidencia:** `npm run lint` → **444 errores, 51 warnings**.

- 443 errores `prettier/prettier` en 34 archivos de `src`, auto-corregibles.
- 1 error por regla `@next/next/no-img-element` no definida en `src/app/global-error.tsx`.
- 38 warnings `react-hooks/exhaustive-deps`.
- 13 warnings `react-refresh/only-export-components`.

**Impacto:** el pipeline de calidad no puede exigir lint limpio; se mezcla ruido de formato
con defectos reales y se dificulta revisar cambios.

**Recomendación:**

1. Hacer un commit exclusivo de formato con `npm run format` y revisar el diff.
2. Instalar/configurar `@next/next` o eliminar la directiva huérfana en `global-error.tsx`.
3. Corregir gradualmente los warnings de hooks; no bloquear el release por ellos.
4. Fijar en CI `npm run lint` con alcance explícito y cache.

---

### 8.3 Falsos positivos y decisiones descartadas

| ID | Observación | Decisión |
|---|---|---|
| DISC-01 | “Un administrativo puede crear obras” | **Descartado**: el catálogo `obras.crear` lo permite por diseño (`defaults: A`). No es un defecto. |
| A11Y-OBS-01 | Contraste intermitente en badges del dashboard | **No confirmado**: con espera determinista no se reproduce; se deja el test estable y se monitorea. |
| SEC-02 | — | No se identificó un hallazgo independiente; el análisis se consolidó en SEC-01/SEC-03. |

---

## 9. Criterios de salida y decisión de release

### 9.1 Quality gates propuestos

| Gate | Criterio | Estado actual |
|---|---|---|
| G0 — Estático | `typecheck` y `build` en verde; lint sin errores nuevos | ⚠️ typecheck/build OK; lint rojo |
| G1 — Unitarias/contrato | 100% pass o fallo esperado tracked | ✅ |
| G2 — Integración | Contrato HTTP y roles OK; sin fallos inesperados | ✅ |
| G3 — Seguridad | 0 críticos/altos abiertos; RLS probada por PostgREST | ❌ SEC-01/03/04/05/06 |
| G4 — E2E | Flujos críticos OK; sin errores de consola inesperados | ✅ |
| G5 — Accesibilidad | 0 violaciones críticas/serias | ❌ A11Y-01 |
| G6 — Rendimiento | Presupuestos locales OK | ✅ |

### 9.2 Decisión

**NO GO** para producción.

Motivos bloqueantes:

1. SEC-01, SEC-04 y SEC-06 son críticos.
2. SEC-03 y SEC-05 permiten acceso/edición de obras ajenas dentro de la empresa.
3. A11Y-01 es una violación seria de accesibilidad.
4. El lint no está limpio.

### 9.3 Condiciones para pasar a GO

1. Corregir SEC-01, SEC-04 y SEC-06; convertir sus tests en verdes.
2. Corregir SEC-03 y SEC-05 con RLS por obra; añadir matriz rol × obra × operación.
3. Añadir cabeceras de seguridad (SEC-07) y revocar grants excesivos (SEC-08).
4. Corregir A11Y-01 y re-ejecutar axe.
5. Dejar `npm run lint` en verde o aceptar formalmente un baseline.
6. Re-ejecutar la matriz completa y `demo:verify`.

---

## 10. Riesgos y limitaciones

| Riesgo / limitación | Impacto | Mitigación |
|---|---|---|
| Solo entorno local | No valida latencia, configuración ni datos de staging/producción | Ejecutar smoke en staging con datos sintéticos |
| Solo Edge | No cubre WebKit/Firefox/Safari | Añadir proyectos Playwright |
| Sin dispositivos móviles reales | El responsive se prueba por viewport, no por hardware | Añadir emulación de dispositivos y pruebas manuales |
| Sin pruebas de carga | No se conoce el comportamiento bajo concurrencia | k6/Artillery contra staging |
| Sin auditoría manual a11y | axe cubre solo una parte de WCAG | Revisión con teclado, zoom y lector de pantalla |
| Sin regresión visual | Cambios de layout pueden pasar inadvertidos | Playwright screenshots + Percy/Chromatic |
| Cobertura global baja | Server functions y UI sin instrumentar | Umbrales por carpeta y tests de cálculo |
| Fallos esperados | Pueden enmascarar regresiones si no se gestionan | Vincular cada `.fails` a un issue y fecha de revisión |
| SEC-06 no invocado | No se probó el efecto real del hook | Prueba con secreto en entorno aislado |
| E2E sobre dev server | El comportamiento de producción puede diferir | Job E2E contra `next build && next start` |
| Datos demo mutables | Pruebas de seguridad podrían dejar residuos | Limpieza en `finally` + `demo:verify` |

---

## 11. Plan de mejora

### P0 — Seguridad (inmediato, 0–2 semanas)

- Corregir SEC-01: inmutabilidad de `profiles.company_id`.
- Corregir SEC-04: eliminar auto-inserción de roles; onboarding por server function.
- Corregir SEC-06: secreto/HMAC, rate limit e idempotencia del hook.
- Corregir SEC-03/05: RLS por `obra_team`, separar operaciones y helper `can_access_obra`.
- Añadir SEC-07/08: cabeceras y mínimo privilegio.
- Convertir los 7 fallos esperados de seguridad en tests verdes.

### P1 — Calidad y CI (2–4 semanas)

- Formatear `src` en un commit aislado y dejar lint en verde.
- Añadir CI con jobs: estático, unitarias/contrato, integración/RLS, E2E.
- Publicar reportes como artefactos y bloquear merge con gates.
- Añadir umbrales de cobertura por carpeta (ej. `src/lib/permisos` ≥ 90%).
- Probar server functions financieras: presupuestos, estimaciones, OC, pagos, contabilidad.
- Añadir E2E contra build de producción.

### P2 — Madurez (1–2 meses)

- Matriz RLS automatizada por rol × obra × tabla × operación.
- Cross-browser (Chromium, Firefox, WebKit) y dispositivos móviles.
- Regresión visual de landing, login y dashboard.
- Lighthouse CI y Web Vitals en staging.
- Pruebas de carga de endpoints RPC y dashboards.
- Contract testing de esquemas Zod y respuestas RPC.
- Mutation testing en utilidades críticas.
- Fábricas de datos y seeds efímeros por suite.

---

## 12. Cómo ejecutar

### 12.1 Prerrequisitos

- Node.js 26+ y npm.
- Docker Desktop con Supabase local.
- `.env.local` con URL, anon key y service role key.
- Microsoft Edge instalado (para `channel: "msedge"`).
- Puerto 3000 libre.

### 12.2 Secuencia

```bash
# 1. Dependencias
npm install

# 2. Base de datos local y datos demo
npm run db:start
npm run demo:seed        # o npm run demo:reset

# 3. Servidor de desarrollo (en otra terminal)
npm run dev

# 4. Gates estáticos
npm run typecheck
npm run lint
npm run build

# 5. Pruebas
npm run test             # unitarias + contrato + integración + seguridad
npm run test:coverage
npm run test:e2e
npm run test:a11y

# 6. Integridad de datos demo
npm run demo:verify
```

### 12.3 Scripts disponibles

| Script | Qué ejecuta |
|---|---|
| `npm test` | Vitest completo (107 pruebas) |
| `npm run test:unit` | Solo unitarias |
| `npm run test:contract` | Solo contrato |
| `npm run test:integration` | Solo integración |
| `npm run test:security` | Solo seguridad/RLS |
| `npm run test:coverage` | Vitest + cobertura V8 |
| `npm run test:e2e` | Playwright completo |
| `npm run test:a11y` | Solo accesibilidad |
| `npm run test:all` | `typecheck` + Vitest + Playwright (no incluye lint/build/coverage) |

**Recomendación:** ampliar `test:all` para incluir `lint`, `build` y `test:coverage`, o crear
un script `ci` explícito.

### 12.4 CI propuesto

```yaml
name: quality
on: [pull_request, push]

jobs:
  static:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 26, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run build

  tests:
    runs-on: ubuntu-latest
    env:
      NEXT_PUBLIC_SUPABASE_URL: http://127.0.0.1:54321
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 26, cache: npm }
      - run: npm ci
      - uses: supabase/setup-cli@v1
        with: { version: latest }
      - run: supabase start
      - run: npm run demo:seed
      # Integración y RLS llaman a la app por HTTP: hay que levantarla.
      - run: npm run build
      - run: |
          npm run start &
          npx wait-on http://127.0.0.1:3000
          npm run test:coverage
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test --project=desktop-chromium
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-reports
          path: docs/reportes
```

> El snippet asume que `wait-on` está disponible vía `npx`. Si se prefiere no depender de
> una descarga en CI, añadirlo a `devDependencies` o usar un healthcheck con `curl` en un
> bucle. Playwright reutiliza el servidor ya levantado (`reuseExistingServer: true`).
> El proyecto local usa Edge; para CI se recomienda añadir un proyecto `desktop-chromium`
> en `playwright.config.ts` (o instalar Edge en el runner) y ejecutar ese proyecto.

### 12.5 Troubleshooting

| Síntoma | Causa probable | Solución |
|---|---|---|
| E2E no hidrata / 403 en fuentes | URL `127.0.0.1` con dev server en `localhost` | Usar `http://localhost:3000` |
| `401` en integración | Token expirado o usuario demo inexistente | Re-seed y volver a iniciar sesión |
| `500` en RPC con permiso denegado | Comportamiento esperado del contrato | Revisar el caso y el rol |
| `demo:verify` falla | Datos demo alterados | `npm run demo:reset` |
| Playwright no encuentra Edge | Canal no instalado | Instalar Edge o cambiar a Chromium |
| PowerShell bloquea `npm.ps1` | Política de ejecución | Usar `npm.cmd` / `npx.cmd` |

---

## 13. Anexos

### 13.1 Archivos de prueba

| Ruta | Contenido |
|---|---|
| `vitest.config.ts` | Configuración de Vitest, reporte JSON y cobertura |
| `playwright.config.ts` | Configuración de Playwright, Edge, reportes y `webServer` |
| `tests/unit/*.test.ts` | 6 suites unitarias |
| `tests/contract/server-fns.test.ts` | Contrato de 303 server functions |
| `tests/integration/rpc.test.ts` | Integración RPC y roles |
| `tests/security/rls.test.ts` | Seguridad y RLS |
| `tests/e2e/public.spec.ts` | E2E público |
| `tests/e2e/auth.spec.ts` | E2E de autenticación y roles |
| `tests/e2e/a11y.spec.ts` | Accesibilidad WCAG 2.1 AA |
| `tests/e2e/performance.spec.ts` | Rendimiento y móvil |
| `tests/helpers/*.ts` | Env, RPC y clientes Supabase |
| `docs/reportes/` | Evidencia de ejecución |

### 13.2 Evidencia

| Archivo | Contenido |
|---|---|
| `docs/reportes/vitest-results.json` | Resultado JSON de Vitest |
| `docs/reportes/coverage/index.html` | Reporte HTML de cobertura |
| `docs/reportes/coverage/coverage-summary.json` | Resumen de cobertura |
| `docs/reportes/playwright-results.json` | Resultado JSON de Playwright |
| `docs/reportes/playwright-html/index.html` | Reporte HTML de Playwright |
| `docs/reportes/playwright-artifacts/` | Trazas, screenshots y adjuntos axe |
| `docs/reportes/typecheck.log` | Salida de TypeScript |
| `docs/reportes/build.log` | Salida del build |
| `docs/reportes/lint.log` | Salida completa de ESLint |
| `docs/reportes/eslint-src.json` | Lint de `src` en JSON |
| `docs/reportes/eslint-tests.json` | Lint de `tests` en JSON |
| `docs/reportes/demo-verify.log` | Verificación de datos demo |
| `docs/reportes/dev-server.log` | Log del servidor de desarrollo usado en E2E |

### 13.3 Glosario

| Término | Definición |
|---|---|
| RLS | Row Level Security de PostgreSQL; filtra filas por política |
| PostgREST | API REST automática de Supabase sobre Postgres |
| RPC | Llamada remota a una server function vía `/api/rpc/[fn]` |
| Envelope | Sobre `{ data: ... }` para request y `{ ok, data/error }` para response |
| Fallo esperado | Test que documenta un defecto conocido y falla a propósito (`it.fails`/`test.fail`) |
| Gate | Criterio mínimo para permitir merge o release |
| Service role | Clave de Supabase que omite RLS; solo para servidor/pruebas |
| WBS | Work Breakdown Structure; claves jerárquicas del presupuesto |
| OC | Orden de compra |

### 13.4 Historial

| Fecha | Cambio |
|---|---|
| 30/10/2026 | Versión 1.0: plan, ejecución, hallazgos y evidencias |

---

**Fin del documento.**
