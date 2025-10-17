// src/lib/auth.ts
import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verify } from "@/lib/jwt";

/**
 * decodeTokenFromRequest - retorna payload do JWT ou null
 */
export function decodeTokenFromRequest(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    return verify(token);
  } catch (err) {
    console.warn("decodeTokenFromRequest: token inválido", err);
    return null;
  }
}

/**
 * getUserFromRequestWithSupabase - busca o usuário no DB (invoca supabaseAdmin())
 */
export async function getUserFromRequestWithSupabase(req: NextRequest) {
  const payload = decodeTokenFromRequest(req);
  if (!payload) return null;

  const supabase = supabaseAdmin(); // <- CHAMAR a função
  const userId = payload.userId ?? null;
  const steamId = payload.steamId ?? null;

  try {
    if (userId) {
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
      if (error) {
        console.error("getUserFromRequestWithSupabase: erro DB por id", error);
        return null;
      }
      return data ?? { id: userId, steam_id: steamId ?? null };
    }

    if (steamId) {
      const { data, error } = await supabase.from("users").select("*").eq("steam_id", steamId).maybeSingle();
      if (error) {
        console.error("getUserFromRequestWithSupabase: erro DB por steam_id", error);
        return null;
      }
      return data ?? { id: null, steam_id: steamId };
    }

    return null;
  } catch (err) {
    console.error("getUserFromRequestWithSupabase: erro inesperado", err);
    return null;
  }
}
