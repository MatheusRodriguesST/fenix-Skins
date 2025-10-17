// src/lib/supabaseServer.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

declare global {
  // para HMR/dev: guarda o client globalmente (evita múltiplas instâncias)
  // eslint-disable-next-line no-var
  var __supabaseAdmin: SupabaseClient | undefined;
}

/**
 * Retorna um Supabase admin client (service_role) — chame supabaseAdmin() nas rotas server-side.
 */
export function supabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE;

  if (!url || !key) {
    throw new Error("Missing Supabase URL or service role key (env)");
  }

  if (process.env.NODE_ENV === "development") {
    if (!global.__supabaseAdmin) {
      global.__supabaseAdmin = createClient(url, key, { auth: { persistSession: false } });
    }
    return global.__supabaseAdmin!;
  }

  return createClient(url, key, { auth: { persistSession: false } });
}
