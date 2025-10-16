// app/api/user/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { verify } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("fenix_token")?.value;
    if (!token) {
      console.log("GET /api/user/me -> no token");
      return NextResponse.json({ ok: false, message: "No token" }, { status: 401 });
    }

    let payload;
    try {
      payload = await verify(token);
    } catch (e) {
      console.error("GET /api/user/me -> verify failed", e);
      return NextResponse.json({ ok: false, message: "Invalid token" }, { status: 401 });
    }

    if (!payload?.sub) {
      console.log("GET /api/user/me -> token missing sub:", payload);
      return NextResponse.json({ ok: false, message: "Invalid token payload" }, { status: 401 });
    }

    const steamId = payload.sub;
    console.log("GET /api/user/me -> steamId:", steamId);

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", steamId)
      .single();

    if (error || !user) {
      console.error("GET /api/user/me -> user not found or db error:", error);
      return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
    }

    const fullUser = { ...user, balance: user.balance ?? 0 };
    return NextResponse.json({ ok: true, user: fullUser });
  } catch (err) {
    console.error("API /user/me error:", err);
    return NextResponse.json({ ok: false, message: "Internal error" }, { status: 500 });
  }
}
