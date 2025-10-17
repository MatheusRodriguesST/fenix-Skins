// src/app/api/user/trade-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer"; // Assumindo que é a factory function
import { getUserFromRequest } from "@/lib/getUserFromRequest";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 403 });
  }

  const { trade_url } = await req.json(); // Assumindo que trade_url vem no body do POST
  if (!trade_url) return NextResponse.json({ ok: false, message: "Missing trade_url" }, { status: 400 });

  try {
    const supabase = supabaseAdmin(); // Chame como função para obter o client
    const { error } = await supabase
      .from("users")
      .update({ trade_url, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("supabase update trade_url error", err);
    return NextResponse.json({ ok: false, message: "DB error" }, { status: 500 });
  }
}