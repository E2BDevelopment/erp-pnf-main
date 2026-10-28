/**
 * Next.js replacement for TanStack Start's `createServerFn`.
 *
 * This module is imported by the *server* implementation files
 * (`src/lib/api/*.functions.ts`). Client components never import it: they import
 * the generated facade in `@/lib/api-client/*`, which talks to
 * `POST /api/rpc/[fn]`.
 *
 * The builder keeps the same chainable API used across the codebase so the
 * business logic files did not need to be rewritten:
 *
 *   createServerFn({ method: "POST" })
 *     .middleware([requireSupabaseAuth])
 *     .inputValidator((data) => schema.parse(data))
 *     .handler(async ({ data, context }) => { ... })
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AuthClaims = {
  sub?: string;
  email?: string;
  [key: string]: unknown;
};

export type ServerFnContext = {
  supabase: SupabaseClient<Database>;
  userId: string;
  claims: AuthClaims;
};

/** A server middleware resolves values that are merged into the handler context. */
export type ServerFnMiddleware = {
  run: () => Promise<Record<string, unknown>>;
};

export type ServerFnOptions = { method?: "GET" | "POST" };

type Callable<TData, TResult> = (
  input?: [TData] extends [undefined] ? void : { data: TData },
) => Promise<TResult>;

export type ServerFn<TData = undefined, TResult = unknown> = Callable<TData, TResult> & {
  /** Used by the RPC route handler; present on the server implementation only. */
  readonly __execute: (input?: { data?: unknown }) => Promise<TResult>;
};

export class ServerFnBuilder<TData = undefined, TResult = unknown> {
  private middlewares: ServerFnMiddleware[] = [];
  private validator?: (data: unknown) => TData;
  private handlerFn?: (args: { data: TData; context: ServerFnContext }) => Promise<unknown>;

  constructor(private readonly options: ServerFnOptions = {}) {}

  middleware(middlewares: ServerFnMiddleware[]): ServerFnBuilder<TData, TResult> {
    this.middlewares = middlewares;
    return this;
  }

  inputValidator<T>(schema: { parse: (data: unknown) => T }): ServerFnBuilder<T, TResult>;
  inputValidator<TInput, T>(validator: (data: TInput) => T): ServerFnBuilder<T, TResult>;
  inputValidator<T>(
    arg: ((data: any) => T) | { parse: (data: unknown) => T },
  ): ServerFnBuilder<T, TResult> {
    const validator = typeof arg === "function" ? arg : (data: unknown) => arg.parse(data);
    const next = this as unknown as ServerFnBuilder<T, TResult>;
    next.validator = validator;
    return next;
  }

  handler<TResult2>(
    handler: (args: { data: TData; context: ServerFnContext }) => Promise<TResult2>,
  ): ServerFn<TData, TResult2> {
    this.handlerFn = handler as (args: {
      data: TData;
      context: ServerFnContext;
    }) => Promise<unknown>;

    const execute = async (input?: { data?: unknown }): Promise<TResult2> => {
      const context: Record<string, unknown> = {};
      for (const mw of this.middlewares) {
        Object.assign(context, await mw.run());
      }
      const data = this.validator ? this.validator(input?.data) : (input?.data as TData);
      return (await this.handlerFn!({
        data,
        context: context as ServerFnContext,
      })) as TResult2;
    };

    const callable = (async (input?: { data?: unknown }) => execute(input)) as ServerFn<
      TData,
      TResult2
    >;

    Object.defineProperty(callable, "__execute", { value: execute, enumerable: false });
    return callable;
  }
}

export function createServerFn<TData = undefined, TResult = unknown>(
  options: ServerFnOptions = {},
): ServerFnBuilder<TData, TResult> {
  return new ServerFnBuilder<TData, TResult>(options);
}
