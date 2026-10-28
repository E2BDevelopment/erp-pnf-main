"use client";

/**
 * Next.js equivalents for the small subset of TanStack Router used by the app.
 *
 * Keeping this compatibility layer means UI components only needed their import
 * path changed (`@tanstack/react-router` → `@/lib/navigation`) and their markup
 * stayed exactly the same (`<Link to=... params=...>`).
 */
import NextLink from "next/link";
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type ParamMap = Record<string, unknown>;
type SearchValue = string | number | boolean | null | undefined;
type SearchObject = Record<string, SearchValue>;

export type NavigateOptions = {
  to?: string;
  params?: ParamMap;
  search?: SearchObject | ((prev: SearchObject) => SearchObject);
  replace?: boolean;
};

const SPLAT_KEYS = ["slug", "_splat"];

function flattenParams(params: ParamMap): ParamMap {
  const flat: ParamMap = { ...params };
  for (const key of SPLAT_KEYS) {
    const value = params[key];
    if (Array.isArray(value)) flat._splat = value.join("/");
  }
  return flat;
}

function interpolate(path: string, params?: ParamMap): string {
  if (!params) return path;
  const flat = flattenParams(params);
  return path.replace(/\$(\w+)?/g, (_match, name: string | undefined) => {
    if (!name) {
      const splat = flat._splat ?? flat.slug;
      return Array.isArray(splat) ? splat.join("/") : String(splat ?? "");
    }
    const value = flat[name];
    return Array.isArray(value) ? value.join("/") : String(value ?? "");
  });
}

function toQueryString(
  search?: SearchObject | ((prev: SearchObject) => SearchObject),
  prev?: SearchObject,
) {
  if (!search) return "";
  const resolved = typeof search === "function" ? search(prev ?? {}) : search;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(resolved ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) qs.append(key, String(item));
    } else {
      qs.set(key, String(value));
    }
  }
  return qs.toString();
}

export function buildHref(
  to: string,
  params?: ParamMap,
  search?: SearchObject | ((prev: SearchObject) => SearchObject),
  currentSearch?: SearchObject,
): string {
  const path = interpolate(to, params);
  const qs = toQueryString(search, currentSearch);
  return qs ? `${path}?${qs}` : path;
}

/**
 * Derives params that Next.js layouts cannot see (child dynamic segments).
 * AppShell lives at `/app` but needs `obraId` to render the obra navigation.
 */
function deriveParams(pathname: string): Record<string, string> {
  const derived: Record<string, string> = {};
  const obra = /\/app\/obras\/([^/]+)/.exec(pathname);
  if (obra && obra[1] !== "nueva") derived.obraId = obra[1];
  const cliente = /\/app\/catalogos\/clientes\/([^/]+)/.exec(pathname);
  if (cliente) derived.clienteId = cliente[1];
  return derived;
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
  params?: ParamMap;
  search?: SearchObject | ((prev: SearchObject) => SearchObject);
  hash?: string;
  replace?: boolean;
  children?: ReactNode;
};

/**
 * Un enlace sin `search` no necesita leer los query params actuales. Por eso el
 * componente se divide: si llamara `useSearchParams()` siempre, cualquier
 * página con un `<Link>` se pospondría a cliente y su HTML saldría vacío (la
 * landing incluida), que es el peor intercambio posible para la primera
 * pintura.
 */
export function Link({ to, params, search, hash, replace, children, ...rest }: LinkProps) {
  if (search) {
    return (
      <LinkConBusqueda
        to={to}
        params={params}
        search={search}
        hash={hash}
        replace={replace}
        {...rest}
      >
        {children}
      </LinkConBusqueda>
    );
  }

  const href = buildHref(to, params);
  return (
    <NextLink href={hash ? `${href}#${hash}` : href} replace={replace} {...rest}>
      {children}
    </NextLink>
  );
}

function LinkConBusqueda({
  to,
  params,
  search,
  hash,
  replace,
  children,
  ...rest
}: LinkProps & { search: NonNullable<LinkProps["search"]> }) {
  const searchParams = useSearchParams();
  const currentSearch = useMemo(
    () => Object.fromEntries(searchParams.entries()) as SearchObject,
    [searchParams],
  );
  const baseHref = buildHref(to, params, search, currentSearch);
  const href = hash ? `${baseHref}#${hash}` : baseHref;
  return (
    <NextLink href={href} replace={replace} {...rest}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useNextParams() as ParamMap;

  return useCallback(
    (options: NavigateOptions | string) => {
      if (typeof options === "string") {
        router.push(options);
        return;
      }
      // Los query params se leen en el momento del clic, no en el render: con
      // `useSearchParams()` aquí, /login y /onboarding se posponían a cliente y
      // llegaban sin HTML.
      const currentSearch =
        typeof window === "undefined"
          ? ({} as SearchObject)
          : (Object.fromEntries(
              new URLSearchParams(window.location.search).entries(),
            ) as SearchObject);
      const base = !options.to || options.to === "." ? pathname : options.to;
      const href = buildHref(
        base,
        { ...flattenParams(params), ...deriveParams(pathname), ...(options.params ?? {}) },
        options.search,
        currentSearch,
      );
      if (options.replace) router.replace(href);
      else router.push(href);
    },
    [router, pathname, params],
  );
}

export function useRouterState<T>(options: {
  select: (state: { location: { pathname: string; search: SearchObject; href: string } }) => T;
}): T {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = useMemo(
    () => Object.fromEntries(searchParams.entries()) as SearchObject,
    [searchParams],
  );
  const href = searchParams.size > 0 ? `${pathname}?${searchParams.toString()}` : pathname;
  return options.select({ location: { pathname, search, href } });
}

export function useParams<T = Record<string, string>>(_options?: unknown): T {
  const params = useNextParams();
  const pathname = usePathname();
  const flattened = useMemo(() => {
    const flat: Record<string, string | string[]> = {
      ...(params as Record<string, string | string[]>),
    };
    if (Array.isArray(flat.slug)) flat._splat = flat.slug.join("/");
    for (const [key, value] of Object.entries(deriveParams(pathname))) {
      if (flat[key] === undefined) flat[key] = value;
    }
    return flat;
  }, [params, pathname]);
  return flattened as T;
}

export function useSearch<T = Record<string, string>>(_options?: unknown): T {
  const searchParams = useSearchParams();
  return useMemo(
    () => Object.fromEntries(searchParams.entries()) as SearchObject,
    [searchParams],
  ) as T;
}

export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <>{mounted ? children : fallback}</>;
}
