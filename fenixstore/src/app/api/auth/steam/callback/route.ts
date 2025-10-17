// src/app/api/auth/steam/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchSteamProfile } from "@/lib/steamProfile";
import { sign } from "@/lib/jwt";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

/**
 * Extrai SteamID do URL openid.identity retornado pelo Steam OpenID
 */
function extractSteamIdFromOpenId(openIdUrl: string | null): string | null {
  if (!openIdUrl) return null;
  const match = openIdUrl.match(/\/id\/(\d+)$/);
  return match ? match[1] : null;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const steamIdentity = url.searchParams.get("openid.identity");

    if (!steamIdentity) {
      console.error("❌ Steam callback sem openid.identity");
      return NextResponse.redirect(new URL("/?error=missing_identity", req.url));
    }

    const steamId = extractSteamIdFromOpenId(steamIdentity);
    if (!steamId) {
      console.error("❌ SteamID inválido extraído:", steamIdentity);
      return NextResponse.redirect(new URL("/?error=invalid_steamid", req.url));
    }

    // Busca o perfil do Steam
    const profile = await fetchSteamProfile(steamId);
    if (!profile) {
      console.error(`❌ fetch_profile_failed para SteamID ${steamId}`);
      return NextResponse.redirect(new URL("/?error=fetch_profile_failed", req.url));
    }

    const privacy = String(profile.privacyState || "").toLowerCase();
    if (privacy !== "public" && privacy !== "1" && privacy !== "3") {
      console.warn(`⚠️ Perfil ${steamId} pode não ser público (privacyState=${privacy})`);
    }

    // Obtem o client admin Supabase
    const supabase = supabaseAdmin();

    // Verifica se usuário existe (procura por steam_id)
    const { data: existingUser, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("steam_id", steamId)
      .maybeSingle();

    if (findError && findError.code !== "PGRST116") {
      console.error("❌ Erro ao buscar usuário no DB:", findError);
      return NextResponse.redirect(new URL("/?error=db_fetch_failed", req.url));
    }

    let user = existingUser;

    // Se não existir, cria novo usuário usando apenas colunas que existem na sua schema
    if (!user) {
      console.log(`🆕 Criando novo usuário para SteamID ${steamId}`);
      const newUserPayload = {
        id: randomUUID(), // gere um id único se a tabela requer id not null
        steam_id: steamId,
        name: profile.personaName || `steam:${steamId}`,
        avatar: profile.avatarFull || null,
        created_at: new Date().toISOString(),
        // NÃO use profile_url aqui — coluna não existe no schema
      };

      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert(newUserPayload)
        .select()
        .maybeSingle();

      if (insertError) {
        // Em caso de conflito (por exemplo insert concorrente), tente buscar novamente
        console.error("❌ Erro ao criar usuário:", insertError);
        // tenta recuperar usuário caso insert tenha falhado por concorrência
        const { data: recheck, error: recheckErr } = await supabase
          .from("users")
          .select("*")
          .eq("steam_id", steamId)
          .maybeSingle();

        if (recheckErr) {
          console.error("❌ Rechecagem falhou após insert error:", recheckErr);
          return NextResponse.redirect(new URL("/?error=create_user_failed", req.url));
        }
        user = recheck ?? null;

        if (!user) {
          return NextResponse.redirect(new URL("/?error=create_user_failed", req.url));
        }
      } else {
        user = newUser;
      }
    }

    // Gera token JWT
    const token = sign({
      steamId,
      userId: user?.id,
      name: user?.name ?? profile.personaName,
      avatar: user?.avatar ?? profile.avatarFull,
    });

    // Define cookie httpOnly seguro
    const response = NextResponse.redirect(new URL("/", req.url));
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    console.log(`✅ Login bem-sucedido — SteamID ${steamId}`);
    return response;
  } catch (error) {
    console.error("💥 Erro inesperado no callback Steam:", error);
    return NextResponse.redirect(new URL("/?error=callback_exception", req.url));
  }
}
