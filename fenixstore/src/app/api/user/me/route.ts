// src/app/api/user/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verify } from "@/lib/jwt"; // assume you have a verify function in your jwt lib

/**
 * Endpoint GET /api/user/me
 * - Lê cookie 'token'
 * - Verifica/decodifica JWT para obter steamId/userId
 * - Busca usuário no banco via supabaseAdmin()
 */
export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get("token")?.value;
    if (!cookie) {
      console.warn("API /user/me: token cookie ausente");
      return new NextResponse(null, { status: 401 });
    }

    // Decodifica/verifica token JWT (implemente verify no seu lib/jwt)
    let payload: any;
    try {
      payload = verify(cookie);
    } catch (err) {
      console.error("API /user/me: token inválido:", err);
      return new NextResponse(null, { status: 401 });
    }

    const steamId = payload?.steamId ?? null;
    const userId = payload?.userId ?? null;

    if (!steamId && !userId) {
      console.warn("API /user/me: token não possui steamId nem userId");
      return new NextResponse(null, { status: 401 });
    }

    const supabase = supabaseAdmin();

    // Prefer buscar pelo id (userId) se presente, senão por steam_id
    let query = supabase.from("users").select("*");
    query = userId ? query.eq("id", userId) : query.eq("steam_id", steamId);
    const { data: user, error } = await query.maybeSingle();

    if (error) {
      console.error("API /user/me error:", error);
      return new NextResponse(null, { status: 500 });
    }

    if (!user) {
      return new NextResponse(null, { status: 404 });
    }

    // Retorna o usuário (filtre campos sensíveis se necessário)
    return NextResponse.json({ user });
  } catch (err) {
    console.error("API /user/me error:", err);
    return new NextResponse(null, { status: 500 });
  }
}
