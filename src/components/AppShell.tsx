"use client";

import Image from "next/image";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useRouterState } from "@/lib/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/server-fn/client";
import { getCompanyConfig, getCompanyLogoSignedUrl } from "@/lib/api-client/company.functions";
import { getObraDashboard } from "@/lib/api-client/obras.functions";
import {
  Building2,
  BookOpen,
  Settings,
  LogOut,
  HardHat,
  FileText,
  Receipt,
  Banknote,
  ClipboardList,
  Users,
  Hammer,
  Handshake,
  Warehouse,
  Truck,
  Fuel,
  Coins,
  ListTodo,
  BarChart3,
  LayoutDashboard,
  ClipboardClock,
  AlertCircle,
  Search,
  User,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore, useEffectiveRoles, useEffectiveIsDirector } from "@/stores/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ADMIN_GROUPS } from "@/lib/modules";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NotificacionesBell } from "@/components/NotificacionesBell";
import { MobileBottomBar, type BottomBarItem } from "@/components/MobileBottomBar";
import { PendientesBadge } from "@/components/PendientesBadge";
import {
  usePendientesAdmin,
  usePendientesObra,
  usePendientesRealtime,
  moduleKeyFromPath,
} from "@/hooks/usePendientes";
import { usePermisos } from "@/hooks/usePermisos";
import { OBRA_MODULE_PERMISSIONS } from "@/lib/permisos/catalogo";
import { Flip, gsap, MOTION, MOTION_OK, REDUCED, useGSAP } from "@/lib/anim/gsap";

/** Normaliza para buscar sin acentos: "nomina" encuentra "Nómina". */
const normalizar = (valor: string) =>
  valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Título de pestaña por segmento de ruta: sin esto, cuatro obras son cuatro pestañas iguales. */
const SEGMENT_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  obras: "Obras",
  nueva: "Nueva obra",
  catalogos: "Catálogos",
  clientes: "Clientes",
  proveedores: "Proveedores",
  insumos: "Insumos",
  trabajadores: "Trabajadores",
  subcontratistas: "Subcontratistas",
  configuracion: "Configuración",
  equipo: "Equipo",
  notificaciones: "Notificaciones",
  "mi-cuenta": "Mi cuenta",
  auditoria: "Bitácora de auditoría",
  presupuesto: "Presupuesto",
  estimaciones: "Estimaciones",
  "ordenes-cambio": "Órdenes de cambio",
  requisiciones: "Requisiciones",
  nomina: "Nómina",
  destajos: "Destajos",
  subcontratos: "Subcontratos",
  "almacen-obra": "Almacén de obra",
  "almacen-central": "Almacén central",
  rentas: "Rentas",
  gasolinas: "Gasolinas",
  "caja-chica": "Caja chica",
  "gastos-obra": "Gastos de obra",
  "gastos-oficina": "Gastos de oficina",
  tareas: "Tareas",
  tesoreria: "Tesorería",
  contabilidad: "Contabilidad",
  "condensado-semanal": "Condensado semanal",
  "cuentas-por-pagar": "Cuentas por pagar",
  "estado-resultados": "Estado de resultados",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);
  const reset = useAuthStore((s) => s.reset);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const params = useParams({ strict: false }) as { obraId?: string };
  const obraId = params.obraId;
  const isInsideObra = Boolean(obraId) && pathname.startsWith(`/app/obras/${obraId}`);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");
  const [fechaActual, setFechaActual] = useState("");

  const fetchCfg = useServerFn(getCompanyConfig);
  const signFn = useServerFn(getCompanyLogoSignedUrl);
  const cfg = useQuery({ queryKey: ["company-config"], queryFn: () => fetchCfg() });
  const logoPath = cfg.data?.logo_url ?? null;
  const logoSigned = useQuery({
    queryKey: ["company-logo-signed", logoPath],
    queryFn: () => signFn({ data: { path: logoPath! } }),
    enabled: !!logoPath,
    staleTime: 50 * 60 * 1000,
  });
  const logoUrl = logoSigned.data?.url ?? null;
  /** El nombre real de la constructora, no la categoría del producto. */
  const nombreEmpresa = cfg.data?.razon_social ?? cfg.data?.nombre_completo ?? null;

  const effRoles = useEffectiveRoles();
  const director = useEffectiveIsDirector();
  const showAdmin = director || effRoles.includes("administrativo");

  useEffect(() => {
    setFechaActual(
      new Intl.DateTimeFormat("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "America/Mexico_City",
      })
        .format(new Date())
        .replace(",", ""),
    );
  }, []);

  const {
    counts: adminPendientes,
    isError: pendientesError,
    refetch: refetchPendientes,
  } = usePendientesAdmin();
  const { counts: obraPendientes } = usePendientesObra(obraId);

  const fetchObraHeader = useServerFn(getObraDashboard);
  const obraHeader = useQuery({
    queryKey: ["obra-dashboard", obraId],
    queryFn: () => fetchObraHeader({ data: { obraId: obraId! } }),
    enabled: Boolean(obraId),
  });
  const obraNombre = obraHeader.data?.obra?.nombre ?? null;

  useEffect(() => {
    const segment = pathname.split("/").filter(Boolean).pop() ?? "";
    const base = SEGMENT_TITLES[segment] ?? obraNombre ?? "Inicio";
    const partes = obraNombre && base !== obraNombre ? [base, obraNombre] : [base];
    document.title = `${partes.join(" · ")} · ERP PNF`;
  }, [pathname, obraNombre]);
  usePendientesRealtime();

  /**
   * Entrada de ruta: el App Router cubre el hueco con `loading.tsx`, pero el
   * contenido nuevo entra seco. Un `from` corto sobre el `<main>` por ruta es
   * el relevo — se cambia el contenido, el marco (shell) se queda quieto.
   */
  const shellRef = useRef<HTMLDivElement>(null);
  const mainCom = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const el = mainCom.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(el, {
          autoAlpha: 0,
          y: 4,
          duration: MOTION.entrada,
          ease: "power2.out",
        });
      });
      return () => mm.revert();
    },
    { scope: shellRef, dependencies: [pathname], revertOnUpdate: true },
  );

  /**
   * Riel del renglón activo. Era un pseudo-elemento `before:` en cada renglón,
   * que no puede viajar: salía de un lado y aparecía en otro. Ahora es un
   * `<span>` real que Flip recorre de módulo a módulo al cambiar la ruta.
   * Con menos movimiento, el riel simplemente se coloca sin tween.
   */
  useGSAP(
    () => {
      const navs = gsap.utils.toArray<HTMLElement>("[data-nav]", shellRef.current);
      if (navs.length === 0) return;

      for (const nav of navs) {
        const rail = nav.querySelector<HTMLElement>("[data-rail]");
        if (!rail) continue;
        gsap.killTweensOf(rail);

        const activo = nav.querySelector<HTMLElement>('a[aria-current="page"]');
        if (!activo) {
          gsap.set(rail, { autoAlpha: 0 });
          continue;
        }

        const nuevo = {
          top: activo.offsetTop,
          height: activo.offsetHeight,
        };
        const colocarse = () =>
          gsap.set(rail, { autoAlpha: 1, x: 0, y: 0, scaleX: 1, scaleY: 1, ...nuevo });

        if (window.matchMedia(REDUCED).matches) {
          colocarse();
          continue;
        }

        // El movimiento lo hace Flip: la diferencia entre el estado anterior y
        // el nuevo se anima con transform, no top/height (regla de la casa).
        const estado = Flip.getState(rail);
        colocarse();
        Flip.from(estado, { duration: MOTION.entrada, ease: "power2.out", overwrite: true });
      }
    },
    { scope: shellRef, dependencies: [pathname, navQuery, mobileOpen] },
  );

  const { can: canPerm, isLoading: permisosLoading } = usePermisos();
  const puedeCrearObra = canPerm("obras.crear");

  const puedeConfigurarObra = canPerm("obras.editar") || canPerm("obras.asignar_team");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    reset();
    navigate({ to: "/login" });
  };

  const initials =
    profile?.nombre_completo
      ?.split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "U";

  const sidebarBranding = (
    <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
      <Image
        src="/assets/img/icon-1.png"
        alt="Logo ERP PNF"
        width={32}
        height={32}
        className="size-8 shrink-0 rounded-md object-contain"
        priority
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight">ERP PNF</p>
        <p
          className="text-xs text-sidebar-foreground/60 leading-tight truncate"
          title={nombreEmpresa ?? undefined}
        >
          {nombreEmpresa ?? "Constructora"}
        </p>
      </div>
    </div>
  );

  const obraNavItems = useMemo<BottomBarItem[]>(() => {
    if (!obraId) return [];
    return [
      {
        to: `/app/obras/${obraId}/requisiciones`,
        label: "Requisiciones",
        icon: ClipboardList,
        pendientes: obraPendientes["requisiciones"],
      },
      {
        to: `/app/obras/${obraId}/almacen-obra`,
        label: "Almacén",
        icon: Warehouse,
        pendientes: obraPendientes["almacen-obra"],
      },
      {
        to: `/app/obras/${obraId}/gastos-obra`,
        label: "Gastos",
        icon: Banknote,
        pendientes: obraPendientes["gastos-obra"],
      },
      {
        to: `/app/obras/${obraId}/tareas`,
        label: "Tareas",
        icon: ListTodo,
        pendientes: obraPendientes["tareas"],
      },
      {
        to: `/app/obras/${obraId}/presupuesto`,
        label: "Presupuesto",
        icon: Receipt,
        pendientes: obraPendientes["presupuesto"],
      },
      {
        to: `/app/obras/${obraId}/estimaciones`,
        label: "Estimaciones",
        icon: BarChart3,
        pendientes: obraPendientes["estimaciones"],
      },
      {
        to: `/app/obras/${obraId}/nomina`,
        label: "Nómina",
        icon: Users,
        pendientes: obraPendientes["nomina"],
      },
      {
        to: `/app/obras/${obraId}/destajos`,
        label: "Destajos",
        icon: Hammer,
        pendientes: obraPendientes["destajos"],
      },
      {
        to: `/app/obras/${obraId}/subcontratos`,
        label: "Subcontratos",
        icon: Handshake,
        pendientes: obraPendientes["subcontratos"],
      },
      {
        to: `/app/obras/${obraId}/rentas`,
        label: "Rentas",
        icon: Truck,
        pendientes: obraPendientes["rentas"],
      },
      {
        to: `/app/obras/${obraId}/gasolinas`,
        label: "Gasolinas",
        icon: Fuel,
        pendientes: obraPendientes["gasolinas"],
      },
      {
        to: `/app/obras/${obraId}/caja-chica`,
        label: "Caja chica",
        icon: Coins,
        pendientes: obraPendientes["caja-chica"],
      },
      ...(puedeConfigurarObra
        ? [
            {
              to: `/app/obras/${obraId}/configuracion`,
              label: "Configuración",
              icon: Settings,
            } as BottomBarItem,
          ]
        : []),
    ].filter((item) => {
      const key = OBRA_MODULE_PERMISSIONS[item.to.split("/").at(-1) ?? ""];
      return !key || canPerm(key);
    });
    // `obraPendientes` cambia de identidad solo cuando cambian los conteos.
  }, [obraId, obraPendientes, puedeConfigurarObra, canPerm]);

  /** Secciones de la navegación, ya filtradas por permisos. */
  const seccionesNav = useMemo(() => {
    const secciones: Array<{ label: string; items: BottomBarItem[] }> = [];

    if (isInsideObra && obraNavItems.length > 0) {
      secciones.push({ label: obraNombre ?? "Obra", items: obraNavItems });
    }

    const corporativo: BottomBarItem[] = [
      { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/app/obras", label: "Obras", icon: HardHat, exact: true },
      { to: "/app/catalogos", label: "Catálogos", icon: BookOpen },
      ...(puedeCrearObra
        ? [{ to: "/app/obras/nueva", label: "Nueva obra", icon: HardHat, exact: true }]
        : []),
      ...(director
        ? [
            { to: "/app/configuracion", label: "Configuración", icon: Settings },
            { to: "/app/auditoria", label: "Auditoría", icon: ClipboardClock },
          ]
        : []),
    ];
    secciones.push({ label: "Corporativo", items: corporativo });

    if (showAdmin) {
      for (const grupo of ADMIN_GROUPS) {
        // Mientras los permisos cargan no se filtra: ocultar todo y volver a
        // mostrarlo produce un parpadeo peor que esperar.
        const modulos = permisosLoading
          ? grupo.modules
          : grupo.modules.filter((m) => canPerm(m.verKey));
        if (modulos.length === 0) continue;
        secciones.push({
          label: grupo.label,
          items: modulos.map((m) => ({
            to: m.to,
            label: m.label,
            icon: m.icon,
            exact: true,
            pendientes: adminPendientes[moduleKeyFromPath(m.to)],
          })),
        });
      }
    }

    return secciones;
  }, [
    isInsideObra,
    obraNavItems,
    obraNombre,
    puedeCrearObra,
    director,
    showAdmin,
    permisosLoading,
    canPerm,
    adminPendientes,
  ]);

  const renderNav = (onNavigate?: () => void) => {
    const filtro = normalizar(navQuery.trim());
    const visibles = seccionesNav
      .map((seccion) => ({
        label: seccion.label,
        items: filtro
          ? seccion.items.filter((item) => normalizar(item.label).includes(filtro))
          : seccion.items,
      }))
      .filter((seccion) => seccion.items.length > 0);

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="px-3 pt-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-sidebar-foreground/50"
              aria-hidden
            />
            <input
              type="search"
              value={navQuery}
              onChange={(event) => setNavQuery(event.target.value)}
              placeholder="Buscar módulo"
              aria-label="Buscar módulo"
              className="h-8 w-full rounded-md border border-sidebar-border bg-sidebar-accent/40 pr-2 pl-7 text-xs text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus-visible:ring-1 focus-visible:ring-sidebar-ring focus-visible:outline-none"
            />
          </div>
        </div>

        <nav
          aria-label={onNavigate ? "Menú de navegación" : "Navegación principal"}
          data-nav
          className="nav-scroll relative flex-1 space-y-6 overflow-y-auto px-3 py-4"
        >
          {visibles.map((seccion) => (
            // El grupo administrativo «Obra» coincide con la sección de la obra
            // abierta: el destino del primer renglón desempata la clave.
            <div key={`${seccion.label}:${seccion.items[0]?.to ?? ""}`}>
              <p
                className="mb-2 truncate px-3 text-xs uppercase tracking-wider text-sidebar-foreground/50"
                title={seccion.label}
              >
                {seccion.label}
              </p>
              {seccion.items.map((item) => (
                <NavItem
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  icon={item.icon}
                  active={
                    item.exact
                      ? pathname === item.to
                      : pathname === item.to || pathname.startsWith(item.to + "/")
                  }
                  onNavigate={onNavigate}
                  pendientes={item.pendientes}
                />
              ))}
            </div>
          ))}

          {visibles.length === 0 && (
            <p className="px-3 text-xs text-sidebar-foreground/60">
              Ningún módulo coincide con «{navQuery.trim()}».
            </p>
          )}

          {pendientesError && (
            <div className="px-1">
              <button
                type="button"
                onClick={() => void refetchPendientes()}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground"
              >
                <AlertCircle className="size-3.5 shrink-0" aria-hidden />
                <span className="flex-1">Pendientes sin actualizar</span>
                <span className="font-medium">Reintentar</span>
              </button>
            </div>
          )}

          {/* Riel del renglón activo. Lo coloca el efecto del shell; el estado
              activo ya lo anuncia `aria-current` en cada renglón. */}
          <span
            data-rail
            aria-hidden
            className="pointer-events-none absolute left-3 top-0 h-0 w-[3px] rounded-full bg-sidebar-primary opacity-0"
          />
        </nav>
      </div>
    );
  };
  return (
    <div ref={shellRef} className="flex min-h-dvh w-full bg-background">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>
      {/* Sidebar desktop. Fija al viewport, no sticky: si el documento crece
          por un portal externo (overlays, avisos) la barra no se despega del
          borde inferior ni deja un hueco blanco. */}
      <aside className="hidden md:fixed md:top-0 md:left-0 md:z-20 md:flex md:h-dvh md:w-64 flex-col bg-sidebar text-sidebar-foreground">
        {sidebarBranding}
        {renderNav()}
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-card pt-[env(safe-area-inset-top)]">
          <div className="mx-auto flex min-h-14 w-full max-w-7xl items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2">
              <Link
                to="/app/dashboard"
                className="flex items-center gap-2 transition-opacity hover:opacity-80"
              >
                {logoUrl && !logoFailed ? (
                  <img
                    src={logoUrl}
                    alt="Logo de la empresa"
                    width={160}
                    height={32}
                    decoding="async"
                    onError={() => setLogoFailed(true)}
                    className="h-8 w-auto max-w-[112px] object-contain md:max-w-[160px]"
                  />
                ) : (
                  <>
                    <Image
                      src="/assets/img/icon-1.png"
                      alt="Naranja Forte"
                      width={28}
                      height={28}
                      className="size-7 object-contain md:hidden"
                    />
                    <span className="hidden items-center gap-2 md:flex">
                      <Building2 className="size-5 text-muted-foreground" aria-hidden />
                      <span className="text-sm font-medium text-foreground">ERP PNF</span>
                    </span>
                  </>
                )}
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <NotificacionesBell />
              <time className="hidden whitespace-nowrap text-sm text-muted-foreground sm:inline">
                {fechaActual}
              </time>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-11 gap-2 md:h-8">
                    {/* Sin `aria-label`: el nombre accesible se compone del texto
                        visible ("Cuenta de", las iniciales y el nombre), así que
                        también coincide con lo que se ve (WCAG 2.5.3). */}
                    <span className="sr-only">Cuenta de </span>
                    <Avatar className="size-7">
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-[160px] truncate text-sm sm:inline">
                      {profile?.nombre_completo}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{profile?.nombre_completo}</span>
                      <span className="text-xs text-muted-foreground">{profile?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {director && (
                    <DropdownMenuItem onClick={() => navigate({ to: "/app/configuracion" })}>
                      <Building2 className="size-4 mr-2" />
                      Configuración de empresa
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate({ to: "/app/mi-cuenta" })}>
                    <User className="size-4 mr-2" />
                    Mi cuenta
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLogoutOpen(true)}>
                    <LogOut className="size-4 mr-2" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main
          ref={mainCom}
          id="contenido"
          tabIndex={-1}
          className={`flex-1 p-2 md:p-2 lg:px-4 lg:pb-2 ${isInsideObra ? "lg:pt-2" : "lg:pt-8"} pb-24 md:pb-2 max-w-7xl w-full mx-auto focus:outline-none`}
        >
          {children}
        </main>
      </div>

      {/* Bottom bar móvil (contextual) */}
      {isInsideObra && obraId ? (
        <MobileBottomBar
          pathname={pathname}
          variant="scroll"
          items={obraNavItems}
          label="Módulos de obra"
          onMoreClick={() => setMobileOpen(true)}
          moreExpanded={mobileOpen}
        />
      ) : showAdmin ? (
        <MobileBottomBar
          pathname={pathname}
          label="Administración"
          items={
            [
              {
                to: "/app/dashboard",
                label: "Dashboard",
                icon: LayoutDashboard,
                exact: true,
              },
              {
                to: "/app/admin/requisiciones",
                label: "Requisiciones",
                icon: ClipboardList,
                pendientes: adminPendientes["requisiciones"],
              },
              {
                to: "/app/admin/cuentas-por-pagar",
                label: "Por pagar",
                icon: FileText,
                pendientes: adminPendientes["cuentas-por-pagar"],
              },
              { to: "/app/obras", label: "Obras", icon: HardHat, exact: true },
            ] satisfies BottomBarItem[]
          }
          onMoreClick={() => setMobileOpen(true)}
          moreExpanded={mobileOpen}
        />
      ) : (
        <MobileBottomBar
          pathname={pathname}
          items={
            [
              {
                to: "/app/dashboard",
                label: "Dashboard",
                icon: LayoutDashboard,
                exact: true,
              },
              { to: "/app/obras", label: "Obras", icon: HardHat, exact: true },
              { to: "/app/catalogos", label: "Catálogos", icon: BookOpen },
              ...(director
                ? [{ to: "/app/configuracion", label: "Configuración", icon: Settings }]
                : []),
            ] satisfies BottomBarItem[]
          }
          onMoreClick={() => setMobileOpen(true)}
          moreExpanded={mobileOpen}
        />
      )}

      {/* Sheet con menú completo (se abre desde "Más") */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="p-0 w-72 bg-sidebar text-sidebar-foreground border-sidebar-border flex flex-col"
        >
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <SheetDescription className="sr-only">
            Módulos disponibles para tu perfil.
          </SheetDescription>
          {sidebarBranding}
          {renderNav(() => setMobileOpen(false))}
        </SheetContent>
      </Sheet>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Si tienes una captura a medias en algún módulo, se perderá lo que no hayas guardado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Cerrar sesión</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const NavItem = memo(function NavItem({
  to,
  label,
  icon: Icon,
  active,
  onNavigate,
  pendientes,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  onNavigate?: () => void;
  pendientes?: number;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={pendientes ? `${pendientes} pendientes por atender` : undefined}
      className={`relative flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors focus-visible:ring-1 focus-visible:ring-sidebar-ring focus-visible:outline-none ${
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
      }`}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="truncate flex-1">{label}</span>
      {pendientes ? <PendientesBadge count={pendientes} /> : null}
    </Link>
  );
});
