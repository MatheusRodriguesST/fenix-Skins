// servidor: usa service_role key (NUNCA enviar para o cliente)
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!;

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});
