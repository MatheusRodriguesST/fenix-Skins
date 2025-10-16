import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const trade_url = (body.trade_url || "").trim();
  if (!trade_url) return NextResponse.json({ ok: false, message: "Missing trade_url" }, { status: 400 });

  const { error } = await supabaseAdmin.from("users").update({ trade_url, updated_at: new Date().toISOString() }).eq("id", user.id);
  if (error) {
    console.error("supabase update trade_url error", error);
    return NextResponse.json({ ok: false, message: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, trade_url });
}
