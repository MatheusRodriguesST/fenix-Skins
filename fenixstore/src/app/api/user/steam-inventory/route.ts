// src/app/api/user/steam-inventory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verify } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("fenix_token")?.value;
    if (!token) {
      console.log("[api:steam-inventory] no token");
      return NextResponse.json({ ok: false, message: "No token" }, { status: 401 });
    }

    // ✅ decodifica o token
    let payload;
    try {
      payload = await verify(token);
    } catch (e) {
      console.error("[api:steam-inventory] invalid token", e);
      return NextResponse.json({ ok: false, message: "Invalid token" }, { status: 401 });
    }

    const steamId = payload?.sub;
    if (!steamId) {
      console.log("[api:steam-inventory] missing steamId in token");
      return NextResponse.json({ ok: false, message: "Missing steamId" }, { status: 400 });
    }

    console.log("[api:inventory] start steamId=", steamId);

    // Busca inventário Steam diretamente:
    const contexts = [2, 6];
    for (const contextId of contexts) {
      const url = `https://steamcommunity.com/inventory/${steamId}/730/${contextId}?l=english&count=1000`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      if (!res.ok) {
        console.log(`[api:inventory] fail context=${contextId} status=${res.status}`);
        continue;
      }

      const data = await res.json().catch(() => null);
      if (data?.descriptions?.length) {
        return NextResponse.json({ ok: true, items: data.descriptions });
      }
    }

    console.log("[api:inventory] all attempts failed for steamId=", steamId);
    return NextResponse.json({ ok: false, message: "Inventory not available or private" }, { status: 404 });
  } catch (err) {
    console.error("[api:steam-inventory] unexpected error:", err);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}
