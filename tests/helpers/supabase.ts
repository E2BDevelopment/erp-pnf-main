import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { DEMO_PASSWORD, loadTestEnv, requireEnv } from "./env";

loadTestEnv();

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";

const ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  "";

export type DemoSession = {
  client: SupabaseClient<Database>;
  userId: string;
  email: string;
  token: string;
  companyId: string | null;
};

export function anonClient(): SupabaseClient<Database> {
  requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  return createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function adminClient(): SupabaseClient<Database> {
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient<Database>(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function signInDemo(email: string): Promise<DemoSession> {
  const client = anonClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: DEMO_PASSWORD,
  });
  if (error) throw new Error(`No se pudo iniciar sesión como ${email}: ${error.message}`);
  if (!data.session?.access_token) throw new Error(`Supabase no devolvió sesión para ${email}`);

  const { data: profile } = await client
    .from("profiles")
    .select("company_id")
    .eq("id", data.user.id)
    .maybeSingle();

  return {
    client,
    userId: data.user.id,
    email,
    token: data.session.access_token,
    companyId: profile?.company_id ?? null,
  };
}

export async function signOut(session: DemoSession | null | undefined) {
  if (!session) return;
  await session.client.auth.signOut().catch(() => undefined);
}
