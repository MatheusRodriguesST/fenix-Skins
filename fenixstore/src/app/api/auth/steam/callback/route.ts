// app/api/auth/steam/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { sign } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    const claimed_id = params.get("openid.claimed_id") || params.get("openid.identity");
    if (!claimed_id) {
      console.warn("steam callback: no claimed_id");
      return NextResponse.redirect("/", { status: 302 });
    }

    const m = claimed_id.match(/\/id\/(\d+)$/);
    if (!m) {
      console.warn("steam callback: cannot parse steam id from claimed_id:", claimed_id);
      return NextResponse.redirect("/", { status: 302 });
    }
    const steamId = m[1];

    // Upsert básico no users (ajuste campos conforme sua tabela)
    await supabaseAdmin
      .from("users")
      .upsert(
        {
          id: steamId,
          display_name: `steam:${steamId}`,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        },
        { onConflict: "id" }
      );

    // gerar token JWT
    const token = await sign({ sub: steamId });

    const res = NextResponse.redirect(new URL("/", req.url));

    const isProd = process.env.NODE_ENV === "production";
    // Em dev, não use secure e use SameSite=Lax para funcionar em http://localhost
    res.cookies.set({
      name: "fenix_token",
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
      maxAge: 60 * 60 * 24 * 30,
    });

    console.log("steam callback: set fenix_token for", steamId);
    return res;
  } catch (err) {
    console.error("steam callback error:", err);
    return NextResponse.redirect("/", { status: 302 });
  }
}
