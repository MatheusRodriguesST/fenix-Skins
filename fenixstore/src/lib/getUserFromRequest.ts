// src/lib/getUserFromRequest.ts
// (This file looks mostly correct, but ensure supabaseAdmin is imported and called as a factory function.
// If supabaseServer.ts exports supabaseAdmin as a function that returns the client, this should work.)

import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verify } from "@/lib/jwt";

/**
 * Retorna o usuário associado ao request (busca no token cookie).
 * - chama supabaseAdmin() para obter o client
 * - tenta buscar pelo userId (payload.userId) primeiro, senão por steamId (payload.steamId)
 * - retorna user object ou null se não autenticado
 */
export async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  let payload: any;
  try {
    payload = verify(token);
  } catch (err) {
    console.warn("getUserFromRequest: token inválido", err);
    return null;
  }

  const userId = payload?.userId ?? null;
  const steamId = payload?.steamId ?? null;

  try {
    const supabase = supabaseAdmin();

    if (userId) {
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
      if (error) {
        console.error("getUserFromRequest: erro ao buscar user por id", error);
        return null;
      }
      return data ?? { id: userId, steam_id: steamId ?? null };
    }

    if (steamId) {
      const { data, error } = await supabase.from("users").select("*").eq("steam_id", steamId).maybeSingle();
      if (error) {
        console.error("getUserFromRequest: erro ao buscar user por steam_id", error);
        return null;
      }
      return data ?? { id: null, steam_id: steamId };
    }

    return null;
  } catch (err) {
    console.error("getUserFromRequest: erro inesperado", err);
    return null;
  }
}