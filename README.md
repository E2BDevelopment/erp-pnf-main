# ERP PNF

Construye una aplicación web ERP para empresas constructoras llamada "ERP PNF". Diseño moderno, minimalista y profesional en español, paleta de colores neutros (blancos, grises y azul oscuro), tipografía limpia y UI tipo SaaS empresarial.

ONBOARDING La landing page debe tener la opción de registrar una empresa nueva. Stepper de 2 pasos:

Pantalla 1 — Datos de la empresa:

Tipo de persona: Persona moral / Persona física (menú desplegable)

Razón social (si es persona moral) / Nombre completo (si es persona física)

RFC

Pantalla 2 — Registro de la cuenta del Director:

Nombre completo

Correo electrónico

Contraseña

Al completar → se crea la empresa y el usuario con perfil de Director. Se redirige al dashboard corporativo.

CONFIGURACIÓN DE EMPRESA Botón de configuración accesible desde el dashboard. Contiene 3 secciones:

Datos de facturación — información completa de la empresa

Equipo — alta de usuarios con 5 perfiles disponibles: Residente, Auxiliar, Administrativo, Supervisor, Director

Otras configuraciones — por definir

CREACIÓN DE OBRA Solo el Director puede crear obras nuevas. Stepper de 3 pasos:

Paso 1 — Datos generales:

Nombre de la obra

Tipo de obra (menú desplegable): Industrial, Comercial, Residencial, Infraestructura, Vivienda en serie, Urbanización

Cliente

Número de contrato

Ubicación

Fecha de inicio

Fecha de terminación

Paso 2 — Presupuesto:

Carga de archivo Excel (.xlsx) con el presupuesto autorizado

Es opcional — se puede cargar después desde dentro de la obra

Paso 3 — Equipo:

El Director asigna el equipo de la obra

Debe haber mínimo un Residente, un Administrativo y un Supervisor para poder operar

PERFILES Y MÓDULOS

RESIDENTE — encargado de la obra. Módulos:

Estimaciones

Órdenes de cambio

Requisiciones

Nómina

Destajos

Subcontratos

Rentas

Gasolinas

Caja chica

Almacén de obra

Tareas

Catálogos

AUXILIAR — apoya al Residente en captura y registro. Tiene acceso a los mismos módulos que el Residente pero todo lo que registra requiere visto bueno del Residente antes de subir al Supervisor.

ADMINISTRATIVO — cotiza materiales, hace comparativas y tramita pagos. Módulos:

Requisiciones

Cuentas por pagar

Tesorería

Catálogos

Almacén central

Gastos de oficina

Nómina

Destajos

Subcontratos

Rentas

Gasolinas

Caja chica

Tareas

SUPERVISOR — filtro de autorización entre el Residente y el Administrativo. Nada se paga ni ejecuta sin su visto bueno. Tiene visibilidad completa de todas sus obras. Módulos:

Estimaciones

Órdenes de cambio

Requisiciones

Nómina

Destajos

Subcontratos

Rentas

Gasolinas

Caja chica

Almacén de obra

Tareas

Catálogos

DIRECTOR — acceso total a todos los módulos de todas las obras. Para operar como otro perfil, inicia sesión con la cuenta de ese perfil.

INSTRUCCIONES DE CONSTRUCCIÓN Crear únicamente la estructura de navegación y los módulos de cada perfil como placeholders — pantallas con el nombre del módulo y un mensaje "Próximamente". No desarrollar la lógica interna de ningún módulo todavía. Los módulos se diseñarán y desarrollarán a detalle en iteraciones posteriores.

STACK TÉCNICO

Frontend: React + Tailwind CSS

Backend: Supabase (autenticación, base de datos PostgreSQL y storage)

Estado global: Zustand

Rutas protegidas por perfil — un usuario no puede acceder a rutas de otro perfil aunque conozca la URL

Mobile-first en módulos de obra — los residentes y auxiliares usan la app desde celular en campo

Desktop-first en vistas corporativas y administrativas

Cada módulo con su propia ruta desde el inicio para facilitar el desarrollo posterior

This project uses **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS 4** and **Supabase** for authentication, database and storage.

## Development

You need Node.js 20+ and npm.

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

Create `.env` from the values in your Supabase project (`Project Settings → API`):

```sh
NEXT_PUBLIC_SUPABASE_URL="https://<project>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<anon-or-publishable-key>"
SUPABASE_URL="https://<project>.supabase.co"
SUPABASE_PUBLISHABLE_KEY="<anon-or-publishable-key>"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
RENTAS_CRON_SECRET="<random-secret-at-least-32-characters>"
```

`SUPABASE_SERVICE_ROLE_KEY` is required by operations that bypass RLS: onboarding
(company creation), team management and the development role switcher. Keep it
server-side only.

`RENTAS_CRON_SECRET` protects `POST /api/public/hooks/devengar-rentas`. Configure a
random value of at least 32 characters in the app and in the scheduled caller, and send
it as `Authorization: Bearer <secret>`. Never expose it through a `NEXT_PUBLIC_` variable.

### Base de datos local (Docker)

La base de datos es una réplica del proyecto original de Supabase: las 84 migraciones de
`supabase/migrations` se aplican en orden y reconstruyen el esquema completo (73 tablas,
26 funciones, 42 enums y 5 buckets de Storage). `supabase/config.toml` fija Postgres 17,
los puertos, Auth, Storage y Mailpit; el CLI (`supabase@2.122.0`) está en `devDependencies`
para que el stack no cambie entre máquinas.

Requisitos: Docker Desktop instalado y Node.js 20+. En Windows, `npm run db:start` inicia
Docker Desktop automáticamente si el daemon no está corriendo y espera a que responda.

> En Windows, `analytics` está desactivado en `supabase/config.toml`: el contenedor `vector`
> no puede acceder al socket de Docker Desktop y entra en un bucle de reinicio. No afecta a
> la aplicación ni a los datos.

```sh
npm run db:start       # Postgres, Auth, Storage, Studio y Mailpit en Docker
npm run db:status      # URL y llaves del stack local
npm run db:reset       # reaplica las 84 migraciones desde cero
npm run db:replica     # db:reset + siembra de la demo en un solo paso
npm run db:stop        # detiene el stack (conserva los datos)
```

`.env.local` ya apunta al stack local (API en `http://127.0.0.1:54321`, Studio en
`http://127.0.0.1:54323`, correo en `http://127.0.0.1:54324`). El `.env` original no se
modifica y sigue apuntando al proyecto remoto: para volver a él, renombra o elimina
`.env.local` y reinicia `npm run dev`.

`supabase/seed.sql` sólo existe para que `db reset` tenga un seed válido; la empresa demo
se siembra con la API (Auth + RLS reales), no por SQL.

Para regenerar los tipos tras un cambio de esquema:

```sh
npx supabase gen types typescript --local --schema public > src/integrations/supabase/types.ts
```

### Datos de demostración (local)

El stack local incluye una constructora completa para probar todos los módulos sin tocar el
proyecto remoto.

```sh
npm run demo:seed      # siembra la empresa demo (falla si ya existe)
npm run demo:reset     # trunca la base local y vuelve a sembrar
npm run demo:dry       # simula el seed completo sin escribir nada
npm run demo:verify    # comprueba datos + login de los 6 usuarios demo
```

`demo:reset` usa `docker exec` + `psql` sobre el contenedor `supabase_db_*` para truncar
todas las tablas públicas y `auth.users`. El seed aborta si `SUPABASE_URL` no es
`127.0.0.1`, `localhost` o `::1`, así que nunca puede escribir en el proyecto remoto.

Usuarios de demostración (contraseña `Demo1234!` para todos):

| Correo                    | Rol            | Nombre                       |
| ------------------------- | -------------- | ---------------------------- |
| `director@demo.pnf`       | Director       | Ricardo Naranja Salazar      |
| `residente@demo.pnf`      | Residente      | Mariana Torres Villalobos    |
| `residente2@demo.pnf`     | Residente      | Jorge Luis Mendoza Ríos      |
| `auxiliar@demo.pnf`       | Auxiliar       | Paola Guadalupe Serrano León |
| `administrativo@demo.pnf` | Administrativo | Luis Fernando Aguirre Campos |
| `supervisor@demo.pnf`     | Supervisor     | Claudia Estrada Navarro      |

La demo cubre dos obras con seis semanas de operación: catálogos (clientes, proveedores,
contratistas, trabajadores e insumos), presupuestos base con adendas, requisiciones con
solicitudes de cotización y órdenes de compra, almacén, estimaciones, nómina, destajos,
subcontratos, rentas, gasolinas, caja chica, gastos de obra y de oficina, tesorería
(cuentas por pagar, pagos y asientos contables), tareas y notificaciones.

Si después de `demo:reset` el navegador no deja entrar, recarga sin caché (`Ctrl+Shift+R`)
o borra los datos del sitio: una pestaña abierta antes del reset conserva la sesión anterior
(con usuarios que ya no existen) y puede seguir usando el bundle viejo. `npm run demo:verify`
confirma en segundos si el problema es de datos o del navegador.

### Scripts

| Script                        | Description                                                   |
| ----------------------------- | ------------------------------------------------------------- |
| `npm run dev`                 | Development server                                            |
| `npm run build`               | Production build                                              |
| `npm run start`               | Serve the production build                                    |
| `npm run typecheck`           | TypeScript check                                              |
| `npm run lint`                | ESLint                                                        |
| `npm run generate:server-fns` | Regenerate RPC facades after adding/removing server functions |
| `npm run db:start`            | Start Docker Desktop if needed and the local Supabase stack   |
| `npm run db:stop`             | Stop the local stack, keeping data                            |
| `npm run db:status`           | Show local URLs and keys                                      |
| `npm run db:reset`            | Reapply all migrations from scratch                           |
| `npm run db:replica`          | Reset + seed the demo in one step                             |
| `npm run demo:seed`           | Seed the local demo company (refuses remote URLs)             |
| `npm run demo:reset`          | Truncate the local database and seed the demo again           |
| `npm run demo:dry`            | Dry-run of the demo seed (validates, writes nothing)          |
| `npm run demo:verify`         | Check demo data and that every demo user can sign in          |

### Server functions

Business logic lives in `src/lib/api/*.functions.ts` as `createServerFn` definitions.
`scripts/generate-server-fns.mjs` generates:

- `src/lib/api-client/*`: client-side facades (used by components).
- `src/lib/server-fn/registry.server.ts`: server registry used by `POST /api/rpc/[fn]`.

After adding or removing a server function, run:

```sh
npm run generate:server-fns
```
