import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ ok: false, message: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const amount = Number(body.amount);
  if (isNaN(amount) || amount <= 0) return NextResponse.json({ ok: false, message: "Invalid amount" }, { status: 400 });

  // NOTE: this is a simple credit operation — in production use a payment gateway and webhooks to confirm payment
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("balance")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("supabase fetch balance error", error);
    return NextResponse.json({ ok: false, message: "DB error" }, { status: 500 });
  }

  const newBalance = (Number(data.balance ?? 0) + Number(amount)).toFixed(2);
  const upd = await supabaseAdmin.from("users").update({ balance: newBalance, updated_at: new Date().toISOString() }).eq("id", user.id);

  if (upd.error) {
    console.error("supabase update balance error", upd.error);
    return NextResponse.json({ ok: false, message: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, balance: Number(newBalance) });
}
