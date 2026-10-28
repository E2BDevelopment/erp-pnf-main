"use client";

/**
 * Client-side counterpart of the server-function builder.
 *
 * `clientFn(id)` returns a callable with the same shape as the server
 * implementation and forwards the call to `POST /api/rpc/[fn]`. The generated
 * facades in `src/lib/api-client` use it so call sites keep working unchanged.
 */
import { supabase } from "@/integrations/supabase/client";

export async function callRpc<T>(id: string, input?: unknown): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const response = await fetch(`/api/rpc/${encodeURIComponent(id)}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input ?? {}),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    { ok: true; data: T } | { ok: false; error: string } | null;

  if (!response.ok || !payload || payload.ok === false) {
    throw new Error(payload && "error" in payload ? payload.error : `Error ${response.status}`);
  }

  return payload.data;
}

export function clientFn<T extends (...args: any[]) => any>(id: string): T {
  return ((input?: unknown) => callRpc(id, input)) as unknown as T;
}

/** Compatibility hook used by the existing components. */
export function useServerFn<T>(fn: T): T {
  return fn;
}
